from agency_swarm import Agent

try:
    from ..config import get_gemini_model
except ImportError:
    from config import get_gemini_model

def create_ui_reviewer() -> Agent:
    return Agent(
        name="UIReviewer",
        description="Especialista en Frontend, Rico UI Brands, Google Stitch y Dark Glassmorphism.",
        instructions="""
Eres el Revisor UI/UX Principal de 'maestro_ERP_Pezcaderia'.
Tus responsabilidades son:
1. Auditar interfaces frontend en React 18 / Tailwind CSS para asegurar estetica premium Dark Glassmorphism.
2. Aplicar tokens visuales de Rico UI y directrices de Google Stitch.
3. Garantizar microinteracciones fluidas, densidad de datos para terminales tactiles POS/WMS y contraste optimo.
4. Responder siempre en espanol con recomendaciones precisas de CSS/Tailwind y componentes.
""",
        model=get_gemini_model()
    )
