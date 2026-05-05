import React, { useState } from 'react';
import { getOperatorsByTeam } from '../game/Operators';
import { Shield, Zap, Heart, EyeOff, Scan, ChevronRight } from 'lucide-react';

const ICON_MAP = { zap: Zap, shield: Shield, 'eye-off': EyeOff, heart: Heart, scan: Scan };

export default function OperatorSelect({ onSelect, onBack, team }) {
  const opList = getOperatorsByTeam(team || 'human');
  const [selected, setSelected] = useState(opList[0].id);
  const [hovered,  setHovered]  = useState(null);

  const displayOp = opList.find(o => o.id === (hovered || selected));
  const maxHP  = Math.max(...opList.map(o => o.stats.health));
  const maxARM = Math.max(...opList.map(o => o.stats.armor));
  const maxSPD = Math.max(...opList.map(o => o.stats.speed));

  const isAlien = team === 'alien';
  const accentColor = isAlien ? '#FF2A6D' : '#00E5FF';

  return (
    <div className="menu-bg" data-testid="operator-select">
      <div className="scanlines" />
      <div className="menu-content min-h-screen p-8 md:p-12 flex flex-col">

        <div className="mb-8">
          <p className="text-xs font-mono tracking-[0.3em] mb-1" style={{ color: accentColor }}>
            {isAlien ? '// COVENANT SPAWN — CHOOSE YOUR FORM' : '// HUMAN FORCES — CHOOSE YOUR OPERATIVE'}
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight uppercase font-['Rajdhani'] text-white">
            {isAlien ? 'SELECT ALIEN FORM' : 'SELECT OPERATIVE'}
          </h2>
          <p className="text-xs font-mono text-[#4B5365] tracking-wider mt-1">
            {isAlien
              ? 'YOU WILL PLAY AS THIS ALIEN. THE OTHER 4 SPAWN AS YOUR AI ALLIES.'
              : 'YOU WILL PLAY AS THIS OPERATIVE. THE OTHER 4 SPAWN AS YOUR AI ALLIES.'}
          </p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cards */}
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
            {opList.map(op => {
              const Icon = ICON_MAP[op.ability.icon] || Zap;
              const isSel = selected === op.id;
              return (
                <button key={op.id}
                  data-testid={`operator-${op.id}`}
                  onMouseEnter={() => setHovered(op.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(op.id)}
                  className={`p-4 border text-left transition-all duration-200 ${
                    isSel ? 'bg-black/60' : 'border-white/10 hover:border-white/30 bg-black/40'
                  }`}
                  style={isSel ? { borderColor: op.color, boxShadow: `0 0 16px ${op.color}33` } : {}}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} style={{ color: op.color }} />
                    <span className="text-xs font-mono uppercase tracking-wider" style={{ color: op.color }}>{op.role}</span>
                  </div>
                  <h3 className="text-base font-['Rajdhani'] font-bold text-white uppercase leading-tight">{op.name}</h3>
                  <p className="text-xs font-mono text-[#8B93A6] mt-1 line-clamp-2">{op.description}</p>
                  {isSel && <p className="text-xs font-mono mt-2 uppercase tracking-widest" style={{ color: op.color }}>✓ SELECTED</p>}
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 flex flex-col">
            {displayOp ? (
              <>
                <div className="mb-4">
                  <span className="text-xs font-mono uppercase tracking-widest" style={{ color: displayOp.color }}>{displayOp.role}</span>
                  <h3 className="text-2xl font-['Rajdhani'] font-bold text-white uppercase mt-1">{displayOp.name}</h3>
                  <p className="text-sm font-mono text-[#8B93A6] mt-2 leading-relaxed">{displayOp.description}</p>
                </div>

                <div className="space-y-2 mb-5">
                  {[
                    { label: 'HEALTH', val: displayOp.stats.health,               max: maxHP,  color: '#39FF14', unit: '' },
                    { label: 'ARMOR',  val: displayOp.stats.armor,                max: maxARM, color: '#00E5FF', unit: '' },
                    { label: 'SPEED',  val: Math.round(displayOp.stats.speed*100), max: Math.round(maxSPD*100), color: '#FFB800', unit: '%' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs font-mono text-[#8B93A6] mb-0.5">
                        <span>{s.label}</span><span>{s.val}{s.unit}</span>
                      </div>
                      <div className="h-1.5 bg-white/10">
                        <div className="h-full transition-all" style={{ width: `${(s.val/s.max)*100}%`, background: s.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border border-white/10 p-3 mb-5">
                  <p className="text-xs font-mono text-[#4B5365] uppercase tracking-wider mb-1">ABILITY [F]</p>
                  <p className="text-sm font-['Rajdhani'] font-semibold text-white uppercase">{displayOp.ability.name}</p>
                  <p className="text-xs font-mono text-[#8B93A6] mt-1">{displayOp.ability.description}</p>
                  <p className="text-xs font-mono text-[#4B5365] mt-1">Cooldown: {displayOp.ability.cooldown}s</p>
                </div>

                <div className="mt-auto">
                  <p className="text-xs font-mono text-[#4B5365] uppercase tracking-wider mb-2">ATTACKS</p>
                  <div className="flex flex-wrap gap-1">
                    {displayOp.weapons.map((w, i) => (
                      <span key={i} className="text-xs font-mono text-[#8B93A6] bg-[#12141C] px-2 py-1 border border-white/10 uppercase">
                        [{i+1}] {w}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm font-mono text-[#4B5365]">Select an operative</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <button onClick={onBack}
            className="bg-transparent border border-white/20 text-white hover:border-white hover:bg-white/10 transition-all uppercase tracking-widest px-6 py-3 font-['Rajdhani'] font-semibold text-sm">
            BACK
          </button>
          <button
            onClick={() => onSelect(selected)}
            className="flex items-center gap-2 uppercase tracking-widest px-8 py-3 font-['Rajdhani'] font-semibold transition-all duration-200 border"
            style={{ borderColor: accentColor, color: accentColor }}
            data-testid="operator-deploy-btn"
          >
            DEPLOY <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}