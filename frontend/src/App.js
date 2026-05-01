import React, { useState } from "react";
import "@/App.css";
import MainMenu from "./components/MainMenu";
import GameView from "./components/GameView";
import Lobby from "./components/Lobby";
import SettingsPanel from "./components/SettingsPanel";

function App() {
  const [screen, setScreen] = useState('menu');
  const [gameConfig, setGameConfig] = useState({
    mode: 'singleplayer',
    roomId: null,
    playerName: 'Commander'
  });

  const handleStartSingleplayer = () => {
    setGameConfig({ mode: 'singleplayer', roomId: null, playerName: 'Commander' });
    setScreen('game');
  };

  const handleStartMultiplayer = () => {
    setScreen('lobby');
  };

  const handleOpenSettings = () => {
    setScreen('settings');
  };

  const handleJoinGame = (roomId, playerName) => {
    setGameConfig({ mode: 'multiplayer', roomId, playerName });
    setScreen('game');
  };

  const handleExitGame = () => {
    setScreen('menu');
  };

  const handleBack = () => {
    setScreen('menu');
  };

  return (
    <div className="App" data-testid="app-root">
      {/* Scanlines overlay - always on */}
      <div className="scanlines" />
      
      {screen === 'menu' && (
        <MainMenu 
          onStartSingleplayer={handleStartSingleplayer}
          onStartMultiplayer={handleStartMultiplayer}
          onOpenSettings={handleOpenSettings}
        />
      )}
      
      {screen === 'game' && (
        <GameView 
          mode={gameConfig.mode}
          roomId={gameConfig.roomId}
          playerName={gameConfig.playerName}
          onExit={handleExitGame}
        />
      )}
      
      {screen === 'lobby' && (
        <Lobby 
          onBack={handleBack}
          onStartGame={handleJoinGame}
        />
      )}
      
      {screen === 'settings' && (
        <SettingsPanel onBack={handleBack} />
      )}
    </div>
  );
}

export default App;
