"""
Script de verificación para Agency Swarm con Google AI Studio.
Valida la carga de configuración, modelos e inicialización del enjambre.
"""

import os
import sys
from pathlib import Path

# Agregar directorio tools/agency-swarm al path
sys.path.insert(0, str(Path(__file__).parent))

from config import get_gemini_api_key, get_gemini_model
from agency import create_pezcaderia_agency

def test_initialization():
    print("=" * 60)
    print(" Verificando Agencia Multi-Agente 'La Pezcaderia' (Agency Swarm)")
    print("=" * 60)
    
    key = get_gemini_api_key()
    if key and key != "dummy-key-for-init":
        masked_key = key[:4] + "..." + key[-4:] if len(key) > 8 else "***"
        print(f"[OK] Google AI Studio API Key detectada: {masked_key}")
    else:
        print("[INFO] GEMINI_API_KEY no encontrada o en modo de prueba.")
        print("       El enjambre se inicializa en modo estructural.")
        print("       Para ejecutar consultas en vivo con LLM, agrega tu key gratuita en tools/agency-swarm/.env")

    print(f"[1/2] Instanciando modelo Gemini...")
    model = get_gemini_model()
    print(f"      Modelo configurado: {model.model}")

    print("[2/2] Creando Agencia con agentes y flujos de comunicacion...")
    agency = create_pezcaderia_agency()
    
    print(f"\n[EXITO] Agencia creada correctamente: {agency.name}")
    print(f"        Punto de Entrada: {[a.name for a in agency.entry_points]}")
    print(f"        Agentes registrados: {list(agency.agents.keys()) if hasattr(agency, 'agents') else 'OK'}")
    print("=" * 60)

if __name__ == "__main__":
    test_initialization()
