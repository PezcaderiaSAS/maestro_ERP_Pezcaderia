# Especificación EARS: Alistamiento en Frío, Pesaje con Báscula y Despachos B2B Bucaramanga

**Módulo:** Alistamiento B2B & Despachos de Rutas Metropolitanas  
**Ubicación Operativa:** Bucaramanga, Santander, Colombia (Área Metropolitana: Floridablanca, Girón, Piedecuesta)  
**Estándar de Diseño:** La Regla de los 12 Años (Tactile First, botones ≥ 48px, 0 jerga técnica)  
**Versión:** 1.0.0 (Protocolo Brownfield v2.2)

---

## 1. Contexto de Negocio y Operación Local
La Pezcadería comercializa pescado fresco y mariscos al por mayor y canal HORECA (hoteles, restaurantes y cevicherías) en Bucaramanga y su área metropolitana.
El alistamiento requiere:
1. Extraer el producto de las cavas de almacenamiento refrigerado (0°C a 2°C) o congelado (-18°C).
2. Pesar en báscula digital canastilla por canastilla o filete por pieza con descuento automático de tara.
3. Asignar lote FEFO para trazabilidad sanitaria estricta.
4. Generar Remisión de Despacho WMS con código QR y token de validación.
5. Consolidar pedidos en Hojas de Ruta por zonas metropolitanas de Bucaramanga con control de temperatura de salida en furgón isotérmico.

---

## 2. Requerimientos en Notación EARS

### 2.1. Requerimientos Ubicuos (Ubiquitous)
- **EARS-U01:** El sistema siempre calculará el peso neto de cada línea de pedido deduciendo la tara de canastilla de forma automática (`peso_neto = peso_bruto - tara`).
- **EARS-U02:** El sistema siempre registrará la trazabilidad del lote FEFO seleccionado y la temperatura de refrigeración al momento de empacar el producto.
- **EARS-U03:** Todas las acciones operativas en pantalla táctil contarán con áreas táctiles mínimas de 48x48 px aptas para operarios con guantes en cuartos fríos.

### 2.2. Requerimientos Guiados por Eventos (Event-Driven)
- **EARS-E01:** *CUANDO* el operario presione el botón táctil "Capturar Báscula", *EL SISTEMA* leerá automáticamente el peso estable de la balanza digital conectada vía Web Serial API.
- **EARS-E02:** *CUANDO* el operario confirme el pesaje de todas las líneas de un pedido, *EL SISTEMA* actualizará el estado del pedido a `LISTO`, generará la Remisión WMS con código QR criptográfico y habilitará la descarga del PDF.
- **EARS-E03:** *CUANDO* el despachador seleccione pedidos para una ruta y defina conductor y vehículo, *EL SISTEMA* creará el manifiesto de entrega asignado a la zona metropolitana correspondiente (Cabecera/Cañaveral, Floridablanca/Ruitoque, Girón/Centro, Piedecuesta/Mensulí, Express BCM).

### 2.3. Requerimientos Guiados por Estado (State-Driven)
- **EARS-S01:** *MIENTRAS* un pedido se encuentre en estado `EN_ALISTAMIENTO`, *EL SISTEMA* mostrará una barra de progreso visual que indique el porcentaje de líneas pesadas y listas.
- **EARS-S02:** *MIENTRAS* la temperatura del furgón de despacho sea > 4.0°C en producto fresco, *EL SISTEMA* activará una alerta visual de semáforo rojo exigiendo encendido y estabilización del equipo Thermo King antes de autorizar la salida.

### 2.4. Comportamientos no Deseados y Manejo de Errores (Unwanted Behaviors)
- **EARS-W01:** *SI* el peso capturado es menor o igual a cero, *EL SISTEMA* bloqueará la confirmación del pesaje y alertará al operario en color ámbar.
- **EARS-W02:** *SI* un pedido tiene productos pendientes por alistar y se intenta finalizar, *EL SISTEMA* desplegará un modal SweetAlert2 preguntando si se desea pausar el alistamiento o despachar parcialmente.
- **EARS-W03:** *SI* la balanza no está conectada o no hay puerto serie disponible, *EL SISTEMA* permitirá el ingreso táctil numérico de emergencia sin bloquear la operación.

---

## 3. Criterios de Aceptación (DoD)
1. Conexión de balanza digital integrada en el modal de pesaje de alistamiento (`WeighingModal.tsx`).
2. Zonas geográficas predeterminadas adaptadas al Área Metropolitana de Bucaramanga en `RouteManifestBuilderModal.tsx`.
3. Suite de tests unitarios y de componentes pasando al 100% (cero regresiones).
4. `tsc --noEmit` con 0 errores de tipado.
5. Validación visual responsive en DevTools MCP a 375 px (vista móvil).
