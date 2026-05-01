# COVENANT: RECURSION

## FPS Tático Sci-Fi no Browser

Jogo shooter em primeira pessoa estilo Rainbow Six Siege, com tema sci-fi.
Humanos vs Aliens numa nave espacial infetada por um monstro cósmico.

---

## COMO INICIAR (Windows)

### Opção 1: Script automático (RECOMENDADO)

1. **Primeira vez:** Duplo-click em `setup.bat`
   - Instala todas as dependências automaticamente
   - Cria os ficheiros de configuração

2. **Para jogar:** Duplo-click em `start.bat`
   - Inicia backend + frontend
   - Abre o browser automaticamente em http://localhost:3000

### Opção 2: Manual (se os scripts falharem)

Abre **2 terminais** (CMD ou PowerShell) na pasta do projeto:

**Terminal 1 - Backend:**
```cmd
cd backend
pip install fastapi uvicorn python-dotenv motor pymongo pydantic
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```cmd
cd frontend
npm install --legacy-peer-deps
npx craco start
```

Depois abre: **http://localhost:3000**

---

## RESOLUÇÃO DE PROBLEMAS

### "O sistema não conseguiu localizar o caminho especificado"
- Certifica-te que estás a fazer duplo-click no `start.bat` DENTRO da pasta do projeto
- Ou abre um CMD, navega até à pasta (`cd C:\caminho\para\o\projeto`) e corre: `start.bat`

### "npm install falha"
```cmd
cd frontend
npm install --legacy-peer-deps --force
```

### "A página não carrega / localhost:3000 em branco"
- Espera 15-20 segundos após iniciar (o frontend demora a compilar)
- Verifica se o ficheiro `frontend\.env` contém:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### "Backend não inicia"
- Verifica se a porta 8001 não está ocupada
- Cria o ficheiro `backend\.env` com:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=covenant_recursion
CORS_ORIGINS=*
```
- NOTA: MongoDB NÃO é necessário! O jogo funciona sem ele.

---

## Requisitos

- **Python 3.10+** — [Download](https://www.python.org/downloads/) (marca "Add to PATH"!)
- **Node.js 18+** — [Download](https://nodejs.org/) (versão LTS)
- MongoDB **NÃO é necessário**

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
| VANGUARD | Assault | Boost de velocidade + stun inimigos |
| SENTINEL | Defender | Escudo de energia |
| PHANTOM | Stealth | Invisibilidade temporária |
| PATCH | Support | Cura completa instantânea |
| CIPHER | Intel | Revelar inimigos através de paredes |

---

## Armas

| Arma | Tipo | Damage | Estilo |
|------|------|--------|--------|
| CR-7 | Assault Rifle | 28 | Equilibrado |
| SG-12 | Shotgun | 15x8 | Curta distância |
| V-9 | SMG | 20 | Alta cadência |
| LR-50 | Sniper | 90 | Longa distância |
| P-22 | Pistol | 35 | Secundária |

---

## Estrutura do Projeto

```
COVENANT-RECURSION/
├── start.bat              ← DUPLO-CLICK PARA JOGAR
├── setup.bat              ← Primeira vez (instala tudo)
├── README.md              ← Este ficheiro
├── backend/
│   ├── server.py          # Servidor FastAPI + WebSocket
│   ├── .env               # Config (criado pelo setup)
│   └── .env.example       # Exemplo de config
└── frontend/
    ├── craco.config.js    # Configuração build
    ├── package.json       # Dependências Node
    ├── .env               # Config (criado pelo setup)
    ├── .env.local.example # Exemplo de config local
    └── src/
        ├── App.js         # Router principal
        ├── game/          # Motor do jogo Three.js
        │   ├── GameEngine.js   # Engine FPS completo
        │   ├── Map.js          # Mapa da nave
        │   ├── Enemies.js      # Inimigos AI
        │   ├── Weapons.js      # Sistema de armas
        │   ├── SoundManager.js # Som (Web Audio)
        │   └── Operators.js    # Personagens
        └── components/    # UI React
            ├── MainMenu.jsx
            ├── OperatorSelect.jsx
            ├── GameView.jsx
            ├── GameHUD.jsx
            ├── GameOver.jsx
            ├── Lobby.jsx
            └── SettingsPanel.jsx
```
