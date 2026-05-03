#!/usr/bin/env python3
"""
COVENANT: RECURSION - Desktop Launcher
Corre: python launch.py
"""
import subprocess, sys, os, shutil, time, json
from pathlib import Path
from urllib.request import urlopen
from typing import Optional

ROOT     = Path(__file__).parent.resolve()
BACKEND  = ROOT / "backend"
FRONTEND = ROOT / "frontend"
BACKEND_PORT  = 8001
FRONTEND_PORT = 3000

def title(msg: str):
    print("\n" + "="*52)
    print(f"  {msg}")
    print("="*52)

def step(n: int, msg: str): print(f"\n[{n}] {msg}...")
def ok(msg: str):      print(f"    OK  {msg}")
def warn(msg: str):    print(f"    !   {msg}")
def err(msg: str):     print(f"\n    ERRO: {msg}\n")

def run(cmd: str, cwd: Optional[Path] = None, capture: bool = False):
    return subprocess.run(cmd, cwd=cwd, shell=True,
                          capture_output=capture, text=True)

def run_check(cmd: str, cwd: Optional[Path] = None, label: str = ""):
    r = run(cmd, cwd=cwd)
    if r.returncode != 0:
        err(f"Comando falhou: {label or cmd}")
        input("Prima ENTER para sair...")
        sys.exit(1)

def wait_for_server(url: str, timeout: int = 180, label: str = "servidor"):
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

step(1, "A verificar requisitos")
print(f"    Python {sys.version.split()[0]}  OK")

if not shutil.which("node"):
    err("Node.js nao encontrado!\nInstala em: https://nodejs.org/  (versao LTS)")
    input("Prima ENTER para sair...")
    sys.exit(1)
ok(f"Node.js {run('node --version', capture=True).stdout.strip()}")
ok(f"npm {run('npm --version', capture=True).stdout.strip()}")

step(2, "A instalar dependencias Python")
pkgs = "fastapi uvicorn python-dotenv motor pymongo pydantic websockets"
print(f"    pip install ... (aguarda)")
run_check(f'"{sys.executable}" -m pip install {pkgs} --quiet', label="pip install")
ok("Dependencias Python instaladas")

step(3, "A configurar ambiente")
if not (BACKEND / ".env").exists():
    (BACKEND / ".env").write_text(
        "MONGO_URL=mongodb://localhost:27017\n"
        "DB_NAME=covenant_recursion\n"
        "CORS_ORIGINS=*\n"
    )
    ok("backend/.env criado")

(FRONTEND / ".env").write_text(
    f"REACT_APP_BACKEND_URL=http://localhost:{BACKEND_PORT}\n"
    f"WDS_SOCKET_PORT={FRONTEND_PORT}\n"
    "ENABLE_HEALTH_CHECK=false\n"
)
ok("frontend/.env criado")

try:
    data = json.loads((FRONTEND / "package.json").read_text(encoding="utf-8"))
    dev = data.get("devDependencies", {})
    if "@emergentbase/visual-edits" in dev:
        del dev["@emergentbase/visual-edits"]
        (FRONTEND / "package.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
        ok("Pacote privado Emergent removido")
except Exception as e:
    warn(f"Nao foi possivel ler package.json: {e}")

step(4, "A verificar dependencias npm")
nm = FRONTEND / "node_modules"
react_pkg = nm / "react" / "package.json"
need_install = not nm.exists()

if react_pkg.exists():
    try:
        v = json.loads(react_pkg.read_text())["version"]
        print(f"    React instalado: {v}")
        if v.startswith("19"):
            warn("React 19 detetado - a reinstalar React 18 (pode demorar)...")
            shutil.rmtree(nm)
            need_install = True
    except:
        pass

if need_install:
    print("    npm install (pode demorar 2-5 min na primeira vez)...")
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

step(6, "A iniciar Frontend React (porta 3000)")
env = os.environ.copy()
env["BROWSER"] = "none"
if sys.platform == "win32":
    frontend_proc = subprocess.Popen(
        "react-scripts start", cwd=FRONTEND, shell=True, env=env,
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )
else:
    frontend_proc = subprocess.Popen(
        "react-scripts start", cwd=FRONTEND, shell=True, env=env
    )
ok("Frontend a compilar...")

print()
backend_ok  = wait_for_server(f"http://localhost:{BACKEND_PORT}/docs",  label="Backend ")
frontend_ok = wait_for_server(f"http://localhost:{FRONTEND_PORT}",       label="Frontend")

if not frontend_ok:
    err("Frontend nao arrancou a tempo.\nVe a janela do Frontend para ver o erro.")
    input("Prima ENTER para sair...")
    sys.exit(1)

title("A ABRIR JANELA DO JOGO")
print("  A abrir COVENANT: RECURSION no browser...\n")

import webbrowser
webbrowser.open(f"http://localhost:{FRONTEND_PORT}")

print("  Jogo aberto no browser! Fecha esta janela para parar os servidores.")
print("  Prima Ctrl+C para parar.\n")

try:
    frontend_proc.wait()
except KeyboardInterrupt:
    print("\n  A parar servidores...")
    frontend_proc.terminate()
    backend_proc.terminate()

print("  Ate a proxima!")