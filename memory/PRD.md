# COVENANT: RECURSION - PRD

## Problem Statement
Jogo FPS shooter no browser, estilo CS2/Rainbow Six Siege, com tema sci-fi espacial. Humanos vs Aliens numa nave espacial. O objetivo central é destruir um "coração" - um monstro de carne criado pela ganância humana que está a fundir-se com a nave.

## Architecture
- **Frontend**: React + Three.js (3D FPS engine no browser)
- **Backend**: FastAPI + WebSocket (multiplayer game server)
- **Database**: MongoDB (leaderboards, game stats)

## User Personas
1. **Casual Gamer** - Quer jogar rapidamente no browser sem instalações
2. **Competitive Player** - Quer multiplayer com amigos via WebSocket
3. **Solo Player** - Prefere campanha singleplayer contra AI bots

## Core Requirements
- FPS em primeira pessoa (WASD + mouse + pointer lock)
- Rendering 3D com Three.js
- Mapa interior de nave espacial com corredores + áreas abertas
- Inimigos AI (aliens: crawlers, spitters, brutes)
- Sistema de armas (tiro, recarga, munição)
- Objetivo: destruir o Coração (monstro com vida)
- HUD em tempo real (vida, munição, objetivo, wave)
- Multiplayer via WebSocket
- Singleplayer com bots AI

## What's Been Implemented (2026-05-01)
- ✅ Main Menu com estética sci-fi (imagem do monstro no fundo)
- ✅ Three.js FPS engine completo (WASD, mouse aim, shooting, raycasting)
- ✅ Mapa de nave espacial (corredores, cobertura, pilares, luzes de emergência)
- ✅ 3 tipos de inimigos AI (crawler, spitter, brute) com pathfinding básico
- ✅ Sistema de ondas (wave system)
- ✅ O Coração como objetivo destruível com efeitos visuais
- ✅ HUD completo (vida, munição, wave, kills, objetivo)
- ✅ Ecrã de Game Over/Vitória
- ✅ Lobby Multiplayer (criar/juntar salas)
- ✅ WebSocket backend para multiplayer
- ✅ Painel de Settings (controles, áudio, vídeo)
- ✅ Leaderboard API
- ✅ Design cyberpunk/sci-fi (Rajdhani + IBM Plex Mono fonts, neon cyan/red)

## Prioritized Backlog
### P0 (Done)
- Core FPS gameplay loop
- Singleplayer against AI
- Multiplayer WebSocket infrastructure
- Full UI/UX (menu, HUD, lobby, settings)

### P1 (Next Phase)
- Sound effects & ambient audio
- Multiple weapons (pistol, rifle, shotgun)
- Player synchronization in multiplayer (position broadcasting)
- Better enemy AI with navmesh
- Damage indicators (directional)

### P2 (Future)
- Different maps/levels
- Character classes/loadouts
- Matchmaking system
- Round-based game mode (like CS2)
- Voice chat integration
- Mobile touch controls
- Leaderboard UI page

## Next Tasks
1. Add sound effects (shooting, enemy attacks, ambient)
2. Implement multiple weapons with switching
3. Improve multiplayer sync (show other players' models)
4. Add proper navmesh for enemy pathfinding
5. Implement round-based mode
