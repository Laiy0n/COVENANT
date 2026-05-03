import React, { useState } from 'react';
import { ArrowLeft, Volume2, Monitor, Gamepad2 } from 'lucide-react';

export default function SettingsPanel({ settings, onChange, onBack }) {
  const [activeTab, setActiveTab] = useState('controls');

  const tabs = [
    { id: 'controls', label: 'CONTROLS', icon: Gamepad2 },
    { id: 'audio', label: 'AUDIO', icon: Volume2 },
    { id: 'video', label: 'VIDEO', icon: Monitor },
  ];

  return (
    <div className="menu-bg" data-testid="settings-panel">
      <div className="scanlines" />
      <div className="menu-content min-h-screen p-8 md:p-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={onBack}
            data-testid="settings-back-btn"
            className="text-[#8B93A6] hover:text-[#00E5FF] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight uppercase font-['Rajdhani'] text-white">
              SYSTEMS CONFIG
            </h2>
            <p className="text-xs font-mono text-[#4B5365] tracking-wider">SETTINGS</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              data-testid={`settings-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all duration-200 border ${
                activeTab === tab.id 
                  ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/5' 
                  : 'border-white/10 text-[#8B93A6] hover:border-white/30'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 max-w-2xl">
          {activeTab === 'controls' && (
            <div className="space-y-6">
              <h3 className="text-lg font-['Rajdhani'] font-semibold uppercase text-white">Control Bindings</h3>
              <div className="space-y-3">
                {[
                  { action: 'MOVE FORWARD', key: 'W' },
                  { action: 'MOVE BACKWARD', key: 'S' },
                  { action: 'MOVE LEFT', key: 'A' },
                  { action: 'MOVE RIGHT', key: 'D' },
                  { action: 'SHOOT', key: 'LEFT CLICK' },
                  { action: 'RELOAD', key: 'R' },
                  { action: 'SPRINT', key: 'SHIFT' },
                  { action: 'UNLOCK CURSOR', key: 'ESC' },
                ].map(binding => (
                  <div key={binding.action} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-sm font-mono text-[#8B93A6]">{binding.action}</span>
                    <span className="text-sm font-['Rajdhani'] font-semibold text-[#00E5FF] bg-[#12141C] px-3 py-1 border border-white/10">
                      {binding.key}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Sensitivity */}
              <div className="pt-4">
                <label className="text-xs font-mono text-[#8B93A6] uppercase tracking-widest block mb-3">
                  SENS MULTIPLIER: {Math.round(settings.sensMult * 100)}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={Math.round(settings.sensMult * 100)}
                  onChange={(e) => onChange({ sensMult: parseFloat(e.target.value) / 100 })}
                  data-testid="sensitivity-slider"
                  className="w-full h-1 bg-[#12141C] appearance-none cursor-pointer accent-[#00E5FF]"
                />
              </div>
            </div>
          )}

{activeTab === 'audio' && (
            <div className="space-y-6">
              <h3 className="text-lg font-['Rajdhani'] font-semibold uppercase text-white">Audio Settings</h3>
              <p className="text-xs font-mono text-[#4B5365]">
                Audio system not yet implemented in prototype.
              </p>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-6">
              <h3 className="text-lg font-['Rajdhani'] font-semibold uppercase text-white">Video Settings</h3>
              <div className="pt-4">
                <label className="text-xs font-mono text-[#8B93A6] uppercase tracking-widest block mb-3">
                  BRIGHTNESS: {(settings.brightness * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={settings.brightness}
                  onChange={(e) => onChange({ brightness: parseFloat(e.target.value) })}
                  data-testid="brightness-slider"
                  className="w-full h-1 bg-[#12141C] appearance-none cursor-pointer accent-[#00E5FF]"
                />
              </div>
              <p className="text-xs font-mono text-[#4B5365]">
                Rendering uses WebGL via Three.js. Quality adapts to your hardware automatically.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm font-mono text-[#8B93A6]">RENDERER</span>
                  <span className="text-sm text-[#39FF14]">WebGL 2.0</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm font-mono text-[#8B93A6]">SHADOWS</span>
                  <span className="text-sm text-[#39FF14]">ENABLED</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm font-mono text-[#8B93A6]">FOG</span>
                  <span className="text-sm text-[#39FF14]">ENABLED</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm font-mono text-[#8B93A6]">ANTIALIASING</span>
                  <span className="text-sm text-[#39FF14]">ON</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
