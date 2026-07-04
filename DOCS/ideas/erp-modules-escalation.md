# ERP Modules Escalation (Ventas, Contabilidad, Despachos, Inventario)

## Problem Statement
¿Cómo podríamos evolucionar el actual sistema POS de MaestroPescadería hacia un ERP completo e interconectado (Ventas, Base Contable, Despachos e Inventarios ABC) sin sacrificar el rendimiento, respetando la arquitectura estricta (Data-Driven, React/Supabase) y preparándonos para la escalabilidad multi-sucursal?

## Recommended Direction
**Modular Monolith Data-Driven.** Mantener un solo repositorio frontend (React + Vite) pero separar estrictamente los dominios de negocio en servicios (`cashService`, `accountingService`, `dispatchService`, `inventoryService`). La comunicación en tiempo real para cajas y despachos se logrará mediante **Supabase Realtime**, mientras que el análisis de inventario ABC se centralizará a través de consultas analíticas. Esto permite escalabilidad sin la sobrecarga inicial de microservicios, asegurando que la caja (POS) sea rápida y el *backend* consolide la verdad (Libro Mayor).

## Key Assumptions to Validate
- [ ] **Rendimiento de Realtime:** Asumimos que Supabase Realtime puede manejar la concurrencia de múltiples sucursales facturando y despachando simultáneamente sin degradación de velocidad. (Validar con prueba de estrés de WebSockets).
- [ ] **Capacidad de Análisis ABC en Frontend vs Backend:** Asumimos que los cálculos de Pareto (80/20) pueden ser costosos en el frontend. Si la data crece masivamente, tendremos que migrar este cálculo a una Edge Function (RPC) en Supabase. (Validar el límite de registros antes de afectar el renderizado).
- [ ] **Aceptación del Libro Mayor Unificado:** Asumimos que el modelo de "partida doble" simplificado para el *Accounting Base* cumplirá con las expectativas de la gerencia para flujos de caja y compras. (Revisar estructura de la tabla `ledger_entries` con el usuario).

## MVP Scope
- **Ventas (POS/Caja):** Unificación de `POSView` y `CashFlowView` con sincronización de turnos en Supabase.
- **Base Contable:** Servicio `accountingService` básico que registre "Ingresos vs Egresos" con categorías.
- **Despachos:** Integración de `OrderKanbanView` con un módulo simple de "Asignación de Transporte" y cambio de estados (Pendiente -> Preparando -> En Ruta -> Entregado).
- **Inventarios (ABC):** Script local que clasifica productos en A (Alta rotación/valor), B y C en la tabla visual `InventoryView` utilizando el historial de movimientos locales/remotos.

## Not Doing (and Why)
- **Desarrollo de App Nativa para Repartidores:** Requiere mucho tiempo y fragmenta el código. Los despachos se gestionarán usando la vista responsiva web (Mobile-first).
- **Microservicios Independientes:** Complejidad innecesaria para el tamaño actual. Mantendremos el código en un *Modular Monolith*.
- **Facturación Electrónica DIAN Directa en Fase 1:** Priorizaremos la estabilidad interna del ERP (Inventario/Caja) antes de acoplar apis de facturación fiscal pesadas.
- **Cálculo ABC Predictivo con ML/AI:** En el MVP usaremos estadísticas históricas directas (regla estática Pareto) en lugar de modelos predictivos costosos.

## Open Questions
- ¿Los repartidores tendrán acceso al sistema para cambiar el estado a "Entregado" o eso lo hará la persona de base desde `OrderKanbanView`?
- ¿El catálogo contable debe seguir un estándar NIIF local (Colombia) de una vez o iniciamos con categorías libres (Gastos operativos, nómina, etc.)?
