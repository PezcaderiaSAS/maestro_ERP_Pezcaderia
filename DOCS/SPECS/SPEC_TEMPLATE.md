# SPEC TEMPLATE: Plantilla Estándar de Especificación

> **INSTRUCCIONES**: Copia este archivo, renómbralo como `SPEC_[MODULO].md` y completa cada sección. No dejes secciones en blanco. Si una sección no aplica, escribe "N/A" con una justificación.
>
> **SKILL**: Usa `DOCS/SKILLS/skill_crear_spec.md` si necesitas ayuda para completar este documento.

---

# SPEC-[ID]: [Nombre del Módulo / Feature]

**Versión:** 1.0
**Fecha:** YYYY-MM-DD
**Estado:** `BORRADOR` | `EN REVISIÓN` | `APROBADO` | `IMPLEMENTADO` | `DEPRECADO`
**Autor:** [Nombre]
**Relacionado con SPEC:** [SPEC-ID previo si aplica]

---

## Resumen Ejecutivo

*2-3 oraciones describiendo qué hace este módulo, quién lo usa y cuál es su valor de negocio.*

---

## 1. Contrato de Datos

### 1.1 Tipos TypeScript

```typescript
// Definir aquí TODOS los tipos/interfaces del módulo.
// Estos serán la fuente de verdad para el código.

interface [NombreEntidad] {
  id: string;
  // ... campos
}
```

### 1.2 Input (Datos que recibe)
*¿Qué datos recibe este módulo para operar? ¿De dónde vienen?*

| Campo | Tipo | Fuente | Obligatorio |
|---|---|---|---|
| `campo1` | `string` | `localDb('clave')` | Sí |

### 1.3 Output (Datos que produce)
*¿Qué datos genera o modifica este módulo?*

| Campo | Tipo | Destino | Cuándo |
|---|---|---|---|
| `campo1` | `string` | `localDb('clave')` | Al confirmar acción X |

---

## 2. Dominio (Reglas de Negocio aplicables)

*Lista las reglas de `business_rules.md` que aplican a este módulo. Describe en pseudocódigo las reglas adicionales específicas de esta feature.*

**Reglas heredadas de `business_rules.md`:**
- `RN-XX` — [Descripción corta]
- `RN-XX` — [Descripción corta]

**Reglas específicas de este SPEC:**
```
DADO [condición de entrada]
CUANDO [acción del usuario o del sistema]
ENTONCES [resultado esperado, incluyendo estados y efectos secundarios]
```

---

## 3. Flujo de la Feature

*Describe el flujo paso a paso. Puede ser un diagrama de secuencia o una lista numerada.*

```
Paso 1: [Acción del usuario]
Paso 2: [Validación del sistema]
  → ÉXITO: [qué pasa]
  → ERROR: [qué pasa, qué mensaje se muestra]
Paso 3: [Resultado final]
```

---

## 4. Plan de Refactoring (Componentes)

*Aplicar SOLO si el módulo tiene un archivo monolítico. Define cómo se divide.*

### Archivo actual
`src/views/[Modulo]View.tsx` — [tamaño] KB

### Estructura objetivo
```
src/views/[modulo]/
├── [Modulo]View.tsx          ← Orquestador principal (< 200 líneas)
├── components/
│   ├── [Componente1].tsx     ← [Responsabilidad]
│   ├── [Componente2].tsx     ← [Responsabilidad]
│   └── [Componente3].tsx     ← [Responsabilidad]
└── hooks/
    └── use[Modulo].ts        ← Estado y lógica del módulo
src/services/
└── [modulo]Service.ts        ← Lógica de negocio (sin JSX)
src/types/
└── [modulo].types.ts         ← Tipos del módulo
```

### Orden de extracción
1. Extraer tipos → `[modulo].types.ts`
2. Extraer lógica de negocio → `[modulo]Service.ts`
3. Extraer sub-componentes más simples primero
4. Extraer hooks de estado
5. Simplificar `[Modulo]View.tsx` a orquestador

---

## 5. Criterios de Validación (Tests)

### 5.1 Casos de Éxito (Happy Path)

| ID Test | Escenario | Datos de entrada | Resultado esperado |
|---|---|---|---|
| T-[ID]-01 | [Escenario normal] | [Datos] | [Resultado] |

### 5.2 Casos de Error (Edge Cases)

| ID Test | Escenario | Datos de entrada | Resultado esperado |
|---|---|---|---|
| T-[ID]-E01 | [Caso de error] | [Datos inválidos] | [Error + mensaje] |

### 5.3 Casos de Carga / Stress

| ID Test | Escenario | Datos de entrada | Resultado esperado |
|---|---|---|---|
| T-[ID]-S01 | [Escenario con volumen alto] | [Muchos datos] | [Sin degradación] |

---

## 6. Dependencias

| Tipo | Nombre | Versión | Propósito |
|---|---|---|---|
| Librería | `react` | `^18.2.0` | UI |
| Servicio interno | `localDb.ts` | — | Persistencia |
| Módulo ERP | `inventoryService` | — | Consultar stock |

---

## 7. Notas de Implementación

*Decisiones técnicas, advertencias, restricciones conocidas o consideraciones especiales.*

- [Nota 1]
- [Nota 2]
