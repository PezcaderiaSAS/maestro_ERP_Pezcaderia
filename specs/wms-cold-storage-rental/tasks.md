# Lista de Tareas Atómicas: Alquiler de Cuarto Frío WMS 3PL

**Módulo:** `wms-cold-storage-rental`  
**Metodología:** TDD (Red-Green-Refactor) + Spec-Driven Development (Spec Kit)  
**Cobertura Mínima Requerida:** 80%+ (Actual: 100% en módulo, 22/22 tests superados)

---

## 🗄️ Fase 1: Base de Datos y Seguridad RLS (Supabase)
- [x] **Tarea 1.1**: Crear migración SQL `database/27_wms_cold_storage_rental.sql` con las 7 tablas del dominio (`cuartos_frios`, `clientes_custodia`, `productos_custodia`, `contratos_alquiler_cf`, `inventario_custodia`, `movimientos_custodia`, `causaciones_alquiler_cf`).
- [x] **Tarea 1.2**: Implementar políticas RLS deterministas multi-tenant vinculadas a `empresa_id` con JWT `app_metadata` y helper `public.get_current_empresa_id()`.
- [x] **Tarea 1.3**: Crear funciones RPC en PostgreSQL con bloqueo pesimista (`SELECT FOR UPDATE`):
  - `fn_registrar_recepcion_custodia()`: Incrementa atómicamente el stock en custodia y valida el cupo de 800 kg/posición.
  - `fn_registrar_despacho_custodia()`: Decrementa stock, calcula mermas y valida saldo remanente.
  - `fn_causar_ingreso_alquiler_cf()`: Genera el registro contable y vincula la factura.

---

## 📦 Fase 2: Validaciones y Lógica de Negocio (Backend & Schemas)
- [x] **Tarea 2.1**: Implementar esquemas Zod en `packages/validation-schemas/src/coldStorageRental.schema.ts`.
- [x] **Tarea 2.2**: Escribir pruebas unitarias en Vitest para validar:
  - Cálculo de capacidad nominal de 800 kg por posición.
  - Regla de recargo por sobrecupo en kilogramos extra.
  - Tarificación por días vs meses.
  - Cálculo de merma en báscula de salida.
- [x] **Tarea 2.3**: Crear servicio `src/services/coldStorageRentalService.ts` integrando llamadas seguras con transacciones y RPCs.

---

## 📄 Fase 3: Motor de Generación de Documentos PDF
- [x] **Tarea 3.1**: Plantilla PDF: Contrato de Alquiler de Espacio Frigorífico con cláusulas de temperatura y responsabilidad (`coldStoragePdfService.generarPdfContratoAlquiler`).
- [x] **Tarea 3.2**: Plantilla PDF: Acta de Recepción e Ingreso de Custodia con pesajes en báscula (bruto, tara, neto) y espacio para firmas (`coldStoragePdfService.generarPdfActaRecepcion`).
- [x] **Tarea 3.3**: Plantilla PDF: Acta de Despacho y Salida de Custodia con cálculo de saldo remanente y porcentaje de merma (`coldStoragePdfService.generarPdfActaDespacho`).
- [x] **Tarea 3.4**: Plantilla PDF: Certificado Oficial de Existencias en Custodia emitido a solicitud del cliente con fecha de corte (`coldStoragePdfService.generarPdfCertificadoCustodia`).

---

## 🎨 Fase 4: Frontend y Vistas de Usuario (Rico UI / Dark Glassmorphism)
- [x] **Tarea 4.1**: Crear submenú y ruta en el ERP: `alquiler_cf` en `src/App.tsx`.
- [x] **Tarea 4.2**: Componente Dashboard: Tarjetas de métricas de ocupación de cuartos fríos, posiciones disponibles vs contratadas, e ingresos acumulados del mes en `src/views/coldStorageRental/ColdStorageRentalView.tsx`.
- [x] **Tarea 4.3**: Modal de Registro/Edición de Contrato con selector de días/meses, posiciones (800 kg c/u) y condiciones de pago.
- [x] **Tarea 4.4**: Modal de Creación Versátil de Productos de Clientes (Solo peso, Peso estable 20kg, Mixto).
- [x] **Tarea 4.5**: Vista de Operaciones de Báscula / Actas de Entrada y Salida con verificación de pesaje en tiempo real.
- [x] **Tarea 4.6**: Modal de Emisión Rápida de Certificado de Inventario para envío al cliente por WhatsApp / Email.

---

## 🧪 Fase 5: Pruebas E2E y Aseguramiento de Calidad
- [x] **Tarea 5.1**: Suite de pruebas unitarias y de integración `src/tests/coldStorageRental.test.ts` (37/37 tests pasando al 100%).
- [x] **Tarea 5.2**: Verificación de tipos estricta con TypeScript (`npx tsc --noEmit` superado sin advertencias ni errores).
- [x] **Tarea 5.3**: Suite completa de regresión del ERP (26 archivos de test, 145 tests pasando al 100%).
- [x] **Tarea 5.4**: Registro normativo y formal en `ARCHITECT_GOVERNANCE.md` (Sección 10).

---

## 🚀 Fase 6: Optimización Operativa Integral y "La Regla de los 12 Años" (Aprobada en /grill-me)
- [x] **Tarea 6.1**: Motor determinista de cálculo de tara para Cajas, Canastillas y Suelto (`calcularTaraYNetoExacto`).
- [x] **Tarea 6.2**: Motor de liquidación para clientes por días vs meses (`calcularLiquidacionDias`).
- [x] **Tarea 6.3**: Semáforo visual de cartera y envejecimiento de deuda (`evaluarCarteraYVencimiento`).
- [x] **Tarea 6.4**: Generación de Recibo Oficial de Caja (Carta) y Ticket Térmico 80mm POS en `coldStoragePdfService`.
- [x] **Tarea 6.5**: Integración de cobro en caja con `cashService.registrarMovimiento`.
- [ ] **Tarea 6.6**: Rediseño de UI con "Asistente Operativo 1-2-3-4" en `ColdStorageRentalView.tsx` (Light Mode, WCAG AA+, tarjetas táctiles).
- [ ] **Tarea 6.7**: Verificación en vivo con Chrome DevTools (0 errores JS, vista 375px móvil y escritorio).
