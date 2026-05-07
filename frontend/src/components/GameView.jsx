import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { getOperator } from '../game/Operators';
import GameHUD from './GameHUD';
import GameOver from './GameOver';
import { Volume2, Monitor, Gamepad2, X, RotateCcw, Home } from 'lucide-react';

// ── Settings helpers (shared with SettingsPanel) ────────────────────────────
const DEFAULT_SETTINGS = { sensitivity: 20, volume: 70, brightness: 60, fov: 75, shadows: true, antialiasing: true, showFPS: false };
function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('covenantSettings') || '{}') }; }
  catch { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings(s) { try { localStorage.setItem('covenantSettings', JSON.stringify(s)); } catch {} }

// ── Pause / Settings panel ───────────────────────────────────────────────────
const KEYBIND_ACTIONS = [
  ['moveForward','Move Forward'],['moveBackward','Move Backward'],
  ['moveLeft','Move Left'],['moveRight','Move Right'],
  ['sprint','Sprint'],['crouch','Crouch'],
  ['leanLeft','Lean Left'],['leanRight','Lean Right'],
  ['reload','Reload'],['ability','Ability [F]'],
  ['plant','Plant Device'],
  ['weapon1','Weapon 1'],['weapon2','Weapon 2'],['weapon3','Weapon 3'],
];
const DEFAULT_KB = {
  moveForward:'KeyW', moveBackward:'KeyS', moveLeft:'KeyA', moveRight:'KeyD',
  sprint:'ShiftLeft', crouch:'KeyC', leanLeft:'KeyQ', leanRight:'KeyE',
  reload:'KeyR', ability:'KeyF', plant:'KeyG',
  weapon1:'Digit1', weapon2:'Digit2', weapon3:'Digit3',
};
function loadKB() {
  try { return { ...DEFAULT_KB, ...JSON.parse(localStorage.getItem('covenantKeyBindings')||'{}') }; }
  catch { return { ...DEFAULT_KB }; }
}
function codeLabel(c) {
  if (!c) return 'UNBOUND';
  if (c.startsWith('Key'))   return c.replace('Key','');
  if (c.startsWith('Digit')) return c.replace('Digit','');
  return {ShiftLeft:'L-SHIFT',ShiftRight:'R-SHIFT',ControlLeft:'L-CTRL',Space:'SPACE'}[c] || c;
}

function PauseMenu({ onResume, onRestart, onMenu, engineRef }) {
  const [tab, setTab] = useState('controls');
  const [settings, setSettings] = useState(loadSettings);
  const [keybinds, setKeybinds] = useState(loadKB);
  const [rebinding, setRebinding] = useState(null);
  const [conflict,  setConflict]  = useState(null);

  useEffect(() => {
    if (!rebinding) return;
    const handler = (e) => {
      e.preventDefault();
      if (e.code === 'Escape') { setRebinding(null); setConflict(null); return; }
      const dup = Object.entries(keybinds).find(([a,c]) => c === e.code && a !== rebinding);
      if (dup) { setConflict({ action: rebinding, code: e.code, takenBy: dup[0] }); return; }
      const next = { ...keybinds, [rebinding]: e.code };
      setKeybinds(next);
      localStorage.setItem('covenantKeyBindings', JSON.stringify(next));
      if (engineRef?.current?.reloadKeybinds) engineRef.current.reloadKeybinds();
      setRebinding(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rebinding, keybinds, engineRef]);

  const update = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    saveSettings(next);
    if (engineRef?.current?.updateSettings) engineRef.current.updateSettings(next);
  };

  const tabs = [
    { id:'controls', label:'Controls', icon:Gamepad2 },
    { id:'audio',    label:'Audio',    icon:Volume2  },
    { id:'video',    label:'Video',    icon:Monitor  },
  ];

  const Slider = ({ label, k, min, max, unit='%' }) => (
    <div className="py-2.5 border-b border-white/5">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-mono text-[#8B93A6]">{label}</span>
        <span className="text-xs font-bold text-[#00E5FF]">{settings[k]}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={settings[k]}
        onChange={e => update(k, Number(e.target.value))}
        className="w-full h-1 bg-[#12141C] appearance-none cursor-pointer accent-[#00E5FF]" />
    </div>
  );

  const Toggle = ({ label, k, desc }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5">
      <div>
        <span className="text-xs font-mono text-[#8B93A6]">{label}</span>
        {desc && <p className="text-xs font-mono text-[#4B5365] mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => update(k, !settings[k])}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${settings[k] ? 'bg-[#00E5FF]' : 'bg-[#1a1a2e] border border-white/20'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${settings[k] ? 'left-4' : 'left-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md">

      {/* Rebind overlay */}
      {rebinding && !conflict && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
          <div className="bg-[#0a0c14] border border-[#00E5FF] px-8 py-6 text-center" style={{boxShadow:'0 0 30px rgba(0,229,255,0.2)'}}>
            <p className="text-xs font-mono text-[#4B5365] uppercase tracking-widest mb-2">REBINDING</p>
            <p className="text-lg font-['Rajdhani'] font-bold text-white uppercase">{KEYBIND_ACTIONS.find(([a])=>a===rebinding)?.[1]}</p>
            <p className="text-sm font-mono text-[#00E5FF] mt-3 animate-pulse">Press any key…</p>
            <p className="text-xs font-mono text-[#4B5365] mt-1">ESC to cancel</p>
          </div>
        </div>
      )}
      {conflict && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
          <div className="bg-[#0a0c14] border border-[#FFB800] px-8 py-6 text-center max-w-xs">
            <p className="text-xs font-mono text-[#FFB800] uppercase mb-2">KEY CONFLICT</p>
            <p className="text-xs font-mono text-[#8B93A6] mb-4">
              <span className="text-white">{codeLabel(conflict.code)}</span> is already used by{' '}
              <span className="text-white">{KEYBIND_ACTIONS.find(([a])=>a===conflict.takenBy)?.[1]}</span>
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => {
                const next = { ...keybinds, [conflict.takenBy]:'', [conflict.action]: conflict.code };
                setKeybinds(next);
                localStorage.setItem('covenantKeyBindings', JSON.stringify(next));
                if (engineRef?.current?.reloadKeybinds) engineRef.current.reloadKeybinds();
                setRebinding(null); setConflict(null);
              }} className="px-4 py-1.5 border border-[#FFB800] text-[#FFB800] text-xs font-mono uppercase hover:bg-[#FFB800]/10">OVERRIDE</button>
              <button onClick={() => {setConflict(null);setRebinding(null);}} className="px-4 py-1.5 border border-white/20 text-white text-xs font-mono uppercase hover:bg-white/5">CANCEL</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-xl bg-[#0a0b10] border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-['Rajdhani'] font-bold text-white uppercase tracking-widest">PAUSED — SYSTEMS CONFIG</h2>
            <p className="text-xs font-mono text-[#4B5365]">Settings saved automatically • Click a key to rebind</p>
          </div>
          <button onClick={onResume} className="text-[#8B93A6] hover:text-[#00E5FF] transition-colors"><X size={20} /></button>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all border ${
                tab===t.id ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/5' : 'border-white/10 text-[#8B93A6] hover:border-white/30'
              }`}>
              <t.icon size={12} />{t.label}
            </button>
          ))}
        </div>

        <div className="px-6 py-3 max-h-64 overflow-y-auto">
          {tab === 'controls' && (
            <div>
              <Slider label="MOUSE SENSITIVITY" k="sensitivity" min={5} max={100} unit="" />
              <div className="mt-2 border border-white/10">
                {KEYBIND_ACTIONS.map(([action, label]) => {
                  const isReb = rebinding === action;
                  return (
                    <div key={action} className={`flex justify-between items-center px-3 py-2 border-b border-white/5 last:border-0 ${isReb ? 'bg-[#00E5FF]/5' : 'hover:bg-white/2'}`}>
                      <span className="text-xs font-mono text-[#8B93A6]">{label}</span>
                      <button onClick={() => { setRebinding(action); setConflict(null); }}
                        className={`min-w-[64px] text-center text-xs font-['Rajdhani'] font-bold px-2 py-0.5 border transition-all ${
                          isReb ? 'border-[#00E5FF] text-[#00E5FF] animate-pulse'
                          : !keybinds[action] ? 'border-[#FF2A2A]/50 text-[#FF2A2A]'
                          : 'border-white/15 text-[#00E5FF] bg-[#12141C] hover:border-[#00E5FF]/50'
                        }`}>
                        {isReb ? '...' : codeLabel(keybinds[action])}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {tab === 'audio' && <Slider label="MASTER VOLUME" k="volume" min={0} max={100} />}
          {tab === 'video' && (
            <div>
              <Slider label="BRIGHTNESS" k="brightness" min={10} max={100} />
              <Slider label="FIELD OF VIEW" k="fov" min={60} max={110} unit="°" />
              <Toggle label="SHADOWS"           k="shadows"      desc="Disable for better performance." />
              <Toggle label="ANTIALIASING"      k="antialiasing" desc="Smooths edges." />
              <Toggle label="SHOW FPS COUNTER"  k="showFPS"      desc="Display FPS in corner." />
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-white/10">
          <button onClick={onResume}
            className="flex-1 flex items-center justify-center gap-2 border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#050508] transition-all uppercase tracking-widest py-2.5 font-['Rajdhani'] font-semibold text-sm">
            ▶ RESUME
          </button>
          <button onClick={onRestart}
            className="flex items-center gap-2 border border-white/20 text-white hover:border-white/60 hover:bg-white/5 transition-all uppercase tracking-widest px-4 py-2.5 font-['Rajdhani'] font-semibold text-sm">
            <RotateCcw size={14} /> Restart
          </button>
          <button onClick={onMenu}
            className="flex items-center gap-2 border border-white/20 text-white hover:border-[#FF2A2A] hover:text-[#FF2A2A] transition-all uppercase tracking-widest px-4 py-2.5 font-['Rajdhani'] font-semibold text-sm">
            <Home size={14} /> Menu
          </button>
        </div>
      </div>
    </div>
  );
}

// ── GameView ─────────────────────────────────────────────────────────────────
export default function GameView({ mode, roomId, playerName, operatorId, team, onExit }) {
  const containerRef = useRef(null);
  const engineRef    = useRef(null);
  const wsRef        = useRef(null);
  const gameOverRef  = useRef(false); // ref so pointerlockchange handler always has current value

  const [isLocked,    setIsLocked]    = useState(false);
  const [isPaused,    setIsPaused]    = useState(false);
  const [gameState, setGameState] = useState({
    health: 100, maxHealth: 100, armor: 50, maxArmor: 50,
    ammo: 30, maxAmmo: 30, weaponName: 'CR-7 Assault Rifle', weaponType: 'rifle',
    isReloading: false, kills: 0, deaths: 0,
    heartHealth: 1000, heartMaxHealth: 1000, enemiesAlive: 0,
    wave: 1, gameOver: false, winner: null, isAlive: true,
    round: 1, maxRounds: 5, roundTimeLeft: 180,
    score: { humans: 0, aliens: 0 },
    isCrouching: false, isADS: false, isSprinting: false, leaning: 0,
    abilityCharge: 100, abilityActive: false, operatorId,
    damageIndicators: []
  });

  const handleStateUpdate = useCallback((update) => {
    if (update.gameOver) gameOverRef.current = true;
    // Don't update locked state from engine — GameView owns that via pointerlockchange
    const { locked, ...rest } = update;
    setGameState(prev => ({ ...prev, ...rest }));
  }, []);

  // ── Pointer lock change handler owned entirely by GameView ────────────────
  // This is the KEY fix: both setIsLocked and setIsPaused happen in the same
  // React batch, so the pause menu renders INSTEAD of the deploy overlay.
  useEffect(() => {
    const onLockChange = () => {
      const locked = document.pointerLockElement === containerRef.current;
      if (locked) {
        // Became locked → clear pause, mark as locked
        setIsLocked(true);
        setIsPaused(false);
      } else {
        // Released → if game is not over, show pause menu
        setIsLocked(false);
        if (!gameOverRef.current) setIsPaused(true);
      }
    };
    document.addEventListener('pointerlockchange', onLockChange);
    return () => document.removeEventListener('pointerlockchange', onLockChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    gameOverRef.current = false;

    // Small defer so React finishes painting the container div before Three.js
    // appends the canvas — avoids the blank screen on first mount in some builds.
    const timerId = setTimeout(() => {
      if (!containerRef.current) return; // unmounted while waiting
      try {
        const operator = operatorId ? getOperator(operatorId) : getOperator('vanguard');
        engineRef.current = new GameEngine(
          containerRef.current,
          handleStateUpdate,
          { mode, operator, team: team || 'human' }
        );
        if (mode === 'multiplayer' && roomId) connectWebSocket();
      } catch (err) {
        console.error('[GameView] GameEngine init failed:', err);
      }
    }, 0);

    return () => {
      clearTimeout(timerId);
      if (engineRef.current) { engineRef.current.dispose(); engineRef.current = null; }
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const connectWebSocket = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    if (!backendUrl) return;
    const wsUrl = backendUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(
      mode === 'singleplayer' ? `${wsUrl}/ws/singleplayer` : `${wsUrl}/ws/game/${roomId}`
    );
    wsRef.current = ws;
    ws.onopen  = () => ws.send(JSON.stringify({ name: playerName || 'Commander', operator: operatorId }));
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.type === 'game_state' && d.game_over) {
        gameOverRef.current = true;
        setGameState(prev => ({ ...prev, gameOver: true, winner: d.winner }));
      }
    };
    ws.onerror = () => {};
  };

  const requestLock = () => {
    if (containerRef.current) containerRef.current.requestPointerLock();
  };

  const handleResume = () => {
    setIsPaused(false);
    setTimeout(requestLock, 80); // small delay so the overlay is gone before lock fires
  };

  const handleRestart = () => {
    gameOverRef.current = false;
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.restart();
      setGameState(prev => ({
        ...prev, health: 100, armor: 50, ammo: 30, kills: 0, deaths: 0,
        heartHealth: 1000, enemiesAlive: 0, wave: 1, gameOver: false,
        winner: null, isAlive: true, round: 1, score: { humans: 0, aliens: 0 },
        abilityCharge: 100, abilityActive: false
      }));
    }
    setTimeout(requestLock, 80);
  };

  const handleMenu = () => {
    if (engineRef.current) { engineRef.current.dispose(); engineRef.current = null; }
    if (wsRef.current) wsRef.current.close();
    onExit();
  };

  const openSettings = () => {
    if (document.pointerLockElement) document.exitPointerLock();
    // pointerlockchange will set isPaused=true automatically
    // but if already unlocked, set manually
    else setIsPaused(true);
  };

  return (
    <div data-testid="game-view" className="relative w-screen h-screen overflow-hidden">
      <div ref={containerRef} id="game-canvas"
        className={`absolute inset-0 ${isPaused ? "pointer-events-none" : ""}`}
        data-testid="game-canvas-container" />

      {!isLocked && !isPaused && !gameState.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm cursor-crosshair"
          onClick={requestLock}>
          <div className="text-center max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 mx-auto border-2 border-[#00E5FF] rounded-full flex items-center justify-center mb-6 animate-pulse">
              <div className="w-2 h-2 bg-[#00E5FF] rounded-full" />
            </div>
            <h2 className="text-2xl font-['Rajdhani'] font-bold text-[#00E5FF] uppercase mb-2 tracking-widest">
              CLICK ANYWHERE TO DEPLOY
            </h2>
            <p className="text-sm font-mono text-[#8B93A6] mb-6">
              Press <span className="text-[#00E5FF]">ESC</span> or <span className="text-[#00E5FF]">⚙</span> in the HUD to pause / settings
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-[#4B5365] bg-black/40 border border-white/10 p-4 mb-6">
              <div className="text-left space-y-1">
                <p><span className="text-[#00E5FF]">WASD</span> — Move</p>
                <p><span className="text-[#00E5FF]">SHIFT</span> — Sprint</p>
                <p><span className="text-[#00E5FF]">C</span> — Crouch</p>
                <p><span className="text-[#00E5FF]">Q / E</span> — Lean</p>
              </div>
              <div className="text-left space-y-1">
                <p><span className="text-[#00E5FF]">LMB</span> — Shoot &nbsp; <span className="text-[#00E5FF]">RMB</span> — ADS</p>
                <p><span className="text-[#00E5FF]">R</span> — Reload</p>
                <p><span className="text-[#00E5FF]">F</span> — Operator ability</p>
                <p><span className="text-[#00E5FF]">1 / 2 / 3</span> — Switch weapon</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-white/5 text-center">
                <p><span className="text-[#00E5FF]">G (hold)</span> — Plant Neural Disruptor &nbsp;|&nbsp; <span className="text-[#00E5FF]">ESC</span> — Pause</p>
              </div>
            </div>
            <button onClick={requestLock}
              className="w-full border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#050508] transition-all uppercase tracking-widest px-8 py-3 mb-3 font-['Rajdhani'] font-bold text-lg">
              ▶ DEPLOY
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleMenu(); }}
              className="border border-white/20 text-white hover:border-white hover:bg-white/10 transition-all uppercase tracking-widest px-6 py-2 text-xs font-mono">
              BACK TO MENU
            </button>
          </div>
        </div>
      )}

      {/* Pause / Settings panel — shows when paused (includes ESC) */}
      {isPaused && !gameState.gameOver && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onMenu={handleMenu}
          engineRef={engineRef}
        />
      )}

      <GameHUD gameState={gameState} isLocked={isLocked} onOpenSettings={openSettings} />

      {gameState.gameOver && (
        <GameOver
          winner={gameState.winner} kills={gameState.kills} deaths={gameState.deaths}
          round={gameState.round} score={gameState.score}
          onRestart={handleRestart} onMenu={handleMenu}
        />
      )}
    </div>
  );
}