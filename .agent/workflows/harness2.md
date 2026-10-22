---
description: Configura y ejecuta el framework Harness² de Google Research para autorreflexión recursiva y mejora continua de arneses de agentes de IA a Costo $0 en Español (es-419).
---

# Workflow: /harness2 — Framework de Arneses Recursivos (Google Research)

Este workflow permite operar el framework **Harness²** (*Recursive Agent Harnessing for an Open World* de Google Research) dentro del entorno Antigravity IDE a costo financiero estrictamente de **0 USD**, empleando la API Key gratuita de Google AI Studio (`gemini-3.8-flash`), el motor nativo del IDE (`antigravity-preview-09-2026`) y operando por defecto en idioma Español (es-419).

---

## 🚀 Sintaxis y Modos de Uso

```powershell
# 1. Ejecución de Demo Local Determinista (Sin consumo de API - Prueba de salud del arnés)
powershell -ExecutionPolicy Bypass -File tools/harness2/run_harness2.ps1 -Demo

# 2. Simulación en Seco de Tareas (Dry-Run para verificar namespaces sin gastar cuota)
powershell -ExecutionPolicy Bypass -File tools/harness2/run_harness2.ps1 -DryRun -Bench jb

# 3. Ejecución Recursiva Propose-Probe-Compose Protegida contra Rate Limits (429)
powershell -ExecutionPolicy Bypass -File tools/harness2/run_harness2.ps1 -Bench jb -Mode sequential -K 1 -MaxTasks 1
```

---

## 🧭 Arquitectura de Modelos a Costo $0

| Rol en el Framework | Modelo Asignado | Propósito & Fuente de Financiación |
| :--- | :--- | :--- |
| **Desarrollo y Llamadas de API** | `gemini-3.8-flash` | Llamadas de programación basadas en la API Key gratuita de Google AI Studio (`GEMINI_API_KEY`). |
| **Entorno IDE Automatizado** | `antigravity-preview-09-2026` | Agente autónomo nativo de gestión del IDE Antigravity sin costo de tokens. |
| **Improver / Composer / Judge** | `google_ai_studio/gemini-3.8-flash` | Evaluación de contrastes conductuales y autorreflexión de lecciones en `runs/`. |

---

## 🛡️ Protecciones de Cuota contra Errores 429

Para garantizar que el framework opere sin interrupciones en la capa gratuita:
1. **Modo Secuencial Forzado (`--mode sequential`):** Evita la saturación simultánea de llamadas paralelas en la ventana de 60 segundos de Google AI Studio.
2. **Presupuesto Controlado (`--k 1 --max-tasks 1`):** Limita el bucle Propose-Probe-Compose a 1 paso profundo y 1 tarea por dominio.
3. **Localización Nativa (es-419):** Los prompts inyectan automáticamente directivas para que el agente proponente, selector y evaluador razonen y redacten sus notas y componentes en Español.

---

## 📂 Estructura de Componentes Adaptables del Arnés

Harness² optimiza los 8 componentes alrededor del modelo sin reentrenar pesos:
1. `systemprompt.md`: Rol y procedimiento (en Español es-419).
2. `guardrails.md`: Reglas permanentes y barreras de seguridad.
3. `LongTermMEMORY.md`: Hechos durables del dominio.
4. `tool_descriptions/tool_guidance.md`: Guía determinista de uso de herramientas.
5. `skills/`: Habilidades modulares invocadas bajo demanda.
6. `sub_agents/`: Subagentes especializados delegados.
7. `scripts/`: Scripts deterministas de apoyo en Python.
8. `plugin/`: Interceptores de ciclo de vida dentro del bucle de herramientas.

---

## ⚡ Co-Ejecución Simultánea con Agency Swarm (Spec-Driven Development)

Para ejecutar en simultáneo la ideación técnica de los especialistas de Agency Swarm y la optimización de arnés de Harness²:

```powershell
# Ejecución simultánea en paralelo sin bloqueo (Costo $0):
python scripts/architecture/run_agency_sdd_bridge.py -a [architect|data|ui|quality] -p "[Requerimiento o fase SDD]"
```

El script despacha ambos motores en hilos paralelos independientes y genera un reporte unificado en `specs/sdd_verification_reports/`.

