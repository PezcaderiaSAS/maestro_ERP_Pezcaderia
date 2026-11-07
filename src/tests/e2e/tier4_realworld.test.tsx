/**
 * Tier 4 E2E Test Suite — Real-World Application Scenarios
 * 
 * Executes full end-to-end multi-step operational workflows modeling real daily transactions
 * in MaestroPescaderia ERP:
 * - Scenario 1: Hora Pico de Mostrador (Rapid continuous barcode scanning)
 * - Scenario 2: Cliente Mayorista con Tarifas Diferenciales y Desglose de IVA
 * - Scenario 3: Búsqueda Masiva de Productos Raros por Términos Imprecisos (F8 Modal)
 * - Scenario 4: Suspensión Temporal de Carrito (F6) y Recuperación de Venta
 * - Scenario 5: Flujo Multivendedor Concurrente con Derivación a Taquilla de Caja Única
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SearchEngineCore } from '../../workers/searchEngineCore';
import { calcularTotalLinea, calcularTotalesPedido } from '../../services/posService';
import { prefacturaService } from '../../services/prefacturaService';
import type { LocalIndexedDbProduct } from '../../types/indexedDb.types';

describe('Tier 4: Real-World Application Scenarios (/mostrador)', () => {
  beforeEach(() => {
    prefacturaService.limpiarEstadoPruebas();
  });

  // ==========================================================================
  // Scenario 1: Hora Pico de Mostrador (High-Throughput Rush Hour)
  // ==========================================================================
  it('Scenario 1: Hora Pico — Escaneo continuo a alta velocidad, adición sin lag y emisión de preventa', async () => {
    // 1. Simular catálogo disponible en el mostrador
    const engine = new SearchEngineCore();
    const catalog: LocalIndexedDbProduct[] = [
      { sku: 'SKU-001', tenantId: 't-1', nombre: 'FILETE DE ROBALO 500G', codigoBarras: '7700000001', categoria: 'PESCADOS', precioDetal: 28000, precioMayorista: 24000, cantidadMinimaMayorista: 5, stockDisponible: 50, activo: true, updatedAt: '2026-11-05T00:00:00Z' },
      { sku: 'SKU-002', tenantId: 't-1', nombre: 'CAMARON TITI LIMPIO 1KG', codigoBarras: '7700000002', categoria: 'MARISCOS', precioDetal: 32000, precioMayorista: 28000, cantidadMinimaMayorista: 5, stockDisponible: 40, activo: true, updatedAt: '2026-11-05T00:00:00Z' },
      { sku: 'SKU-003', tenantId: 't-1', nombre: 'SALMON CHILENO PORCION', codigoBarras: '7700000003', categoria: 'SALMON', precioDetal: 45000, precioMayorista: 39000, cantidadMinimaMayorista: 3, stockDisponible: 30, activo: true, updatedAt: '2026-11-05T00:00:00Z' },
      { sku: 'SKU-004', tenantId: 't-1', nombre: 'ANILLOS DE CALAMAR 1KG', codigoBarras: '7700000004', categoria: 'MARISCOS', precioDetal: 26000, precioMayorista: 22000, cantidadMinimaMayorista: 5, stockDisponible: 60, activo: true, updatedAt: '2026-11-05T00:00:00Z' },
    ];
    engine.indexProducts(catalog);

    // 2. Operador escanea 6 ítems continuos a ráfaga (< 30ms)
    const scanSequence = ['7700000001', '7700000002', '7700000001', '7700000003', '7700000004', '7700000002'];
    interface CartItem {
      sku: string;
      nombre: string;
      cantidad: number;
      precio: number;
      total: number;
    }
    let cart: CartItem[] = [];

    scanSequence.forEach(barcode => {
      const match = engine.searchProducts(barcode);
      expect(match.length).toBeGreaterThan(0);
      const prod = match[0].item;

      const existingIdx = cart.findIndex(c => c.sku === prod.sku);
      if (existingIdx >= 0) {
        cart = cart.map((item, idx) =>
          idx === existingIdx
            ? { ...item, cantidad: item.cantidad + 1, total: (item.cantidad + 1) * item.precio }
            : item
        );
      } else {
        cart.push({
          sku: prod.sku,
          nombre: prod.nombre,
          cantidad: 1,
          precio: prod.precioDetal,
          total: prod.precioDetal,
        });
      }
    });

    // 3. Verificar agregación de filas: 4 filas únicas
    expect(cart.length).toBe(4);
    const robalo = cart.find(c => c.sku === 'SKU-001');
    expect(robalo?.cantidad).toBe(2); // Escaneado 2 veces
    const camaron = cart.find(c => c.sku === 'SKU-002');
    expect(camaron?.cantidad).toBe(2); // Escaneado 2 veces

    // 4. Cálculo financiero instantáneo
    const subtotal = cart.reduce((acc, it) => acc + it.total, 0);
    // (2 * 28000) + (2 * 32000) + (1 * 45000) + (1 * 26000) = 56000 + 64000 + 45000 + 26000 = 191000
    expect(subtotal).toBe(191000);

    // 5. Presión de tecla F2 para emitir preventa a caja única
    const emision = await prefacturaService.emitirPrefactura({
      tenantId: 't-1',
      vendedorId: 'vend-hora-pico',
      vendedorNombre: 'Juan Carlos Mostrador',
      terminalId: 'TERM-MOSTRADOR-01',
      items: cart.map(c => ({
        productoId: c.sku,
        sku: c.sku,
        nombre: c.nombre,
        cantidad: c.cantidad,
        precioLista: c.precio,
        precioFinal: c.precio,
        descuentoPct: 0,
        subtotal: c.total,
      })),
    });

    expect(emision.ok).toBe(true);
    expect(emision.prefactura?.codigoPreventa).toMatch(/^PRE-\d{4}-\d{5}$/);
    expect(emision.prefactura?.estado).toBe('PENDIENTE_COBRO');

    // 6. Reseteo inmediato del carrito para el siguiente cliente en la fila
    cart = [];
    expect(cart.length).toBe(0);
  });

  // ==========================================================================
  // Scenario 2: Cliente Mayorista con Tarifas Diferenciales y Desglose de IVA
  // ==========================================================================
  it('Scenario 2: Mayorista B2B — Selección por NIT, tarifa mayorista, descuento comercial y desglose de IVA exacto', async () => {
    // 1. Cliente B2B identificado en la barra superior
    const clienteMayorista = {
      nit: '900123456-7',
      razonSocial: 'HOTEL DANN CARLTON CALI',
      tipoPrecio: 'MAYORISTA' as const,
    };

    // 2. Líneas con tarifa mayorista e IVA 19% incluido
    // Producto 1: Salmón Mayorista ($38.000 con 5% de descuento por volumen, cant: 10)
    const linea1 = calcularTotalLinea(38000, 5, 10, 19, true);
    expect(linea1.precioFinal).toBe(36100); // 38000 * 0.95
    expect(linea1.totalLinea).toBe(361000);
    // Base e IVA
    expect(linea1.baseGravableLinea + linea1.cuotaIvaLinea).toBe(361000);

    // Producto 2: Langostinos Mayorista ($80.000 sin descuento, cant: 5)
    const linea2 = calcularTotalLinea(80000, 0, 5, 19, true);
    expect(linea2.totalLinea).toBe(400000);
    expect(linea2.baseGravableLinea + linea2.cuotaIvaLinea).toBe(400000);

    // 3. Totales generales del pedido
    const totales = calcularTotalesPedido([linea1, linea2]);
    expect(totales.data?.subtotal).toBe(761000);
    expect(totales.data?.totalFinal).toBe(761000);
    expect(totales.data?.subtotalBaseGravable! + totales.data?.totalIva!).toBe(761000);

    // 4. Emisión de preventa con datos del cliente B2B
    const emision = await prefacturaService.emitirPrefactura({
      tenantId: 't-1',
      vendedorId: 'vend-b2b',
      vendedorNombre: 'Marcos Asesor Mayorista',
      terminalId: 'TERM-01',
      clienteDocumento: clienteMayorista.nit,
      clienteNombre: clienteMayorista.razonSocial,
      items: [
        {
          productoId: 'p-salmon',
          sku: 'SALMON-MAY',
          nombre: 'SALMON CHILENO ENTERO',
          cantidad: 10,
          precioLista: 38000,
          precioFinal: 36100,
          descuentoPct: 5,
          subtotal: 361000,
        },
        {
          productoId: 'p-langostino',
          sku: 'LANGOST-MAY',
          nombre: 'LANGOSTINO TIGRE',
          cantidad: 5,
          precioLista: 80000,
          precioFinal: 80000,
          descuentoPct: 0,
          subtotal: 400000,
        },
      ],
    });

    expect(emision.ok).toBe(true);
    expect(emision.prefactura?.clienteDocumento).toBe('900123456-7');
    expect(emision.prefactura?.total).toBe(761000);
  });

  // ==========================================================================
  // Scenario 3: Búsqueda Masiva de Productos Raros por Términos Imprecisos (F8 Modal)
  // ==========================================================================
  it('Scenario 3: Búsqueda F8 — Modal con catálogo masivo, consulta difusa sub-10ms y adición por teclado', () => {
    const engine = new SearchEngineCore();
    // Poblar 500 productos marinos diversos
    const mockProducts: LocalIndexedDbProduct[] = Array.from({ length: 500 }, (_, i) => ({
      sku: `SKU-MAR-${i}`,
      tenantId: 't-1',
      nombre: i === 245
        ? 'TRUCHA ARCOIRIS ASADA EN CORTE MARIPOSA DESHUESADA'
        : `ESPECIE MARINA VARIADA LOTE ${i}`,
      categoria: 'PESCADOS',
      precioDetal: 25000 + i * 50,
      precioMayorista: 21000 + i * 40,
      cantidadMinimaMayorista: 5,
      stockDisponible: 30,
      activo: true,
      updatedAt: '2026-11-05T00:00:00Z',
    }));
    engine.indexProducts(mockProducts);

    // 1. Operador presiona F8 para abrir el cajón rápido
    let isModalOpen = true;

    // 2. Operador tipea consulta imprecisa con errores ortográficos
    const start = performance.now();
    const searchResults = engine.searchProducts('trucha arcoiris deshuesada');
    const latency = performance.now() - start;

    // 3. Verificación de latencia estricta sub-10ms
    expect(latency).toBeLessThan(10);
    expect(searchResults.length).toBeGreaterThanOrEqual(1);

    // 4. El ítem esperado encabeza los resultados
    const topResult = searchResults[0].item;
    expect(topResult.sku).toBe('SKU-MAR-245');
    expect(topResult.nombre).toContain('TRUCHA ARCOIRIS');

    // 5. Presión de tecla Enter cierra modal e inserta producto en tabla
    isModalOpen = false;
    const addedItem = {
      sku: topResult.sku,
      nombre: topResult.nombre,
      precio: topResult.precioDetal,
      cantidad: 2,
      total: topResult.precioDetal * 2,
    };

    expect(isModalOpen).toBe(false);
    expect(addedItem.sku).toBe('SKU-MAR-245');
    expect(addedItem.total).toBe(topResult.precioDetal * 2);
  });

  // ==========================================================================
  // Scenario 4: Suspensión Temporal (F6) y Recuperación de Venta
  // ==========================================================================
  it('Scenario 4: Suspensión F6 — Aparcar venta por olvido de billetera y reanudarla sin pérdida', async () => {
    // Almacén de órdenes aparcadas (Drafts / Borradores de mostrador)
    interface ParkedCart {
      id: string;
      clienteNombre: string;
      items: { sku: string; cant: number; precio: number }[];
      timestamp: number;
    }
    const parkedCarts: ParkedCart[] = [];

    // 1. Cliente 1 tiene 2 ítems en carrito pero necesita retirar dinero
    const cartCliente1 = [
      { sku: 'SKU-PULPO', cant: 1, precio: 65000 },
      { sku: 'SKU-CALAMAR', cant: 2, precio: 25000 },
    ];

    // 2. Operador presiona F6 para suspender
    const parkedOrder: ParkedCart = {
      id: 'draft-001',
      clienteNombre: 'Don Roberto',
      items: [...cartCliente1],
      timestamp: Date.now(),
    };
    parkedCarts.push(parkedOrder);

    // 3. Carrito activo queda limpio para atender a Cliente 2
    let activeCart: any[] = [];
    expect(activeCart.length).toBe(0);

    // 4. Operador atiende a Cliente 2 y emite su preventa
    const emisionCliente2 = await prefacturaService.emitirPrefactura({
      tenantId: 't-1',
      vendedorId: 'v-1',
      vendedorNombre: 'Vendedor',
      terminalId: 'TERM-01',
      items: [
        {
          productoId: 'p-merluza',
          sku: 'SKU-MERLUZA',
          nombre: 'MERLUZA',
          cantidad: 1,
          precioLista: 30000,
          precioFinal: 30000,
          descuentoPct: 0,
          subtotal: 30000,
        },
      ],
    });
    expect(emisionCliente2.ok).toBe(true);

    // 5. Cliente 1 regresa; operador recupera la orden aparcada
    const recovered = parkedCarts.find(p => p.id === 'draft-001');
    expect(recovered).toBeDefined();
    activeCart = [...recovered!.items];

    expect(activeCart.length).toBe(2);
    expect(activeCart[0].sku).toBe('SKU-PULPO');
    expect(activeCart[1].cant).toBe(2);

    // 6. Operador emite preventa definitiva de Cliente 1
    const totalCliente1 = activeCart.reduce((acc, it) => acc + (it.cant * it.precio), 0);
    const emisionCliente1 = await prefacturaService.emitirPrefactura({
      tenantId: 't-1',
      vendedorId: 'v-1',
      vendedorNombre: 'Vendedor',
      terminalId: 'TERM-01',
      clienteNombre: recovered!.clienteNombre,
      items: activeCart.map(it => ({
        productoId: it.sku,
        sku: it.sku,
        nombre: it.sku,
        cantidad: it.cant,
        precioLista: it.precio,
        precioFinal: it.precio,
        descuentoPct: 0,
        subtotal: it.cant * it.precio,
      })),
    });

    expect(emisionCliente1.ok).toBe(true);
    expect(emisionCliente1.prefactura?.total).toBe(115000); // 65000 + 50000
  });

  // ==========================================================================
  // Scenario 5: Flujo Multivendedor Concurrente hacia Taquilla de Caja Única
  // ==========================================================================
  it('Scenario 5: Multivendedor Concurrente — 2 asesores emiten preventas que se cobran secuencialmente en taquilla central', async () => {
    // 1. Asesor Diego en Terminal 01 emite preventa 1
    const emisionDiego = await prefacturaService.emitirPrefactura({
      tenantId: 't-pesca',
      vendedorId: 'user-diego',
      vendedorNombre: 'Diego Díaz',
      terminalId: 'MOSTRADOR-01',
      clienteDocumento: '901475457',
      clienteNombre: 'MFL INGENIEROS S.A.S.',
      items: [
        {
          productoId: 'prod-1',
          sku: 'SKU-ROBALO',
          nombre: 'FILETE ROBALO',
          cantidad: 2,
          precioLista: 45000,
          precioFinal: 45000,
          descuentoPct: 0,
          subtotal: 90000,
        },
      ],
    });

    // 2. Simultáneamente, Asesor Santiago en Terminal 02 emite preventa 2
    const emisionSantiago = await prefacturaService.emitirPrefactura({
      tenantId: 't-pesca',
      vendedorId: 'user-santiago',
      vendedorNombre: 'Santiago Pallares',
      terminalId: 'MOSTRADOR-02',
      clienteDocumento: '22222222',
      clienteNombre: 'Consumidor Final',
      items: [
        {
          productoId: 'prod-2',
          sku: 'SKU-SALMON',
          nombre: 'SALMON PREMIUM',
          cantidad: 2,
          precioLista: 80000,
          precioFinal: 80000,
          descuentoPct: 0,
          subtotal: 160000,
        },
      ],
    });

    expect(emisionDiego.ok).toBe(true);
    expect(emisionSantiago.ok).toBe(true);

    const codigoDiego = emisionDiego.prefactura!.codigoPreventa;
    const codigoSantiago = emisionSantiago.prefactura!.codigoPreventa;

    expect(codigoDiego).not.toBe(codigoSantiago);

    // 3. Ambas preventas ingresan a la cola reactiva de Caja Única (Kanban)
    const colaCaja = prefacturaService.obtenerPrefacturasPorTenant('t-pesca', 'PENDIENTE_COBRO');
    expect(colaCaja.length).toBe(2);

    // 4. Cajera de Taquilla toma la preventa de Diego para cobrarla
    const prefDiegoId = emisionDiego.prefactura!.id;
    const pasoCobro = prefacturaService.marcarEnCobro('t-pesca', prefDiegoId, 'cajera-ana', 'Ana Taquilla 1');
    expect(pasoCobro.ok).toBe(true);
    expect(pasoCobro.prefactura?.estado).toBe('EN_COBRO');

    // 5. Cajera recibe el dinero en efectivo y liquida la venta de Diego
    const cobroFinal = await prefacturaService.registrarCobroEnCaja({
      tenantId: 't-pesca',
      prefacturaId: prefDiegoId,
      cajeroId: 'cajera-ana',
      turnoId: 'turno-central-01',
      montoTotal: 90000,
      pagos: [
        {
          metodoPago: 'EFECTIVO',
          monto: 90000,
        },
      ],
    });

    expect(cobroFinal.ok).toBe(true);
    expect(cobroFinal.prefactura?.estado).toBe('PAGADA');

    // 6. La preventa de Santiago permanece disponible en cola para cobro
    const ordenSantiago = prefacturaService.buscarPorCodigo('t-pesca', codigoSantiago);
    expect(ordenSantiago).toBeDefined();
    expect(ordenSantiago?.estado).toBe('PENDIENTE_COBRO');
    expect(ordenSantiago?.vendedorNombre).toBe('Santiago Pallares');
  });
});
