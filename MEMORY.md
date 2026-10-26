# Memoria Activa - La Pezcaderia ERP

## Contexto Actual & Estado Global (Sesión 2026-10-26 - Épica V8 Certificada)
- **Estado Global:** Sistema 100% bajo el Sistema de Diseño Oficial **Dark Glassmorphism V8** ([`DesignSystem_V8.md`](DesignSystem_V8.md)).
- **Quality Gate:** TypeScript estricto **0 errores (`tsc --noEmit`)**, Master Architect SOLID con 0 violaciones críticas (`passed = true`), y auditoría de 5 Diagramas Mermaid aprobada al 100%.
- **Frameworks IA (Tétrada Canónica):** Google Harness² y Agency Swarm auditados y ejecutados a costo $0 con Google Stitch MCP y tokens Rico UI Brands (`pezcaderia-glass`, `apple`).

## Módulos y Especificaciones en Marcha
1. **SPEC-025 (Completada 100% - CERTIFICADA):** Dispatcher HTTP Real SIIGO Nube API v2 (46/46 tests verdes).
2. **SPEC-026 (Completada 100% - CERTIFICADA):** Dashboard Métricas Logísticas OTIF B2B (36/36 tests + DevTools 0 errores).
3. **SPEC-027 (Completada 100% - CERTIFICADA):** Portal de Clientes B2B Auto-Servicio HORECA (35/35 Vitest + 6/6 Playwright E2E).
4. **SPEC-028 (Completada 100% - CERTIFICADA):** Precios Dinámicos, Márgenes Multicanal y Módulo de Mermas (36/36 tests).
5. **SPEC-029 (Completada 100% - CERTIFICADA):** Saneamiento Ergonómico POS (Keypad $\ge 56$px, 36/36 tests verdes).
6. **SPEC-030 (Completada 100% - CERTIFICADA):** Premium Sidebar UI macOS Style & Glassmorphism (11/11 tests).
7. **SPEC-031 (Completada 100% - CERTIFICADA - EPIC-FRONTEND-GLASSMORPHISM-V8):** Transformación Global del Frontend V8:
   - Documento Oficial: [`DesignSystem_V8.md`](DesignSystem_V8.md) y [`DOCS/DesignSystem_V8.md`](DOCS/DesignSystem_V8.md) con cálculos de $\alpha \in [0.75, 0.88]$, desenfoque $20\text{px} \times 180\%$ saturación, specular highlight y aceleración GPU `transform: translateZ(0)`.
   - Componente Atómico: [`GlassCard.tsx`](src/components/layout/components/GlassCard.tsx) con controles macOS semánticos (`#FF5F56`, `#FFBD2E`, `#27C93F`).
   - Topbar Flotante: [`EnterpriseTopbar.tsx`](src/components/layout/EnterpriseTopbar.tsx) (`rounded-2xl`, `bg-slate-900/85`, `backdrop-blur-2xl`, `border-white/12`).
   - Canvas Global en [`App.tsx`](src/App.tsx): Fondo `#0B0F19` con mesh gradients atmosféricos, Rail Mode (`w-20`) por defecto y layout flotante desacoplado.
   - 16/16 tests Vitest verdes (`globalLayoutV8.test.tsx` + `enterpriseSidebar.test.tsx`), 0 errores `tsc`, Harness² validado ($0 USD) y Chrome DevTools verificado en móvil (375 px) y desktop (1440 px).

## Cola de Tareas Priorizadas (WIP = 1)
1. **Tarea Siguiente:** Continuar con la migración de vistas secundarias (POS, Inventario, WMS) al estándar `GlassCard` de V8 o esperar siguiente requerimiento.
2. **Ciclo de Vida:** Ejecutar `npm run session:close` cuando el usuario decida cerrar la sesión de trabajo.

## Protocolo Brownfield Activo
- Límite Kanban estricto: `WIP = 1` (Una sola tarea activa a la vez).
- TDD Quirúrgico: Test RED -> Implementación GREEN -> Refactorización -> Checkpoint humano.
- Quality Gate obligatorio: `tsc --noEmit` en 0 errores, Vitest 100% verde y bucle DevTools en `http://localhost:3000/`.
