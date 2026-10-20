# Tareas de Implementación Granulares (SPEC-024)

**Código:** SPEC-024  
**Título:** Service Worker PWA, Web App Manifest y Caché Offline de Recursos  
**Fase:** Spec Kit v3.0 — `/speckit.tasks`  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`). Ejecución Quirúrgica TDD.

---

## Matriz de Tareas Secuenciales (WIP = 1)

### `TASK-024-01`: Web App Manifest, Iconos Vectoriales SVG y Metadatos PWA en `index.html` [COMPLETADA]
- **Objetivo:** Crear el archivo canónico `manifest.webmanifest` con atajos a `/` y `/repartidor`, diseñar iconos vectoriales SVG para 192x192 y 512x512 a Costo $0, y registrar los meta tags requeridos para PWA y Apple iOS en `index.html`.
- **Entregables:**
  - `public/manifest.webmanifest`: Configuración W3C con metadatos, colores del tema (`#0f172a`), orientación y accesos directos (`shortcuts`).
  - `public/icons/icon-192.svg` e `public/icons/icon-512.svg`: Iconos vectoriales semánticos con fondo de contraste y marca corporativa.
  - `public/icons/shortcut-driver.svg` y `public/icons/shortcut-pos.svg`: Iconos específicos para los accesos directos móviles.
  - Actualización de `index.html`: Inclusión de `<link rel="manifest">`, `meta theme-color`, `apple-touch-icon` y `apple-mobile-web-app-capable`.
- **Quality Gate:** Validación de sintaxis JSON/WebManifest, cero dependencias añadidas (RULE-SDD-001), `tsc --noEmit` en 0 errores.

---

### `TASK-024-02`: Script del Service Worker (`public/sw.js`) con Estrategias de Red [COMPLETADA]
- **Objetivo:** Construir el Service Worker nativo en Vanilla JS con ciclo de vida completo (install, activate, fetch, message), precaché de app shell, estrategia `Network-First` para navegación y bypass estricto para APIs dinámicas de Supabase.
- **Entregables:**
  - `public/sw.js`:
    - Versión controlada `CACHE_NAME = 'pezcaderia-static-v1'`.
    - Evento `install`: Precarga tolerante a fallos de recursos clave.
    - Evento `activate`: Purga automática de cachés antiguas.
    - Evento `fetch`:
      - Peticiones de navegación (`mode: 'navigate'`): Network-First con fallback a `/index.html`.
      - Assets estáticos (JS, CSS, fonts, SVG): Stale-While-Revalidate.
      - Peticiones a APIs (`/rest/v1/`, `/auth/v1/`, externas): Network-Only directo sin interceptar.
    - Evento `message`: Escucha `{ type: 'SKIP_WAITING' }` para activación controlada.
- **Quality Gate:** Sintaxis limpia ECMAScript moderna, sin dependencias externas, pruebas de intercepción simuladas.

---

### `TASK-024-03`: Módulo TypeScript de Registro y Store Reactivo Zustand (`usePwaStore`) [COMPLETADA]
- **Objetivo:** Implementar el gestor de ciclo de vida del Service Worker en TypeScript y el store reactivo para monitorear el estado de instalación y actualización de la PWA.
- **Entregables:**
  - `src/services/serviceWorkerRegistration.ts`: Funciones `registerServiceWorker()`, `unregisterServiceWorker()` y `applyServiceWorkerUpdate()`.
  - `src/store/usePwaStore.ts`: Store Zustand con estados `isInstallable`, `isStandalone`, `hasUpdatePending`, evento `installPromptEvent` y métodos de acción.
  - Integración en `src/main.tsx` para inicializar el registro sin bloquear el arranque inicial de la aplicación.
- **Quality Gate:** Tipado estricto TypeScript, 0 errores en `tsc --noEmit`, Master Architect SOLID aprobado sin críticas.

---

### `TASK-024-04`: Selector Táctil de Pago (Efectivo / Transferencia / Crédito B2B) y Componentes PWA ("Regla del Niño de 12 Años") [COMPLETADA]
- **Objetivo:** Implementar en la pantalla de parada del repartidor (`DriverStopExecutionView.tsx`) un selector táctil ergonómico de medio de pago que permita elegir explícitamente entre Efectivo, Transferencia, Mixto o **Crédito** (donde el cliente recibe pero no paga en efectivo en ruta, causándose a cartera), y construir los micro-componentes táctiles de actualización disponible e instalación manual de la PWA.
- **Entregables:**
  - Selector táctil de 4 opciones (`Efectivo`, `Transferencia`, `Crédito`, `Mixto`) con altura $\ge 48\text{ px}$ en `src/views/driver/components/DriverStopExecutionView.tsx`.
  - Cuando se selecciona `Crédito`: el recaudo requerido en efectivo/digital se fija en $0 y se muestra badge informativo claro "Pago a Crédito / Factura a Cartera".
  - Soporte en `RegistroEjecucionParadaSchema`, `driverDeliveryPwaService.ts` y `useDriverDeliveryPwaStore.ts` para persistir la `formaPagoEfectuada`.
  - `src/components/pwa/PwaUpdatePromptModal.tsx`: Modal accesible informando actualización disponible con botón $\ge 56\text{ px}$ "ACTUALIZAR AHORA".
  - `src/components/pwa/PwaInstallBannerButton.tsx`: Botón táctil $\ge 48\text{ px}$ "📲 Instalar en este celular" para choferes en el portal móvil.
  - Conexión en `src/views/driver/DriverPortalView.tsx` y en el header/layout del ERP.
- **Quality Gate:** Cero imágenes externas (100% Lucide React), targets $\ge 48\text{ px}$ y $\ge 56\text{ px}$, contraste WCAG 2.2 AA+, archivos $< 400$ líneas (SRP).

---

### `TASK-024-05`: Suite de Pruebas Unitarias TDD, Quality Gate Global y Certificación [COMPLETADA Y CERTIFICADA]
- **Objetivo:** Validar todo el flujo PWA con pruebas automatizadas unitarias e integración en Vitest, ejecutar la auditoría Master Architect y verificar en DevTools.
- **Entregables:**
  - `src/tests/pwaServiceWorkerRegistration.test.tsx`: Suite de pruebas unitarias TDD con 14/14 tests pasando (100% verde):
    1. Verificación de estructura y esquema de `manifest.webmanifest`.
    2. Existencia de iconos SVG (192, 512, shortcuts de conductor y POS).
    3. Registro exitoso de Service Worker y manejo seguro de navegadores sin soporte.
    4. Detección de actualización pendiente y disparo de callback `onUpdate`.
    5. Aplicación de `applyServiceWorkerUpdate` con evento `SKIP_WAITING` y listener `controllerchange`.
    6. Store `usePwaStore`: captura de `beforeinstallprompt`, `dismissUpdate` y `promptInstall`.
    7. Renderizado táctil de `PwaUpdatePromptModal` ($\ge 56\text{ px}$) y `PwaInstallBannerButton` ($\ge 48\text{ px}$).
    8. Selector táctil de forma de pago en `DriverStopExecutionView`: selección de Crédito B2B, recaudo $0 e información contextual.
  - Verificación `tsc --noEmit`: 0 errores.
  - Suite de Repartidores & PWA: 6 suites, 51/51 tests verdes al 100%.
  - Auditoría Master Architect SOLID (`audit-solid-boundaries.cjs`): 0 violaciones críticas (383 archivos analizados en 104 ms).
  - Actualización de `MEMORY.md`, `tasks.md` y `CHANGELOG_AGENTS.md`.
- **Quality Gate:** **ESPECIFICACIÓN SPEC-024 CULMINADA AL 100% Y CERTIFICADA.**

---

*Fin del desglose de tareas. Todas las tareas de SPEC-024 certificadas y completadas.*
