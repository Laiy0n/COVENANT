@echo off
title COVENANT: RECURSION - Quick Start
color 0B

echo.
echo  ========================================
echo   COVENANT: RECURSION - Setup Rapido
echo  ========================================
echo.
echo  Este script configura tudo pela primeira
echo  vez. Depois usa START.bat para iniciar.
echo  ========================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado!
    echo Instala em: https://www.python.org/downloads/
    echo IMPORTANTE: Marca "Add Python to PATH" durante a instalacao!
    pause
    exit /b 1
)
echo [OK] Python: 
python --version

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo Instala em: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js: 
node --version

echo.
echo [1/3] A instalar dependencias Python (backend)...
cd backend
pip install fastapi uvicorn python-dotenv motor pymongo pydantic python-jose bcrypt passlib
cd ..
echo.

echo [2/3] A instalar dependencias Node (frontend)...
cd frontend
call npm install --legacy-peer-deps
cd ..
echo.

echo [3/3] A configurar ficheiros .env...

:: Backend .env
if not exist "backend\.env" (
    (
        echo MONGO_URL="mongodb://localhost:27017"
        echo DB_NAME="covenant_recursion"
        echo CORS_ORIGINS="*"
    ) > backend\.env
    echo [OK] backend\.env criado
) else (
    echo [OK] backend\.env ja existe
)

:: Frontend .env
if not exist "frontend\.env" (
    (
        echo REACT_APP_BACKEND_URL=http://localhost:8001
        echo WDS_SOCKET_PORT=3000
    ) > frontend\.env
    echo [OK] frontend\.env criado
) else (
    echo [OK] frontend\.env ja existe
)

echo.
echo  ========================================
echo   SETUP COMPLETO!
echo  ========================================
echo.
echo   Para iniciar o jogo, faz duplo-click em:
echo   START.bat
echo.
echo   NOTA: MongoDB NAO e necessario!
echo   O jogo funciona sem base de dados.
echo  ========================================
echo.
pause
