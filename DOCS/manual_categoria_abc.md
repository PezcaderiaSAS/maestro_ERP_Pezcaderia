# Manual de Clasificación ABC para Inventario

La clasificación ABC es una técnica de gestión de inventario basada en el Principio de Pareto (Regla del 80/20). El objetivo es clasificar los productos en tres categorías según su importancia para el negocio, ya sea por volumen de ventas, margen de ganancia o criticidad en las operaciones, con el fin de optimizar el control, el reabastecimiento y el alistamiento.

## Categorías

### 🐟 Categoría A: Máxima Prioridad (Alta Rotación / Alto Valor)
Son los productos más críticos para el negocio. Generalmente representan aproximadamente el **20% del total de los artículos**, pero generan alrededor del **80% de los ingresos** o volumen de ventas.

*   **Ejemplos:** Tilapia Roja, Salmón Premium, Camarón Tití, Filete de Basa, Róbalo.
*   **Gestión:** 
    *   **Control estricto:** Inventario cíclico diario o semanal.
    *   **Buffer de seguridad alto:** Nunca debe haber desabastecimiento (quiebre de stock).
    *   **Ubicación en bodega:** Deben estar ubicados en las zonas más accesibles y de más rápida extracción (Fulfillment rápido).
    *   **Compras:** Pedidos frecuentes, fuerte negociación con proveedores.

### 🦐 Categoría B: Prioridad Media (Rotación Media)
Representan los artículos de importancia moderada. Suelen ser el **30% de los artículos** y aportan aproximadamente el **15% de los ingresos**.

*   **Ejemplos:** Pargo Platero, Anillos de Calamar, Sierra, Trucha.
*   **Gestión:**
    *   **Control regular:** Inventario mensual o quincenal.
    *   **Buffer de seguridad moderado.**
    *   **Ubicación en bodega:** Zonas intermedias, acceso normal.
    *   **Compras:** Pedidos planificados según históricos mensuales.

### 🦑 Categoría C: Baja Prioridad (Baja Rotación)
Son productos que rotan poco, son de bajo valor, o se mantienen solo para tener un catálogo completo. Son aproximadamente el **50% de los artículos**, pero aportan apenas un **5% de los ingresos**.

*   **Ejemplos:** Pescados exóticos, mariscos de nicho, empaques secundarios poco comunes.
*   **Gestión:**
    *   **Control relajado:** Inventario trimestral o semestral.
    *   **Buffer de seguridad bajo o nulo:** (Algunos pueden manejarse bajo pedido / *Just in time*).
    *   **Ubicación en bodega:** Zonas altas, al fondo, o de menor acceso.
    *   **Compras:** Se piden con menor frecuencia y en mayor volumen para diluir el costo de transporte, o exclusivamente sobre pedido.

---

## Cómo aplicar la Clasificación ABC en el ERP MaestroPescadería

1.  **Auditoría y Exportación:** Extrae el histórico de ventas de los últimos 3 a 6 meses.
2.  **Cálculo del Valor:** Multiplica el volumen de ventas por el margen unitario o precio de venta de cada producto.
3.  **Ordenamiento:** Ordena los productos de mayor a menor según su valor total o volumen de rotación.
4.  **Asignación:**
    *   El grupo superior que suma el ~80% del valor es **Categoría A**.
    *   El siguiente grupo que suma el ~15% del valor es **Categoría B**.
    *   El resto es **Categoría C**.
5.  **Actualización en el Sistema:** Al editar un producto en el módulo de Inventario, asigna la categoría correspondiente en el campo `categoriaABC`.

## Impacto en el Alistamiento de Bodega (Fulfillment)
El módulo de "Alistamiento de Bodega" priorizará o sugerirá rutas de extracción optimizadas. Asegúrate de que tu organización física de las cavas (congeladores) corresponda a esta clasificación para acelerar los tiempos de despacho.
