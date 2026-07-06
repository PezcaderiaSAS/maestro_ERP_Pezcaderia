# Plan de Pruebas: La Pezcadería ERP (v2.0)

Este documento define la matriz de casos de prueba para validar el comportamiento funcional de los módulos del ERP, centrándose en el control de inventarios, workflow de cotizaciones, precios históricos y adaptabilidad.

---

## 📋 Matriz de Casos de Prueba

### Grupo A: Punto de Venta (POS) e Historial de Precios

| ID | Caso de Prueba | Descripción | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **A-1** | **Visualización de Stock Multi-Bodega** | Cargar el catálogo del POS y verificar el stock de las 3 bodegas para cada producto. | Deben mostrarse las siglas `P: [cant]`, `S: [cant]` y `A: [cant]` de manera legible y sin recortarse. |
| **A-2** | **Alerta de Stock Insuficiente** | Agregar una cantidad superior al stock disponible en la Bodega Principal en el carrito. | Debe aparecer una etiqueta roja indicando `⚠️ Insuficiente`. |
| **A-3** | **Detección de Tarifa Histórica** | Vincular un cliente y un producto con historial previo en una venta anterior. | El sistema debe mostrar un botón amarillo con la sugerencia `💡 Último precio: $X.XXX (Aplicar)`. |
| **A-4** | **Aplicación de Tarifa en Un Clic** | Hacer clic en el botón de sugerencia del precio histórico en el carrito. | El precio unitario debe actualizarse al valor histórico y mostrar la confirmación verde `✓ Tarifa histórica aplicada`. |
| **A-5** | **Deducción de Stock (POS)** | Finalizar la venta en el POS mediante el botón de pagar. | El stock de la Bodega Principal en el catálogo global debe disminuir atómicamente en la cantidad vendida. |

### Grupo B: Workflow de Cotizaciones y Roles (RBAC)

| ID | Caso de Prueba | Descripción | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **B-1** | **Creación de Proforma (Draft)** | Registrar una nueva proforma con un cliente y un conjunto de productos. | La cotización debe crearse en estado `Borrador` y calcular correctamente subtotales y descuentos. |
| **B-2** | **Restricción de Aprobación por Rol (Vendedor)** | Intentar transicionar una cotización de `Enviada` a `Aprobada` con el rol **Vendedor**. | El sistema debe bloquear la acción y mostrar una alerta SweetAlert2 indicando falta de permisos. |
| **B-3** | **Aprobación de Cotización (Admin/Administrativo)** | Cambiar el rol en el perfil a **Administrativo** y transicionar la cotización a `Aprobada`. | La cotización cambia de estado a `Aprobada` correctamente sin bloqueos. |
| **B-4** | **Deducción de Stock al Facturar (Sold)** | Transicionar una cotización aprobada a `Vendida (Sold)`. | El stock global de la Bodega Principal disminuye y el precio facturado se registra en el historial del cliente. |

### Grupo C: Generación de Imágenes con IA

| ID | Caso de Prueba | Descripción | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **C-1** | **Bloqueo por Nombre Vacío** | Abrir el formulario de edición de un producto o creación, dejar el nombre en blanco y presionar "✨ Generar con IA". | Debe mostrarse una alerta SweetAlert2 indicando que el nombre del producto es obligatorio. |
| **C-2** | **Ajuste del Prompt y Previsualización** | Con un nombre escrito (ej: "Filete de Salmón"), hacer clic en "✨ Generar con IA", editar el prompt en el cuadro de texto y dar clic en aceptar. | Se debe ver el overlay "Generando con IA..." con spinner de carga, y luego la imagen fotorrealista generada debe mostrarse en el panel izquierdo y asignarse al campo de imagen en el formulario. |

---

## 🛠️ Ejecución de Pruebas en Navegador

Para ejecutar las pruebas interactivas en tu entorno local:

1. Asegúrate de que el servidor esté activo:
   ```bash
   pnpm dev
   ```
2. Abre [http://localhost:3000](http://localhost:3000) en el navegador.
3. Sigue la secuencia de pasos descrita en la matriz de pruebas.
