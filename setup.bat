@echo off
title COVENANT: RECURSION - Setup
color 0B

echo.
echo  ========================================
echo   COVENANT: RECURSION - SETUP INICIAL
echo  ========================================
echo.

:: Get the directory where this .bat file is located
set "ROOT=%~dp0"
cd /d "%ROOT%"

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    py --version >nul 2>&1
    if errorlevel 1 (
        echo [ERRO] Python NAO encontrado!
        echo.
        echo Instala Python em: https://www.python.org/downloads/
        echo IMPORTANTE: Marca a opcao "Add Python to PATH" durante a instalacao!
        echo.
        pause
        exit /b 1
    )
    set "PYTHON=py"
) else (
    set "PYTHON=python"
)
echo [OK] Python: & %PYTHON% --version

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js NAO encontrado!
    echo.
    echo Instala Node.js em: https://nodejs.org/
    echo Escolhe a versao LTS (recomendada)
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js: & node --version
echo [OK] npm: & npm --version
echo.

:: ===== BACKEND DEPENDENCIES =====
echo ----------------------------------------
echo [1/3] A instalar dependencias Python...
echo ----------------------------------------
cd /d "%ROOT%backend"
%PYTHON% -m pip install --upgrade pip >nul 2>&1
%PYTHON% -m pip install fastapi uvicorn python-dotenv motor pymongo pydantic
echo.
echo [OK] Dependencias Python instaladas!
echo.

:: ===== FRONTEND DEPENDENCIES =====
echo ----------------------------------------
echo [2/3] A instalar dependencias Node.js...
echo        (pode demorar 2-5 minutos)
echo ----------------------------------------
cd /d "%ROOT%frontend"

:: Remove private package that won't work locally
%PYTHON% -c "import json; p=json.load(open('package.json')); dd=p.get('devDependencies',{}); dd.pop('@emergentbase/visual-edits', None); json.dump(p, open('package.json','w'), indent=2)" 2>nul

call npm install --legacy-peer-deps
echo.
echo [OK] Dependencias Node.js instaladas!
echo.

:: ===== ENV FILES =====
echo ----------------------------------------
echo [3/3] A criar ficheiros de configuracao...
echo ----------------------------------------
cd /d "%ROOT%"

:: Backend .env
(
    echo MONGO_URL=mongodb://localhost:27017
    echo DB_NAME=covenant_recursion
    echo CORS_ORIGINS=*
) > "%ROOT%backend\.env"
echo [OK] backend\.env criado

:: Frontend .env (LOCAL - aponta para localhost)
(
    echo REACT_APP_BACKEND_URL=http://localhost:8001
    echo WDS_SOCKET_PORT=3000
    echo ENABLE_HEALTH_CHECK=false
) > "%ROOT%frontend\.env"
echo [OK] frontend\.env criado

echo.
echo  ========================================
echo   SETUP COMPLETO COM SUCESSO!
echo  ========================================
echo.
echo   Para INICIAR o jogo:
echo   Faz duplo-click em START.bat
echo.
echo   NOTA: MongoDB NAO e necessario.
echo         O jogo funciona sem base de dados!
echo  ========================================
echo.
pause
