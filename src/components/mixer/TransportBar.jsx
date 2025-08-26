import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, Square, Volume2, Shuffle } from "lucide-react";

export default function TransportBar({ 
  isPlaying, 
  onTogglePlayback, 
  onStop, 
  masterVolume, 
  onMasterVolumeChange,
  tracksCount,
  seed,
  onSeedChange
}) {
  return (
    <div className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 px-4 py-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-3 sm:mb-0">
          {/* Transport Controls */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onTogglePlayback}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 w-12 h-12 rounded-full shadow-lg"
              disabled={tracksCount === 0}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </Button>
            
            <Button
              onClick={onStop}
              variant="outline"
              size="lg" 
              className="border-gray-600 text-gray-300 hover:bg-gray-800 w-12 h-12 rounded-full"
              disabled={!isPlaying}
            >
              <Square className="w-5 h-5" />
            </Button>
          </div>

          {/* Master Volume */}
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <Volume2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #00f5ff 0%, #00f5ff ${masterVolume * 100}%, #374151 ${masterVolume * 100}%, #374151 100%)`
                }}
              />
            </div>
            <span className="text-sm text-gray-400 w-12 flex-shrink-0">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>

          {/* Track Counter */}
          <div className="text-sm text-gray-400 flex-shrink-0 hidden sm:block">
            {tracksCount} {tracksCount === 1 ? 'track' : 'tracks'}
          </div>
        </div>

        {/* Second row for mobile - Seed control */}
        <div className="flex items-center justify-center gap-4 sm:hidden">
          <div className="flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-purple-400" />
            <Input
              type="number"
              value={seed}
              onChange={(e) => onSeedChange(parseInt(e.target.value) || 42)}
              className="bg-gray-900 border-gray-700 text-white w-20 h-8 text-sm"
              min="1"
              max="999999"
            />
            <span className="text-xs text-gray-400">seed</span>
          </div>
          
          <div className="text-sm text-gray-400">
            {tracksCount} {tracksCount === 1 ? 'track' : 'tracks'}
          </div>
        </div>

        {/* Desktop seed control */}
        <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2">
          <Shuffle className="w-4 h-4 text-purple-400" />
          <Input
            type="number"
            value={seed}
            onChange={(e) => onSeedChange(parseInt(e.target.value) || 42)}
            className="bg-gray-900 border-gray-700 text-white w-20 h-8 text-sm"
            min="1"
            max="999999"
          />
          <span className="text-xs text-gray-400">seed</span>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #00f5ff;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #00f5ff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
        }
      `}</style>
    </div>
  );
}