# Plan de Implementación Técnica: Service Worker PWA, Web App Manifest y Caché Offline

**Código:** SPEC-024  
**Título:** Service Worker PWA, Web App Manifest y Caché Offline de Recursos  
**Fase:** Spec Kit v3.0 — `/speckit.plan`  
**Gobernanza:** Flujo Continuo Kanban (`WIP = 1`) | Arquitectura Modular | RULE-SDD-001

---

## 1. Arquitectura y Enfoque Técnico

Para dotar al ERP de capacidades PWA y caché offline resiliente sin violar la regla de guardarraíles **RULE-SDD-001** (cero dependencias adicionales), se adopta una arquitectura PWA nativa basada en los estándares web modernos de la W3C:

```
[ Navegador Móvil / PWA Standalone ]
      │
      ├── (1) manifest.webmanifest ──> Definición de la PWA, iconos, colores y shortcuts
      │
      ├── (2) index.html (Meta Tags) ──> Meta tags Apple iOS, viewport y theme-color
      │
      ├── (3) sw.js (Service Worker Nativo)
      │       ├── CacheStorage ('pezcaderia-static-v1')
      │       ├── Estrategia Navigation: Network-First con fallback a index.html
      │       ├── Estrategia Assets: Stale-While-Revalidate para JS/CSS/Fonts/SVG
      │       └── Estrategia APIs: Network-Only (Supabase/REST delegadas a IndexedDB)
      │
      └── (4) src/services/serviceWorkerRegistration.ts
              ├── Registro seguro en window.onload (evita bloqueo del TTI)
              ├── Manejo del evento 'controllerchange' y postMessage('SKIP_WAITING')
              └── Store reactivo usePwaStore (beforeinstallprompt, waitingWorker)
```

---

## 2. Desglose de Archivos y Responsabilidades

### 2.1. Archivos Públicos Estáticos (`public/`)
1. **`public/manifest.webmanifest`:**
   - Metadatos de la PWA: `name: "La Pezcadería ERP"`, `short_name: "Pezcadería"`, `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `theme_color: "#0f172a"`, `background_color: "#ffffff"`.
   - Accesos directos (`shortcuts`):
     - Shortcut 1: `name: "Portal Conductor"`, `url: "/repartidor"`, `icon: "/icons/shortcut-driver.svg"`.
     - Shortcut 2: `name: "Punto de Venta"`, `url: "/ventas/pos"`, `icon: "/icons/shortcut-pos.svg"`.
2. **`public/icons/`:**
   - `icon-192.svg` e `icon-512.svg`: Iconos vectoriales semánticos a Costo $0 con fondo slate-900 y pez esmeralda de alta fidelidad.
   - Script generador de iconos PNG (`scripts/pwa/generate-pwa-icons.cjs`) usando canvas nativo para asegurar compatibilidad universal Android/iOS sin paquetes npm externos.
3. **`public/sw.js`:**
   - Service Worker Vanilla JS:
     - Constante de versión: `CACHE_NAME = 'pezcaderia-static-v1'`.
     - `self.addEventListener('install')`: pre-cachea `['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.svg']`.
     - `self.addEventListener('activate')`: purga cachés antiguas que no coincidan con `CACHE_NAME`.
     - `self.addEventListener('fetch')`: filtrado por origen y modo de petición (`navigate`, `static`, `api`).
     - `self.addEventListener('message')`: escucha `{ type: 'SKIP_WAITING' }` para activar nuevas versiones.

### 2.2. Capa de Servicios y Stores (`src/services/` y `src/store/`)
1. **`src/services/serviceWorkerRegistration.ts`:**
   - Función `registerServiceWorker(config?: ServiceWorkerConfig)`:
     - Verifica soporte de `'serviceWorker' in navigator`.
     - Registra `/sw.js` tras `window.addEventListener('load')`.
     - Escucha cambios de estado (`installing`, `waiting`, `active`).
     - Emite callbacks `onUpdate(registration)` y `onSuccess(registration)`.
   - Función `applyServiceWorkerUpdate()`: envía `SKIP_WAITING` al worker en espera y recarga la ventana.
2. **`src/store/usePwaStore.ts`:**
   - Store Zustand con persistencia/reactividad en memoria:
     - `isInstallable: boolean`
     - `isStandalone: boolean` (calculado con `window.matchMedia('(display-mode: standalone)').matches` o `navigator.standalone`)
     - `hasUpdatePending: boolean`
     - `installPromptEvent: BeforeInstallPromptEvent | null`
     - Acciones: `promptInstall()`, `setWaitingWorker()`, `applyUpdate()`.

### 2.3. Capa de Interfaz Táctil ("Regla del Niño de 12 Años")
1. **`src/components/pwa/PwaUpdatePromptModal.tsx`:**
   - Modal flotante sutil en esquina inferior o barra superior:
     - Título: "⚡ Nueva versión de La Pezcadería ERP disponible".
     - Subtexto: "Actualiza para obtener las últimas mejoras y asegurar la sincronización de tus entregas".
     - Botón de 1-toque $\ge 56\text{ px}$ (`min-h-[56px] h-14 bg-emerald-600`): "ACTUALIZAR AHORA".
     - Botón secundario $\ge 48\text{ px}$: "Más tarde".
2. **`src/components/pwa/PwaInstallBannerButton.tsx`:**
   - Botón accesible para montar en `DriverPortalView.tsx` y en el header/sidebar:
     - Icono `Download` o `Smartphone`.
     - Texto: "📲 Instalar App en este celular".
     - Target $\ge 48\text{ px}$ táctil.

### 2.4. Integración en `index.html` y `src/main.tsx`
1. **`index.html`:**
   - Agregar tags PWA:
     ```html
     <link rel="manifest" href="/manifest.webmanifest">
     <meta name="theme-color" content="#0f172a">
     <meta name="apple-mobile-web-app-capable" content="yes">
     <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
     <meta name="apple-mobile-web-app-title" content="Pezcadería">
     <link rel="apple-touch-icon" href="/icons/icon-192.svg">
     ```
2. **`src/main.tsx`:**
   - Invocar `registerServiceWorker()` vinculando las notificaciones al store de PWA.

---

## 3. Estrategia de Pruebas Unitarias TDD

Se creará la suite `src/tests/pwaServiceWorkerRegistration.test.ts` con Vitest simulando los entornos de navegador:
1. **Prueba 1:** Valida estructura y campos obligatorios de `manifest.webmanifest`.
2. **Prueba 2:** Registro exitoso de Service Worker en entorno con soporte.
3. **Prueba 3:** Manejo graceful cuando el navegador no soporta Service Workers (sin arrojar excepciones).
4. **Prueba 4:** Detección de actualización pendiente y disparo de callback `onUpdate`.
5. **Prueba 5:** Envío de mensaje `SKIP_WAITING` y recarga en `applyServiceWorkerUpdate`.
6. **Prueba 6:** Store `usePwaStore`: captura de evento `beforeinstallprompt`, estado `isStandalone` y ejecución de `promptInstall`.
7. **Prueba 7:** Renderizado del modal `PwaUpdatePromptModal` y botón `PwaInstallBannerButton` con targets táctiles $\ge 48\text{ px}$ y $\ge 56\text{ px}$.

---

## 4. Control de Riesgos y Mitigaciones

| Riesgo Técnico | Impacto | Estrategia de Mitigación |
| :--- | :--- | :--- |
| Caché agresiva que congele código desactualizado | Alto | `sw.js` usa versionado explícito (`pezcaderia-static-v1`), purga en `activate`, y peticiones `navigate` con `Network-First`. |
| Conflicto de caché con llamadas a Supabase / APIs | Crítico | Las URLs que contengan `/rest/v1/`, `/auth/v1/` o dominios externos de backend se excluyen explícitamente y se tratan como `Network-Only`. |
| Bloqueo del guardarraíl RULE-SDD-001 | Crítico | Cero paquetes npm adicionales. Service worker nativo estándar soportado al 100% por Vite y navegadores modernos. |
| Recarga involuntaria mientras el chofer toma una firma | Alto | `skipWaiting` no se dispara automáticamente; se solicita confirmación al usuario mediante `PwaUpdatePromptModal`. |
