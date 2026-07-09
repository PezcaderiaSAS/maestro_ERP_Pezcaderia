# Plan de Implementación Técnica (El "Cómo")

Este plan detalla las modificaciones exactas al código para cumplir con la Especificación y la Checklist previamente aprobadas, asegurando la restauración visual de la Calculadora de Denominaciones.

## 1. Modificaciones Estructurales (React / JSX)

**Archivo Objetivo:** `src/views/cash/components/CalculadorDenominaciones.tsx`

### A. Uniformidad de Altura en Tarjetas (L65)

Para cumplir con el criterio de "altura uniforme fija", se debe asegurar que las tarjetas ocupen el 100% de la altura de la fila de la cuadrícula.

- **Cambio:** Añadir `h-full` a la clase del elemento contenedor `<label>`.

### B. Corrección de Colapso del Input (L94)

Para cumplir con el requerimiento de responsividad y permitir que el input use todo el ancho libre que deja la palabra "CANT.".

- **Cambio:** Añadir la clase `flex-1` a la definición del `<input>`. Esto instruye al input a crecer y consumir todo el espacio remanente dentro del contenedor `flex` padre (`L81`).

### C. Mejora UX / Accesibilidad: Ocultar Spinners (L94)

Para limpiar el ruido visual y evitar comportamientos erráticos con clics accidentales en pantallas estrechas, se ocultarán los controles nativos del input type="number".

- **Cambio:** Añadir las clases utilitarias de Tailwind mediante selectores arbitrarios:
  `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`.

## 2. Snippet Propuesto (Prototipo del Cambio)

```tsx
// src/views/cash/components/CalculadorDenominaciones.tsx

    return (
      <label
        key={item.key}
        // [MODIFICADO] Añadido h-full para altura uniforme
        className="flex flex-col justify-between h-full p-3 rounded-xl border-2 transition-transform hover:scale-[1.02] cursor-text shadow-sm"
        style={{ ... }}
      >
        {/* Encabezado... (Sin cambios) */}
        
        {/* Input de cantidad */}
        <div className="flex items-center gap-2 mt-auto">
          <span className="opacity-70 font-semibold text-xs shrink-0">CANT.</span>
          <input
            type="number"
            min="0"
            step="1"
            disabled={readOnly}
            // ... resto de props intactos
            
            // [MODIFICADO] Añadido flex-1 y utilidades de appearance para ocultar spinners
            className="flex-1 min-w-0 text-right py-1.5 px-3 bg-white/60 border border-black/10 rounded-lg font-bold text-lg text-slate-900 transition-all outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </label>
    );
```

## 3. Plan de Verificación (Testing)

Una vez implementado, se validará de la siguiente forma:

1. **Compilación:** Correr `npx.cmd tsc --noEmit` para validar tipado estricto.
2. **Visual:** Renderizar la vista principal `http://localhost:3000/` y abrir el modal "Abrir Turno".
3. **Casos de borde:**
   - Digitar valores de hasta 4 cifras (ej. `9999`) y verificar que el número se lea sin recortes.
   - Confirmar que al encoger la ventana, el input no aplasta a la palabra "CANT.".
   - Verificar la ausencia visual de las flechas (spinners).

---

**Estado:** ⏳ ESPERANDO APROBACIÓN PARA PASAR A GENERACIÓN DE TAREAS (`/speckit.tasks`).
