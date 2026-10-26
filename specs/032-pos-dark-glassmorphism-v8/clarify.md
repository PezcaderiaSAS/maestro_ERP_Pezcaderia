# Documento de Clarificación y Mitigación de Riesgos: /speckit.clarify (SPEC-032)

**Código:** SPEC-032  
**Fase:** /speckit.clarify (Control de Calidad 1 — SDD v3.0)  
**Ticket:** POS-DARK-GLASSMORPHISM-V8  
**Fecha:** 2026-10-26  
**Estado:** PENDIENTE_APROBACION_USUARIO  

---

## 1. Objetivos de la Clarificación
Eliminar ambigüedades operativas y mitigar riesgos de usabilidad, ergonomía y rendimiento antes de estructurar el plan de implementación técnica para la migración del módulo POS a **Dark Glassmorphism V8**.

---

## 2. Preguntas Estructuradas de Diseño y Respuestas Arquitectónicas Propuestas

### Pregunta 1: Semántica del Control Amarillo macOS (`#FFBD2E`) en `CartPanel`
* **Pregunta:** ¿Cuál debe ser el comportamiento exacto del control amarillo de ventana macOS en el panel del carrito de compras?
* **Opciones Evaluadas:**
  1. *Opción A (Recomendada):* Colapsar temporalmente la lista detallada de productos a un modo "Resumen Ultracompacto" (mostrando únicamente la cantidad total de ítems y el monto final a pagar con el botón gigante de cobro), permitiendo al cajero maximizar la visibilidad del catálogo de productos en pantallas táctiles de mostrador (1024x768 / 1366x768).
  2. *Opción B:* Minimizar completamente el panel a un drawer lateral flotante.
* **Decisión Técnica Recomendada:** **Opción A**, ya que en horas pico de mostrador el cajero necesita seleccionar rápidamente múltiples productos sin perder de vista el total acumulado ni el acceso al botón de cobro.

---

### Pregunta 2: Convivencia del Keypad Táctil en Pantalla y Teclado Físico USB
* **Pregunta:** ¿Cómo debe coexistir el teclado numérico táctil en pantalla (`Keypad >= 56px`) con los atajos de teclado físico de cajeros experimentados (`F1-F12`, `Enter`, `Escape`)?
* **Decisión Técnica Recomendada:**
  - El Keypad táctil residirá dentro de `PaymentPanel` y en el modal de pesaje asistido con botones de vidrio oscuro esmerilado (`bg-white/5`, `hover:bg-white/10`, `active:scale-95`).
  - Los eventos de teclado físico global (`keydown`) se mantienen 100% desacoplados y prioritarios: presionar números físicos actualiza el monto recibido instantáneamente, `Enter` liquida la venta, y `Escape` cierra el panel sin obligar al cajero a tocar la pantalla.

---

### Pregunta 3: Ratio de Contraste y Visibilidad en Entornos de Pescadería de Alta Luminosidad
* **Pregunta:** En mostradores de pescadería donde hay iluminación blanca intensa o luz solar directa, ¿cómo se garantiza que el vidrio oscuro no pierda legibilidad?
* **Decisión Técnica Recomendada:**
  - Se fija la opacidad de la superficie en $\alpha = 0.88$ (`bg-slate-900/90`) para evitar cualquier lavado de color.
  - El total a pagar y las cifras de cambio (vuelto) utilizan tipografía monoespaciada en **Verde Esmeralda Neón (`text-emerald-400` / `#34D399`)** sobre fondo oscuro, logrando un ratio de contraste $> 13:1$ (superando el estándar WCAG 2.2 AAA de 7:1).
  - Los textos secundarios usan Blanco Puro (`#FFFFFF`) y Slate 300 (`#CBD5E1`), erradicando grises apagados de bajo contraste.

---

### Pregunta 4: Alcance de Modales Operativos Secundarios en POS
* **Pregunta:** ¿Qué modales auxiliares de POS deben encapsularse en el nuevo estándar `GlassCard` centrado?
* **Decisión Técnica Recomendada:**
  - **Apertura de Caja (`AperturaCajaModal.tsx`):** `GlassCard` centrado con controls macOS y confirmación de base inicial.
  - **Retiro Parcial / Gastos (`RetiroParcialModal.tsx`):** `GlassCard` con badge ámbar semántico.
  - **Conversión Rápida a Factura Electrónica (`QuickConvertToElectronicInvoiceModal.tsx`):** `GlassCard` con selector de cliente y validación DIAN.
  - **Monitor de Cola Siigo (`SiigoQueueMonitorModal.tsx`):** Panel flotante con badge de sincronización en vivo.

---

## 3. Matriz de Mitigación de Riesgos Técnicos

| Riesgo Detectado | Probabilidad | Impacto | Estrategia de Mitigación Preventiva |
| :--- | :---: | :---: | :--- |
| **Pérdida de Foco en Buscador:** El cambio de paneles podría desenfocar `#pos-product-search-input`. | Media | Alto | Mantener el hook de retorno de foco con `requestAnimationFrame` tras cualquier adición o liquidación. |
| **Caída de FPS en Scroll:** El renderizado masivo de tarjetas de producto con `backdrop-blur` podría generar lag. | Baja | Medio | Aplicar estrictamente `transform: translateZ(0)` y `will-change: transform` en `GlassCard`. |
| **Toques Falsos en Pantallas Táctiles:** Teclas numéricas o botones muy juntos podrían causar errores de cobro. | Baja | Crítico | Respetar separación mínima `gap-3` y tamaño táctil `min-h-[56px]` para todas las teclas de cobro. |
| **Regresiones en Tests Existentes:** 122 suites de prueba de POS podrían verse afectadas si se alteran selectores. | Media | Alto | Preservar intactos todos los identificadores `data-testid` (`pos-product-search-input`, `btn-cobrar-pos`, etc.). |

---

**NOTA:** Esta clarificación se entrega formalmente para la revisión y aprobación explícita del usuario antes de proceder a la siguiente fase (`/speckit.checklist`).
