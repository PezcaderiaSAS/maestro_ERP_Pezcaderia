Ejecutar la fase de especificación Spec Kit SDD v3.0 (/speckit.specify) para SPEC-042: Facturación Electrónica DIAN / Siigo API v2 & Envío de Tirilla Digital Resiliente en Maestro Pezcaderia ERP, deteniéndose tras la entrega de la especificación para revisión del usuario sin generar código de producción.

Integrity mode: development

## Requirements

### R1. Especificación formal Spec Kit SDD v3.0 y Diagramas de Ingeniería
Elaborar la especificación formal EARS en `specs/042-facturacion-electronica-dian/spec.md`, el checklist de calidad, el plan técnico (`plan.md`) y el desglose de tareas atómicas (`tasks.md`). Incluir obligatoriamente los 5 diagramas de ingeniería Mermaid: Flujo de Procesos (`1_process_flowcharts`), Lógica de Decisión con bifurcaciones (`2_decision_logic_diagrams`), Modelo Entidad-Relación (`3_entity_relationship_diagrams`), Secuencia Temporal (`4_sequence_diagrams`) y Arquitectura de Componentes por capas (`5_component_architecture_diagrams`).

### R2. Contratos Zod para DIAN y Siigo API v2
Especificar los esquemas y validaciones estrictas con Zod para los contratos y payloads de emisión electrónica DIAN y Siigo API v2, incluyendo reglas tributarias colombianas (impuestos, retenciones), generación y validación de CUFE (SHA-384) y formato del código QR.

### R3. Arquitectura del Dispatcher Outbox en IndexedDB
Diseñar la arquitectura del despachador outbox persistente en IndexedDB para garantizar facturación offline resiliente, soporte de contingencia DIAN (tipo 03/04), sincronización automática al restablecer conectividad e idempotencia mediante hash SHA-256 de cada documento.

### R4. Formatos de Tirilla Térmica y Visor Digital
Definir los requerimientos de diseño y renderizado para tirillas térmicas en anchos estándar de 80mm y 58mm conforme a los requisitos legales de factura electrónica, así como la interfaz del visor digital y mecanismo de envío/compartido por WhatsApp y correo electrónico.

### R5. Infraestructura y Restricciones de Red
Todas las pruebas, simulaciones y validaciones de comunicación con DIAN y Siigo API v2 deben ejecutarse de manera desacoplada y puramente offline/mockeada a nivel local, sin requerir llamadas externas a servicios en red y respetando límites Kanban WIP = 1 a costo $0.

## Verification Resources
- Especificaciones técnicas y anexos técnicos de Facturación Electrónica DIAN (Anexo 1.9) y documentación de Siigo API v2.
- Vectores de prueba sintéticos para validación de CUFE, código QR y esquemas Zod en Vitest.

## Acceptance Criteria

### Artefactos de Especificación SDD
- [ ] El directorio `specs/042-facturacion-electronica-dian/` contiene `spec.md` redactado con sintaxis formal EARS (Event-Driven, Ubiquitous, State-Driven, Unwanted Behavior, Optional Features).
- [ ] Se encuentran documentados e integrados los 5 diagramas de ingeniería Mermaid sintácticamente válidos (Flujo de Procesos, Lógica de Decisión, ERD, Secuencia y Arquitectura de Componentes).
- [ ] Se incluye la lista de verificación de calidad (`checklist.md`), el plan técnico por capas desacopladas (`plan.md`) y el desglose de tareas atómicas (`tasks.md`).
- [ ] No se genera código fuente de producción en `src/` durante esta fase, deteniendo la ejecución tras completar los artefactos de especificación para aprobación humana.

### Especificación de Contratos y Arquitectura
- [ ] Los esquemas Zod especificados cubren la estructura requerida para factura electrónica DIAN y Siigo API v2, detallando campos obligatorios, tipos y cálculo determinista de CUFE y QR.
- [ ] El flujo del Dispatcher Outbox en IndexedDB especifica el ciclo de vida de los estados (pendiente, transmitido, contingencia, error), reintentos con backoff exponencial e idempotencia SHA-256.
- [ ] La especificación de tirilla térmica define la estructura de maquetación compatible para 80mm y 58mm y el enlace de visualización digital para WhatsApp y email.
- [ ] Las dependencias y pruebas propuestas operan 100% de manera offline/simulada con datos mock sintéticos sin dependencias de red externas.
