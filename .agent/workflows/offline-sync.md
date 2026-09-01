---
name: offline-sync
description: Arquitectura Offline-First, IndexedDB, patrón Outbox y sincronización resiliente de transacciones para POS y WMS.
---

# Workflow: /offline-sync

Activa y ejecuta las directrices de la skill `offline-first-outbox-sync` ubicada en `.agents/skills/offline-first-outbox-sync/SKILL.md`.

## Pasos de Ejecución
1. **Configurar Almacenamiento Local en IndexedDB**:
   - Asegurar que las colecciones maestras y la cola `outbox_events` estén indexadas por `status` y `createdAt`.
2. **Implementar Flujo de Encolamiento Outbox**:
   - Toda operación de venta o inventario en modo offline debe persistir atómicamente en IndexedDB.
3. **Controlar la Sincronización Automática**:
   - Escuchar eventos `window.addEventListener('online')` y procesar la cola FIFO con idempotencia.
