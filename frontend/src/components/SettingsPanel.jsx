import React, { useState, useEffect } from 'react';
import { Gamepad2, Volume2, Monitor, X } from 'lucide-react';

const DEFAULT = {
  sensitivity: 20, volume: 70, brightness: 60,
  fov: 75, shadows: false, antialiasing: true, showFPS: false
};

const KEYBINDS = [
  { action: 'Move Forward',      key: 'W'              },
  { action: 'Move Backward',     key: 'S'              },
  { action: 'Move Left',         key: 'A'              },
  { action: 'Move Right',        key: 'D'              },
  { action: 'Sprint',            key: 'SHIFT'          },
  { action: 'Crouch',            key: 'C / CTRL'       },
  { action: 'Lean Left',         key: 'Q'              },
  { action: 'Lean Right',        key: 'E'              },
  { action: 'Shoot',             key: 'LMB'            },
  { action: 'ADS (Aim)',         key: 'RMB'            },
  { action: 'Reload',            key: 'R'              },
  { action: 'Operator Ability',  key: 'F'              },
  { action: 'Plant Device',      key: 'G (hold 5s)'   },
  { action: 'Switch Weapon',     key: '1 / 2 / 3'     },
  { action: 'Scroll Weapon',     key: 'SCROLL WHEEL'  },
  { action: 'Pause / Settings',  key: 'ESC or ⚙ HUD' },
  { action: 'Unlock Cursor',     key: 'ESC'            },
];

export default function SettingsPanel({ onBack }) {
  const [tab, setTab] = useState('controls');
  const [settings, setSettings] = useState(DEFAULT);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('covenantSettings') || '{}');
      setSettings(s => ({ ...s, ...saved }));
    } catch {}
  }, []);

  const update = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    localStorage.setItem('covenantSettings', JSON.stringify(next));
  };

  const tabs = [
    { id: 'controls', label: 'Controls & Keybinds', icon: Gamepad2 },
    { id: 'audio',    label: 'Audio',               icon: Volume2  },
    { id: 'video',    label: 'Video',               icon: Monitor  },
  ];

  const Slider = ({ label, k, min, max, unit = '%', desc }) => (
    <div className="py-3 border-b border-white/5">
      <div className="flex justify-between mb-1">
        <div>
          <span className="text-sm font-mono text-[#8B93A6]">{label}</span>
          {desc && <p className="text-xs font-mono text-[#4B5365] mt-0.5">{desc}</p>}
        </div>
        <span className="text-sm font-bold text-[#00E5FF] tabular-nums">{settings[k]}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={settings[k]}
        onChange={e => update(k, Number(e.target.value))}
        className="w-full h-1.5 bg-[#12141C] appearance-none cursor-pointer accent-[#00E5FF]" />
    </div>
  );

  const Toggle = ({ label, k, desc }) => (
    <div className="flex justify-between items-center py-3 border-b border-white/5">
      <div>
        <span className="text-sm font-mono text-[#8B93A6]">{label}</span>
        {desc && <p className="text-xs font-mono text-[#4B5365] mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => update(k, !settings[k])}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ml-4 ${
          settings[k] ? 'bg-[#00E5FF]' : 'bg-[#1a1a2e] border border-white/20'
        }`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
          settings[k] ? 'left-5' : 'left-0.5'
        }`} />
      </button>
    </div>
  );

  return (
    <div className="menu-bg" data-testid="settings-panel">
      <div className="scanlines" />
      <div className="menu-content min-h-screen p-8 md:p-12 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight uppercase font-['Rajdhani'] text-white">
              SYSTEMS CONFIG
            </h2>
            <p className="text-xs font-mono text-[#4B5365] tracking-wider">Settings are saved automatically</p>
          </div>
          <button onClick={onBack} className="text-[#8B93A6] hover:text-[#00E5FF] transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-all ${
                tab === t.id
                  ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/5'
                  : 'border-white/10 text-[#8B93A6] hover:border-white/30'
              }`}>
              <t.icon size={13} />{t.label}
            </button>
          ))}
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 max-w-2xl overflow-y-auto max-h-[60vh] pr-2">
          {tab === 'controls' && (
            <div>
              <Slider label="Mouse Sensitivity" k="sensitivity" min={5} max={100} unit=""
                desc="How fast your view moves with the mouse." />

              <div className="mt-6">
                <h3 className="text-xs font-mono text-[#4B5365] uppercase tracking-widest mb-3">KEYBINDS (non-editable in prototype)</h3>
                <div className="border border-white/10">
                  {KEYBINDS.map(b => (
                    <div key={b.action} className="flex justify-between items-center px-4 py-2.5 border-b border-white/5 last:border-b-0 hover:bg-white/2">
                      <span className="text-sm font-mono text-[#8B93A6]">{b.action}</span>
                      <span className="text-xs font-['Rajdhani'] font-bold text-[#00E5FF] bg-[#12141C] border border-white/10 px-2 py-0.5">
                        {b.key}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'audio' && (
            <div>
              <Slider label="Master Volume"  k="volume"     min={0}  max={100} desc="Overall game volume." />
            </div>
          )}

          {tab === 'video' && (
            <div>
              <Slider label="Brightness"     k="brightness" min={10} max={100} desc="Adjust scene brightness." />
              <Slider label="Field of View"  k="fov"        min={60} max={110} unit="°" desc="Horizontal field of view. Default 75°." />
              <Toggle label="Shadows"        k="shadows"    desc="Enable dynamic shadows. Disabling improves FPS." />
              <Toggle label="Antialiasing"   k="antialiasing" desc="Smooth jagged edges. May reduce FPS slightly." />
              <Toggle label="Show FPS Counter" k="showFPS"  desc="Display frames per second in the top-left corner." />
            </div>
          )}
        </div>

        <div className="mt-8">
          <button onClick={onBack}
            className="bg-transparent border border-white/20 text-white hover:border-white hover:bg-white/10 transition-all uppercase tracking-widest px-8 py-3 font-['Rajdhani'] font-semibold">
            BACK TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}