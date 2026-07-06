---
name: pezcaderia-data-architecture
description: Directrices, patrones y consultas de contexto para el rol de Ingeniero y Arquitecto de Datos del ERP.
---

# Rol de Ingeniero y Arquitecto de Datos

Este skill define los estándares de diseño de datos, optimización de esquemas, procesos ETL/ELT y la integración de fuentes de datos del ERP MaestroPescadería, preparando la base de datos para la escalabilidad multi-bodega y la futura migración a PostgreSQL en Supabase.

## 1. Principios de Arquitectura de Datos

### Normalización y Consistencia (3NF vs Desnormalización)
1. **Base Transaccional (3NF):** Las operaciones del WMS, POS, y B2B deben estructurarse de forma altamente normalizada para garantizar la consistencia ACID.
   - Evitar la redundancia de stock actual en las tablas de productos (debe calcularse sumando entradas/salidas o gestionarse en una tabla balanceada por SKU/Bodega/Lote).
   - Los traslados de inventario entre bodegas deben ser atómicos (ejecutados en una sola transacción o servicio asíncrono para evitar duplicaciones o pérdidas).
2. **Capa Analítica (Modelo Estrella / Copo de Nieve):** Para el módulo de **Informes (Reportes)**, se promueve la preparación de vistas agregadas y cubos de datos desnormalizados.
   - Tabla de Hechos (Fact): Ventas, Compras, Producción.
   - Tablas de Dimensiones (Dim): Clientes, Productos, Proveedores, Tiempo (Fechas), Bodegas.

### Lógica Transaccional y Costeo
- **Costo Promedio Ponderado (CPP):** La fórmula de costeo de inventario debe recalcularse dinámicamente con cada entrada de compra:
  $$\text{Nuevo CPP} = \frac{(\text{Stock Anterior} \times \text{CPP Anterior}) + (\text{Cantidad Comprada} \times \text{Precio Unitario Compra Neto})}{\text{Stock Anterior} + \text{Cantidad Comprada}}$$
  *El Precio Unitario Compra Neto debe incluir el flete prorrateado asignado a ese item.*

- **Conservación de Masa:** En el módulo de Producción, la suma de masa de los productos resultantes (Producto Terminado) más la merma registrada debe ser estrictamente igual a la masa de la materia prima consumida.

---

## 2. Consultas de Contexto con Context7 API

El arquitecto de datos debe utilizar Context7 para investigar mejores prácticas en modelado relacional, indexación y optimización de consultas SQL en PostgreSQL/Supabase.

### Autenticación y Cabecera de Autorización
**Bearer Token:** `ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887`

### Consultas de Referencia Recomendadas

#### A. Modelado de Inventario multi-bodega y control de lotes (FEFO)
Si necesitas patrones de modelado para el control de stock por lotes y bodegas:
```bash
curl -X GET "https://context7.com/api/v2/context?libraryId=/postgres&query=multi+warehouse+inventory+schema+batch+lot+expiry+fefo&type=txt" \
  -H "Authorization: Bearer ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887"
```

#### B. Optimización de Índices para Consultas Financieras y Reportes
Para optimizar el rendimiento de la agregación de ventas e informes de flujo de caja:
```bash
curl -X GET "https://context7.com/api/v2/context?libraryId=/postgres&query=create+covering+index+composite+group+by+aggregation+sales&type=txt" \
  -H "Authorization: Bearer ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887"
```

#### C. Integración y Sincronización de APIs Externas (Twenty CRM / Siigo)
Para resolver problemas de control de concurrencia y reintentos (backoff) en la sincronización de APIs:
```bash
curl -X GET "https://context7.com/api/v2/context?libraryId=/vercel/next.js&query=retry+backoff+queue+external+api+sync&type=txt" \
  -H "Authorization: Bearer ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887"
```

---

## 3. Estructura de Persistencia Local (`localDb.ts`)

Durante la fase de desarrollo local, el arquitecto de datos debe asegurar que:
1. **Acceso Centralizado:** Ningún componente lea de `localStorage` de forma independiente. Todo debe pasar por los métodos del repositorio `localDb.ts`.
2. **Semillas de Datos (Seeds):** Las bases de datos locales deben inicializarse con datos demo coherentes para las pruebas de las reglas de negocio (ej. clientes B2B con saldo en mora para probar suspensiones de cupo).
3. **Tipado Estricto:** Cada entidad guardada en la base de datos debe tener su interfaz de TypeScript correspondiente en `src/types/`.

---

## 4. Estándares para el Diseño de Esquemas (PostgreSQL)

Al preparar la migración a Supabase, el diseño del esquema debe seguir estas reglas:
- **Llaves Primarias:** Usar `UUID` autogenerados por defecto para todas las tablas relacionales.
- **Llaves Foráneas:** Definir restricciones `ON DELETE RESTRICT` en tablas críticas (como Clientes o Productos) para evitar la pérdida accidental de datos históricos de ventas.
- **Auditoría:** Todas las tablas de movimientos y transacciones deben incluir campos de auditoría estándar:
  - `created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL`
  - `updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL`
  - `created_by UUID` (ID del usuario que inició la transacción).
