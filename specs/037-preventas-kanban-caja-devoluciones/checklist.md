# Lista de Verificación de Calidad: SPEC-037
## Flujo de Preventa Multivendedor, Kanban en Caja Única, Despacho Verificado y Sidebar Compacto

**Código:** SPEC-037  
**Fase:** Spec Kit SDD v3.0 — `/speckit.checklist`  
**Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). Optimización Desktop/Laptop.  
**Fecha:** 2026-10-27  

---

### 1. Ergonomía y Optimización para Pantallas Desktop & Laptop (1366x768 a 1080p)
- [ ] **Sin Scroll Vertical Forzado:** En laptops de 1366x768 px, la pantalla de preventa (búsqueda, tabla de líneas y panel de totales con botón de confirmación) se visualiza completa dentro del viewport inicial.
- [ ] **Kanban de 3 Columnas sin Scroll Horizontal:** Las columnas `En Espera`, `En Cobro` y `Pagado / Para Despacho` se distribuyen en cuadrícula responsive paralela, con scroll vertical individual e independiente por columna (`overflow-y-auto`).
- [ ] **Atajos de Teclado Retail de Alta Frecuencia:**
  - `F1`: Enfocar búsqueda de producto / SKU.
  - `F2`: Confirmar y emitir Preventa (generación de ticket térmico con QR).
  - `F3`: Buscar o cambiar cliente.
  - `F4`: Abrir panel de descuento (validado hasta 10% máximo).
  - `F9`: Procesar cobro en ventanilla de caja.
  - `Ctrl+B`: Colapsar / expandir menú lateral.
  - `Esc`: Cerrar modales activos y devolver foco al flujo principal.

---

### 2. Gobernanza de Roles y Reglas de Negocio
- [ ] **Vendedores sin Recaudo:** Los usuarios con rol `vendedor` tienen estrictamente denegado el acceso a movimientos de caja, arqueos, recepción de dinero y botón de cobro final.
- [ ] **Límite de Descuento (10% Default):** Si el vendedor ingresa un descuento $> 10\%$ o rebaja el precio unitario por debajo del umbral autorizado en el tenant, se bloquea la confirmación y se exige autorización con PIN de supervisor (`SupervisorPinModal`).
- [ ] **Reserva Inmediata de Stock (Hard-Hold):** Al emitir la preventa, el inventario disponible descuenta las cantidades reservadas de forma atómica para evitar sobreventas concurrentes entre los 8 asesores.
- [ ] **Despacho con Doble Verificación:** El asesor no puede marcar como `DESPACHADA` ninguna preventa que no esté en estado `PAGADA`. La verificación se efectúa mediante escaneo de QR de factura o pulsación en la bandeja en tiempo real.

---

### 3. Aislamiento Multi-Tenant Estricto (Zero Cross-Tenant Leakage)
- [ ] **Filtro Foráneo en Base de Datos:** Las tablas `pos_prefacturas` e `items_prefactura` cuentan con columna `tenant_id NOT NULL REFERENCES public.tenants(id)` e índice B-Tree dedicado.
- [ ] **Políticas Row Level Security (RLS):** Toda consulta `SELECT`, `INSERT`, `UPDATE` exige `tenant_id IN (SELECT public.current_user_tenant_ids())`.
- [ ] **Suscripción en Tiempo Real Aislada:** El canal Supabase Realtime para el tablero Kanban escucha exclusivamente con filtro `tenant_id=eq.<ID>`.
- [ ] **Purga en Logout:** Al cerrar sesión o cambiar de empresa, los stores Zustand vacían íntegramente las preventas en memoria y las suscripciones activas.

---

### 4. Menú Lateral (Sidebar) Compacto con Leyes de UX
- [ ] **Ley de Miller:** Menú estructurado en 4 grupos compactos ($\le 7$ ítems por perfil).
- [ ] **Ley de Fitts:** Botones de navegación táctiles con altura mínima de 48px y espaciado de 8px en rail de 64px.
- [ ] **Ley de Hick:** Sin insignias o textos saturados; tooltips flotantes translúcidos estilo macOS Dark Glassmorphism V8 (`#070A10`).
