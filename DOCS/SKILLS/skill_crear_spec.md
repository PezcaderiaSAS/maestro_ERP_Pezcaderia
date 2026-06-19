# Skill: Cómo Redactar un SPEC

> **USO**: Adjunta este archivo cuando necesites que Antigravity te ayude a redactar un nuevo SPEC.
> Comando: `@DOCS/AI_RULES.md @DOCS/SKILLS/skill_crear_spec.md Redacta el SPEC para el módulo [X]`

---

## Qué es un SPEC y cuándo crearlo

Un SPEC (Specification Document) debe crearse **antes** de iniciar cualquier:
- Feature nueva de un módulo existente
- Módulo completamente nuevo
- Refactoring mayor de un archivo (> 50 líneas cambian)
- Integración con sistema externo (Siigo, Twenty CRM, etc.)

**No se necesita SPEC para:**
- Corrección de bugs pequeños (< 10 líneas)
- Cambios de estilo/UI sin lógica de negocio
- Actualización de documentación

---

## Proceso para Redactar un SPEC

### Paso 1: Identificar el módulo y su función
Responde estas preguntas antes de escribir una sola línea:
1. ¿Quién usa este módulo? (rol del usuario)
2. ¿Qué problema de negocio resuelve?
3. ¿Qué datos consume y qué datos produce?
4. ¿Qué reglas de negocio de `business_rules.md` aplican?

### Paso 2: Usar el SPEC_TEMPLATE.md
```
1. Copiar DOCS/SPECS/SPEC_TEMPLATE.md
2. Renombrar como SPEC_[NOMBRE_MODULO].md (SCREAMING_SNAKE_CASE)
3. Completar TODAS las secciones (no dejar ninguna vacía)
4. Cambiar estado a: BORRADOR
```

### Paso 3: Definir los tipos TypeScript PRIMERO
Los tipos son la base del SPEC. Deben estar definidos antes de escribir cualquier regla de dominio. Si no puedes definir los tipos, el módulo no está suficientemente entendido.

### Paso 4: Escribir las reglas en pseudocódigo
Usar el formato:
```
DADO [estado inicial / condición de entrada]
CUANDO [acción del usuario o del sistema]
ENTONCES [resultado, efectos secundarios, mensajes de error]
```

### Paso 5: Definir el plan de refactoring (si aplica)
Si el módulo tiene un archivo > 100 líneas que será modificado, definir:
- Componentes a extraer (con sus responsabilidades)
- Orden de extracción (del más simple al más complejo)

### Paso 6: Definir los tests
Mínimo 3 tests de éxito y 2 tests de error por cada regla de negocio crítica.

### Paso 7: Cambiar estado a APROBADO
Solo cuando el SPEC esté completo y revisado, cambiar `Estado: BORRADOR` a `Estado: APROBADO`. Solo un SPEC en estado APROBADO puede ser enviado a implementación.

---

## Anti-patrones a Evitar

| ❌ Mal | ✅ Bien |
|---|---|
| "El sistema debe ser rápido" | "La búsqueda en catálogo debe responder en < 200ms con 500 productos" |
| "Manejar errores correctamente" | "Si SKU duplicado → BLOQUEADO, mostrar 'SKU duplicado: {sku}'" |
| Tipos como `any` o genéricos sin restricción | Interfaces específicas con todos los campos tipados |
| Dejar secciones en blanco | Escribir "N/A — justificación" si no aplica |
| SPEC de 5 líneas | SPEC que cubre todos los casos de uso y error |
