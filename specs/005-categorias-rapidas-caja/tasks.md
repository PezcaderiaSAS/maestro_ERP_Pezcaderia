# Tareas Atómicas: Módulo 005 - Categorías Rápidas e Inteligentes de Egresos de Caja

- [x] **Tarea 1 (Modelos & Tipos):** Definir `CategoriaGastoConfig` en `src/types/cash.types.ts` y flexibilizar `CategoriaEgresoOperativo` para soportar categorías dinámicas con constantes canónicas tipadas.
- [x] **Tarea 2 (Servicio & Persistencia):** Implementar en `src/services/cashService.ts` la gestión de categorías (`getCategoriasGastos`, `crearCategoriaGasto`, `obtenerCategoriasMasUsadas`) con catálogo semilla pre-cargado (`Flete Camión`, `Pago Pescado`, `Hielo/Frío`, `Insumos Bodega`, `Pago Domicilios`, `Cafetería`, `Aseo`, `Gasto Menor`) y prevención de duplicados (EARS-W01).
- [x] **Tarea 3 (UI Táctil en EgresoOperativoModal):** Integrar la cuadrícula inteligente de las Top 4 a 6 categorías más usadas, botón `+ Otra Categoría` con panel de creación en caliente (input + selector de emojis ☕, 🛵, 📦, 🧹, ⚡, 🏷️) y modal/desplegable `Ver Todas`.
- [x] **Tarea 4 (Filtros Dinámicos en CashFlowView):** Hacer que las pestañas de filtro táctil de `CashFlowView` y los badges de la tabla reconozcan dinámicamente las categorías personalizadas creadas por el usuario.
- [x] **Tarea 5 (TDD & Regresión):** Crear suite `src/tests/quickExpenseCategories.test.ts` con cobertura de creación, ranking por uso y débitos con categorías dinámicas. Correr `tsc --noEmit` y suite de Vitest.
- [x] **Tarea 6 (Bucle DevTools & Gate 2):** Verificar en Chrome DevTools a 375 px móvil la creación de 'Cafetería' o 'Domicilios', registrar salida, auditar 0 errores de consola, sincronizar memoria y proceder a commit.

