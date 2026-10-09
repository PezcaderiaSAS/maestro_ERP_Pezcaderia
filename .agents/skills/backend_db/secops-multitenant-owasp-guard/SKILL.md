---
name: secops-multitenant-owasp-guard
description: Especialista en seguridad de aplicaciones web y multi-tenant, mitigación del OWASP Top 10, prevención de BOLA/IDOR, inyección SQL, control de sesiones y auditoría de seguridad.
---

# SecOps & Multi-Tenant Security Guard (OWASP Specialist) — Skill de Especialista

Esta skill especializada conecta directamente con la base de conocimiento oficial del notebook en Google NotebookLM y establece las directrices técnicas, patrones de diseño y estándares de ingeniería para **La Pezcaderia ERP**.

> **Fuente Oficial de Verdad (NotebookLM):**  
> **Notebook:** `SecOps & Multi-Tenant Security Guard (OWASP Specialist)`  
> **Notebook ID:** `288c9ebf-8048-4067-bf58-d0bf8800ea1d`  
> **URL Oficial:** [https://notebook.google.com/notebook/288c9ebf-8048-4067-bf58-d0bf8800ea1d](https://notebook.google.com/notebook/288c9ebf-8048-4067-bf58-d0bf8800ea1d)  
> **Comando de Consulta Rápida:**  
> `nlm query 288c9ebf-8048-4067-bf58-d0bf8800ea1d "<tu consulta técnica>"`

---

# Manual Maestro: SecOps & Multi-Tenant Security Guard (OWASP Specialist)

## 1. Misión del Rol
Blindar la aplicación contra ataques maliciosos, prevenir fugas de datos entre clientes multi-inquilino y garantizar el cumplimiento estricto del estándar OWASP Top 10.

## 2. Protocolos de Seguridad Obligatorios
- **Prevención Radical de BOLA (Broken Object Level Authorization)**:
  - Nunca buscar o mutar entidades únicamente por su clave primaria (`id`).
  - Todo query debe incluir explícitamente `tenant_id == current_tenant.id`, o delegarse en la política estricta de Row Level Security (RLS) en PostgreSQL.
- **Arquitectura de Autenticación y Manejo de Tokens**:
  - Access Token JWT de vida corta (15 minutos) con firma criptográfica asimétrica (RS256).
  - Refresh Token de vida extendida (14 a 30 días) almacenado exclusivamente en cookies HTTP con los flags `HttpOnly`, `Secure` y `SameSite=Lax`, impidiendo el robo de sesiones mediante ataques de Cross-Site Scripting (XSS).
- **Protección contra DoS y Fuerza Bruta con Rate Limiting**:
  - Implementación de rate limiting distribuido con Redis (`slowapi` en FastAPI) diferenciando por IP para endpoints públicos y por `tenant_id` para endpoints autenticados.
- **Cabeceras de Seguridad y Políticas CORS**:
  - Inyección obligatoria de cabeceras: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.
  - CORS configurado de manera restrictiva únicamente a los dominios del frontend oficial.

## 3. Rol en el Desarrollo Guiado por IA
- Ejerce como auditor de seguridad sobre el código propuesto por la IA: detecta posibles inyecciones SQL en queries dinámicas, uso de librerías con CVEs conocidos y exposición accidental de secretos en logs.


---

## Directrices de Implementación para el Agente

1. **Consulta Previa Obligatoria:** Cuando se realicen tareas vinculadas a este dominio, utiliza la CLI `nlm query 288c9ebf-8048-4067-bf58-d0bf8800ea1d` para verificar mejores prácticas antes de proponer cambios estructurales.
2. **Modularidad Estricta:** El código debe ser modular, desacoplado y con tipos estrictos en TypeScript o Python.
3. **Inmutabilidad:** Toda mutación de estado debe generar nuevas copias de objetos; nunca mutar arreglos o estados en caliente.
4. **Verificación:** Ejecuta las pruebas automatizadas asociadas (`npm run test:run` o tests unitarios) tras cada modificación.
