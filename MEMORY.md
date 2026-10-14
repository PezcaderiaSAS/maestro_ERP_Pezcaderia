# Memoria Activa - La Pezcadería ERP

## Contexto Actual & Estado Global (Sesión 2026-10-14 - Entorno 100% Sincronizado)
- **Estado Global:** Sistema 100% en Modo Claro (Light Mode) WCAG 2.2 AA+ con tokens de diseño consolidados.
- **Git & Lifecycle Post-Pull:** Sincronizado. Al abrir nueva sesión tras `git pull`, ejecutar `npm run session:pull`.
- **Herramientas & Agentes en Marcha:**
  - Agency Swarm en Python 3.13 (`tools/agency-swarm/`) con 4 agentes (architect, data, ui, quality) operativos.
  - Impeccable UI Engine v0.1.14 y agentes integrados en `.agents/`.
  - GitNexus AST Index actualizado y servidor Vite en `http://localhost:3000/`.
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, 61 suites Vitest (424 tests) 100% verdes.

## Módulos y Tareas Completadas Recientemente
1. **Abstracción Central `AppRoute` (Completada):**
   - 21 rutas fuertemente tipadas en `src/routes/AppRoute.ts` con `RouteParamsMap`, RBAC declarativo y deep linking.
   - Limpieza de dead code en `EnterpriseTopbar.tsx` y `App.tsx`. 9/9 tests dedicados verdes.
2. **SPEC-013: Vendedor y Roles Obligatorios en POS (Completada):**
   - Mapeo estricto de roles de RRHH a `UserRole` en `src/utils/roleMapper.ts` con PIN por defecto `'1234'`.
   - Sesión de usuario persistente en `useAppStore` (`currentUser`) con sincronización reactiva en IndexedDB.
   - Componente táctil `UserSwitchModal.tsx` con keypad numérico $\ge 56\text{ px}$, 4 bullets enmascarados y shake en error.
   - Integración en `EnterpriseTopbar.tsx` (avatar interactivo con iniciales) y `POSView.tsx` (banner `#pos-seller-badge`).
   - Trazabilidad estricta de `vendedorId`, `vendedorNombre`, `cajeroId` en ventas y movimientos de caja. 12/12 tests verdes.

## Cola Priorizada para la Próxima Sesión (Iniciar tras git pull)
1. **Tarea 2 (Prioridad 1):** Ajustar las interfaces de usuario para que sean más simplificadas, recordando la regla del niño de 12 años (eliminar fricciones, aumentar áreas táctiles $\ge 48\text{ px}$, inputs auto-enfocados y feedback instantáneo).
2. **Tarea 3 (Prioridad 2):** Pruebas y flujo completo de cotizaciones B2B $\rightarrow$ pedidos de clientes $\rightarrow$ alistamiento en bodega $\rightarrow$ despacho a rutas, con trazabilidad de vendedor, operario alistador y conductor repartidor.
3. **Tarea 4 (Prioridad 3):** Facturación electrónica exclusiva para el módulo POS con validación DIAN.

## Protocolo de Arranque Post-Pull
- Ejecutar `npm run session:pull` (reindexa Graphify, GitNexus, valida `tsc --noEmit` y verifica Vite).
- Iniciar la **Tarea 2** invocando `/speckit.specify` con el enjambre de especialistas `/swarm` y `/grill-me`.
