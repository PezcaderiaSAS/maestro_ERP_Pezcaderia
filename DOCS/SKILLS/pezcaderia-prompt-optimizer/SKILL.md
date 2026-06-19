---
name: pezcaderia-prompt-optimizer
description: Optimiza prompts del usuario para el desarrollo del proyecto MaestroPescaderia, integrando contexto técnico dinámico a través de la API de Context7.
---

# Optimizador de Prompts con Context7

Este skill permite optimizar las instrucciones (prompts) proporcionadas por el usuario para el desarrollo de nuevas características, depuración o refactorización de código en el proyecto **MaestroPescaderia**. Utiliza la API de **Context7** para enriquecer las solicitudes con documentación oficial y estándares técnicos exactos antes de enviarlos a la IA.

## 1. Funcionamiento del Optimizador

El optimizador toma una solicitud cruda del usuario (ej. *"agrégale un botón para ver el ticket en pdf"*) y realiza los siguientes pasos:
1. **Detección de Tecnologías Clave**: Identifica si se requiere React, Vitest, Supabase, Web Serial, etc.
2. **Consulta a Context7**: Llama a la API de Context7 con las palabras clave para recuperar fragmentos de código, interfaces y mejores prácticas oficiales.
3. **Estructura RCTC**: Reformatea la solicitud bajo la estructura de **Rol**, **Contexto**, **Tarea**, **Restricciones (Constraints)** y **Criterios de Éxito**, inyectando los datos de Context7.

---

## 2. Credenciales y Endpoints (Context7)

Para realizar búsquedas de documentación técnica y estándares, se utiliza:
* **API Key**: `ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887`
* **Endpoint**: `https://context7.com/api/v2/context`
* **Bibliotecas Recomendadas**:
  * `/facebook/react` (Estructura de componentes y hooks)
  * `/vercel/next.js` (Routing y SSR si aplica)
  * `/vitest-dev/vitest` (Configuraciones de testing)

---

## 3. Script Automatizado de Optimización

Hemos creado un script en `scripts/optimize.js` que automatiza este proceso desde la consola.

### Uso en Terminal:
```bash
node DOCS/SKILLS/pezcaderia-prompt-optimizer/scripts/optimize.js --prompt "quiero agregar un test para probar la balanza" --lib "vitest"
```

El script buscará en la biblioteca `/vitest-dev/vitest` a través de Context7 y escupirá el prompt enriquecido listo para copiar.

---

## 4. Guía Manual de Plantilla de Prompts Optimizados

Si no utilizas el script, estructura tus prompts manualmente inyectando las respuestas de Context7:

```markdown
### ROL
Actúa como un Desarrollador Senior en React, TypeScript y Vitest para el ERP MaestroPescaderia.

### CONTEXTO
Estamos trabajando en [Nombre del Módulo/Componente].
Archivos relacionados: [lista de archivos y sus rutas relativas].

### TAREA
[Detalle de la tarea técnica].

### REFERENCIAS DE CONTEXT7 (Documentación Oficial recuperada)
```typescript
// [Pegar el fragmento obtenido de la API de Context7 aquí]
```

### RESTRICCIONES (CONSTRAINTS)
1. Las llamadas a base de datos deben ser atómicas.
2. El UI debe cumplir con los estándares estéticos premium de `pezcaderia-premium-ui` (Glassmorphism, variables de color CSS, animaciones sutiles).
3. Todas las operaciones WMS de entrada/salida deben registrarse en Kardex usando `registrarMovimiento` (RN-02).
4. No uses placeholders; genera imágenes funcionales y datos reales de prueba.
```
