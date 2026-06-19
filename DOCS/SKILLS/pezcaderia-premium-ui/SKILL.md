---
name: pezcaderia-premium-ui
description: Estándares de diseño premium y Vue 3 para interfaces modernas y fluidas.
---

# Premium UI/UX Standards with Vue 3

Este skill define los estándares estéticos y técnicos para las interfaces de usuario de la aplicación, priorizando la elegancia y la experiencia de usuario.

## Principios de Diseño

### 1. Paleta de Colores Curada
Evita colores básicos. Usa sistemas de diseño como HSL para crear armonía.
- **Primario**: `#1e3a8a` (Deep Navy)
- **Secundario**: `#64748b` (Slate Light)
- **Acento**: `#38bdf8` (Sky Blue)

### 2. Tipografía Moderna
Usa fuentes de Google Fonts como 'Inter', 'Outfit' o 'Roboto'.
```css
body {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

## Patrones de Vue 3

### Componentes Reactivos
Utiliza `Composition API` para una lógica más clara y reusable.

```javascript
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const data = ref([]);
    const isLoading = ref(true);

    const fetchData = async () => {
      // Fetch logic
      isLoading.value = false;
    };

    onMounted(fetchData);

    return { data, isLoading };
  }
}
```

### Animaciones Micro-interactivas
Usa transiciones suaves para cambios de estado.

```css
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
```

## Estándares de Layout
- **Glassmorphism**: Aplica efectos de desenfoque de fondo para un look premium.
- **Gradients**: Usa degradados sutiles en lugar de colores planos.
