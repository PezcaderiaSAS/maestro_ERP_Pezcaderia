# Control de Calidad 1: /speckit.clarify — Preguntas Estructuradas y Decisiones Validadas (SPEC-029)

**Código:** SPEC-029  
**Fase:** /speckit.clarify (SDD v3.0)  
**Dominio:** Ventas POS / Ergonomía Táctil / UI-UX Industrial  
**Estado:** DECISIONES_APROBADAS_POR_USUARIO  
**Fecha:** 2026-10-26  

---

## 1. Decisiones Arquitectónicas Aprobadas

### Decisión 1: Disposición del On-Screen Keypad Táctil
* **Acuerdo:** **Modal / Popover Táctil Emergente de Alta Respuesta.**
* **Comportamiento:** Al tocar cualquier campo de cantidad o peso en `CartPanel` o `LineaVentaRow`, o al invocar el modal de peso manual, se despliega el Keypad con teclas gigantes ($\ge 56\text{ px}$), visor numérico grande y botón de confirmación. Se cierra automáticamente tras confirmar o presionar `Enter`/`Escape`.
* **Beneficio:** Mantiene el catálogo de productos y el resumen de venta con máxima área visible, sin saturar la pantalla con un teclado fijo permanente.

### Decisión 2: Supresión del Teclado Nativo del OS (`inputMode="none"`)
* **Acuerdo:** **Bloquear teclado virtual nativo del sistema operativo.**
* **Comportamiento:** Los inputs vinculados al Keypad táctil propio llevarán el atributo `inputMode="none"`, impidiendo que Windows, iOS o Android abran su teclado en pantalla sobre el ERP. Los cajeros con teclado físico USB o teclado numérico de escritorio podrán seguir digitando números normalmente a través de listeners de teclado estándar.
* **Beneficio:** Cero solapamiento de la interfaz del ERP y experiencia de terminal punto de venta pura.

### Decisión 3: Automatismo del Cobro Rápido 1-Tap (`F8` / `Espacio`)
* **Acuerdo:** **Cobro Directo e Instantáneo a 1 Toque.**
* **Comportamiento:** Al presionar `⚡ Cobro Rápido 1-Tap (F8)` en venta con efectivo exacto:
  1. Liquidación inmediata en Zustand (<50 ms).
  2. Persistencia en `localDb` / Outbox.
  3. Emisión de ticket térmico vía `usePOSPrinter`.
  4. Limpieza del carrito y reposicionamiento instantáneo del foco en `#pos-product-search-input` para la siguiente atención.
* **Beneficio:** Máxima velocidad de despacho en mostrador sin pasos intermedios superfluos (Regla del Niño de 12 Años).

---

## 2. Matriz de Mitigación de Riesgos Cerrada

| Riesgo Técnico / Operativo | Severidad | Solución Acordada | Estado |
| :--- | :---: | :--- | :---: |
| **Digitación errónea en pantallas sucias/húmedas** | ALTA | Teclas $\ge 56\text{ px}$, botón de retroceso (`Backspace`) gigante y visor de moneda con separador de miles. | CERRADO |
| **Solapamiento del teclado nativo del OS** | ALTA | `inputMode="none"` en inputs asistidos por el keypad propio. | CERRADO |
| **Latencia o doble cobro accidental en 1-Tap** | MEDIA | Debounce interno de 500 ms en el botón `⚡ Cobro Rápido 1-Tap` y desactivación instantánea mientras se procesa. | CERRADO |
| **Venta en mostrador sin red** | ALTA | Mutaciones optimistas en Zustand L1 (<50 ms), guardado local en IndexedDB L2 y encolamiento en Outbox con emisión de tirilla local. | CERRADO |
