# Roadmap de Integración: Spring Boot 4 + OmniRouter + Spec-Kit

**Proyecto:** MaestroPescaderia ERP  
**Fecha de Inicio:** 2026-07-22  
**Estado:** En Planificación  
**Metodología:** Spec-Driven Development (SDD) + Agent Swarm Orchestration (OmniRouter / Ruflo)

---

## 🎯 Objetivo General
Integrar un microservicio desacoplado en **Spring Boot 4 (Java 21+)** para la ejecución de lógica de negocio pesada (Cálculo Pareto ABC, Facturación y Motor de Promociones estilo Odoo 18), manteniendo la arquitectura Data-Driven en **React 18 + Supabase** y utilizando **Antigravity CLI** con **OmniRouter** como orquestador inteligente de agentes de IA.

---

## 🗺️ Fases del Roadmap

### Fase 1: Setup de Orquestación & Especificación SDD (Spec-Kit)
- [ ] **1.1. Configuración de OmniRouter & Ruflo MCP**:
  - Validar los servidores MCP (`mcp-deepseek-r1`, `mcp-qwen-coder`, `mcp-kimi-code`).
  - Configurar las políticas de enrutamiento dinámico en `tools/ruflo/config.json`.
- [ ] **1.2. Definición del Contrato OpenAPI (v3)**:
  - Crear la especificación OpenAPI base en `DOCS/speckit/spring_boot_api_v1.yaml`.
  - Definir los endpoints de Análisis Pareto ABC y Promociones.
- [ ] **1.3. Generación Automática de Tipos TypeScript**:
  - Ejecutar `npx openapi-typescript` para mantener la capa `src/types/` sincronizada.

---

### Fase 2: Microservicio Backend Spring Boot 4 (Java 21+)
- [ ] **2.1. Escafoldado del Proyecto Spring Boot 4**:
  - Crear la estructura de paquetes: `com.pezcaderia.config`, `com.pezcaderia.domain.*`.
  - Configurar Java 21 Virtual Threads (Project Loom) en `application.yml`.
- [ ] **2.2. Seguridad & Autenticación Compartida con Supabase**:
  - Configurar `SecurityConfig.java` como OAuth2 Resource Server.
  - Implementar la validación de firma e issuer para JWTs emitidos por Supabase Auth.
- [ ] **2.3. Motor de Análisis Pareto ABC (Lógica Pesada)**:
  - Crear Java Records inmutables: `AnalisisAbcItemRecord.java`.
  - Implementar el cálculo 80/20 en `AnalisisAbcService.java` consumiendo la base de datos PostgreSQL de Supabase.
  - Exponer endpoint `@RestController` `/api/v1/inventario/abc/calcular`.
- [ ] **2.4. Cobertura de Pruebas TDD**:
  - Escribir pruebas unitarias con JUnit 5 + MockMvc (objetivo >= 80% cobertura).

---

### Fase 3: Capa de Servicios React 18 & Front-End Decoupled
- [ ] **3.1. Adaptador de Servicio Inmutable (`IDataService`)**:
  - Definir interfaz `IAnalisisAbcService` en `src/services/inventario/`.
  - Crear implementación `SpringAnalisisAbcService.ts` que inyecta automáticamente el JWT de `supabase.auth.getSession()`.
- [ ] **3.2. Integración con Zustand Store & UI**:
  - Conectar el servicio con `useInventarioStore`.
  - Diseñar/actualizar los componentes en React 18 con Tailwind CSS y SweetAlert2.
- [ ] **3.3. Pruebas de Integración**:
  - Pruebas E2E de consumo del servicio con Vitest / Playwright.

---

### Fase 4: Motor de Promociones Odoo 18 & Optimización
- [ ] **4.1. Servicio de Reglas de Lealtad (Spring Boot 4)**:
  - Implementar el motor de promociones complejas (descuentos por categoría, combos de productos del mar).
- [ ] **4.2. Pruebas de Carga & Rendimiento**:
  - Validar latencias de respuesta (< 100ms) usando Hilos Virtuales.

---

## 🛠️ Comandos de Continuidad para Otros Equipos

Si clonas o continúas este desarrollo desde otro computador, ejecuta los siguientes comandos para reanudar el trabajo exactamente en este punto:

```bash
# 1. Obtener la última versión del repositorio
git pull origin main

# 2. Auditar el grafo de dependencias con Graphify
node .gitnexus/run.cjs analyze
# O usar graphify:
npx graphify query "Spring Boot Pareto ABC"

# 3. Iniciar la sesión de agentes con OmniRouter y Spec-Kit
/loop-start continuous-pr
/mcp-ai-delegation "Continuar con la Fase 2: Implementar AnalisisAbcController en Spring Boot 4"
```

---

*Documento registrado en el repositorio `DOCS/ROADMAP_SPRING_BOOT4_INTEGRATION.md` para garantizar la trazabilidad y continuidad de desarrollo multiequipo.*
