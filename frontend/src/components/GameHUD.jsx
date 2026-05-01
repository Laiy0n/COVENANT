import React, { useState, useEffect } from 'react';
import { Heart, Shield, Crosshair, Zap, Clock, Target } from 'lucide-react';

export default function GameHUD({ gameState, isLocked }) {
  const [showDamage, setShowDamage] = useState(false);
  const [prevHealth, setPrevHealth] = useState(100);

  useEffect(() => {
    if (gameState.health < prevHealth && prevHealth > 0) {
      setShowDamage(true);
      setTimeout(() => setShowDamage(false), 500);
    }
    setPrevHealth(gameState.health);
  }, [gameState.health]);

  if (!isLocked) return null;

  const healthPercent = (gameState.health / gameState.maxHealth) * 100;
  const armorPercent = (gameState.armor / gameState.maxArmor) * 100;
  const heartPercent = (gameState.heartHealth / gameState.heartMaxHealth) * 100;
  const isLowHealth = healthPercent < 30;
  const isLowAmmo = gameState.ammo <= 5;
  const abilityPercent = gameState.abilityCharge || 0;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="hud-overlay" data-testid="game-hud">
      {/* Damage vignette */}
      {showDamage && <div className="damage-vignette" />}
      
      {/* Damage direction indicators */}
      {gameState.damageIndicators && gameState.damageIndicators.map((ind, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{
            transform: `translate(-50%, -50%) rotate(${ind.angle}rad) translateY(-120px)`,
            opacity: ind.intensity
          }}
        >
          <div className="w-2 h-8 bg-[#FF2A2A]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        </div>
      ))}
      
      {/* Crosshair */}
      <div className="crosshair" data-testid="crosshair">
        {gameState.isADS ? (
          <div className="relative">
            <div className="w-px h-4 bg-white/80 absolute -top-2 left-1/2 -translate-x-1/2" />
            <div className="w-px h-4 bg-white/80 absolute top-2 left-1/2 -translate-x-1/2" />
            <div className="w-4 h-px bg-white/80 absolute top-1/2 -left-2 -translate-y-1/2" />
            <div className="w-4 h-px bg-white/80 absolute top-1/2 left-2 -translate-y-1/2" />
            <div className="w-1 h-1 bg-red-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        ) : (
          <Crosshair size={20} className="text-white/60" strokeWidth={1} />
        )}
      </div>
      
      {/* Top Center - Round info + Timer */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-6 py-2">
          <div className="flex items-center gap-4 mb-1">
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-[#FFB800]" />
              <span className={`text-sm font-['Rajdhani'] font-bold ${gameState.roundTimeLeft <= 30 ? 'text-[#FF2A2A] animate-pulse' : 'text-white'}`}>
                {formatTime(gameState.roundTimeLeft || 0)}
              </span>
            </div>
            <div className="text-xs font-mono text-[#8B93A6]">
              R{gameState.round}/{gameState.maxRounds}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[#00E5FF]">{gameState.score?.humans || 0}</span>
              <span className="text-[#4B5365]">-</span>
              <span className="text-[#FF2A2A]">{gameState.score?.aliens || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target size={10} className="text-[#FF2A2A]" />
            <span className="text-xs font-mono text-[#FF2A2A] uppercase tracking-wider">DESTROY THE HEART</span>
          </div>
          {/* Heart Health Bar */}
          <div className="mt-1 w-48 mx-auto">
            <div className="h-1 bg-white/10 relative overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ width: `${heartPercent}%`, background: 'linear-gradient(90deg, #FF2A2A, #ff6666)' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Right - Wave / Kills */}
      <div className="absolute top-4 right-4 text-right pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 min-w-[120px]">
          <p className="text-xs font-mono tracking-[0.2em] text-[#4B5365] uppercase">WAVE</p>
          <p className="text-xl font-['Rajdhani'] font-bold text-[#00E5FF]">{gameState.wave || 1}</p>
          <div className="mt-1 flex items-center gap-1 justify-end">
            <Zap size={10} className="text-[#FFB800]" />
            <span className="text-xs font-mono text-[#FFB800]">{gameState.kills}</span>
          </div>
          <div className="mt-0.5 text-xs font-mono text-[#8B93A6]">{gameState.enemiesAlive || 0} hostiles</div>
        </div>
      </div>
      
      {/* Bottom Left - Health + Armor */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 min-w-[180px]">
          {/* Operator Ability */}
          {gameState.operatorId && (
            <div className="mb-2 pb-2 border-b border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#4B5365] uppercase">[F] ABILITY</span>
                <span className={`text-xs font-mono ${abilityPercent >= 100 ? 'text-[#39FF14]' : 'text-[#4B5365]'}`}>
                  {Math.round(abilityPercent)}%
                </span>
              </div>
              <div className="h-1 bg-white/10 mt-1">
                <div 
                  className={`h-full transition-all duration-300 ${gameState.abilityActive ? 'bg-[#FFB800]' : 'bg-[#39FF14]'}`}
                  style={{ width: `${abilityPercent}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Health */}
          <div className="flex items-center gap-2 mb-1">
            <Heart size={12} className={isLowHealth ? 'text-[#FF2A2A]' : 'text-[#39FF14]'} />
            <span className="text-xs font-mono text-[#8B93A6] uppercase tracking-wider">HP</span>
          </div>
          <div className="health-bar mb-1">
            <div className={`health-bar-fill ${isLowHealth ? 'low' : ''}`} style={{ width: `${healthPercent}%` }} />
          </div>
          <div className="flex justify-between mb-2">
            <span className={`text-xl font-['Rajdhani'] font-bold ${isLowHealth ? 'text-[#FF2A2A]' : 'text-[#39FF14]'}`}>
              {Math.round(gameState.health)}
            </span>
            <span className="text-xs font-mono text-[#4B5365] self-end">/{gameState.maxHealth}</span>
          </div>
          
          {/* Armor */}
          <div className="flex items-center gap-2 mb-1">
            <Shield size={12} className="text-[#00E5FF]" />
            <span className="text-xs font-mono text-[#8B93A6] uppercase tracking-wider">ARMOR</span>
          </div>
          <div className="h-1 bg-white/10 mb-0.5">
            <div className="h-full bg-[#00E5FF] transition-all duration-300" style={{ width: `${armorPercent}%` }} />
          </div>
          <span className="text-sm font-['Rajdhani'] font-bold text-[#00E5FF]">{Math.round(gameState.armor || 0)}</span>
        </div>
      </div>
      
      {/* Bottom Right - Weapon + Ammo */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3">
          <p className="text-xs font-mono text-[#4B5365] uppercase tracking-wider mb-1">
            {gameState.weaponName || 'WEAPON'}
          </p>
          <div className="flex items-baseline gap-1">
            <span className={`ammo-counter ${isLowAmmo ? 'text-[#FFB800]' : 'text-white'}`}>
              {gameState.isReloading ? '--' : gameState.ammo}
            </span>
            <span className="text-lg font-['Rajdhani'] text-[#4B5365]">/ {gameState.maxAmmo}</span>
          </div>
          {gameState.isReloading && (
            <p className="text-xs font-mono text-[#FFB800] mt-1 animate-pulse">RELOADING...</p>
          )}
          {isLowAmmo && !gameState.isReloading && (
            <p className="text-xs font-mono text-[#FFB800] mt-1 animate-pulse">[R] RELOAD</p>
          )}
        </div>
      </div>
      
      {/* Bottom Center - Stance indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none flex gap-3">
        {gameState.isCrouching && (
          <span className="text-xs font-mono text-[#00E5FF] bg-black/40 px-2 py-1 border border-[#00E5FF]/30">CROUCHED</span>
        )}
        {gameState.isADS && (
          <span className="text-xs font-mono text-[#FFB800] bg-black/40 px-2 py-1 border border-[#FFB800]/30">ADS</span>
        )}
        {gameState.isSprinting && (
          <span className="text-xs font-mono text-[#39FF14] bg-black/40 px-2 py-1 border border-[#39FF14]/30">SPRINT</span>
        )}
        {gameState.leaning !== 0 && (
          <span className="text-xs font-mono text-[#9B59B6] bg-black/40 px-2 py-1 border border-[#9B59B6]/30">
            LEAN {gameState.leaning === -1 ? 'L' : 'R'}
          </span>
        )}
      </div>
    </div>
  );
}
