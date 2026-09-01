---
name: tech-stack
description: Consulta de gobernanza técnica, stack aprobado, stack de expansión y tecnologías prohibidas en MaestroPescaderia.
---

# Workflow: /tech-stack

Activa y ejecuta las directrices de la skill `erp-tech-stack-governance` ubicada en `.agents/skills/erp-tech-stack-governance/SKILL.md`.

## Pasos de Ejecución
1. **Auditar Dependencias**:
   - Verificar si una librería o patrón propuesto cumple con la matriz de gobernanza técnica.
2. **Prevenir Violaciones Arquitectónicas**:
   - Bloquear dependencias de backend dedicadas, bases de datos externas redundantes o librerías de UI monolíticas.
