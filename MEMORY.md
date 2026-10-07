# Memoria Activa - La Pezcadería ERP

## Contexto Actual (Alistamientos y Despachos B2B Bucaramanga)
- **Estado Global:** Flujo de Alistamientos & Despachos de Rutas Metropolitanas 100% completado y verificado.
- **Arquitectura:** Vite + React 18 + Zustand + Web Serial API (`useBalanza`) + jsPDF Client.
- **Protocolo Activo:** `SOFTWARE_FACTORY_ANTIGRAVITY_DEFINITIVE_V3.1` (3.1-LAPTOP-DEVTOOLS-MANDATORY-LOOP).
- **Suite de Pruebas:** 47 archivos / 288 tests pasando (100% verde) + `tsc --noEmit` con 0 errores.
- **Logística Metropolitana Bucaramanga:** Rutas geográficas por zonas reales (Cabecera & Cañaveral, Floridablanca & Ruitoque, Girón & Centro, Piedecuesta & Mensulí, Zona Centro & San Francisco, Express BCM). Pesaje de alistamiento con báscula serial, descuento táctil de tara (canastilla 2 kg / icopor 0.5 kg), emisión de remisión WMS con QR y control térmico en furgón Thermo King.

## Decisiones Técnicas y Restricciones
- Balanza digital con Web Serial API (`useBalanza`) integrada en `WeighingModal` con botones táctiles ≥ 48 px.
- Facturación electrónica DIAN diferida por mandato del usuario; prioridad máxima a los flujos operativos de piso (compras camión, alistamiento, despacho, caja, alquiler frío).
- Multi-Theme Suite Activa: 4 temas Dark Glass (`pezcaderia-glass`, `hyper-cobalt`, `carbon-teal`, `chrome-violet`).

## Siguientes Flujos Operativos Prioritarios
1. **Movimientos de Dinero & Tesorería Operativa:** Integración bidireccional de pagos de flete y compras de contado con los arqueos de caja en `CashFlowView`.
2. **Alquileres de Frío (WMS 3PL):** Pesaje por estiba (posiciones de 800 kg), tarifas por día/mes y actas de custodia de terceros.
