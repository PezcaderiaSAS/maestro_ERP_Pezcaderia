# Especificación de Requerimientos: Módulo 005 - Categorías Rápidas e Inteligentes de Egresos de Caja

## 1. Resumen Ejecutivo
Permitir a los cajeros y administradores de La Pezcadería ERP registrar salidas de dinero de forma ágil mediante **Categorías Rápidas e Inteligentes (Smart Quick Picks)**, crear nuevas categorías en caliente con 1 toque (ej. Cafetería, Insumos, Domicilios), rankear las categorías por frecuencia de uso del día y sincronizar las categorías dinámicamente con las pestañas de filtro de la tabla de movimientos.

---

## 2. Requerimientos en Notación EARS (Easy Approach to Requirements Syntax)

### Requerimientos Ubicuos (Ubiquitous Requirements)
- **EARS-U01:** El sistema SHALL mantener un catálogo persistente de categorías de egreso operativo compartido por toda la empresa (`tenant_id`), accesible por todas las cajas y turnos.
- **EARS-U02:** Cada categoría de egreso SHALL incluir un identificador único, un nombre legible, un icono o emoji representativo, un color de badge semántico, un indicador de categoría favorita/fija y un contador acumulado de frecuencia de uso.
- **EARS-U03:** El sistema SHALL inicializar automáticamente un catálogo semilla con las categorías estándar de la empresa: `Flete Camión` (🚚), `Pago Pescado` (🐟), `Hielo / Cavas` (🧊), `Insumos Bodega` (📦), `Pago Domicilios` (🛵), `Cafetería / Refrigerios` (☕), `Aseo y Limpieza` (🧹) y `Gasto Operativo Menor` (🏷️).

### Requerimientos Dirigidos por Eventos (Event-Driven Requirements)
- **EARS-E01:** WHEN el usuario pulsa el botón táctil `+ Otra Categoría` dentro del modal de egreso, el sistema SHALL desplegar un panel integrado para ingresar el nombre de la nueva categoría, seleccionar un icono rápido (☕, 🛵, 📦, 🧹, ⚡, 🏷️) y guardarla de inmediato sin perder los datos ya digitados en el formulario.
- **EARS-E02:** WHEN el usuario confirma la creación de una nueva categoría, el sistema SHALL persistirla en el almacenamiento de la empresa, seleccionarla automáticamente como la categoría activa del egreso actual y refrescar el catálogo en memoria.
- **EARS-E03:** WHEN se abre el modal de egreso, el sistema SHALL calcular las Top 4 a 6 categorías más utilizadas en los movimientos del día (combinadas con las categorías fijas) y renderizarlas como botones táctiles prioritarios ($\ge 52\text{ px}$).
- **EARS-E04:** WHEN el usuario pulsa `Ver Todas (N)`, el sistema SHALL desplegar el catálogo completo de categorías activas para permitir seleccionar cualquiera de ellas.
- **EARS-E05:** WHEN se registra un egreso con una categoría personalizada, el sistema SHALL incorporar dinámicamente dicha categoría en las pestañas táctiles de filtrado de `CashFlowView` si cuenta con movimientos en el turno actual.

### Requerimientos de Estado (State-Driven Requirements)
- **EARS-S01:** WHILE el modal de creación rápida de categoría esté visible, el botón `Guardar Categoría` SHALL permanecer deshabilitado si el nombre de la categoría está vacío o contiene únicamente espacios en blanco.

### Requerimientos de Excepción (Unwanted Behavior Requirements)
- **EARS-W01:** IF el usuario intenta crear una categoría con un nombre que ya existe (ignorando mayúsculas y acentos), THEN el sistema SHALL seleccionar automáticamente la categoría existente y notificar al usuario amigablemente sin generar duplicados.
