# Lista de Verificación de Calidad (Checklist) - SPEC-055

## 1. Accesibilidad y Ergonomía Visual (WCAG 2.2 AA / AAA)
- [ ] **Ratio de Contraste de Texto:** El nombre del producto (`.product-card-name`) debe superar un ratio de contraste de **11.5:1** contra el fondo de la tarjeta (`#FFFFFF` o `#F8FAFC` sobre fondos oscuros).
- [ ] **Eliminación de Regla Destructiva CSS:** Purgar `.product-card-name { color: #0f172a !important; }` en `src/index.css` que provocaba el blackout del texto.
- [ ] **Contenedor Visual No Deslumbrante:** Eliminar `background-color: #F1F5F9` en `.product-image-container` en `src/index.css` y reemplazarlo por un fondo translúcido coherente con Dark Glassmorphism (`bg-slate-950/60` o `rgba(15, 23, 42, 0.6)`).
- [ ] **Compatibilidad de Clases en ProductAvatar:** Mantener clases de compatibilidad con pruebas unitarias (`bg-emerald-50`, etc.) pero permitiendo que en el contexto de dark mode no deslumbre la tarjeta.
- [ ] **Etiqueta de Precio Tabular:** Precio visible con alto contraste numérico, destacado en color blanco o verde esmeralda, evitando fondos `#0f172a !important`.

## 2. Ergonomía Táctil y Ley de Fitts
- [ ] **Área de Impacto Táctil:** Tarjetas con altura mínima $\ge 110\text{px}$ y tamaño táctil suficiente para ser pulsadas cómodamente en pantalla táctil de mostrador.
- [ ] **Feedback Táctil:** Preservar `active:scale-95` y transición suave al pulsar o pasar el puntero (`hover:border-cyan-500/40`).
- [ ] **Badges de Modalidad (KILOS vs UNIDAD):** Claramente legibles en la esquina superior izquierda de cada tarjeta.
- [ ] **Semáforo de Stock:** Indicador circular verde/amarillo/rojo en la esquina superior derecha sin tapar el badge ni el avatar.

## 3. Arquitectura y Reglas del Proyecto
- [ ] **Regla del Niño de 12 Años (Cero Imágenes Externas):** 100% renderizado con íconos vectoriales SVG Lucide React en modo mostrador rápido.
- [ ] **TypeScript Estricto:** Cero errores de compilación (`tsc --noEmit`).
- [ ] **100% Pruebas Pasando:** 0 regresiones en las suites existentes (`posAndCash12YearsRule.test.tsx`, `frontendAbyssalThemeV8.test.tsx`, `m2POSMultivendor.test.tsx`, `productAvatarComponent.test.tsx`, etc.).
- [ ] **GitNexus Blast Radius:** Riesgo evaluado como BAJO y verificado antes y después de los cambios.

