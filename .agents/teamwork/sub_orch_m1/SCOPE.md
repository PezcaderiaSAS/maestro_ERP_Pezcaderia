# Scope: Milestone M1 — Design Tokens, Light Mode & Shell Foundation

## Architecture
- **Propósito**: Establecer la base de tokens de diseño, soporte canónico para Light Mode WCAG 2.2 AA+ (`pezcaderia-light`), corrección del layout shell de la aplicación (`EnterpriseTopbar.tsx` y contenedores raíz) y estandarización del área mínima táctil de botones (`Button.tsx`) conforme a la Ley de Fitts (>=44x44px).
- **Archivos de Propiedad Exclusiva (Write Ownership)**:
  - `src/index.css`
  - `src/store/useAppStore.ts`
  - `src/components/layout/EnterpriseTopbar.tsx`
  - `src/components/ui/Button.tsx`
  - Estilos globales responsivos de SweetAlert2 en `src/index.css` (ancho responsivo `max-w-[92vw]`)

## Feature Inventory
| # | Feature | Scope |
|---|---------|-------|
| F1 | Tokens de Diseño y Light Mode | Definición de `[data-theme="pezcaderia-light"]` en `src/index.css` y habilitación en `useAppStore.ts`. Ratios WCAG AA+ (4.5:1 / 7:1). |
| F2 | Ergonomía Global de Botones | Ajuste en `src/components/ui/Button.tsx`: clases para asegurar que tamaños `md` y `lg` tengan `min-h-[44px]` y botones interactivos cumplan área táctil mínima. |
| F3 | Layout Shell & Topbar | Optimización en `EnterpriseTopbar.tsx`: compactar sección derecha en móvil (`hidden sm:flex` para theme switcher o colapsado en menú de usuario; max-w en tenant y breadcrumb; evitar desbordamiento horizontal a 375px). |
| F4 | SweetAlert2 Responsivo Global | Modales de SweetAlert2 con ancho adaptable `max-w-[92vw] sm:max-w-lg` en lugar de anchos fijos de 550px. |

## Milestones (Internal Execution Cycle)
- Cycle: Explorer -> Worker -> Reviewer -> Challenger -> Auditor -> Gate check.
- Exit Condition: Build pasa sin errores (`tsc --noEmit`), gate aprobada por revisores y auditoría CLEAN.

## Interface Contracts
- **Exported Tokens**:
  - CSS variables: `--bg-color: #f8fafc;`, `--card-bg: #ffffff;`, `--text-primary: #0f172a;`, `--text-secondary: #334155;`, `--border-color: #e2e8f0;`.
  - Store: `useAppStore` permite alternar y almacenar `'pezcaderia-light'`.
  - Componente `<Button>`: `size="md"` y `size="lg"` garantizan altura interactiva >= 44px.
