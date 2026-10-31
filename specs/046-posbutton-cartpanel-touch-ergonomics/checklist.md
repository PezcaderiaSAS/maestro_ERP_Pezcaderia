# Checklist de Calidad y Criterios de Aceptación: SPEC-046
# Estandarización de Ergonomía Táctil POS, Componente Canónico PosButton y Rejilla Responsiva CartPanel

- **Código:** SPEC-046
- **Fase:** Spec Kit SDD v3.0 — `/speckit.checklist`
- **Estándares:** WCAG 2.1 AA/AAA, Apple HIG Touch Guidelines, Google Material Touch Targets (48px).

---

### 1. Checklist de Ergonomía e Interacción Táctil
- [ ] **CH-01 (Touch Target Size):** Todo botón dentro de `PosButton` mide al menos 48×48 px (`min-h-[48px] min-w-[48px]`) en vistas táctiles y móviles.
- [ ] **CH-02 (Separación Mínima):** La separación entre botones táctiles adyacentes es de mínimo 8px (`gap-2` o superior) para evitar toques involuntarios.
- [ ] **CH-03 (Microinteracción Háptica Visual):** Los estados `:hover`, `:active` y `:focus` proporcionan respuesta visual inmediata mediante `active:scale-[0.98]` y `focus:ring-2 focus:ring-emerald-500/50`.
- [ ] **CH-04 (Compatibilidad Teclado F1-F12):** Si el botón incluye un atajo de teclado, exhibe una etiqueta visual en tipografía mono (`<kbd>`) legible y sin cortar el texto del botón.

### 2. Checklist de Rejilla y Renderizado en CartPanel
- [ ] **CH-05 (Aislamiento de Scroll):** El contenedor de ítems del carrito posee `overflow-y-auto overscroll-contain`, evitando que el desplazamiento del carrito mueva el fondo de la pantalla.
- [ ] **CH-06 (Altura Mínima de Fila):** Cada fila de producto en el carrito tiene una altura mínima de 48px, garantizando legibilidad táctil para el cajero.
- [ ] **CH-07 (Cero Jitter Numérico):** Todos los precios, subtotales, cantidades y totales utilizan la clase `font-mono tabular-nums`.

### 3. Checklist de Accesibilidad y Color (WCAG 2.1 AA)
- [ ] **CH-08 (Ratio de Contraste Texto Principal):** Texto principal (`text-slate-100`) sobre fondo glass supera una relación de contraste de **12:1**.
- [ ] **CH-09 (Ratio de Contraste Texto Secundario):** Descripciones y metadatos (`text-slate-300`) superan una relación de contraste mínima de **4.5:1** contra el fondo.
- [ ] **CH-10 (Etiquetado ARIA):** Todo botón sin texto explícito (botones que solo contienen iconos como el tachito de basura o los signos `+` y `-`) cuenta con un atributo `aria-label` descriptivo.

### 4. Checklist de Blindaje Técnico y Regresión
- [ ] **CH-11 (Preservación de Props de CartPanel):** `CartPanelProps` mantiene todas sus propiedades intactas para asegurar 0 roturas en los 333 llamadores identificados por GitNexus.
- [ ] **CH-12 (Suite Vitest 100% Verde):** Las pruebas unitarias de ergonomía en `src/tests/posTouchErgonomics.test.tsx` pasan al 100%.
- [ ] **CH-13 (Bucle DevTools MCP):** 0 errores y 0 warnings en la consola JavaScript al auditar en vivo con viewport de 375 px y 1280 px.
