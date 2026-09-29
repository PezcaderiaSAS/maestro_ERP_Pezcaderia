"""
Script CLI para interactuar con La Pezcaderia Agency Swarm
utilizando la API gratuita de Google AI Studio (Gemini 2.5 Flash / Flash Lite).
"""

import os
import re
import sys
import time
import argparse
from pathlib import Path

# Asegurar codificación UTF-8 en consola de Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Configurar path local
sys.path.insert(0, str(Path(__file__).parent))

from config import get_gemini_api_key
from agency import create_pezcaderia_agency

AGENT_MAP = {
    "architect": "SoftwareArchitect",
    "data": "DataEngineer",
    "ui": "UIReviewer",
    "quality": "QualityEngineer"
}

def extract_agency_response(response) -> str:
    """
    Extrae el texto completo de la respuesta de Agency Swarm / Agents SDK.
    Revisa tanto final_output como los items acumulados en new_items.
    """
    final_out = getattr(response, "final_output", None)
    if final_out and isinstance(final_out, str) and final_out.strip():
        return final_out.strip()

    if hasattr(response, "new_items"):
        text_parts = []
        for item in response.new_items:
            raw = getattr(item, "raw_item", item)
            content = getattr(raw, "content", None)
            if isinstance(content, list):
                for part in content:
                    t = getattr(part, "text", None)
                    if t and t.strip():
                        text_parts.append(t.strip())
            elif isinstance(content, str) and content.strip():
                text_parts.append(content.strip())
        
        if text_parts:
            return "\n\n".join(text_parts)

    return str(response)

def execute_with_rate_limit_retry(agency, prompt: str, recipient_agent: str | None = None, max_retries: int = 3):
    """
    Ejecuta la consulta con manejo resiliente del límite de tasa (429) de Google AI Studio.
    Permite enviar la consulta directamente a un agente especialista para ahorrar hasta 70% de llamadas.
    """
    for attempt in range(1, max_retries + 1):
        try:
            return agency.get_response_sync(prompt, recipient_agent=recipient_agent)
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "RateLimitError" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                wait_match = re.search(r"retry in (\d+(?:\.\d+)?)s", err_msg)
                wait_seconds = float(wait_match.group(1)) + 2.0 if wait_match else (15.0 * attempt)
                
                print(f"\n[AVISO CAPA GRATUITA GOOGLE AI STUDIO]")
                print(f"Límite de solicitudes por minuto alcanzado (Intento {attempt}/{max_retries}).")
                print(f"Pausando {wait_seconds:.1f}s para refrescar la ventana de cuota...")
                time.sleep(wait_seconds)
                print("[Reanudando consulta con el enjambre...]\n")
            else:
                raise e
    return agency.get_response_sync(prompt, recipient_agent=recipient_agent)

def main():
    parser = argparse.ArgumentParser(
        description="Ejecutar La Pezcaderia Agency Swarm con Google AI Studio"
    )
    parser.add_argument(
        "--prompt", "-p",
        type=str,
        help="Mensaje o consulta directa para la Agencia"
    )
    parser.add_argument(
        "--agent", "-a",
        type=str,
        choices=["architect", "data", "ui", "quality"],
        default=None,
        help="Agente directo destinatario (architect, data, ui, quality). Ahorra hasta 70% de llamadas."
    )
    parser.add_argument(
        "--model", "-m",
        type=str,
        default=None,
        help="Modelo a usar: gemini-2.5-flash-lite (default, mayor cuota RPM) o gemini-2.5-flash"
    )
    parser.add_argument(
        "--demo", "-d",
        action="store_true",
        help="Iniciar en modo terminal interactivo (terminal_demo)"
    )
    args = parser.parse_args()

    key = get_gemini_api_key()
    if not key or key == "dummy-key-for-init":
        print("\n[ERROR] No se encontro GEMINI_API_KEY o GOOGLE_API_KEY configurada.")
        print("Por favor crea o edita el archivo tools/agency-swarm/.env con tu clave gratuita de:")
        print("https://aistudio.google.com/app/apikey\n")
        sys.exit(1)

    if args.model:
        os.environ["GEMINI_MODEL"] = args.model

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    print(f"\nInicializando La Pezcaderia Agency Swarm (Google AI Studio - {model_name})...")
    agency = create_pezcaderia_agency()

    if args.demo:
        print("\nIniciando interfaz de terminal interactiva. Escribe 'exit' para salir.\n")
        agency.terminal_demo()
    else:
        prompt = args.prompt or "¿Cuales son tus funciones principales y como garantizas la seguridad RLS en el ERP?"
        target_agent = AGENT_MAP.get(args.agent) if args.agent else None
        
        target_display = f" (Destinatario Directo: {target_agent})" if target_agent else " (Orquestacion Global)"
        print(f"\n[Usuario]{target_display} -> {prompt}\n")
        print("[Agencia Procesando con Gemini...]\n")
        
        response = execute_with_rate_limit_retry(agency, prompt, recipient_agent=target_agent)
        last_agent = getattr(response, "last_agent", None)
        agent_name = getattr(last_agent, "name", target_agent or agency.entry_points[0].name)

        output_text = extract_agency_response(response)

        print("=" * 60)
        print(f"[Respuesta de {agent_name}]:\n")
        print(output_text)
        print("=" * 60)

if __name__ == "__main__":
    main()
