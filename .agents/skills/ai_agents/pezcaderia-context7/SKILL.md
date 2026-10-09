---
name: pezcaderia-context7
description: Integración con Context7 API para búsquedas de contexto avanzadas.
---

# Context7 API Integration

Este skill facilita la integración con la API de Context7 para obtener fragmentos de documentación y contexto relevante directamente en tu flujo de trabajo.

## Credenciales

**API Key**: `ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887`

> [!WARNING]
> No compartas esta clave fuera del entorno seguro de desarrollo.

## Uso Básico

### Consulta vía cURL
Puedes probar la conexión rápidamente con el siguiente comando:

```bash
curl -X GET "https://context7.com/api/v2/context?libraryId=/vercel/next.js&query=setup+ssr&type=txt" \
  -H "Authorization: Bearer ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887"
```

## Implementación en JavaScript
Patrón recomendado para realizar consultas desde el backend.

```javascript
async function fetchContext(library, query) {
  const apiKey = 'ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887';
  const url = `https://context7.com/api/v2/context?libraryId=${encodeURIComponent(library)}&query=${encodeURIComponent(query)}&type=txt`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching context:', error);
    return null;
  }
}
```

## Bibliotecas Comunes
- `/vercel/next.js`
- `/facebook/react`
- `/vuejs/core`
