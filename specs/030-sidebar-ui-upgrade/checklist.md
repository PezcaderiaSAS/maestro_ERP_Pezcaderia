# Lista de Verificación de Calidad: /speckit.checklist (SPEC-030)

**Código:** SPEC-030  
**Fase:** /speckit.checklist (SDD v3.0)  
**Ticket:** UIUX-SIDEBAR-FINAL  
**Fecha:** 2026-10-26  
**Límite Kanban:** `WIP = 1`  

---

## 1. Criterios de Calidad, Diseño y Accesibilidad

### Estética Glassmorphism & Panel Flotante
- [ ] El contenedor del sidebar flota despegado de los bordes (`left-3 top-3 bottom-3 fixed` o `m-3`).
- [ ] Posee esquinas redondeadas continuas (`rounded-3xl`).
- [ ] Aplica fondo oscuro translúcido con desenfoque profundo (`bg-slate-900/85 backdrop-blur-2xl`).
- [ ] Borde con brillo especular sutil (`border border-white/12`).
- [ ] Sombra multicapa ambiental de profundidad (`shadow-2xl shadow-black/50`).
- [ ] Aceleración por hardware activa (`transform: translateZ(0)`).

### Controles de Ventana macOS
- [ ] Tres círculos alineados horizontalmente en la parte superior izquierda (`w-3 h-3 rounded-full`).
- [ ] Colores exactos: Rojo (`#FF5F56`), Amarillo (`#FFBD2E`), Verde (`#27C93F`).
- [ ] Botón Rojo: Ejecuta diálogo SweetAlert2 para confirmar cierre de sesión / salida.
- [ ] Botón Amarillo: Alterna colapso/expansión del sidebar (sincronizado con `Ctrl+B`).
- [ ] Botón Verde: Alterna pantalla completa (`fullscreen`).

### Módulo de Usuario Superior
- [ ] Ubicado inmediatamente debajo de los controles macOS.
- [ ] Formato ultracompacto con avatar circular, halo de color, nombre truncado y rol.
- [ ] Botón accesible para cambio rápido de vendedor con PIN (`setShowUserSwitchModal`).

### Categorización & Navegación (Code XR Style)
- [ ] Divisores de categoría en mayúsculas con tracking amplio (`MENU`, `OPERACIONES`, `GENERAL`).
- [ ] Contraste de texto secundario WCAG 2.1 AA+ (`text-slate-400`).
- [ ] Estado inactivo sutil y limpio (`text-slate-400 hover:text-white hover:bg-white/5`).
- [ ] Estado activo con bloque completo en Rojo Vibrante (`bg-red-600 text-white font-bold shadow-lg shadow-red-600/30 rounded-xl`).
- [ ] Iconos de Lucide React en blanco puro cuando el ítem está activo.

### Modo Colapsado & Tooltips
- [ ] En modo `w-20`, los iconos permanecen perfectamente centrados (`justify-center`).
- [ ] Al hacer `hover`, se despliega un tooltip flotante oscuro que muestra el nombre del módulo y su badge numérico.

### Rendimiento & Cero Regresiones
- [ ] Cero lag o caída de frames en el scroll del contenido principal.
- [ ] TypeScript estricto con 0 errores (`tsc --noEmit`).
- [ ] Pruebas unitarias de `enterpriseSidebar.test.tsx` pasando al 100%.
- [ ] Bucle DevTools MCP en vivo con 0 errores en consola JS y renderizado responsivo (375 px móvil).
