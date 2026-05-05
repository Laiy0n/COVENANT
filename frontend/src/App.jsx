import React, { useState, useEffect } from "react";
import "@/App.css";
import MainMenu from "./components/MainMenu";
import GameView from "./components/GameView";
import Lobby from "./components/Lobby";
import SettingsPanel from "./components/SettingsPanel";
import OperatorSelect from "./components/OperatorSelect";
import TeamSelect from "./components/TeamSelect";

function App() {
  const [screen, setScreen] = useState('menu');
  const [gameConfig, setGameConfig] = useState({
    mode: 'singleplayer',
    roomId: null,
    playerName: 'Commander',
    operatorId: null,
    team: 'human'
  });

  useEffect(() => {
    const saved = localStorage.getItem('covenantSettings');
    if (saved) try { JSON.parse(saved); } catch { localStorage.removeItem('covenantSettings'); }
  }, []);

  const handleStartSingleplayer = () => {
    setGameConfig(prev => ({ ...prev, mode: 'singleplayer', roomId: null }));
    setScreen('team-select');
  };

  const handleStartMultiplayer = () => setScreen('lobby');
  const handleOpenSettings     = () => setScreen('settings');

  const handleTeamSelected = (team) => {
    setGameConfig(prev => ({ ...prev, team }));
    setScreen('operator-select');
  };

  const handleOperatorSelected = (operatorId) => {
    setGameConfig(prev => ({ ...prev, operatorId }));
    setScreen('game');
  };

  const handleJoinGame = (roomId, playerName) => {
    setGameConfig(prev => ({ ...prev, mode: 'multiplayer', roomId, playerName }));
    setScreen('team-select');
  };

  const handleExitGame = () => setScreen('menu');
  const handleBack     = () => setScreen('menu');

  return (
    <div className="App" data-testid="app-root">
      <div className="scanlines" />

      {screen === 'menu'          && <MainMenu onStartSingleplayer={handleStartSingleplayer} onStartMultiplayer={handleStartMultiplayer} onOpenSettings={handleOpenSettings} />}
      {screen === 'team-select'   && <TeamSelect onSelect={handleTeamSelected} onBack={handleBack} />}
      {screen === 'operator-select' && <OperatorSelect onSelect={handleOperatorSelected} onBack={() => setScreen('team-select')} team={gameConfig.team} />}
      {screen === 'game'          && <GameView mode={gameConfig.mode} roomId={gameConfig.roomId} playerName={gameConfig.playerName} operatorId={gameConfig.operatorId} team={gameConfig.team} onExit={handleExitGame} />}
      {screen === 'lobby'         && <Lobby onBack={handleBack} onStartGame={handleJoinGame} />}
      {screen === 'settings'      && <SettingsPanel onBack={handleBack} />}
    </div>
  );
}

export default App;