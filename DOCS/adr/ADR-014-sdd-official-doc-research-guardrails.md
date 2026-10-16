# ADR-014: Gobernanza Automatizada e Investigación de Documentación Oficial (RULE-SDD-001)

## Estado
**Aceptado y En Producción** (2026-10-16)

## Contexto
En un entorno de desarrollo guiado por especificaciones (Spec-Driven Development) con múltiples agentes de IA y flujos continuos brownfield, existía el riesgo de:
1. Alucinación de APIs y sintaxis al usar conocimiento pre-entrenado de versiones desactualizadas de librerías.
2. Desincronización ante actualizaciones de dependencias en `package.json`.
3. Ausencia de un quality gate en eventos de Git (`git pull` / `post-merge`) que audite breaking changes o vulnerabilidades de seguridad (CVEs).

## Decisión
Se implementó un sistema de gobernanza en tres capas:
1. **Regla de Gobernanza:** [`.antigravity-rules.json`](../../.antigravity-rules.json) con ID `RULE-SDD-001` (Nivel CRITICAL).
2. **Conectividad con Brave Search API:** Utilizando la clave `Brave_Search_MCP_Server_API_KEY` para búsquedas en tiempo real en repositorios y sitios oficiales.
3. **Agente Investigador Autónomo:** [`scripts/investigar_entorno.py`](../../scripts/investigar_entorno.py) que ejecuta el protocolo de 3 fases:
   - **Fase 1 (Assessment):** Compara el hash SHA256 de las dependencias actuales contra `.dependency-state.json`. Si no hay cambios, el costo es 0 ms/0 tokens.
   - **Fase 2 (Research Execution):** Búsqueda de documentación oficial, guías de migración y CVEs con Brave Search API y síntesis con Google AI Studio / Gemini 2.5 Flash Lite.
   - **Fase 3 (Enterprise Guardrails):** Generación de los 4 guardrails obligatorios (API Signature, Security/CVE, Performance/Memory, Linter Overrides) y persistencia en `specs/sdd_verification_reports/`.
4. **Hook de Git y Ciclo de Vida:**
   - `.git/hooks/post-merge`: Ejecuta automáticamente la validación cuando se detectan cambios de dependencias tras un merge o pull.
   - `scripts/lifecycle/post-pull.cjs`: Integrado como paso `[2/8]` en el comando `npm run session:pull`.

## Consecuencias
- **Positivas:**
  - 100% de cumplimiento con SDD antes de escribir código.
  - Mitigación preventiva de vulnerabilidades y breaking changes.
  - Cero costo de API cuando no hay cambios en dependencias gracias al cálculo delta y caché de estado.
  - Resiliencia mediante Degraded Safe-State si fallan las redes externas.
- **Negativas / Mitigaciones:**
  - Requiere conexión a internet para la primera auditoría o cambios de dependencias. Mitigado con fallback estructurado heurístico y reporte CRITICAL-0403 no bloqueante si no está en modo `--strict`.
