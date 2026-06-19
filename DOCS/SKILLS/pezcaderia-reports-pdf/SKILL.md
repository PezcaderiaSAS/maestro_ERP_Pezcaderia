---
name: pezcaderia-reports-pdf
description: Generación de reportes PDF de alto nivel para aplicaciones empresariales.
---

# High-Fidelity PDF Reporting

Este skill se enfoca en la creación de documentos PDF profesionales utilizando HTML y CSS como plantillas, integrados con la lógica del servidor.

## Estándares de Plantilla

### 1. CSS para Impresión
Asegúrate de que los estilos estén optimizados para el formato de papel (A4, Carta).

```css
@media print {
  body {
    width: 210mm;
    height: 297mm;
    margin: 10mm;
  }
  .no-print {
    display: none;
  }
}
```

### 2. Estructura de Documento Premium
Usa cabeceras y pies de página consistentes con el branding de la empresa.

```html
<header>
  <img src="logo.png" style="width: 150px;">
  <div class="header-details">
    <h1>Factura de Venta</h1>
    <p>Fecha: {{fecha}}</p>
  </div>
</header>
```

## Lógica de Inyección de Datos
Separa la generación del HTML de la conversión a PDF.

```javascript
function generatePdfReport(data) {
  const template = HtmlService.createTemplateFromFile('ReportTemplate');
  template.data = data;
  const html = template.evaluate().getContent();
  
  // Conversión a blob
  const blob = Utilities.newBlob(html, 'text/html', 'report.html');
  return blob.getAs('application/pdf');
}
```

## Recomendaciones
- **Tablas**: Usa `thead` y `tbody` correctamente para que las cabeceras se repitan en múltiples páginas si el motor lo soporta.
- **Fuentes**: Incrusta fuentes de Google Fonts vía `@import` para asegurar consistencia visual.
- **Imágenes**: Usa Base64 para imágenes pequeñas para evitar problemas de carga externa.
