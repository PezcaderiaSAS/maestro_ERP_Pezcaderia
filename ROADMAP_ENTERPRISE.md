# Roadmap Enterprise: MaestroPescaderia ERP

Este documento rige la secuencia de desarrollo y los estándares técnicos para la consolidación de los módulos principales del ERP. El desarrollo se ejecutará mediante la metodología **Spec-Driven Development (SDD)**, abordando un módulo a la vez de forma estrictamente secuencial para garantizar la máxima calidad y cohesión.

## Metodología y Gobernanza
1. **Ejecución SDD Secuencial:** Cada módulo pasará por el ciclo completo: `Constitución -> Spec -> Plan -> Tasks -> Implementación`. Ningún agente puede iniciar el código de un módulo sin antes aprobar su Spec y Plan.
2. **Seguimiento Diario Obligatorio:** Todo agente de IA debe registrar sus intervenciones en el archivo `CHANGELOG_AGENTS.md` al finalizar su sesión.
3. **Respaldo Estricto en Git:** Cualquier modificación a este Roadmap, al Changelog o al código fuente debe ser respaldada obligatoriamente mediante un `git commit` y `git push` inmediato para asegurar que los cambios persistan en GitHub en todo momento.
4. **UI Progresiva (Feature-First):** Se priorizará la funcionalidad core (Base de datos, lógica de negocio y estado). Luego, se inyectarán las reglas del `/design-system` (Dark Glassmorphism, Tablas de alta densidad, Cero márgenes en hijos, etc.) de forma progresiva sin romper la lógica existente.

---

## Secuencia de Ejecución de Módulos (Tier 1)

### 1. Ventas POS (Punto de Venta)
**Prioridad:** Crítica (Core Business)
- **Objetivo SDD:** Sistema táctil de alta velocidad, a prueba de fallos y concurrencia pesimista.
- **Spec Clave:** Carrito de compras en memoria (Zustand), cálculo inmediato de totales, retenciones ocultas por UX (Regla del niño de 12 años) e integración con medios de pago múltiples.
- **UX/UI Target:** Botones táctiles grandes (min 44px), paleta intuitiva (Cyan/Emerald/Amber), modal de pago simplificado (Zero CLS).

### 2. Inventarios y Bodegas (WMS)
**Prioridad:** Crítica (Control de Mermas)
- **Objetivo SDD:** Trazabilidad estricta de productos perecederos (FEFO), multi-bodega y control de lotes.
- **Spec Clave:** Ingreso/Egreso de pescados/mariscos, recálculo de costos promedio, bloqueo transaccional (`SELECT FOR UPDATE`) para evitar sobreventa de stock.
- **UX/UI Target:** Data Tables de alta densidad con *sticky headers*, tarjetas KPI con sparklines para alertas de lotes próximos a vencer, filtros avanzados rápidos.

### 3. Compras y Proveedores
**Prioridad:** Alta
- **Objetivo SDD:** Automatización del flujo de reabastecimiento.
- **Spec Clave:** Órdenes de compra conectadas a inventario, actualización automática de costos en kardex, cuentas por pagar.
- **UX/UI Target:** Formularios paso a paso (Wizards) para la entrada de mercancía pesada, validación isomorfa con Zod y skeletons para carga de data.

### 4. Cartera (Cuentas por Cobrar)
**Prioridad:** Alta (Flujo de Caja)
- **Objetivo SDD:** Seguimiento del crédito otorgado a clientes mayoristas/restaurantes.
- **Spec Clave:** Conciliación de abonos, generación de extractos en PDF (Enterprise PDF Engine), control de días de mora y cupos de crédito.
- **UX/UI Target:** KPIs financieros consolidados, listados paginados con filtros rápidos de mora, badgets semánticos (Rojo/Naranja/Verde) según antigüedad de deuda.

### 5. Creación de Pedidos (Picking y Despacho a Rutas)
**Prioridad:** Media-Alta (Logística)
- **Objetivo SDD:** Optimizar la recolección y asignación de rutas de entrega en vehículos refrigerados.
- **Spec Clave:** Transformar pedidos en hojas de picking, control de pesos exactos vs pesos estimados, facturación en masa post-despacho.
- **UX/UI Target:** Vistas optimizadas para tabletas robustas en cuartos fríos, lectura de códigos de barras (autofocus fields), diseño anti-errores.

### 6. Alquiler de Frío (WMS 3PL)
**Prioridad:** Media (Ingreso Paralelo)
- **Objetivo SDD:** Gestión de inquilinos de los cuartos fríos de la pescadera.
- **Spec Clave:** Control de posiciones/estibas, tarifas de arrendamiento diario/mensual, emisión automática de cargos por almacenamiento.
- **UX/UI Target:** Grid visual 2D o listado de celdas libres/ocupadas con indicadores de tiempo de ocupación, modal de asignación rápido.

### 7. Gastos y Tesorería Menor
**Prioridad:** Media (Administrativa)
- **Objetivo SDD:** Control de flujo de salida de dinero diario (caja menor).
- **Spec Clave:** Registro ágil de gastos operativos, clasificación contable (plan de cuentas simplificado), aprobación gerencial y cruce con arqueos de caja del POS.
- **UX/UI Target:** Formularios minimalistas y altamente reactivos, input numérico enmascarado (tabulares) para evitar descuadres.

---

*Nota: Todos los demás módulos no listados (Nómina, Activos, Inteligencia de Negocio avanzada) se congelan hasta completar exitosamente el Tier 1.*
