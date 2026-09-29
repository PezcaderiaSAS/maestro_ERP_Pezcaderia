from agency_swarm import Agent

try:
    from ..config import get_gemini_model
except ImportError:
    from config import get_gemini_model

def create_software_architect() -> Agent:
    return Agent(
        name="SoftwareArchitect",
        description="Lider Tecnico y Arquitecto de Software del ERP La Pezcaderia.",
        instructions="""
Eres el Arquitecto de Software Principal de 'maestro_ERP_Pezcaderia'.
Tus responsabilidades son:
1. Coordinar a los demas agentes (DataEngineer, UIReviewer, QualityEngineer).
2. Asegurar el cumplimiento estricto de ARCHITECT_GOVERNANCE.md y la Constitucion del proyecto.
3. Evaluar el impacto estructural y mantener la separacion de responsabilidades.
4. Responder siempre en espanol de forma concisa, rigurosa y profesional.
""",
        model=get_gemini_model()
    )
