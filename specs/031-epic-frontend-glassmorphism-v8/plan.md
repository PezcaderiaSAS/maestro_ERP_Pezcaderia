# Plan de Implementación Técnica: /speckit.plan (SPEC-031)

**Código:** SPEC-031  
**Fase:** /speckit.plan (SDD v3.0)  
**Ticket:** EPIC-FRONTEND-GLASSMORPHISM-V8  
**Título:** Transformación Global del Frontend: Sistema de Diseño Premium (Glassmorphism & Dark UI V8)  
**Estado:** PENDIENTE_APROBACION_USUARIO  
**Fecha:** 2026-10-26  

---

## 1. Arquitectura Técnica de la Solución (El "Cómo")

### 1.1. Estructura de Capas y Componentes
```
src/
├── components/
│   └── layout/
│       ├── EnterpriseSidebar.tsx         # [Existente/Certificado] Floating Glassmorphism Rail w-20/w-64
│       ├── EnterpriseTopbar.tsx          # [Por Refactorizar] Barra Superior Flotante Glassmorphism V8
│       ├── components/
│       │   ├── MacWindowControls.tsx     # [Existente/Certificado] Rojo, Amarillo, Verde
│       │   └── GlassCard.tsx             # [Nuevo] Contenedor Atómico Reutilizable Glassmorphism V8
│       └── GlobalOmniboxModal.tsx        # [Por Estilizar] Modal Flotante Glassmorphism con Cabecera macOS
├── App.tsx                               # [Por Adaptar] Canvas Global #0B0F19, Mesh Gradients y Layout Flotante
└── tests/
    └── globalLayoutV8.test.tsx           # [Nuevo] Suite TDD para Layout Shell Global V8
```

---

## 2. Definición Técnica de Componentes

### 2.1. Contenedor Base Reutilizable (`GlassCard.tsx`)
- **Props:**
  ```typescript
  export interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    showMacControls?: boolean;
    title?: string;
    badge?: string;
    onClose?: () => void;
    onMinimize?: () => void;
    onFullscreen?: () => void;
  }
  ```
- **Estilos:** `rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-white/12 shadow-2xl shadow-black/50 p-5 select-none`.
- **Specular Highlight:** `inset 0 1px 0 0 rgba(255, 255, 255, 0.15)`.

### 2.2. Barra Superior Flotante (`EnterpriseTopbar.tsx`)
- **Posicionamiento:** Panel flotante `mx-3 mt-3 mb-2 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-white/12 shadow-xl px-4 py-2.5 flex items-center justify-between text-white`.
- **Integración:**
  - Controles de estado de red (`ONLINE` pulsante en esmeralda).
  - Buscador global Omnibox (`Buscar... Ctrl+K` / `F8`) con estilo glass traslúcido.
  - Indicador de bodega activa.
  - Botón Facturar POS con active state `bg-red-600`.

### 2.3. Canvas Global en `App.tsx`
- **Fondo Base:** `bg-[#0B0F19] min-h-screen text-slate-100 relative overflow-x-hidden`.
- **Mesh Gradients de Profundidad:**
  - Orbe superior izquierdo: `absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none`.
  - Orbe inferior derecho: `absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none`.
- **Comportamiento Rail:**
  - El sidebar inicia en modo colapsado (`w-20`) para maximizar el área de trabajo de las vistas de datos.
  - El área principal tiene un margen izquierdo dinámico (`ml-24` cuando colapsado, `ml-68` cuando expandido en desktop, y `ml-0` con overlay en móvil).

---

## 3. Estrategia de Testing (TDD Estricto)
1. **Fase RED:** Escribir `src/tests/globalLayoutV8.test.tsx` con pruebas de:
   - Renderizado del canvas oscuro `#0B0F19` con mesh gradients.
   - Presencia de la topbar flotante con estética Glassmorphism (`backdrop-blur-2xl`, `rounded-2xl`).
   - Comportamiento de `GlassCard` con controles macOS opcionales.
   - Verificación de que el sidebar inicie en modo Rail por defecto (`w-20`).
2. **Fase GREEN:** Implementar `GlassCard.tsx`, refactorizar `EnterpriseTopbar.tsx` y adaptar el layout contenedor en `App.tsx`.
3. **Fase REFACTOR & HARNESS2:** Verificar compilación `tsc`, auditoría SOLID y ejecutar pipeline Harness².
4. **DevTools Checkpoint:** Inspección de 0 errores en consola y capturas en móvil (375 px) y desktop (1440 px).
