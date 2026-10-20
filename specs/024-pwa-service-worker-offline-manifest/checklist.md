# Lista de Verificación de Calidad (Checklist de Ingeniería)

**Código:** SPEC-024  
**Título:** Service Worker PWA, Web App Manifest y Caché Offline de Recursos  
**Fase:** Spec Kit v3.0 — `/speckit.checklist`  
**Estándar:** PWA Checklist (Google Web.dev / W3C Web App Manifest) | WCAG 2.2 AA+ | RULE-SDD-001

---

## 1. Estándares Web App Manifest & Instalabilidad (PWA)
- [ ] **CHKL-01:** El archivo `manifest.webmanifest` es válido bajo el estándar W3C con `name`, `short_name`, `start_url`, `display: standalone`, `background_color` y `theme_color`.
- [ ] **CHKL-02:** Incluye atajos de aplicación (`shortcuts`) con acceso directo 1-toque a `/repartidor` ("Portal Conductor") y `/ventas/pos` ("Punto de Venta").
- [ ] **CHKL-03:** Dispone de iconos en formato PNG/SVG en tamaños 192x192 y 512x512 con propósito `any` y `maskable` para compatibilidad con Android Adaptive Icons.
- [ ] **CHKL-04:** Declarados en `index.html` los meta tags de compatibilidad Apple iOS (`apple-mobile-web-app-capable`, `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style` y `apple-touch-icon`).

---

## 2. Service Worker y Estrategias de Red (Offline Resilience)
- [ ] **CHKL-05:** El ciclo de vida de `sw.js` gestiona correctamente los eventos `install`, `activate` y `fetch`.
- [ ] **CHKL-06:** El evento `install` pre-cachea de forma segura el app shell básico (`index.html`, favicon y assets base) sin bloquear si un recurso opcional falla.
- [ ] **CHKL-07:** El evento `activate` purga de forma determinista versiones antiguas de `CacheStorage` (`pezcaderia-static-v*`).
- [ ] **CHKL-08:** Peticiones de navegación (`mode: 'navigate'`) implementan `Network-First` con fallback instantáneo a `index.html` en caso de fallo de red o modo offline.
- [ ] **CHKL-09:** Assets estáticos (JS, CSS, fuentes, imágenes SVG) aplican estrategia `Stale-While-Revalidate` o `Cache-First` con guardado en segundo plano.
- [ ] **CHKL-10:** Peticiones hacia APIs de Supabase, endpoints REST y WebSockets operan en bypass `Network-Only`, delegando la persistencia y reintento offline a la cola transaccional `caja_outbox_v2`.

---

## 3. Experiencia de Usuario y Regla del Niño de 12 Años
- [ ] **CHKL-11:** Captura del evento `beforeinstallprompt` sin provocar avisos intrusivos, ofreciendo un botón táctil opcional $\ge 48\text{ px}$ ("📲 Instalar App") en el portal del chofer y sidebar.
- [ ] **CHKL-12:** Notificación de actualización táctil (`PwaUpdatePromptModal.tsx`) con botón principal $\ge 56\text{ px}$ que activa el nuevo Service Worker con `postMessage({ type: 'SKIP_WAITING' })` y recarga suave.
- [ ] **CHKL-13:** Cero imágenes pesadas o rasterizadas no controladas (100% SVG semántico con Lucide React / canvas generado a Costo $0).
- [ ] **CHKL-14:** Modo Claro (Light Mode) con contraste WCAG 2.2 AA+ (ratios $\ge 4.5:1$ en textos y $\ge 3:1$ en bordes interactivos).

---

## 4. Gobernanza de Arquitectura y Quality Gate
- [ ] **CHKL-15:** **RULE-SDD-001:** Cumplimiento estricto de cero nuevas dependencias en `package.json` (Service Worker nativo en TypeScript/Vanilla JS).
- [ ] **CHKL-16:** Compilación TypeScript estricta con **0 errores (`tsc --noEmit`)**.
- [ ] **CHKL-17:** Cobertura de pruebas unitarias TDD $\ge 80\%$ en Vitest con simulación de eventos de Service Worker y registro de manifest.
- [ ] **CHKL-18:** Auditoría Master Architect SOLID con 0 violaciones críticas (`audit-solid-boundaries.cjs`).
- [ ] **CHKL-19:** Validación interactiva en vivo con DevTools (0 errores JS en consola y vista móvil 375 px).
