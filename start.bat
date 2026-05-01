@echo off
title COVENANT: RECURSION - Launcher
color 0B

echo.
echo  ========================================
echo   COVENANT: RECURSION - Game Launcher
echo  ========================================
echo.

:: Get the directory where this .bat file is located
set "ROOT=%~dp0"
cd /d "%ROOT%"

echo  Diretorio: %ROOT%
echo.

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    py --version >nul 2>&1
    if errorlevel 1 (
        echo [ERRO] Python nao encontrado! Instala Python 3.10+ em python.org
        echo        IMPORTANTE: Marca "Add Python to PATH" na instalacao!
        pause
        exit /b 1
    )
    set "PYTHON=py"
) else (
    set "PYTHON=python"
)

:: Check if Node is available
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado! Instala Node.js em nodejs.org
    pause
    exit /b 1
)

echo [OK] Python encontrado
echo [OK] Node.js encontrado
echo.

:: ===== BACKEND SETUP =====
echo [1/4] A configurar backend...

:: Create backend .env if not exists
if not exist "%ROOT%backend\.env" (
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=covenant_recursion
        echo CORS_ORIGINS=*
    ) > "%ROOT%backend\.env"
    echo       .env criado
)

:: Install backend dependencies
cd /d "%ROOT%backend"
%PYTHON% -m pip install fastapi uvicorn python-dotenv motor pymongo pydantic --quiet 2>nul
echo [OK] Backend pronto
echo.

:: ===== FRONTEND SETUP =====
echo [2/4] A configurar frontend...
cd /d "%ROOT%frontend"

:: Create/overwrite frontend .env for LOCAL use
(
    echo REACT_APP_BACKEND_URL=http://localhost:8001
    echo WDS_SOCKET_PORT=3000
    echo ENABLE_HEALTH_CHECK=false
) > "%ROOT%frontend\.env"

:: Remove problematic private package from package.json if present
%PYTHON% -c "import json; p=json.load(open('package.json')); dd=p.get('devDependencies',{}); changed=False; [dd.pop(k, None) or setattr(type('',(),{'x':None})(), 'x', None) for k in ['@emergentbase/visual-edits'] if k in dd]; json.dump(p, open('package.json','w'), indent=2)" 2>nul

:: Install frontend dependencies
if not exist "%ROOT%frontend\node_modules" (
    echo       A instalar pacotes npm (primeira vez, pode demorar 2-3 min)...
    call npm install --legacy-peer-deps 2>nul
    if errorlevel 1 (
        echo       Tentando com --force...
        call npm install --force 2>nul
    )
) else (
    echo       node_modules ja existe
)
echo [OK] Frontend pronto
echo.

:: ===== START BACKEND =====
echo [3/4] A iniciar backend (porta 8001)...
cd /d "%ROOT%"
start "COVENANT Backend" cmd /k "cd /d "%ROOT%backend" && %PYTHON% -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload"
timeout /t 3 >nul

:: ===== START FRONTEND =====
echo [4/4] A iniciar frontend (porta 3000)...
start "COVENANT Frontend" cmd /k "cd /d "%ROOT%frontend" && npx craco start"

echo.
echo  ========================================
echo   COVENANT: RECURSION - A INICIAR!
echo  ========================================
echo.
echo   Aguarda uns segundos...
echo   O browser vai abrir automaticamente em:
echo.
echo        http://localhost:3000
echo.
echo   Backend API: http://localhost:8001/api/
echo.
echo   Para PARAR: fecha as 2 janelas de terminal
echo  ========================================
echo.

:: Wait for frontend to compile then open browser
timeout /t 15 >nul
start http://localhost:3000

pause
