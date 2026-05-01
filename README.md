# COVENANT: RECURSION

## FPS Tático Sci-Fi no Browser

Jogo shooter em primeira pessoa estilo Rainbow Six Siege, com tema sci-fi.
Humanos vs Aliens numa nave espacial infetada por um monstro cósmico.

---

## Como Jogar (Windows)

### Primeira vez:
1. Faz duplo-click em **`setup.bat`** (instala dependências)
2. Depois faz duplo-click em **`start.bat`** (inicia o jogo)

### Vezes seguintes:
1. Faz duplo-click em **`start.bat`**
2. O browser abre automaticamente em `http://localhost:3000`

### Requisitos:
- **Python 3.10+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- MongoDB **NÃO é necessário** (o jogo funciona sem)

---

## Controlos (estilo Rainbow Six Siege)

| Tecla | Ação |
|-------|------|
| WASD | Mover |
| Mouse | Apontar |
| Left Click | Disparar |
| Right Click | ADS (Aim Down Sights) |
| R | Recarregar |
| Shift | Sprint |
| C | Agachar |
| Q / E | Lean esquerda / direita |
| F | Habilidade do operador |
| 1 / 2 / 3 | Trocar arma |
| Scroll | Trocar arma |
| ESC | Desbloquear cursor |

---

## Operadores

| Nome | Classe | Habilidade |
|------|--------|-----------|
| VANGUARD | Assault | Boost de velocidade + stun enemies |
| SENTINEL | Defender | Escudo de energia |
| PHANTOM | Stealth | Invisibilidade temporária |
| PATCH | Support | Cura completa instantânea |
| CIPHER | Intel | Revelar inimigos através de paredes |

---

## Armas

| Arma | Tipo | Damage | Fire Rate |
|------|------|--------|-----------|
| CR-7 | Assault Rifle | 28 | Rápido |
| SG-12 | Shotgun | 15x8 pellets | Lento |
| V-9 | SMG | 20 | Muito Rápido |
| LR-50 | Sniper | 90 | Muito Lento |
| P-22 | Pistol | 35 | Médio |

---

## Modo de Jogo

- **Singleplayer**: Waves de aliens, objetivo destruir o Coração
- **Multiplayer**: Lobby com WebSocket, salas para jogares com amigos
- **Rondas**: Best of 5, timer de 3 minutos por ronda

---

## Estrutura do Projeto

```
/
├── start.bat           # Iniciar o jogo (duplo-click!)
├── setup.bat           # Setup inicial (primeira vez)
├── backend/            # Servidor FastAPI + WebSocket
│   ├── server.py       # Servidor principal
│   └── .env            # Configuração
└── frontend/           # React + Three.js
    ├── src/
    │   ├── game/       # Motor do jogo (Three.js)
    │   │   ├── GameEngine.js
    │   │   ├── Map.js
    │   │   ├── Enemies.js
    │   │   ├── Weapons.js
    │   │   ├── SoundManager.js
    │   │   └── Operators.js
    │   └── components/ # UI React
    └── .env            # Configuração frontend
```

---

## Iniciar Manualmente (sem .bat)

```bash
# Terminal 1 - Backend
cd backend
pip install fastapi uvicorn python-dotenv motor pymongo pydantic
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 - Frontend
cd frontend
npm install --legacy-peer-deps
npm start
```

Depois abre: http://localhost:3000
