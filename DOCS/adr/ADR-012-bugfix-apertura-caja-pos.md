# ADR-012: Bugfix — Flujo "Abrir Turno de Caja" inoperante en POS

- **Estado:** Implementado
- **Fecha:** 2026-07-01
- **Contexto:** Bug reportado por operador — al dar click en el botón "Abrir Turno de Caja", no ocurría ninguna acción visible.
- **Impacto:** Bloqueante P0 — sin apertura de turno, el POS no puede procesar ninguna venta.
- **Archivos afectados:**
  - `src/views/pos/components/AperturaCajaModal.tsx`
  - `src/views/InventoryView.tsx`

---

## Causa Raíz (3 bugs encadenados)

### Bug #1 — Error de compilación en `InventoryView.tsx` (bloqueante de app)

**Archivo:** `src/views/InventoryView.tsx:71`

**Síntoma:** Vite no podía compilar el módulo → pantalla en blanco en toda la app.

**Código roto:**
```ts
// ANTES — doble anotación de tipo inválida en TypeScript
return items.filter((item: any: any) => item.sku === sku)...
```

**Fix:**
```ts
// DESPUÉS
return items.filter((item: any) => item.sku === sku)...
```

---

### Bug #2 — Mismatch de `bodegaId` en `AperturaCajaModal` (modal vacío)

**Archivo:** `src/views/pos/components/AperturaCajaModal.tsx:184`

**Síntoma:** El modal se abría pero mostraba "No hay cajas disponibles" → botón "Siguiente" permanentemente deshabilitado.

**Causa raíz:**
`cashService.seedCajasParaBodegas()` persiste las `Caja` usando `bodega.nombre` como `bodegaId`:
```ts
cajas.push({ bodegaId: bodega.nombre, ... }); // → "Bodega Principal"
```

Pero el `<select>` de bodega en el modal (bloque visible para rol `admin`) usaba `b.id` como `value`:
```tsx
// ANTES — value = b.id = "1" → no coincide con "Bodega Principal"
<option key={b.id} value={b.id}>{b.nombre}</option>
```

Esto hacía que `selectedBodegaId` fuera `"1"` (el ID numérico), mientras que el filtro
`cajasDisponibles = cajas.filter(c => c.bodegaId === selectedBodegaId)` buscaba `"1"` en un campo
que contenía `"Bodega Principal"` → array vacío → no hay opciones → UI bloqueada.

**Fix:**
```tsx
// DESPUÉS — value = b.nombre → coincide con lo que seedCajasParaBodegas guardó
<option key={b.id} value={b.nombre}>{b.nombre}</option>
```

**Nota:** El bug era específico del rol `admin`. Para `cajero`, el `selectedBodegaId` se inicializa
con `bodegaActiva` (que ya viene como nombre), por lo que el flujo funcionaba correctamente.

---

### Bug #3 — Modal fuera del viewport (CSS sin compilar)

**Archivo:** `src/views/pos/components/AperturaCajaModal.tsx:130-134`

**Síntoma:** El modal se montaba en el DOM (confirmado via React DevTools) pero era invisible.
El elemento renderizaba en Y:842px, por debajo del viewport de 888px de altura.

**Causa raíz:**
`tailwindcss` **no está instalado** en este proyecto (`package.json` no lo incluye como dependencia).
Las clases `fixed`, `inset-0`, `z-[99999]` en el JSX no producen ningún CSS en el bundle final.
Al no tener `position: fixed`, el modal heredaba `position: static` y se colocaba al final del `body`.

**Fix:** Reemplazar las clases Tailwind del contenedor del portal con `style` inline puros:
```tsx
// ANTES
<div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
  <div className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden max-h-[95vh] max-w-2xl ...">

// DESPUÉS
<div style={{
  position: 'fixed', inset: 0, zIndex: 99999,
  background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
  display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
}}>
  <div style={{
    background: '#fff', borderRadius: '1rem',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
    width: '100%', maxWidth: '42rem', maxHeight: '95vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    animation: 'modalFadeIn 0.3s ease-out forwards'
  }}>
```

---

## Flujo de Datos Corregido

```
[PaymentPanel] btn click → onAbrirTurnoRequest()
       ↓
[POSView] setShowAperturaModal(true)
       ↓
{showAperturaModal && <AperturaCajaModal>} monta en DOM via createPortal
       ↓
[AperturaCajaModal] useEffect → cashService.getCajas()
       ↓
filter: c.bodegaId === selectedBodegaId
  selectedBodegaId = bodegaActiva = bodega.nombre ← CLAVE DE CONSISTENCIA
       ↓
cajasDisponibles = [CajaMenor, CajaMayor]  ← ahora poblado correctamente
       ↓
Usuario selecciona caja → btn "Siguiente" habilitado
       ↓
Paso 2: Declaración de base (denominaciones)
       ↓
cashService.abrirTurno(cajaId, cajeroId, baseInicial, denominaciones)
       ↓
useCashStore.setTurnoActivo(nuevoTurno)
       ↓
isTurnoAbierto = true → PaymentPanel muestra botones de cobro
```

---

## Decisiones Arquitectónicas

### DA-1: No normalizar `bodegaId` en `seedCajasParaBodegas` a UUID

Se evaluó cambiar `bodegaId = bodega.nombre` → `bodegaId = bodega.id` en el seeder.
**Rechazado** porque requería migrar los registros ya persistidos en `localStorage` de todos los
usuarios activos, con riesgo de pérdida de datos en sesiones en curso.

**Deuda técnica registrada:** `TODO: migrar bodegaId en Caja a UUID en próximo sprint de migración Supabase.`

### DA-2: Estilos inline para el portal del modal

Se evaluó instalar `tailwindcss` como dependencia. **Pospuesto** — requiere configurar
`tailwind.config`, `postcss.config`, y re-auditar todo el proyecto para clases sin efecto.
El fix con `style` inline es idempotente y no introduce riesgo de regresión.

---

## Deuda Técnica Identificada

| ID | Descripción | Prioridad | Sprint Sugerido |
|----|-------------|-----------|-----------------|
| DT-021 | `tailwindcss` no instalado — auditar todas las clases sin efecto en el proyecto | Alta | Próximo |
| DT-022 | `bodegaId` en `Caja` debería ser UUID, no `nombre` de bodega | Media | Sprint Supabase |
| DT-023 | `LegacyCashService` usa key `turnosCaja` vs `useCashStore` usa `turnos_caja` — inconsistencia de storage keys | Media | Sprint Supabase |

---

## Validación

- ✅ Vite compila sin errores de TypeScript
- ✅ Modal se monta y es visible en viewport al hacer click
- ✅ `cajasDisponibles` se puebla con `Caja Menor` y `Caja Mayor`
- ✅ Botón "Siguiente" se habilita al seleccionar una caja
- ✅ Flujo avanza a Paso 2 (Declaración de Base) sin errores en consola
- ✅ Sin regresiones en el rol `cajero` (flujo que ya funcionaba)
