import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Monitor, Gamepad2, Sun } from 'lucide-react';

const DEFAULT_SETTINGS = {
  sensitivity: 20,
  volume: 70,
  brightness: 60,
  fov: 75,
  shadows: true,
  antialiasing: true,
  showFPS: false,
};

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('covenantSettings') || '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem('covenantSettings', JSON.stringify(settings));
  } catch {}
}

export default function SettingsPanel({ onBack, engineRef }) {
  const [activeTab, setActiveTab] = useState('controls');
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    saveSettings(settings);
    if (engineRef?.current?.updateSettings) {
      engineRef.current.updateSettings(settings);
    }
  }, [settings]);

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  const resetToDefaults = () => setSettings({ ...DEFAULT_SETTINGS });

  const tabs = [
    { id: 'controls', label: 'CONTROLS', icon: Gamepad2 },
    { id: 'audio', label: 'AUDIO', icon: Volume2 },
    { id: 'video', label: 'VIDEO', icon: Monitor },
  ];

  const SliderRow = ({ label, valueKey, min, max, unit = '%', description }) => (
    <div className="py-3 border-b border-white/5">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-mono text-[#8B93A6]">{label}</span>
        <span className="text-sm font-['Rajdhani'] font-bold text-[#00E5FF]">{settings[valueKey]}{unit}</span>
      </div>
      {description && <p className="text-xs font-mono text-[#4B5365] mb-2">{description}</p>}
      <input
        type="range" min={min} max={max}
        value={settings[valueKey]}
        onChange={e => update(valueKey, Number(e.target.value))}
        className="w-full h-1 bg-[#12141C] appearance-none cursor-pointer accent-[#00E5FF]"
      />
      <div className="flex justify-between text-xs font-mono text-[#4B5365] mt-1">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );

  const ToggleRow = ({ label, valueKey, description }) => (
    <div className="flex justify-between items-center py-3 border-b border-white/5">
      <div>
        <span className="text-sm font-mono text-[#8B93A6]">{label}</span>
        {description && <p className="text-xs font-mono text-[#4B5365] mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => update(valueKey, !settings[valueKey])}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${settings[valueKey] ? 'bg-[#00E5FF]' : 'bg-[#1a1a2e] border border-white/20'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${settings[valueKey] ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="menu-bg" data-testid="settings-panel">
      <div className="scanlines" />
      <div className="menu-content min-h-screen p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} data-testid="settings-back-btn" className="text-[#8B93A6] hover:text-[#00E5FF] transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight uppercase font-['Rajdhani'] text-white">SYSTEMS CONFIG</h2>
            <p className="text-xs font-mono text-[#4B5365] tracking-wider">SETTINGS & PREFERENCES</p>
          </div>
          <button onClick={resetToDefaults} className="ml-auto text-xs font-mono text-[#4B5365] hover:text-[#FFB800] border border-white/10 hover:border-[#FFB800]/40 px-3 py-1.5 transition-colors">
            RESET DEFAULTS
          </button>
        </div>

        <div className="flex gap-1 mb-6">
          {tabs.map(tab => (
            <button key={tab.id} data-testid={`settings-tab-${tab.id}`} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all duration-200 border ${activeTab === tab.id ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/5' : 'border-white/10 text-[#8B93A6] hover:border-white/30'}`}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 max-w-2xl">

          {activeTab === 'controls' && (
            <div>
              <h3 className="text-lg font-['Rajdhani'] font-semibold uppercase text-white mb-4">Control Bindings</h3>
              <div>
                {[
                  { action: 'MOVE FORWARD', key: 'W' },
                  { action: 'MOVE BACKWARD', key: 'S' },
                  { action: 'STRAFE LEFT', key: 'A' },
                  { action: 'STRAFE RIGHT', key: 'D' },
                  { action: 'SPRINT', key: 'SHIFT' },
                  { action: 'CROUCH', key: 'C / CTRL' },
                  { action: 'LEAN LEFT', key: 'Q' },
                  { action: 'LEAN RIGHT', key: 'E' },
                  { action: 'SHOOT', key: 'LEFT CLICK' },
                  { action: 'AIM DOWN SIGHTS', key: 'RIGHT CLICK' },
                  { action: 'RELOAD', key: 'R' },
                  { action: 'OPERATOR ABILITY', key: 'F' },
                  { action: 'SWITCH WEAPON', key: '1 / 2 / 3 / SCROLL' },
                  { action: 'UNLOCK CURSOR', key: 'ESC' },
                ].map(binding => (
                  <div key={binding.action} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-sm font-mono text-[#8B93A6]">{binding.action}</span>
                    <span className="text-xs font-['Rajdhani'] font-semibold text-[#00E5FF] bg-[#12141C] px-3 py-1 border border-white/10">{binding.key}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4">
                <SliderRow label="MOUSE SENSITIVITY" valueKey="sensitivity" min={5} max={100} unit="" description="Higher = faster camera rotation" />
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div>
              <h3 className="text-lg font-['Rajdhani'] font-semibold uppercase text-white mb-4">Audio Settings</h3>
              <SliderRow label="MASTER VOLUME" valueKey="volume" min={0} max={100} description="Overall game volume" />
              <div className="flex items-center gap-2 text-xs font-mono text-[#4B5365] bg-[#12141C] border border-white/10 p-3 mt-4">
                <Volume2 size={12} />
                <span>Procedural audio via Web Audio API. Click anywhere in-game to activate.</span>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div>
              <h3 className="text-lg font-['Rajdhani'] font-semibold uppercase text-white mb-4">Video Settings</h3>

              <SliderRow label="BRIGHTNESS" valueKey="brightness" min={10} max={100} description="Scene exposure — increase if game looks too dark." />
              <SliderRow label="FIELD OF VIEW" valueKey="fov" min={60} max={110} unit="°" description="Camera FOV in degrees. Higher = wider peripheral." />

              <div className="pt-2">
                <ToggleRow label="SHADOWS" valueKey="shadows" description="Dynamic shadow casting. Disable for better performance." />
                <ToggleRow label="ANTIALIASING" valueKey="antialiasing" description="Smooths jagged edges. Requires restart." />
                <ToggleRow label="SHOW FPS COUNTER" valueKey="showFPS" description="Display frames-per-second in corner." />
              </div>

              <div className="pt-4 border-t border-white/5 mt-2 space-y-0">
                {[
                  { label: 'RENDERER', value: 'WebGL 2.0' },
                  { label: 'ENGINE', value: 'Three.js' },
                  { label: 'TONE MAPPING', value: 'ACES Filmic' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-sm font-mono text-[#8B93A6]">{label}</span>
                    <span className="text-sm text-[#39FF14] font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs font-mono text-[#4B5365] mt-4">✓ Settings saved automatically and applied in real-time.</p>
      </div>
    </div>
  );
}