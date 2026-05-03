@echo off
title COVENANT: RECURSION - Launcher
color 0B
setlocal enabledelayedexpansion

echo.
echo  ========================================
echo   COVENANT: RECURSION - Game Launcher
echo  ========================================
echo.

set "ROOT=%~dp0"
cd /d "%ROOT%"
echo  Diretorio: %ROOT%
echo.

:: ===== CHECK PYTHON =====
python --version >nul 2>&1
if errorlevel 1 (
    py --version >nul 2>&1
    if errorlevel 1 (
        color 0C
        echo [ERRO] Python NAO encontrado!
        echo.
        echo  Instala Python em: https://www.python.org/downloads/
        echo  IMPORTANTE: Marca "Add Python to PATH" durante a instalacao!
        echo.
        pause
        exit /b 1
    )
    set "PYTHON=py"
) else (
    set "PYTHON=python"
)

:: ===== CHECK NODE =====
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERRO] Node.js NAO encontrado!
    echo.
    echo  Instala Node.js em: https://nodejs.org/ (versao LTS)
    echo.
    pause
    exit /b 1
)

echo [OK] Python: & %PYTHON% --version
echo [OK] Node.js: & node --version
echo.

:: ===== BACKEND SETUP =====
echo [1/4] A configurar backend...
if not exist "%ROOT%backend\.env" (
    (
        echo MONGO_URL=mongodb://localhost:27017
        echo DB_NAME=covenant_recursion
        echo CORS_ORIGINS=*
    ) > "%ROOT%backend\.env"
)
cd /d "%ROOT%backend"
%PYTHON% -m pip install fastapi uvicorn python-dotenv motor pymongo pydantic websockets --quiet
if errorlevel 1 (
    color 0C
    echo [ERRO] Falha a instalar dependencias Python!
    pause
    exit /b 1
)
echo [OK] Backend pronto
echo.

:: ===== FRONTEND SETUP =====
echo [2/4] A configurar frontend...
cd /d "%ROOT%frontend"

(
    echo REACT_APP_BACKEND_URL=http://localhost:8001
    echo WDS_SOCKET_PORT=3000
    echo ENABLE_HEALTH_CHECK=false
) > "%ROOT%frontend\.env"

%PYTHON% -c "import json; p=json.load(open('package.json')); dd=p.get('devDependencies',{}); dd.pop('@emergentbase/visual-edits', None); json.dump(p, open('package.json','w'), indent=2)" 2>nul

:: Verificar se React 19 esta instalado - se sim, apaga node_modules para reinstalar
if exist "%ROOT%frontend\node_modules\react\package.json" (
    %PYTHON% -c "import json,sys; p=json.load(open('%ROOT%frontend\\node_modules\\react\\package.json')); v=p['version']; sys.exit(0 if v.startswith('19') else 1)" 2>nul
    if not errorlevel 1 (
        echo       [AVISO] React 19 detetado - a apagar node_modules para reinstalar React 18...
        rmdir /s /q "%ROOT%frontend\node_modules" 2>nul
    )
)

if not exist "%ROOT%frontend\node_modules" (
    echo       A instalar pacotes npm (pode demorar 2-5 min)...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo       Tentativa 2 com --force...
        call npm install --force
        if errorlevel 1 (
            color 0C
            echo.
            echo [ERRO] npm install falhou!
            echo.
            pause
            exit /b 1
        )
    )
) else (
    echo       node_modules OK
)
echo [OK] Frontend pronto
echo.

:: ===== START BACKEND =====
echo [3/4] A iniciar backend...
start "COVENANT Backend" cmd /k "cd /d "%ROOT%backend" && %PYTHON% -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload || (echo. & echo [BACKEND FALHOU - VE O ERRO ACIMA] & pause)"
timeout /t 3 >nul

:: ===== START FRONTEND =====
echo [4/4] A iniciar frontend...
start "COVENANT Frontend" cmd /k "cd /d "%ROOT%frontend" && npx craco start || (echo. & echo [FRONTEND FALHOU - VE O ERRO ACIMA] & pause)"

echo.
echo  ========================================
echo   A INICIAR - Aguarda...
echo  ========================================
echo.
echo  Foram abertas 2 janelas:
echo    "COVENANT Backend"  -> porta 8001
echo    "COVENANT Frontend" -> porta 3000
echo.
echo  Espera ate ver "Compiled successfully!"
echo  no terminal do Frontend.
echo  Depois abre:  http://localhost:3000
echo.
echo  Se alguma janela mostrar ERRO, tira
echo  uma foto e envia para debug!
echo.
echo  A abrir o browser em 35 segundos...
timeout /t 35 >nul
start http://localhost:3000
echo.
pause