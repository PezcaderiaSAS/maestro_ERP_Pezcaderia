# Plan de Arquitectura y Ejecución Multi-Agente (/swarm)
## Módulo: Modernización de Caja POS (Cash Engine)

---

## 👥 Matriz de Roles y Asignación de Tareas del Enjambre

| Especialista | Rol en el Enjambre | Responsabilidades en la Tarea |
| :--- | :--- | :--- |
| **`SoftwareArchitect`** | Líder de Orquestación | Máquina de estados de turnos (`ABIERTO` -> `CERRADO` -> `AUDITADO`), contratos de API y orquestación general. |
| **`DataEngineer`** | Especialista de Base de Datos | Migración SQL `28_pos_cash_engine.sql` en Supabase, funciones RPC atómicas con `SELECT FOR UPDATE` para retiros parciales y cierres de turno, y políticas RLS multi-tenant. |
| **`UIReviewer`** | Especialista Frontend & UX/UI | Refactorización de `PaymentPanel.tsx` con botones de denominación rápida, visor de cambio en números gigantes, selección intuitiva de Nequi/Daviplata y atajos de teclado (`Enter`, `Espacio`, `Esc`). |
| **`QualityEngineer`** | Especialista de Pruebas & Schemas | Esquema Zod en `packages/validation-schemas/src/posCashEngine.schema.ts`, suite unitaria Vitest con casos límite de vuelto/descuadre y prueba Playwright E2E. |

---

## 🗺️ Fases de Ejecución

### Fase 1: Arquitectura de Datos y Migración SQL (DataEngineer)
- Crear migración `database/28_pos_cash_engine.sql`.
- Funciones RPC transaccionales:
  - `fn_abrir_turno_pos`: Inicializa turno y valida que el cajero no tenga otro turno activo.
  - `fn_registrar_retiro_parcial_pos`: Reduce el saldo en gaveta y genera comprobante de traslado a Caja Mayor.
  - `fn_cerrar_turno_pos`: Ejecuta arqueo, calcula diferencias, valida umbral de tolerancia y genera el acta de cierre.
- Aplicar políticas RLS para `empresa_id`.

### Fase 2: Validaciones y Esquemas Zod (QualityEngineer)
- Definir esquemas para denominaciones colombianas, cobros simples y pagos mixtos.
- Pruebas unitarias de cálculo matemático determinista (saldo teórico vs real, desglose de denominaciones, cálculo de vuelto exacto).

### Fase 3: Capa de Servicios y Conectores Frontend (SoftwareArchitect)
- Crear `src/services/posCashEngineService.ts` conectando con Supabase y RPCs seguras con fallback resiliente.
- Integración de plantillas de impresión térmica ESC/POS para:
  - Ticket de venta con detalle de cambio y medios de pago.
  - Comprobante de Retiro Parcial firmado.
  - Acta de Cierre de Turno y Arqueo.

### Fase 4: Experiencia de Usuario y Mostrador Táctil (UIReviewer)
- Actualizar `PaymentPanel.tsx` con:
  - Botones de billetes ($10.000, $20.000, $50.000, $100.000 y Pago Exacto).
  - Visor gigante de Cambio / Vuelto (`text-4xl font-black tabular-nums`).
  - Selector de medios de pago: Efectivo, Nequi, Daviplata, QR Bancolombia, Datafono, Crédito.
  - Atajos de teclado en el listener de ventana.
- Actualizar `ArqueoCajaModal.tsx` y `CierreCajaModal.tsx` con soporte para arqueo ciego o asistido según el rol.
- Banner de alerta preventiva cuando el efectivo acumulado supere el tope configurado.

### Fase 5: Verificación E2E y Calidad (QualityEngineer & SoftwareArchitect)
- Prueba Playwright E2E: Flujo completo de apertura -> venta rápida con cambio -> retiro parcial -> arqueo ciego -> cierre de turno.
- Verificación de tipos `npx tsc --noEmit`.
- Suite completa Vitest (`npm test`).
