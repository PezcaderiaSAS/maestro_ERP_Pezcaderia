# Memoria Activa - La Pezcadería ERP

## Contexto Actual (Movimientos de Dinero & Caja Operativa Bucaramanga)
- **Estado Global:** Módulo 004 (Egresos Operativos, Fletes Camión Bucaramanga, Liquidación Proveedores Costa y Arqueo Ciego) 100% completado y verificado.
- **Arquitectura:** Vite + React 18 + Zustand + SweetAlert2 + DevTools 375 px Loop.
- **Protocolo Activo:** `SOFTWARE_FACTORY_ANTIGRAVITY_DEFINITIVE_V3.1` (3.1-LAPTOP-DEVTOOLS-MANDATORY-LOOP).
- **Suite de Pruebas:** 48 archivos / 294 tests pasando (100% verde) + `tsc --noEmit` con 0 errores.
- **Regla de los 12 Años & Operativa:** Botones táctiles ≥ 52 px (`Salida de Dinero`), semáforo visual (verde = entra dinero, rojo = egresos/salidas), pestañas táctiles (`Todo`, `🛒 Ventas`, `🚚 Fletes`, `🐟 Pescado`, `💵 Gastos`), integración de pagos de fletes directo al descargar furgón en Bucaramanga y validación de fondos en efectivo con alternativa de transferencia o crédito (CxP).

## Decisiones Técnicas y Restricciones
- Integración dual: débito directo en 1 toque en `BucaramangaReceivingWizard` (Paso 3) y registro manual con presets y autocompletado en `CashFlowView` mediante `EgresoOperativoModal`.
- Validación estricta de saldo en efectivo (EARS-W01) evitando saldos negativos con opción alternativa de transferencia o deuda/crédito a proveedor.
- Facturación electrónica DIAN diferida por mandato del usuario; prioridad máxima a los flujos operativos de piso (compras camión, alistamiento, despacho, caja, alquiler frío).

## Siguientes Flujos Operativos Prioritarios
1. **Alquileres de Frío (WMS 3PL):** Pesaje por estiba (posiciones de 800 kg), tarifas por día/mes y actas de custodia de terceros.
2. **Transformación y Fileteo en Frío (Yield & Mermas):** Despiece táctil de pescado entero a filete/posta con balance de masa en vivo.
