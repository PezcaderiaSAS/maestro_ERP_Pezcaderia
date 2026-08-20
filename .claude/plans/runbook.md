# Loop Runbook: CategoríaWizard

**Objetivo:** Desarrollar e integrar un asistente (wizard) interactivo de creación de categorías (Tipo -> Línea -> Clase) dentro del flujo de creación rápida de productos.
**Workflow:** `/loop-start` (Modo: Seguro)
**Estrategia:** Source-Driven Development (React 18 local state patterns).

## Iteraciones (Loops)

### Loop 1: Creación del Componente Base (CategoríaWizardModal)
- **Acción:** Crear `src/views/inventory/components/CategoriaWizardModal.tsx`.
- **Implementación:** Flujo multi-pasos con `useState` para `step` (1: Tipo, 2: Línea, 3: Clase). Renderizado condicional basado en la documentación de React (Lifting State Up).
- **Control de Calidad:** Validar que los botones de Siguiente/Atrás funcionen y mantengan el estado visual sin errores de compilación.

### Loop 2: Integración con Estado Global y Persistencia
- **Acción:** Conectar la finalización del wizard con `useCategoryStore`.
- **Implementación:** Invocar `addCategoria` con el ID generado y la jerarquía recolectada en los pasos.
- **Control de Calidad:** Inspeccionar el store local post-creación para garantizar que la nueva categoría se inyectó al array.

### Loop 3: Conexión con CrearProductoRapidoModal
- **Acción:** Modificar `src/views/inventory/components/CrearProductoRapidoModal.tsx`.
- **Implementación:** Añadir un botón para invocar al Wizard. Suscribirse al evento de creación para auto-seleccionar la categoría generada. Eliminar o adaptar la entrada libre de "Otra categoría" si es redundante.
- **Control de Calidad:** Probar el flujo completo (End-to-End manual): Abrir producto rápido -> Abrir wizard -> Crear categoría -> Validar que el select de producto rápido ahora muestra la nueva categoría.

## Condiciones de Parada (Stop Conditions)
- El wizard renderiza correctamente los 3 pasos.
- La nueva categoría se autoselecciona en el producto rápido sin provocar stale closures.
- Pruebas manuales exitosas.

## Comandos de Monitoreo
Ejecuta manualmente para verificar el entorno tras la implementación:
```bash
pnpm run lint
pnpm run dev
```
