---
name: multi-tenant
description: Arquitectura de seguridad multi-inquilino (Multi-Tenancy), aislamiento por tenant_id y roles RBAC en Supabase.
---

# Workflow: /multi-tenant

Activa y ejecuta las directrices de la skill `saas-multi-tenant-security` ubicada en `.agents/skills/saas-multi-tenant-security/SKILL.md`.

## Pasos de Ejecución
1. **Auditar Políticas RLS**:
   - Verificar que toda nueva tabla incluya `tenant_id UUID NOT NULL` y políticas RLS activas.
2. **Gestionar Permisos RBAC**:
   - Validar permisos en la SPA según el rol del usuario (`app_metadata.role`).
3. **Prevenir Fuga de Datos entre Tenants**:
   - Asegurar que las consultas RPC incluyan validación explícita de `auth.tenant_id()`.
