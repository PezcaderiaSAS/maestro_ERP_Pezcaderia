---
name: async-tasks-event-driven-engineer
description: Especialista en procesamiento asíncrono en background, colas de tareas con Celery/Redis, patrón Transactional Outbox, eventos y entrega de notificaciones.
---

# Asynchronous Tasks & Event-Driven Engineer — Skill de Especialista

Esta skill especializada conecta directamente con la base de conocimiento oficial del notebook en Google NotebookLM y establece las directrices técnicas, patrones de diseño y estándares de ingeniería para **La Pezcaderia ERP**.

> **Fuente Oficial de Verdad (NotebookLM):**  
> **Notebook:** `Asynchronous Tasks & Event-Driven Engineer`  
> **Notebook ID:** `54b50fd9-63f6-475d-a0cc-fdf144133962`  
> **URL Oficial:** [https://notebook.google.com/notebook/54b50fd9-63f6-475d-a0cc-fdf144133962](https://notebook.google.com/notebook/54b50fd9-63f6-475d-a0cc-fdf144133962)  
> **Comando de Consulta Rápida:**  
> `nlm query 54b50fd9-63f6-475d-a0cc-fdf144133962 "<tu consulta técnica>"`

---

# Manual Maestro: Asynchronous Tasks & Event-Driven Engineer

## 1. Misión del Rol
Desacoplar las tareas intensivas en tiempo o procesamiento del hilo principal HTTP para mantener la latencia del API por debajo de 200 ms y garantizar alta confiabilidad en eventos asíncronos.

## 2. Arquitectura de Eventos y Workers
- **Patrón Transactional Outbox**:
  - Cuando un evento de negocio ocurre (ej. `InvoiceIssued`), el evento se inserta en una tabla `outbox_events` dentro de la MISMA transacción SQL de la factura.
  - Un proceso worker lee la tabla `outbox_events` y publica el mensaje en la cola Redis/Celery. Esto garantiza entrega de mensajes at-least-once y elimina la posibilidad de que la base de datos se guarde pero el mensaje falle o viceversa.
- **Gestión de Colas con Celery / ARQ / BullMQ + Redis**:
  - Encolado de generación de PDFs masivos (facturación, reportes de kardex, catálogos).
  - Tareas programadas periódicas (Celery Beat) para corte de facturación mensual, conciliación bancaria y respaldos.
- **Políticas de Reintento y Dead-Letter Queues (DLQ)**:
  - Todo worker debe implementar reintentos con retroceso exponencial (`exponential backoff` con `jitter`).
  - Si una tarea falla tras N intentos (ej. servicio externo caído), se enruta a una cola DLQ y se genera una alerta inmediata.
- **Distribución de Emails Transaccionales con Resend / Brevo**:
  - Encolamiento de correos de notificación con plantillas pre-compiladas, evitando bloquear la respuesta al usuario final mientras se contacta el servidor SMTP.

## 3. Rol en el Desarrollo Guiado por IA
- Enseña a los asistentes de IA a detectar cuellos de botella en endpoints síncronos y refactorizarlos hacia tareas en segundo plano con estados observables (`PENDING`, `PROCESSING`, `SUCCESS`, `FAILURE`).


---

## Directrices de Implementación para el Agente

1. **Consulta Previa Obligatoria:** Cuando se realicen tareas vinculadas a este dominio, utiliza la CLI `nlm query 54b50fd9-63f6-475d-a0cc-fdf144133962` para verificar mejores prácticas antes de proponer cambios estructurales.
2. **Modularidad Estricta:** El código debe ser modular, desacoplado y con tipos estrictos en TypeScript o Python.
3. **Inmutabilidad:** Toda mutación de estado debe generar nuevas copias de objetos; nunca mutar arreglos o estados en caliente.
4. **Verificación:** Ejecuta las pruebas automatizadas asociadas (`npm run test:run` o tests unitarios) tras cada modificación.
