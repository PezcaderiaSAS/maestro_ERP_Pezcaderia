---
name: pezcaderia-web-serial
description: Integración de balanzas de peso y hardware POS físico mediante la Web Serial API del navegador.
---

# Web Serial API Integration (Balanza & Printer)

Este skill define las pautas para interactuar con balanzas de pesaje y cajones monederos/impresoras térmicas directamente desde el navegador Chrome/Edge usando la Web Serial API.

## Lógica de Comunicación con Balanzas

El flujo consiste en abrir el puerto serie configurado, leer el buffer de datos transmitido continuamente por la balanza, parsear el peso en kilogramos y cerrar el puerto de forma segura.

### Código de Conexión Recomendado

```typescript
export async function leerPesoBalanza(puertoBalanza: SerialPort): Promise<number> {
  const reader = puertoBalanza.readable.getReader();
  let rawData = '';
  
  try {
    const { value, done } = await reader.read();
    if (value) {
      const decoder = new TextDecoder();
      rawData += decoder.decode(value);
      // Parsear formato estándar (ej: "001.350 KG\r\n" -> 1.35)
      const matches = rawData.match(/(\d+\.\d+)/);
      if (matches) {
        return parseFloat(matches[1]);
      }
    }
  } finally {
    reader.releaseLock();
  }
  throw new Error('Formato de peso inválido');
}
```

---

## Consultas de Contexto Avanzado (Context7 API)

Si necesitas obtener especificaciones de la Web Serial API, APIs de lectura de streams o compatibilidad del navegador, usa el token Bearer `ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887` para consultar a Context7:

```bash
# Consultar especificaciones de Web Serial API en Mozilla DOM docs
curl -X GET "https://context7.com/api/v2/context?libraryId=/mozilla/dom&query=web+serial+api+port+read&type=txt" \
  -H "Authorization: Bearer ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887"
```

## Estándares de Diseño
- **Timeouts**: Siempre limita la lectura a un máximo de 3 segundos (`AbortSignal`). Si expira, muestra el error descriptivo de `RN-13` para habilitar el fallback manual.
- **Liberación de Recursos**: Siempre libera el `Reader` en bloques `finally` para evitar bloquear el puerto del sistema operativo en el próximo pesaje.
