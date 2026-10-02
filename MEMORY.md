# Memoria Viva del Proyecto (Estado Actual)
**Última Actualización:** 2026-10-02

## 1. Estado Actual
- **Fase:** Auditoría Inicial (Protocolo V2.2) y estabilización post-estructuración.
- **Backend:** Supabase, Edge Functions.
- **Frontend:** React 18, Vite 5, Zustand, TanStack Query, TailwindCSS.

## 2. Decisiones Técnicas Activas
- **SDD Activo:** Todo cambio requiere Spec, Plan y Tasks en `specs/`.
- **Inspección DevTools:** Obligatoria en cada bucle por parte de @implementer y @reviewer tras cada actualización de código.
- **Fechas:** Siempre fechas locales; NUNCA UTC para lógica de negocio de usuarios.
- **Arquitectura:** Data-driven, componentes funcionales puramente orientados a interfaces.

## 3. Errores Conocidos y Patrones a Evitar
- **Estado Inicial de Consola:** 0 Errores, 0 Advertencias (confirmado en auditoría inicial con DevTools).
- **Flujo Inicial:** El modal de Habeas Data (Ley 1581) bloquea la operación hasta ser aceptado. El renderizado móvil a 375px está funcionando y ajustándose correctamente al diseño.
