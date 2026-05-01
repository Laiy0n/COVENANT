import React, { useState, useEffect } from 'react';
import { Heart, Crosshair, Shield, Zap } from 'lucide-react';

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

  const healthPercent = (gameState.health / 100) * 100;
  const heartPercent = (gameState.heartHealth / gameState.heartMaxHealth) * 100;
  const isLowHealth = healthPercent < 30;
  const isLowAmmo = gameState.ammo <= 5;

  return (
    <div className="hud-overlay" data-testid="game-hud">
      {/* Damage vignette */}
      {showDamage && <div className="damage-vignette" />}
      
      {/* Crosshair */}
      <div className="crosshair" data-testid="crosshair">
        <Crosshair size={24} className="text-white/70" strokeWidth={1} />
      </div>
      
      {/* Top Center - Objective */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-6 py-2">
          <p className="text-xs font-mono tracking-[0.2em] text-[#8B93A6] uppercase">
            OBJECTIVE
          </p>
          <p className="text-sm font-['Rajdhani'] font-semibold text-[#FF2A2A] uppercase tracking-wider mt-1">
            DESTROY THE HEART
          </p>
          {/* Heart Health Bar */}
          <div className="mt-2 w-48 mx-auto">
            <div className="h-1.5 bg-white/10 relative overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${heartPercent}%`,
                  background: `linear-gradient(90deg, #FF2A2A, #ff6666)`
                }}
              />
            </div>
            <p className="text-xs font-mono text-[#FF2A2A] mt-1">
              {Math.round(gameState.heartHealth)} / {gameState.heartMaxHealth}
            </p>
          </div>
        </div>
      </div>
      
      {/* Top Right - Wave / Kills */}
      <div className="absolute top-6 right-6 text-right pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3">
          <p className="text-xs font-mono tracking-[0.2em] text-[#4B5365] uppercase">WAVE</p>
          <p className="text-2xl font-['Rajdhani'] font-bold text-[#00E5FF]">{gameState.wave || 1}</p>
          <div className="mt-2 flex items-center gap-2">
            <Zap size={12} className="text-[#FFB800]" />
            <span className="text-xs font-mono text-[#FFB800]">{gameState.kills} KILLS</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs font-mono text-[#8B93A6]">{gameState.enemiesAlive || 0} HOSTILES</span>
          </div>
        </div>
      </div>
      
      {/* Bottom Left - Health */}
      <div className="absolute bottom-6 left-6 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Heart size={14} className={isLowHealth ? 'text-[#FF2A2A]' : 'text-[#39FF14]'} />
            <span className="text-xs font-mono tracking-[0.2em] text-[#8B93A6] uppercase">VITALS</span>
          </div>
          <div className="health-bar mb-1">
            <div 
              className={`health-bar-fill ${isLowHealth ? 'low' : ''}`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className={`text-2xl font-['Rajdhani'] font-bold ${isLowHealth ? 'text-[#FF2A2A]' : 'text-[#39FF14]'}`}>
              {Math.round(gameState.health)}
            </span>
            <span className="text-xs font-mono text-[#4B5365] self-end">/ 100</span>
          </div>
        </div>
      </div>
      
      {/* Bottom Right - Ammo */}
      <div className="absolute bottom-6 right-6 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-[#00E5FF]" />
            <span className="text-xs font-mono tracking-[0.2em] text-[#8B93A6] uppercase">AMMO</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`ammo-counter ${isLowAmmo ? 'text-[#FFB800]' : 'text-white'}`}>
              {gameState.ammo}
            </span>
            <span className="text-lg font-['Rajdhani'] text-[#4B5365]">/ {gameState.maxAmmo}</span>
          </div>
          {isLowAmmo && (
            <p className="text-xs font-mono text-[#FFB800] mt-1 animate-pulse">
              [R] RELOAD
            </p>
          )}
        </div>
      </div>
      
      {/* Bottom Center - Interaction hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-xs font-mono text-[#4B5365] tracking-wider">
          ESC TO UNLOCK CURSOR
        </p>
      </div>
    </div>
  );
}
