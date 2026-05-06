import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Volume2, Monitor, X, AlertTriangle } from 'lucide-react';

const DEFAULT_SETTINGS = {
  sensitivity: 20, volume: 70, brightness: 60,
  fov: 75, shadows: false, antialiasing: true, showFPS: false,
};

const DEFAULT_KEYBINDS = {
  moveForward:  'KeyW',  moveBackward: 'KeyS',
  moveLeft:     'KeyA',  moveRight:    'KeyD',
  sprint:       'ShiftLeft', crouch:  'KeyC',
  leanLeft:     'KeyQ',  leanRight:   'KeyE',
  reload:       'KeyR',  ability:     'KeyF',
  plant:        'KeyG',
  weapon1:      'Digit1', weapon2:    'Digit2', weapon3: 'Digit3',
};

const KEYBIND_LABELS = {
  moveForward:  'Move Forward',    moveBackward: 'Move Backward',
  moveLeft:     'Move Left',       moveRight:    'Move Right',
  sprint:       'Sprint',          crouch:       'Crouch / Stand',
  leanLeft:     'Lean Left',       leanRight:    'Lean Right',
  reload:       'Reload',          ability:      'Operator Ability',
  plant:        'Plant Device (hold)',
  weapon1:      'Weapon Slot 1',   weapon2:      'Weapon Slot 2',
  weapon3:      'Weapon Slot 3',
};

function codeToLabel(code) {
  if (!code) return '—';
  if (code.startsWith('Key'))   return code.replace('Key', '');
  if (code.startsWith('Digit')) return code.replace('Digit', '');
  const MAP = {
    ShiftLeft:'L-SHIFT', ShiftRight:'R-SHIFT', ControlLeft:'L-CTRL', ControlRight:'R-CTRL',
    AltLeft:'L-ALT', AltRight:'R-ALT', Space:'SPACE', Enter:'ENTER',
    Backspace:'BKSP', Tab:'TAB', CapsLock:'CAPS',
    ArrowUp:'↑', ArrowDown:'↓', ArrowLeft:'←', ArrowRight:'→',
  };
  return MAP[code] || code;
}

export default function SettingsPanel({ onBack, engineRef }) {
  const [tab, setTab]           = useState('controls');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [keybinds, setKeybinds] = useState(DEFAULT_KEYBINDS);
  const [rebinding, setRebinding] = useState(null);
  const [conflict,  setConflict]  = useState(null);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem('covenantSettings') || '{}');    setSettings(p => ({...p,...s})); } catch {}
    try { const k = JSON.parse(localStorage.getItem('covenantKeyBindings') || '{}'); setKeybinds(p => ({...p,...k})); } catch {}
  }, []);

  useEffect(() => {
    if (!rebinding) return;
    const handler = (e) => {
      e.preventDefault();
      if (e.code === 'Escape') { setRebinding(null); setConflict(null); return; }
      const dup = Object.entries(keybinds).find(([a, c]) => c === e.code && a !== rebinding);
      if (dup) { setConflict({ action: rebinding, code: e.code, takenBy: dup[0] }); return; }
      applyRebind(rebinding, e.code);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rebinding, keybinds]);

  function applyRebind(action, code) {
    const next = { ...keybinds, [action]: code };
    setKeybinds(next);
    localStorage.setItem('covenantKeyBindings', JSON.stringify(next));
    if (engineRef?.current?.reloadKeybinds) engineRef.current.reloadKeybinds();
    setRebinding(null); setConflict(null);
  }

  function forceRebind() {
    if (!conflict) return;
    const next = { ...keybinds, [conflict.takenBy]: '', [conflict.action]: conflict.code };
    setKeybinds(next);
    localStorage.setItem('covenantKeyBindings', JSON.stringify(next));
    if (engineRef?.current?.reloadKeybinds) engineRef.current.reloadKeybinds();
    setRebinding(null); setConflict(null);
  }

  function resetKeybinds() {
    setKeybinds(DEFAULT_KEYBINDS);
    localStorage.setItem('covenantKeyBindings', JSON.stringify(DEFAULT_KEYBINDS));
    if (engineRef?.current?.reloadKeybinds) engineRef.current.reloadKeybinds();
    setConflict(null); setRebinding(null);
  }

  const updateSetting = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    localStorage.setItem('covenantSettings', JSON.stringify(next));
  };

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
        onChange={e => updateSetting(k, Number(e.target.value))}
        className="w-full h-1.5 bg-[#12141C] appearance-none cursor-pointer accent-[#00E5FF]" />
    </div>
  );

  const Toggle = ({ label, k, desc }) => (
    <div className="flex justify-between items-center py-3 border-b border-white/5">
      <div>
        <span className="text-sm font-mono text-[#8B93A6]">{label}</span>
        {desc && <p className="text-xs font-mono text-[#4B5365] mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => updateSetting(k, !settings[k])}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ml-4 ${settings[k] ? 'bg-[#00E5FF]' : 'bg-[#1a1a2e] border border-white/20'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${settings[k] ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  );

  const tabs = [
    { id:'controls', label:'Controls', icon:Gamepad2 },
    { id:'audio',    label:'Audio',    icon:Volume2  },
    { id:'video',    label:'Video',    icon:Monitor  },
  ];

  return (
    <div className="menu-bg" data-testid="settings-panel">
      <div className="scanlines" />

      {/* Rebind overlay */}
      {rebinding && !conflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0a0c14] border border-[#00E5FF] px-10 py-8 text-center" style={{boxShadow:'0 0 40px rgba(0,229,255,0.2)'}}>
            <p className="text-xs font-mono tracking-[0.25em] text-[#4B5365] uppercase mb-3">REBINDING</p>
            <p className="text-xl font-['Rajdhani'] font-bold text-white uppercase mb-1">{KEYBIND_LABELS[rebinding]}</p>
            <p className="text-sm font-mono text-[#00E5FF] mt-4 animate-pulse">Press any key…</p>
            <p className="text-xs font-mono text-[#4B5365] mt-2">ESC to cancel</p>
          </div>
        </div>
      )}

      {/* Conflict modal */}
      {conflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0a0c14] border border-[#FFB800] px-10 py-8 text-center max-w-sm" style={{boxShadow:'0 0 30px rgba(255,184,0,0.2)'}}>
            <AlertTriangle size={28} className="text-[#FFB800] mx-auto mb-3" />
            <p className="text-sm font-mono text-[#FFB800] uppercase tracking-widest mb-2">KEY CONFLICT</p>
            <p className="text-xs font-mono text-[#8B93A6] mb-4">
              <span className="text-white font-bold">{codeToLabel(conflict.code)}</span> is already bound to{' '}
              <span className="text-white font-bold">{KEYBIND_LABELS[conflict.takenBy]}</span>. Override it?
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={forceRebind} className="px-5 py-2 border border-[#FFB800] text-[#FFB800] text-xs font-mono uppercase hover:bg-[#FFB800]/10 transition-colors">OVERRIDE</button>
              <button onClick={() => {setConflict(null);setRebinding(null);}} className="px-5 py-2 border border-white/20 text-white text-xs font-mono uppercase hover:bg-white/5 transition-colors">CANCEL</button>
            </div>
          </div>
        </div>
      )}

      <div className="menu-content min-h-screen p-8 md:p-12 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight uppercase font-['Rajdhani'] text-white">SYSTEMS CONFIG</h2>
            <p className="text-xs font-mono text-[#4B5365] tracking-wider">Settings are saved automatically</p>
          </div>
          <button onClick={onBack} className="text-[#8B93A6] hover:text-[#00E5FF] transition-colors"><X size={22} /></button>
        </div>

        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-all ${tab===t.id ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/5' : 'border-white/10 text-[#8B93A6] hover:border-white/30'}`}>
              <t.icon size={13} />{t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-2xl overflow-y-auto max-h-[62vh] pr-2">
          {tab === 'controls' && (
            <div>
              <Slider label="Mouse Sensitivity" k="sensitivity" min={5} max={100} unit="" desc="Higher = faster camera movement." />
              <div className="mt-6 flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono text-[#4B5365] uppercase tracking-widest">KEYBINDS — Click a key to rebind</h3>
                <button onClick={resetKeybinds} className="text-xs font-mono text-[#4B5365] hover:text-[#FFB800] border border-white/10 hover:border-[#FFB800]/40 px-3 py-1 transition-colors">RESET ALL</button>
              </div>
              <div className="border border-white/10">
                {Object.keys(KEYBIND_LABELS).map(action => {
                  const isRebinding = rebinding === action;
                  const isEmpty     = !keybinds[action];
                  return (
                    <div key={action} className={`flex justify-between items-center px-4 py-2.5 border-b border-white/5 last:border-b-0 ${isRebinding ? 'bg-[#00E5FF]/5' : 'hover:bg-white/2'}`}>
                      <span className="text-sm font-mono text-[#8B93A6]">{KEYBIND_LABELS[action]}</span>
                      <button
                        onClick={() => { setRebinding(action); setConflict(null); }}
                        className={`min-w-[72px] text-center text-xs font-['Rajdhani'] font-bold px-3 py-1 border transition-all duration-150 ${
                          isRebinding ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/10 animate-pulse'
                          : isEmpty   ? 'border-[#FF2A2A]/60 text-[#FF2A2A] bg-[#FF2A2A]/5 hover:border-[#FF2A2A]'
                          : 'border-white/15 text-[#00E5FF] bg-[#12141C] hover:border-[#00E5FF]/60 hover:bg-[#00E5FF]/5'
                        }`}
                      >
                        {isRebinding ? '...' : (isEmpty ? 'UNBOUND' : codeToLabel(keybinds[action]))}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'audio' && <Slider label="Master Volume" k="volume" min={0} max={100} desc="Overall game volume." />}

          {tab === 'video' && (
            <div>
              <Slider label="Brightness"       k="brightness"   min={10} max={100} desc="Adjust scene brightness." />
              <Slider label="Field of View"    k="fov"          min={60} max={110} unit="°" desc="Horizontal FOV. Default 75°." />
              <Toggle label="Shadows"          k="shadows"      desc="Dynamic shadows. Disabling improves FPS." />
              <Toggle label="Antialiasing"     k="antialiasing" desc="Smooth jagged edges." />
              <Toggle label="Show FPS Counter" k="showFPS"      desc="Display FPS in the top-left corner." />
            </div>
          )}
        </div>

        <div className="mt-8">
          <button onClick={onBack} className="bg-transparent border border-white/20 text-white hover:border-white hover:bg-white/10 transition-all uppercase tracking-widest px-8 py-3 font-['Rajdhani'] font-semibold">
            BACK TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}