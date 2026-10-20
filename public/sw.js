/**
 * ============================================================================
 * LA PEZCADERIA ERP — SERVICE WORKER PWA NATIVO
 * ============================================================================
 * Especificación: SPEC-024
 * Versión de Caché: pezcaderia-static-v1
 * Gobernanza: Cero Dependencias Adicionales (RULE-SDD-001)
 * Estrategias de Red:
 *   - Navegación (HTML): Network-First con fallback resiliente a App Shell.
 *   - Assets Estáticos (JS/CSS/Fonts/SVG): Stale-While-Revalidate.
 *   - APIs Dinámicas (Supabase/REST/RPC): Network-Only (Manejadas por Outbox).
 * ============================================================================
 */

const CACHE_NAME = 'pezcaderia-static-v1';

// Recursos críticos esenciales a pre-cachear durante la instalación
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/shortcut-driver.svg',
  '/icons/shortcut-pos.svg'
];

/**
 * 1. Evento INSTALL: Pre-almacenamiento del App Shell
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Usamos cache.addAll con tolerancia individual para no abortar si un recurso opcional falla
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url, { cache: 'no-cache' })
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
                return null;
              })
              .catch((err) => {
                console.warn(`[PWA ServiceWorker] No se pudo pre-cachear: ${url}`, err);
                return null;
              })
          )
        );
      })
      .then(() => {
        // No forzamos skipWaiting aquí para permitir control por modal en el cliente
        console.log(`[PWA ServiceWorker] App Shell pre-cacheado en ${CACHE_NAME}`);
      })
  );
});

/**
 * 2. Evento ACTIVATE: Limpieza determinista de cachés obsoletas y claim de clientes
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName.startsWith('pezcaderia-static-')) {
              console.log(`[PWA ServiceWorker] Purgando versión antigua de caché: ${cacheName}`);
              return caches.delete(cacheName);
            }
            return null;
          })
        );
      })
      .then(() => {
        console.log('[PWA ServiceWorker] Reclamando clientes activos');
        return self.clients.claim();
      })
  );
});

/**
 * 3. Evento FETCH: Enrutamiento inteligente según tipo de recurso
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Exclusión 1: No interceptar métodos que no sean GET (POST, PUT, DELETE se gestionan vía Outbox)
  if (request.method !== 'GET') {
    return;
  }

  // Exclusión 2: Peticiones a APIs de Supabase, WebSockets o servicios externos (Network-Only)
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/') ||
    url.pathname.startsWith('/api/') ||
    !url.protocol.startsWith('http')
  ) {
    // Permitir flujo directo a la red sin interceptar
    return;
  }

  // Estrategia A: Peticiones de Navegación (HTML / SPA Shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Guardar copia fresca en caché para futuras contingencias
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Contingencia Offline: Retornar index.html del app shell
          console.warn('[PWA ServiceWorker] Modo offline detectado en navegación. Sirviendo App Shell');
          const cache = await caches.open(CACHE_NAME);
          const cachedShell = (await cache.match('/index.html')) || (await cache.match('/'));
          if (cachedShell) {
            return cachedShell;
          }
          return new Response(
            '<!doctype html><html lang="es"><head><meta charset="utf-8"/><title>La Pezcadería ERP - Offline</title></head><body style="font-family:sans-serif;text-align:center;padding:40px;"><h2>Sin conexión a Internet</h2><p>El portal operará con los datos locales almacenados.</p><button onclick="location.reload()" style="padding:12px 24px;border-radius:12px;background:#059669;color:#fff;font-weight:bold;border:none;">Reintentar</button></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Estrategia B: Assets Estáticos Locales (JS, CSS, Fuentes, Iconos SVG, Manifest)
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff|woff2|ttf|json|webmanifest)$/i) ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/icons/'));

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Iniciar revalidación en segundo plano (Stale-While-Revalidate)
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Fallo silencioso de red al revalidar activo estático
            return null;
          });

        // Si ya está en caché, servir inmediatamente
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si no está en caché, esperar respuesta de la red
        return fetchPromise.then((netResp) => netResp || cachedResponse);
      })
    );
  }
});

/**
 * 4. Evento MESSAGE: Control de actualizaciones ('SKIP_WAITING')
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[PWA ServiceWorker] Recibido SKIP_WAITING. Activando nueva versión inmediatamente');
    self.skipWaiting();
  }
});
