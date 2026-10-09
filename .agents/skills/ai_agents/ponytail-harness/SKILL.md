---
name: ponytail-harness
description: Harness de automatización de pipelines de tareas encadenadas, ejecución por etapas con checkpoints y testing automatizado por lotes para agentes de IA.
---

# Ponytail Task Harness & Pipeline Runner Skill

Esta habilidad proporciona una estructura de harness para ejecutar tareas complejas en pipelines secuenciales o paralelos con checkpoints de verificación, recuperación de fallos y aislamiento de contexto.

---

## 1. Estructura de Pipeline de Tareas

```mermaid
graph LR
    P1[Etapa 1: Ingesta y Validación] --> P2[Etapa 2: Transformación TDD]
    P2 --> P3[Etapa 3: Revisión de Calidad]
    P3 --> P4[Etapa 4: Checkpoint & Commit]
```

Cada etapa del pipeline produce un reporte de estado estructurado:
- `status`: `PENDING` | `RUNNING` | `PASSED` | `FAILED`
- `artifacts`: Lista de archivos modificados o creados.
- `validation_hash`: Checksum de integridad para asegurar que no ocurrieron mutaciones inesperadas.

---

## 2. Invocación

```bash
/ponytail <nombre_pipeline> [--steps step1,step2,step3] [--continue-on-error]
```
