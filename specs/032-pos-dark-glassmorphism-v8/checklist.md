# Lista de Verificación de Calidad: /speckit.checklist (SPEC-032)

**Código:** SPEC-032  
**Fase:** /speckit.checklist (SDD v3.0)  
**Ticket:** POS-DARK-GLASSMORPHISM-V8  
**Título:** Checklist de Aseguramiento de Calidad y Criterios de Aceptación — Módulo POS V8  
**Fecha:** 2026-10-26  
**Estado:** PENDIENTE_APROBACION_USUARIO  

---

## 1. Estándares Visuales y Físicos de Vidrio (Dark Glassmorphism V8)

- [ ] **Opacidad y Densidad Óptica ($\alpha$):** Los paneles `GlassCard` en `POSView`, `CartPanel` y `PaymentPanel` implementan $\alpha \in [0.85, 0.90]$ (`bg-slate-900/85` o `bg-slate-900/90`) para evitar lavado de fondo.
- [ ] **Difusión Gaussiana y Saturación:** Desenfoque profundo `backdrop-blur-2xl` ($16\text{px}-24\text{px}$) y realce de saturación `backdrop-saturate-180`.
- [ ] **Reflejo Especular Superior:** Borde superior iluminado mediante `inset 0 1px 0 0 rgba(255, 255, 255, 0.15)` y borde perimetral `border-white/12`.
- [ ] **Aceleración por Hardware GPU:** Declaración de `transform: translateZ(0)` y `will-change: transform` para garantizar 60 FPS estables sin tirones durante el scroll de productos.
- [ ] **Controles de Ventana macOS Semánticos:**
  - [ ] Rojo (`#FF5F56`): Confirmación de salida o cancelar venta mediante SweetAlert2 Dark Glass.
  - [ ] Amarillo (`#FFBD2E`): Alternar modo ultracompacto / detallado en `CartPanel`.
  - [ ] Verde (`#27C93F`): Alternar pantalla completa (`document.fullscreenElement`).

---

## 2. Ergonomía Táctil y Accesibilidad (Regla del Niño de 12 Años & WCAG 2.2 AAA)

- [ ] **Dimensiones Táctiles Mínimas Innegociables:**
  - [ ] Botón gigante COBRAR / LIQUIDAR: Altura $\ge 56\text{ px}$.
  - [ ] Teclas del Keypad numérico en pantalla: Altura $\ge 56\text{ px}$ y ancho $\ge 56\text{ px}$.
  - [ ] Chips de denominaciones rápidas de billetes COP ($10k, $20k, $50k, $100k): Altura $\ge 48\text{ px}$.
  - [ ] Chips de categorías y botones de acción secundaria: Altura $\ge 48\text{ px}$.
- [ ] **Ratio de Contraste Tipográfico WCAG 2.2 AAA:**
  - [ ] Cifras de total a pagar y cambio (vuelto): Tipografía monoespaciada en **Verde Esmeralda Neón (`text-emerald-400` / `#34D399`)** con ratio $> 13:1$.
  - [ ] Textos principales: Blanco Puro (`#FFFFFF` / `text-white`) con ratio $> 14:1$.
  - [ ] Textos secundarios: Slate 300 (`#CBD5E1`) con ratio $> 9:1$.
- [ ] **Retroalimentación Táctil Visual:** Micro-animación física en teclas y botones (`active:scale-95 transition-all`).
- [ ] **Regla de Cero Imágenes:** 0 etiquetas `<img>` externas; toda la iconografía se resuelve mediante vectores semánticos de Lucide React (`ShoppingBag`, `CreditCard`, `Coins`, `Scale`, `Receipt`, etc.).

---

## 3. Integridad Funcional, Hardware y Persistencia Offline

- [ ] **Preservación Incondicional de Foco:** Retorno automático inmediato de foco a `#pos-product-search-input` tras agregar un producto, cambiar cantidades o liquidar un cobro.
- [ ] **Doble Operación Táctil + Atajos de Teclado Físico:** Captura limpia de atajos globales (`F1` para búsqueda, `F2` para pesaje, `F12` para cobrar, `Enter` para liquidar, `Escape` para cerrar).
- [ ] **Pesaje Serial / WebUSB y Asistido:** Comunicación sin fallas con `useBalanza` y modal de peso manual para pescadería a granel.
- [ ] **Persistencia Financiera y Redondeo COP:** Almacenamiento en `localDb` / IndexedDB con redondeo entero COP (sin centavos) y actualización de saldo de caja en `useCashStore`.
- [ ] **Tirilla Térmica de 40 Columnas:** Generación de ticket POS en formato estándar de 40 columnas con encabezado fiscal y QR DIAN.

---

## 4. Gobernanza de Arquitectura, Build y Testing

- [ ] **Compilación TypeScript Estricta:** `tsc --noEmit` completado con **0 errores**.
- [ ] **Cero Regresiones en Pruebas Automatizadas:** 100% de los tests unitarios y de integración de POS pasando en verde (incluyendo `posSearchAndWeighing.test.tsx`, `posTouchErgonomics.test.tsx`, `posCartPanelErgonomics.test.tsx`, `posQuickCashAndReturnFocus.test.tsx`).
- [ ] **Validación en Vivo Chrome DevTools:** 0 errores y 0 warnings en la consola de JavaScript en `http://localhost:3000/`.
- [ ] **Verificación Responsiva:** Renderizado fluido y touch targets válidos en vista móvil iPhone SE (**375 px**) y desktop (**1440 px**).

---

**NOTA:** Esta lista de verificación se entrega formalmente para la revisión y aprobación explícita del usuario antes de proceder a la siguiente fase (`/speckit.plan`).
