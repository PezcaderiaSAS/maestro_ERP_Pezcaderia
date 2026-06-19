---
name: pezcaderia-testing-vitest
description: Estándares de creación de pruebas unitarias y de integración del ERP utilizando Vitest.
---

# Testing Standards with Vitest

Este skill establece las reglas de diseño para la suite de pruebas unitarias, mocking de dependencias y pruebas de componentes en el ERP.

## Mock de Persistencia Local (localDb)

Para aislar las pruebas de efectos secundarios reales, todas las pruebas unitarias deben correr contra una implementación mock de `localStorage` y `localDb`.

### Configuración del Setup (`setup.ts`)

```typescript
import { vi } from 'vitest';

// Simular localDb
vi.mock('../services/localDb', () => {
  let mockStore: Record<string, any> = {};
  return {
    load: vi.fn((key, defaultValue) => mockStore[key] ?? defaultValue),
    save: vi.fn((key, value) => { mockStore[key] = value; }),
    remove: vi.fn((key) => { delete mockStore[key]; }),
    clear: vi.fn(() => { mockStore = {}; }),
  };
});
```

---

## Consultas de Contexto Avanzado (Context7 API)

Para consultar patrones complejos de mocking en Vitest, pruebas de hooks de React o aserción de eventos con `@testing-library/react`, consulta la base de conocimiento de Context7:

```bash
# Consultar mejores prácticas para testing de react hooks en Vitest
curl -X GET "https://context7.com/api/v2/context?libraryId=/vitest-dev/vitest&query=testing+react+hook+renderHook&type=txt" \
  -H "Authorization: Bearer ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887"
```

## Cobertura e Integridad
- **Dominio Puro**: El 100% de las funciones en `src/services/` deben tener tests unitarios cubriendo los caminos felices y de excepción.
- **Reglas de Negocio**: Cada test que valide una regla de negocio debe tener un comentario explícito de referencia (ej. `// Test de RN-01`).
