# Memoria Activa - La Pezcadería ERP

## Contexto Actual (Módulo 3 - Compras)
- **Estado Global:** Auditoría Base completada. Interfaz móvil 375px funcionando. Componentes WMS y POS completados. Importación de Supabase reparada (`getSupabaseClient`).
- **Arquitectura:** Vite + React + Zustand + Supabase (PostgreSQL RPC).
- **Protocolo Activo:** `BROWNFIELD_PROJECT_RESTRUCTURING_AND_SOFTWARE_FACTORY` (v2.2-DEFINITIVE-DEVTOOLS-MANDATORY-LOOP).
- **Mandatos SDD:** 
  1. No editar código sin especificación (ears) aprobada.
  2. Aplicar TDD con Vitest (`node --test`).
  3. Verificación obligatoria con Chrome DevTools (375px) post-cambio.
  4. Mantener la UI responsiva y libre de errores en consola.

## Decisiones Técnicas y Restricciones
- Supabase se invoca a través de `getSupabaseClient()` en `src/lib/supabase.ts`.
- Persistencia local en IndexedDB.
- Control concurrente vía Supabase RPC (`SELECT FOR UPDATE`).
- Uso de **Google Stitch** como MCP de diseño visual.

## Próximos Pasos (Roadmap)
1. **Módulo de Compras:** Crear especificación y plan.
2. Módulos siguientes: Cartera, Pedidos, Alquiler de Frío, Gastos.
