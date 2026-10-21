# Control de Calidad 1: Decisiones de Clarificación Aprobadas (SPEC-025)

**Código:** SPEC-025  
**Título:** Dispatcher HTTP Real SIIGO Nube API v2  
**Fase:** Spec Kit v3.0 — `/speckit.clarify`  
**Gobernanza:** Flujo Continuo Kanban (Límite estricto `WIP = 1`)  
**Fecha de Aprobación:** 2026-10-21  

---

## Decisiones Arquitectónicas Ratificadas por el Usuario

### 1. Gestión y Persistencia de Credenciales SIIGO
- **Decisión Aprobada:** Formulario administrativo táctil en el ERP (guardado en store Zustand con persistencia en `localStorage`/IndexedDB seguro), con soporte de credenciales de Producción y Sandbox, y botón de diagnóstico "Probar Conexión" (Ping HTTP en vivo a `/auth`).
- **Impacto:** Permite a la administración ingresar o rotar las claves API directamente en la interfaz sin necesidad de re-desplegar la aplicación.

### 2. Comportamiento en Caja POS sin Credenciales o en Modo Pruebas
- **Decisión Aprobada:** **Modo Simulación Transparente**. La venta en caja POS nunca se frena ni se bloquea. Si no hay credenciales configuradas o el flag `isSandbox` está activo, se emite el ticket con numeración fiscal simulada (`FEVP-`) y CUFE sintético, encolando el payload en la Outbox (`caja_outbox_v2`) para timbrado definitivo cuando se configuren las credenciales en producción.
- **Impacto:** Cumplimiento total de la resiliencia operativa y experiencia de usuario fluida para los cajeros.

### 3. Protocolo ante Rechazos Fatales de la DIAN (HTTP 400 Bad Request)
- **Decisión Aprobada:** **Aislamiento Outbox (`ERROR_FATAL_DATOS`)**. Si SIIGO Nube o la DIAN rechazan una factura por error de datos del cliente (NIT con DV incorrecto, código DANE inválido, etc.), el sistema aísla el ítem sin frenar el procesamiento de las demás ventas en cola. Se captura el mensaje exacto devuelto por la DIAN en `ultimoError` y se habilita un modal de corrección y re-despacho manual en 1 toque desde el monitor de sincronización.
- **Impacto:** Alta tolerancia a fallos, cero bloqueos en la cola FIFO y trazabilidad completa para el departamento contable.
