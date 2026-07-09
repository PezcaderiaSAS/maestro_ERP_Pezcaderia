# Especificación de Requerimiento (Spec)

## 1. Contexto y Problema ("El Por Qué")

Tras la reciente actualización del diseño en el modal de **Apertura de Turno** (para evitar el solapamiento de textos en la calculadora de base), se introdujo una regresión visual en los campos de entrada numéricos.

En el componente `CalculadorDenominaciones`, los campos `<input>` donde se digitan las cantidades de billetes y monedas ("CANT.") se han colapsado horizontalmente. Actualmente solo muestran las flechas del spinner nativo del navegador, haciendo imposible ver o digitar el número ingresado.

**Causa Técnica (Corregida en CQ-1):**
El `<input>` tiene `w-full`, pero dentro de un contenedor `flex` (la fila `CANT. + input`), `w-full` no significa "ocupa el espacio disponible" — solo declara que el input intentará ser tan ancho como su bloque padre. En un contexto flex, el espacio debe negociarse con `flex-1`. La etiqueta `CANT.` tiene `shrink-0` (no se encoge) y consume su espacio mínimo; sin `flex-1` en el input, este colapsa a 0px de ancho efectivo. La clase `min-w-0` que se añadió previamente empeoró el colapso al eliminar el mínimo nativo del navegador.

## 2. Alcance y Objetivos ("El Qué")

**Objetivo Principal:**
Restaurar la visibilidad y usabilidad de los campos de entrada en la Calculadora de Denominaciones, asegurando que ocupen el espacio disponible sin romper el diseño responsivo de la tarjeta.

**Entregables:**

1. Modificar la estructura flex del contenedor del input en las tarjetas del `CalculadorDenominaciones`.
2. Asegurar que el `<input type="number">` tenga un ancho mínimo razonable y pueda expandirse usando `flex-1` o definiendo el padre con `w-full`.
3. Ocultar los botones del spinner nativo (flechas arriba/abajo) de los inputs tipo número, ya que estorban visualmente en espacios reducidos y los usuarios de POS prefieren usar teclado numérico (opcional pero recomendado UX).

## 3. Impacto y Dependencias

- **Componentes Afectados:** `src/views/cash/components/CalculadorDenominaciones.tsx`.
- **Dependencias (Grafo):** Este componente es consumido directamente por `AperturaCajaModal.tsx` y `CierreCajaModal.tsx`.
- **Riesgo:** Bajo. El cambio es puramente a nivel de CSS/Tailwind dentro de una vista específica, no altera la lógica de suma ni el estado de `Zustand`.

---

**Estado:** ⏳ ESPERANDO APROBACIÓN PARA CONTINUAR CON EL PLAN.
