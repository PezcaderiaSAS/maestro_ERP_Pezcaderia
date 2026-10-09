# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Personal de Bodega, Cajeros, Administradores y Operarios. Su labor ocurre en un ambiente dinámico (cuartos fríos, mostrador de ventas), donde necesitan interfaces rápidas y fiables de usar.

## Product Purpose
Sistema integral ERP, Punto de Venta (POS) y WMS para el control y operación de La Pezcadería. El éxito significa lograr un control total sobre el inventario, transacciones en tiempo real, arqueos de caja ciega y gestión operativa sin fricciones.

## Positioning
Software especializado en manejo de productos del mar y mermas. Incluye cálculos matemáticos deterministas de alta precisión (conversión gramos a kilos, análisis de rentabilidad mediante Pareto ABC 80/20) y trazabilidad de lotes (FEFO/FIFO). Utiliza una arquitectura moderna SSR enfocada en la robustez y fidelidad de los datos.

## Operating Context
Puntos de venta de ritmo rápido, cuartos fríos y zonas de preparación. Existen requerimientos críticos de concurrencia y transacciones atómicas distribuidas, con potencial sincronización de estado (caché multinivel).

## Capabilities and Constraints
- **Arquitectura:** Data-Driven SSR operando con base de datos.
- **Lenguaje:** TypeScript estricto.
- **Diseño visual:** Estético, Dark Mode Glassmorphism estricto sin componentes básicos genéricos. Rico UI Tokens.
- **Negocio:** Prohibido delegar lógica transaccional o matemática de inventario al cliente.

## Evidence on Hand
Sistema de diseño integrado documentado en DESIGN.md, tokens visuales importables y herramientas de interfaz de comandos ECC/Agentes (workflows, skills).

## Product Principles
1. **Determinismo y Exactitud:** La data de inventario y mermas rige el negocio y debe priorizar la metodología de Pareto (80/20).
2. **Robustez Arquitectónica:** Aislar y proteger el acceso a base de datos mediante el servidor (SSR + Prisma).
3. **Eficiencia Visual:** Interfaces con alta densidad de datos pero con un diseño impecable, moderno y responsivo que agilice la operación (Operate mode).
