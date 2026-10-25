# Reporte de Clarificación y Desambiguación: SPEC-028

**Código:** SPEC-028  
**Fase:** /speckit.clarify (Control de Calidad 1 — SDD v3.0)  
**Fecha:** 2026-10-24  
**Estado:** APROBADO_POR_USUARIO  

---

## 1. Decisiones Clave Acordadas con el Usuario

### Decisión 1: Comportamiento ante Cambio en la Configuración Global de Mermas/Márgenes
- **Pregunta:** ¿Qué comportamiento debe ocurrir con los precios actuales del catálogo cuando el Admin guarde un cambio en los buffers o márgenes de una categoría?
- **Resolución Aprobada:**
  - Los precios actuales del catálogo **NO se alteran automáticamente ni de forma silenciosa**.
  - La nueva configuración aplica inmediatamente como valor sugerido para nuevas simulaciones y productos nuevos.
  - Se provee una acción explícita en la UI: **"Recalcular categoría en lote"**, la cual despliega un modal interactivo de previsualización que muestra el "Antes vs Después" de cada producto antes de que el Admin confirme la actualización masiva.

### Decisión 2: Jerarquía Bimodal de Buffers de Merma
- **Pregunta:** ¿Cómo se maneja la jerarquía de los buffers de merma?
- **Resolución Aprobada:**
  - **Jerarquía Bimodal (Categoría $\rightarrow$ Producto):**
    1. A nivel global, cada **Categoría / Especie** tiene sus buffers parametrizados por el Admin (ej. Pescado Blanco: 8%, Salmón: 10%, Mariscos: 12%).
    2. A nivel individual, el Admin puede activar una casilla **"Sobrescribir buffer para este producto"** en casos de productos atípicos o despieces especiales (ej. Pargo Rojo Entero Eviscerado vs Filete de Pargo).
    3. Si el producto no tiene buffer individual sobrescrito, hereda reactivamente el buffer de su categoría.

### Decisión 3: Tratamiento del Impuesto al Valor Agregado (IVA)
- **Pregunta:** ¿Cómo debe tratar el simulador dinámico el IVA?
- **Resolución Aprobada:**
  - Manejo mediante flag de régimen por producto:
    - `EXENTO_O_EXCLUIDO` (Default para la gran mayoría de pescados y mariscos crudos/refrigerados).
    - `GRAVADO_IVA_19` (Para productos procesados, embutidos o ítems gravados según normativa DIAN).
  - En la simulación se desglosa transparentemente:
    - **Precio Base (Subtotal Neto COP)**
    - **Valor IVA (19% si aplica o $0)**
    - **Precio Final al Cliente (COP)**
  - Ambos valores se redondean al peso entero en COP cumpliendo `RN-06`.

---

## 2. Invariantes y Reglas de Negocio Consolidadas

1. **`INV-PRC-01` (Costo Ajustado):**  
   $$\text{costoAjustado} = \text{round}\left(\text{costoCompra} \times \left(1 + \frac{\text{bufferEfectivoPct}}{100}\right)\right)$$  
   donde $\text{bufferEfectivoPct} = \text{producto.bufferPersonalizado} \;\text{??}\; \text{categoria.bufferDefault}$.

2. **`INV-PRC-02` (Fórmula de Precios por Canal):**  
   $$\text{precioBaseCanal} = \text{round}\left(\text{costoAjustado} \times \left(1 + \frac{\text{margenCanalPct}}{100}\right)\right)$$

3. **`INV-PRC-03` (Control de Rentabilidad Estricto):**  
   $$\text{margenRealPct} = \frac{\text{precioBaseCanal} - \text{costoAjustado}}{\text{precioBaseCanal}} \times 100$$  
   Si $\text{precioBaseCanal} < \text{costoAjustado}$ $\rightarrow$ **Bloqueo absoluto (Venta bajo costo)**.  
   Si $\text{margenRealPct} < \text{margenMinimoSeguridad}$ $\rightarrow$ **Advertencia severa y bloqueo, requiriendo autorización explícita de usuario ADMIN**.

4. **`INV-PRC-04` (Auditoría NIIF y SNAPSHOT Inmutable):**  
   Toda modificación genera un registro inmutable en `preciosHistorico` con:
   - `id`, `productoId`, `costoCompra`, `bufferEfectivoPct`, `costoAjustado`, tarifas por canal, `motivo`, `usuarioId`, `timestampIso`.
