# Clarificaciones y Control de Calidad 1: /speckit.clarify (SPEC-030)

**Código:** SPEC-030  
**Fase:** /speckit.clarify (SDD v3.0 & /grill-me Protocol)  
**Ticket:** UIUX-SIDEBAR-FINAL  
**Fecha:** 2026-10-26  
**Límite Kanban:** `WIP = 1`  

---

## 1. Decisiones de Diseño y Arquitectura Resueltas (/grill-me)

### Decisión 1: Comportamiento Interactivo de los Controles macOS
- **Pregunta:** ¿Qué comportamiento interactivo deben tener los tres botones de ventana macOS (rojo, amarillo, verde)?
- **Resolución:**
  - **Rojo (`#FF5F56`):** Confirmación para cerrar sesión / salir mediante modal SweetAlert2 (`¿Deseas cerrar tu sesión actual?`).
  - **Amarillo (`#FFBD2E`):** Colapso / expansión suave del sidebar entre modo expandido (`w-64`) y modo compacto (`w-20`), sincronizado con el atajo de teclado `Ctrl+B`.
  - **Verde (`#27C93F`):** Alternar modo Pantalla Completa nativa del navegador (`document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()`).
- **Justificación:** Transforma el sidebar en un elemento interactivo que emula una aplicación de escritorio nativa, incrementando el valor percibido y la ergonomía del cajero y administrador.

---

### Decisión 2: Color de Acento del Estado Activo (Active State)
- **Pregunta:** ¿Cuál color de acento debe utilizarse para el ítem seleccionado?
- **Resolución:** **Rojo Vibrante de Code XR (`#EF4444` / `#DC2626` / `bg-red-600`)** con sombra de resplandor sutil (`shadow-lg shadow-red-600/30`), texto e icono en blanco puro (`text-white font-bold`) y esquinas redondeadas suaves (`rounded-xl`), ocupando el ancho del panel.
- **Justificación:** Brinda un contraste inmediato contra el fondo oscuro translúcido (`slate-900/85`), permitiendo al usuario identificar de un solo vistazo la sección activa sin esfuerzo visual.

---

### Decisión 3: Arquitectura de Información y Divisores de Categoría
- **Pregunta:** ¿Cómo deben estructurarse las categorías del menú con tracking amplio?
- **Resolución:** **Categorías Híbridas de Dominio ERP:**
  - **`MENU`:** Venta Rápida POS, Ventas B2B Bodega, Cotizaciones B2B, Directorio de Clientes.
  - **`OPERACIONES`:** Bodegas & WMS, Alistamiento B2B, Despachos & Rutas, Alquiler Cuarto Frío, Métricas OTIF, Compras Muelle, Producción & Despiece.
  - **`GENERAL`:** Caja Disponible, Cartera & Cuentas, Nómina & RRHH, Configuración de Bodegas / Siigo.
- **Justificación:** Mantiene la claridad visual del video de referencia al tiempo que preserva la totalidad de los flujos de negocio del ERP.

---

### Decisión 4: Módulo de Usuario Superior y Tooltips en Modo Colapsado
- **Pregunta:** ¿Cómo se ubica el perfil y cómo interactúa el sidebar colapsado?
- **Resolución:**
  - **Perfil Superior:** Ubicado inmediatamente debajo de los controles macOS en formato ultracompacto con avatar circular con halo de color, nombre truncado `Yurgen Moreno`, rol con badge y botón/dropdown accesible para cambio rápido de vendedor con PIN.
  - **Tooltips Flotantes en Modo Colapsado (`w-20`):** Al colapsar, los iconos se centran con `justify-center`, y en `hover` despliegan un tooltip flotante oscuro (`bg-slate-950/95 border border-white/20 shadow-xl rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white pointer-events-none z-50 fixed`) con el nombre completo y su badge numérico.
