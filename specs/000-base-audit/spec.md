# Spec 000: Auditoría Base del Proyecto (Brownfield)

## 1. Objetivo
Auditar la aplicación "La Pezcadería ERP" en su estado actual, validando la estabilidad de la consola y la responsividad del layout a 375px mediante Chrome DevTools, estableciendo el punto de partida seguro antes de la integración del módulo de Compras.

## 2. EARS - Functional Requirements
- **WHILE** en modo de inicialización o navegación, **THE SYSTEM SHALL** mantener la consola del navegador libre de errores fatales de JavaScript o bloqueos de ejecución.
- **WHILE** visualizado en resolución móvil (375px), **THE SYSTEM SHALL** renderizar de forma accesible el menú hamburguesa, la TopBar y el Navigation Drawer.
- **WHEN** el usuario hace clic en el menú hamburguesa, **THE SYSTEM SHALL** desplegar fluidamente el panel lateral sobre el dashboard principal.

## 3. Hallazgos de la Inspección (Chrome DevTools MCP)
- **Consola:** Sin errores de ejecución. Durante la inspección se reparó un error de importación crítico de Supabase (`SyntaxError: The requested module '/src/lib/supabase.ts' does not provide an export named 'supabase'`), garantizando un inicio limpio. Se detectó una advertencia benigna de LogRocket por tiempo de espera en metadatos de estilo.
- **Interfaz (375px):**
  - El Drawer de navegación (sidebar) se despliega correctamente.
  - El Dashboard muestra Tarjetas KPI verticales responsivas.
  - Widget de Calendario Ejecutivo y Botones Flotantes (Pruebas Dev) funcionales.
- **Estructura Base:** React 18, Vite, Zustand 5, Supabase RPC. 

## 4. Criterios de Aceptación (Completados)
- [x] Capturas de DevTools a 375px generadas y analizadas.
- [x] Consola limpia de errores en `localhost:3000`.
- [x] Sincronización de memoria base en `MEMORY.md`.
