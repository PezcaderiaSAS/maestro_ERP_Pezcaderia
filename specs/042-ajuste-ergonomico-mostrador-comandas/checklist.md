# Checklist de Calidad y Criterios de Aceptación — SPEC-042
**Ajuste Ergonómico del Mostrador para Comandas y Ciclo de Vida Preventa**

---

## 1. Ergonomía Visual y Layout (Resolución del Solapamiento)
- [ ] **Estructura Flexbox Unidireccional:** El contenedor principal `pos-cart-panel` implementa `flex flex-col h-full min-h-0 overflow-hidden` (sin scroll global exterior ni superposición).
- [ ] **Eliminación de `sticky bottom-0`:** El pie del carrito (`pos-cart-footer`) se posiciona con `shrink-0 mt-auto`, asegurando que **nunca** flote ni tape la cabecera ni los ítems del carrito.
- [ ] **Área de Scroll Encapsulada:** `pos-cart-items-list` es el **único** elemento con `flex-1 min-h-0 overflow-y-auto`, permitiendo desplazamiento táctil y con rueda sin alterar cabecera ni pie.
- [ ] **Resolución 1024×768 / 1366×768:** En laptops y pantallas de mostrador compactas, todos los elementos permanecen visibles sin solapamiento ni recorte visual.
- [ ] **Estado Vacío Ergonómico:** Con `0 ítems`, se visualiza un placeholder compacto ($\le 90\text{px}$) sin empujar el pie fuera del viewport ni causar saltos de diseño.

---

## 2. Estándar Dark Glassmorphism V8 (`DesignSystem_V8.md`)
- [ ] **Eliminación de Fondos Claros:** Erradicación total de `bg-slate-50`, `border-slate-200`, `bg-indigo-50` y `bg-amber-50` en `CartPanel`, `ParkedOrdersBar` y `DiscountPanel`.
- [ ] **Tokens Canónicos V8:** Integración con `bg-slate-900/60`, `border-white/10`, specular highlights y `backdrop-blur-xl`.
- [ ] **Contraste WCAG 2.2 AA+:** En `DiscountPanel.tsx`, los textos de montos reemplazan el color `#0F172A` por `text-slate-200` o `#F1F5F9`, garantizando legibilidad total sobre fondos oscuros.
- [ ] **Colorimetría de Estado:** Botón principal de preventa en gradiente `from-cyan-600 to-blue-600` activo, y `bg-white/5 text-slate-500` cuando está deshabilitado.

---

## 3. Experiencia Operativa del Asesor de Mostrador (`isMostradorAuto`)
- [ ] **Segregación Estricta:** El Asesor de Mostrador **no visualiza** el panel de cobro (`PaymentPanel`), ni métodos de liquidación, ni arqueo de gaveta.
- [ ] **Botón Gigante de Comanda:** El botón `EMITIR PREVENTA / COMANDA (F6)` cumple con altura táctil $\ge 50\text{px}$ y atajo de teclado `F6` plenamente funcional.
- [ ] **Cabecera Optimizada:** Selector de cliente y contador de borradores organizados de modo que no se quiebren en dos líneas en anchos de mostrador ($\sim 380\text{px}$).
- [ ] **Barra Multicliente Adaptativa:** Se despliega elegantemente sin consumir altura innecesaria cuando no hay ventas en espera.

---

## 4. Aseguramiento de Calidad y Pruebas (TDD)
- [ ] **Pruebas Unitarias & Renderizado:**
  - `src/tests/asesorMostradorSinCobro.test.tsx` (100% pasando).
  - `src/tests/posCartPanelErgonomics.test.tsx` (100% pasando).
  - `src/tests/posDarkGlassmorphismV8.test.tsx` (100% pasando).
- [ ] **TypeScript Estricto:** `npx tsc --noEmit` con 0 errores de tipado.
- [ ] **Bucle DevTools:** Verificación en vivo en `http://localhost:3000/` con 0 errores en consola JS y renderizado en 375px móvil y 1280px escritorio.

