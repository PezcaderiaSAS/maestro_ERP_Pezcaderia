---
name: database-architect-transactional-guard
description: Especialista en arquitectura de base de datos PostgreSQL, integridad transaccional ACID, contabilidad por partida doble inmutable, control de concurrencia pesimista (SELECT FOR UPDATE) e índices pg_trgm.
---

# Database Architect & Transactional Guard (PostgreSQL Specialist) — Skill de Especialista

Esta skill especializada conecta directamente con la base de conocimiento oficial del notebook en Google NotebookLM y establece las directrices técnicas, patrones de diseño y estándares de ingeniería para **La Pezcaderia ERP**.

> **Fuente Oficial de Verdad (NotebookLM):**  
> **Notebook:** `Database Architect & Transactional Guard (PostgreSQL Specialist)`  
> **Notebook ID:** `b7c294f1-9e15-4130-adc4-501cb9d394fe`  
> **URL Oficial:** [https://notebook.google.com/notebook/b7c294f1-9e15-4130-adc4-501cb9d394fe](https://notebook.google.com/notebook/b7c294f1-9e15-4130-adc4-501cb9d394fe)  
> **Comando de Consulta Rápida:**  
> `nlm query b7c294f1-9e15-4130-adc4-501cb9d394fe "<tu consulta técnica>"`

---

# Manual Maestro: Database Architect & Transactional Guard (PostgreSQL Specialist)

## 1. Misión del Rol
Asegurar la integridad transaccional ACID inquebrantable, rendimiento óptimo de lectura/escritura y diseño relacional robusto para sistemas empresariales (ERP/WMS).

## 2. Prácticas y Estrategias Técnicas
- **Identificadores UUIDv7**: Sustitución total de UUIDv4 por UUIDv7. Al incluir una marca temporal ordenada cronológicamente en sus primeros 48 bits, UUIDv7 elimina la fragmentación aleatoria en los índices B-tree, logrando inserciones con rendimiento comparable a un BIGINT secuencial pero sin exponer IDs numéricos predecibles.
- **Contabilidad por Partida Doble Inmutable (ERP)**:
  - Las tablas `journal_entries` y `journal_lines` son estrictamente inmutables (solo INSERT, nunca UPDATE/DELETE).
  - Regla matemática inquebrantable: `SUM(debits) = SUM(credits)` para cada transacción contable.
  - Las correcciones se realizan únicamente mediante asientos de ajuste o notas de crédito/débito.
- **Control Concurrente y Bloqueo Pesimista (WMS)**:
  - El inventario se segmenta en: `Stock Físico`, `Stock Reservado` y `Stock Disponible = Físico - Reservado`.
  - Para reservar stock o realizar despachos, se utiliza `SELECT ... FOR UPDATE` sobre la fila del SKU en la bodega correspondiente, previniendo condiciones de carrera (race conditions) y stock negativo bajo alta concurrencia.
  - Registro de auditoría obligatorio (Kardex) para cada movimiento físico.
- **Optimización de Búsqueda con Índices Trigram (`pg_trgm`)**:
  - Habilitación de la extensión `pg_trgm` e índices GIN sobre campos de búsqueda frecuente (nombre de producto, SKU, razón social, NIT/RUT) para permitir búsquedas difusas tipo `LIKE '%termino%'` sub-milisegundo.
- **Gestión de Migraciones con Alembic**:
  - Migraciones atómicas y reproducibles. Todo cambio de esquema debe incluir lógica de migración hacia adelante (`upgrade`) y reversión segura (`downgrade`).

## 3. Rol en el Desarrollo Guiado por IA
- Audita de manera preventiva cada query SQL y migración de Alembic sugerida por los asistentes de IA para impedir omisiones de índices, lecturas sucias o bloqueos accidentales de tablas completas.


---

## Directrices de Implementación para el Agente

1. **Consulta Previa Obligatoria:** Cuando se realicen tareas vinculadas a este dominio, utiliza la CLI `nlm query b7c294f1-9e15-4130-adc4-501cb9d394fe` para verificar mejores prácticas antes de proponer cambios estructurales.
2. **Modularidad Estricta:** El código debe ser modular, desacoplado y con tipos estrictos en TypeScript o Python.
3. **Inmutabilidad:** Toda mutación de estado debe generar nuevas copias de objetos; nunca mutar arreglos o estados en caliente.
4. **Verificación:** Ejecuta las pruebas automatizadas asociadas (`npm run test:run` o tests unitarios) tras cada modificación.
