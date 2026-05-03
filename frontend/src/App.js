import React, { useState } from "react";
import "@/App.css";
import MainMenu from "./components/MainMenu";
import GameView from "./components/GameView";
import Lobby from "./components/Lobby";
import SettingsPanel from "./components/SettingsPanel";
import OperatorSelect from "./components/OperatorSelect";

function App() {
  const [screen, setScreen] = useState('menu');
  const [gameConfig, setGameConfig] = useState({
    mode: 'singleplayer',
    roomId: null,
    playerName: 'Commander',
    operatorId: null
  });

  const handleStartSingleplayer = () => {
    setGameConfig(prev => ({ ...prev, mode: 'singleplayer', roomId: null }));
    setScreen('operator-select');
  };

  const handleStartMultiplayer = () => {
    setScreen('lobby');
  };

  const handleOpenSettings = () => {
    setScreen('settings');
  };

  const handleOperatorSelected = (operatorId) => {
    setGameConfig(prev => ({ ...prev, operatorId }));
    setScreen('game');
  };

  const handleJoinGame = (roomId, playerName) => {
    setGameConfig(prev => ({ ...prev, mode: 'multiplayer', roomId, playerName }));
    setScreen('operator-select');
  };

  const handleExitGame = () => {
    setScreen('menu');
  };

  const handleBack = () => {
    setScreen('menu');
  };

  return (
    <div className="App" data-testid="app-root">
      <div className="scanlines" />
      
      {screen === 'menu' && (
        <MainMenu 
          onStartSingleplayer={handleStartSingleplayer}
          onStartMultiplayer={handleStartMultiplayer}
          onOpenSettings={handleOpenSettings}
        />
      )}
      
      {screen === 'operator-select' && (
        <OperatorSelect
          onSelect={handleOperatorSelected}
          onBack={handleBack}
        />
      )}
      
      {screen === 'game' && (
        <GameView 
          mode={gameConfig.mode}
          roomId={gameConfig.roomId}
          playerName={gameConfig.playerName}
          operatorId={gameConfig.operatorId}
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