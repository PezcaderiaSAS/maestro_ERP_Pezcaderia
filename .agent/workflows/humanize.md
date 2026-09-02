---
description: Audita y refina textos, documentación, mensajes de error y descripciones de PR para eliminar lenguaje robótico de IA y lograr un tono natural y profesional.
---

# Workflow: /humanize

Filtra y humaniza textos eliminando muletillas, clichés de IA y frases ceremoniosas innecesarias.

## Argumentos:
```bash
/humanize <archivo_o_texto> [--target ui|docs|commit|error_messages]
```

## Fases de Ejecución:
1. **Detección de Clichés:** Escanea en busca de frases prohibidas ("Cabe destacar", "En conclusión", "Como modelo de IA").
2. **Refinamiento Directo:** Reescribe el contenido con voz activa y vocabulario de negocio.
3. **Validación de Claridad:** Asegura que los mensajes sean breves y accionables.

Consulta `.agents/skills/humanizer-refinement/SKILL.md` para la guía completa.
