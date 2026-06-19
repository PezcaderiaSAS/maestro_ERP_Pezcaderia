---
name: pezcaderia-delivery-sync
description: Gestión de integraciones externas, autenticación HMAC-SHA256 y control de idempotencia de pedidos Rappi.
---

# Delivery Integrations & Webhooks (Rappi / External APIs)

Este skill define las directivas técnicas para implementar endpoints de webhook robustos y seguros destinados a sincronizar pedidos de canales externos en el POS de La Pezcadería.

## Autenticación HMAC-SHA256

Toda petición entrante desde plataformas externas (Rappi) debe ser validada mediante la firma criptográfica enviada en el header para mitigar vectores de suplantación de identidad.

### Implementación del Helper de Firma

```typescript
import { createHmac } from 'crypto';

export function validarFirmaRappi(
  signature: string,
  payload: string,
  secretKey: string
): boolean {
  const hmac = createHmac('sha256', secretKey);
  hmac.update(payload);
  const hash = hmac.digest('hex');
  return hash === signature;
}
```

---

## Consultas de Contexto Avanzado (Context7 API)

Si necesitas optimizar la velocidad de parsing de payloads JSON de webhooks, configurar colas de procesamiento secuencial en memoria (Memory Queue) en el frontend/backend, o implementar middleware de autenticación HMAC, consulta Context7:

```bash
# Consultar verificación de firmas HMAC SHA256 en NodeJS / Express middleware
curl -X GET "https://context7.com/api/v2/context?libraryId=/vercel/next.js&query=hmac+signature+verification+webhook+route+handler&type=txt" \
  -H "Authorization: Bearer ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887"
```

## Estándares del Webhook
- **Idempotencia Obligatoria**: El endpoint debe verificar el ID de pedido de Rappi contra el log persistido en `localDb` antes de procesar cualquier transacción (RN-22). Si ya existe, descarta y responde `HTTP 202` de forma inmediata.
- **Aislamiento de Caja**: Las ventas creadas automáticamente a través de la integración de Rappi deben asociarse al método de pago parametrizado e inhabilitar su impacto en el arqueo físico de caja de los cajeros en mostrador (RN-25).
- **Cancelaciones**: Si el payload de cancelación llega para un pedido facturado, se ejecuta automáticamente el flujo de Nota de Crédito y reversión atómica de stock físico a la bodega origen.
