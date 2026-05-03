import React, { useState, useEffect } from 'react';
import { Settings, Play, Users, Volume2 } from 'lucide-react';

export default function MainMenu({ onStartSingleplayer, onStartMultiplayer, onOpenSettings }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPulse(p => p + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const menuItems = [
    { id: 'singleplayer', label: 'DEPLOY SOLO',   sublabel: 'Singleplayer — Destroy The Heart', icon: Play,     action: onStartSingleplayer },
    { id: 'multiplayer', label: 'SQUAD DEPLOY',   sublabel: 'Multiplayer Lobby',                 icon: Users,    action: onStartMultiplayer },
    { id: 'settings',    label: 'SYSTEMS',         sublabel: 'Settings & Controls',              icon: Settings, action: onOpenSettings },
  ];

  return (
    <div className="menu-bg" data-testid="main-menu">
      {/* Animated background — no external CDN needed */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Dark base */}
<div className="absolute inset-0 bg-[#0f0f1a]" />
        {/* Pulsing heart glow */}
        <div
          className="absolute rounded-full transition-all duration-[2000ms]"
          style={{
            right: '5%', top: '10%', width: '65vw', height: '80vh',
            background: `radial-gradient(ellipse at center,
              rgba(139,32,32,${0.25 + (pulse % 2) * 0.1}) 0%,
              rgba(80,10,10,0.2) 35%,
              transparent 70%)`,
          }}
        />
        {/* Cyan tech glow left */}
        <div className="absolute" style={{
          left: '-10%', bottom: '0', width: '50vw', height: '60vh',
          background: 'radial-gradient(ellipse at bottom left, rgba(0,229,255,0.06) 0%, transparent 65%)'
        }} />
        {/* Tendrils hint */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const x1 = 75 + Math.cos(angle) * 5, y1 = 45 + Math.sin(angle) * 5;
            const x2 = 75 + Math.cos(angle) * 45, y2 = 45 + Math.sin(angle) * 45;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8b2020" strokeWidth="0.3" />;
          })}
          <circle cx="75" cy="45" r="8" fill="none" stroke="#aa3030" strokeWidth="0.5" />
          <circle cx="75" cy="45" r="4" fill="rgba(139,32,32,0.4)" />
        </svg>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-[#050508]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-[#050508]/50" />
      </div>

      <div className="scanlines" />

      <div className="menu-content min-h-screen flex flex-col justify-between p-8 md:p-12">
        {/* Header */}
        <div className="flex justify-between items-start">
          <p className="text-xs tracking-[0.3em] text-[#8B93A6] font-mono uppercase">
            // TACTICAL OPERATIONS INTERFACE v2.1
          </p>
          <div className="flex items-center gap-2 text-xs text-[#4B5365]">
            <Volume2 size={14} />
            <span className="font-mono">SYS_ONLINE</span>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-lg">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase font-['Rajdhani'] text-white mb-1">
              COVENANT
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight uppercase font-['Rajdhani'] text-[#00E5FF] neon-cyan mb-8">
              RECURSION
            </h2>
            <p className="text-sm text-[#8B93A6] font-mono mb-12 max-w-md leading-relaxed">
              The Heart grows stronger. Humanity's creation turns against its creators.
              Deploy to the infected vessel. Destroy the recursion before it consumes all.
            </p>

            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  data-testid={`menu-${item.id}`}
                  className="menu-item w-full text-left flex items-center gap-4 group"
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={item.action}
                >
                  <item.icon size={18} className={`transition-colors duration-200 ${
                    hoveredItem === item.id ? 'text-[#00E5FF]' : 'text-[#4B5365]'
                  }`} />
                  <div>
                    <span className={`menu-text text-lg font-['Rajdhani'] font-semibold uppercase tracking-wider transition-colors duration-200 ${
                      hoveredItem === item.id ? 'text-[#00E5FF]' : 'text-white'
                    }`}>
                      {item.label}
                    </span>
                    <p className="text-xs text-[#4B5365] font-mono mt-0.5">{item.sublabel}</p>
                  </div>
                  {item.id === 'singleplayer' && hoveredItem === item.id && (
                    <span className="ml-auto text-[#00E5FF] text-xs font-mono animate-pulse">READY ▶</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end">
          <div className="text-xs text-[#4B5365] font-mono space-y-1">
            <p>CONTROLS: WASD + MOUSE | CLICK TO LOCK CURSOR</p>
            <p>R — RELOAD &nbsp;|&nbsp; F — ABILITY &nbsp;|&nbsp; ESC — UNLOCK</p>
          </div>
          <div className="text-xs text-[#4B5365] font-mono text-right">
            <p>BUILD 0.1.0_ALPHA</p>
            <p className="text-[#00E5FF]/50">COVENANT:RECURSION ENGINE</p>
          </div>
        </div>
      </div>
    </div>
  );
}