---
name: pdf-docs
description: Motor de generación de documentos PDF empresariales, facturas, remisiones WMS, nómina y tickets térmicos.
---

# Workflow: /pdf-docs

Activa y ejecuta las directrices de la skill `erp-enterprise-pdf-engine` ubicada en `.agents/skills/erp-enterprise-pdf-engine/SKILL.md`.

## Objetivo
Diseñar, implementar o refactorizar generadores de documentos PDF vectoriales profesionales de alta legibilidad, cumplimiento normativo fiscal y empresarial.

## Pasos de Ejecución
1. **Seleccionar el Formato y Plantilla de Documento**:
   - Factura Comercial / Facturación Electrónica (Carta/A4).
   - Remisión de Despacho y Lotes FEFO para WMS (Carta/A4).
   - Desprendible de Nómina y Liquidación en 2 Columnas (Carta).
   - Comprobante de Arqueo de Caja Ciega (Carta/Media Carta).
   - Ticket POS Térmico (80mm o 58mm).
2. **Aplicar Renderizado Vectorial Client-Side (jsPDF)**:
   - Evitar HTML-to-Canvas para garantizar nitidez tipográfica vectorial y pesos menores a 100 KB.
3. **Formatear Grillas y Alineaciones**:
   - Encabezados claros, líneas divisorias sutiles, numeración en moneda local alineada a la derecha y paginación `Página X de Y`.
