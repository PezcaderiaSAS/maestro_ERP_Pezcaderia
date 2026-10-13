# Especificación de Requerimientos del Sistema (SDD 011)
## Optimización de Iconos Ligeros y Visualización Semántica de Productos en POS

**Módulo:** POS Punto de Venta & Catálogo de Productos  
**Versión:** 1.0.0  
**Fecha:** 2026-10-13  
**Estado:** Aprobado (/grill-me completado)

---

### 1. Propósito y Contexto de Negocio
Actualmente, el catálogo de productos del punto de venta (POS) renderiza imágenes externas alojadas en Unsplash (`https://images.unsplash.com/...`). En pantallas táctiles de cajeros y terminales de mostrador, estas imágenes:
1. Son pesadas y lentas de cargar, consumiendo ancho de banda innecesario.
2. Generan fallos visuales o pantallas rotas cuando el sistema opera en modo Offline-First.
3. Restan espacio vertical valioso para visualizar más productos en pantalla.

Esta especificación define la arquitectura de un **Modo Híbrido Inteligente** de renderizado visual ligero, rápido (0ms, 100% offline) y determinista, basado en una **Taxonomía Marina Integral de 6 Familias** que genera avatares vectoriales SVG semánticos según el nombre y categoría de cada producto, preservando únicamente fotos reales subidas por el usuario.

---

### 2. Clasificación Semántica (Taxonomía Marina Integral de 6 Familias)

| Familia Semántica | Palabras Clave de Detección | Gradiente Visual | Icono Vectorial | Badge |
| :--- | :--- | :--- | :--- | :--- |
| **CAMARÓN / CRUSTÁCEO** | `camarón`, `camaron`, `langostino`, `tití`, `tigre`, `cola`, `crustáceo` | Coral / Naranja fuego (`#F97316` → `#DC2626`) | Silueta de Camarón | `CAMARÓN` |
| **MARISCO / MOLUSCO** | `marisco`, `pulpo`, `calamar`, `anillos`, `almeja`, `mejillón`, `ostra`, `piangua`, `jaiba`, `cangrejo` | Púrpura / Ámbar marino (`#7C3AED` → `#D97706`) | Concha / Molusco | `MARISCO` |
| **PESCADO ENTERO** | `mojarra`, `pargo`, `trucha`, `corvina`, `bagre`, `bocachico`, `cachama`, `sierra`, `mero`, `robalo`, `pescado` | Cyan / Azul océano (`#0284C7` → `#1E3A8A`) | Silueta de Pez | `PESCADO` |
| **CORTE / FILETE** | `filete`, `posta`, `porción`, `medallón`, `lomo`, `trozo`, `despiece` | Esmeralda / Teal fresco (`#059669` → `#0D9488`) | Cuchillo / Fileteado | `CORTE` |
| **CONGELADO / IQF** | `congelado`, `iqf`, `bloque`, `hielo`, `escamas`, `empanada`, `apanado` | Azul Hielo / Celeste ártico (`#38BDF8` → `#2563EB`) | Copo de Nieve / Cubo | `CONGELADO` |
| **INSUMO / EMPAQUE** | `insumo`, `empaque`, `bolsa`, `caja`, `canastilla`, `termo`, `etiqueta`, `cinta` | Slate neutro (`#475569` → `#1E293B`) | Caja / Paquete | `INSUMO` |

---

### 3. Requerimientos Funcionales en Notación EARS

#### EARS-U01: Renderizado por Defecto de Avatar SVG Semántico
**Ubiquitous Requirement:**  
El sistema SIEMPRE renderizará un avatar vectorial SVG ligero generado dinámicamente en 0ms para cualquier producto que no cuente con una fotografía real subida explícitamente por el usuario.

#### EARS-U02: Sustitución Activa de Placeholders Externos Obsoletos
**Ubiquitous Requirement:**  
El sistema SIEMPRE considerará cualquier URL de Unsplash (`images.unsplash.com`) como un placeholder obsoleto y en su lugar generará y renderizará el avatar SVG semántico correspondiente a su nombre.

#### EARS-E01: Detección y Presentación de Imágenes Reales del Usuario
**Event-Driven Requirement:**  
CUANDO un producto posea una imagen real válida (cadena Base64, WebP comprimido local o archivo multimedia local subido por el usuario no perteneciente a Unsplash), el sistema mostrará dicha imagen con soporte de carga diferida (`loading="lazy"`) y fallback automático al SVG vectorial ante cualquier error de red (`onError`).

#### EARS-S02: Extracción Determinista de Siglas Legibles
**State-Driven Requirement:**  
MIENTRAS se genera el avatar SVG para un producto, el sistema extraerá las 2 o 3 siglas más representativas de su nombre omitiendo conectores en español (`de`, `del`, `la`, `el`, `en`, `y`, `a`, `con`, `sin`) para mostrarlas en tipografía condensada de alto contraste en el centro del avatar.

#### EARS-W03: Reducción de Altura para Mayor Densidad Táctil
**Wanted Requirement:**  
El componente de tarjeta de producto en el POS `ProductSearchPanel` DEBE utilizar una proporción visual más compacta (`aspect-ratio: 1.4` o altura optimizada de 95-105px) que la anterior (`aspect-ratio: 1.2`), permitiendo a los cajeros ver más filas de productos simultáneamente en pantallas táctiles sin desplazamiento vertical excesivo.

#### EARS-U04: Componente Universal Reutilizable (`ProductAvatar`)
**Ubiquitous Requirement:**  
El sistema DEBE empaquetar esta lógica de visualización en un componente React reutilizable `ProductAvatar` con soporte de variantes de tamaño (`sm`, `md`, `lg`, `xl`, `full`) para su uso transparente tanto en el POS como en tablas de inventario y modales financieros.

---

### 4. Criterios de Aceptación y QA Gate
1. **0 Descargas de Unsplash en POS:** Ningún producto en el POS debe realizar peticiones de red hacia servidores de Unsplash.
2. **0ms de Latencia & 100% Offline:** Los avatares SVG deben generarse síncronamente en memoria del cliente sin requerir conexión a internet.
3. **Contraste WCAG 2.2 AA+:** El texto de iniciales y el badge de categoría deben superar el ratio de contraste 4.5:1 contra el gradiente de fondo.
4. **Suite Vitest 100% Verde:** Todos los tests existentes (357 tests) más las nuevas pruebas unitarias del avatar y del clasificador semántico deben pasar sin errores.
5. **Auditoría DevTools MCP:** Cero errores y cero warnings en la consola JS del navegador y renderizado responsivo verificado a 375 px en vista móvil.
