# Lista de Verificación de Calidad: /speckit.checklist (SPEC-029)

**Código:** SPEC-029  
**Fase:** /speckit.checklist (SDD v3.0)  
**Dominio:** Ventas POS / Ergonomía Táctil / UI-UX Industrial  
**Estado:** PENDIENTE_APROBACION_USUARIO  
**Fecha:** 2026-10-26  

---

## 1. Estándares de la Industria y Leyes de UX Evaluadas

Esta lista de verificación audita la implementación del Sprint 3 frente a estándares globales de ergonomía, accesibilidad y rendimiento:

### 1.1. Accesibilidad y Ergonomía Táctil (WCAG 2.2 & Ley de Fitts)
- [ ] **[CHK-UX-01] Tamaño de Áreas de Toque Primarias:** Todo botón de acción primaria (Cobrar, 1-Tap, Teclas Numéricas del Keypad) tiene un tamaño de al menos $56\text{ px} \times 56\text{ px}$ (`min-h-[56px]`).
- [ ] **[CHK-UX-02] Tamaño de Áreas de Toque Secundarias:** Todo botón secundario, chip de billete, pestaña o selector mide al menos $48\text{ px} \times 48\text{ px}$ (`min-h-[48px]`).
- [ ] **[CHK-UX-03] Separación de Controles:** Separación mínima de $8\text{ px}$ (`gap-2`) entre botones interactivos adyacentes para prevenir toques involuntarios ("Fat Finger Problem").
- [ ] **[CHK-UX-04] Contraste WCAG 2.2 AAA:** Las cifras numéricas de KPIs y subtotales presentan un ratio de contraste $\ge 7:1$ (objetivo $\ge 12:1$ con texto `text-slate-900` sobre fondos blancos `bg-white`).
- [ ] **[CHK-UX-05] Supresión de Teclado del OS:** Uso de `inputMode="none"` en inputs integrados al Keypad propio para evitar la intrusión del teclado virtual del sistema operativo en tablets.

### 1.2. Rendimiento y Usabilidad Cognitiva (Umbral de Doherty & Ley de Miller)
- [ ] **[CHK-PERF-01] Umbral de Doherty (<400 ms):** Toda acción de agregar producto, actualizar cantidad o calcular cambio responde visualmente en $<50\text{ ms}$ mediante Zustand.
- [ ] **[CHK-PERF-02] Flujo de Cobro en $\le 3$ Pasos:** Flujo estándar: 1. Elegir Producto $\rightarrow$ 2. Verificar Total $\rightarrow$ 3. Cobrar 1-Tap (o Efectivo).
- [ ] **[CHK-PERF-03] Ley de Miller & Barra de Control Canónica:** La barra de control superior no satura al usuario; expone como máximo 3 botones primarios y agrupa las acciones secundarias en "Más Acciones...".
- [ ] **[CHK-PERF-04] Cero Imágenes (Zero-Cost Vector):** Cero etiquetas `<img>` y cero peticiones de red externas para avatares en POS; 100% iconografía vectorial semántica con Lucide React en modo `vectorOnly`.

### 1.3. Arquitectura y Robustez de Software (SOLID & Resiliencia)
- [ ] **[CHK-ARCH-01] Type-Safety de Navegación:** Cero magic strings de rutas (`'precios'`, `'dashboard'`); uso exclusivo de `AppRouteId.PRICING` y `AppRouteId.DASHBOARD`.
- [ ] **[CHK-ARCH-02] Aislamiento de Capas:** Los componentes de vista no invocan clientes de infraestructura directamente; delegan en `usePOSCart`, `useCashStore` y `localDb`.
- [ ] **[CHK-ARCH-03] Resiliencia Offline:** En ausencia de red, las ventas con tirilla física se completan y encolan en Outbox sin interrumpir la operación de mostrador.
- [ ] **[CHK-ARCH-04] Compilación Estricta:** `tsc --noEmit` finaliza con 0 errores de tipos en todo el proyecto.
- [ ] **[CHK-ARCH-05] Suite Vitest & DevTools:** 100% de tests unitarios e integraciones POS pasando, y consola en vivo con 0 errores JS en `http://localhost:3000/`.
