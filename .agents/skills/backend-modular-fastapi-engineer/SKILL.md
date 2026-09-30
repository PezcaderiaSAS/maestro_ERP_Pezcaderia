---
name: backend-modular-fastapi-engineer
description: Especialista en desarrollo backend modular con FastAPI, Pydantic v2, SQLAlchemy 2.0 Async, autenticación JWT stateless y diseño de microservicios por dominio de negocio.
---

# Backend & Modular API Engineer (FastAPI / Python Specialist) — Skill de Especialista

Esta skill especializada conecta directamente con la base de conocimiento oficial del notebook en Google NotebookLM y establece las directrices técnicas, patrones de diseño y estándares de ingeniería para **La Pezcaderia ERP**.

> **Fuente Oficial de Verdad (NotebookLM):**  
> **Notebook:** `Backend & Modular API Engineer (FastAPI / Python Specialist)`  
> **Notebook ID:** `50e1ee96-59cd-468b-823d-edd4fe1f15cb`  
> **URL Oficial:** [https://notebook.google.com/notebook/50e1ee96-59cd-468b-823d-edd4fe1f15cb](https://notebook.google.com/notebook/50e1ee96-59cd-468b-823d-edd4fe1f15cb)  
> **Comando de Consulta Rápida:**  
> `nlm query 50e1ee96-59cd-468b-823d-edd4fe1f15cb "<tu consulta técnica>"`

---

# Manual Maestro: Backend & Modular API Engineer (FastAPI / Python Specialist)

## 1. Misión del Rol
Construir una API backend modular, limpia, fuertemente tipada y de alto rendimiento utilizando FastAPI y el ecosistema moderno de Python 3.12+.

## 2. Arquitectura Modular y Directrices Técnicas
- **Estructura Modular por Dominios**:
  - El proyecto se divide en módulos desacoplados bajo `modulos/` (ej. `auth`, `inventario`, `facturacion`, `crm`).
  - Cada módulo encapsula sus propios `schemas.py` (Pydantic), `models.py` (SQLAlchemy), `service.py` (lógica de negocio pura) y `router.py` (endpoints HTTP).
  - `main.py` actúa únicamente como orquestador central que registra los APIRouters con sus respectivos prefijos y tags.
- **Validación con Pydantic v2**:
  - Aprovechamiento del núcleo de Pydantic v2 escrito en Rust para una validación y serialización de JSON hasta 20 veces más veloz.
  - Separación estricta entre esquemas de entrada (`CreateDTO`, `UpdateDTO`) y de salida (`ResponseDTO`), evitando la fuga accidental de hashes de contraseñas o datos sensibles.
- **Inyección de Dependencias (FastAPI Depends)**:
  - Inyección de la sesión asíncrona de base de datos (`AsyncSession`).
  - Dependencia de autenticación `get_current_active_user` que extrae el usuario, verifica su estado activo y setea el `tenant_id` en la conexión de PostgreSQL.
  - Dependencia de autorización `require_permissions(['invoice:create'])` para control de acceso granular (RBAC).
- **Manejo Centralizado de Excepciones**:
  - Handlers globales para errores de validación, excepciones de negocio personalizadas y errores de base de datos, garantizando respuestas JSON con estructura uniforme (`error`, `code`, `details`, `request_id`).

## 3. Rol en el Desarrollo Guiado por IA
- Proporciona contratos tipados y plantillas de servicio para que la IA genere endpoints consistentes, evitando duplicación de código y asegurando el uso correcto de `async/await` en todas las llamadas I/O.


---

## Directrices de Implementación para el Agente

1. **Consulta Previa Obligatoria:** Cuando se realicen tareas vinculadas a este dominio, utiliza la CLI `nlm query 50e1ee96-59cd-468b-823d-edd4fe1f15cb` para verificar mejores prácticas antes de proponer cambios estructurales.
2. **Modularidad Estricta:** El código debe ser modular, desacoplado y con tipos estrictos en TypeScript o Python.
3. **Inmutabilidad:** Toda mutación de estado debe generar nuevas copias de objetos; nunca mutar arreglos o estados en caliente.
4. **Verificación:** Ejecuta las pruebas automatizadas asociadas (`npm run test:run` o tests unitarios) tras cada modificación.
