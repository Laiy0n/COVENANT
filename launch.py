#!/usr/bin/env python3
"""
COVENANT: RECURSION - Desktop Launcher v4
Corre: python launch.py
"""
# VERSAO 4 - Sem pywebview, usa Edge/Chrome modo app
import subprocess, sys, os, shutil, time, json
from pathlib import Path
from urllib.request import urlopen

ROOT          = Path(__file__).parent.resolve()
BACKEND       = ROOT / "backend"
FRONTEND      = ROOT / "frontend"
BACKEND_PORT  = 8001
FRONTEND_PORT = 3000

def title(msg):
    print("\n" + "="*52)
    print(f"  {msg}")
    print("="*52)

def step(n, msg): print(f"\n[{n}] {msg}...")
def ok(msg):      print(f"    OK  {msg}")
def warn(msg):    print(f"    !   {msg}")
def err(msg):     print(f"\n    ERRO: {msg}\n")

def run(cmd, cwd=None, capture=False):
    return subprocess.run(cmd, cwd=cwd, shell=True,
                          capture_output=capture, text=True)

def run_check(cmd, cwd=None, label=""):
    r = run(cmd, cwd=cwd)
    if r.returncode != 0:
        err(f"Comando falhou: {label or cmd}")
        input("Prima ENTER para sair...")
        sys.exit(1)

def wait_for_server(url, timeout=180, label="servidor"):
    print(f"    A aguardar {label}", end="", flush=True)
    start = time.time()
    while time.time() - start < timeout:
        try:
            urlopen(url, timeout=2)
            print(" OK")
            return True
        except:
            print(".", end="", flush=True)
            time.sleep(2)
    print(" TIMEOUT")
    return False

def open_game_window(url):
    w, h = 1280, 720
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    for path in edge_paths:
        if os.path.isfile(path):
            subprocess.Popen([path, f"--app={url}",
                              f"--window-size={w},{h}", "--disable-extensions"])
            ok("Janela aberta com Microsoft Edge")
            return True
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for path in chrome_paths:
        if os.path.isfile(path):
            subprocess.Popen([path, f"--app={url}", f"--window-size={w},{h}"])
            ok("Janela aberta com Google Chrome")
            return True
    return False

# ─────────────────────────────────────────────────────────────────────────────
title("COVENANT: RECURSION - Desktop Launcher v4")
print(f"  Diretorio: {ROOT}")

step(1, "A verificar requisitos")
print(f"    Python {sys.version.split()[0]}  OK")
if not shutil.which("node"):
    err("Node.js nao encontrado!\nInstala em: https://nodejs.org/  (versao LTS)")
    input("Prima ENTER para sair...")
    sys.exit(1)
ok(f"Node.js {run('node --version', capture=True).stdout.strip()}")
ok(f"npm    {run('npm --version', capture=True).stdout.strip()}")

# Apenas os pacotes que o backend REALMENTE usa - sem pywebview, sem pythonnet
step(2, "A instalar dependencias Python do backend")
pkgs = "fastapi uvicorn python-dotenv motor pymongo pydantic websockets"
print(f"    A instalar: {pkgs}")
run_check(
    f'"{sys.executable}" -m pip install {pkgs} --prefer-binary --quiet',
    label="pip install backend"
)
ok("Dependencias Python instaladas")

step(3, "A configurar ambiente")
if not (BACKEND / ".env").exists():
    (BACKEND / ".env").write_text(
        "MONGO_URL=mongodb://localhost:27017\n"
        "DB_NAME=covenant_recursion\n"
        "CORS_ORIGINS=*\n"
    )
    ok("backend/.env criado")
else:
    ok("backend/.env ja existe")

(FRONTEND / ".env").write_text(
    f"REACT_APP_BACKEND_URL=http://localhost:{BACKEND_PORT}\n"
    f"WDS_SOCKET_PORT={FRONTEND_PORT}\n"
    "ENABLE_HEALTH_CHECK=false\n"
)
ok("frontend/.env criado")

step(4, "A verificar dependencias npm")
nm        = FRONTEND / "node_modules"
react_pkg = nm / "react" / "package.json"
vite_pkg  = nm / "vite" / "package.json"
need_install = not nm.exists() or not vite_pkg.exists()

if react_pkg.exists():
    try:
        v = json.loads(react_pkg.read_text(encoding="utf-8"))["version"]
        print(f"    React instalado: {v}")
        if v.startswith("19"):
            warn("React 19 detetado - a reinstalar React 18...")
            shutil.rmtree(nm)
            need_install = True
    except:
        pass

if not vite_pkg.exists() and nm.exists():
    warn("Vite nao encontrado - a reinstalar node_modules...")
    shutil.rmtree(nm)
    need_install = True

if need_install:
    print("    npm install --legacy-peer-deps (pode demorar 2-5 min)...")
    r = run("npm install --legacy-peer-deps", cwd=FRONTEND)
    if r.returncode != 0:
        warn("Tentativa 2: npm install --force")
        r = run("npm install --force", cwd=FRONTEND)
        if r.returncode != 0:
            err("npm install falhou!")
            input("Prima ENTER para sair...")
            sys.exit(1)
    ok("npm install concluido")
else:
    ok("node_modules OK (com Vite)")

step(5, "A iniciar Backend (porta 8001)")
backend_cmd = (
    f'"{sys.executable}" -m uvicorn server:app '
    f'--host 0.0.0.0 --port {BACKEND_PORT} --reload'
)
if sys.platform == "win32":
    backend_proc = subprocess.Popen(
        backend_cmd, cwd=BACKEND, shell=True,
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )
else:
    backend_proc = subprocess.Popen(backend_cmd, cwd=BACKEND, shell=True)
ok("Backend a iniciar...")

step(6, "A iniciar Frontend com Vite (porta 3000)")
env = os.environ.copy()
env["BROWSER"] = "none"
if sys.platform == "win32":
    frontend_proc = subprocess.Popen(
        "npx vite --port 3000", cwd=FRONTEND, shell=True, env=env,
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )
else:
    frontend_proc = subprocess.Popen(
        "npx vite --port 3000", cwd=FRONTEND, shell=True, env=env
    )
ok("Frontend a arrancar...")

print()
wait_for_server(f"http://localhost:{BACKEND_PORT}/docs", label="Backend ")
frontend_ok = wait_for_server(f"http://localhost:{FRONTEND_PORT}",
                               label="Frontend", timeout=60)

if not frontend_ok:
    err("Frontend nao arrancou.\nVe a janela 'COVENANT Frontend' para o erro.")
    input("Prima ENTER para sair...")
    sys.exit(1)

title("A ABRIR COVENANT: RECURSION")
game_url = f"http://localhost:{FRONTEND_PORT}"
opened = open_game_window(game_url)
if not opened:
    import webbrowser
    warn("Edge/Chrome nao encontrado - a abrir no browser padrao...")
    webbrowser.open(game_url)

print(f"""
  Jogo a correr em: {game_url}

  Janelas abertas:
    - "COVENANT Backend"   (porta {BACKEND_PORT})
    - "COVENANT Frontend"  (porta {FRONTEND_PORT})

  Prima Ctrl+C aqui para parar tudo.
""")
try:
    frontend_proc.wait()
except KeyboardInterrupt:
    print("\n  A parar servidores...")
    frontend_proc.terminate()
    backend_proc.terminate()

print("  Ate a proxima!")