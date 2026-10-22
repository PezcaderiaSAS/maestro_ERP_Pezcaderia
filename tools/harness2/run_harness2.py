#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
Harness² Runner Wrapper Seguro - Modo Español (es-419) a Costo $0
==============================================================================
Este script garantiza la ejecución segura de Harness² bajo la capa gratuita de
Google AI Studio y el entorno Antigravity IDE:
  - Idioma: Español (es-419) por defecto.
  - Modo: --mode sequential (evita errores 429 de Rate Limit).
  - Presupuesto: --k 1 --max-tasks 1 (presupuesto controlado y seguro).
  - Modelo: gemini-3.8-flash y motor de IDE antigravity-preview-09-2026.
"""

from __future__ import annotations

import os
import sys
import argparse
from pathlib import Path

# Asegurar codificación UTF-8 en consola Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Directorio base de Harness2 y raíz del ERP
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent.parent


# Cargar variables de entorno desde .env local y .env raíz
def _load_env_file(env_path: Path):
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        if line.startswith("export "):
            line = line[len("export "):].lstrip()
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in ("'", '"'):
            v = v[1:-1]
        os.environ.setdefault(k, v)

# Cargar en cascada: raíz primero, luego tools/harness2/.env
_load_env_file(PROJECT_ROOT / ".env")
_load_env_file(CURRENT_DIR / ".env")

# Forzar configuración segura para cuota $0 y español
os.environ.setdefault("HARNESS2_LANGUAGE", "es-419")
os.environ.setdefault("MODEL_PROVIDER", "google_ai_studio")
os.environ.setdefault("PRIMARY_MODEL_ID", "gemini-3.8-flash")
os.environ.setdefault("IDE_AUTOMATION_MODEL", "antigravity-preview-09-2026")
os.environ.setdefault("HARNESS2_SOLVER_MODEL", "google_ai_studio/gemini-3.8-flash")
os.environ.setdefault("HARNESS2_IMPROVER_MODEL", "google_ai_studio/gemini-3.8-flash")
os.environ.setdefault("HARNESS2_JUDGE_MODEL", "gemini-3.8-flash")

def main():
    parser = argparse.ArgumentParser(
        description="Runner seguro de Harness² adaptado para Antigravity IDE en Español (Costo $0)."
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Ejecuta la suite demo local determinista de Harness² (no consume API).",
    )
    parser.add_argument(
        "--bench",
        choices=["jb", "wb", "lab"],
        default="jb",
        help="Benchmark a ejecutar: jb (JobBench), wb (WorkBuddy), lab (LAB).",
    )
    parser.add_argument(
        "--mode",
        choices=["sequential", "parallel"],
        default="sequential",
        help="Modo de recursión (por defecto: sequential para proteger cuota 429).",
    )
    parser.add_argument(
        "--k",
        type=int,
        default=1,
        help="Presupuesto de pasos Propose-Probe-Compose (por defecto: 1).",
    )
    parser.add_argument(
        "--max-tasks",
        type=int,
        default=1,
        help="Límite máximo de tareas por dominio (por defecto: 1).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simula la ejecución sin realizar llamadas de API.",
    )
    
    # Capturar argumentos adicionales
    args, extra_args = parser.parse_known_args()

    print("=" * 70)
    print("🚀 [HARNESS² ESPAÑOL] Iniciando ejecución segura con modelos a Costo $0")
    print("=" * 70)
    print(f"  • Idioma:          {os.environ.get('HARNESS2_LANGUAGE')}")
    print(f"  • Proveedor:       {os.environ.get('MODEL_PROVIDER')}")
    print(f"  • Modelo Primario: {os.environ.get('PRIMARY_MODEL_ID')}")
    print(f"  • Motor IDE:       {os.environ.get('IDE_AUTOMATION_MODEL')}")
    print(f"  • Modo Recursión:  {args.mode} (Protección Rate Limit activa)")
    print(f"  • Presupuesto (k): {args.k} | Máx Tareas: {args.max_tasks}")
    print("=" * 70)

    if args.demo:
        from harness2.cli.demo import main as demo_main
        sys.argv = [
            "harness2-demo",
            "--output",
            str(CURRENT_DIR / "runs" / "demo"),
            "--k",
            str(args.k),
            "--mode",
            args.mode,
        ] + extra_args
        return demo_main()
    else:
        from harness2.cli.run_sweep import main as sweep_main
        cli_args = [
            "harness2",
            "--bench",
            args.bench,
            "--k",
            str(args.k),
            "--mode",
            args.mode,
            "--max-tasks",
            str(args.max_tasks),
        ]
        if args.dry_run:
            cli_args.append("--dry-run")
        cli_args.extend(extra_args)
        sys.argv = cli_args
        return sweep_main()

if __name__ == "__main__":
    sys.exit(main() or 0)
