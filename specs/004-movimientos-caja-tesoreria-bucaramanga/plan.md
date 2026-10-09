# Plan Técnico: Movimientos de Dinero, Fletes Bucaramanga y Tesorería Operativa

**Módulo:** Flujo de Cajas, Egresos Operativos y Arqueo Ciego en Bucaramanga  
**Arquitectura:** React 18 + Zustand + LocalDb/Supabase + TypeScript Estricto  
**Pipeline:** /orch-add-feature + SDD Spec-Kit + Grill-Me Validado  

---

## Fases de Implementación

### Fase 1: Arquitectura de Datos y Extensión de Servicios (`cashService.ts` & `purchasesBucaramangaService.ts`)
- Permitir clasificar egresos en `cashService` con categorías operativas amigables:
  - `FLETE_TRANSPORTE`: Pago a transportador de furgón con placa y guía de transporte.
  - `PAGO_PROVEEDOR_PESCADO`: Liquidación de compra de contado con consecutivo de recepción.
  - `ANTICIPO_COMPRA`: Anticipo a proveedor foráneo en puerto.
  - `INSUMOS_HIELO_CAVA`: Hielo en escamas, combustible o empaques.
  - `GASTO_OPERATIVO_GENERAL`: Otros gastos menores de local.
- Conectar `purchasesBucaramangaService.ts` con `cashService.ts`:
  - Función `registrarEgresoRecepcionBucaramanga(cajaId, turnoId, tipo, monto, metodoPago, referencia, usuarioId)`.
  - Validación preventiva de fondos: si el saldo en efectivo no alcanza, permitir alternar a transferencia bancaria o marcar como cuenta por pagar (crédito con proveedor).

### Fase 2: Componente Táctil de Egresos Operativos (`EgresoOperativoModal.tsx`)
- Crear `src/views/cash/components/EgresoOperativoModal.tsx`:
  - Botones táctiles de gran tamaño (≥ 52 px) para selección rápida de motivo:
    - 🚚 **Pagar Flete de Camión** (selector de furgón/placas o digitación rápida).
    - 🐟 **Pagar Pescado a Proveedor** (selector de recepciones pendientes de pago de contado).
    - 🧊 **Hielo para Cava o Salmuera** (egreso menor rápido).
    - 💸 **Gasto Operativo General**.
  - Selector táctil de método de pago: `EFECTIVO` (con validación de saldo disponible y aviso en caso de insuficiencia), `TRANSFERENCIA`, `DATAFONO`.
  - Alerta amigable si los fondos no alcanzan con botón directo para cambiar a "Transferencia Bancaria" o "Mover a Crédito (CxP)".
  - Botón gigante de confirmación (rojo/carmesí táctil `btn-confirmar-egreso`).

### Fase 3: Integración en el Wizard de Descargue (`BucaramangaReceivingWizard.tsx`)
- En el Paso 3 del Wizard ("Guardar en Frío y Liquidar"):
  - Añadir sección táctil: "¿Pagar flete o compra desde caja de hoy?"
  - Si se activa y hay turno abierto en bodega Bucaramanga, permite seleccionar:
    - Pagar Flete desde Caja Activa ($X COP).
    - Pagar Saldo al Proveedor desde Caja Activa ($Y COP).
  - Al presionar "Guardar en el Frío y Finalizar", registra los lotes en cava y debita de la caja en una sola transacción operativa transparente.

### Fase 4: Modernización Táctil de `CashFlowView.tsx` ("La Regla de los 12 Años")
- Reemplazar el prompt Swal antiguo por el nuevo `EgresoOperativoModal`.
- Agregar pestañas táctiles con iconos claros:
  - `Todo`
  - `🛒 Entradas de Ventas`
  - `🚚 Fletes de Camión`
  - `🐟 Pagos Pescado`
  - `🧊 Insumos y Gastos`
- Tarjetas de movimiento con semáforo y etiquetas legibles para operarios.
- Botones de acción táctiles de 48-52 px.

### Fase 5: TDD, Verificación con DevTools (375 px) y Gate 2 Commit
- Tests unitarios en `src/tests/cashPurchasesIntegration.test.ts`.
- Ejecutar `tsc --noEmit` y suite completa de Vitest.
- Auditoría en vivo en Chrome DevTools MCP con emulación móvil de 375 px y 0 errores en consola JS.
