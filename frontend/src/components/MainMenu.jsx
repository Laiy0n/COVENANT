import React, { useState } from 'react';
import { Settings, Play, Users, Trophy, Volume2 } from 'lucide-react';

import MONSTER_IMG from "../assets/Heart.png";

export default function MainMenu({ onStartSingleplayer, onStartMultiplayer, onOpenSettings }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    { id: 'singleplayer', label: 'DEPLOY SOLO', sublabel: 'Singleplayer Campaign', icon: Play, action: onStartSingleplayer },
    { id: 'multiplayer', label: 'SQUAD DEPLOY', sublabel: 'Multiplayer Lobby', icon: Users, action: onStartMultiplayer },
    { id: 'settings', label: 'SYSTEMS', sublabel: 'Settings & Controls', icon: Settings, action: onOpenSettings },
  ];

  return (
    <div className="menu-bg" data-testid="main-menu">
      {/* Background monster image */}
      <div className="absolute inset-0">
        <img 
          src={MONSTER_IMG} 
          alt="" 
          className="w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-[#050508]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-[#050508]/40" />
      </div>
      
      {/* Scanlines */}
      <div className="scanlines" />
      
      {/* Content */}
      <div className="menu-content min-h-screen flex flex-col justify-between p-8 md:p-12">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs tracking-[0.3em] text-[#8B93A6] font-mono uppercase mb-2">
              // TACTICAL OPERATIONS INTERFACE v2.1
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#4B5365]">
            <Volume2 size={14} />
            <span className="font-mono">SYS_ONLINE</span>
          </div>
        </div>
        
        {/* Main content - Asymmetric layout */}
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-lg">
            {/* Title */}
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
            
            {/* Menu Items */}
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
                  <item.icon 
                    size={18} 
                    className={`transition-colors duration-200 ${
                      hoveredItem === item.id ? 'text-[#00E5FF]' : 'text-[#4B5365]'
                    }`}
                  />
                  <div>
                    <span className={`menu-text text-lg font-['Rajdhani'] font-semibold uppercase tracking-wider transition-colors duration-200 ${
                      hoveredItem === item.id ? 'text-[#00E5FF]' : 'text-white'
                    }`}>
                      {item.label}
                    </span>
                    <p className="text-xs text-[#4B5365] font-mono mt-0.5">{item.sublabel}</p>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-end">
          <div className="text-xs text-[#4B5365] font-mono space-y-1">
            <p>CONTROLS: WASD + MOUSE</p>
            <p>CLICK TO LOCK CURSOR // R TO RELOAD</p>
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