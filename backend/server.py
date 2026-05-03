from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import asyncio
import random
import math
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection - graceful fallback to in-memory if unavailable
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'covenant_recursion')
mongo_available = False
db = None

try:
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=3000)
    db = client[db_name]
    mongo_available = True
except Exception:
    pass

# In-memory fallback for leaderboard when MongoDB is unavailable
in_memory_leaderboard = []

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Game State Management
class GameRoom:
    def __init__(self, room_id: str, mode: str = "multiplayer"):
        self.room_id = room_id
        self.mode = mode
        self.players: Dict[str, dict] = {}
        self.connections: Dict[str, WebSocket] = {}
        self.enemies: List[dict] = []
        self.heart_health = 1000
        self.heart_max_health = 1000
        self.game_active = False
        self.game_over = False
        self.winner = None
        self.map_seed = random.randint(0, 99999)
        
    def add_player(self, player_id: str, name: str):
        self.players[player_id] = {
            "id": player_id,
            "name": name,
            "x": random.uniform(-5, 5),
            "y": 1.6,
            "z": random.uniform(-5, 5),
            "rotation_y": 0,
            "health": 100,
            "max_health": 100,
            "ammo": 30,
            "max_ammo": 30,
            "kills": 0,
            "deaths": 0,
            "team": "human",
            "alive": True
        }
        
    def remove_player(self, player_id: str):
        if player_id in self.players:
            del self.players[player_id]
        if player_id in self.connections:
            del self.connections[player_id]
            
    def spawn_enemies(self, count: int = 5):
        self.enemies = []
        for i in range(count):
            angle = (2 * math.pi / count) * i
            dist = random.uniform(15, 25)
            self.enemies.append({
                "id": f"alien_{i}",
                "x": math.cos(angle) * dist,
                "y": 1.5,
                "z": math.sin(angle) * dist,
                "health": 80,
                "max_health": 80,
                "speed": 3.0 + random.uniform(0, 2),
                "damage": 15,
                "alive": True,
                "type": random.choice(["crawler", "spitter", "brute"]),
                "target": None,
                "last_attack": 0
            })
            
    def get_state(self):
        return {
            "type": "game_state",
            "players": self.players,
            "enemies": [e for e in self.enemies if e["alive"]],
            "heart_health": self.heart_health,
            "heart_max_health": self.heart_max_health,
            "game_active": self.game_active,
            "game_over": self.game_over,
            "winner": self.winner,
            "map_seed": self.map_seed
        }

# Active game rooms
rooms: Dict[str, GameRoom] = {}

def get_or_create_room(room_id: str, mode: str = "multiplayer") -> GameRoom:
    if room_id not in rooms:
        rooms[room_id] = GameRoom(room_id, mode)
    return rooms[room_id]

# REST API Endpoints
@api_router.get("/")
async def root():
    return {"message": "COVENANT: RECURSION Server Online"}

@api_router.get("/rooms")
async def get_rooms():
    return {
        "rooms": [
            {
                "id": r.room_id,
                "players": len(r.players),
                "mode": r.mode,
                "game_active": r.game_active
            }
            for r in rooms.values()
        ]
    }

@api_router.post("/rooms/create")
async def create_room():
    room_id = str(uuid.uuid4())[:8]
    room = get_or_create_room(room_id)
    return {"room_id": room_id}

@api_router.get("/leaderboard")
async def get_leaderboard():
    if db is not None:
        try:
            leaders = await db.leaderboard.find({}, {"_id": 0}).sort("kills", -1).to_list(20)
            return {"leaderboard": leaders}
        except Exception:
            pass
    # Fallback to in-memory
    sorted_lb = sorted(in_memory_leaderboard, key=lambda x: x.get("kills", 0), reverse=True)[:20]
    return {"leaderboard": sorted_lb}

@api_router.post("/leaderboard")
async def update_leaderboard(data: dict):
    player_name = data.get("player_name", "Unknown")
    kills = data.get("kills", 0)
    deaths = data.get("deaths", 0)
    
    if db is not None:
        try:
            await db.leaderboard.update_one(
                {"player_name": player_name},
                {"$inc": {"kills": kills, "deaths": deaths},
                 "$set": {"last_played": datetime.now(timezone.utc).isoformat()}},
                upsert=True
            )
            return {"status": "ok"}
        except Exception:
            pass
    
    # Fallback to in-memory
    existing = next((p for p in in_memory_leaderboard if p.get("player_name") == player_name), None)
    if existing:
        existing["kills"] = existing.get("kills", 0) + kills
        existing["deaths"] = existing.get("deaths", 0) + deaths
    else:
        in_memory_leaderboard.append({"player_name": player_name, "kills": kills, "deaths": deaths})
    return {"status": "ok"}

# WebSocket Game Logic
async def game_loop(room: GameRoom):
    """Main game loop for AI enemies"""
    while room.game_active and not room.game_over:
        await asyncio.sleep(0.1)  # 10 ticks per second
        
        if not room.players:
            room.game_active = False
            break
            
        # Update enemy AI
        for enemy in room.enemies:
            if not enemy["alive"]:
                continue
                
            # Find closest player
            closest_dist = float('inf')
            closest_player = None
            for pid, player in room.players.items():
                if not player["alive"]:
                    continue
                dx = player["x"] - enemy["x"]
                dz = player["z"] - enemy["z"]
                dist = math.sqrt(dx*dx + dz*dz)
                if dist < closest_dist:
                    closest_dist = dist
                    closest_player = pid
                    
            if closest_player:
                player = room.players[closest_player]
                dx = player["x"] - enemy["x"]
                dz = player["z"] - enemy["z"]
                dist = math.sqrt(dx*dx + dz*dz)
                
                if dist > 2.0:
                    # Move toward player
                    speed = enemy["speed"] * 0.1
                    enemy["x"] += (dx / dist) * speed
                    enemy["z"] += (dz / dist) * speed
                else:
                    # Attack player
                    current_time = asyncio.get_event_loop().time()
                    if current_time - enemy["last_attack"] > 1.0:
                        enemy["last_attack"] = current_time
                        player["health"] -= enemy["damage"]
                        if player["health"] <= 0:
                            player["health"] = 0
                            player["alive"] = False
                            player["deaths"] += 1
                            
        # Check win conditions
        alive_players = [p for p in room.players.values() if p["alive"]]
        alive_enemies = [e for e in room.enemies if e["alive"]]
        
        if not alive_players:
            room.game_over = True
            room.winner = "aliens"
        elif room.heart_health <= 0:
            room.game_over = True
            room.winner = "humans"
        elif not alive_enemies and room.heart_health > 0 and not room.game_over:
            # All aliens dead — humans win the round
            room.game_over = True
            room.winner = "humans"
            
        # Broadcast state
        state = room.get_state()
        disconnected = []
        for pid, ws in room.connections.items():
            try:
                await ws.send_json(state)
            except Exception:
                disconnected.append(pid)
        for pid in disconnected:
            room.remove_player(pid)

@app.websocket("/ws/game/{room_id}")
async def websocket_game(websocket: WebSocket, room_id: str):
    await websocket.accept()
    player_id = str(uuid.uuid4())[:8]
    room = get_or_create_room(room_id)
    
    try:
        # Wait for player info
        data = await websocket.receive_json()
        player_name = data.get("name", f"Player_{player_id[:4]}")
        
        room.add_player(player_id, player_name)
        room.connections[player_id] = websocket
        
        # Send initial info
        await websocket.send_json({
            "type": "connected",
            "player_id": player_id,
            "room_id": room_id,
            "map_seed": room.map_seed
        })
        
        # Notify others
        for pid, ws in room.connections.items():
            if pid != player_id:
                try:
                    await ws.send_json({
                        "type": "player_joined",
                        "player": room.players[player_id]
                    })
                except Exception:
                    pass
        
        # Start game if not active
        if not room.game_active and len(room.players) >= 1:
            room.game_active = True
            room.spawn_enemies(5)
            asyncio.create_task(game_loop(room))
            
        # Main message loop
        while True:
            message = await websocket.receive_json()
            msg_type = message.get("type")
            
            if msg_type == "move":
                if player_id in room.players:
                    room.players[player_id]["x"] = message.get("x", 0)
                    room.players[player_id]["y"] = message.get("y", 1.6)
                    room.players[player_id]["z"] = message.get("z", 0)
                    room.players[player_id]["rotation_y"] = message.get("rotation_y", 0)
                    
            elif msg_type == "shoot":
                # Handle shooting - check hit detection
                hit_id = message.get("hit_id")
                hit_type = message.get("hit_type")
                damage = message.get("damage", 25)
                
                if hit_type == "enemy" and hit_id:
                    for enemy in room.enemies:
                        if enemy["id"] == hit_id and enemy["alive"]:
                            enemy["health"] -= damage
                            if enemy["health"] <= 0:
                                enemy["alive"] = False
                                if player_id in room.players:
                                    room.players[player_id]["kills"] += 1
                            break
                            
                elif hit_type == "heart":
                    room.heart_health -= damage
                    if room.heart_health < 0:
                        room.heart_health = 0
                        
                elif hit_type == "player" and hit_id:
                    if hit_id in room.players and room.players[hit_id]["alive"]:
                        room.players[hit_id]["health"] -= damage
                        if room.players[hit_id]["health"] <= 0:
                            room.players[hit_id]["health"] = 0
                            room.players[hit_id]["alive"] = False
                            room.players[hit_id]["deaths"] += 1
                            if player_id in room.players:
                                room.players[player_id]["kills"] += 1
                                
                # Broadcast shot event for visual effects
                for pid, ws in room.connections.items():
                    try:
                        await ws.send_json({
                            "type": "shot_fired",
                            "shooter_id": player_id,
                            "origin": message.get("origin"),
                            "direction": message.get("direction")
                        })
                    except Exception:
                        pass
                        
            elif msg_type == "plant_complete":
                # Player planted the device — humans win
                if not room.game_over:
                    room.game_over = True
                    room.winner = "humans"
                    
            elif msg_type == "reload":
                if player_id in room.players:
                    room.players[player_id]["ammo"] = room.players[player_id]["max_ammo"]
                    
            elif msg_type == "respawn":
                if player_id in room.players:
                    room.players[player_id]["health"] = 100
                    room.players[player_id]["ammo"] = 30
                    room.players[player_id]["alive"] = True
                    room.players[player_id]["x"] = random.uniform(-5, 5)
                    room.players[player_id]["z"] = random.uniform(-5, 5)
                    
    except WebSocketDisconnect:
        logger.info(f"Player {player_id} disconnected from room {room_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        room.remove_player(player_id)
        if not room.players:
            room.game_active = False
            if room_id in rooms:
                del rooms[room_id]

# Singleplayer WebSocket (simpler, local game loop)
@app.websocket("/ws/singleplayer")
async def websocket_singleplayer(websocket: WebSocket):
    await websocket.accept()
    room_id = f"sp_{uuid.uuid4().hex[:8]}"
    room = GameRoom(room_id, mode="singleplayer")
    player_id = "player_1"
    
    try:
        data = await websocket.receive_json()
        player_name = data.get("name", "Commander")
        
        room.add_player(player_id, player_name)
        room.connections[player_id] = websocket
        room.game_active = True
        room.spawn_enemies(5)
        
        await websocket.send_json({
            "type": "connected",
            "player_id": player_id,
            "room_id": room_id,
            "map_seed": room.map_seed
        })
        
        # Start game loop
        asyncio.create_task(game_loop(room))
        
        while True:
            message = await websocket.receive_json()
            msg_type = message.get("type")
            
            if msg_type == "move":
                room.players[player_id]["x"] = message.get("x", 0)
                room.players[player_id]["y"] = message.get("y", 1.6)
                room.players[player_id]["z"] = message.get("z", 0)
                room.players[player_id]["rotation_y"] = message.get("rotation_y", 0)
                
            elif msg_type == "shoot":
                hit_id = message.get("hit_id")
                hit_type = message.get("hit_type")
                damage = message.get("damage", 25)
                
                if hit_type == "enemy" and hit_id:
                    for enemy in room.enemies:
                        if enemy["id"] == hit_id and enemy["alive"]:
                            enemy["health"] -= damage
                            if enemy["health"] <= 0:
                                enemy["alive"] = False
                                room.players[player_id]["kills"] += 1
                            break
                elif hit_type == "heart":
                    room.heart_health -= damage
                    
            elif msg_type == "reload":
                room.players[player_id]["ammo"] = room.players[player_id]["max_ammo"]
                
            elif msg_type == "respawn":
                room.players[player_id]["health"] = 100
                room.players[player_id]["ammo"] = 30
                room.players[player_id]["alive"] = True
                room.players[player_id]["x"] = random.uniform(-5, 5)
                room.players[player_id]["z"] = random.uniform(-5, 5)
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Singleplayer WebSocket error: {e}")
    finally:
        room.game_active = False
        if room_id in rooms:
            del rooms[room_id]

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    if mongo_available:
        client.close()