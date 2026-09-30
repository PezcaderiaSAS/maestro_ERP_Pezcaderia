---
name: frontend-architecture-enterprise-engineer
description: Especialista en arquitectura frontend empresarial, componentes accesibles con shadcn/ui y Radix UI, manipulación de tablas con TanStack Table y estilos con Tailwind CSS.
---

# Frontend Architecture & Enterprise UX/UI Engineer — Skill de Especialista

Esta skill especializada conecta directamente con la base de conocimiento oficial del notebook en Google NotebookLM y establece las directrices técnicas, patrones de diseño y estándares de ingeniería para **La Pezcaderia ERP**.

> **Fuente Oficial de Verdad (NotebookLM):**  
> **Notebook:** `Frontend Architecture & Enterprise UX/UI Engineer`  
> **Notebook ID:** `9bae25a4-27a0-48fe-8e81-e9e2128802d5`  
> **URL Oficial:** [https://notebook.google.com/notebook/9bae25a4-27a0-48fe-8e81-e9e2128802d5](https://notebook.google.com/notebook/9bae25a4-27a0-48fe-8e81-e9e2128802d5)  
> **Comando de Consulta Rápida:**  
> `nlm query 9bae25a4-27a0-48fe-8e81-e9e2128802d5 "<tu consulta técnica>"`

---

# Manual Maestro: Frontend Architecture & Enterprise UX/UI Engineer

## 1. Misión del Rol
Desarrollar interfaces web corporativas de alto impacto visual, diseñadas para manipular grandes volúmenes de datos con fluidez, accesibilidad total (WCAG AA) y experiencia de usuario de élite.

## 2. Stack y Patrones de Construcción
- **Next.js 15+ App Router con TypeScript Estricto**:
  - React Server Components (RSC) para renderizar vistas y dashboards en el servidor con cero peso de JavaScript inicial en el cliente.
  - Server Actions para mutaciones de datos directas, revalidando la caché del servidor de forma atómica con `revalidatePath` y `revalidateTag`.
- **Manipulación de Datos Masivos con @tanstack/react-table**:
  - Es el componente nuclear en aplicaciones ERP/WMS: paginación del lado del servidor, ordenamiento multicriterio, filtros avanzados por columna (rangos de fechas, selects con búsqueda) y visibilidad dinámica de columnas.
  - Soporte de selección múltiple con acciones por lote (ej. exportar 100 órdenes seleccionadas o marcarlas como aprobadas).
- **Sistema de Diseño con shadcn/ui + Tailwind CSS v4**:
  - Componentes basados en primitivas de Radix UI alojados directamente en el repositorio del proyecto (control 100% sobre el código fuente, sin dependencias externas bloqueantes).
  - Soporte nativo para modo oscuro/claro, navegación por teclado, focus rings visibles y accesibilidad aria.
- **Formularios Tipados con React Hook Form + Zod**:
  - Validación en cliente en tiempo real compartiendo esquemas Zod con el backend, evitando re-escritura de reglas de validación.

## 3. Rol en el Desarrollo Guiado por IA
- Exige a los asistentes de IA ceñirse a los tokens de diseño predefinidos, rechazando código con estilos en línea o interfaces genéricas de baja calidad, asegurando micro-interacciones suaves y optimización de Core Web Vitals (LCP < 2.5s).


---

## Directrices de Implementación para el Agente

1. **Consulta Previa Obligatoria:** Cuando se realicen tareas vinculadas a este dominio, utiliza la CLI `nlm query 9bae25a4-27a0-48fe-8e81-e9e2128802d5` para verificar mejores prácticas antes de proponer cambios estructurales.
2. **Modularidad Estricta:** El código debe ser modular, desacoplado y con tipos estrictos en TypeScript o Python.
3. **Inmutabilidad:** Toda mutación de estado debe generar nuevas copias de objetos; nunca mutar arreglos o estados en caliente.
4. **Verificación:** Ejecuta las pruebas automatizadas asociadas (`npm run test:run` o tests unitarios) tras cada modificación.
