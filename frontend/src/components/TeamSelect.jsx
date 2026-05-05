import React, { useState } from 'react';
import { Shield, Zap, ChevronRight } from 'lucide-react';

const TEAMS = [
  {
    id: 'human',
    name: 'HUMAN FORCES',
    subtitle: 'Counter-Terrorism Unit',
    role: 'ATTACK / DEFEND',
    color: '#00E5FF',
    description: 'Elite soldiers deployed to contain the COVENANT outbreak. Armed with conventional weapons and advanced operator abilities. Objective: eliminate all alien threats or plant the Neural Disruptor to destroy the Heart.',
    icon: Shield,
    abilities: ['Assault rifles, SMGs, snipers', 'Operator special abilities', 'Plant the Neural Disruptor [G]', 'Full weapon loadout'],
    spawnZone: 'Control Room (North)',
    winCondition: 'Kill all aliens OR plant & detonate the Neural Disruptor',
  },
  {
    id: 'alien',
    name: 'COVENANT SPAWN',
    subtitle: 'Children of the Heart',
    role: 'PROTECT / HUNT',
    color: '#FF2A6D',
    description: 'Creatures born from the Heart\'s corrupted biomass. Faster and more unpredictable than humans. Objective: eliminate all human intruders or destroy the Neural Disruptor before it detonates.',
    icon: Zap,
    abilities: ['Blood spit projectiles (LMB)', 'Enhanced speed & agility', 'Protect the Heart', 'Destroy the planted device'],
    spawnZone: 'Heart Chamber (South)',
    winCondition: 'Kill all humans OR destroy the Neural Disruptor',
  },
];

export default function TeamSelect({ onSelect, onBack }) {
  const [hovered, setHovered] = useState('human');

  const display = TEAMS.find(t => t.id === hovered);

  return (
    <div className="menu-bg" data-testid="team-select">
      <div className="scanlines" />
      <div className="menu-content min-h-screen p-8 md:p-12 flex flex-col">

        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight uppercase font-['Rajdhani'] text-white">
            SELECT SIDE
          </h2>
          <p className="text-xs font-mono text-[#4B5365] tracking-wider">CHOOSE YOUR ALLEGIANCE — HUMANS VS COVENANT</p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {TEAMS.map(team => {
            const Icon = team.icon;
            const isHovered = hovered === team.id;
            return (
              <button
                key={team.id}
                onMouseEnter={() => setHovered(team.id)}
                onClick={() => onSelect(team.id)}
                className={`relative p-8 border-2 text-left flex flex-col transition-all duration-300 group ${
                  isHovered
                    ? 'bg-black/60 scale-[1.01]'
                    : 'bg-black/30 border-white/10 hover:border-white/30'
                }`}
                style={isHovered ? { borderColor: team.color, boxShadow: `0 0 40px ${team.color}22` } : {}}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-mono tracking-[0.25em] mb-1" style={{ color: team.color }}>
                      {team.role}
                    </p>
                    <h3 className="text-3xl font-['Rajdhani'] font-bold text-white uppercase">{team.name}</h3>
                    <p className="text-sm font-mono mt-1" style={{ color: team.color }}>{team.subtitle}</p>
                  </div>
                  <Icon size={40} style={{ color: team.color, opacity: isHovered ? 1 : 0.4 }} />
                </div>

                <p className="text-sm font-mono text-[#8B93A6] mb-6 leading-relaxed">{team.description}</p>

                <div className="space-y-1 mb-4">
                  {team.abilities.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono text-[#8B93A6]">
                      <span style={{ color: team.color }}>▸</span> {a}
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 space-y-1">
                  <p className="text-xs font-mono text-[#4B5365]">Spawn: <span className="text-[#8B93A6]">{team.spawnZone}</span></p>
                  <p className="text-xs font-mono text-[#4B5365]">Win: <span className="text-[#8B93A6]">{team.winCondition}</span></p>
                </div>

                <div className={`absolute bottom-6 right-6 flex items-center gap-1 text-sm font-['Rajdhani'] font-bold uppercase tracking-widest transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                  style={{ color: team.color }}>
                  SELECT <ChevronRight size={16} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button onClick={onBack}
            className="bg-transparent border border-white/20 text-white hover:border-white hover:bg-white/10 transition-all uppercase tracking-widest px-6 py-3 font-['Rajdhani'] font-semibold text-sm">
            BACK
          </button>
          <p className="text-xs font-mono text-[#4B5365]">Click a side to continue to operator selection</p>
        </div>
      </div>
    </div>
  );
}
