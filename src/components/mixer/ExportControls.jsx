
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Clock, FileAudio, AudioLines } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ExportControls({ 
  tracks, 
  masterVolume, 
  duration, 
  seed, 
  onDurationChange,
  audioBuffers,
  audioContext,
  isExporting,
  setIsExporting
}) {
  const [exportProgress, setExportProgress] = useState(0);

  const seededRandom = (seed, index) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };

  const exportWAV = async () => {
    if (!audioContext || isExporting) return;
    
    setIsExporting(true);
    setExportProgress(0);

    try {
      const sampleRate = 44100;
      const channels = 2;
      const length = duration * 60 * sampleRate;
      
      // Create offline context for rendering
      const offlineContext = new OfflineAudioContext(channels, length, sampleRate);
      const masterGain = offlineContext.createGain();
      masterGain.gain.value = masterVolume;
      masterGain.connect(offlineContext.destination);

      // Filter active tracks
      const soloTracks = tracks.filter(track => track.solo && !track.muted);
      const activeTracks = soloTracks.length > 0 ? soloTracks : tracks.filter(track => !track.muted);

      // Add each track to offline context
      activeTracks.forEach((track, index) => {
        const audioBuffer = audioBuffers[track.bufferId];
        if (!audioBuffer) return;

        const source = offlineContext.createBufferSource();
        const gainNode = offlineContext.createGain();
        const panNode = offlineContext.createStereoPanner();

        source.buffer = audioBuffer;
        source.loop = track.loop;

        // Apply seeded randomization
        const randomVolume = track.volume + (seededRandom(seed, index * 3) - 0.5) * track.randomization.volume;
        const randomPan = track.pan + (seededRandom(seed, index * 3 + 1) - 0.5) * track.randomization.pan;

        gainNode.gain.value = Math.max(0, Math.min(1, randomVolume));
        panNode.pan.value = Math.max(-1, Math.min(1, randomPan));

        source.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(masterGain);

        source.start(0);
      });

      // Simulate progress during rendering
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(90, prev + 10));
      }, 200);

      // Render the audio
      const renderedBuffer = await offlineContext.startRendering();
      
      clearInterval(progressInterval);
      setExportProgress(95);

      // Convert to WAV
      const wavBlob = audioBufferToWav(renderedBuffer);
      
      setExportProgress(100);

      // Download the file
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soundscape_${seed}_${duration}min.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${duration}-minute soundscape as WAV`);
      
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export audio. Please try again.");
    }

    setIsExporting(false);
    setExportProgress(0);
  };

  const audioBufferToWav = (buffer) => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert float32 to int16
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const exportMP3 = () => {
    toast.error("MP3 export requires additional audio encoding libraries. WAV export is recommended.");
  };

  const activeTracks = tracks.filter(track => !track.muted);
  const estimatedSize = Math.round(duration * 60 * 0.176); // Rough WAV size estimate in MB

  return (
    <Card className="bg-gray-950/50 border-gray-800 mb-6">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AudioLines className="w-5 h-5 text-green-400" />
          Export Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duration and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-gray-300 mb-2 block">Duration (minutes)</Label>
            <Input
              type="number"
              min="1"
              max="120"
              value={duration}
              onChange={(e) => onDurationChange(parseInt(e.target.value) || 30)}
              className="bg-gray-900 border-gray-700 text-white"
            />
            <div className="flex gap-2 mt-2">
              {[10, 30, 60].map(min => (
                <Button
                  key={min}
                  size="sm"
                  variant="outline"
                  onClick={() => onDurationChange(min)}
                  className={`border-gray-600 text-xs ${duration === min ? 'bg-cyan-500/20 border-cyan-400' : ''}`}
                >
                  {min}m
                </Button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{activeTracks.length}</div>
            <div className="text-xs text-gray-400">Active Tracks</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{seed}</div>
            <div className="text-xs text-gray-400">Random Seed</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{estimatedSize}MB</div>
            <div className="text-xs text-gray-400">Est. WAV Size</div>
          </div>
        </div>

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Rendering audio...</span>
              <span className="text-sm text-gray-400">{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
          </div>
        )}

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-800">
          <Button
            onClick={exportWAV}
            disabled={activeTracks.length === 0 || isExporting}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export WAV'}
          </Button>
          
          <Button
            onClick={exportMP3}
            disabled={activeTracks.length === 0 || isExporting}
            variant="outline"
            className="border-green-500 text-green-400 hover:bg-green-500/20"
          >
            <FileAudio className="w-4 h-4 mr-2" />
            Export MP3
          </Button>

          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-yellow-500 text-yellow-400">
              <Clock className="w-3 h-3 mr-1" />
              Seamless Loop
            </Badge>
            <Badge variant="outline" className="border-purple-500 text-purple-400">
              44.1kHz • 16-bit
            </Badge>
          </div>
        </div>

        {/* Export Info */}
        <div className="text-xs text-gray-500 bg-gray-900/50 rounded p-3">
          <strong>Export Info:</strong> The WAV file will loop seamlessly using the same seed for reproducible randomization. 
          All active tracks will be mixed down to stereo with their current volume, pan, and randomization settings applied.
        </div>
      </CardContent>
    </Card>
  );
}
