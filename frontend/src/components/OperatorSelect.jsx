import React, { useState } from 'react';
import { OPERATORS, ALIEN_OPERATORS } from '../game/Operators';
import { Shield, Zap, Heart, Eye, EyeOff, Scan, ChevronRight } from 'lucide-react';

const ICON_MAP = {
  'zap': Zap,
  'shield': Shield,
  'eye-off': EyeOff,
  'heart': Heart,
  'scan': Scan
};

export default function OperatorSelect({ onSelect, onBack }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);

  const displayOp = hovered ? OPERATORS.find(o => o.id === hovered) : selected ? OPERATORS.find(o => o.id === selected) : null;
  const maxStatHealth = Math.max(...OPERATORS.map(o => o.stats.health));
  const maxStatArmor = Math.max(...OPERATORS.map(o => o.stats.armor));
  const maxStatSpeed = Math.max(...OPERATORS.map(o => o.stats.speed));

  return (
    <div className="menu-bg" data-testid="operator-select">
      <div className="scanlines" />
      <div className="menu-content min-h-screen p-8 md:p-12 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight uppercase font-['Rajdhani'] text-white">
            SELECT OPERATIVE — {team === 'alien' ? 'COVENANT SPAWN' : 'HUMAN FORCES'}
          </h2>
          <p className="text-xs font-mono text-[#4B5365] tracking-wider">{team === 'alien' ? 'CHOOSE YOUR ALIEN FORM' : 'CHOOSE YOUR DEPLOYMENT SPECIALIST'}</p>
        </div>

        {/* Content Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Operator Cards */}
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
            {opList.map(op => {
              const IconComp = ICON_MAP[op.ability.icon] || Zap;
              return (
                <button
                  key={op.id}
                  data-testid={`operator-${op.id}`}
                  onMouseEnter={() => setHovered(op.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(op.id)}
                  className={`p-4 border text-left transition-all duration-200 ${
                    selected === op.id
                      ? 'border-[color:var(--op-color)] bg-[color:var(--op-color)]/10 shadow-[0_0_20px_var(--op-color-alpha)]'
                      : 'border-white/10 hover:border-white/30 bg-black/60'
                  }`}
                  style={{
                    '--op-color': op.color,
                    '--op-color-alpha': op.color + '33'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <IconComp size={16} style={{ color: op.color }} />
                    <span className="text-xs font-mono uppercase tracking-wider" style={{ color: op.color }}>
                      {op.role}
                    </span>
                  </div>
                  <h3 className="text-lg font-['Rajdhani'] font-bold text-white uppercase">{op.name}</h3>
                  <p className="text-xs font-mono text-[#8B93A6] mt-1 line-clamp-2">{op.description}</p>
                </button>
              );
            })}
          </div>

          {/* Detail Panel */}
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6">
            {displayOp ? (
              <>
                <div className="mb-4">
                  <span className="text-xs font-mono uppercase tracking-widest" style={{ color: displayOp.color }}>
                    {displayOp.role}
                  </span>
                  <h3 className="text-2xl font-['Rajdhani'] font-bold text-white uppercase mt-1">{displayOp.name}</h3>
                  <p className="text-sm font-mono text-[#8B93A6] mt-2">{displayOp.description}</p>
                </div>
                
                {/* Stats */}
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex justify-between text-xs font-mono text-[#8B93A6] mb-1">
                      <span>HEALTH</span>
                      <span>{displayOp.stats.health}</span>
                    </div>
                    <div className="h-1.5 bg-white/10">
                      <div className="h-full bg-[#39FF14]" style={{ width: `${(displayOp.stats.health / maxStatHealth) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-mono text-[#8B93A6] mb-1">
                      <span>ARMOR</span>
                      <span>{displayOp.stats.armor}</span>
                    </div>
                    <div className="h-1.5 bg-white/10">
                      <div className="h-full bg-[#00E5FF]" style={{ width: `${(displayOp.stats.armor / maxStatArmor) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-mono text-[#8B93A6] mb-1">
                      <span>SPEED</span>
                      <span>{Math.round(displayOp.stats.speed * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10">
                      <div className="h-full bg-[#FFB800]" style={{ width: `${(displayOp.stats.speed / maxStatSpeed) * 100}%` }} />
                    </div>
                  </div>
                </div>
                
                {/* Ability */}
                <div className="border border-white/10 p-3 mb-6">
                  <p className="text-xs font-mono text-[#4B5365] uppercase tracking-wider mb-1">ABILITY [F]</p>
                  <p className="text-sm font-['Rajdhani'] font-semibold text-white uppercase">{displayOp.ability.name}</p>
                  <p className="text-xs font-mono text-[#8B93A6] mt-1">{displayOp.ability.description}</p>
                  <p className="text-xs font-mono text-[#4B5365] mt-1">Cooldown: {displayOp.ability.cooldown}s</p>
                </div>
                
                {/* Weapons */}
                <div>
                  <p className="text-xs font-mono text-[#4B5365] uppercase tracking-wider mb-2">LOADOUT</p>
                  <div className="flex gap-2">
                    {displayOp.weapons.map((w, i) => (
                      <span key={w} className="text-xs font-mono text-[#8B93A6] bg-[#12141C] px-2 py-1 border border-white/10 uppercase">
                        [{i+1}] {w}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <p className="text-sm font-mono text-[#4B5365]">Select an operative to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={onBack}
            data-testid="operator-back-btn"
            className="bg-transparent border border-white/20 text-white hover:border-white hover:bg-white/10 transition-all duration-200 uppercase tracking-widest px-6 py-3 rounded-none font-['Rajdhani'] font-semibold text-sm"
          >
            BACK
          </button>
          <button
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            data-testid="operator-deploy-btn"
            className={`flex items-center gap-2 uppercase tracking-widest px-8 py-3 rounded-none font-['Rajdhani'] font-semibold transition-all duration-200 ${
              selected 
                ? 'border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#050508] shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] pulse-glow' 
                : 'border border-white/10 text-[#4B5365] cursor-not-allowed'
            }`}
          >
            DEPLOY
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}