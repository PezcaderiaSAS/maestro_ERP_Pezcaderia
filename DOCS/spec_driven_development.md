# Spec Driven Development (SDD): MaestroPescadería ERP

## ¿Qué es SDD y por qué lo usamos?

**Spec Driven Development** es la metodología de desarrollo del proyecto MaestroPescadería. Su principio fundamental es simple: **la especificación (SPEC) precede siempre al código**.

En lugar de pedirle a la IA que "construya el módulo de POS", le pedimos que **ejecute el SPEC_POS.md**. La diferencia es crítica: la IA no inventa la arquitectura, no alucina reglas de negocio y no rompe la coherencia sistémica. El SPEC ya tomó todas esas decisiones.

---

## El Problema que resuelve

Sin SDD, un agente de IA en cada conversación:
1. Reinventa la arquitectura del módulo con variaciones impredecibles.
2. "Alucina" reglas de negocio que no existen o ignora las que sí existen.
3. Genera código inconsistente con el resto del sistema.
4. Pierde el contexto al cambiar de hilo conversacional.

Con SDD, el contexto está **persistido en documentos**, no en la memoria del modelo.

---

## Los Tres Pilares del SDD en este Proyecto

```
┌─────────────────────────────────────────────────┐
│           SPEC DRIVEN DEVELOPMENT               │
│                                                 │
│  1. SYSTEM DESIGN      2. BUSINESS RULES        │
│  (system_design.md)    (business_rules.md)      │
│         │                      │                │
│         └──────────┬───────────┘                │
│                    ▼                            │
│              SPEC_[MODULO].md                   │
│         (Input determinante para la IA)         │
│                    │                            │
│                    ▼                            │
│           CÓDIGO GENERADO + TESTS               │
└─────────────────────────────────────────────────┘
```

### Pilar 1: System Design (`DOCS/system_design.md`)
Define los límites de cada módulo: qué hace, qué no hace, qué datos consume y qué datos produce. Es el mapa que impide que la IA mezcle responsabilidades entre módulos.

### Pilar 2: Business Rules (`DOCS/business_rules.md`)
Las "Tablas de la Verdad". Reglas de negocio inmutables documentadas en pseudocódigo. La IA **debe consultarlas** antes de implementar cualquier lógica que afecte inventario, facturación, pedidos o caja.

### Pilar 3: SPEC del Módulo (`DOCS/SPECS/SPEC_[MODULO].md`)
El documento que integra todo: contrato de datos (tipos), dominio (pseudocódigo de lógica), plan de refactoring y criterios de validación (tests).

---

## Flujo de Trabajo Obligatorio

```
NUEVA FEATURE / MÓDULO
        │
        ▼
¿Existe SPEC aprobado? ──── NO ──► Crear SPEC con skill_crear_spec.md
        │                                        │
       SÍ                                        ▼
        │                          Revisión y aprobación del SPEC
        ▼                                        │
Referenciar SPEC en la                          ▼
conversación con @DOCS/SPECS/SPEC_X.md ◄────────┘
        │
        ▼
Instruir a Antigravity para implementar
siguiendo el SPEC (no inventar arquitectura)
        │
        ▼
Antigravity implementa + escribe tests
        │
        ▼
Ejecutar tests → pasar criterios de validación del SPEC
        │
        ▼
Actualizar estado del SPEC: BORRADOR → APROBADO → IMPLEMENTADO
```

---

## Cómo Iniciar una Conversación Correctamente

### ✅ CORRECTO
```
@DOCS/AI_RULES.md @DOCS/SPECS/SPEC_POS.md

Implementa la Fase 1 del refactoring del módulo POS según el SPEC.
Extrae el componente ProductGrid siguiendo el contrato de datos definido.
```

### ❌ INCORRECTO
```
Refactoriza el módulo POS y hazlo más limpio y modular.
```

---

## Estructura de Carpetas SDD

```
DOCS/
├── AI_RULES.md                    ← Reglas de IA (adjuntar en cada conversación)
├── spec_driven_development.md     ← Este archivo (guía del proceso)
├── system_design.md               ← Arquitectura de módulos
├── business_rules.md              ← Tablas de la Verdad
├── SPECS/
│   ├── SPEC_TEMPLATE.md           ← Plantilla para nuevos SPECs
│   ├── SPEC_POS.md                ← Módulo 1: POS ✅
│   ├── SPEC_B2B.md                ← Módulo 2: Ventas B2B (Por crear)
│   ├── SPEC_INVENTORY.md          ← Módulo 3: Inventario y WMS ✅
│   ├── SPEC_PURCHASES.md          ← Módulo 4: Compras (Por crear)
│   ├── SPEC_EXPENSES.md           ← Módulo 5: Gastos (Por crear)
│   ├── SPEC_PRODUCTION.md         ← Módulo 6: Producción (Por crear)
│   ├── SPEC_BILLING.md            ← Módulo 7: Facturación / Historial (Por crear)
│   ├── SPEC_RRHH_NOMINA.md        ← Módulo 8: RRHH y Nómina ✅
│   ├── SPEC_LOGISTICS.md          ← Módulo 9: Logística (Por crear)
│   ├── SPEC_REPORTS.md            ← Módulo 10: Informes (Por crear)
│   ├── SPEC_CASHFLOW.md           ← Módulo 11: Cajas y Flujo de Caja (Por crear)
│   ├── SPEC_CLIENTS.md            ← Módulo 12: Clientes y Cartera (Por crear)
│   ├── SPEC_CRM.md                ← Módulo 13: CRM (Por crear)
│   └── SPEC_TESTING.md            ← Guía de Vitest para el proyecto ✅
└── SKILLS/
    ├── skill_crear_spec.md        ← Cómo redactar un SPEC
    ├── skill_crear_servicio.md    ← Cómo crear un servicio de datos
    └── skill_crear_componente.md  ← Cómo crear un componente React
```

---

## Estados de un SPEC

| Estado | Descripción |
|---|---|
| `BORRADOR` | En redacción, aún no revisado |
| `EN REVISIÓN` | Listo para revisión del equipo |
| `APROBADO` | Aprobado, listo para implementar |
| `IMPLEMENTADO` | Código generado y tests pasando |
| `DEPRECADO` | Reemplazado por otro SPEC |

---

## Regla de Oro

> **La IA implementa. El SPEC decide.**
>
> Nunca le pidas a la IA que diseñe la arquitectura de un módulo en una conversación. Eso es trabajo del SPEC. Una vez que el SPEC está aprobado, la IA es extremadamente eficiente ejecutándolo.
