# Plan Técnico: Módulo 005 - Categorías Rápidas e Inteligentes de Egresos de Caja

## 1. Arquitectura y Modelo de Datos

### Tipos en `src/types/cash.types.ts`:
```typescript
export interface CategoriaGastoConfig {
  id: string;
  nombre: string;
  icono: string;
  colorBadge: string;
  descripcion?: string;
  esFrecuente?: boolean; // Fijada por admin
  vecesUsada?: number;  // Frecuencia acumulada
  activa: boolean;
  tenantId?: string;
}
```
Y extender `CategoriaEgresoOperativo` para admitir tanto las constantes del sistema como strings de categorías dinámicas:
`export type CategoriaEgresoOperativo = string;` con constantes canónicas exportadas.

### Servicio en `src/services/cashService.ts` / `categoryExpenseService.ts`:
- `getCategoriasGastos(tenantId?: string): CategoriaGastoConfig[]`
- `crearCategoriaGasto(nombre: string, icono: string, color?: string): CategoriaGastoConfig`
- `obtenerCategoriasMasUsadas(turnosOMovimientos: MovimientoCaja[], limite?: number): CategoriaGastoConfig[]`
- Semilla pre-cargada en `localDb` clave `categoriasGastos` (`pezcaderia_categorias_gastos`).

### UI / Componentes:
- En `EgresoOperativoModal.tsx`:
  - Botonera con cuadrícula táctil de las Top 4 a 6 categorías más usadas (botones gigantes $\ge 52\text{ px}$).
  - Botón `Ver Todas (N)` y botón `+ Otra Categoría`.
  - Panel deslizante o desplegable para crear categoría rápida: input de nombre, selector de 6 emojis táctiles (☕, 📦, 🛵, 🧹, ⚡, 🏷️) y botón `Guardar y Usar`.
- En `CashFlowView.tsx`:
  - Pestañas táctiles dinámicas: generar pestañas para cualquier categoría que tenga movimientos en el turno actual (ej. `☕ Cafetería (2)`, `🛵 Domicilios (1)`).
  - Badges enriquecidos con el emoji y color configurado.

## 2. Plan de Pruebas (TDD)
- Archivo `src/tests/quickExpenseCategories.test.ts`:
  - Validación de inicialización de categorías semilla.
  - Creación de categoría rápida en caliente y prevención de duplicados (EARS-W01).
  - Cálculo determinista del ranking de categorías más frecuentes según movimientos registrados.
  - Validación de egreso registrado con categoría personalizada.
