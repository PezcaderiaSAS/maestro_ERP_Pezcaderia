---
name: loop-progress
description: >
  Ejecución de trabajo iterativo en loops controlados con documentación obligatoria
  del estado antes y después de cada iteración. Úsala cuando implementes features
  multi-paso, migraciones de datos, refactors incrementales, o cualquier tarea que
  requiera múltiples ciclos de avance. Garantiza trazabilidad completa y detecta
  regresiones entre iteraciones.
version: 1.0.0
source: local-engineering-patterns
---

# Loop Progress — Trabajo Iterativo con Snapshots de Estado

## Cuándo usar esta skill

- Implementar una feature grande dividida en pasos secuenciales
- Ejecutar migraciones de datos o esquema en etapas
- Refactors que tocan múltiples archivos en rondas
- Correcciones de errores de build o TypeScript en lote
- Cualquier tarea donde "avanzar → verificar → avanzar" se repite más de 2 veces
- Trabajo autónomo de agente donde el usuario debe poder auditar cada iteración

**Cuándo NO usar:** Cambios de un solo archivo, correcciones de una línea, o tareas que se completan en un paso.

---

## El Protocolo de Loop

Cada iteración del loop tiene una estructura fija de 5 partes:

```
╔══════════════════════════════════════════╗
║  SNAPSHOT INICIAL  (antes de actuar)     ║
╠══════════════════════════════════════════╣
║  OBJETIVO DEL LOOP  (qué se va a hacer)  ║
╠══════════════════════════════════════════╣
║  EJECUCIÓN  (los cambios reales)         ║
╠══════════════════════════════════════════╣
║  VERIFICACIÓN  (prueba del resultado)    ║
╠══════════════════════════════════════════╣
║  SNAPSHOT FINAL  (estado resultante)     ║
╚══════════════════════════════════════════╝
```

---

## Plantilla de Loop (copiar y completar en cada iteración)

```markdown
---
## 🔄 LOOP [N] de [TOTAL] — [Fecha hora]

### 📸 SNAPSHOT INICIAL
- **Estado del build:** [✅ limpio | ⚠️ N errores | ❌ roto]
- **Tests:** [✅ N pasando | ❌ N fallando | ⏭ no aplica]
- **Archivos modificados pendientes:** [lista o "ninguno"]
- **Tarea actual en el plan:** [nombre del ítem o número]
- **Bloqueos conocidos:** [descripción o "ninguno"]

### 🎯 OBJETIVO DE ESTA ITERACIÓN
> [Descripción concisa y acotada de lo que se implementará en este loop.
>  Máximo 3 objetivos por iteración — si hay más, partir en dos loops.]
1. ...
2. ...
3. ...

**Archivos que se van a tocar:**
- `ruta/archivo1.ts` — [qué se cambia]
- `ruta/archivo2.sql` — [qué se cambia]

**Fuera de alcance (no se toca en este loop):**
- [item que se hará en loop siguiente]

### ⚙️ EJECUCIÓN
[Aquí van los cambios de código, comandos ejecutados, etc.]

### ✅ VERIFICACIÓN
- [ ] `npm run build` → [resultado]
- [ ] `npx tsc --noEmit` → [resultado]
- [ ] Tests afectados → [resultado]
- [ ] Comportamiento esperado verificado → [cómo se verificó]

### 📊 SNAPSHOT FINAL
- **Estado del build:** [✅ limpio | ⚠️ N errores | ❌ roto]
- **Tests:** [✅ N pasando | ❌ N fallando]
- **Archivos modificados en este loop:** [lista final]
- **Deuda técnica generada:** [si hay algo que dejaste pendiente a propósito]
- **Próximo loop:** [qué se abordará en el siguiente]
- **Decisiones tomadas:** [cualquier decisión de diseño relevante]

---
```

---

## Registro de Progreso Global

Al inicio de una sesión de trabajo con loops, crear o actualizar este registro:

```markdown
# 📋 PROGRESO DE TAREA: [Nombre de la tarea]
**Fecha inicio:** [fecha]
**Objetivo general:** [descripción del resultado final esperado]

## Estado global
| Loop | Objetivo | Estado | Build | Tests |
|------|----------|--------|-------|-------|
| 1    | [desc]   | ✅ done | ✅    | ✅    |
| 2    | [desc]   | 🔄 en curso | ⚠️ | -  |
| 3    | [desc]   | ⏳ pendiente | -  | -  |

## Línea base (snapshot cero — antes de empezar)
- Build: [estado]
- Tests: [N pasando / N fallando]
- Archivos modificados sin commitear: [lista]
- Versión/commit de referencia: [git hash]
```

---

## Reglas de ejecución del loop

### Regla 1: Snapshot ANTES de cualquier cambio

Nunca ejecutar código sin documentar el estado inicial. Si el build está roto al inicio, documentarlo — no silenciarlo.

```markdown
### 📸 SNAPSHOT INICIAL
- Estado del build: ❌ 23 errores TypeScript
- Tests: ❌ 5 fallando (ver lista en loop anterior)
- Contexto: el loop anterior dejó archivos sin compilar
```

### Regla 2: Un loop, un objetivo acotado

Máximo 3 objetivos por iteración. Si surge algo no planificado:
- Si es **bloqueante**: pausar el loop, documentarlo como "bloqueo detectado", resolverlo y empezar loop nuevo
- Si es **no bloqueante**: registrarlo en "Deuda técnica generada" y continuar

```markdown
### 🚧 BLOQUEO DETECTADO (fuera del plan)
- **Descripción:** El tipo `Producto` en `inventory.types.ts` cambió su firma
- **Impacto:** 3 archivos del objetivo actual no compilan
- **Acción:** Resolver en este loop antes de continuar, actualizar objetivo
```

### Regla 3: Verificación no opcional

El loop **no cierra** sin verificación. No existe "parece que funciona":

```
❌ Prohibido cerrar el loop sin:
   - Resultado explícito del build
   - Estado de los tests (aunque sea "no aplica justificado")
   - Evidencia de que el comportamiento esperado ocurre
```

### Regla 4: Snapshot FINAL honesto

El snapshot final debe reflejar la realidad, incluyendo si el loop terminó con deuda:

```markdown
### 📊 SNAPSHOT FINAL
- Estado del build: ⚠️ 2 errores TypeScript (en archivos no relacionados, preexistentes)
- Deuda técnica generada: El tipo `StockDictionary` necesita refactor (lo haré en loop 4)
- Decisiones tomadas: Usé `any` temporalmente en línea 87 de warehouseService.ts
  porque el tipo correcto requiere migrar la interfaz IDataService (loop siguiente)
```

### Regla 5: Commit al cerrar cada loop exitoso

```bash
# Formato de commit para trabajo en loop
git add <archivos del loop>
git commit -m "feat(modulo): [descripción] — Loop N/TOTAL"

# Ejemplo
git commit -m "feat(inventory): agregar validación ABC en guardarProducto — Loop 2/5"
```

---

## Señales de que el loop está fuera de control

| Señal | Acción |
|-------|--------|
| El snapshot inicial es el mismo que el final del loop anterior | Verificar si se committeó, si no, hacerlo antes de continuar |
| El objetivo del loop tiene más de 5 ítems | Partir en dos loops |
| La verificación muestra más errores que el snapshot inicial | Hacer rollback del loop actual, analizar causa |
| Llevas 3+ loops sin un build limpio | Parar, hacer un loop de solo corrección de build |
| El "Próximo loop" cambió 3 veces | El plan necesita re-evaluarse |

---

## Integración con el ERP MaestroPescaderia

Para este proyecto específico, el snapshot siempre incluye:

```markdown
### 📸 SNAPSHOT INICIAL (ERP)
- **Build Vite:** [✅ | ❌ N errores]
- **TypeScript:** [✅ | ❌ N errores en src/]
- **Tablas Supabase migradas:** [última migración aplicada: NN_nombre.sql]
- **Stores afectados:** [useXxxStore — estado de carga]
- **RLS activo en tablas nuevas:** [✅ | ⚠️ pendiente]
```

---

## Checklist de cierre de sesión de loops

Al terminar una sesión de trabajo iterativo:

- [ ] Todos los loops tienen snapshot inicial Y final documentados
- [ ] El registro de progreso global está actualizado
- [ ] Los loops exitosos tienen su commit
- [ ] Los bloqueos detectados están registrados como issues o en el próximo loop
- [ ] El estado del proyecto (build, tests) está documentado para la próxima sesión
- [ ] El agente puede retomar exactamente desde el "Próximo loop" del último snapshot final
