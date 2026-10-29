# Dispatch Log

## 2026-10-29T12:35:47Z
From: 820bee89-364a-4ed8-b947-e29ff3b0737a (Sentinel / Parent)
Priority: MESSAGE_PRIORITY_HIGH

Content:
Auditar, ajustar y verificar la integridad del frontend con foco prioritario en las pantallas operativas clave (POS táctil multivendedor, Caja única de recaudo, Tablero Kanban de comandas y Catálogos de clientes/productos), eliminando desbordamientos y garantizando una experiencia de usuario premium con aplicación rigurosa de leyes de UX (Fitts, Hick, Doherty, Miller, Jakob) antes de proceder con SPEC-042.

Integrity mode: development

## Requirements
### R1. Auditoría y corrección de desbordamientos e integridad en pantallas prioritarias
Evaluar y corregir desbordamientos horizontales y fallos de maquetación en resoluciones móviles (viewport 375px) y escritorio en las pantallas operativas de máxima prioridad:
1. Pantalla de ventas multivendedor (POS táctil, barra de asesores de mostrador y emisión de preventas sin fricción).
2. Caja única de recaudo y liquidación centralizada.
3. Tablero Kanban de seguimiento a ventas y comandas en tiempo real.
4. Listas y catálogos de clientes y productos (con búsqueda instantánea y fluida).

### R2. Optimización ergonómica y aplicación de leyes de UX
Ajustar la ergonomía, densidad de información y flujos de interacción aplicando las leyes de UX:
- Ley de Fitts: dimensionar y posicionar objetivos táctiles y botones de acción principal para interacción rápida y sin errores en terminales táctiles.
- Ley de Hick: reducir la sobrecarga cognitiva simplificando opciones y jerarquía visual en preventas y recaudo.
- Ley de Doherty: asegurar tiempos de respuesta visual inmediata (<400ms feedback visual, búsquedas instantáneas en catálogos).
- Ley de Miller: organizar la información en bloques estructurados (chunks) legibles sin saturación visual.
- Ley de Jakob: respetar patrones y convenciones familiares de interfaces POS y ERP operativos.

### R3. Suite de pruebas E2E y verificación con Harness²
Diseñar y ejecutar pruebas end-to-end con harness2 e inspección de frontend para validar los flujos críticos de las pantallas prioritarias, comprobando la ausencia de excepciones o errores en la consola del navegador.

### R4. Consulta de estándares e investigación
Utilizar herramientas y documentación de investigación (Brave, Context7) y agentes especializados para contrastar patrones de diseño y estándares de interfaz aplicables al ERP.

## Acceptance Criteria
### Integridad Visual y Maquetación
- [ ] Las 4 pantallas prioritarias (POS multivendedor, Caja única, Tablero Kanban y Catálogos de clientes/productos) y demás vistas operativas se renderizan sin desbordamiento horizontal (`scrollWidth <= clientWidth`) en viewport móvil de 375px y en resoluciones de escritorio.
- [ ] La consola del navegador no registra errores (`console.error`) ni excepciones no controladas durante la navegación e interacción en las vistas auditadas.
- [ ] Los objetivos táctiles de las pantallas operativas (POS y Caja) cumplen un área mínima interactiva de al menos 44x44px conforme a la Ley de Fitts.
- [ ] La búsqueda y filtrado en listas y catálogos de clientes y productos responde de forma inmediata y fluida sin bloqueos de interfaz (Ley de Doherty).

### Validación E2E con Harness²
- [ ] Los escenarios de prueba E2E definidos para los flujos operativos de las pantallas prioritarias (emisión de preventa POS, liquidación en caja, actualización en Kanban y búsqueda en catálogos) se ejecutan con éxito mediante harness2.
- [ ] Se genera un informe verificable con los resultados de las pruebas E2E y el inventario de correcciones de interfaz aplicadas.
