# Memoria Activa - La Pezcadería ERP

## Contexto Actual (Módulo 6 - Abastecimiento & Compras Bucaramanga)
- **Estado Global:** Módulo de Compras Bucaramanga 100% completado y verificado. Wizard táctil de 3 pasos ("La Regla de los 12 Años") probado en DevTools (375px móvil con 0 errores de consola).
- **Arquitectura:** Vite + React 18 + Zustand + Supabase (PostgreSQL RPC `rpc_liquidar_recepcion_bucaramanga`).
- **Protocolo Activo:** `SOFTWARE_FACTORY_ANTIGRAVITY_DEFINITIVE_V3.1` (3.1-LAPTOP-DEVTOOLS-MANDATORY-LOOP).
- **Suite de Pruebas:** 46 archivos / 285 tests pasando (100% verde) + `tsc --noEmit` con 0 errores.
- **Logística Bucaramanga:** Furgones refrigerados vía carretera nacional. Prorrateo determinista de flete por kilo neto, cálculo de Landed Cost, deducción de anticipos bancarios y loteo FEFO en cavas de frío.

## Decisiones Técnicas y Restricciones
- Supabase se invoca a través de `getSupabaseClient()` en `src/lib/supabase.ts` con fallback offline a `localDb.ts`.
- Balanza digital con Web Serial API (`useBalanza`) y teclado táctil gigante (≥ 52 px).
- Facturación electrónica DIAN diferida por mandato del usuario; prioridad máxima a los flujos operativos de piso (ventas, despacho, caja, compras, alquiler frío).
- Multi-Theme Suite Activa: 4 temas Dark Glass (`pezcaderia-glass`, `hyper-cobalt`, `carbon-teal`, `chrome-violet`).

## Siguientes Flujos Operativos Prioritarios
1. **Alistamientos y Despachos B2B:** Picking en cuarto frío, control de mermas de salida y remisión de flete para reparto en Bucaramanga/Área Metropolitana.
2. **Movimientos de Dinero & Tesorería Operativa:** Integración bidireccional de pagos de flete y compras de contado con los arqueos de caja en `CashFlowView`.
3. **Alquileres de Frío (WMS 3PL):** Pesaje por estiba (posiciones de 800 kg), tarifas por día/mes y actas de custodia de terceros.
