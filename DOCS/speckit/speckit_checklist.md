# Lista de Verificación de Calidad (Checklist)

Esta lista valida que los requerimientos para la corrección del componente `CalculadorDenominaciones` estén completos, claros y alineados con los estándares de la industria UI/UX y la arquitectura del ERP.

## 1. Validación del Requerimiento Base
- [x] **Causa Raíz Identificada Correctamente:** Se corrigió el diagnóstico inicial de la Spec. El problema no era el ancho de la ventana modal, sino la falta de `flex-1` en el `<input>` dentro de su contenedor flex padre (`<div className="flex items-center gap-2 mt-auto">`), provocando que `CANT.` consumiera el espacio mínimo y el input colapsara a 0px.
- [x] **Alcance Definido:** La solución debe aplicarse al componente compartido `src/views/cash/components/CalculadorDenominaciones.tsx`.
- [x] **Impacto Comprendido:** Al ser un componente compartido, el fix resolverá automáticamente el problema tanto en **Apertura de Turno** como en **Cierre de Caja**.

## 2. Estándares UI / UX
- [x] **Responsividad:** El input debe usar el espacio remanente (`flex-1`) sin empujar a la etiqueta `CANT.` fuera de la tarjeta, manteniendo el diseño funcional en diferentes anchos de pantalla.
- [x] **Consistencia Visual:** Todas las tarjetas (billetes y monedas) deben tener una **altura uniforme fija** (ej. `h-full`), para que la cuadrícula se vea ordenada independientemente de si el texto interno hace wrap o no.
- [x] **Accesibilidad / Usabilidad:** Ocultar los botones del spinner nativo (flechas arriba/abajo) de los inputs tipo número con clases de utilidad de Tailwind (ej. `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`). Esto evita el desorden visual en tarjetas estrechas y fomenta el uso del teclado numérico, que es la práctica estándar en un POS.

## 3. Arquitectura y Código
- [x] **Uso de Clases Utilitarias:** La solución se implementará exclusivamente con clases de Tailwind CSS nativas (`flex-1`, `w-full`, `min-w-0`, utilidades de appearance).
- [x] **Sin Afección a la Lógica de Negocio:** Los cambios no deben alterar los eventos `onChange`, `onKeyDown` ni el estado de `Zustand` asociado al cálculo de denominaciones.
- [x] **Evitar CSS Global:** No se añadirán estilos a `index.css` para este fix puntual, manteniendo el aislamiento del componente.

## 4. Criterios de Aceptación (DoD - Definition of Done)
- [ ] En el modal de Apertura de Turno, el campo "CANT." es claramente visible y permite ver números de múltiples dígitos.
- [ ] Las tarjetas de denominaciones mantienen una altura idéntica en su respectiva cuadrícula.
- [ ] Los spinners nativos de incremento/decremento no son visibles en el input.
- [ ] La compilación estática (`tsc --noEmit`) pasa sin errores.

---

**Estado:** ⏳ ESPERANDO APROBACIÓN PARA CONTINUAR CON EL PLAN (`/speckit.plan`).
