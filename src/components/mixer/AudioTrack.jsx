import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Volume2, 
  VolumeX, 
  Headphones, 
  X, 
  Settings2,
  Music
} from "lucide-react";

export default function AudioTrack({ track, isPlaying, onUpdate, onRemove }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateField = (field, value) => {
    onUpdate(track.id, { [field]: value });
  };

  const updateRandomization = (field, value) => {
    onUpdate(track.id, {
      randomization: { ...track.randomization, [field]: value }
    });
  };

  return (
    <Card className="bg-gray-950/70 border-gray-800 hover:border-gray-700 transition-all duration-300">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isPlaying && !track.muted ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'
                }`} 
              />
              <Music className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{track.name}</h3>
              <p className="text-xs text-gray-400">
                {formatDuration(track.duration)}
                {track.loop && " • Loop"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={track.muted ? "default" : "outline"}
              onClick={() => updateField('muted', !track.muted)}
              className={`w-8 h-8 p-0 ${
                track.muted 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "border-gray-600 hover:bg-gray-800"
              }`}
            >
              {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <Button
              size="sm"
              variant={track.solo ? "default" : "outline"}
              onClick={() => updateField('solo', !track.solo)}
              className={`w-8 h-8 p-0 ${
                track.solo 
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                  : "border-gray-600 hover:bg-gray-800"
              }`}
            >
              <Headphones className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`w-8 h-8 p-0 border-gray-600 hover:bg-gray-800 ${
                showAdvanced ? 'bg-gray-800' : ''
              }`}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRemove(track.id)}
              className="w-8 h-8 p-0 border-red-600 text-red-400 hover:bg-red-600/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Volume */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Volume</span>
              <span className="text-sm text-gray-400">{Math.round(track.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={track.volume}
              onChange={(e) => updateField('volume', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #00f5ff 0%, #00f5ff ${track.volume * 100}%, #374151 ${track.volume * 100}%, #374151 100%)`
              }}
            />
          </div>
          
          {/* Pan */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Pan</span>
              <span className="text-sm text-gray-400">
                {track.pan === 0 ? 'C' : track.pan > 0 ? `R${Math.round(track.pan * 100)}` : `L${Math.round(Math.abs(track.pan) * 100)}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-4">L</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={track.pan}
                onChange={(e) => updateField('pan', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #b444ff 0%, #b444ff 50%, #374151 50%, #374151 100%)`
                }}
              />
              <span className="text-xs text-gray-500 w-4">R</span>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="border-t border-gray-800 pt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                Randomization
                <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">
                  Natural Variation
                </Badge>
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Volume</span>
                    <span className="text-xs text-gray-500">±{Math.round(track.randomization.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={track.randomization.volume}
                    onChange={(e) => updateRandomization('volume', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Timing</span>
                    <span className="text-xs text-gray-500">±{Math.round(track.randomization.timing * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.2"
                    step="0.01"
                    value={track.randomization.timing}
                    onChange={(e) => updateRandomization('timing', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Pan</span>
                    <span className="text-xs text-gray-500">±{Math.round(track.randomization.pan * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={track.randomization.pan}
                    onChange={(e) => updateRandomization('pan', parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={track.loop}
                  onChange={(e) => updateField('loop', e.target.checked)}
                  className="rounded border-gray-600 text-cyan-400 focus:ring-cyan-500"
                />
                Loop track
              </label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}