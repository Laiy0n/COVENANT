import React, { useState } from 'react';
import { OPERATORS } from '../game/Operators';
import { Shield, Zap, Heart, EyeOff, Scan, ChevronRight } from 'lucide-react';

const ICON_MAP = { 'zap': Zap, 'shield': Shield, 'eye-off': EyeOff, 'heart': Heart, 'scan': Scan };

export default function OperatorSelect({ onSelect, onBack }) {
  // Default to first operator so DEPLOY is always active
  const [selected, setSelected] = useState(OPERATORS[0].id);
  const [hovered, setHovered] = useState(null);

  const displayOp = OPERATORS.find(o => o.id === (hovered || selected));

  return (
    <div className="menu-bg" data-testid="operator-select">
      <div className="scanlines" />
      <div className="menu-content min-h-screen p-8 md:p-12 flex flex-col">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight uppercase font-['Rajdhani'] text-white">
            SELECT OPERATIVE
          </h2>
          <p className="text-xs font-mono text-[#4B5365] tracking-wider">CHOOSE YOUR DEPLOYMENT SPECIALIST</p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Operator Cards */}
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
            {OPERATORS.map(op => {
              const IconComp = ICON_MAP[op.ability.icon] || Zap;
              const isSelected = selected === op.id;
              return (
                <button
                  key={op.id}
                  data-testid={`operator-${op.id}`}
                  onMouseEnter={() => setHovered(op.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(op.id)}
                  className={`p-4 border text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-[color:var(--op-color)] bg-[color:var(--op-color)]/10 shadow-[0_0_20px_var(--op-color-alpha)]'
                      : 'border-white/10 hover:border-white/30 bg-black/60'
                  }`}
                  style={{ '--op-color': op.color, '--op-color-alpha': op.color + '33' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <IconComp size={16} style={{ color: op.color }} />
                    <span className="text-xs font-mono uppercase tracking-wider" style={{ color: op.color }}>
                      {op.role}
                    </span>
                  </div>
                  <h3 className="text-lg font-['Rajdhani'] font-bold text-white uppercase">{op.name}</h3>
                  <p className="text-xs font-mono text-[#8B93A6] mt-1 line-clamp-2">{op.description}</p>
                  {isSelected && (
                    <div className="mt-2 text-xs font-mono uppercase tracking-widest" style={{ color: op.color }}>
                      ✓ SELECTED
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail Panel */}
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6">
            {displayOp && (
              <>
                <div className="mb-4">
                  <span className="text-xs font-mono uppercase tracking-widest" style={{ color: displayOp.color }}>
                    {displayOp.role}
                  </span>
                  <h3 className="text-2xl font-['Rajdhani'] font-bold text-white uppercase mt-1">{displayOp.name}</h3>
                  <p className="text-sm font-mono text-[#8B93A6] mt-2">{displayOp.description}</p>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    { label: 'HEALTH', value: displayOp.stats.health, max: 130, color: '#39FF14' },
                    { label: 'ARMOR',  value: displayOp.stats.armor,  max: 100, color: '#00E5FF' },
                    { label: 'SPEED',  value: Math.round(displayOp.stats.speed * 100), max: 120, color: '#FFB800' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs font-mono text-[#8B93A6] mb-1">
                        <span>{s.label}</span><span>{s.value}{s.label === 'SPEED' ? '%' : ''}</span>
                      </div>
                      <div className="h-1.5 bg-white/10">
                        <div className="h-full transition-all" style={{ width: `${(s.value / s.max) * 100}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border border-white/10 p-3 mb-6">
                  <p className="text-xs font-mono text-[#4B5365] uppercase tracking-wider mb-1">ABILITY [F]</p>
                  <p className="text-sm font-['Rajdhani'] font-semibold text-white uppercase">{displayOp.ability.name}</p>
                  <p className="text-xs font-mono text-[#8B93A6] mt-1">{displayOp.ability.description}</p>
                  <p className="text-xs font-mono text-[#4B5365] mt-1">Cooldown: {displayOp.ability.cooldown}s</p>
                </div>

                <div>
                  <p className="text-xs font-mono text-[#4B5365] uppercase tracking-wider mb-2">LOADOUT</p>
                  <div className="flex flex-wrap gap-2">
                    {displayOp.weapons.map((w, i) => (
                      <span key={w} className="text-xs font-mono text-[#8B93A6] bg-[#12141C] px-2 py-1 border border-white/10 uppercase">
                        [{i+1}] {w}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={onBack}
            data-testid="operator-back-btn"
            className="bg-transparent border border-white/20 text-white hover:border-white hover:bg-white/10 transition-all duration-200 uppercase tracking-widest px-6 py-3 font-['Rajdhani'] font-semibold text-sm"
          >
            BACK
          </button>
          <button
            onClick={() => onSelect(selected)}
            data-testid="operator-deploy-btn"
            className="flex items-center gap-2 uppercase tracking-widest px-8 py-3 font-['Rajdhani'] font-semibold transition-all duration-200 border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#050508] shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)]"
          >
            DEPLOY <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}