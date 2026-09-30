---
name: cloud-devops-cost-zero-infrastructure
description: Especialista en despliegue de infraestructura de producción a coste $0 con Coolify, Oracle Cloud Always Free (OCI), Cloudflare R2 y Docker Compose.
---

# Cloud DevOps & Cost-Zero Infrastructure Engineer — Skill de Especialista

Esta skill especializada conecta directamente con la base de conocimiento oficial del notebook en Google NotebookLM y establece las directrices técnicas, patrones de diseño y estándares de ingeniería para **La Pezcaderia ERP**.

> **Fuente Oficial de Verdad (NotebookLM):**  
> **Notebook:** `Cloud DevOps & Cost-Zero Infrastructure Engineer`  
> **Notebook ID:** `96436550-80a8-4ad4-bd03-abfd982b159a`  
> **URL Oficial:** [https://notebook.google.com/notebook/96436550-80a8-4ad4-bd03-abfd982b159a](https://notebook.google.com/notebook/96436550-80a8-4ad4-bd03-abfd982b159a)  
> **Comando de Consulta Rápida:**  
> `nlm query 96436550-80a8-4ad4-bd03-abfd982b159a "<tu consulta técnica>"`

---

# Manual Maestro: Cloud DevOps & Cost-Zero Infrastructure Engineer

## 1. Misión del Rol
Diseñar, aprovisionar y mantener la infraestructura de producción del SaaS a coste $0 real en etapas iniciales, garantizando alta disponibilidad, seguridad perimetral y despliegues continuos automatizados.

## 2. Arquitectura de Coste $0 Permanente
- **Cómputo Central en Oracle Cloud Always Free (OCI)**:
  - Aprovisionamiento de 1 instancia Ampere A1 (ARM64) con 4 OCPUs, 24 GB de memoria RAM y 200 GB SSD NVMe. Esta capacidad supera con creces cualquier servidor básico de pago en DigitalOcean o AWS.
- **PaaS Autoalojado con Coolify**:
  - Instalación de Coolify en la instancia OCI para gestionar contenedores Docker, reverse proxy (Traefik), emisión y renovación automática de certificados SSL con Let's Encrypt y despliegue automático mediante webhooks de Git.
- **Almacenamiento de Objetos en Cloudflare R2**:
  - 10 GB de almacenamiento gratuito al mes.
  - **Zero Egress Fees**: $0 de costo por descarga de archivos o ancho de banda saliente, eliminando la factura sorpresa típica de AWS S3 al almacenar y servir facturas en PDF, fotos de productos y archivos adjuntos.
- **DNS, CDN y Protección Perimetral en Cloudflare**:
  - Mitigación DDoS gratuita, SSL universal, compresión Brotli y caché de assets estáticos en el borde global.

## 3. Rol en el Desarrollo Guiado por IA
- Genera y audita scripts de Dockerfile multi-etapa (multi-stage builds) ultra ligeros, archivos docker-compose optimizados y recetas de automatización sin exponer credenciales ni puertos vulnerables.


---

## Directrices de Implementación para el Agente

1. **Consulta Previa Obligatoria:** Cuando se realicen tareas vinculadas a este dominio, utiliza la CLI `nlm query 96436550-80a8-4ad4-bd03-abfd982b159a` para verificar mejores prácticas antes de proponer cambios estructurales.
2. **Modularidad Estricta:** El código debe ser modular, desacoplado y con tipos estrictos en TypeScript o Python.
3. **Inmutabilidad:** Toda mutación de estado debe generar nuevas copias de objetos; nunca mutar arreglos o estados en caliente.
4. **Verificación:** Ejecuta las pruebas automatizadas asociadas (`npm run test:run` o tests unitarios) tras cada modificación.
