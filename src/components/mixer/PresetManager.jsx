
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Trash2, Download, Upload, Music, Plus, Shuffle } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { Preset } from "@/api/entities";

export default function PresetManager({ open, onOpenChange, tracks, masterVolume, seed, duration, onLoadPreset }) {
  const [presets, setPresets] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadPresets();
    }
  }, [open]);

  const loadPresets = async () => {
    setIsLoading(true);
    try {
      const data = await Preset.list("-created_date");
      setPresets(data);
    } catch (error) {
      console.error("Error loading presets:", error);
      toast.error("Failed to load presets");
    }
    setIsLoading(false);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }

    if (tracks.length === 0) {
      toast.error("No tracks to save");
      return;
    }

    try {
      await Preset.create({
        name: presetName.trim(),
        description: presetDescription.trim(),
        seed,
        master_volume: masterVolume,
        duration_minutes: duration,
        tracks: tracks.map(track => ({
          name: track.name,
          fileName: track.fileName,
          duration: track.duration,
          volume: track.volume,
          pan: track.pan,
          muted: track.muted,
          solo: track.solo,
          loop: track.loop,
          randomization: track.randomization
        }))
      });

      await loadPresets(); // Reload to show new preset
      setPresetName("");
      setPresetDescription("");
      setShowSaveDialog(false);
      toast.success("Preset saved successfully");
    } catch (error) {
      console.error("Error saving preset:", error);
      toast.error("Failed to save preset");
    }
  };

  const deletePreset = async (presetId) => {
    try {
      await Preset.delete(presetId);
      await loadPresets(); // Reload list
      toast.success("Preset deleted");
    } catch (error) {
      console.error("Error deleting preset:", error);
      toast.error("Failed to delete preset");
    }
  };

  const exportPreset = (preset) => {
    try {
      const dataStr = JSON.stringify(preset, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${preset.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Preset exported");
    } catch (error) {
      toast.error("Failed to export preset");
    }
  };

  const importPreset = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      toast.error("Please select a JSON preset file (.json)");
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      
      // Check if the content looks like JSON (starts with { and ends with })
      const trimmedText = text.trim();
      if (!trimmedText.startsWith('{') || !trimmedText.endsWith('}')) {
        throw new Error("File doesn't contain valid JSON data");
      }

      const presetData = JSON.parse(text);
      
      // Validate basic preset structure
      if (!presetData.name) {
        throw new Error("Invalid preset format - missing name field");
      }

      if (!presetData.tracks || !Array.isArray(presetData.tracks)) {
        throw new Error("Invalid preset format - missing or invalid tracks field");
      }

      await Preset.create({
        ...presetData,
        name: `${presetData.name} (Imported)`,
        id: undefined, // Remove existing ID
        created_date: undefined,
        updated_date: undefined,
        created_by: undefined
      });

      await loadPresets();
      toast.success("Preset imported successfully");
    } catch (error) {
      console.error("Error importing preset:", error);
      
      if (error.message.includes("Unexpected token")) {
        toast.error("Invalid file format. Please select a JSON preset file, not an audio file.");
      } else {
        toast.error(`Failed to import preset: ${error.message}`);
      }
    }

    event.target.value = ''; // Reset input
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Save className="w-5 h-5 text-cyan-400" />
                Preset Manager
              </span>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={importPreset}
                  className="hidden"
                  id="import-preset"
                />
                <Button
                  onClick={() => document.getElementById('import-preset').click()}
                  variant="outline"
                  className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button
                  onClick={() => setShowSaveDialog(true)}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  disabled={tracks.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Save Current
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading presets...</p>
              </div>
            ) : presets.length === 0 ? (
              <div className="text-center py-12">
                <Save className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Presets Saved</h3>
                <p className="text-gray-500">Save your first soundscape configuration</p>
              </div>
            ) : (
              <div className="space-y-4">
                {presets.map((preset) => (
                  <div key={preset.id} className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{preset.name}</h3>
                        {preset.description && (
                          <p className="text-sm text-gray-400 mb-2">{preset.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                            <Music className="w-3 h-3 mr-1" />
                            {preset.tracks?.length || 0} tracks
                          </Badge>
                          <Badge variant="outline" className="border-purple-500 text-purple-400">
                            <Shuffle className="w-3 h-3 mr-1" />
                            Seed: {preset.seed}
                          </Badge>
                          <Badge variant="outline" className="border-green-500 text-green-400">
                            {preset.duration_minutes}min
                          </Badge>
                          <Badge variant="outline" className="border-gray-500 text-gray-400">
                            Vol: {Math.round((preset.master_volume || 0.8) * 100)}%
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => onLoadPreset(preset)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportPreset(preset)}
                          className="border-green-600 text-green-400 hover:bg-green-600/20"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deletePreset(preset.id)}
                          className="border-red-600 text-red-400 hover:bg-red-600/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      Created {format(new Date(preset.created_date), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                    
                    {preset.tracks && preset.tracks.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {preset.tracks.slice(0, 6).map((track, index) => (
                          <div key={index} className="bg-gray-950 rounded px-2 py-1 text-xs">
                            <div className="text-white font-medium truncate">{track.name}</div>
                            <div className="text-gray-400">
                              Vol: {Math.round((track.volume || 0) * 100)}%
                              {track.pan !== 0 && ` • Pan: ${track.pan > 0 ? 'R' : 'L'}${Math.abs(Math.round((track.pan || 0) * 100))}`}
                              {track.muted && ' • Muted'}
                            </div>
                          </div>
                        ))}
                        {preset.tracks.length > 6 && (
                          <div className="bg-gray-950 rounded px-2 py-1 text-xs text-gray-400 flex items-center justify-center">
                            +{preset.tracks.length - 6} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Save Soundscape Preset</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="preset-name" className="text-gray-300">Preset Name</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g., Forest Rain Ambience"
                className="bg-gray-900 border-gray-700 text-white mt-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSavePreset()}
              />
            </div>
            
            <div>
              <Label htmlFor="preset-description" className="text-gray-300">Description (optional)</Label>
              <Textarea
                id="preset-description"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="Describe your soundscape..."
                className="bg-gray-900 border-gray-700 text-white mt-1 h-20"
              />
            </div>

            <div className="bg-gray-900 rounded p-3">
              <div className="text-sm text-gray-400 mb-2">This preset will include:</div>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• {tracks.length} audio tracks with their settings</li>
                <li>• Master volume: {Math.round(masterVolume * 100)}%</li>
                <li>• Random seed: {seed}</li>
                <li>• Duration: {duration} minutes</li>
                <li>• All volume, pan, and randomization settings</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Preset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
