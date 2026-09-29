"""
Enjambre de Agentes (Agency Swarm) para La Pezcaderia ERP.
Impulsado por Google AI Studio (Gemini 2.0 Flash / 1.5 Flash - Nivel Gratuito).
"""

from agency_swarm import Agency

try:
    from .pezca_agents import (
        create_software_architect,
        create_data_engineer,
        create_ui_reviewer,
        create_quality_engineer,
    )
except ImportError:
    from pezca_agents import (
        create_software_architect,
        create_data_engineer,
        create_ui_reviewer,
        create_quality_engineer,
    )

def create_pezcaderia_agency() -> Agency:
    """
    Construye la Agencia de La Pezcaderia con:
    - Entry Point: SoftwareArchitect (Director orquestador)
    - Communication Flows:
        - SoftwareArchitect <-> DataEngineer (Bases de datos, RLS, SQL)
        - SoftwareArchitect <-> UIReviewer (Frontend, Tailwind, Rico UI, Glassmorphism)
        - SoftwareArchitect <-> QualityEngineer (Zod schemas, TDD, Playwright/Vitest)
    """
    architect = create_software_architect()
    data_engineer = create_data_engineer()
    ui_reviewer = create_ui_reviewer()
    quality_engineer = create_quality_engineer()

    agency = Agency(
        architect,
        communication_flows=[
            (architect, data_engineer),
            (architect, ui_reviewer),
            (architect, quality_engineer),
        ],
        name="LaPezcaderiaAgency",
        shared_instructions="""
Directrices Compartidas de La Pezcaderia ERP:
1. Idioma: Todo el analisis y las respuestas deben entregarse en espanol claro y profesional.
2. Arquitectura: Data-Driven, multi-tenant estricto con RLS en Supabase, React 18 + Vite + Tailwind CSS.
3. Gobernanza: Consultar siempre ARCHITECT_GOVERNANCE.md como la fuente de verdad del sistema.
4. Codigo: Sin placeholders, tipado estricto en TypeScript o SQL determinista.
"""
    )
    return agency

if __name__ == "__main__":
    agency = create_pezcaderia_agency()
    print("\n[OK] La Pezcaderia Agency inicializada exitosamente.")
    print("Agente de entrada:", agency.entry_points[0].name)
    print("Flujos de comunicacion configurados con Gemini (Google AI Studio Free Tier).")
