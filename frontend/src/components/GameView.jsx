import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { getOperator } from '../game/Operators';
import GameHUD from './GameHUD';
import GameOver from './GameOver';

export default function GameView({ mode, roomId, playerName, operatorId, onExit }) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const wsRef = useRef(null);
  const [isLocked, setIsLocked] = useState(false);
  const [gameState, setGameState] = useState({
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 50,
    ammo: 30,
    maxAmmo: 30,
    weaponName: 'CR-7 Assault Rifle',
    weaponType: 'rifle',
    isReloading: false,
    kills: 0,
    deaths: 0,
    heartHealth: 1000,
    heartMaxHealth: 1000,
    enemiesAlive: 0,
    wave: 1,
    gameOver: false,
    winner: null,
    isAlive: true,
    round: 1,
    maxRounds: 5,
    roundTimeLeft: 180,
    score: { humans: 0, aliens: 0 },
    isCrouching: false,
    isADS: false,
    isSprinting: false,
    leaning: 0,
    abilityCharge: 100,
    abilityActive: false,
    operatorId: operatorId,
    damageIndicators: []
  });

  const handleStateUpdate = useCallback((update) => {
    if (update.locked !== undefined) {
      setIsLocked(update.locked);
    }
    setGameState(prev => ({ ...prev, ...update }));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const operator = operatorId ? getOperator(operatorId) : getOperator('vanguard');
    
    engineRef.current = new GameEngine(containerRef.current, handleStateUpdate, {
      mode,
      operator
    });

    if (mode === 'multiplayer' && roomId) {
      connectWebSocket();
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const wsUrl = backendUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const endpoint = mode === 'singleplayer' 
      ? `${wsUrl}/ws/singleplayer`
      : `${wsUrl}/ws/game/${roomId}`;

    const ws = new WebSocket(endpoint);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ name: playerName || 'Commander', operator: operatorId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'game_state') {
        if (data.game_over) {
          setGameState(prev => ({ ...prev, gameOver: true, winner: data.winner }));
        }
      }
    };

    ws.onerror = () => {};
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restart();
      setGameState(prev => ({
        ...prev,
        health: 100,
        armor: 50,
        ammo: 30,
        kills: 0,
        deaths: 0,
        heartHealth: 1000,
        enemiesAlive: 0,
        wave: 1,
        gameOver: false,
        winner: null,
        isAlive: true,
        round: 1,
        score: { humans: 0, aliens: 0 },
        abilityCharge: 100,
        abilityActive: false
      }));
    }
  };

  const handleMenu = () => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    if (wsRef.current) wsRef.current.close();
    onExit();
  };

  return (
    <div data-testid="game-view" className="relative w-screen h-screen overflow-hidden">
      <div 
        ref={containerRef} 
        id="game-canvas"
        className="absolute inset-0"
        data-testid="game-canvas-container"
      />

      {/* Lock cursor prompt */}
      {!isLocked && !gameState.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
          <div className="text-center max-w-lg">
            <h2 className="text-2xl font-['Rajdhani'] font-bold text-[#00E5FF] uppercase mb-4">
              CLICK TO DEPLOY
            </h2>
            <p className="text-sm font-mono text-[#8B93A6] mb-4">
              Click anywhere to lock cursor and begin combat
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-[#4B5365] bg-black/40 border border-white/10 p-4 mb-6">
              <div className="text-left space-y-1">
                <p><span className="text-[#00E5FF]">WASD</span> - Move</p>
                <p><span className="text-[#00E5FF]">SHIFT</span> - Sprint</p>
                <p><span className="text-[#00E5FF]">C</span> - Crouch</p>
                <p><span className="text-[#00E5FF]">Q/E</span> - Lean L/R</p>
              </div>
              <div className="text-left space-y-1">
                <p><span className="text-[#00E5FF]">LMB</span> - Shoot</p>
                <p><span className="text-[#00E5FF]">RMB</span> - ADS</p>
                <p><span className="text-[#00E5FF]">R</span> - Reload</p>
                <p><span className="text-[#00E5FF]">F</span> - Ability</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-white/5">
                <p><span className="text-[#00E5FF]">1/2/3</span> or <span className="text-[#00E5FF]">SCROLL</span> - Switch weapon</p>
              </div>
            </div>
            <button
              onClick={handleMenu}
              data-testid="exit-to-menu-btn"
              className="bg-transparent border border-white/20 text-white hover:border-white hover:bg-white/10 transition-all duration-200 uppercase tracking-widest px-6 py-2 rounded-none text-xs font-mono"
            >
              BACK TO MENU
            </button>
          </div>
        </div>
      )}

      {/* HUD */}
      <GameHUD gameState={gameState} isLocked={isLocked} />

      {/* Game Over */}
      {gameState.gameOver && (
        <GameOver 
          winner={gameState.winner}
          kills={gameState.kills}
          deaths={gameState.deaths}
          round={gameState.round}
          score={gameState.score}
          onRestart={handleRestart}
          onMenu={handleMenu}
        />
      )}
    </div>
  );
}
