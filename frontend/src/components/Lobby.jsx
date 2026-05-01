import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Copy, Wifi } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Lobby({ onBack, onStartGame }) {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms`);
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (e) {
      console.error('Failed to fetch rooms', e);
    }
  };

  const createRoom = async () => {
    try {
      setCreating(true);
      const res = await fetch(`${BACKEND_URL}/api/rooms/create`, { method: 'POST' });
      const data = await res.json();
      setRoomId(data.room_id);
      setCreating(false);
    } catch (e) {
      console.error('Failed to create room', e);
      setCreating(false);
    }
  };

  const joinRoom = (id) => {
    if (!playerName.trim()) {
      alert('Enter your callsign first');
      return;
    }
    onStartGame(id, playerName);
  };

  return (
    <div className="menu-bg" data-testid="lobby-screen">
      <div className="scanlines" />
      <div className="menu-content min-h-screen p-8 md:p-12 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={onBack}
            data-testid="lobby-back-btn"
            className="text-[#8B93A6] hover:text-[#00E5FF] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight uppercase font-['Rajdhani'] text-white">
              SQUAD DEPLOYMENT
            </h2>
            <p className="text-xs font-mono text-[#4B5365] tracking-wider">MULTIPLAYER LOBBY</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left - Player Setup */}
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6">
            <h3 className="text-xl font-['Rajdhani'] font-semibold uppercase tracking-wide text-[#00E5FF] mb-4">
              OPERATIVE INFO
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#8B93A6] uppercase tracking-widest block mb-2">
                  CALLSIGN
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter callsign..."
                  data-testid="player-name-input"
                  className="w-full bg-[#12141C] border border-white/10 px-4 py-3 text-white font-mono text-sm focus:border-[#00E5FF] focus:outline-none transition-colors placeholder:text-[#4B5365]"
                />
              </div>
              
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={createRoom}
                  disabled={creating}
                  data-testid="create-room-btn"
                  className="w-full bg-transparent border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#050508] transition-all duration-200 uppercase tracking-widest px-6 py-3 rounded-none shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_20px_rgba(0,229,255,0.6)] font-['Rajdhani'] font-semibold text-sm"
                >
                  {creating ? 'INITIALIZING...' : 'CREATE NEW ROOM'}
                </button>
              </div>
              
              {roomId && (
                <div className="mt-4 bg-[#12141C] border border-[#00E5FF]/30 p-3">
                  <p className="text-xs font-mono text-[#8B93A6] mb-1">ROOM CODE:</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-['Rajdhani'] font-bold text-[#00E5FF]">{roomId}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(roomId)}
                      className="text-[#4B5365] hover:text-[#00E5FF] transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => joinRoom(roomId)}
                    data-testid="join-own-room-btn"
                    className="mt-2 w-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] px-4 py-2 text-xs font-mono uppercase hover:bg-[#00E5FF]/20 transition-colors"
                  >
                    JOIN YOUR ROOM
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Center/Right - Available Rooms */}
          <div className="md:col-span-2 bg-black/60 backdrop-blur-md border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-['Rajdhani'] font-semibold uppercase tracking-wide text-white">
                ACTIVE DEPLOYMENTS
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono text-[#39FF14]">
                <Wifi size={12} />
                <span>LIVE</span>
              </div>
            </div>
            
            {rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Users size={32} className="text-[#4B5365] mb-3" />
                <p className="text-sm font-mono text-[#4B5365]">No active rooms</p>
                <p className="text-xs font-mono text-[#4B5365] mt-1">Create a room to begin</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="player-slot occupied flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-['Rajdhani'] font-semibold text-white uppercase">
                        ROOM: {room.id}
                      </p>
                      <p className="text-xs font-mono text-[#8B93A6]">
                        {room.players} operative(s) deployed
                      </p>
                    </div>
                    <button
                      onClick={() => joinRoom(room.id)}
                      data-testid={`join-room-${room.id}`}
                      className="bg-transparent border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#050508] transition-all duration-200 uppercase tracking-widest px-4 py-2 rounded-none text-xs font-['Rajdhani'] font-semibold"
                    >
                      DEPLOY
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Direct Join */}
            <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-xs font-mono text-[#4B5365] mb-2 uppercase tracking-wider">DIRECT JOIN</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Room code..."
                  data-testid="direct-join-input"
                  className="flex-1 bg-[#12141C] border border-white/10 px-4 py-2 text-white font-mono text-sm focus:border-[#00E5FF] focus:outline-none transition-colors placeholder:text-[#4B5365]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') joinRoom(e.target.value);
                  }}
                  onChange={(e) => setRoomId(e.target.value)}
                />
                <button
                  onClick={() => joinRoom(roomId)}
                  data-testid="direct-join-btn"
                  className="bg-transparent border border-white/20 text-white hover:border-[#00E5FF] hover:text-[#00E5FF] transition-all duration-200 uppercase tracking-widest px-4 py-2 rounded-none text-xs font-mono"
                >
                  CONNECT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
