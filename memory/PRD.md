# COVENANT: RECURSION - PRD

## Problem Statement
Jogo FPS shooter no browser estilo Rainbow Six Siege, com tema sci-fi espacial. Humanos vs Aliens numa nave espacial. Objetivo: destruir o "Coração" - um monstro de carne que se funde com a nave. Movimentos R6 Siege, operadores com habilidades únicas, múltiplas armas, modo competitivo por rondas.

## Architecture
- **Frontend**: React + Three.js (3D FPS engine, Web Audio API)
- **Backend**: FastAPI + WebSocket (multiplayer game server)
- **Database**: MongoDB (leaderboards)

## Core Requirements (Implemented)
- FPS primeira pessoa R6 Siege style (WASD, Lean Q/E, Crouch C, ADS RMB, Sprint Shift)
- 5 Operadores com habilidades únicas (Vanguard, Sentinel, Phantom, Patch, Cipher)
- 5 Tipos de arma (Rifle, Shotgun, SMG, Sniper, Pistol) com switch 1/2/3/scroll
- Sistema de som sintetizado (Web Audio API)
- Indicadores direcionais de dano
- Modo competitivo por rondas (Best of 5, timer 3min)
- Sistema de armor + health
- Multiplayer WebSocket lobby
- Inimigos AI (crawlers, spitters, brutes) com wave system

## What's Been Implemented (2026-05-01)
### Phase 1 - Core Prototype
- ✅ Main Menu sci-fi com imagem do monstro
- ✅ Three.js FPS engine (WASD, mouse, raycasting)
- ✅ Mapa nave espacial (corredores + áreas abertas)
- ✅ Inimigos AI com wave system
- ✅ HUD completo
- ✅ Multiplayer lobby WebSocket

### Phase 2 - R6 Siege Features
- ✅ Lean left/right (Q/E) com camera tilt
- ✅ Crouch (C) com transição suave
- ✅ ADS (right-click) com zoom + precisão extra
- ✅ Sprint (Shift) com head bob
- ✅ 5 Operadores: VANGUARD, SENTINEL, PHANTOM, PATCH, CIPHER
- ✅ Habilidades únicas por operador (F key)
- ✅ 5 Armas com stats diferentes (damage, fire rate, recoil, spread)
- ✅ Weapon switch (1/2/3/scroll) com modelo visual no viewport
- ✅ Sistema de som completo (shoot, reload, hit, kill, footsteps, ability)
- ✅ Indicadores direcionais de dano (setas vermelhas)
- ✅ Modo rondas competitivo (best of 5, timer 3min)
- ✅ Score tracking (humans vs aliens)
- ✅ Tela de seleção de operador com stats/loadout
- ✅ Armor system separado do health
- ✅ Recoil + spread por arma (reduzido em ADS)
- ✅ Head bobbing durante movimento
- ✅ Muzzle flash + hit effects

## Operators
| ID | Name | Role | Ability |
|---|---|---|---|
| vanguard | VANGUARD | Assault | Speed boost + stun enemies |
| sentinel | SENTINEL | Defender | Deploy energy shield wall |
| phantom | PHANTOM | Stealth | Invisibility (enemies lose target) |
| medic | PATCH | Support | Instant full heal + armor |
| hacker | CIPHER | Intel | Reveal enemies through walls |

## Prioritized Backlog
### P1 (Next)
- Improved multiplayer sync (render other players' 3D models)
- Voice chat integration
- Kill cam / death replay
- More detailed enemy types with unique attacks
- Destructible environment elements

### P2 (Future)
- Additional maps/levels
- Ranked matchmaking system
- Battle pass / progression system
- Mobile touch controls
- Spectator mode
- Custom map editor
