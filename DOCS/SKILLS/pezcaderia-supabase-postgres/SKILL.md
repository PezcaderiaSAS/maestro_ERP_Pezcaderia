---
name: pezcaderia-supabase-postgres
description: Reglas y guías técnicas para la migración asíncrona a Supabase y base de datos PostgreSQL.
---

# Supabase & PostgreSQL Migration Standards

Este skill rige el diseño de persistencia híbrida local/nube y prepara al ERP para la migración asíncrona hacia Supabase en la Fase 5 del proyecto.

## Inicialización del Cliente

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Políticas de Seguridad (RLS - Row Level Security)

Toda tabla creada en PostgreSQL debe forzar RLS para evitar que terceros sin sesión o con roles insuficientes lean o muten registros maestros.

```sql
-- Habilitar RLS en tabla de ventas
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

-- Crear política de solo lectura para rol facturador
CREATE POLICY "Facturadores pueden leer ventas" ON ventas
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'FACTURADOR' OR auth.jwt() ->> 'role' = 'ADMIN');
```

---

## Consultas de Contexto Avanzado (Context7 API)

Si necesitas optimizar filtros avanzados de Supabase JS, manejar actualizaciones en tiempo real (Realtime WebSockets) o resolver problemas de autenticación, usa Context7:

```bash
# Consultar filtros relacionales complejos en Supabase JS client
curl -X GET "https://context7.com/api/v2/context?libraryId=/supabase/supabase-js&query=inner+join+filter+select&type=txt" \
  -H "Authorization: Bearer ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887"
```

## Estándares de Transición
- **Promesas y Carga**: Toda llamada a Supabase es asíncrona. La UI debe proveer loaders y esqueletos visuales para evitar parpadeos descontrolados de elementos JSX.
- **Transaccionalidad (RPC)**: Procesos como la confirmación de compras y el traslado de inventario deben llamarse mediante funciones RPC en Postgres para asegurar que corran en una transacción ACID en el servidor.
