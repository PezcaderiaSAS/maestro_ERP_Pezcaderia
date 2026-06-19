# Skill: Cómo Crear un Componente React

> **USO**: Adjunta este archivo cuando necesites que Antigravity cree un nuevo componente.
> Comando: `@DOCS/AI_RULES.md @DOCS/SKILLS/skill_crear_componente.md Crea el componente [X] según SPEC_[Y].md`

---

## Qué es un Componente en este Proyecto

Un componente React es responsable **exclusivamente** de presentar datos y capturar interacciones del usuario. No contiene lógica de negocio inline. La lógica va en el servicio (`*Service.ts`) o en el hook (`use*.ts`).

---

## Jerarquía de Componentes

```
[Modulo]View.tsx          ← Orquestador: solo composición y layout
    ├── ComponenteA.tsx   ← Componente de sección (> 50 líneas)
    ├── ComponenteB.tsx   ← Componente de sección
    └── ComponenteC/
        ├── ComponenteC.tsx
        └── SubComponente.tsx  ← Extraer si > 80 líneas o reutilizable
```

---

## Estructura de un Componente

```typescript
// src/views/[modulo]/components/[NombreComponente].tsx

import React, { useState, useCallback } from 'react';
// Importar SOLO íconos de lucide-react, no otras librerías UI
import { Search, Plus } from 'lucide-react';

// 1. Definir la interfaz de Props (SIEMPRE con nombre explícito)
interface [NombreComponente]Props {
  // Props de datos (lo que recibe para mostrar)
  items: MiEntidad[];
  // Props de acciones (callbacks hacia el padre o el hook)
  onSeleccionar: (id: string) => void;
  onCrear: () => void;
  // Props de estado
  cargando?: boolean;
  error?: string | null;
}

// 2. Componente con tipado explícito de retorno
const [NombreComponente] = ({
  items,
  onSeleccionar,
  onCrear,
  cargando = false,
  error = null,
}: [NombreComponente]Props): JSX.Element => {

  // 3. Estado LOCAL del componente (solo UI, no de negocio)
  const [busqueda, setBusqueda] = useState('');

  // 4. Handlers con useCallback si se pasan a sub-componentes
  const handleSeleccionar = useCallback((id: string) => {
    onSeleccionar(id);
  }, [onSeleccionar]);

  // 5. Derivados computados (sin useEffect para cálculos)
  const itemsFiltrados = items.filter(item =>
    item.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // 6. Guards de estado (cargando / error) antes del render principal
  if (cargando) return <div className="loading-state">Cargando...</div>;
  if (error) return <div className="error-state">{error}</div>;

  // 7. JSX limpio y legible
  return (
    <div className="[nombre-componente]">
      <div className="[nombre-componente]__header">
        <input
          id="busqueda-[nombre]"
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar..."
        />
        <button id="btn-crear-[nombre]" onClick={onCrear}>
          <Plus size={16} />
          Crear nuevo
        </button>
      </div>

      <ul className="[nombre-componente]__lista">
        {itemsFiltrados.map((item) => (
          <li
            key={item.id}
            onClick={() => handleSeleccionar(item.id)}
            className="[nombre-componente]__item"
          >
            {item.nombre}
          </li>
        ))}
        {itemsFiltrados.length === 0 && (
          <li className="[nombre-componente]__vacio">Sin resultados</li>
        )}
      </ul>
    </div>
  );
};

export default [NombreComponente];
```

---

## Reglas del Patrón de Componente

### ✅ SIEMPRE
- Props con interfaz explícita y nombre `[Componente]Props`
- IDs únicos y descriptivos en elementos interactivos (`id="btn-crear-producto"`)
- Guards de estado al inicio del componente (cargando, error)
- `useCallback` para handlers que se pasan a hijos
- Exportación `default` al final

### ❌ NUNCA
- Lógica de negocio inline en JSX (ifs complejos, cálculos, validaciones de reglas)
- `useEffect` para derivar datos (usar variables computadas directamente)
- `any` en las props o en el estado
- Más de 300 líneas en un solo componente
- Llamadas directas a `localStorage` (pasar datos vía props o hook)
- Comentarios que solo repiten lo que el código ya dice

---

## Estructura de un Hook de Módulo

```typescript
// src/views/[modulo]/hooks/use[Modulo].ts

import { useState, useCallback } from 'react';
import * as [modulo]Service from '../../../services/[modulo]Service';
import type { MiEntidad } from '../../../types/[modulo].types';

interface Use[Modulo]Return {
  items: MiEntidad[];
  itemSeleccionado: MiEntidad | null;
  cargando: boolean;
  error: string | null;
  seleccionar: (id: string) => void;
  crear: (input: Omit<MiEntidad, 'id'>) => void;
  limpiarError: () => void;
}

export function use[Modulo](): Use[Modulo]Return {
  const [items, setItems] = useState<MiEntidad[]>(() =>
    [modulo]Service.getAll[Entidades]().data ?? []
  );
  const [itemSeleccionado, setItemSeleccionado] = useState<MiEntidad | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seleccionar = useCallback((id: string) => {
    const item = items.find(i => i.id === id) ?? null;
    setItemSeleccionado(item);
  }, [items]);

  const crear = useCallback((input: Omit<MiEntidad, 'id'>) => {
    const resultado = [modulo]Service.crear[Entidad](input);
    if (resultado.error) {
      setError(resultado.error);
      return;
    }
    if (resultado.data) {
      setItems(prev => [...prev, resultado.data!]);
    }
  }, []);

  const limpiarError = useCallback(() => setError(null), []);

  return { items, itemSeleccionado, cargando, error, seleccionar, crear, limpiarError };
}
```

---

## Checklist antes de entregar un Componente

- [ ] Props tipadas con interfaz `[Nombre]Props`
- [ ] Sin lógica de negocio inline
- [ ] Guards de cargando/error al inicio
- [ ] Todos los elementos interactivos tienen `id` único
- [ ] Menos de 300 líneas
- [ ] Sin `any`
- [ ] Sin `console.log`
- [ ] Exportación `default` al final
