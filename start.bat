@echo off
title COVENANT: RECURSION - Launcher
color 0B

echo.
echo  ========================================
echo   COVENANT: RECURSION - Game Launcher
echo  ========================================
echo.

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python nao encontrado! Instala Python 3.10+ em python.org
    pause
    exit /b 1
)

:: Check if Node is available
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js nao encontrado! Instala Node.js em nodejs.org
    pause
    exit /b 1
)

echo [OK] Python encontrado
echo [OK] Node.js encontrado
echo.

:: Install backend dependencies
echo [1/4] A instalar dependencias do backend...
cd backend
pip install fastapi uvicorn python-dotenv motor pymongo pydantic 2>nul >nul
if errorlevel 1 (
    pip install fastapi uvicorn python-dotenv motor pymongo pydantic
)
cd ..
echo [OK] Backend pronto
echo.

:: Create backend .env if not exists
if not exist "backend\.env" (
    echo MONGO_URL="mongodb://localhost:27017" > backend\.env
    echo DB_NAME="covenant_recursion" >> backend\.env
    echo CORS_ORIGINS="*" >> backend\.env
)

:: Install frontend dependencies
echo [2/4] A instalar dependencias do frontend (pode demorar na primeira vez)...
cd frontend
if not exist "node_modules" (
    call npm install --legacy-peer-deps 2>nul
    if errorlevel 1 (
        call yarn install 2>nul
    )
)
cd ..
echo [OK] Frontend pronto
echo.

:: Create frontend .env if not exists
if not exist "frontend\.env" (
    echo REACT_APP_BACKEND_URL=http://localhost:8001 > frontend\.env
    echo WDS_SOCKET_PORT=3000 >> frontend\.env
)

:: Start backend
echo [3/4] A iniciar o servidor backend (porta 8001)...
start "COVENANT Backend" cmd /k "cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload"
timeout /t 3 >nul

:: Start frontend
echo [4/4] A iniciar o frontend (porta 3000)...
start "COVENANT Frontend" cmd /k "cd frontend && npm start"

echo.
echo  ========================================
echo   TUDO PRONTO!
echo  ========================================
echo.
echo   O jogo vai abrir no browser em:
echo   http://localhost:3000
echo.
echo   Backend API: http://localhost:8001
echo.
echo   Para parar: fecha as janelas do terminal
echo  ========================================
echo.

:: Wait a bit then open browser
timeout /t 8 >nul
start http://localhost:3000

pause
