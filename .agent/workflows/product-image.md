---
name: product-image
description: Generación automática de avatares SVG vectoriales temáticos para productos del mar a Costo 0 y compresión WebP.
---

# Workflow: /product-image

Activa y ejecuta las directrices de la skill `erp-product-visual-engine` ubicada en `.agents/skills/erp-product-visual-engine/SKILL.md`.

## Pasos de Ejecución
1. **Generar Avatar SVG Temático al Crear Producto**:
   - Clasificar semánticamente el nombre (Pescado, Marisco, Filete, Congelado, Insumo).
   - Asignar gradiente, iniciales y badge temático en formato Data URL SVG embebido (0ms, 0 bytes en Storage).
2. **Habilitar Generación Fotorrealista o Subida Manual**:
   - Permitir al usuario generar fotos fotorrealistas vía IA gratuita o capturar con cámara/archivo.
3. **Aplicar Compresión Client-Side WebP**:
   - Redimensionar a max 400x400 px y comprimir a WebP (<25 KB) antes de guardar en Storage o LocalStorage.
