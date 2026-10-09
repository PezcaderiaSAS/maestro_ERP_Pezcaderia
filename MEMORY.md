# Memoria Activa - La Pezcadería ERP

## Contexto Actual (POS Offline & Recepción WMS)
- **Estado Global:** Implementación del Módulo POS Offline-First (Mostrador táctil en frío) y Flujo de Traslado Rápido a Sucursal.
- **Vistas y Componentes Desarrollados:**
  - `PosDashboard.tsx`: Panel principal del POS, adaptado a táctil y diseñado para funcionar sin internet usando el patrón Outbox.
  - `useOutboxSync.ts`: Lógica de sincronización vía IndexedDB para capturar ventas y trasladarlas asíncronamente.
  - `BucaramangaReceivingWizard.tsx`: Integración del Traslado Rápido al final de la recepción (Liquidación).
- **Backend & Base de Datos (Pendiente):**
  - Creada la migración SQL `20261009124000_pos_fefo_sync.sql` con la función `rpc_pos_sync_fefo` para deducir de manera inteligente (FEFO) el stock vendido en el POS, soportando stock negativo.
  - **PENDIENTE PARA LA PRÓXIMA SESIÓN:** 
    1. Ejecutar `npx prisma db execute` o `supabase migration up` (falló por falta de la variable `DIRECT_URL` en el `.env`).
    2. Validar con DevTools la UI ya que hubo error 503 del subagente y fallo de conexión al puerto 5173 (actualmente Vite corre en el 3000).

## Siguientes Flujos Operativos Prioritarios
1. Resolver migraciones SQL para que Prisma se sincronice con Supabase (`DIRECT_URL`).
2. Continuar con Alquileres de Frío (WMS 3PL) y Actas de custodia.
3. Transformación y Fileteo en Frío (Yield & Mermas).

