---
description: Genera diagramas arquitectónicos C4, mapas de dependencias y análisis estructural de módulos con Mermaid.js.
---

# Workflow: /archify

Ejecuta el análisis arquitectónico automatizado y genera diagramas C4 (Contexto, Contenedor, Componente, Secuencia) para el sistema.

## Argumentos:
```bash
/archify [ruta_modulo] [--level c4|container|component|sequence] [--format mermaid|markdown]
```

## Fases de Ejecución:
1. **Inspección de Dependencias:** Analiza las importaciones y exportaciones del módulo especificado.
2. **Generación C4:** Compone el diagrama Mermaid correspondiente respetando la arquitectura de 3 capas (UI -> Service -> DB).
3. **Reporte de Acoplamiento:** Informa sobre acoplamiento y riesgos potenciales de refactor.

Consulta `.agents/skills/archify-architecture/SKILL.md` para patrones completos.
