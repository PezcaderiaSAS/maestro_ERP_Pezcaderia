# Guía de Contribución y Despliegue (MaestroPescaderia ERP)

Esta guía documenta los entornos de desarrollo, scripts ejecutables y convenciones de código para mantener la calidad y consistencia en el proyecto.

---

## 🛠️ Comandos Disponibles (`package.json`)

<!-- AUTO-GENERATED: SCRIPTS -->
| Comando | Descripción |
| :--- | :--- |
| `pnpm dev` | Inicia el servidor de desarrollo local con Vite (Hot Reloading). |
| `pnpm build` | Ejecuta la verificación estricta de tipos de TypeScript (`tsc`) y compila el bundle de producción con Vite. |
| `pnpm lint` | Ejecuta ESLint para analizar errores de sintaxis y buenas prácticas en archivos `.ts` y `.tsx`. |
| `pnpm preview` | Sirve la compilación de producción de forma local para pruebas previas a despliegue. |
| `pnpm test` | Inicia la suite de pruebas unitarias e integración con Vitest en modo watch. |
| `pnpm test:run` | Ejecuta todas las pruebas de Vitest una sola vez (modo CI/CD). |
| `pnpm test:coverage` | Genera el informe de cobertura de código (target mínimo: 80%). |
| `pnpm test:e2e` | Ejecuta las pruebas End-to-End con Playwright de forma headless. |
| `pnpm test:e2e:ui` | Inicia la interfaz gráfica interactiva de Playwright para depuración E2E. |
| `pnpm test:e2e:headed` | Ejecuta las pruebas E2E con navegador visible. |
<!-- AUTO-GENERATED: SCRIPTS END -->

---

## 📏 Estándares de Código y Arquitectura

1. **Inmutabilidad Estricta**: No mutar objetos existentes ni arreglos directamente; retornar siempre nuevas instancias.
2. **Data-Driven & Capa de Servicios**: Toda la comunicación con backend / persistencia debe canalizarse mediante implementaciones de la interfaz `IDataService`.
3. **Análisis de Impacto Obligatorio**: Antes de modificar cualquier símbolo o función en servicios core, ejecutar `impact()` de GitNexus.
4. **Grafo de Conocimiento**: Para consultas estructurales y dependencias entre módulos, utilizar Graphify (`graphify-out/GRAPH_REPORT.md`).

---
*Documento auto-generado desde la fuente de verdad del proyecto (`package.json`, `AGENTS.md`).*
