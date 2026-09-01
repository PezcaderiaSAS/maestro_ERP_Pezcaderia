---
name: wms-inventory
description: Gestión de cuartos fríos WMS, trazabilidad de lotes perecederos FEFO/FIFO, mermas de despiece y cálculo ABC Pareto 80/20.
---

# Workflow: /wms-inventory

Activa y ejecuta las directrices de la skill `wms-cold-storage-inventory` ubicada en `.agents/skills/wms-cold-storage-inventory/SKILL.md`.

## Objetivo
Guiar la arquitectura, desarrollo, migración o refactorización de los módulos de almacenamiento, cuartos fríos, trazabilidad de lotes perecederos y control de inventario de La Pezcadería ERP.

## Pasos de Ejecución
1. **Analizar el Contexto WMS**:
   - Verificar si la operación involucra peso variable (`catch_weight`), productos congelados o frescos.
   - Identificar ubicaciones físicas en planta (`wms_locations`) y cuartos fríos.
2. **Aplicar Regla FEFO**:
   - Priorizar siempre la fecha de expiración más próxima (`expiration_date ASC`) para picking y despacho.
3. **Calcular Mermas y Rendimiento**:
   - Si es un proceso de despiece o transformación, aplicar la fórmula de rendimiento y costo unitario neto.
4. **Verificar Concurrencia y Persistencia**:
   - Utilizar reservas atómicas y metadatos estructurados en `inventory_lots` (PostgreSQL + JSONB).
