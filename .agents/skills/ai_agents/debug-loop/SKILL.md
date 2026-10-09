---
name: debug-loop
description: >
  Debugging sistemático en loops controlados con documentación obligatoria del estado
  antes y después de cada intento de corrección. Úsala cuando debuggees errores
  difíciles de localizar, bugs intermitentes, errores de build en cadena, o problemas
  de integración service/store/DB. Cada hipótesis es un loop: se documenta, se prueba,
  se registra el resultado. Nunca guesses sin evidencia registrada.
version: 1.0.0
source: local-engineering-patterns
---

# Debug Loop — Debugging Sistemático con Trazabilidad

## Cuándo usar esta skill

- El build falla con múltiples errores encadenados
- Un test E2E o unitario falla y no está claro el origen
- Un store Zustand no actualiza como se espera
- Una llamada a Supabase retorna datos inesperados
- Un service devuelve `{ error: "..." }` sin causa obvia
- Llevas más de 10 minutos debuggeando sin evidencia registrada
- Un bug regresó después de haber sido "corregido"

**Cuándo NO usar:** Errores obvios de sintaxis o typos (corrígelos directamente). Errores de un solo archivo con stack trace claro.

---

## El Protocolo de Debug Loop

Cada ciclo de debugging es un loop con 6 fases:

```
╔══════════════════════════════════════════╗
║  SNAPSHOT DE SÍNTOMA  (qué se observa)   ║
╠══════════════════════════════════════════╣
║  HIPÓTESIS  (por qué podría ocurrir)     ║
╠══════════════════════════════════════════╣
║  EXPERIMENTO  (cómo se va a probar)      ║
╠══════════════════════════════════════════╣
║  EJECUCIÓN  (el experimento en acción)   ║
╠══════════════════════════════════════════╣
║  RESULTADO  (qué pasó realmente)         ║
╠══════════════════════════════════════════╣
║  SNAPSHOT POSTERIOR  (estado resultante) ║
╚══════════════════════════════════════════╝
```

---

## Plantilla de Debug Loop (copiar por cada intento)

```markdown
---
## 🐛 DEBUG LOOP [N] — [Fecha hora]

### 📸 SNAPSHOT DE SÍNTOMA
- **Error exacto:** `[pegar el mensaje de error completo, no parafrasearlo]`
- **Dónde ocurre:** [archivo:línea | componente | endpoint | test]
- **Cuándo ocurre:** [siempre | solo en X condición | intermitente]
- **Última vez que funcionó:** [commit conocido | "nunca funcionó"]
- **Cambios recientes relacionados:** [archivos modificados antes de que apareciera]
- **Estado del sistema:** build [✅|❌], tests [N passing / N failing]

### 🔬 HIPÓTESIS [N.1] — [descripción corta]
> [Explicar en una oración POR QUÉ se cree que esto podría ser la causa.
>  Si no tienes evidencia para esta hipótesis, decirlo explícitamente.]

**Nivel de confianza:** [Alta / Media / Baja]
**Evidencia que apoya esta hipótesis:**
- [observación 1]
- [observación 2]

### 🧪 EXPERIMENTO
**Qué voy a hacer para probarla:**
- [acción concreta y acotada — una sola variable cambia por experimento]

**Qué resultado esperaría si la hipótesis ES correcta:**
- [comportamiento esperado]

**Qué resultado esperaría si la hipótesis NO ES correcta:**
- [comportamiento alternativo]

### ⚙️ EJECUCIÓN DEL EXPERIMENTO
[Cambios de código, comandos ejecutados, logs analizados]

### 📊 RESULTADO
- **Lo que ocurrió:** [descripción del resultado real]
- **¿Hipótesis confirmada?** [✅ Sí | ❌ No | ⚠️ Parcialmente]
- **Nueva evidencia obtenida:** [cualquier información nueva que el experimento reveló]

### 📸 SNAPSHOT POSTERIOR
- **Estado del error:** [✅ Resuelto | 🔄 Parcialmente resuelto | ❌ Persiste | 🆕 Error diferente apareció]
- **Estado del build:** [✅ | ❌ N errores]
- **Tests:** [N passing / N failing]
- **Archivos modificados en este loop:** [lista]
- **Próxima hipótesis a probar:** [si el bug persiste]

---
```

---

## Registro de investigación global

Al iniciar una sesión de debugging compleja, crear este registro:

```markdown
# 🔍 INVESTIGACIÓN DE BUG: [Descripción del bug]
**Fecha inicio:** [fecha]
**Reportado en:** [archivo | componente | flujo]
**Prioridad:** [Crítico | Alto | Medio]

## Síntoma original
[Descripción completa del error, con stack trace si existe]

## Línea base
- Build al inicio: [estado]
- Tests al inicio: [N passing / N failing]
- Commit de referencia: [hash]

## Historial de hipótesis
| Loop | Hipótesis | Resultado | ¿Descartada? |
|------|-----------|-----------|--------------|
| 1    | [desc]    | ❌ No era | ✅ Descartada |
| 2    | [desc]    | ⚠️ Parcial | 🔄 Refinando |
| 3    | [desc]    | ✅ Causa raíz | ✅ Causa encontrada |

## Causa raíz confirmada
[Una vez encontrada, documentarla aquí para referencia futura]

## Solución aplicada
[Descripción de los cambios que resolvieron el bug]

## Guard agregado
[Test o validación agregada para que no regrese]
```

---

## Árboles de debugging por contexto (ERP MaestroPescaderia)

### Bug en Service → Store

```
Síntoma: El store no actualiza después de una operación

¿El service retorna { data, error }?
├── NO → El service lanza excepción no capturada
│        → Revisar bloque try/catch en la función del service
└── SÍ → ¿El store consume el resultado correctamente?
    ├── ¿Llama a set({ ... }) después del await?
    ├── ¿La acción del store está marcada como async?
    └── ¿zustandConsoleMiddleware intercepta el estado?
```

### Bug en IDataService (local vs Supabase)

```
Síntoma: Funciona en local pero no en Supabase (o viceversa)

1. Verificar qué modo está activo:
   console.log(dataService.mode) // 'local' | 'supabase'

2. En modo local:
   ├── ¿La clave en localDb coincide con la esperada? ('bodegas', 'stock', etc.)
   └── ¿El formato del dato guardado coincide con el tipo esperado?

3. En modo Supabase:
   ├── ¿El nombre de tabla coincide con TablasSchemaNuevo?
   ├── ¿La RLS permite la operación para este usuario?
   └── ¿La respuesta de Supabase tiene .error !== null?
```

### Bug en Contabilidad (partida doble)

```
Síntoma: Error "Asiento desequilibrado" o ledger_entries vacío

1. Verificar payload antes de enviar al RPC:
   console.log(JSON.stringify(payload, null, 2))
   → ¿Σ debit === Σ credit?

2. Verificar que record_ledger_transaction recibe JSONB correcto:
   → ¿Los UUIDs de account_id son válidos?
   → ¿branch_id y created_by están presentes en CADA entrada?

3. Si el RPC retorna error de permisos:
   → Verificar que la función tiene SECURITY DEFINER
   → Verificar RLS en ledger_entries
```

### Bug en Clasificación ABC

```
Síntoma: Todos los productos quedan como 'C' o la función no corre

1. ¿Hay datos en order_items de los últimos 15 días?
   SELECT COUNT(*) FROM order_items
   WHERE created_at >= now() - INTERVAL '15 days';

2. ¿La función calculate_abc_inventory existe?
   SELECT proname FROM pg_proc WHERE proname = 'calculate_abc_inventory';

3. ¿pg_cron está habilitado?
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

---

## Reglas de debugging

### Regla 1: Una hipótesis por loop

Nunca cambiar dos cosas a la vez. Si cambias A y B simultáneamente y el bug desaparece, no sabes cuál lo resolvió. Si el bug persiste, no sabes cuál no fue la causa.

```
❌ MAL: cambiar el tipo + el servicio + el store en un mismo debug loop
✅ BIEN: cambiar solo el tipo, verificar, luego el servicio si persiste
```

### Regla 2: El error exacto, no parafraseado

```markdown
❌ MAL en snapshot:
- Error: "algo con TypeScript en el inventory"

✅ BIEN en snapshot:
- Error: `Type 'string | undefined' is not assignable to type 'string'.
  ts(2322) at src/services/inventoryService.ts:54:18`
```

### Regla 3: Registrar hipótesis DESCARTADAS

Las hipótesis falsas son igualmente valiosas. Documentarlas evita probar la misma cosa dos veces:

```markdown
## Hipótesis descartadas (no volver a probar)
- ~~El problema era la clave del localStorage~~ (Loop 1: verificado que la clave es correcta)
- ~~El IDataService estaba en modo equivocado~~ (Loop 2: mode='local' confirmado)
```

### Regla 4: Reproducir antes de corregir

Si el bug no es reproducible de forma confiable, el primer loop siempre es de reproducción:

```markdown
## 🐛 DEBUG LOOP 0 — Establecer reproducción confiable

### Objetivo
Hacer que el bug ocurra de forma determinista antes de empezar a corregir.

### Pasos para reproducir
1. [paso exacto]
2. [paso exacto]
3. → El error ocurre

### Condiciones necesarias
- Estado de la BD: [datos específicos]
- Usuario autenticado: [rol necesario]
- Store pre-cargado con: [estado necesario]
```

### Regla 5: Guard obligatorio al cerrar

El debug loop no termina hasta agregar una protección contra regresión:

```typescript
// Al cerrar el bug, siempre preguntar:
// ¿Qué test habría detectado esto antes?

// Ejemplo: el bug era que registrarSalida no validaba cantidad <= 0
it('registrarSalida rechaza cantidad cero o negativa', () => {
  const result = registrarSalida({ bodegaId: 'b-1', productoId: 'p-1', cantidad: 0 });
  expect(result.error).toBe('La cantidad debe ser mayor a cero');
  expect(result.data).toBeNull();
});
```

---

## Señales de debug desordenado (detectar y corregir)

| Señal | Acción |
|-------|--------|
| Llevas 5+ loops y no tienes causa raíz | Parar, re-leer el registro global y buscar patrón común |
| El mismo error reaparece en loops distintos | El fix anterior fue un parche, no la causa raíz |
| Cambiaste más de 2 archivos en un solo loop | El experimento no es controlado, no se puede concluir nada |
| No documentaste el resultado del experimento | Completarlo antes de avanzar |
| "Ya sé cuál es el problema" sin hipótesis escrita | Escribirla antes de actuar — la intuición falla el 30% de las veces |
| Aplicaste un fix que no entiendes por qué funciona | Investigar hasta entenderlo o el bug regresará |

---

## Checklist de cierre de investigación

- [ ] Causa raíz identificada y documentada (no solo "síntoma corregido")
- [ ] Solución aplica a la causa raíz, no a los síntomas
- [ ] Test de regresión agregado que falla sin el fix
- [ ] Registro global actualizado con la causa y solución
- [ ] Hipótesis descartadas documentadas para referencia futura
- [ ] Build limpio y todos los tests pasan
- [ ] Commit con mensaje descriptivo del bug y la causa
- [ ] Si el bug expone un patrón arquitectónico débil, registrarlo como deuda técnica
