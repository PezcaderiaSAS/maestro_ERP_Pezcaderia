---
name: erp-tech-stack-governance
description: Matriz de gobernanza y control arquitectónico de tecnologías aprobadas, requeridas para escalar y prohibidas/descartadas en MaestroPescaderia ERP.
---

# ERP Tech Stack Governance & Architectural Control Skill

Esta skill actúa como el **árbitro de decisiones tecnológicas** del proyecto, asegurando que ninguna refactorización o nueva característica introduzca dependencias innecesarias, viole la arquitectura Serverless/SPA o rompa los límites de la capa gratuita.

---

## 1. Clasificación Oficial del Stack

### 🟢 Stack Aprobado y Activo
- **Frontend SPA**: React 18, Vite 5, TypeScript 5 (modo estricto).
- **Estilos**: Tailwind CSS con paleta semántica Slate/Navy/Emerald/Cyan.
- **Estado**: Zustand (19 stores atómicos inmutables).
- **Persistencia**: Supabase (PostgreSQL 15 + RLS + `metadata JSONB`).
- **Documentos**: jsPDF en cliente (renderizado vectorial sin costo de servidor).
- **Pruebas**: Vitest, React Testing Library, Playwright.

### 🟡 Stack Requerido para Escalar
- **Caché y Locks**: Upstash Redis Serverless REST (`@upstash/redis`).
- **Resiliencia Local**: IndexedDB (`idb`) con Patrón Outbox para POS/Bodega.
- **Aislamiento SaaS**: `tenant_id UUID` + `current_tenant_id()` en PostgreSQL RLS.
- **Rendimiento SPA**: `React.lazy()` para code-splitting de rutas pesadas.

### 🔴 Stack Prohibido y Descartado
- ❌ **MongoDB / DynamoDB / NoSQL Externo**: Prohibido por latencia cross-network y pérdida de ACID en transacciones de stock (usar PostgreSQL `JSONB`).
- ❌ **Backends dedicados en VMs (Express, NestJS, Django)**: Prohibido para mantener 100% el modelo Serverless SPA en capa gratuita.
- ❌ **Librerías pesadas de PDF (Puppeteer, HTML2Canvas)**: Prohibido por alto consumo de memoria y texto no vectorial.
- ❌ **Frameworks de componentes monolíticos (MUI, Ant Design)**: Prohibido por degradar el rendimiento y generar bundles gigantes.
- ❌ **Redux / MobX / Context API gigante**: Prohibido para evitar duplicidad de estado con Zustand.

---

## 2. Protocolo de Evaluación de Nuevas Dependencias

Antes de ejecutar `npm install <paquete>`:
1. ¿La funcionalidad se puede resolver con TypeScript nativo o utilidades existentes?
2. ¿El paquete soporta Tree-Shaking y pesa menos de 30 KB comprimido?
3. ¿Requiere un servidor Node.js en ejecución persistente? Si la respuesta es SÍ, **queda rechazado**.
