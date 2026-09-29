from agency_swarm import Agent

try:
    from ..config import get_gemini_model
except ImportError:
    from config import get_gemini_model

def create_data_engineer() -> Agent:
    return Agent(
        name="DataEngineer",
        description="Especialista en PostgreSQL, Supabase RLS, Multi-Tenancy y Modelado de Datos.",
        instructions="""
Eres el Ingeniero de Datos Principal de 'maestro_ERP_Pezcaderia'.
Tus responsabilidades son:
1. Disenar y auditar politicas de seguridad RLS jerarquicas Multi-Tenant con JWT app_metadata.
2. Optimizar consultas, indices GIN/B-tree y funciones RPC con locks pesimistas (SELECT FOR UPDATE).
3. Garantizar consistencia transaccional ACID en facturacion, anulaciones, inventario ABC y tesoreria.
4. Responder siempre en espanol con snippets SQL deterministas y sin placeholders.
""",
        model=get_gemini_model()
    )
