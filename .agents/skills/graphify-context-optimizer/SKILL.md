---
name: graphify-context-optimizer
description: Integra la ejecución de Graphify para mantener el contexto arquitectónico actualizado y extraer información filtrada, optimizando el uso de tokens.
---

# Graphify Context Optimizer

Este skill está diseñado para ser invocado automáticamente por agentes (como los orquestados por Ruflo y ECC) antes de realizar tareas complejas, modificaciones arquitectónicas profundas o análisis a gran escala en el proyecto MaestroPescadería.

Su propósito fundamental es garantizar que el agente cuente con el contexto más actualizado de la base de código, generado por Graphify, y **minimizar drásticamente el consumo de tokens** al consultar selectivamente el output en lugar de ingerir todo el repositorio.

## Flujo de Trabajo Obligatorio (Hook)

Siempre que te enfrentes a un problema arquitectónico o necesites contexto de las dependencias, debes seguir este proceso:

### 1. Actualización del Grafo (Si es necesario)
Si sospechas que se han hecho cambios recientes y el grafo no está actualizado, ejecuta el flujo de Graphify para generar un nuevo mapeo:

```powershell
powershell -ExecutionPolicy Bypass -File .\.agent\workflows\graphify_run.ps1
```

### 2. Filtrado y Optimización de Tokens (¡CRÍTICO!)
Según la **Constitución de La Pezcadería**, tienes **PROHIBIDO** leer archivos fuente masivamente.

*NUNCA* intentes leer el archivo `graphify-out/graph.json` completo de una sola vez. En su lugar, debes utilizar las herramientas a tu disposición para hacer consultas específicas.

Para obtener contexto de un módulo particular, utiliza comandos como:

```powershell
graphify query "nombre_del_componente"
```

O, alternativamente, utiliza herramientas de búsqueda como `grep_search` directamente sobre `graphify-out/graph.json` para extraer únicamente los nodos o edges (relaciones) que contengan las palabras clave del módulo en cuestión.

## Integración con ECC / Ruflo
Este skill sirve como un **instinto** o **regla** primaria para tu agente. Debe procesarse antes que las lecturas de archivos de código fuente. Cuando otro agente te solicite un análisis de arquitectura (ej. `/speckit.analyze`), este flujo debe ser tu primera acción antes de emitir un plan.
