---
description: Ejecuta pipelines de tareas encadenadas por etapas con checkpoints de validación y control de errores para agentes de IA.
---

# Workflow: /ponytail

Orquesta la ejecución secuencial de tareas de desarrollo garantizando trazabilidad por etapa.

## Argumentos:
```bash
/ponytail <nombre_pipeline> [--steps step1,step2,step3] [--continue-on-error]
```

## Fases de Ejecución:
1. **Inicialización de Harness:** Configura el entorno de aislamiento para la tarea.
2. **Ejecución Etapa por Etapa:** Procesa cada paso verificando el estado de salida.
3. **Checkpoint & Validación:** Comprueba que no existan regresiones antes del commit.

Consulta `.agents/skills/ponytail-harness/SKILL.md` para más información.
