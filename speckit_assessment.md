# Evaluación de Errores E2E

**1. Análisis del Código y Flujos de Información (Basado en el Grafo)**
*   **Componentes Clave**: 
    *   `App.tsx`: Orquestador principal que maneja el enrutamiento (estado `currentView`) y la estructura de la aplicación (Navbar y Sidebar). 
    *   `POSView.tsx` y `CashFlowView.tsx`: Vistas comerciales dependientes de los estados globales.
*   **Esquemas y Datos**: Toda la persistencia es manejada vía `localStorage` (a través de `services/localDb.ts`). Los stores de Zustand (`useInventoryStore`, `useWarehouseStore`, etc.) se inicializan mediante `useEffect` en `App.tsx`.
*   **Flujo en Tests**: En los tests (`pos.spec.ts`), primero se inyectan las semillas (`seedPOS`, `seedCash`) directamente en `localStorage` usando `page.evaluate()`, seguido de un `page.reload()`. Al recargar, React y Zustand disparan múltiples re-renders mientras hidratan el estado de las bodegas, inventario y configuración.

**2. Causa Técnica de los Errores (Timeouts de 30000ms)**
1.  **Selector Obsoleto / Inexistente**: El error mostrado detalla un timeout esperando `text=Punto de Venta`. Sin embargo, si revisamos el render del Sidebar en `App.tsx`, la pestaña correspondiente tiene el texto `POS`, no "Punto de Venta". Al no existir en el DOM, Playwright espera hasta agotar el límite de 30 segundos.
2.  **Condición de Carrera (Race Condition) en la Hidratación**: Tras inyectar el `localStorage` y ejecutar `page.reload()`, el motor de Playwright intenta encontrar e interactuar con los elementos inmediatamente. Sin embargo, React está ejecutando asíncronamente los `useEffect` de `App.tsx` que hidratan los stores. Esto provoca re-renders masivos; si Playwright intenta hacer clic mientras el DOM se está re-pintando, el elemento se considera inestable o inaccesible, provocando el fallo del test.

**3. Solución Exacta Propuesta**
*   **Para el problema de Selectores**: 
    Reemplazar completamente el uso de pseudo-selectores de texto (`text=Punto de Venta`, `text=Abrir Turno`) por los selectores E2E robustos que ya inyectamos en la fase anterior: `[data-testid="nav-pos"]` y `[data-testid="btn-abrir-turno"]`.
*   **Para el problema de Sincronización (Race Condition)**:
    Incluir barreras de sincronización explícitas en los hooks `beforeEach` de los tests. Específicamente:
    1. Agregar `await page.waitForLoadState('networkidle')` o `await page.waitForLoadState('domcontentloaded')` inmediatamente después de `page.reload()`.
    2. Agregar una aserción de estabilización de la UI antes de interactuar, por ejemplo: `await expect(page.locator('.sidebar-menu')).toBeVisible()`. Esto forzará a Playwright a esperar a que la hidratación de React se haya completado y la estructura base del layout esté lista y estable para recibir eventos.

Quedo a la espera de tu aprobación sobre este diagnóstico para proceder con la generación e implementación de las correcciones.
