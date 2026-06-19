# Documentación Arquitectónica: Maestro ERP Pescadería

Este documento resume el progreso, las decisiones arquitectónicas y los refactores realizados durante las **Fases 1 a 4** de la modernización del sistema ERP de La Pezcadería, así como el roadmap pendiente para la **Fase 5**.

---

## 🏗️ Resumen Ejecutivo

El proyecto se estructuró en 5 fases secuenciales para transformar un sistema monolítico, acoplado y dependiente de bases de datos de clientes aisladas en una arquitectura **modular, relacional e íntegra**, preparada para una eventual migración a la nube (Supabase/SQL).

---

## ✅ Fases Completadas (F1 - F4)

### Fase 1: Estabilización Crítica
**Objetivo:** Solucionar errores críticos e interbloqueos en la interfaz sin romper el flujo actual de trabajo (POS, Inventario, Reportes).
*   Se auditaron los componentes base y se eliminaron efectos secundarios en React (`useEffect` hooks) que causaban renderizados infinitos.
*   Se unificaron los tipos de datos principales (`Cliente`, `Proveedor`) para asegurar compatibilidad estricta.

### Fase 2: Arquitectura Transaccional (Bases de Datos Relacionales)
**Objetivo:** Establecer módulos de bases de datos relacionales reales para entidades de negocio clave.
*   **Gestión de Clientes y Proveedores:** 
    *   Se implementaron catálogos centralizados (`clientes`, `proveedores`).
    *   Se reemplazaron cadenas de texto estáticas por relaciones reales referenciando `clienteId` y `proveedorId`.
*   **Motor de Movimientos:**
    *   Se creó `MovimientoInventario`, la única fuente de la verdad para entradas, salidas y mermas (Principio de Inmutabilidad).
*   **Ventas y Compras:**
    *   Se modelaron `Venta` y `OrdenCompra`, integrándolas nativamente con la Cartera (Cuentas por cobrar).

### Fase 3: Motor de Catálogo y Precios Dinámicos
**Objetivo:** Separar la definición inmutable del producto de su comportamiento financiero y de precios variables.
*   **Separación de Responsabilidades:** 
    *   Se implementó `ProductCatalog` (Metadata: SKU, nombre, imagen, categoría).
    *   Se implementó `ProductPricing` (Precios dinámicos: Costo, Buffer de Seguridad, Precio POS, Restaurante, Mayorista).
*   **Cálculo Automático:** El sistema ahora detecta el tipo de cliente (`POS`, `RESTAURANTE`, `MAYORISTA`) e inyecta dinámicamente el precio correcto al facturar, evitando errores manuales y overrides indeseados.

### Fase 4: Capa de Persistencia Unificada (Storage Local)
**Objetivo:** Reducir la deuda técnica y unificar todas las llamadas al almacenamiento de datos para preparar la migración a la nube.
*   **Módulo `localDb.ts`:**
    *   Se creó el servicio `src/services/localDb.ts` que actúa como *shim* de base de datos.
    *   Soporta operaciones atómicas `load(key)`, `save(key, data)`, `remove(key)` envueltas en manejo seguro de errores (`try-catch`).
*   **Refactorización Masiva en `App.tsx`:**
    *   Se eliminaron más de 15 llamadas directas y estáticas a `localStorage` que estaban desperdigadas.
    *   Se limpiaron los hooks redundantes garantizando sincronización sin fugas de memoria.
*   **Refactorización en `HRView.tsx`:**
    *   El módulo de RRHH ahora consume la persistencia a través de la misma API estandarizada (`localDb`).

---

## ⏳ Fase Pendiente (F5): Migración a Backend Real (Supabase)

> [!NOTE]
> **Estado:** PAUSADA a solicitud del usuario para continuar pruebas rigurosas en ambiente local.

Cuando la aplicación alcance plena madurez operativa a nivel local, el objetivo final es abandonar `localStorage` y migrar a una base de datos PostgreSQL alojada en la nube mediante **Supabase**.

### Tareas y Decisiones Arquitectónicas Guardadas para F5:
1. **Infraestructura Cloud:**
   *   Inicializar cliente de conexión en `src/services/supabase.ts` consumiendo variables de entorno (`.env`).
2. **Modelado SQL (Migración de Schema):**
   *   Ejecutar los scripts SQL (ya generados y documentados previamente) para inicializar las tablas relacionales: `clientes`, `proveedores`, `productos`, `precios_productos` y transacciones.
3. **Manejo de Asincronía:**
   *   Refactorizar los `useState` iniciales de `App.tsx` para que soporten promesas asíncronas de lectura (`await fetchClientes()`).
   *   Implementar un *Global Loading State* (Pantalla de Carga) para evitar que la UI se renderice antes de tener la data en memoria.
4. **Seguridad (Opcional pero Recomendado):**
   *   Aprovechar el sistema de RLS (Row Level Security) de Supabase e implementar Autenticación Real por Tokens en lugar del actual selector de roles estático simulado.

---

### ¿Por qué esta arquitectura híbrida local es un éxito?
La arquitectura actual (Fase 4 finalizada) nos permite probar exhaustivamente las reglas de negocio (cálculos de precios, relaciones de bases de datos transaccionales, interfaz de usuario) a velocidad nativa en el navegador, **sin depender de internet ni de latencias del servidor**. 

Una vez que cada módulo operativo se considere 100% estable en el trabajo diario, la migración a Supabase se tratará de un simple reemplazo del archivo `localDb.ts` por una API que cumpla el mismo contrato de lectura/escritura, **sin necesidad de reescribir ni tocar la lógica de interfaz de los componentes React**.
