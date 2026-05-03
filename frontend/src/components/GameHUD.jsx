import React from 'react';
import { Heart, Shield, Crosshair, Zap, Clock, Target, Settings } from 'lucide-react';

// Pure display component — no internal RAF loops, no timers, no extra state.
// GameView calls setGameState ~15x/s from the engine; this just renders whatever it gets.
export default function GameHUD({ gameState, isLocked, onOpenSettings }) {
  if (!isLocked) return null;

  // Read showFPS setting from localStorage (same key as SettingsPanel)
  let showFPS = false;
  try { showFPS = JSON.parse(localStorage.getItem('covenantSettings') || '{}').showFPS || false; } catch {}

  const hp   = Math.max(0, Math.round(gameState.health  || 0));
  const arm  = Math.max(0, Math.round(gameState.armor   || 0));
  const hpPct  = ((hp  / (gameState.maxHealth || 100)) * 100).toFixed(1);
  const armPct = ((arm / (gameState.maxArmor  ||  50)) * 100).toFixed(1);
  const heartPct = (((gameState.heartHealth || 0) / (gameState.heartMaxHealth || 1000)) * 100).toFixed(1);
  const abilPct  = Math.round(gameState.abilityCharge || 0);

  const isLowHp  = hp  < 30;
  const isLowAmmo = (gameState.ammo || 0) <= 5;

  const fmt = (s) => {
    const m = Math.floor(s / 60), sec = (s || 0) % 60;
    return `${m}:${String(sec).padStart(2,'0')}`;
  };

  return (
    <div className="hud-overlay" data-testid="game-hud">

      {/* Damage vignette */}
      {gameState.damaged && <div className="damage-vignette" />}

      {/* FPS counter — only shown when enabled in settings */}
      {showFPS && (
        <div className="absolute top-4 left-4 pointer-events-none z-50">
          <span className={`text-xs font-mono px-1.5 py-0.5 bg-black/50 border ${
            (gameState.fps || 0) < 30 ? 'text-[#FF2A2A] border-[#FF2A2A]/30' :
            (gameState.fps || 0) < 50 ? 'text-[#FFB800] border-[#FFB800]/30' :
                                        'text-[#39FF14] border-[#39FF14]/30'
          }`}>
            {gameState.fps || 0} FPS
          </span>
        </div>
      )}

      {/* Damage direction indicators */}
      {gameState.damageIndicators?.map((ind, i) => (
        <div key={i} className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{ transform:`translate(-50%,-50%) rotate(${ind.angle}rad) translateY(-120px)`, opacity: ind.intensity }}>
          <div className="w-2 h-8 bg-[#FF2A2A]" style={{ clipPath:'polygon(50% 0%,0% 100%,100% 100%)' }} />
        </div>
      ))}

      {/* Crosshair */}
      <div className="crosshair" data-testid="crosshair">
        {gameState.isADS ? (
          <div className="relative w-6 h-6">
            <div className="w-px h-3 bg-white/80 absolute top-0   left-1/2 -translate-x-1/2" />
            <div className="w-px h-3 bg-white/80 absolute bottom-0 left-1/2 -translate-x-1/2" />
            <div className="w-3 h-px bg-white/80 absolute left-0  top-1/2 -translate-y-1/2" />
            <div className="w-3 h-px bg-white/80 absolute right-0 top-1/2 -translate-y-1/2" />
            <div className="w-1 h-1 bg-red-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        ) : (
          <Crosshair size={20} className="text-white/60" strokeWidth={1} />
        )}
      </div>

      {/* ── Top Center — round / timer / heart ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-6 py-2">
          <div className="flex items-center gap-4 mb-1">
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-[#FFB800]" />
              <span className={`text-sm font-['Rajdhani'] font-bold ${(gameState.roundTimeLeft||0)<=30 ? 'text-[#FF2A2A] animate-pulse' : 'text-white'}`}>
                {fmt(gameState.roundTimeLeft||0)}
              </span>
            </div>
            <span className="text-xs font-mono text-[#8B93A6]">R{gameState.round||1}/{gameState.maxRounds||5}</span>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[#00E5FF]">{gameState.score?.humans||0}</span>
              <span className="text-[#4B5365]">-</span>
              <span className="text-[#FF2A2A]">{gameState.score?.aliens||0}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target size={10} className="text-[#FF2A2A]" />
            <span className="text-xs font-mono text-[#FF2A2A] uppercase tracking-wider">DESTROY THE HEART</span>
          </div>
          <div className="mt-1 w-48 mx-auto h-1 bg-white/10 overflow-hidden">
            <div className="h-full transition-all duration-300" style={{ width:`${heartPct}%`, background:'linear-gradient(90deg,#FF2A2A,#ff6666)' }} />
          </div>
        </div>
      </div>

      {/* ── Top Right — wave / kills + SETTINGS BUTTON ── */}
      <div className="absolute top-4 right-4 text-right flex flex-col gap-2 items-end">
        {/* Settings button — click to pause + open settings */}
        <button
          onClick={onOpenSettings}
          className="pointer-events-auto bg-black/60 border border-white/10 hover:border-[#00E5FF] hover:text-[#00E5FF] text-[#8B93A6] transition-all duration-200 p-2"
          title="Settings (ESC)"
        >
          <Settings size={16} />
        </button>
        {/* Wave info */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 min-w-[120px] pointer-events-none">
          <p className="text-xs font-mono tracking-[0.2em] text-[#4B5365] uppercase">WAVE</p>
          <p className="text-xl font-['Rajdhani'] font-bold text-[#00E5FF]">{gameState.wave||1}</p>
          <div className="flex items-center gap-1 justify-end mt-1">
            <Zap size={10} className="text-[#FFB800]" />
            <span className="text-xs font-mono text-[#FFB800]">{gameState.kills||0} kills</span>
          </div>
          <p className="text-xs font-mono text-[#8B93A6]">{gameState.enemiesAlive||0} hostiles</p>
        </div>
      </div>

      {/* ── Bottom Left — HP / Armor / Ability ── */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 min-w-[180px]">
          {gameState.operatorId && (
            <div className="mb-2 pb-2 border-b border-white/5">
              <div className="flex justify-between">
                <span className="text-xs font-mono text-[#4B5365] uppercase">[F] ABILITY</span>
                <span className={`text-xs font-mono ${abilPct>=100 ? 'text-[#39FF14]' : 'text-[#4B5365]'}`}>{abilPct}%</span>
              </div>
              <div className="h-1 bg-white/10 mt-1">
                <div className={`h-full transition-all duration-300 ${gameState.abilityActive ? 'bg-[#FFB800]' : 'bg-[#39FF14]'}`}
                  style={{ width:`${abilPct}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-1">
            <Heart size={12} className={isLowHp ? 'text-[#FF2A2A]' : 'text-[#39FF14]'} />
            <span className="text-xs font-mono text-[#8B93A6] uppercase tracking-wider">HP</span>
          </div>
          <div className="health-bar mb-1">
            <div className={`health-bar-fill ${isLowHp ? 'low' : ''}`} style={{ width:`${hpPct}%` }} />
          </div>
          <div className="flex justify-between mb-2">
            <span className={`text-xl font-['Rajdhani'] font-bold ${isLowHp ? 'text-[#FF2A2A]' : 'text-[#39FF14]'}`}>{hp}</span>
            <span className="text-xs font-mono text-[#4B5365] self-end">/{gameState.maxHealth||100}</span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <Shield size={12} className="text-[#00E5FF]" />
            <span className="text-xs font-mono text-[#8B93A6] uppercase tracking-wider">ARMOR</span>
          </div>
          <div className="h-1 bg-white/10 mb-0.5">
            <div className="h-full bg-[#00E5FF] transition-all duration-300" style={{ width:`${armPct}%` }} />
          </div>
          <span className="text-sm font-['Rajdhani'] font-bold text-[#00E5FF]">{arm}</span>
        </div>
      </div>

      {/* ── Bottom Right — Weapon / Ammo ── */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3">
          <p className="text-xs font-mono text-[#4B5365] uppercase tracking-wider mb-1">{gameState.weaponName||'WEAPON'}</p>
          <div className="flex items-baseline gap-1">
            <span className={`ammo-counter ${isLowAmmo ? 'text-[#FFB800]' : 'text-white'}`}>
              {gameState.isReloading ? '--' : (gameState.ammo||0)}
            </span>
            <span className="text-lg font-['Rajdhani'] text-[#4B5365]">/ {gameState.maxAmmo||30}</span>
          </div>
          {gameState.isReloading && <p className="text-xs font-mono text-[#FFB800] mt-1 animate-pulse">RELOADING...</p>}
          {isLowAmmo && !gameState.isReloading && <p className="text-xs font-mono text-[#FFB800] mt-1 animate-pulse">[R] RELOAD</p>}
        </div>
      </div>

      {/* ── Bottom Center — Stance ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none flex gap-3">
        {gameState.isCrouching && <span className="text-xs font-mono text-[#00E5FF] bg-black/40 px-2 py-1 border border-[#00E5FF]/30">CROUCHED</span>}
        {gameState.isADS       && <span className="text-xs font-mono text-[#FFB800] bg-black/40 px-2 py-1 border border-[#FFB800]/30">ADS</span>}
        {gameState.isSprinting && <span className="text-xs font-mono text-[#39FF14] bg-black/40 px-2 py-1 border border-[#39FF14]/30">SPRINT</span>}
        {gameState.leaning!==0 && <span className="text-xs font-mono text-[#9B59B6] bg-black/40 px-2 py-1 border border-[#9B59B6]/30">LEAN {gameState.leaning===-1?'L':'R'}</span>}
      </div>
    </div>
  );
}