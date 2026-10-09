---
name: humanizer-refinement
description: Filtro de refinamiento natural, concisión y eliminación de lenguaje sintético/robótico de IA en documentación, micro-copy de interfaces, descripciones de PR y mensajes de error.
---

# Humanizer Refinement Skill

Esta habilidad proporciona pautas rigurosas para auditar y transformar textos generados por IA, garantizando un lenguaje natural, asertivo, técnico y desprovisto de clichés sintéticos.

---

## 1. Principios de Humanización de Texto y Copy

1. **Directo y Libre de Relleno:** Ve directo al punto sin preámbulos ceremoniosos (ej: prohibido abrir con *"A continuación, procedo a explicarte detalladamente..."*).
2. **Voz Activa y Profesional:** Usa terminología precisa de dominio empresarial/técnico (pesca, cárnicos, ferretería, contabilidad, ERP).
3. **Micro-Copy Humano en Interfaces:**
   - En lugar de *"La operación de guardado ha sido ejecutada de manera exitosa en la base de datos"* -> *"Cambios guardados correctamente"*.
   - En lugar de *"Ha ocurrido un error inesperado de tipo 500 al procesar la solicitud"* -> *"No pudimos conectar con el servidor. Reintentando..."*.
4. **Claridad en Mensajes de Validación:** Explica con exactitud qué falta y cómo solucionarlo en una sola línea.

---

## 2. Catálogo de Clichés Prohibidos vs. Alternativas Naturales

| Cliché de IA Prohibido | Alternativa Humana / Profesional |
| :--- | :--- |
| "Cabe destacar que..." / "Es importante mencionar que..." | [Eliminar y afirmar directamente el hecho] |
| "En conclusión / En resumen, podemos decir..." | "Conclusión:" o [Iniciar el cierre de forma directa] |
| "Sumérgete en un mundo de posibilidades..." | "Explora las funciones de..." |
| "Como asistente de IA / Como modelo de lenguaje..." | [Prohibido totalmente] |
| "Un tapiz de funcionalidades robustas y fluidas..." | "Conjunto de herramientas modulares..." |
| "A continuación se presenta el desglose exhaustivo..." | "Estructura del módulo:" |

---

## 3. Guía de Aplicación en Código y Commits

### Mensajes de Commit Convencionales Claros:
- **Malo (Sintético):** `feat: se procedió a la implementación de la lógica correspondiente al cálculo del margen`
- **Bueno (Humanizado):** `feat(pricing): add dynamic margin calculation with volume tiers`

### Comentarios de Código:
- Comenta **el porqué** de decisiones no evidentes (ej: tolerancias de conversión de peso o workaround de concurrencia), no **el qué** trivial (`// suma a y b`).

---

## 4. Invocación

Invoca esta habilidad mediante el comando slash:
```bash
/humanize <archivo_o_texto> [--target ui|docs|commit|error_messages]
```
