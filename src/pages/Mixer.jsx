import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Square, Upload, Save, RotateCcw, FolderOpen } from "lucide-react";
import { toast } from "react-hot-toast";
import { Toaster } from "react-hot-toast";

import AudioTrack from "../components/mixer/AudioTrack";
import TransportBar from "../components/mixer/TransportBar";
import PresetManager from "../components/mixer/PresetManager";
import FileDropZone from "../components/mixer/FileDropZone";
import ExportControls from "../components/mixer/ExportControls";

export default function MixerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [dragActive, setDragActive] = useState(false);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [duration, setDuration] = useState(30);
  const [seed, setSeed] = useState(42);
  const [isExporting, setIsExporting] = useState(false);

  // Audio Context and Nodes
  const audioContextRef = useRef(null);
  const masterGainNodeRef = useRef(null);
  const trackNodesRef = useRef({});
  const audioBuffersRef = useRef({});

  // Initialize AudioContext with error handling
  useEffect(() => {
    const initAudioContext = () => {
      try {
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextClass) {
            toast.error("Your browser doesn't support Web Audio API");
            return;
          }
          
          audioContextRef.current = new AudioContextClass();
          masterGainNodeRef.current = audioContextRef.current.createGain();
          masterGainNodeRef.current.connect(audioContextRef.current.destination);
          masterGainNodeRef.current.gain.value = masterVolume;
        }
      } catch (error) {
        console.error("Failed to initialize AudioContext:", error);
        toast.error("Failed to initialize audio system");
      }
    };

    initAudioContext();

    // Cleanup on unmount
    return () => {
      stopPlayback();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update master volume
  useEffect(() => {
    if (masterGainNodeRef.current) {
      masterGainNodeRef.current.gain.setValueAtTime(masterVolume, audioContextRef.current?.currentTime || 0);
    }
  }, [masterVolume]);

  const resumeAudioContext = async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.error("Failed to resume AudioContext:", error);
        toast.error("Failed to start audio playback");
      }
    }
  };

  const addFiles = async (files) => {
    if (!files || files.length === 0) {
      toast.error("No files selected");
      return;
    }

    if (!audioContextRef.current) {
      toast.error("Audio system not initialized");
      return;
    }

    await resumeAudioContext();

    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || 
      file.name.match(/\.(mp3|wav|ogg|m4a|flac|aac|opus)$/i)
    );

    if (audioFiles.length === 0) {
      toast.error("No audio files found. Please select audio files (.mp3, .wav, .ogg, etc.)");
      return;
    }

    const loadingToast = toast.loading(`Loading ${audioFiles.length} audio file(s)...`);
    let successCount = 0;

    try {
      for (const file of audioFiles) {
        try {
          // Read file data immediately to avoid permission issues
          const arrayBuffer = await file.arrayBuffer();
          const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

          const trackId = Date.now() + Math.random();
          const bufferId = `buffer_${trackId}`;
          
          // Store the decoded audio buffer
          audioBuffersRef.current[bufferId] = audioBuffer;
          
          const newTrack = {
            id: trackId,
            bufferId,
            name: file.name.replace(/\.[^/.]+$/, ""),
            fileName: file.name,
            duration: audioBuffer.duration,
            volume: 0.7,
            pan: 0,
            muted: false,
            solo: false,
            loop: true,
            randomization: {
              volume: 0.1,
              timing: 0.05,
              pan: 0.1
            }
          };

          setTracks(prev => [...prev, newTrack]);
          successCount++;
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`Failed to decode ${file.name}`);
        }
      }
      
      toast.dismiss(loadingToast);
      if (successCount > 0) {
        toast.success(`Added ${successCount} audio track(s)`);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to load audio files");
      console.error("File loading error:", error);
    }
  };

  const handleFileUpload = (event) => {
    addFiles(event.target.files);
    event.target.value = ''; // Reset input
  };

  const handleDirectoryUpload = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await window.showDirectoryPicker();
        const files = [];
        
        const getAllFiles = async (handle) => {
          for await (const [name, childHandle] of handle) {
            if (childHandle.kind === 'file') {
              const file = await childHandle.getFile();
              if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|flac|aac|opus)$/i)) {
                files.push(file);
              }
            } else if (childHandle.kind === 'directory') {
              await getAllFiles(childHandle);
            }
          }
        };

        await getAllFiles(dirHandle);
        await addFiles(files);
      } else {
        toast.error("Directory picker not supported. Use 'Add Audio' instead.");
        document.getElementById('file-upload').click();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error("Failed to access directory");
        console.error("Directory access error:", error);
      }
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = [];
    
    // Handle directory drops
    if (e.dataTransfer.items) {
      const items = Array.from(e.dataTransfer.items);
      for (const item of items) {
        if (item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            await processEntry(entry, files);
          }
        } else if (item.getAsFile) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
    } else {
      files.push(...Array.from(e.dataTransfer.files));
    }

    await addFiles(files);
  }, []);

  const processEntry = async (entry, files) => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file) => {
          if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|flac|aac|opus)$/i)) {
            files.push(file);
          }
          resolve();
        });
      });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      return new Promise((resolve) => {
        reader.readEntries(async (entries) => {
          for (const childEntry of entries) {
            await processEntry(childEntry, files);
          }
          resolve();
        });
      });
    }
  };

  // Seeded random number generator for reproducible mixes
  const seededRandom = (seed, index) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };

  const startPlayback = async () => {
    await resumeAudioContext();
    
    const soloTracks = tracks.filter(track => track.solo && !track.muted);
    const tracksToPlay = soloTracks.length > 0 ? soloTracks : tracks.filter(track => !track.muted);

    tracksToPlay.forEach((track, index) => {
      const audioBuffer = audioBuffersRef.current[track.bufferId];
      if (!audioBuffer) return;

      try {
        const source = audioContextRef.current.createBufferSource();
        const gainNode = audioContextRef.current.createGain();
        const panNode = audioContextRef.current.createStereoPanner();

        source.buffer = audioBuffer;
        source.loop = track.loop;

        // Apply seeded randomization for reproducible mixes
        const randomVolume = track.volume + (seededRandom(seed, index * 3) - 0.5) * track.randomization.volume;
        const randomPan = track.pan + (seededRandom(seed, index * 3 + 1) - 0.5) * track.randomization.pan;

        gainNode.gain.value = Math.max(0, Math.min(1, randomVolume));
        panNode.pan.value = Math.max(-1, Math.min(1, randomPan));

        source.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(masterGainNodeRef.current);

        source.start(0);
        
        trackNodesRef.current[track.id] = { source, gainNode, panNode };
      } catch (error) {
        console.error("Error starting playback for track:", error);
        toast.error(`Failed to play ${track.name}`);
      }
    });
  };

  const stopPlayback = () => {
    Object.values(trackNodesRef.current).forEach(({ source }) => {
      try {
        source.stop();
      } catch (error) {
        // Source might already be stopped
      }
    });
    trackNodesRef.current = {};
  };

  const togglePlayback = async () => {
    if (tracks.length === 0) {
      toast.error("No audio tracks loaded");
      return;
    }

    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
    } else {
      await startPlayback();
      setIsPlaying(true);
    }
  };

  const updateTrack = (trackId, updates) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    ));

    // Update real-time audio if playing
    if (isPlaying && trackNodesRef.current[trackId]) {
      const nodes = trackNodesRef.current[trackId];
      const trackIndex = tracks.findIndex(t => t.id === trackId);
      
      if (updates.volume !== undefined) {
        const randomVolume = updates.volume + (seededRandom(seed, trackIndex * 3) - 0.5) * (updates.randomization?.volume || 0.1);
        nodes.gainNode.gain.setValueAtTime(
          Math.max(0, Math.min(1, randomVolume)), 
          audioContextRef.current.currentTime
        );
      }
      
      if (updates.pan !== undefined) {
        const randomPan = updates.pan + (seededRandom(seed, trackIndex * 3 + 1) - 0.5) * (updates.randomization?.pan || 0.1);
        nodes.panNode.pan.setValueAtTime(
          Math.max(-1, Math.min(1, randomPan)), 
          audioContextRef.current.currentTime
        );
      }
    }
  };

  const removeTrack = (trackId) => {
    setTracks(prev => prev.filter(track => track.id !== trackId));
    
    // Clean up audio nodes
    if (trackNodesRef.current[trackId]) {
      try {
        trackNodesRef.current[trackId].source.stop();
      } catch (error) {
        // Ignore if already stopped
      }
      delete trackNodesRef.current[trackId];
    }

    // Clean up audio buffer
    const track = tracks.find(t => t.id === trackId);
    if (track && audioBuffersRef.current[track.bufferId]) {
      delete audioBuffersRef.current[track.bufferId];
    }
  };

  const resetMixer = () => {
    stopPlayback();
    setIsPlaying(false);
    setTracks([]);
    setMasterVolume(0.8);
    setSeed(42);
    setDuration(30);
    trackNodesRef.current = {};
    audioBuffersRef.current = {};
    toast.success("Mixer reset");
  };

  const loadPreset = (preset) => {
    try {
      resetMixer();
      setMasterVolume(preset.master_volume || 0.8);
      setSeed(preset.seed || 42);
      setDuration(preset.duration_minutes || 30);
      
      // Note: Files will need to be re-added manually
      toast.success(`Loaded preset "${preset.name}" settings. Add your audio files to complete the setup.`);
    } catch (error) {
      toast.error("Failed to load preset");
      console.error("Preset loading error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Sticky Transport Bar - Mobile First */}
      <TransportBar
        isPlaying={isPlaying}
        onTogglePlayback={togglePlayback}
        onStop={() => { stopPlayback(); setIsPlaying(false); }}
        masterVolume={masterVolume}
        onMasterVolumeChange={setMasterVolume}
        tracksCount={tracks.length}
        seed={seed}
        onSeedChange={setSeed}
      />

      <div className="px-4 sm:px-6 lg:px-8 pb-6">
        <div className="max-w-6xl mx-auto">
          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 pt-4">
            <input
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            
            <Button
              onClick={() => document.getElementById('file-upload').click()}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 flex-1 sm:flex-none"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Audio
            </Button>

            <Button
              onClick={handleDirectoryUpload}
              variant="outline"
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20 flex-1 sm:flex-none"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Upload Folder
            </Button>

            <Button
              onClick={() => setShowPresetManager(true)}
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/20 flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4 mr-2" />
              Presets
            </Button>

            <Button
              onClick={resetMixer}
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-500/20 flex-1 sm:flex-none"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Tracks or Drop Zone */}
          {tracks.length === 0 ? (
            <FileDropZone
              dragActive={dragActive}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onFileUpload={() => document.getElementById('file-upload').click()}
            />
          ) : (
            <div
              className="space-y-4 mb-6"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {dragActive && (
                <div className="fixed inset-0 bg-cyan-500/20 border-2 border-dashed border-cyan-400 rounded-lg z-50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Upload className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
                    <p className="text-xl font-bold">Drop audio files here</p>
                  </div>
                </div>
              )}

              {tracks.map((track) => (
                <AudioTrack
                  key={track.id}
                  track={track}
                  isPlaying={isPlaying}
                  onUpdate={updateTrack}
                  onRemove={removeTrack}
                />
              ))}
            </div>
          )}

          {/* Export Controls */}
          {tracks.length > 0 && (
            <ExportControls
              tracks={tracks}
              masterVolume={masterVolume}
              duration={duration}
              seed={seed}
              onDurationChange={setDuration}
              audioBuffers={audioBuffersRef.current}
              audioContext={audioContextRef.current}
              isExporting={isExporting}
              setIsExporting={setIsExporting}
            />
          )}
        </div>
      </div>

      <PresetManager
        open={showPresetManager}
        onOpenChange={setShowPresetManager}
        tracks={tracks}
        masterVolume={masterVolume}
        seed={seed}
        duration={duration}
        onLoadPreset={loadPreset}
      />
    </div>
  );
}