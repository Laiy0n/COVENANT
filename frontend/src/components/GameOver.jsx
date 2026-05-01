import React from 'react';
import { RotateCcw, Home, Trophy, Skull } from 'lucide-react';

export default function GameOver({ winner, kills, onRestart, onMenu }) {
  const isVictory = winner === 'humans';
  
  return (
    <div 
      className={`game-over-overlay ${isVictory ? 'victory-overlay' : ''}`}
      data-testid="game-over-screen"
    >
      <div className="text-center">
        {/* Icon */}
        <div className="mb-6">
          {isVictory ? (
            <Trophy size={64} className="text-[#00E5FF] mx-auto" />
          ) : (
            <Skull size={64} className="text-[#FF2A2A] mx-auto" />
          )}
        </div>
        
        {/* Title */}
        <h1 className={`text-5xl md:text-7xl font-bold tracking-tighter uppercase font-['Rajdhani'] mb-4 ${
          isVictory ? 'text-[#00E5FF] neon-cyan' : 'text-[#FF2A2A] neon-red'
        }`}>
          {isVictory ? 'RECURSION BROKEN' : 'MISSION FAILED'}
        </h1>
        
        <p className="text-[#8B93A6] font-mono text-sm mb-8 max-w-md mx-auto">
          {isVictory 
            ? 'The Heart has been destroyed. The vessel is safe... for now.'
            : 'The aliens overwhelmed the squad. The Heart grows stronger.'}
        </p>
        
        {/* Stats */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 inline-block mb-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-mono text-[#4B5365] uppercase tracking-widest">KILLS</p>
              <p className="text-3xl font-['Rajdhani'] font-bold text-white">{kills}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-[#4B5365] uppercase tracking-widest">RESULT</p>
              <p className={`text-3xl font-['Rajdhani'] font-bold ${isVictory ? 'text-[#00E5FF]' : 'text-[#FF2A2A]'}`}>
                {isVictory ? 'WIN' : 'LOSS'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            data-testid="restart-button"
            onClick={onRestart}
            className="bg-transparent border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#050508] transition-all duration-200 uppercase tracking-widest px-8 py-3 rounded-none shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] flex items-center gap-2 font-['Rajdhani'] font-semibold"
          >
            <RotateCcw size={16} />
            REDEPLOY
          </button>
          <button
            data-testid="menu-button"
            onClick={onMenu}
            className="bg-transparent border border-white/20 text-white hover:border-white hover:bg-white/10 transition-all duration-200 uppercase tracking-widest px-8 py-3 rounded-none flex items-center gap-2 font-['Rajdhani'] font-semibold"
          >
            <Home size={16} />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
