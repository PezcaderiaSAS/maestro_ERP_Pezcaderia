# Informe Técnico: Arquitectura de Memoria Episódica en Marco MAR (Multi-Agent Reflexion)
**Proyecto:** `maestro_ERP_Pezcaderia`
**Subsistema:** Orquestación Multi-Agente & RAG (Retrieval-Augmented Generation)
**Estado:** Aprobado para Implementación

## 1. Visión General y Riesgos Mitigados
La introducción de una base de datos vectorial como memoria episódica a largo plazo permite al Agente "Actor" consultar el consenso histórico del Agente "Juez" antes de generar mutaciones en el código. Para evitar la **degradación del contexto (Context Rot)** y penalizaciones por **latencia I/O**, esta arquitectura descarta la búsqueda vectorial ingenua en favor de una **Búsqueda Híbrida (Weaviate o Qdrant)**, combinando filtrado estricto de metadatos con recuperación semántica, apoyada por un mecanismo de invalidación basado en el Árbol de Sintaxis Abstracta (AST).

## 2. Esquema de Almacenamiento (Storage & Embeddings)
Se prohíbe el uso de modelos de *embedding* de texto genérico. Las reflexiones se vectorizarán utilizando modelos optimizados para sintaxis de programación (ej. `jina-embeddings-v2-base-code` o `text-embedding-3-large`).

### 2.1. Estructura del Payload (Metadatos)
Cada consenso del Juez se almacenará con el siguiente esquema de metadatos obligatorios para permitir el *Hard Filtering*:

```json
{
  "vector_id": "uuid-v4",
  "component_path": "src/views/pos/components/PaymentPanel.tsx",
  "ast_hash": "sha256-hash-del-ast-en-el-momento-del-consenso",
  "version_tag": "v1.2.0",
  "timestamp": "2026-06-27T11:20:00Z",
  "ttl_expiry": "2026-09-27T11:20:00Z",
  "status": "ACTIVE", // Estados permitidos: ACTIVE | OBSOLETE
  "reflection_text": "Texto detallado del consenso arquitectónico y la resolución del fallo..."
}
```

## 3. Flujo de Recuperación y Generación Aumentada (Retrieval)
El Agente Actor no consultará la base de datos de manera indiscriminada. La memoria se invoca mediante el siguiente pipeline estructurado:

1. **Triggering Estratégico:** La búsqueda solo se activa si la tarea afecta un archivo catalogado como CRITICAL en el grafo de conocimiento, o si la iteración actual es producto de un rechazo (ej. fallo del linter o test de regresión).
2. **Hard Filtering (Fase de Descarte):** El motor descarta vectorialmente cualquier registro que cumpla: `status == 'OBSOLETE'` OR `timestamp > ttl_expiry`.
3. **Búsqueda Semántica Híbrida:** Sobre el subconjunto filtrado, se recuperan los 3 consensos (Top-K=3) más cercanos a la intención del Actor.
4. **Inyección de Contexto (MCP):** Las reflexiones se anexan al System Prompt del Actor utilizando delimitadores XML estrictos para separar el contexto histórico de las instrucciones operativas actuales.

## 4. Mitigación de Degradación: El Agente Limpiador AST
Para mantener la cordura del sistema y evitar que el Actor implemente patrones obsoletos, se introduce un demonio en segundo plano (Agente Limpiador).

* **Operación:** Se ejecuta como un hook post-commit o un proceso cron.
* **Lógica de Invalidación:** Escanea los archivos indexados en la base de datos vectorial. Recalcula el hash del Árbol de Sintaxis Abstracta (`current_ast_hash`).
* **Regla de Caducidad:** Si `current_ast_hash` difiere del `ast_hash` almacenado (indicando una refactorización estructural significativa del archivo), el Agente Limpiador ejecuta una mutación sobre Weaviate/Qdrant, actualizando el campo `status` a `OBSOLETE`.

## 5. Integración con Model Context Protocol (MCP)
Las interacciones de lectura/escritura de los agentes con la base de datos vectorial se encapsularán exponiendo las siguientes herramientas a través de un servidor MCP local:

* `mcp.query_episodic_memory(query, component_path)`: Utilizada por el Agente Actor para recuperar contexto (ejecuta pre-filtrado automático bajo el capó).
* `mcp.store_judge_consensus(reflection, component_path, ast_hash)`: Utilizada exclusivamente por el Agente Juez al finalizar exitosamente un ciclo MAR.
* `mcp.invalidate_obsolete_memory(component_path)`: Utilizada por el Agente Limpiador para forzar el decaimiento.

***

**ESTADO ACTUAL:** Fase 3 completada. El ciclo de diseño y control de riesgos para la arquitectura MAR RAG ha finalizado exitosamente.
