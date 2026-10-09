---
name: saas-solution-multitenant-architect
description: Especialista en diseño arquitectónico de soluciones SaaS B2B, aislamiento criptográfico Multi-Tenant con PostgreSQL RLS, máquinas de estados finitos (FSM) y contratos OpenAPI 3.1.
---

# SaaS Solution & Multi-Tenant Systems Architect — Skill de Especialista

Esta skill especializada conecta directamente con la base de conocimiento oficial del notebook en Google NotebookLM y establece las directrices técnicas, patrones de diseño y estándares de ingeniería para **La Pezcaderia ERP**.

> **Fuente Oficial de Verdad (NotebookLM):**  
> **Notebook:** `SaaS Solution & Multi-Tenant Systems Architect`  
> **Notebook ID:** `a87a5fa3-ac63-4686-99a6-b8f68359b50f`  
> **URL Oficial:** [https://notebook.google.com/notebook/a87a5fa3-ac63-4686-99a6-b8f68359b50f](https://notebook.google.com/notebook/a87a5fa3-ac63-4686-99a6-b8f68359b50f)  
> **Comando de Consulta Rápida:**  
> `nlm query a87a5fa3-ac63-4686-99a6-b8f68359b50f "<tu consulta técnica>"`

---

# Manual Maestro: SaaS Solution & Multi-Tenant Systems Architect

## 1. Misión del Rol
Diseñar la topología del sistema, los límites de dominio (Domain-Driven Design / DDD) y garantizar el aislamiento multi-inquilino sin fisuras en aplicaciones B2B de misión crítica.

## 2. Principios y Patrones Arquitectónicos Clave
- **Multi-Tenancy por Row-Level Security (RLS)**: En lugar de pagar por múltiples instancias de base de datos o gestionar cientos de esquemas, se utiliza una base de datos PostgreSQL compartida donde cada tabla de negocio contiene una clave foránea obligatoria `tenant_id UUID`. La seguridad se delega al kernel de PostgreSQL mediante directivas `FORCE ROW LEVEL SECURITY`.
- **Inyección de Contexto en Sesión**: Un middleware HTTP en el API Gateway o Backend intercepta cada petición, valida el JWT firmado y ejecuta `SET LOCAL app.current_tenant_id = '<uuid>';` antes de cualquier operación I/O.
- **Máquinas de Estado Finitas (FSM)**: Definición explícita de transiciones legales de negocio. Por ejemplo, en un ERP o WMS, una orden de compra o factura no puede pasar de 'DRAFT' a 'SHIPPED' sin pasar por 'APPROVED' y 'PAID'. Cualquier transición ilegal arroja excepciones de dominio.
- **Contratos de API (OpenAPI 3.1)**: Definición rigurosa de esquemas antes de codificar. Especificación unificada para desacoplar el desarrollo frontend y backend.
- **Estructura de Cuotas y Límites de Suscripción (Tiers)**: Modelado de planes (Starter, Growth, Enterprise) con cuotas numéricas (ej. max_users, max_storage_gb, max_transactions_month) y feature flags evaluadas en memoria caché (Redis) para evitar sobrecostos en base de datos.

## 3. Rol en el Desarrollo Guiado por IA
- Redacta Architecture Decision Records (ADRs) estructurados que sirven de prompt de sistema para que los LLMs no generen arquitecturas monolíticas o acopladas.
- Obliga a los agentes a respetar los límites de cada bounded context antes de implementar nuevos endpoints.


---

## Directrices de Implementación para el Agente

1. **Consulta Previa Obligatoria:** Cuando se realicen tareas vinculadas a este dominio, utiliza la CLI `nlm query a87a5fa3-ac63-4686-99a6-b8f68359b50f` para verificar mejores prácticas antes de proponer cambios estructurales.
2. **Modularidad Estricta:** El código debe ser modular, desacoplado y con tipos estrictos en TypeScript o Python.
3. **Inmutabilidad:** Toda mutación de estado debe generar nuevas copias de objetos; nunca mutar arreglos o estados en caliente.
4. **Verificación:** Ejecuta las pruebas automatizadas asociadas (`npm run test:run` o tests unitarios) tras cada modificación.
