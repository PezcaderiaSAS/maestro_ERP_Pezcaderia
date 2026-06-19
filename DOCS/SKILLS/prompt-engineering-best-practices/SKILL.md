---
name: prompt-engineering-best-practices
description: Técnicas avanzadas para optimizar prompts, mejorar la comunicación de tareas y definir objetivos claros con la IA en el ecosistema Pezca/Frio.
---

# Ingeniería de Prompts - WMS ColdChain Pro

Guía optimizada para la comunicación entre desarrolladores y modelos de lenguaje (LLM), asegurando que las soluciones para el WMS sean precisas, seguras y de alto rendimiento.

## 1. Estructura del Prompt (Marco RCTC Adaptado)

Para obtener resultados óptimos en este proyecto, utiliza:

- **Rol**: Define a la IA como un especialista del ecosistema.
  - *Ejemplo*: "Eres un Arquitecto Senior experto en Google Apps Script y WMS ColdChain Pro."
- **Contexto**: Proporciona los archivos base.
  - *Ejemplo*: "Estamos trabajando en la conciliación de inventario. El sistema usa `Database.gs` para persistencia y `Controller.gs` para la API."
- **Tarea**: Especifica la acción técnica.
  - *Ejemplo*: "Migra la lógica de entrada de mercancía para que valide el peso en gramos antes de registrar."
- **Restricciones (Constraints)**: El punto más crítico para evitar errores.
  - *Ejemplo*: "Usa `Integer Math` (gramos), evita `getValue` dentro de bucles, y asegura que pase por el `DAO Middleware` para la marca de tiempo."

## 2. Técnicas Avanzadas Pezca-Style

### Razonamiento Paso a Paso (Chain of Thought)
Especialmente útil para depurar cálculos financieros complejos.
- *Prompt*: "Analiza el flujo de liquidación de fletes en `Controller.gs` y explica **paso a paso** el cálculo del total, incluyendo cómo evitas los errores de coma flotante."

### Aprendizaje con Pocos Ejemplos (Few-shot)
Guía la IA con el estilo de código del proyecto (Vue 3 / VueX o GAS).
- *Ejemplo*: "Así mapeamos un producto en `view-entrada.html`: `[Ejemplo A]`. Ahora genera el mapeo para la nueva tabla de salidas: `[Input]`."

### Refinamiento con "Challenger Expert"
Integra la skill `challenger-expert` en el flujo de diseño del prompt:
- "Primero, actúa como `challenger-expert` y critica mi propuesta de arquitectura para el nuevo módulo de rutas. Luego, genera el código optimizado."

## 3. Criterios de Éxito en ColdChain Pro
Un trabajo no está terminado si no cumple con:
- **Performance**: ¿Reduce llamadas al servidor (`Batch Processing`)?
- **Seguridad**: ¿Valida la sesión y usa `LockService`?
- **Estética**: ¿Sigue las guías de `pezcaderia-premium-ui` (Glassmorphism, Tailwind/Vite si aplica)?
- **Integridad**: ¿Maneja errores con un objeto `{ success, error }` estandarizado?

---
**Tip**: Sé explícito con las dependencias. Si necesitas que el código sea compatible con `pezcaderia-reports-pdf`, indícalo claramente desde el inicio del prompt.
