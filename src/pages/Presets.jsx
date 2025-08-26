import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Preset } from "@/api/entities";
import { Play, Download, Trash2, Copy, Clock, Volume2 } from "lucide-react";
import { format } from "date-fns";

export default function PresetsPage() {
  const [presets, setPresets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const data = await Preset.list("-created_date");
      setPresets(data);
    } catch (error) {
      console.error("Error loading presets:", error);
    }
    setIsLoading(false);
  };

  const deletePreset = async (presetId) => {
    try {
      await Preset.delete(presetId);
      setPresets(prev => prev.filter(p => p.id !== presetId));
    } catch (error) {
      console.error("Error deleting preset:", error);
    }
  };

  const copyPreset = async (preset) => {
    try {
      const copy = {
        ...preset,
        name: `${preset.name} (Copy)`,
        seed: Math.floor(Math.random() * 1000000)
      };
      delete copy.id;
      delete copy.created_date;
      delete copy.updated_date;
      delete copy.created_by;
      
      await Preset.create(copy);
      loadPresets();
    } catch (error) {
      console.error("Error copying preset:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Saved Presets
          </h1>
          <p className="text-gray-400">
            Your collection of soundscape configurations
          </p>
        </div>

        {presets.length === 0 ? (
          <Card className="bg-gray-950/30 border-gray-800 border-dashed">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <Volume2 className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Presets Saved</h3>
              <p className="text-gray-500">Create your first soundscape in the mixer to save presets</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {presets.map((preset) => (
              <Card key={preset.id} className="bg-gray-950/50 border-gray-800 hover:border-gray-700 transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-white text-xl mb-2">{preset.name}</CardTitle>
                      {preset.description && (
                        <p className="text-gray-400 text-sm mb-3">{preset.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {preset.duration_minutes}min
                        </Badge>
                        <Badge variant="outline" className="border-purple-500 text-purple-400">
                          {preset.tracks?.length || 0} tracks
                        </Badge>
                        <Badge variant="outline" className="border-gray-500 text-gray-400">
                          Seed: {preset.seed}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyPreset(preset)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Copy className="w-4 h-4" />
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
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500">
                      Created {format(new Date(preset.created_date), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                    
                    {preset.tracks && preset.tracks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Tracks:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {preset.tracks.map((track, index) => (
                            <div key={index} className="bg-gray-900/50 rounded-md p-2 text-sm">
                              <div className="text-white font-medium truncate">{track.name}</div>
                              <div className="text-gray-400 text-xs">
                                Vol: {Math.round((track.volume || 0) * 100)}% 
                                {track.pan !== 0 && ` • Pan: ${track.pan > 0 ? 'R' : 'L'}${Math.abs(Math.round((track.pan || 0) * 100))}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Load in Mixer
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500 text-green-400 hover:bg-green-500/20"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}