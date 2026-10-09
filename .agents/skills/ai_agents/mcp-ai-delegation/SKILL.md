---
name: mcp-ai-delegation
description: Instintio de delegación para usar agentes MCP gratuitos de alto nivel (DeepSeek-R1, Qwen-Coder, Kimi-Code) en tareas intensivas de código.
---

# MCP AI Delegation

Este skill instruye a los agentes orquestadores (como Ruflo o ECC) sobre cómo y cuándo delegar trabajo a modelos de IA especializados a través del protocolo MCP (Model Context Protocol).

Actualmente, nuestro entorno dispone de los siguientes servidores MCP que proveen inteligencia de programación de alto nivel de forma **gratuita**, optimizando así nuestro uso de tokens principales:

1. **`mcp-deepseek-r1`**: Modelo especializado en razonamiento profundo. Excelente para planificar arquitecturas, resolver algoritmos complejos o realizar pruebas lógicas estructuradas.
2. **`mcp-qwen-coder`**: Agente enfocado puramente en la generación de código y la resolución de bugs. Usa este MCP para generar grandes bloques de código repetitivo, refactorizaciones extensas o traducciones de código.
3. **`mcp-kimi-code`**: Soporte para lidiar con contextos extremadamente largos. Ideal para cuando necesitas ingerir documentación técnica o archivos muy pesados y extraer un resumen técnico.

## Reglas de Delegación (Instinto de Ahorro de Tokens)

Como agente principal, tu objetivo es actuar como **Product Manager / Orquestador**. En lugar de consumir tus propios tokens para escribir 500 líneas de código, debes hacer lo siguiente:

1. **Analizar la Tarea**: Determinar si la tarea implica más de ~50 líneas de código o requiere razonamiento matemático/lógico avanzado.
2. **Seleccionar el Agente MCP**:
   - Para arquitectura profunda: Delega a `mcp-deepseek-r1`.
   - Para refactorizar componentes React/TypeScript: Delega a `mcp-qwen-coder`.
3. **Formatear la Petición**: Usa la herramienta MCP disponible en tu entorno para pasarle el contexto mínimo necesario (ayudándote del skill de `graphify-context-optimizer`) y el prompt exacto de lo que debe programar.
4. **Revisar y Aplicar**: Una vez que el agente MCP responda con la solución, revisa su salida y aplícala al archivo correspondiente.

### Ejemplo de Flujo:
```text
[Agente Orquestador] -> (Llama a mcp-qwen-coder_openai_chat) -> "Genera el código para el componente TrasladoDineroModal.tsx basado en estas reglas..."
[mcp-qwen-coder] -> (Devuelve código) -> [Agente Orquestador] -> (Escribe código en el archivo)
```

Al seguir este patrón, preservamos la integridad de la base de código y maximizamos los recursos gratuitos y de alto rendimiento.
