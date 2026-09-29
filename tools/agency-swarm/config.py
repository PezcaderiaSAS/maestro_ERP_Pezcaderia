import os
from pathlib import Path
from dotenv import load_dotenv
from openai import AsyncOpenAI
from agency_swarm import OpenAIChatCompletionsModel

# Silenciar tracing de OpenAI cuando se utiliza Google AI Studio
try:
    from agents.tracing import set_tracing_disabled
    set_tracing_disabled(True)
except Exception:
    pass

# Cargar .env local si existe, o desde la raíz del proyecto
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

def get_gemini_api_key() -> str:
    """
    Obtiene la clave de API gratuita de Google AI Studio desde variables de entorno.
    Soporta GEMINI_API_KEY o GOOGLE_API_KEY.
    """
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    return key or ""

def get_gemini_model(
    model_name: str | None = None,
    api_key: str | None = None
) -> OpenAIChatCompletionsModel:
    """
    Instancia el modelo de Gemini usando el endpoint OpenAI-compatible
    oficial y gratuito de Google AI Studio:
    https://generativelanguage.googleapis.com/v1beta/openai/
    """
    key = api_key or get_gemini_api_key()
    
    if not key:
        print("\n[ADVERTENCIA] No se detecto GEMINI_API_KEY ni GOOGLE_API_KEY.")
        print("Por favor configura tu API key gratuita de Google AI Studio en tools/agency-swarm/.env")
        print("Obten tu clave sin costo en: https://aistudio.google.com/app/apikey\n")
        key = "dummy-key-for-init"

    selected_model = model_name or os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

    # Cliente AsyncOpenAI con reintentos automáticos para mitigar límites de tasa
    client = AsyncOpenAI(
        api_key=key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        max_retries=5,
        timeout=90.0
    )

    return OpenAIChatCompletionsModel(
        model=selected_model,
        openai_client=client
    )
