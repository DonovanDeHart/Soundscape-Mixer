
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Music, Settings, Save, Upload } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <style>{`
        :root {
          --neon-cyan: #00f5ff;
          --neon-purple: #b444ff;
          --neon-green: #39ff14;
          --dark-bg: #0a0a0a;
          --darker-bg: #050505;
        }
        
        .neon-glow {
          box-shadow: 0 0 10px var(--neon-cyan);
        }
        
        .track-glow {
          box-shadow: inset 0 0 20px rgba(0, 245, 255, 0.1);
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Soundscape Mixer</h1>
                <p className="text-sm text-gray-400">Professional Audio Layering</p>
              </div>
            </div>

            <nav className="flex items-center gap-6">
              <Link 
                to={createPageUrl("Mixer")} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  location.pathname === createPageUrl("Mixer") 
                    ? 'bg-cyan-400/20 text-cyan-400' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Music className="w-4 h-4" />
                Mixer
              </Link>
              <Link 
                to={createPageUrl("Presets")} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  location.pathname === createPageUrl("Presets") 
                    ? 'bg-cyan-400/20 text-cyan-400' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Save className="w-4 h-4" />
                Presets
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
