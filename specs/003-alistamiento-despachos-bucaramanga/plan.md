# Plan Técnico: Alistamiento en Frío y Despachos B2B Bucaramanga

**Módulo:** Alistamiento B2B & Despachos de Rutas Metropolitanas  
**Arquitectura:** React 18 + Zustand + Web Serial API + jsPDF Client  

---

## Fases de Implementación

### Fase 1: Localización Metropolitana de Bucaramanga en Manifiestos de Ruta
- Actualizar `RouteManifestBuilderModal.tsx` con las zonas reales del Área Metropolitana de Bucaramanga:
  1. `Cabecera & Cañaveral - Hoteles y Restaurantes Gourmet`
  2. `Floridablanca & Ruitoque - Clubes y Asadores`
  3. `Girón & Centro - Cevicherías y Pescaderías Populares`
  4. `Piedecuesta & Mensulí - Hoteles Campestres y Autoservicios`
  5. `Zona Centro & San Francisco - Mayoristas y Plazas`
  6. `Ruta Express Bucaramanga - Domicilios Urgentes`
- Actualizar presets de vehículos y conductores con nomenclatura y placas santandereanas.

### Fase 2: Pesaje Táctil en Cuarto Frío con Balanza Digital (`WeighingModal.tsx`)
- Integrar hook `useBalanza` para lectura serial con un toque.
- Botones táctiles grandes para selección rápida de tara de empaque (0 kg, 2 kg canastilla plástica, 0.5 kg caja icopor).
- Selector táctil de Lote FEFO proveniente de los lotes activos en cavas.
- Botón gigante "Guardar Peso" (verde, ≥ 52 px).

### Fase 3: Integración de Remisión WMS y Cierre de Alistamiento (`FulfillmentChecklist.tsx`)
- Al completar el pesaje de todas las líneas, activar modal de generación de remisión WMS con QR y descarga directa en PDF.
- Notificar con SweetAlert2 el despacho y actualizar el estado a `LISTO` para alimentar la hoja de ruta.

### Fase 4: Bucle DevTools Obligatorio (Pruebas y Verificación Móvil 375 px)
- Ejecutar suite de pruebas con Vitest para certificar cero regresiones.
- Ejecutar `tsc --noEmit` para garantizar cero errores de tipos.
- Inspeccionar en Chrome DevTools a 375 px `/alistamiento` y `/despachos`.
