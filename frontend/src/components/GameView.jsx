import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import GameHUD from './GameHUD';
import GameOver from './GameOver';

export default function GameView({ mode, roomId, playerName, onExit }) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const wsRef = useRef(null);
  const [isLocked, setIsLocked] = useState(false);
  const [gameState, setGameState] = useState({
    health: 100,
    ammo: 30,
    maxAmmo: 30,
    kills: 0,
    heartHealth: 1000,
    heartMaxHealth: 1000,
    enemiesAlive: 0,
    wave: 1,
    gameOver: false,
    winner: null,
    isAlive: true
  });

  const handleStateUpdate = useCallback((update) => {
    if (update.locked !== undefined) {
      setIsLocked(update.locked);
    }
    if (update.health !== undefined) {
      setGameState(prev => ({ ...prev, ...update }));
    }
    if (update.damaged) {
      // Damage flash handled by HUD
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize game engine
    engineRef.current = new GameEngine(containerRef.current, handleStateUpdate);

    // Connect WebSocket for multiplayer
    if (mode === 'multiplayer' && roomId) {
      connectWebSocket();
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
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
      ws.send(JSON.stringify({ name: playerName || 'Commander' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'game_state') {
        // Update from server
        if (data.game_over) {
          setGameState(prev => ({
            ...prev,
            gameOver: true,
            winner: data.winner
          }));
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restart();
      setGameState({
        health: 100,
        ammo: 30,
        maxAmmo: 30,
        kills: 0,
        heartHealth: 1000,
        heartMaxHealth: 1000,
        enemiesAlive: 0,
        wave: 1,
        gameOver: false,
        winner: null,
        isAlive: true
      });
    }
  };

  const handleMenu = () => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    onExit();
  };

  return (
    <div data-testid="game-view" className="relative w-screen h-screen overflow-hidden">
      {/* Three.js Canvas Container */}
      <div 
        ref={containerRef} 
        id="game-canvas"
        className="absolute inset-0"
        data-testid="game-canvas-container"
      />

      {/* Lock cursor prompt */}
      {!isLocked && !gameState.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <h2 className="text-2xl font-['Rajdhani'] font-bold text-[#00E5FF] uppercase mb-4">
              CLICK TO DEPLOY
            </h2>
            <p className="text-sm font-mono text-[#8B93A6] mb-2">
              Click anywhere to lock cursor and begin combat
            </p>
            <p className="text-xs font-mono text-[#4B5365]">
              WASD: Move | Mouse: Aim | Click: Shoot | R: Reload | Shift: Sprint
            </p>
            <button
              onClick={handleMenu}
              data-testid="exit-to-menu-btn"
              className="mt-6 bg-transparent border border-white/20 text-white hover:border-white hover:bg-white/10 transition-all duration-200 uppercase tracking-widest px-6 py-2 rounded-none text-xs font-mono"
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
          onRestart={handleRestart}
          onMenu={handleMenu}
        />
      )}
    </div>
  );
}
