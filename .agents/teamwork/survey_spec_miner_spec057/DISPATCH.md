# Dispatch: Spec Miner SPEC-057

## Objective
Thoroughly extract and analyze all requirements, architectural constraints, business logic, acceptance criteria, and task definitions from SPEC-057 for the POS Frontend Refactoring Plan.

## Authoritative Inputs to Read
- `specs/spec_057_pos_integral_refactor_frontend.md`
- `specs/spec_057_plan_checklist.md`
- `.agents/teamwork/ORIGINAL_REQUEST.md`

## Instructions
1. Analyze all 6 Requirements (R1 to R6) and 6 Tasks (Tarea 1 to Tarea 6).
2. Pay special attention to Tarea 1: Fila de Carrito con Navegación [Tab] y Edición en Línea, micro-button [+ Desc], flexbox vertical estricto (85% espacio para ítems) y suite TDD en `src/tests/posCartEditableRow.test.tsx`.
3. Detail data schemas, state structures (Zustand), props interfaces, business rules (e.g., commercial validation: discount > 10% or proposed price < base cost + 15% requires supervisor PIN), keyboard shortcuts, weight trigger, and 18-card pagination virtualizing.
4. Document all findings in your state folder at `.agents/teamwork/survey_spec_miner_spec057/handoff.md`.


## 2026-11-08T14:25:07Z
Eres el agente Spec Miner para SPEC-057 (Plan Integral de Refactorización y Desarrollo Frontend: Interfaz POS — La Pezcadería S.A.S. bajo metodología SDD v3.0).

Tu directorio de trabajo: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia
Tu carpeta de estado: c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\survey_spec_miner_spec057

Archivos a consultar obligatoriamente:
1. `c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `specs/spec_057_pos_integral_refactor_frontend.md`
3. `specs/spec_057_plan_checklist.md`
4. `.agents/teamwork/survey_spec_miner_spec057/DISPATCH.md`

Objetivo de la misión:
Extraer de manera exhaustiva todos los requerimientos, contratos de interfaz, reglas de negocio, modelos de datos y criterios de aceptación definidos para las 6 Tareas (R1 a R6).
Presta especial atención a la Tarea 1:
- Fila de Carrito con Navegación [Tab] y Edición en Línea de Cantidad y Precio Unitario
- Botón micro [+ Desc] para descuento por ítem
- Flexbox vertical estricto (85% espacio para ítems)
- Especificación de la suite TDD `src/tests/posCartEditableRow.test.tsx`

También extrae detalles para R2 (Descuento Global F4 [% / $] y recálculo <10ms en Zustand), R3 (Modal pesaje manual táctil `ManualWeightModal`), R4 (Atajos globales F8, Ctrl+K, F6, F2, F9, Esc), R5 (Control comercial: PIN supervisor si descuento > 10% o precio < costo + 15%), y R6 (Paginación 18 tarjetas 6x3 <16ms y quality gate).

Escribe tu reporte estructurado en `.agents/teamwork/survey_spec_miner_spec057/handoff.md` con:
- Observation (hallazgos clave de las especificaciones)
- Requirements Breakdown (R1 a R6 desglosados en detalle con criterios de aceptación exactos)
- Logic Chain & Architectural Dependencies
- Caveats & Edge Cases
- Conclusion & Recommendations for Decomposition into Milestones
- Verification Criteria

Notifica a tu orquestador mediante send_message cuando completes tu reporte.
