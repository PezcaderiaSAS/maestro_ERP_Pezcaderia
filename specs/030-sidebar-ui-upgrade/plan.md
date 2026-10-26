# Plan de Implementación Técnica: /speckit.plan (SPEC-030)

**Código:** SPEC-030  
**Fase:** /speckit.plan (SDD v3.0)  
**Ticket:** UIUX-SIDEBAR-FINAL  
**Título:** Implementación Definitiva: Premium Sidebar UI (Glassmorphism & macOS Style)  
**Fecha:** 2026-10-26  
**Límite Kanban:** `WIP = 1`  

---

## 1. Arquitectura de Componentes y Estructura de Archivos

```
src/
├── components/
│   └── layout/
│       ├── EnterpriseSidebar.tsx         # Componente principal refactorizado (Dark Glassmorphism Flotante)
│       └── components/
│           ├── MacWindowControls.tsx      # Controles macOS (Rojo, Amarillo, Verde con funciones nativas)
│           └── SidebarTooltip.tsx         # Tooltip flotante interactivo para modo colapsado
└── tests/
    └── enterpriseSidebar.test.tsx        # Suite de pruebas unitarias actualizada y extendida
```

---

## 2. Especificación Detallada de Componentes

### 2.1 `MacWindowControls.tsx`
- **Renderizado:**
  Contenedor `flex items-center gap-2 px-1 py-1` con tres círculos de `w-3 h-3 rounded-full cursor-pointer transition-transform active:scale-90`:
  - `bg-[#FF5F56] border border-[#E0443E]` (Rojo): Dispara `onClose` que abre un diálogo SweetAlert2 de confirmación de salida.
  - `bg-[#FFBD2E] border border-[#DEA123]` (Amarillo): Dispara `onMinimize` que alterna `isOpen` (`onToggleOpen`).
  - `bg-[#27C93F] border border-[#1AAB29]` (Verde): Dispara `onMaximize` que alterna `document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()`.
- **Accesibilidad:** `aria-label` y `title` descriptivos en cada botón.

### 2.2 Header con Usuario Superior en `EnterpriseSidebar.tsx`
- Ubicado inmediatamente debajo de `MacWindowControls`:
  - Contenedor con `flex items-center gap-2.5 p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md`:
    - Avatar circular `w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white/20 shadow-md`.
    - Nombre del usuario `text-xs font-bold text-white truncate max-w-[120px]`.
    - Badge de rol en mayúsculas `text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-bold`.
    - Botón de switch de vendedor con PIN (`onOpenUserSwitch`).

### 2.3 Categorías & Navegación (Code XR Style)
- Secciones divididas semánticamente:
  - `<div className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-widest text-slate-400/80 uppercase">MENU</div>`
  - `<div className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-widest text-slate-400/80 uppercase">OPERACIONES</div>`
  - `<div className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-widest text-slate-400/80 uppercase">GENERAL</div>`
- **Estado Activo (Rojo Vibrante Code XR):**
  - `bg-red-600 text-white font-bold shadow-lg shadow-red-600/30 rounded-xl`
  - Icono Lucide en blanco puro `text-white` con `scale-105`.
- **Estado Inactivo:**
  - `text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-150`.

### 2.4 Contenedor Flotante Glassmorphism
- Clases aplicadas al `<aside id="enterprise-sidebar">`:
  - `fixed top-3 bottom-3 left-3 z-50 flex flex-col`
  - `bg-slate-900/85 backdrop-blur-2xl border border-white/12 shadow-2xl shadow-black/60 rounded-3xl select-none`
  - Ancho dinámico: `isOpen ? 'w-64' : 'w-20'` con transición `transition-all duration-300 ease-in-out`.
  - Estilo de hardware acceleration: `transform: translateZ(0)`.
  - Scrollbar oculto/invisible: `scrollbar-none [&::-webkit-scrollbar]:hidden`.

---

## 3. Plan de Migración y Cero Regresiones
- Asegurar que los `data-testid` canónicos existentes se preserven íntegramente:
  - `nav-pos`, `nav-inventario`, `nav-despachos`, `nav-alistamiento`, `nav-alquiler-cf`, `nav-precios`, `nav-clientes`, `nav-caja`, `nav-cartera`, `nav-rrhh`.
- Preservar compatibilidad con el modal de conmutación de usuario con PIN.
- Garantizar que los tests de `enterpriseSidebar.test.tsx` sigan pasando al 100%.
