---
name: pos-hardware-ux-enterprise
description: Especialista en arquitectura de Punto de Venta (POS), integración de periféricos de hardware en navegador (balanzas por Web Serial, impresoras térmicas ESC/POS, cajón monedero 24V, escáneres de código de barras GS1-128, pantalla secundaria de cliente) y ergonomía Keyboard-First de alta velocidad. Respaldado por el notebook oficial 8a874285-2ff6-4c55-8744-3a1042e3cdaa.
---

# POS Hardware & Enterprise UX Skill

Esta habilidad dota al agente y al desarrollador de los estándares de ingeniería, patrones de integración de hardware y principios ergonómicos para el módulo de **Punto de Venta (POS)** de **La Pezcaderia ERP**.

> **Fuente Oficial de Conocimiento:**  
> Notebook: `Punto de Venta (POS): Arquitectura, Hardware & UX Enterprise`  
> ID: `8a874285-2ff6-4c55-8744-3a1042e3cdaa`  
> Para consultas avanzadas ejecutar:  
> `nlm query 8a874285-2ff6-4c55-8744-3a1042e3cdaa "<consulta>"`

---

## 1. Principios de Interacción y Ergonomía (Keyboard-First)

En caja, el cajero **no debe tocar el mouse**. Cada milisegundo ahorrado reduce colas de atención y minimiza errores de digitación.

### Mapeo Estricto de Atajos de Teclado
| Tecla | Acción | Implementación en Componentes React |
| :---: | :--- | :--- |
| `F1` | Búsqueda PLU / Texto | Foco inmediato en input con `searchInputRef.current?.focus()`. |
| `F2` | Cantidad / Gramos | Abre selector numérico sobre el ítem seleccionado del carrito. |
| `F3` | Descuento | Modal con validación de porcentaje o PIN de supervisor. |
| `F4` | Aparcar Venta (Hold) | Envía el carrito a la lista de ventas suspendidas (`parkedSales`). |
| `F5` | Recuperar Venta | Lista rápida de tickets aparcados para reanudar con `Enter`. |
| `F6` | Capturar Balanza | Invoca lectura inmediata estable desde el servicio Web Serial. |
| `F8` | Anular Línea | Elimina el ítem activo y genera un log de auditoría con timestamp. |
| `F9` | Abrir Cajón sin Venta | Envía pulso `ESC p` a la impresora solicitando justificación obligatoria. |
| `F12` o `+ (Numpad)` | Cobrar / Pagar | Abre modal de selección de medios de pago y desglose de cambio. |
| `Escape` | Cerrar / Cancelar | Cierra modales activos o limpia el carrito tras confirmación. |

---

## 2. Integración de Periféricos de Hardware

### 2.1 Conexión a Balanza / Báscula (Web Serial API)
Lectura de tramas de peso continuas (Toledo, Torrey, Dibal, Systel) sin bloqueos de render:

```typescript
// Servicio de conexión serie para balanzas
export class ScaleSerialService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;

  async connect(baudRate = 9600): Promise<boolean> {
    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none' });
      return true;
    } catch (err) {
      console.error('Error al conectar balanza:', err);
      return false;
    }
  }

  async readWeight(onWeightUpdate: (weight: number, isStable: boolean) => void) {
    if (!this.port || !this.port.readable) return;
    const textDecoder = new TextDecoderStream();
    this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    let buffer = '';
    while (true) {
      const { value, done } = await this.reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split('\r\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        // Trama típica: ST,GS,+001.450kg o US,GS,+001.420kg
        const isStable = line.startsWith('ST');
        const match = line.match(/([+-]?\d+\.?\d*)\s*kg/i);
        if (match) {
          const weight = parseFloat(match[1]);
          onWeightUpdate(weight, isStable);
        }
      }
    }
  }

  async disconnect() {
    if (this.reader) await this.reader.cancel();
    if (this.port) await this.port.close();
  }
}
```

### 2.2 Impresión Térmica y Apertura de Cajón Monedero (ESC/POS)
Generación de comandos binarios para impresión de tickets térmicos (80mm / 58mm) y activación del solenoide del cajón a través del conector RJ11:

```typescript
export class EscPosBuilder {
  private buffer: number[] = [];

  init(): this {
    this.buffer.push(0x1B, 0x40); // ESC @ (Reset)
    return this;
  }

  openCashDrawer(): this {
    // ESC p m t1 t2 (Pulso de 24V al solenoide del cajón: pin 2, t1=50ms, t2=500ms)
    this.buffer.push(0x1B, 0x70, 0x00, 0x19, 0xFA);
    return this;
  }

  cutPaper(partial = false): this {
    // GS V m (0 = corte completo, 1 = corte parcial)
    this.buffer.push(0x1D, 0x56, partial ? 0x01 : 0x00);
    return this;
  }

  text(str: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    this.buffer.push(...Array.from(bytes));
    return this;
  }

  feed(lines = 3): this {
    this.buffer.push(0x1B, 0x64, lines); // ESC d n
    return this;
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
```

### 2.3 Captura de Código de Barras (Wedge Listener)
Evita la necesidad de enfocar manualmente el cursor en un input de texto:

```typescript
export function useBarcodeScanner(onBarcodeScanned: (code: string) => void) {
  useEffect(() => {
    let buffer = '';
    let lastTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const diff = now - lastTime;
      lastTime = now;

      // Si el tiempo entre teclas supera 40ms, es digitación humana y se reinicia
      if (diff > 40) {
        buffer = '';
      }

      if (e.key === 'Enter') {
        if (buffer.length >= 4) {
          e.preventDefault();
          onBarcodeScanned(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBarcodeScanned]);
}
```

### 2.4 Pantalla Secundaria para el Cliente (Customer Display)
Sincronización en tiempo real sin backend mediante `BroadcastChannel`:

```typescript
// En la vista principal del POS (Cajero)
const customerChannel = new BroadcastChannel('pos_customer_display');
export function syncWithCustomerDisplay(cart: CartItem[], total: number, weight: number) {
  customerChannel.postMessage({
    type: 'UPDATE_TICKET',
    payload: { cart, total, weight, timestamp: Date.now() }
  });
}

// En la vista secundaria (/pos-customer-display en segundo monitor)
useEffect(() => {
  const channel = new BroadcastChannel('pos_customer_display');
  channel.onmessage = (event) => {
    if (event.data.type === 'UPDATE_TICKET') {
      setDisplayData(event.data.payload);
    }
  };
  return () => channel.close();
}, []);
```

---

## 3. Resiliencia & Offline-First

1. **IndexedDB Outbox Queue (`idb`):**
   - Cuando no hay conexión a internet (`!navigator.onLine`), la venta se almacena con estado `pending_sync` y folio offline (`CONT-YYYYMMDD-XXXX`).
   - El cajero recibe el ticket impreso y el cajón se abre normalmente.
2. **Sincronización Idempotente:**
   - Un worker monitorea el evento `'online'` y envía las ventas a Supabase mediante la RPC `process_pos_sale`.
   - Se utiliza el `client_transaction_id` (UUIDv4) como clave de deduplicación para prevenir doble facturación.
3. **Auditoría de Caja Ciega:**
   - En el cierre de turno, el cajero declara el efectivo real sin ver el saldo teórico.
   - El sistema calcula la discrepancia y emite el reporte de auditoría a tesorería.

---

## 4. Checklist para Implementaciones o Modificaciones en POS

- [ ] ¿La interacción se puede completar enteramente con el teclado (`F1`-`F12`, `Numpad`)?
- [ ] ¿Los botones táctiles tienen un tamaño mínimo de **56px** y espaciado de **8px**?
- [ ] ¿La lectura de la balanza verifica la bandera de estabilidad (`ST`) antes de permitir el cobro?
- [ ] ¿La impresión térmica incluye el comando de corte `GS V 0` y la apertura de cajón `ESC p` condicional a medio de pago en efectivo?
- [ ] ¿Se cuenta con fallback offline en IndexedDB si Supabase no responde en menos de 2000 ms?
- [ ] ¿Se emite feedback sonoro (beep corto con Web Audio API) al escanear o confirmar productos?
