#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
Bridge de Co-Ejecución Simultánea: Agency Swarm + Google Harness²
==============================================================================
Orquestador de alto rendimiento para Spec-Driven Development (SDD) a Costo $0.
Dispara en paralelo e interactúa simultáneamente con:
  1. Agency Swarm (Gemini 2.5 Flash Lite) -> Especialistas de Dominio.
  2. Google Harness² (Gemini 3.8 Flash) -> Recursión y Optimización de Arneses.
"""

from __future__ import annotations

import os
import sys
import json
import time
import argparse
import subprocess
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Asegurar codificación UTF-8 en consola de Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SWARM_DIR = PROJECT_ROOT / "tools" / "agency-swarm"
HARNESS_DIR = PROJECT_ROOT / "tools" / "harness2"
REPORTS_DIR = PROJECT_ROOT / "specs" / "sdd_verification_reports"

# Detectar intérpretes Python en entornos virtuales aislados
SWARM_PYTHON = SWARM_DIR / ".venv" / "Scripts" / "python.exe"
if not SWARM_PYTHON.is_file():
    SWARM_PYTHON = Path(sys.executable)

HARNESS_PYTHON = HARNESS_DIR / ".venv" / "Scripts" / "python.exe"
if not HARNESS_PYTHON.is_file():
    HARNESS_PYTHON = Path(sys.executable)

def run_agency_swarm(prompt: str, agent: str | None = None) -> dict:
    """Ejecuta consulta en Agency Swarm en proceso aislado."""
    t0 = time.time()
    cli_script = SWARM_DIR / "run_cli.py"
    if not cli_script.is_file():
        return {
            "source": "Agency Swarm",
            "status": "error",
            "output": f"Script {cli_script} no encontrado.",
            "duration": 0,
        }

    cmd = [str(SWARM_PYTHON), str(cli_script), "-p", prompt]
    if agent:
        cmd.extend(["-a", agent])

    try:
        proc = subprocess.run(
            cmd,
            cwd=str(SWARM_DIR),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=180,
        )
        return {
            "source": "Agency Swarm",
            "status": "ok" if proc.returncode == 0 else "failed",
            "output": proc.stdout.strip() if proc.stdout else proc.stderr.strip(),
            "returncode": proc.returncode,
            "duration": round(time.time() - t0, 2),
        }
    except Exception as e:
        return {
            "source": "Agency Swarm",
            "status": "exception",
            "output": str(e),
            "duration": round(time.time() - t0, 2),
        }

def run_harness2(prompt: str, demo: bool = False, dry_run: bool = False) -> dict:
    """Ejecuta evaluación o demo en Harness2 en proceso aislado."""
    t0 = time.time()
    runner_script = HARNESS_DIR / "run_harness2.py"
    if not runner_script.is_file():
        return {
            "source": "Google Harness²",
            "status": "error",
            "output": f"Script {runner_script} no encontrado.",
            "duration": 0,
        }

    cmd = [str(HARNESS_PYTHON), str(runner_script)]
    if demo:
        cmd.append("--demo")
    elif dry_run:
        cmd.extend(["--bench", "jb", "--dry-run"])
    else:
        # Modo de prueba rápida por defecto
        cmd.append("--demo")

    try:
        proc = subprocess.run(
            cmd,
            cwd=str(HARNESS_DIR),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=180,
        )
        return {
            "source": "Google Harness²",
            "status": "ok" if proc.returncode == 0 else "failed",
            "output": proc.stdout.strip() if proc.stdout else proc.stderr.strip(),
            "returncode": proc.returncode,
            "duration": round(time.time() - t0, 2),
        }
    except Exception as e:
        return {
            "source": "Google Harness²",
            "status": "exception",
            "output": str(e),
            "duration": round(time.time() - t0, 2),
        }

def main():
    parser = argparse.ArgumentParser(
        description="Co-orquestador simultáneo para Agency Swarm y Google Harness² (Costo $0)."
    )
    parser.add_argument(
        "-p", "--prompt",
        required=True,
        help="Requerimiento o contexto SDD a procesar por el enjambre y el arnés.",
    )
    parser.add_argument(
        "-a", "--agent",
        choices=["architect", "data", "ui", "quality"],
        default="architect",
        help="Especialista destino de Agency Swarm (por defecto: architect).",
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Fuerza ejecución determinista de Harness2 Demo sin consumo de API.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Ejecuta simulaciones en seco sin llamadas de producción.",
    )
    parser.add_argument(
        "--save-report",
        action="store_true",
        default=True,
        help="Guarda el reporte consolidado en specs/sdd_verification_reports/.",
    )

    args = parser.parse_args()

    print("=" * 75)
    print("⚡ [SDD BRIDGE] Disparando Co-Ejecución Simultánea: Agency Swarm + Harness²")
    print("=" * 75)
    print(f"  • Requerimiento: {args.prompt[:65]}...")
    print(f"  • Especialista Swarm: {args.agent}")
    print(f"  • Modo Harness²: {'Demo' if args.demo else 'Dual Propose-Probe'}")
    print(f"  • Costo Estimado: 0.00 USD (Google AI Studio Free Tier)")
    print("=" * 75)
    print("⏳ Ejecutando ambos sistemas en paralelo...")

    results = {}
    start_total = time.time()

    # Ejecución simultánea en hilos paralelos
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_swarm = executor.submit(run_agency_swarm, args.prompt, args.agent)
        future_harness = executor.submit(run_harness2, args.prompt, args.demo, args.dry_run)

        for future in as_completed([future_swarm, future_harness]):
            res = future.result()
            results[res["source"]] = res

    total_time = round(time.time() - start_total, 2)

    # Imprimir resultados consolidados
    print("\n" + "=" * 75)
    print(f"✅ Co-Ejecución Finalizada en {total_time}s")
    print("=" * 75)

    for source, data in results.items():
        print(f"\n📌 --- [{source}] (Estado: {data['status']}, {data['duration']}s) ---")
        out_lines = data["output"].splitlines()
        # Mostrar resumen o las primeras líneas
        for line in out_lines[:25]:
            print(f"  {line}")
        if len(out_lines) > 25:
            print(f"  ... ({len(out_lines) - 25} líneas adicionales ocultadas)")

    # Guardar reporte estructurado para la fase SDD
    if args.save_report:
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = REPORTS_DIR / f"sdd_bridge_coexecution_{ts}.json"
        payload = {
            "timestamp": datetime.now().isoformat(),
            "prompt": args.prompt,
            "agent": args.agent,
            "total_duration_seconds": total_time,
            "results": results,
        }
        report_file.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\n📁 Reporte consolidado de Co-Ejecución guardado en:")
        print(f"   {report_file}")

    print("=" * 75)
    return 0

if __name__ == "__main__":
    sys.exit(main())
