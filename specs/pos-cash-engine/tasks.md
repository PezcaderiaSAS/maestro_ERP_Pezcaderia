# Lista de Tareas Atómicas: Modernización de Caja POS (Cash Engine)

**Módulo:** `pos-cash-engine`  
**Metodología:** TDD + Spec-Driven Development + /swarm Orchestrator  
**Cobertura Mínima Requerida:** 80%+  

---

## 🗄️ Fase 1: Base de Datos y Seguridad RLS (Supabase) [@DataEngineer]
- [x] **Tarea 1.1**: Crear migración SQL `database/28_pos_cash_engine.sql` con las tablas `cajas_pos`, `turnos_pos`, `arqueos_pos_detalles` y `movimientos_pos_caja`.
- [x] **Tarea 1.2**: Implementar políticas RLS multi-tenant vinculadas a `empresa_id` con `WITH CHECK` y fallback a `public.get_current_empresa_id()`.
- [x] **Tarea 1.3**: Crear funciones RPC en PostgreSQL con bloqueo pesimista (`SELECT FOR UPDATE`):
  - `fn_abrir_turno_pos`: Valida turno único activo por cajero y registra la base inicial.
  - `fn_registrar_retiro_parcial_pos`: Reduce saldo en gaveta y genera comprobante con consecutivo.
  - `fn_cerrar_turno_pos`: Calcula diferencias, valida umbral de tolerancia (< $5.000 COP) y genera acta de cierre.
- [x] **Tarea 1.4**: Ejecutar y aplicar migración en el proyecto de Supabase.

---

## 📦 Fase 2: Validaciones y Lógica de Negocio (Backend & Schemas) [@QualityEngineer]
- [x] **Tarea 2.1**: Implementar esquemas Zod en `packages/validation-schemas/src/posCashEngine.schema.ts`.
- [x] **Tarea 2.2**: Escribir pruebas unitarias en Vitest para validar:
  - Cálculo determinista de cambio/vuelto en efectivo.
  - Validación de pago exacto y montos mínimos de cobro.
  - Desglose de denominaciones de billetes y monedas colombianas.
  - Clasificación de descuadres (dentro de tolerancia, faltante a cobrar, sobrante a ingreso).
- [x] **Tarea 2.3**: Crear servicio `src/services/posCashEngineService.ts` integrando llamadas a Supabase y RPCs transaccionales.

---

## 🎨 Fase 3: Experiencia de Usuario y Mostrador Rápido (UI/UX) [@UIReviewer]
- [x] **Tarea 3.1**: Actualizar `PaymentPanel.tsx`:
  - Botones de billetes rápidos ($10k, $20k, $50k, $100k, Pago Exacto).
  - Visor gigante de Cambio / Vuelto de alta legibilidad (`tabular-nums`).
  - Selector de billeteras digitales (Nequi, Daviplata, QR Bancolombia, Datafono, Efectivo, Crédito).
  - Atajos de teclado físico (`Enter` para cobrar, `Espacio` para exacto, `Esc` para cancelar).
- [x] **Tarea 3.2**: Modal de Retiro Parcial (*Drop / Alivio de Caja*) con botón manual y banner de alerta cuando se exceda el tope de efectivo configurado (`RetiroParcialModal.tsx`).
- [x] **Tarea 3.3**: Modal de Arqueo y Cierre de Turno configurable: modo ciego para cajeros y asistido para supervisores con tolerancia de $5.000 COP (`ArqueoCajaModal.tsx`).
- [x] **Tarea 3.4**: Plantilla de impresión de tickets térmicos ESC/POS para Venta con desglose de vuelto, Retiro Parcial y Acta de Cierre.

---

## 🧪 Fase 4: Pruebas E2E y Certificación [@SoftwareArchitect & @QualityEngineer]
- [x] **Tarea 4.1**: Escribir y ejecutar prueba Playwright E2E: `tests/e2e/pos-cash-engine.spec.ts`.
- [x] **Tarea 4.2**: Verificación de tipos TypeScript (`npx tsc --noEmit` completado con 0 errores).
- [x] **Tarea 4.3**: Verificación de la suite completa de pruebas de regresión del ERP (`npx vitest run` 143/143 tests passing).
