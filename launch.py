#!/usr/bin/env python3
"""
COVENANT: RECURSION - Desktop Launcher
Corre: python launch.py
"""
import subprocess, sys, os, shutil, time, json
from pathlib import Path
from urllib.request import urlopen

ROOT          = Path(__file__).parent.resolve()
BACKEND       = ROOT / "backend"
FRONTEND      = ROOT / "frontend"
BACKEND_PORT  = 8001
FRONTEND_PORT = 3000

# ── Utilitarios ──────────────────────────────────────────────────────────────
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

# ── INICIO ───────────────────────────────────────────────────────────────────
title("COVENANT: RECURSION - Desktop Launcher")
print(f"  Diretorio: {ROOT}")

# 1. Verificar Node
step(1, "A verificar requisitos")
print(f"    Python {sys.version.split()[0]}  OK")
if not shutil.which("node"):
    err("Node.js nao encontrado!\nInstala em: https://nodejs.org/  (versao LTS)")
    input("Prima ENTER para sair...")
    sys.exit(1)
ok(f"Node.js {run('node --version', capture=True).stdout.strip()}")
ok(f"npm {run('npm --version', capture=True).stdout.strip()}")

# 2. Instalar dependencias Python (incluindo pywebview para a janela)
step(2, "A instalar dependencias Python")
pkgs = "fastapi uvicorn python-dotenv motor pymongo pydantic websockets pywebview"
print("    pip install ... (aguarda)")
run_check(f'"{sys.executable}" -m pip install {pkgs} --quiet', label="pip install")
ok("Dependencias Python instaladas")

# 3. Configurar .env
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

# 4. npm install
step(4, "A verificar dependencias npm")
nm = FRONTEND / "node_modules"
react_pkg = nm / "react" / "package.json"
need_install = not nm.exists()

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

if need_install:
    print("    npm install --legacy-peer-deps (pode demorar 2-5 min)...")
    r = run("npm install --legacy-peer-deps", cwd=FRONTEND)
    if r.returncode != 0:
        warn("Tentativa 2: npm install --force")
        r = run("npm install --force", cwd=FRONTEND)
        if r.returncode != 0:
            err(f"npm install falhou!\nTenta manualmente:\n  cd \"{FRONTEND}\"\n  npm install --legacy-peer-deps")
            input("Prima ENTER para sair...")
            sys.exit(1)
    ok("npm install concluido")
else:
    ok("node_modules OK")

# 5. Iniciar Backend
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

# 6. Iniciar Frontend com CRACO (necessario para aliases @/)
step(6, "A iniciar Frontend React com Vite (porta 3000)")
env = os.environ.copy()
env["BROWSER"] = "none"   # nao abrir browser automaticamente

if sys.platform == "win32":
    frontend_proc = subprocess.Popen(
        "npx vite --port 3000", cwd=FRONTEND, shell=True, env=env,
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )
else:
    frontend_proc = subprocess.Popen(
        "npx vite --port 3000", cwd=FRONTEND, shell=True, env=env
    )
ok("Frontend a compilar (aguarda ~30-60s)...")

# 7. Aguardar servidores prontos
print()
wait_for_server(f"http://localhost:{BACKEND_PORT}/docs", label="Backend ")
frontend_ok = wait_for_server(f"http://localhost:{FRONTEND_PORT}", label="Frontend", timeout=180)

if not frontend_ok:
    err("Frontend nao arrancou.\nVe a janela 'COVENANT Frontend' para o erro.")
    input("Prima ENTER para sair...")
    sys.exit(1)

# 8. Abrir janela nativa do jogo
title("A ABRIR COVENANT: RECURSION")
print("  A iniciar janela do jogo...\n")

try:
    import webview

    def on_closed():
        print("\n  Janela fechada - a parar servidores...")
        try:
            frontend_proc.terminate()
            backend_proc.terminate()
        except:
            pass

    window = webview.create_window(
        title            = "COVENANT: RECURSION",
        url              = f"http://localhost:{FRONTEND_PORT}",
        width            = 1280,
        height           = 720,
        resizable        = True,
        fullscreen       = False,
        min_size         = (800, 600),
        background_color = "#050508",
    )
    window.events.closed += on_closed
    webview.start(debug=False)

except Exception as e:
    # Fallback: abrir no browser se pywebview falhar
    warn(f"Janela nativa falhou ({e}) - a abrir no browser...")
    import webbrowser
    webbrowser.open(f"http://localhost:{FRONTEND_PORT}")
    print("\n  Jogo aberto no browser.")
    print("  Prima Ctrl+C para parar os servidores.\n")
    try:
        frontend_proc.wait()
    except KeyboardInterrupt:
        frontend_proc.terminate()
        backend_proc.terminate()

print("  Ate a proxima!")