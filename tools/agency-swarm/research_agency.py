"""
Enjambre de Investigacion Tecnica y Arquitectura UI/UX con Agent-Reach y Agency-Swarm.
Impulsado por Google AI Studio (Gemini 2.5 Flash Lite - Costo $0).
"""

from agency_swarm import Agent, Agency
from internet_tools import FetchDocumentation, CodeAndBestPracticesSearch

try:
    from config import get_gemini_model
except ImportError:
    from .config import get_gemini_model

def create_research_agency() -> Agency:
    model = get_gemini_model()

    # 1. El especialista en frontend y código limpio
    dev_agent = Agent(
        name="TechArchitect",
        description="Especialista en desarrollo de software, algoritmos y mejores prácticas de código.",
        instructions=(
            "Tu misión es resolver problemas de código complejos y validar especificaciones técnicas. "
            "Siempre que propongas una solución, debes buscar documentación oficial o código validado "
            "en repositorios utilizando CodeAndBestPracticesSearch o FetchDocumentation. Evita inventar sintaxis. "
            "Al usar el buscador semántico, utiliza frases afirmativas como 'The best implementation of atomic design in React 18 is' "
            "o 'Tailwind layout best practices for dashboards' para maximizar la relevancia en Agent-Reach. "
            "Responde siempre en español claro, profesional y estructurado."
        ),
        tools=[FetchDocumentation, CodeAndBestPracticesSearch],
        model=model
    )

    # 2. El especialista en UI/UX y Sistemas de Diseño
    ui_ux_agent = Agent(
        name="UXStrategist",
        description="Especialista en heurísticas de usabilidad, accesibilidad (WCAG) y sistemas de diseño.",
        instructions=(
            "Tu función es auditar ideas de diseño, proponer estructuras de componentes y flujos de usuario. "
            "Usa FetchDocumentation para revisar estándares de diseño (Material Design, Apple HIG, especificaciones de Figma, Rico UI Brands) "
            "y asegurar que las interfaces propuestas sean intuitivas, accesibles y con estética Dark Glassmorphism para el ERP. "
            "Responde siempre en español con especificaciones visuales detalladas."
        ),
        tools=[FetchDocumentation, CodeAndBestPracticesSearch],
        model=model
    )

    # 3. Director de Proyecto (El puente con el usuario)
    pm_agent = Agent(
        name="ProductManager",
        description="Gestiona las solicitudes del usuario y coordina al diseñador y al desarrollador.",
        instructions=(
            "Analiza el requerimiento del usuario y delega las tareas de diseño a UXStrategist y la implementación a TechArchitect. "
            "Asegúrate de que cada propuesta esté alineada con el Roadmap del producto y fundamentada con investigación técnica real. "
            "Responde siempre en español resumiendo los hallazgos y decisiones clave."
        ),
        model=model
    )

    # Definimos el flujo de comunicación de la agencia
    agency = Agency(
        pm_agent,
        communication_flows=[
            (pm_agent, ui_ux_agent),     # El PM puede hablar con el Diseñador
            (pm_agent, dev_agent),       # El PM puede hablar con el Desarrollador
            (ui_ux_agent, dev_agent),    # El Diseñador y el Desarrollador pueden colaborar entre sí (Handoff)
        ],
        name="ResearchAgency",
        shared_instructions=(
            "Todos los agentes deben fundamentar sus decisiones con datos reales extraídos de internet mediante Agent-Reach. "
            "Priorizar documentación oficial, código tipado en TypeScript/React 18 y Tailwind CSS, y accesibilidad WCAG 2.2."
        )
    )
    return agency

if __name__ == "__main__":
    agency = create_research_agency()
    print("\n[OK] Research Agency (Agent-Reach + Agency-Swarm) inicializada exitosamente.")
    print("Agente de entrada:", agency.entry_points[0].name)
    print("Flujos de comunicación configurados con Gemini (Google AI Studio Free Tier).")
    agency.run_demo()
