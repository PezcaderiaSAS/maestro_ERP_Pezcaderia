# Memoria Activa - La Pezcadería ERP

## Contexto Actual (Categorías Rápidas e Inteligentes de Egresos de Caja)
- **Estado Global:** Módulo 005 (Categorías Rápidas e Inteligentes de Egresos de Caja / Smart Quick Picks) 100% completado y verificado.
- **Arquitectura:** Vite + React 18 + Zustand + SweetAlert2 + DevTools 375 px Loop.
- **Protocolo Activo:** `SOFTWARE_FACTORY_ANTIGRAVITY_DEFINITIVE_V3.1` (3.1-LAPTOP-DEVTOOLS-MANDATORY-LOOP).
- **Suite de Pruebas:** 49 archivos / 299 tests pasando (100% verde) + `tsc --noEmit` con 0 errores.
- **Regla de los 12 Años & Operativa:** Botones táctiles ≥ 52 px (`Salida de Dinero`), creación en caliente táctil sin salir del modal ni perder montos (`+ Otra Categoría` con selector de 6 emojis y guardado reactivo en `EgresoOperativoModal`), ranking Top 6 inteligente de categorías según uso en el día/turno, catálogo semilla persistido en `localDb` (`Flete Camión`, `Pago Pescado`, `Hielo/Cavas`, `Insumos Bodega`, `Pago Domicilios`, `Cafetería/Refrigerios`, `Aseo/Limpieza`, `Gasto Menor`), prevención de duplicados insensible a mayúsculas/tildes (EARS-W01) y pestañas de filtro dinámicas con badges automáticos en `CashFlowView`.

## Decisiones Técnicas y Restricciones
- Integración dual: débito directo en 1 toque en `BucaramangaReceivingWizard` (Paso 3) y registro manual con presets y creación en caliente en `CashFlowView` mediante `EgresoOperativoModal`.
- Validación estricta de saldo en efectivo (EARS-W01) evitando saldos negativos con opción alternativa de transferencia o deuda/crédito a proveedor.
- Persistencia local multi-tenant en clave `pezcaderia_categorias_gastos` con sincronización de ranking por frecuencia de movimientos.
- Facturación electrónica DIAN diferida por mandato del usuario; prioridad máxima a los flujos operativos de piso (compras camión, alistamiento, despacho, caja, alquiler frío).

## Siguientes Flujos Operativos Prioritarios
1. **Alquileres de Frío (WMS 3PL):** Pesaje por estiba (posiciones de 800 kg), tarifas por día/mes y actas de custodia de terceros.
2. **Transformación y Fileteo en Frío (Yield & Mermas):** Despiece táctil de pescado entero a filete/posta con balance de masa en vivo.

