import os
import json
from pathlib import Path

SKILLS_DIR = Path(r"c:\Users\USUARIO\Documents\Aplicaciones\maestr_pezca\.agents\skills")

SKILL_DEFINITIONS = [
    {
        "dir_name": "frontend-spa-vite-zustand",
        "title": "Frontend SPA: React 18, Vite & Zustand State Architecture",
        "notebook_id": "c9c297c4-7037-4148-8133-aa43418c1161",
        "url": "https://notebook.google.com/notebook/c9c297c4-7037-4148-8133-aa43418c1161",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\spa_real_stack\01_manual_frontend_spa_vite_zustand.md",
        "description": "Especialista en desarrollo frontend SPA con React 18 concurrente, Vite 5 tooling y arquitectura de estado atómico desacoplado con Zustand 5.0 (19 stores atómicos, persistencia y selectores shallow)."
    },
    {
        "dir_name": "supabase-baas-offline-outbox",
        "title": "Supabase BaaS, Client RLS & Offline Outbox Engine",
        "notebook_id": "6f0eb407-a572-4934-867e-0686daee1270",
        "url": "https://notebook.google.com/notebook/6f0eb407-a572-4934-867e-0686daee1270",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\spa_real_stack\02_manual_supabase_baas_offline_outbox.md",
        "description": "Especialista en integración de Supabase (@supabase/supabase-js), aislamiento Multi-Tenant con Client RLS, RPCs atómicas, persistencia local con IndexedDB (idb) y patrón Outbox para sincronización offline-first."
    },
    {
        "dir_name": "frontend-testing-document-engines",
        "title": "Frontend Testing & Client Document Engines (Vitest, RTL, jsPDF, ExcelJS)",
        "notebook_id": "79820024-087d-4ce4-a79a-c78283869f9a",
        "url": "https://notebook.google.com/notebook/79820024-087d-4ce4-a79a-c78283869f9a",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\spa_real_stack\03_manual_testing_document_engines_domain.md",
        "description": "Especialista en pruebas automatizadas con Vitest y React Testing Library, y generación client-side de documentos PDF vectoriales (jsPDF) y hojas de cálculo (ExcelJS) sin coste de servidor."
    },
    {
        "dir_name": "enterprise-frontend-uiux-design",
        "title": "Diseño Frontend & UI/UX Enterprise: Interfaces Fluidas, Intuitivas y Modernas",
        "notebook_id": "14718d98-431d-455c-bb15-ca44d036421d",
        "url": "https://notebook.google.com/notebook/14718d98-431d-455c-bb15-ca44d036421d",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\frontend_ui_ux\manual_maestro_frontend_ui_ux.md",
        "description": "Especialista en diseño de UI/UX empresarial, control de densidad de tablas (Compact/Regular/Comfortable), micro-animaciones con propósito (Framer Motion), paleta Cmd+K y estética OKLCH dark mode."
    },
    {
        "dir_name": "saas-solution-multitenant-architect",
        "title": "SaaS Solution & Multi-Tenant Systems Architect",
        "notebook_id": "a87a5fa3-ac63-4686-99a6-b8f68359b50f",
        "url": "https://notebook.google.com/notebook/a87a5fa3-ac63-4686-99a6-b8f68359b50f",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\roles\01_saas_architect.md",
        "description": "Especialista en diseño arquitectónico de soluciones SaaS B2B, aislamiento criptográfico Multi-Tenant con PostgreSQL RLS, máquinas de estados finitos (FSM) y contratos OpenAPI 3.1."
    },
    {
        "dir_name": "database-architect-transactional-guard",
        "title": "Database Architect & Transactional Guard (PostgreSQL Specialist)",
        "notebook_id": "b7c294f1-9e15-4130-adc4-501cb9d394fe",
        "url": "https://notebook.google.com/notebook/b7c294f1-9e15-4130-adc4-501cb9d394fe",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\roles\02_database_architect.md",
        "description": "Especialista en arquitectura de base de datos PostgreSQL, integridad transaccional ACID, contabilidad por partida doble inmutable, control de concurrencia pesimista (SELECT FOR UPDATE) e índices pg_trgm."
    },
    {
        "dir_name": "backend-modular-fastapi-engineer",
        "title": "Backend & Modular API Engineer (FastAPI / Python Specialist)",
        "notebook_id": "50e1ee96-59cd-468b-823d-edd4fe1f15cb",
        "url": "https://notebook.google.com/notebook/50e1ee96-59cd-468b-823d-edd4fe1f15cb",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\roles\03_backend_engineer.md",
        "description": "Especialista en desarrollo backend modular con FastAPI, Pydantic v2, SQLAlchemy 2.0 Async, autenticación JWT stateless y diseño de microservicios por dominio de negocio."
    },
    {
        "dir_name": "frontend-architecture-enterprise-engineer",
        "title": "Frontend Architecture & Enterprise UX/UI Engineer",
        "notebook_id": "9bae25a4-27a0-48fe-8e81-e9e2128802d5",
        "url": "https://notebook.google.com/notebook/9bae25a4-27a0-48fe-8e81-e9e2128802d5",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\roles\04_frontend_engineer.md",
        "description": "Especialista en arquitectura frontend empresarial, componentes accesibles con shadcn/ui y Radix UI, manipulación de tablas con TanStack Table y estilos con Tailwind CSS."
    },
    {
        "dir_name": "cloud-devops-cost-zero-infrastructure",
        "title": "Cloud DevOps & Cost-Zero Infrastructure Engineer",
        "notebook_id": "96436550-80a8-4ad4-bd03-abfd982b159a",
        "url": "https://notebook.google.com/notebook/96436550-80a8-4ad4-bd03-abfd982b159a",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\roles\05_cloud_devops.md",
        "description": "Especialista en despliegue de infraestructura de producción a coste $0 con Coolify, Oracle Cloud Always Free (OCI), Cloudflare R2 y Docker Compose."
    },
    {
        "dir_name": "secops-multitenant-owasp-guard",
        "title": "SecOps & Multi-Tenant Security Guard (OWASP Specialist)",
        "notebook_id": "288c9ebf-8048-4067-bf58-d0bf8800ea1d",
        "url": "https://notebook.google.com/notebook/288c9ebf-8048-4067-bf58-d0bf8800ea1d",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\roles\06_secops_guard.md",
        "description": "Especialista en seguridad de aplicaciones web y multi-tenant, mitigación del OWASP Top 10, prevención de BOLA/IDOR, inyección SQL, control de sesiones y auditoría de seguridad."
    },
    {
        "dir_name": "async-tasks-event-driven-engineer",
        "title": "Asynchronous Tasks & Event-Driven Engineer",
        "notebook_id": "54b50fd9-63f6-475d-a0cc-fdf144133962",
        "url": "https://notebook.google.com/notebook/54b50fd9-63f6-475d-a0cc-fdf144133962",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\roles\07_async_engineer.md",
        "description": "Especialista en procesamiento asíncrono en background, colas de tareas con Celery/Redis, patrón Transactional Outbox, eventos y entrega de notificaciones."
    },
    {
        "dir_name": "ai-context-agentic-workflow-architect",
        "title": "AI Context Engineer & Agentic Workflow Architect",
        "notebook_id": "12bf83a3-7ae5-467f-a6ce-e860ec344462",
        "url": "https://notebook.google.com/notebook/12bf83a3-7ae5-467f-a6ce-e860ec344462",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\roles\08_ai_context_engineer.md",
        "description": "Especialista en optimización de contexto para modelos de IA, empaquetado de repositorios con Repomix, protocolos Model Context Protocol (MCP) y RAG vectorial con pgvector."
    },
    {
        "dir_name": "qa-tdd-automation-engineer",
        "title": "QA & TDD Automation Engineer",
        "notebook_id": "a9a59323-9c1b-4388-bb79-3311720b414c",
        "url": "https://notebook.google.com/notebook/a9a59323-9c1b-4388-bb79-3311720b414c",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\roles\09_qa_tdd_engineer.md",
        "description": "Especialista en automatización de pruebas y Test-Driven Development (TDD), pruebas E2E con Playwright, pipelines de CI/CD en GitHub Actions y cobertura de código robusta."
    },
    {
        "dir_name": "software-systems-engineer",
        "title": "Ingeniero de Software",
        "notebook_id": "77754a0d-dff3-464f-84bc-e8c66316a406",
        "url": "https://notebook.google.com/notebook/77754a0d-dff3-464f-84bc-e8c66316a406",
        "manual_path": r"c:\Users\USUARIO\Documents\Yurgenpersonal\TopSecret\Scraping_NoteBook_LM\sources\ingeniero_de_software\01_arquitectura_core_saas_erp_wms_crm.md",
        "description": "Ingeniero de sistemas y arquitecto integral de software para SaaS, ERP, WMS y CRM, garantizando consistencia, modularidad, patrones de diseño de clase mundial y escalabilidad."
    }
]

created = 0
for item in SKILL_DEFINITIONS:
    target_dir = SKILLS_DIR / item["dir_name"]
    target_dir.mkdir(parents=True, exist_ok=True)
    skill_file = target_dir / "SKILL.md"
    
    manual_content = ""
    if Path(item["manual_path"]).exists():
        manual_content = Path(item["manual_path"]).read_text(encoding="utf-8")
    
    content = f"""---
name: {item['dir_name']}
description: {item['description']}
---

# {item['title']} — Skill de Especialista

Esta skill especializada conecta directamente con la base de conocimiento oficial del notebook en Google NotebookLM y establece las directrices técnicas, patrones de diseño y estándares de ingeniería para **La Pezcaderia ERP**.

> **Fuente Oficial de Verdad (NotebookLM):**  
> **Notebook:** `{item['title']}`  
> **Notebook ID:** `{item['notebook_id']}`  
> **URL Oficial:** [{item['url']}]({item['url']})  
> **Comando de Consulta Rápida:**  
> `nlm query {item['notebook_id']} "<tu consulta técnica>"`

---

{manual_content}

---

## Directrices de Implementación para el Agente

1. **Consulta Previa Obligatoria:** Cuando se realicen tareas vinculadas a este dominio, utiliza la CLI `nlm query {item['notebook_id']}` para verificar mejores prácticas antes de proponer cambios estructurales.
2. **Modularidad Estricta:** El código debe ser modular, desacoplado y con tipos estrictos en TypeScript o Python.
3. **Inmutabilidad:** Toda mutación de estado debe generar nuevas copias de objetos; nunca mutar arreglos o estados en caliente.
4. **Verificación:** Ejecuta las pruebas automatizadas asociadas (`npm run test:run` o tests unitarios) tras cada modificación.
"""
    skill_file.write_text(content, encoding="utf-8")
    created += 1

print(f"SUCCESS: {created} skills successfully generated in {SKILLS_DIR}")
