---
name: pezcaderia-best-practices
description: Consolidación de mejores prácticas de arquitectura y desarrollo para WMS ColdChain Pro.
---

# Project Best Practices (WMS ColdChain Pro)

Este skill consolida las mejores prácticas extraídas del proyecto actual y de estándares de la industria para garantizar la escalabilidad y mantenibilidad del WMS.

## Principios de Arquitectura

### 1. Senior Engine Patterns
- **Integer Math**: Opera internamente en unidades mínimas (ej. gramos o centavos) para evitar errores de coma flotante en cálculos críticos.
- **FIFO O(n)**: Mantén la lógica de salida de inventario eficiente agrupando por lotes y productos en mapas de memoria antes de procesar.
- **DAO Middleware**: Intercepta todas las escrituras a la hoja de cálculo para estampar marcas de tiempo y auditoría de forma centralizada.

### 2. Gestión de Datos (Google Sheets)
- **Batch Processing**: Sigue el patrón "Leer todo -> Procesar en memoria -> Escribir todo" para minimizar llamadas a la API de Google.
- **LockService**: Usa bloqueos granulares con retroceso exponencial (`pezcaderia-gas-advanced`) en procesos concurrentes como el registro de movimientos.

### 3. Sincronización UI-Backend
- **Cache Management**: Invalida selectivamente el caché del script (`CacheService`) después de cada escritura para que la UI SPA refleje datos frescos inmediatamente.
- **SSR & Hydration**: En entornos Next.js (`pezcaderia-nextjs`), sincroniza el estado inicial desde el servidor pero permite actualizaciones dinámicas en el cliente para componentes reactivos.

## Estándares de Código
- **Nomenclatura**: Prefijo `api...` para funciones en `Controller.gs` que son llamadas desde el frontend.
- **Manejo de Errores**: Todo punto de entrada de API debe estar envuelto en `try/catch` y devolver un objeto `{ success: boolean, error?: string }`.

## Documentación de Evolución
- Documenta cada cambio significativo siguiendo `pezcaderia-iteration-docs`.
- Mantén el `DICCIONARIO_TECNICO.md` actualizado como única fuente de verdad funcional.
