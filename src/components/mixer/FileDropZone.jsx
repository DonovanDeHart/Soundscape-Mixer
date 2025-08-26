import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FolderOpen, Music } from "lucide-react";

export default function FileDropZone({ 
  dragActive, 
  onDragEnter, 
  onDragLeave, 
  onDragOver, 
  onDrop, 
  onFileUpload 
}) {
  const hasDirectoryAPI = 'showDirectoryPicker' in window;

  return (
    <Card 
      className={`border-2 border-dashed transition-all duration-300 ${
        dragActive 
          ? "border-cyan-400 bg-cyan-400/10 scale-105" 
          : "border-gray-700 hover:border-gray-600"
      }`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
          <Music className="w-8 h-8 text-cyan-400" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3">
          {dragActive ? "Drop your audio files here" : "Start Your Soundscape"}
        </h3>
        
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Upload individual audio files or drag & drop {hasDirectoryAPI ? "files and folders" : "files"} 
          to create layered ambient soundscapes
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
          <Button
            onClick={onFileUpload}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Files
          </Button>
          
          {hasDirectoryAPI && (
            <Button
              onClick={() => document.querySelector('[data-directory-picker]')?.click()}
              variant="outline"
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
              data-directory-picker
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Select Folder
            </Button>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Supported: MP3, WAV, OGG, M4A, FLAC, AAC</p>
          <p className="mt-1">
            {hasDirectoryAPI 
              ? "Drag files, folders, or click to browse" 
              : "Drag files or click to browse"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}