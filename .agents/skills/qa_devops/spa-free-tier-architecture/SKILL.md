---
name: spa-free-tier-architecture
description: Ingeniería de optimización extrema para despliegues SPA en Vercel, Supabase (PostgreSQL + JSONB NoSQL) y capas gratuitas de nube sin costos operativos.
---

# SPA & Free Tier Cloud Architecture Skill

Esta skill condensa las mejores prácticas de ingeniería de software para construir un **SaaS ERP/WMS modular de nivel enterprise**, operando al 100% dentro de las **capas gratuitas (Free Tiers)** de Vercel, Supabase y Upstash.

---

## 1. Mapa de Capacidades de la Capa Gratuita

| Proveedor | Servicio | Límite Free Tier | Estrategia de Maximización |
| :--- | :--- | :--- | :--- |
| **Vercel** | SPA Hosting & Edge Network | 100 GB ancho de banda / mes | Assets estáticos inmutables con headers `Cache-Control: max-age=31536000, immutable`, compresión Brotli/Gzip, Lazy loading por ruta. |
| **Supabase** | PostgreSQL Database | 500 MB almacenamiento de datos | Tipos de datos compactos (`NUMERIC`, `SMALLINT`, `UUID`), particionado lógico, purga de logs antiguos o compresión en JSONB. |
| **Supabase** | File Storage | 1 GB almacenamiento de archivos | Redimensionamiento client-side de imágenes/fotos de producto antes de subir, compresión WebP. |
| **Supabase** | Auth & RLS | 50,000 usuarios activos mensuales | Autenticación JWT integrada, políticas RLS compiladas eficientemente para evitar joins costosos. |
| **Supabase** | Edge Functions | 500,000 invocaciones / mes | Delegar lógica no sensible a la SPA; usar Edge Functions solo para transacciones seguras o webhooks. |
| **Upstash** | Serverless Redis | 10,000 comandos / día | Usar llamadas batch (`mget`/`mset`), TTLs bien ajustados y no saturar lecturas triviales. |

---

## 2. Emulación de Document Store NoSQL con PostgreSQL `JSONB`

Para evitar la necesidad de una base de datos NoSQL externa (como MongoDB) que añade complejidad de red y consumo de recursos:

1. **Campos Semiestructurados (`metadata JSONB`)**:
   - Usar columnas `JSONB` en tablas núcleo (`products`, `orders`, `inventory_lots`, `audit_logs`).
   - Permite agregar atributos variables (especies, cortes, calibración de mariscos, certificaciones sanitarias) sin alterar esquemas relacionales.

2. **Indexación GIN de Alto Rendimiento**:
```sql
-- Índice GIN completo para consultas por cualquier clave del JSONB
CREATE INDEX idx_products_specs ON products USING gin (specifications jsonb_path_ops);

-- Búsqueda de alta velocidad:
SELECT * FROM products 
WHERE specifications @> '{"cut_type": "filete", "presentation": "vacio"}';
```

3. **Ventajas sobre NoSQL Externo**:
   - **ACID Transaccional**: El documento JSONB se actualiza dentro de la misma transacción que el saldo de caja y el stock de inventario.
   - **Cero latencia de red adicional**: Una sola conexión al pool de PostgreSQL.

---

## 3. Optimización del Bundle Frontend SPA (Vite + React)

1. **Code-Splitting por Módulos**:
   - Cargar vistas pesadas mediante `React.lazy()` (`InventoryView`, `POSView`, `ReportsView`, `HRView`).
2. **Iconos y Librerías Ligeras**:
   - Uso estricto de `lucide-react` con imports directos para permitir Tree-Shaking óptimo.
3. **Evitar Memory Leaks en Zustand**:
   - Selectores atómicos (`useStore(state => state.activeItem)`) para evitar re-renders masivos en componentes de tabla de datos.
