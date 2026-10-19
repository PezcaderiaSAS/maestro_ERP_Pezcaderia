# Acuerdos de Clarificación Técnica (SPEC-023)

**Código:** SPEC-023  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.clarify` (Control de Calidad 1)  
**Fecha de Aprobación:** 2026-10-19  

---

## 1. Acuerdos de Arquitectura y Decisiones de Diseño

### 1.1 Punto de Acceso y Experiencia PWA Móvil Standalone
- **Decisión:** Se implementará una ruta dedicada y formal `AppRouteId.DRIVER_PORTAL = 'repartidor'` (URL `/repartidor`).
- **Comportamiento UX/UI:**
  - Cuando se cargue la ruta `/repartidor`, la aplicación detectará el modo móvil standalone y ocultará el `EnterpriseSidebar` y el `EnterpriseTopbar`, ofreciendo una experiencia 100% de pantalla completa nativa para smartphones (optimizada para viewports de $375\text{ px}$ a $430\text{ px}$).
  - En la vista de oficina de Despachos (`DispatchView.tsx`), se mantendrá un botón de acceso directo o simulador táctil para que los administradores de logística puedan auditar y visualizar las hojas de ruta tal como las ve el conductor en la calle.

### 1.2 Captura de Firma Digital Táctil con HTML5 Canvas Nativo
- **Decisión:** Cero dependencias externas pesadas (`signature_pad`, `react-signature-canvas`, etc. quedan descartadas).
- **Implementación:** Se desarrollará el componente `DriverSignaturePadCanvas.tsx` utilizando la API nativa de HTML5 Canvas con soporte dual para eventos táctiles (`touchstart`, `touchmove`, `touchend`) y puntero de ratón (`mousedown`, `mousemove`, `mouseup`).
- **Salida:** La firma se exporta como DataURL PNG comprimido en Base64 y se asocia a la `EvidenciaEntrega` del pedido, permitiendo visualización en la remisión y archivo legal digital.
- **Ergonomía:** Botón de "Borrar / Repetir Firma" $\ge 48\text{ px}$ y botón principal de "Aceptar Firma" $\ge 56\text{ px}$ (`h-14`).

### 1.3 Mecanismo de Ingreso y Seguridad del Conductor
- **Decisión:** Login convencional corporativo con correo electrónico y contraseña alfanumérica, garantizando gobernanza de seguridad, autenticación individual y trazabilidad legal de cada conductor que toma control del camión.
- **Ergonomía Táctil en Móvil:** Inputs de correo y contraseña con altura mínima $\ge 48\text{ px}$, teclado virtual apropiado (`inputMode="email"`, auto-capitalización desactivada), botón de visualización de contraseña y botón principal de inicio de turno $\ge 56\text{ px}$.

---

## 2. Mitigación de Riesgos y Edge Cases Identificados

| Riesgo Técnico / Operativo | Impacto | Estrategia de Mitigación en SPEC-023 |
| :--- | :---: | :--- |
| **Pérdida de señal celular al momento de firmar** | Crítico | La firma y los datos de entrega se persisten de inmediato en IndexedDB local (`caja_outbox_v2` / `entregas_outbox`). El conductor no percibe retrasos ni errores; el `backgroundSyncWorker` transmite en background al recuperar internet. |
| **Cliente rechaza parte de la carga por temperatura o daño** | Alto | El formulario de entrega permite marcar ítems devueltos especificando kilos y causal. El sistema recalcula el total a cobrar de contado en el acto y envía el lote devuelto a `CUARENTENA_CALIDAD`. |
| **Conductor cierra el navegador por error** | Medio | Persistencia continua de borrador en `localStorage` / `IndexedDB`; al reabrir la URL `/repartidor` la hoja de ruta y la parada activa se restauran exactamente en el paso donde se encontraba. |
| **Múltiples conductores usando el mismo vehículo en diferentes turnos** | Medio | El cierre de ruta o cierre de sesión borra la caché local de la ruta completada y solicita nuevas credenciales corporativas para el siguiente operador. |

---

## 3. Próximo Paso en el Flujo Preceptivo
Avanzar al Paso 3: **/speckit.checklist** (generación de la lista de verificación de calidad contra los estándares de la industria).
