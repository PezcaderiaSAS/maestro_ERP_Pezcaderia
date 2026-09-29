---
description: Formula, optimiza y ejecuta solicitudes dirigidas a La Pezcaderia Agency Swarm con Google AI Studio (Gemini 2.5 Flash Lite) a costo $0 sin saturar cuotas de API.
---

# Workflow: /swarm — Orquestador de Agency Swarm

Este workflow estructura y ejecuta solicitudes de alta precisión para el enjambre multi-agente (`tools/agency-swarm/`), aplicando targeting de especialistas y batching para maximizar la velocidad y prevenir el error `RateLimitError (429)`.

---

## 🚀 Sintaxis y Modos de Uso

```bash
# 1. Consulta Rápida Dirigida a un Especialista
/swarm --agent [architect|data|ui|quality] --query "[Tu requerimiento]"

# 2. Consulta Global con Orquestación Completa
/swarm --query "[Requerimiento arquitectónico global]"

# 3. Modo Terminal Interactivo en Vivo
/swarm --demo
```

---

## 🧭 Fases de Ejecución

### Fase 1: Selección y Enrutamiento del Agente (Targeting)
Identifica el dominio de la consulta para evitar llamadas redundantes a todos los agentes:
- **`--agent data`** -> `DataEngineer`: Esquemas SQL, RLS en Supabase, RPCs transaccionales, bloqueos pesimistas, índices.
- **`--agent ui`** -> `UIReviewer`: Componentes React 18, Tailwind CSS, Dark Glassmorphism, accesibilidad y tokens Rico UI.
- **`--agent quality`** -> `QualityEngineer`: Esquemas Zod, planes de prueba TDD, Vitest, Playwright.
- **`--agent architect`** (o sin flag) -> `SoftwareArchitect`: Auditorías de gobernanza, integración multi-módulo, flujos end-to-end.

---

### Fase 2: Empaquetamiento de la Solicitud (Prompt Batching)
Estructura la consulta con el siguiente formato determinista:

```text
[Especialista: <NombreAgente>]
Contexto: La Pezcaderia ERP (Multi-Tenant, React 18, Supabase RLS).
Requerimiento:
1. <Objetivo Principal>
2. <Detalle o restricción técnica>
3. <Formato de salida esperado: SQL / Zod / React Component>
```

---

### Fase 3: Ejecución en Entorno Aislado
Ejecuta el script optimizado con el entorno virtual del proyecto:

```powershell
tools\agency-swarm\.venv\Scripts\python.exe tools/agency-swarm/run_cli.py -p "[Especialista: DataEngineer] Revisa los índices de la tabla ventas"
```

El script cuenta con:
- **Modelo por defecto:** `gemini-2.5-flash-lite` (mayor cuota RPM en capa gratuita).
- **Auto-recuperación 429:** Pausa automática y reintento inteligente si Google reporta saturación de la ventana de 60 segundos.
- **Codificación UTF-8:** Soporte nativo de tildes y caracteres en español.

---

### Fase 4: Registro y Persistencia
Si la respuesta define nuevas políticas o decisiones estructurales, el resultado se incorpora en [`ARCHITECT_GOVERNANCE.md`](../../ARCHITECT_GOVERNANCE.md) o en las migraciones SQL correspondientes.

Para patrones detallados de formulación, consulta [`.agents/skills/agency-swarm-orchestrator/SKILL.md`](../../.agents/skills/agency-swarm-orchestrator/SKILL.md).
