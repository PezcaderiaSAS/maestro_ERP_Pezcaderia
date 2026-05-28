# Plan de Implementación: Frontend SPA & Interfaz POS (v2.1)

Este documento detalla el diseño y la secuencia de construcción para la aplicación web de una sola página (SPA) modular del ERP de **La Pezcadería S.A.S.**, incorporando la interfaz del Punto de Venta (POS) y el nuevo módulo de Recursos Humanos (Empleados).

---

## User Review Required

> [!IMPORTANT]
> **Inicialización en Directorio de Trabajo**: Crearemos el proyecto SPA React con Vite en la raíz de la carpeta de trabajo `./` para mantener un repositorio limpio y unificado.
> 
> **Alineación de Diseño POS**: La pantalla de ventas POS implementará el diseño de dos columnas: la izquierda con rejilla de productos con imágenes reales (de la base de datos de productos) y la derecha con el carrito de cobro, desglose de impuestos/descuentos y botón de pago verde destacado.

---

## Open Questions

> [!IMPORTANT]
> **Imágenes de Productos**: En el Google Sheet actual de productos, ¿existen URLs de imágenes de los pescados/mariscos, o deberíamos autogenerar imágenes ilustrativas realistas por defecto en el frontend (ej. usando imágenes predefinidas de stock para Filetes, Camarones, Pulpos, etc.)?
> 
> **Flujos de Navegación SPA**: Para la navegación modular de la SPA (POS, CRM/Visitas, Producción, Traslados, Gastos de Ruta, Contabilidad, Recursos Humanos), ¿prefieres un menú lateral retráctil (*sidebar*) accesible desde el botón de hamburguesa en la parte superior izquierda de la pantalla?

---

## Cambios Propuestos

### Componente 1: Base de Datos (Supabase / PostgreSQL)

#### [NEW] [01_schema_inicial.sql](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/database/01_schema_inicial.sql)
* Define tipos custom y tablas de terceros, clientes, proveedores, usuarios, productos, bodegas y configuraciones.

#### [NEW] [02_sistema_inventario_y_produccion.sql](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/database/02_sistema_inventario_y_produccion.sql)
* Gestión de lotes, stock y órdenes de producción con mermas y validación de PIN de Jefe de Bodega.

#### [NEW] [03_ventas_y_facturacion.sql](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/database/03_ventas_y_facturacion.sql)
* Pedidos, detalles y cálculo de subtotales/descuentos a nivel de motor PostgreSQL.

#### [NEW] [04_caja_y_finanzas.sql](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/database/04_caja_y_finanzas.sql)
* Gestión de cajas, ingresos/egresos, rutas y arqueo logístico.

#### [NEW] [05_politicas_rls_y_seguridad.sql](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/database/05_politicas_rls_y_seguridad.sql)
* Habilitación de RLS en todas las tablas del esquema.

#### [NEW] [06_recursos_humanos.sql](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/database/06_recursos_humanos.sql)
* Tabla `empleados` (id UUID refs terceros(id), cargo, salario, fecha_ingreso, fecha_egreso, url_hoja_vida).
* Trigger de seguridad para desactivar credenciales de acceso ERP de forma inmediata si el empleado pasa a `INACTIVO`.

---

### Componente 2: Configuración de la SPA React + Vite

#### [NEW] [package.json](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/package.json)
* Inicialización del entorno con React 18, Vite, Lucide-React (iconos) y SweetAlert2 (modales).
* Estructura modular de carpetas.

---

### Componente 3: Estilos Visuales e Interfaz POS

#### [NEW] [index.css](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/index.css)
* Paleta de colores a medida (#00B171) y tipografía premium modernizada.

#### [NEW] [POSView.tsx](file:///c:/Users/usuario/OneDrive/Documentos/Aplicaciones%20Pezca/MaestroPescaderia/src/views/POSView.tsx)
* Implementación de la vista del POS conforme a la captura: buscador superior, filtros horizontales de categoría, rejilla de productos e items con precio, resumen de totales a la derecha y gran botón verde de pagar.

---

## Plan de Verificación

### Pruebas de Interfaz y Usabilidad
* **Simulación de Tablet**: Cargar la interfaz en vista móvil/tablet (1280x800) en el navegador para verificar la adaptabilidad.
* **Integración de Seguridad**: Verificar que un cambio de estado a `INACTIVO` en la ficha de un empleado desactive inmediatamente su capacidad de autenticarse en el ERP.
