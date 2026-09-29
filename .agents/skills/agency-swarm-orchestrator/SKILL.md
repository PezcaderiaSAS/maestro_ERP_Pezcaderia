---
name: agency-swarm-orchestrator
description: Motor de orquestación y optimización de solicitudes para el enjambre Agency Swarm con Google AI Studio. Incluye reglas de batching, targeting de especialistas y prevención de RateLimit 429.
---

# Agency Swarm Orchestrator — La Pezcaderia ERP

Esta habilidad define el protocolo de interacción de alto rendimiento para interactuar con el enjambre multi-agente (`tools/agency-swarm/`) impulsado por la API gratuita de Google AI Studio (**Gemini 2.5 Flash Lite**).

---

## 🏛️ 1. Matriz de Agentes y Responsabilidades

| Agente | Rol Principal | Casos de Uso Exclusivos |
| :--- | :--- | :--- |
| **`SoftwareArchitect`** | Orquestador / Director Técnico | Análisis multi-módulo, gobernanza global de `ARCHITECT_GOVERNANCE.md`, diseño de flujos end-to-end y mediación entre especialistas. |
| **`DataEngineer`** | Especialista en Datos y RLS | Esquemas PostgreSQL, políticas RLS en Supabase, funciones RPC ACID, índices GIN/B-tree, transacciones y control de concurrencia. |
| **`UIReviewer`** | Especialista Frontend y UX | Componentes React 18 / Tailwind CSS, tokens Rico UI, Dark Glassmorphism, accesibilidad y diseño de interfaces POS/WMS. |
| **`QualityEngineer`** | Especialista en Calidad y TDD | Esquemas Zod en cliente/servidor, pruebas unitarias Vitest, pruebas e2e Playwright y validación de reglas DIAN/tributarias. |

---

## ⚡ 2. Protocolo de Optimización Anti-RateLimit (Prevención 429)

Google AI Studio en su capa gratuita impone una ventana rodante de 60 segundos con límites de peticiones concurrentes por minuto (RPM). Para operar sin bloqueos:

### Regla 1: Targeting Explícito (Ahorro del 65% de llamadas)
- ❌ **Evitar:** Enviar requerimientos sin destinatario claro que obliguen al `SoftwareArchitect` a consultar a los 3 agentes en cascada.
- ✅ **Hacer:** Incluir en el encabezado del prompt el agente especialista:
  - `[Especialista: DataEngineer]`
  - `[Especialista: UIReviewer]`
  - `[Especialista: QualityEngineer]`

### Regla 2: Prompt Batching (Agrupación en Bloque)
En lugar de disparar 4 consultas individuales en 20 segundos:
- Empaqueta el requerimiento en un único prompt estructurado con números o viñetas (máximo 3 a 5 puntos concretos).
- Esto genera un único ciclo transaccional dentro del enjambre.

### Regla 3: Pausa de Enfriamiento (Cooling Pacing)
- Mantener una pausa de **5 a 8 segundos** entre consultas consecutivas al ejecutar en modo script o CLI interactivo.

### Regla 4: Modelo de Alta Cuota (`gemini-2.5-flash-lite`)
- Utilizar siempre `gemini-2.5-flash-lite` como motor predeterminado (configurado en `tools/agency-swarm/.env`).
- Solo cambiar a `gemini-2.5-flash` cuando se requiera razonamiento matemático de merma extrema o despiece crítico.

---

## 📋 3. Plantillas de Solicitud Optimizadas

### Plantilla A: Base de Datos / RLS / Supabase
```text
[Especialista: DataEngineer]
Módulo: [Nombre del Módulo, ej. Cajas y Arqueos]
Requerimiento:
1. Diseña la estructura SQL de la tabla con soporte multi-tenant (tenant_id).
2. Define la política RLS estricta para roles admin y cajero.
3. Especifica los índices recomendados para consultas frecuentes.
```

### Plantilla B: Validación y Esquemas Zod
```text
[Especialista: QualityEngineer]
Flujo: [Nombre del Flujo, ej. Anulación Parcial de Factura]
Requerimiento:
1. Diseña el esquema Zod estricto para validar el payload en frontend.
2. Define los casos de prueba unitaria que deben cubrirse con Vitest.
3. Especifica las aserciones mínimas de error para entradas inválidas.
```

### Plantilla C: Interfaz y Componentes Glassmorphism
```text
[Especialista: UIReviewer]
Componente: [Nombre del Componente, ej. ModalTrasladoDinero.tsx]
Requerimiento:
1. Audita la jerarquía visual respetando Dark Glassmorphism y tokens de Rico UI.
2. Revisa estados hover, focus, disabled y contraste accesible.
3. Entrega el snippet Tailwind CSS optimizado sin placeholders.
```

---

## 🛠️ 4. Formas de Ejecución

```powershell
# Consulta Directa Optimizada
tools\agency-swarm\.venv\Scripts\python.exe tools/agency-swarm/run_cli.py -p "[Especialista: DataEngineer] Diseña la función RPC para cierre de turno con balance de caja ciego."

# Modo Chat Interactivo
tools\agency-swarm\.venv\Scripts\python.exe tools/agency-swarm/run_cli.py --demo
```
