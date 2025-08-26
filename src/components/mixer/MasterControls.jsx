import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Download, FileText } from "lucide-react";

export default function MasterControls({ duration, setDuration, tracks }) {
  const totalTracks = tracks.length;
  const activeTracks = tracks.filter(t => !t.muted).length;
  const averageVolume = tracks.reduce((sum, t) => sum + (t.muted ? 0 : t.volume), 0) / activeTracks || 0;

  const generateAttribution = () => {
    const attributions = tracks
      .filter(track => track.attribution && track.attribution.trim())
      .map(track => `${track.name}: ${track.attribution}`);

    if (attributions.length === 0) {
      alert("No attribution information to generate.");
      return;
    }

    const content = `Soundscape Attribution\n\nGenerated: ${new Date().toISOString()}\nDuration: ${duration} minutes\n\nTrack Attributions:\n${attributions.join('\n')}\n\nThis soundscape was created with Soundscape Mixer.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soundscape_attribution.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-gray-950/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Export Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duration Control */}
        <div>
          <Label className="text-gray-300 mb-2 block">Export Duration (minutes)</Label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="1"
              max="120"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="bg-gray-900 border-gray-700 text-white max-w-24"
            />
            <div className="flex gap-2">
              {[10, 30, 60].map(min => (
                <Button
                  key={min}
                  size="sm"
                  variant="outline"
                  onClick={() => setDuration(min)}
                  className={`border-gray-600 ${duration === min ? 'bg-cyan-500/20 border-cyan-400' : ''}`}
                >
                  {min}m
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{totalTracks}</div>
            <div className="text-xs text-gray-400">Total Tracks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{activeTracks}</div>
            <div className="text-xs text-gray-400">Active Tracks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {Math.round(averageVolume * 100)}%
            </div>
            <div className="text-xs text-gray-400">Avg Volume</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">
              {Math.round(duration * 60 / 1024 * totalTracks)}MB
            </div>
            <div className="text-xs text-gray-400">Est. Size</div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-800">
          <Button
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            disabled={activeTracks === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export WAV
          </Button>
          
          <Button
            variant="outline"
            className="border-green-500 text-green-400 hover:bg-green-500/20"
            disabled={activeTracks === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export MP3
          </Button>

          <Button
            variant="outline"
            onClick={generateAttribution}
            className="border-gray-500 text-gray-300 hover:bg-gray-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Attribution
          </Button>
        </div>

        {/* Note about limitations */}
        <div className="text-xs text-gray-500 bg-gray-900/50 rounded p-3">
          <strong>Note:</strong> This is a prototype interface. Full export functionality requires additional 
          browser permissions or desktop software for seamless loop creation and local file saving.
        </div>
      </CardContent>
    </Card>
  );
}