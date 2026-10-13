# Especificación Técnica: Alquiler de Frío Multi-Producto & Unificación UI/UX Global

**Identificador:** `006-alquiler-frio-multi-item-ui-unification`  
**Módulos Afectados:** `wms-cold-storage-rental`, `ui-system`, `shared-components`  
**Protocolo:** Brownfield v2.2 / SDD / ECC Framework  
**Fecha:** 2026-10-10  
**Estado:** PLANIFICADO (Listo para ejecución en siguiente sesión)

---

## 1. Contexto & Objetivos del Negocio

### 1.1 Registro Múltiple en Báscula & Taras Múltiples
En la operación real de una planta pesquera o centro de distribución 3PL, los clientes no entregan ni retiran un solo lote aislado:
- Un camión descarga múltiples especies (ej. Corvina, Camarón, Pargo, Salmón).
- **Un mismo producto llega en diferentes embalajes dentro del mismo viaje:** por ejemplo, 15 canastillas plásticas de Corvina (tara 2.0 kg), 8 cajas de cartón de Corvina (tara 0.8 kg) y 40 kg de Corvina a granel (suelto, tara 0.0 kg).
- Cada pesada debe calcular con precisión milimétrica su tara y peso neto individual.
- Todas las pesadas deben consolidarse en una **única Acta de Recepción** con su consecutivo oficial, desglose partida por partida y total gravimétrico general.

### 1.2 Creación Rápida de Clientes In-Situ (15 Segundos)
Si un nuevo cliente llega a la báscula y no está registrado en el ERP:
- El operario no debe abandonar el modal de pesaje ni perder los datos digitados.
- Un sub-modal rápido permite ingresar los datos esenciales (Razón Social/Nombre, NIT/Cédula, Teléfono, Modalidad Días o Meses con tarifa base).
- El sistema crea de forma atómica el cliente y su contrato activo de custodia, seleccionándolo automáticamente en el formulario de báscula para continuar pesando sin fricción.

### 1.3 Despacho Múltiple con Checklist de Existencias
Al retirar mercancía:
- El cliente puede solicitar llevarse varios productos o lotes en un solo despacho.
- El operario visualiza un checklist de todos los lotes activos en custodia del cliente, seleccionando cuáles retirar (total o parcialmente en kg/bultos).
- El sistema liquida los días de custodia de cada lote seleccionado, verifica mora/cartera y emite una **única Acta de Retiro consolidada**.

### 1.4 Auditoría & Unificación UI/UX Global (Light Mode WCAG 2.2 AA+)
- Eliminar de raíz residuos de Dark Mode (`bg-slate-900`, `text-white` sin fondo, `border-white/10`) en tablas, modales, formularios y vistas de Bodega, Compras, Ventas y Nómina.
- Garantizar contraste >= 4.5:1 (texto regular) y >= 7:1 (texto grande y números clave).
- Asegurar visualización táctil perfecta en móvil (375 px) con 0 errores y 0 warnings en consola JS.

---

## 2. Requerimientos en Notación EARS

### 2.1 Requerimientos Ubicuos (Ubiquitous Requirements)
- **EARS-U01:** El sistema calculará en todo momento el peso neto de cada partida aplicando la fórmula determinista `pesoNeto = pesoBruto - (bultos * taraUnitaria)` utilizando `Number.EPSILON` para evitar errores de coma flotante.
- **EARS-U02:** Toda la interfaz gráfica del ERP mantendrá fondos claros (`#f8fafc`, `#ffffff`), tipografía de alta legibilidad (`#0f172a`, `#334155`) y bordes nítidos (`#cbd5e1`, `#e2e8f0`).

### 2.2 Requerimientos Guiados por Eventos (Event-Driven Requirements)
- **EARS-E01 (Agregar Partida de Pesaje):** CUANDO el operario presione "+ Agregar Partida a la Planilla" en el modal de recepción, EL SISTEMA validará que el peso bruto sea mayor a la tara total de la partida, adicionará el renglón al ticket de pesaje y recalculará inmediatamente los totales de bultos, tara y kg netos acumulados.
- **EARS-E02 (Mismo Producto Múltiples Taras):** CUANDO se agregue una partida de un producto ya existente en la planilla pero con diferente embalaje o tara, EL SISTEMA lo registrará como un renglón independiente sin sobrescribir ni fusionar erróneamente las taras.
- **EARS-E03 (Creación Rápida de Cliente):** CUANDO el operario presione "+ Nuevo Cliente Rápido" en el selector de clientes, EL SISTEMA desplegará un sub-modal de captura rápida que al guardarse creará el tercero, el cliente de custodia y su contrato activo, cerrará el sub-modal y dejará al cliente seleccionado en la báscula sin resetear el formulario.
- **EARS-E04 (Despacho Múltiple):** CUANDO el operario confirme la salida de los lotes seleccionados en el checklist, EL SISTEMA descontará los inventarios correspondientes, registrará los días reales de custodia por lote y generará el Acta de Retiro consolidada.

### 2.3 Requerimientos de Estado (State-Driven Requirements)
- **EARS-S01 (Alerta de Cartera en Despacho Múltiple):** MIENTRAS el cliente tenga facturas o mensualidades vencidas en mora, EL SISTEMA mostrará un banner de bloqueo preventivo en el modal de despacho con el monto adeudado y el botón directo de cobro en caja.
- **EARS-S02 (Planilla Vacía):** MIENTRAS la planilla de pesaje no tenga al menos una partida válida registrada, EL SISTEMA deshabilitará el botón "Guardar Recepción y Emitir Acta".

### 2.4 Requerimientos de Comportamiento No Deseado (Unwanted Behavior)
- **EARS-W01 (Validación Gravimétrica Negativa):** SI el peso bruto digitado es menor o igual a la tara calculada de los empaques, EL SISTEMA impedirá agregar la partida y mostrará una advertencia indicando que el peso neto debe ser estrictamente positivo.
- **EARS-W02 (Prevención de Duplicados en Cliente Rápido):** SI el número de documento digitado en la creación rápida ya existe en la base de datos, EL SISTEMA alertará al operario y sugerirá seleccionar el cliente existente para no duplicar historiales.

---

## 3. Criterios de Aceptación (Definición de Terminado)

1. **Partidas Múltiples:** Poder ingresar N pesadas (del mismo o diferente producto y empaque) en un solo movimiento de entrada.
2. **Cliente Rápido:** Crear un cliente y contrato activo en menos de 15 segundos desde el modal de pesaje sin pérdida de contexto.
3. **Despacho Múltiple:** Retirar N lotes de un cliente simultáneamente mediante checklist.
4. **Documentos PDF:** Actas de Recepción y Entrega desglosan individualmente cada partida, mostrando producto, bultos, tara, kg brutos y kg netos.
5. **Calidad & Tests:** 100% de tests unitarios e integración pasando en Vitest (mínimo 45 tests en `coldStorageRental.test.ts`).
6. **Bucle DevTools:** 0 errores en consola JS, vista móvil 375 px verificada y Lighthouse accesibilidad >= 95.
