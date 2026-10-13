# Especificación Brownfield SDD 007: Alquiler de Frío — Peso Fijo por Cajas, Granel Bimodal en Canastillas & Salida Rápida

## 1. Contexto y Justificación de Negocio
En la operación de cuarto frío y custodia WMS 3PL de La Pezcadería ERP conviven dos tipologías críticas de mercancía que requieren agilidad extrema en patio:
1. **Mercancía estandarizada en cajas de peso cerrado:** Ej. cajas de papas francesas de 10 kg, cajas de atún en pouch de 12 kg. No requieren colocarse en báscula física una a una; el operario necesita ingresar únicamente la cantidad de cajas (ej. 50 cajas) y el sistema debe calcular de inmediato 500 kg netos.
2. **Mercancía al granel en canastillas de peso variable:** Ej. capón de carne, pescado entero en hielo. Ingresan 40 canastillas pesadas en báscula con un neto de 843.3 kg. El negocio necesita controlar tanto las **canastillas físicas** (para control de activo retornable/empaque) como los **kilogramos netos**.
3. **Despachos parciales y vaciado rápido:** Al salir 30 canastillas, el sistema debe sugerir el peso proporcional estimado por regla de tres, permitiendo al operario sobrescribirlo con el peso real de báscula de salida. A su vez, para el saldo final o retiros completos, se requiere un botón táctil de **Salida Rápida** que liquide el restante en un solo clic.

---

## 2. Requerimientos del Sistema (Notación EARS)

### EARS-U (Ubiquitous - Requerimientos Universales)
- **EARS-U-01:** El sistema DEBE soportar en el catálogo de productos de custodia las modalidades de medición: `PESO_ESTABLE` (peso nominal fijo por caja), `MIXTO_BULTOS_PESO` (granel con control dual de canastillas y peso variable) y `SOLO_PESO`.
- **EARS-U-02:** El sistema DEBE reflejar en todas las tablas de existencias, planillas de báscula y actas PDF tanto la cantidad de bultos/canastillas físicas como los kilogramos netos de producto.

### EARS-E (Event-Driven - Requerimientos Disparados por Eventos)
- **EARS-E-01 (Entrada de Cajas de Peso Fijo):** CUANDO el operario seleccione un producto configurado como `PESO_ESTABLE` en el pesaje de recepción, el sistema DEBE autocompletar el peso neto multiplicando `cantidad_cajas * peso_unitario_nominal_kg`, deshabilitando el pesaje obligatorio en báscula y permitiendo sobrescribir el peso unitario si ese lote varía.
- **EARS-E-02 (Entrada Granel con Control de Canastillas):** CUANDO el operario reciba producto a granel en canastillas, el sistema DEBE descontar la tara unitaria de canastilla multiplicada por las canastillas ingresadas y registrar el inventario con `bultos_actuales` (canastillas) y `peso_neto_actual_kg` (kilos netos gravimétricos).
- **EARS-E-03 (Salida Parcial Granel con Estimación Proporcional):** CUANDO el operario digite la cantidad de canastillas a despachar en una salida parcial, el sistema DEBE autocalcular y sugerir el peso neto proporcional:
  $$\text{Peso Retiro Sugerido} = \left(\frac{\text{Peso Neto Actual}}{\text{Bultos Actuales}}\right) \times \text{Bultos a Retirar}$$
  manteniendo el campo de peso neto editable para permitir capturar el peso real de báscula de salida.
- **EARS-E-04 (Botón Salida Rápida por Lote):** CUANDO el operario presione el botón `[⚡ Retirar Restante]` en la fila de un lote en el checklist de despacho, el sistema DEBE autocompletar el 100% de los bultos restantes y el 100% de los kilos netos restantes, marcando la partida como retiro total.
- **EARS-E-05 (Botón Salida Rápida Global):** CUANDO el operario presione el botón `[⚡ Despachar Todo el Saldo]` en la cabecera de despacho del cliente, el sistema DEBE marcar automáticamente el 100% de todos los lotes activos de ese cliente en una sola acción.

### EARS-S (State-Driven - Requerimientos Basados en Estado)
- **EARS-S-01:** MIENTRAS un lote mantenga `bultos_actuales > 0` y `peso_neto_actual_kg > 0`, el lote DEBE permanecer con estado `activo = true` en existencias y disponible para retiros posteriores.
- **EARS-S-02:** MIENTRAS el retiro sea total (`es_retiro_total = true` o saldos en 0), el lote DEBE pasar a `activo = false`, archivándose en existencias históricas.

### EARS-W (Unwanted Behavior - Casos de Excepción)
- **EARS-W-01:** SI el operario intenta retirar más canastillas o más kilogramos que las existencias actuales del lote, el sistema DEBE bloquear la acción y mostrar advertencia con SweetAlert2 impidiendo saldos negativos.
- **EARS-W-02:** SI en una salida parcial a granel el operario ingresa un peso mayor al peso total disponible del lote, el sistema DEBE impedir el registro informando el sobregiro de masa.

---

## 3. Criterios de Aceptación
1. **Entrada de Cajas:** Digitar 50 cajas con peso nominal de 10 kg genera inmediatamente una partida de 500 kg netos sin obligar a usar la báscula física.
2. **Entrada Granel:** Ingresar 40 canastillas con peso bruto en báscula de 923.3 kg descuenta 80 kg de tara (40 * 2.0 kg) registrando 843.3 kg netos y 40 canastillas en existencias.
3. **Salida Parcial Granel:** Al retirar 30 canastillas de las 40, el sistema sugiere automáticamente 632.48 kg netos; permite editar a 630.0 kg si se pesó en rampa, dejando exactamente 10 canastillas y 213.3 kg en saldo de cuarto frío.
4. **Salida Rápida:** Clic en `[⚡ Retirar Restante]` completa automáticamente las 10 canastillas y 213.3 kg restantes.
5. **Actas PDF:** Tanto el acta de recepción como el acta de despacho y el certificado de existencias muestran columnas claras para: `Empaque / Canastillas` y `Peso Neto (Kg)`.
6. **Calidad & DevTools:** 0 errores de TypeScript (`tsc --noEmit`), 100% tests en Vitest verdes y 0 errores en consola JS DevTools.
