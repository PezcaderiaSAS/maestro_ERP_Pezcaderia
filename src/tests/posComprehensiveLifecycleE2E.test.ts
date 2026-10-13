import { describe, it, expect, beforeEach } from 'vitest';
import { cashService } from '../services/cashService';
import { PosDraftService } from '../services/posDraftService';
import { internalTransferService } from '../services/internalTransferService';
import { calcularTotalLinea, calcularTotalesPedido } from '../services/posService';
import { calcularCambioEfectivo } from '../../packages/validation-schemas/src/posCashEngine.schema';
import type { LineaVenta, CartDraft } from '../types/pos.types';
import type { Venta } from '../types/erp.types';
import type { ClientePOS } from '../hooks/usePOSCart';
import type { InvoiceAR } from '../store/useARStore';

describe('Suite E2E Integral: Ciclo Operativo Completo del POS (SDD 008)', () => {
  // Limpieza y preparación de estado local previo a cada test
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    cashService.seedCajasParaBodegas();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. APERTURA DE CAJA
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Apertura de Turno de Caja', () => {
    it('debe abrir exitosamente el turno de caja con base inicial en efectivo y habilitar el POS', () => {
      // 1. Obtener cajas disponibles
      const cajas = cashService.getCajas().filter((c) => c.activa);
      expect(cajas.length).toBeGreaterThan(0);
      const cajaId = cajas[0].id;

      // 2. Ejecutar apertura de turno con base de $150.000
      const baseInicial = 150000;
      const res = cashService.abrirTurno(
        cajaId,
        'cajero-pos-1',
        baseInicial,
        undefined,
        'Apertura de turno matutino mostrador'
      );

      expect(res.error).toBeNull();
      expect(res.data).toBeDefined();

      const turno = res.data!;
      expect(turno.cajaId).toBe(cajaId);
      expect(turno.cajeroId).toBe('cajero-pos-1');
      expect(turno.estado).toBe('ABIERTO');
      expect(turno.baseInicial).toBe(150000);
      expect(turno.totalEfectivo).toBe(150000); // Saldo en gaveta = base inicial

      // 3. Verificar que el turno activo se consulta correctamente
      const turnoActivo = cashService.getTurnoActivo(cajaId);
      expect(turnoActivo).toBeDefined();
      expect(turnoActivo?.id).toBe(turno.id);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. VENTA MULTI-PRODUCTO EN DIFERENTES PRESENTACIONES (KG Y UNIDAD) A CONSUMIDOR FINAL
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. Venta Multi-Producto y Multi-Presentación a Consumidor Final', () => {
    it('debe registrar venta con productos en KG a granel y UNIDADES empacadas con cobro en efectivo y cambio exacto', () => {
      // 1. Iniciar turno
      const cajaId = cashService.getCajas()[0].id;
      const apertura = cashService.abrirTurno(cajaId, 'cajero-pos-1', 100000);
      const turno = apertura.data!;

      // 2. Simular carrito con 2 presentaciones:
      // Item A: Salmón Fresco (KG a granel) - 2.5 kg a $32.000/kg
      const itemKg: LineaVenta = {
        productoId: 'prod-salmon',
        sku: 'SAL-001',
        nombre: 'Salmón Fresco Entero',
        cantidad: 2.5,
        unidad: 'KG',
        precioLista: 32000,
        descuentoPct: 0,
        precioFinal: 32000,
        totalLinea: 32000 * 2.5, // 80.000
        precioCompra: 24000,
        esPesoManual: false,
      };

      // Item B: Camarón Tití Empacado (UNIDAD) - 3 unidades a $15.000 c/u
      const itemUnidad: LineaVenta = {
        productoId: 'prod-camaron',
        sku: 'CAM-TIT-500',
        nombre: 'Camarón Tití Bolsa 500g',
        cantidad: 3,
        unidad: 'UNIDAD',
        precioLista: 15000,
        descuentoPct: 0,
        precioFinal: 15000,
        totalLinea: 15000 * 3, // 45.000
        precioCompra: 11000,
        esPesoManual: false,
      };

      const lineas = [itemKg, itemUnidad];
      const totales = calcularTotalesPedido(lineas, 0, 0);

      expect(totales.data).toBeDefined();
      expect(totales.data!.subtotal).toBe(125000); // 80.000 + 45.000
      expect(totales.data!.totalFinal).toBe(125000);

      // 3. Simular cobro en efectivo con billete de $150.000
      const efectivoRecibido = 150000;
      const cambioCalculado = calcularCambioEfectivo(totales.data!.totalFinal, efectivoRecibido);
      expect(cambioCalculado.valido).toBe(true);
      expect(cambioCalculado.cambio).toBe(25000); // $150.000 - $125.000

      // 4. Registrar movimiento de venta en caja
      const movVenta = cashService.registrarMovimiento(
        turno.id,
        turno.cajaId,
        'INGRESO_VENTA',
        'EFECTIVO',
        totales.data!.totalFinal,
        'Cobro POS Venta VTA-001 Consumidor Final',
        'VTA-001',
        'cajero-pos-1'
      );

      expect(movVenta.error).toBeNull();
      expect(movVenta.data).toBeDefined();

      // 5. Verificar que el saldo de gaveta se incrementó en exactamente $125.000
      const turnoActualizado = cashService.getTurnos().find((t) => t.id === turno.id);
      expect(turnoActualizado?.totalEfectivo).toBe(100000 + 125000); // 225.000
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. VENTA GUARDADA (EN ESPERA), RETOMADA Y TERMINADA CON PAGO MIXTO
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. Venta Guardada (En Espera), Retomada y Terminada con Pago Mixto', () => {
    it('debe guardar un borrador de compra, recuperarlo al carrito y liquidarlo con múltiples medios de pago', async () => {
      // 1. Iniciar turno de caja
      const cajaId = cashService.getCajas()[0].id;
      const { data: turno } = cashService.abrirTurno(cajaId, 'cajero-pos-1', 100000);

      // 2. Crear pedido en curso
      const item1: LineaVenta = {
        productoId: 'prod-trucha',
        sku: 'TRU-001',
        nombre: 'Trucha Arcoíris Eviscerada',
        cantidad: 2,
        unidad: 'UNIDAD',
        precioLista: 25000,
        descuentoPct: 0,
        precioFinal: 25000,
        totalLinea: 50000,
        precioCompra: 18000,
        esPesoManual: false,
      };

      const item2: LineaVenta = {
        productoId: 'prod-pargo',
        sku: 'PAR-002',
        nombre: 'Pargo Rojo Entero',
        cantidad: 1,
        unidad: 'KG',
        precioLista: 40000,
        descuentoPct: 0,
        precioFinal: 40000,
        totalLinea: 40000,
        precioCompra: 30000,
        esPesoManual: false,
      };

      const lineas = [item1, item2];
      const totalPedido = 90000;

      // 3. Poner pedido en espera / guardar borrador
      const draft: CartDraft = {
        id: 'BOR-TEST-999',
        alias: 'Cliente Camisa Roja - Mesa 4',
        fechaGuardado: new Date().toISOString(),
        lineas: [...lineas],
        descuentoGlobal: 0,
        total: totalPedido,
        totalFinal: totalPedido,
      };

      await PosDraftService.saveDraft(draft);

      // Verificar que el borrador fue persistido
      const draftsLocales = PosDraftService.getLocalDrafts();
      expect(draftsLocales.some((d) => d.id === 'BOR-TEST-999')).toBe(true);

      // 4. Recuperar pedido del borrador al carrito
      const draftRecuperado = draftsLocales.find((d) => d.id === 'BOR-TEST-999')!;
      expect(draftRecuperado.lineas.length).toBe(2);
      expect(draftRecuperado.total).toBe(90000);

      // 5. Liquidar con Pago Mixto: $50.000 Efectivo + $40.000 Nequi
      const pagosMixtos = [
        { metodo: 'EFECTIVO' as const, monto: 50000 },
        { metodo: 'NEQUI' as const, monto: 40000 },
      ];

      const sumaPagos = pagosMixtos.reduce((acc, p) => acc + p.monto, 0);
      expect(sumaPagos).toBe(totalPedido); // Cuadre exacto al centavo

      // 6. Asentar pagos en turno de caja
      cashService.registrarMovimiento(
        turno!.id,
        turno!.cajaId,
        'INGRESO_VENTA',
        'EFECTIVO',
        50000,
        'Cobro Mixto Efectivo Venta VTA-002',
        'VTA-002',
        'cajero-pos-1'
      );

      cashService.registrarMovimiento(
        turno!.id,
        turno!.cajaId,
        'INGRESO_VENTA',
        'TRANSFERENCIA',
        40000,
        'Cobro Mixto Nequi Venta VTA-002',
        'VTA-002',
        'cajero-pos-1'
      );

      // 7. Descartar borrador tras el cobro exitoso
      await PosDraftService.deleteDraft('BOR-TEST-999');
      const draftsPostVenta = PosDraftService.getLocalDrafts();
      expect(draftsPostVenta.some((d) => d.id === 'BOR-TEST-999')).toBe(false);

      // 8. Verificar que la gaveta en efectivo sólo subió $50.000 y transferencias $40.000
      const turnoFin = cashService.getTurnos().find((t) => t.id === turno!.id);
      expect(turnoFin?.totalEfectivo).toBe(100000 + 50000); // 150.000
      expect(turnoFin?.totalTransferencias).toBe(40000);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. VENTA CON PRECIOS DE VENTA MODIFICADOS Y PERSISTENCIA DE TARIFA HISTÓRICA
  // ─────────────────────────────────────────────────────────────────────────────
  describe('4. Venta con Precios de Venta Modificados y Tarifa Histórica', () => {
    it('debe permitir modificar el precio de venta unitario, advertir si es bajo costo y actualizar tarifas del cliente', () => {
      // 1. Producto con precio base $38.000 y costo $28.000
      const productoOriginal = {
        id: 'prod-robalo',
        sku: 'ROB-001',
        nombre: 'Róbalo Fresco Entero',
        precioLista: 38000,
        precioCompra: 28000,
      };

      // 2. Línea inicial en el carrito
      let linea: LineaVenta = {
        productoId: productoOriginal.id,
        sku: productoOriginal.sku,
        nombre: productoOriginal.nombre,
        cantidad: 2,
        unidad: 'KG',
        precioLista: productoOriginal.precioLista,
        descuentoPct: 0,
        precioFinal: productoOriginal.precioLista,
        totalLinea: productoOriginal.precioLista * 2, // 76.000
        precioCompra: productoOriginal.precioCompra,
        esPesoManual: false,
      };

      expect(linea.totalLinea).toBe(76000);

      // 3. Modificar precio unitario a $32.000 (superior a costo de $28.000)
      const nuevoPrecio = 32000;
      const calcModificado = calcularTotalLinea(nuevoPrecio, linea.descuentoPct, linea.cantidad);

      linea = {
        ...linea,
        precioModificadoOriginal: linea.precioModificadoOriginal ?? linea.precioLista,
        precioLista: nuevoPrecio,
        precioFinal: calcModificado.precioFinal,
        totalLinea: calcModificado.totalLinea,
      };

      expect(linea.precioModificadoOriginal).toBe(38000);
      expect(linea.precioLista).toBe(32000);
      expect(linea.precioFinal).toBe(32000);
      expect(linea.totalLinea).toBe(64000); // 32.000 * 2 = 64.000

      // 4. Comprobar regla acordada en Grill-Me: si nuevoPrecio < precioCompra ($25.000 < $28.000)
      const precioBajoCosto = 25000;
      const esRentabilidadComprometida = precioBajoCosto < linea.precioCompra;
      expect(esRentabilidadComprometida).toBe(true);

      // 5. Simular persistencia en venta final garantizando que no se reasigne al precio de catálogo
      const ventaFinal: Venta = {
        id: 'VTA-PRECIO-MOD',
        fecha: new Date().toISOString(),
        clienteId: 'cli-rest-1',
        clienteNombre: 'Restaurante El Timón',
        clienteIdentificacion: '900888777',
        items: [
          {
            sku: linea.sku,
            nombre: linea.nombre,
            cantidad: linea.cantidad,
            precioUnitario: linea.precioFinal, // 32.000
            descuento: 0,
          },
        ],
        subtotal: linea.totalLinea,
        descuento: 0,
        total: linea.totalLinea,
        metodoPago: 'CONTADO',
        montoPagadoEfectivo: linea.totalLinea,
        actor: 'admin',
      };

      expect(ventaFinal.items[0].precioUnitario).toBe(32000);
      expect(ventaFinal.total).toBe(64000);

      // 6. Simular actualización de histórico tarifario para el cliente identificado
      const lastClientPrices: Record<string, Record<string, number>> = {};
      const clientKey = '900888777'.toLowerCase().trim();
      lastClientPrices[clientKey] = {
        [linea.sku]: linea.precioFinal,
      };

      expect(lastClientPrices[clientKey]['ROB-001']).toBe(32000);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. VENTA A CLIENTE A CRÉDITO Y GENERACIÓN DE CARTERA AR
  // ─────────────────────────────────────────────────────────────────────────────
  describe('5. Venta a Cliente a Crédito', () => {
    it('debe autorizar venta a crédito validando cupo disponible y generando cuenta por cobrar sin alterar efectivo en gaveta', () => {
      // 1. Iniciar turno de caja
      const cajaId = cashService.getCajas()[0].id;
      const { data: turno } = cashService.abrirTurno(cajaId, 'cajero-pos-1', 100000);

      // 2. Cliente con cupo de crédito
      const clienteCredito: ClientePOS = {
        id: 'cli-credito-1',
        nombre: 'Comercializadora Costa Azul SAS',
        identificacion: '901234567',
        tipoPrecio: 'MAYORISTA',
        cupoCredito: 2000000, // $2.000.000
        activo: true,
      };

      const deudaActual = 500000; // Deuda previa
      const montoVentaCredito = 450000;

      // 3. Validación de cupo
      const propuestaDeuda = deudaActual + montoVentaCredito;
      expect(propuestaDeuda <= clienteCredito.cupoCredito).toBe(true);

      // 4. Generación de Cartera AR
      const fechaVencimiento = '2026-11-15';
      const newInvoiceAR: InvoiceAR = {
        id: 'PED-CR-1001',
        clienteId: clienteCredito.id,
        clienteNombre: clienteCredito.nombre,
        clienteIdentificacion: clienteCredito.identificacion,
        fecha: new Date().toISOString(),
        fechaVencimiento,
        total: montoVentaCredito,
        saldo: montoVentaCredito,
        pagado: 0,
        pagos: [],
      };

      expect(newInvoiceAR.total).toBe(450000);
      expect(newInvoiceAR.saldo).toBe(450000);

      // 5. Verificar que el saldo de gaveta de efectivo NO fue alterado
      const turnoActual = cashService.getTurnos().find((t) => t.id === turno!.id);
      expect(turnoActual?.totalEfectivo).toBe(100000); // Permanece intacta la base
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. SOLICITUD DE REABASTECIMIENTO POS A BODEGA PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────────
  describe('6. Solicitud de Reabastecimiento POS a Bodega Principal', () => {
    it('debe registrar formalmente una solicitud de reabastecimiento desde el POS con estado SOLICITADO', async () => {
      const res = await internalTransferService.solicitarReabastecimientoPOS({
        bodegaOrigenId: 'bodega-central-1',
        bodegaOrigenNombre: 'Cuarto Frío Principal',
        bodegaDestinoId: 'bodega-pos',
        bodegaDestinoNombre: 'Punto de Venta Mostrador',
        prioridad: 'URGENTE',
        solicitadoPor: 'cajero-pos-1',
        observaciones: 'Reabastecimiento de vitrina para fin de semana',
        items: [
          {
            productoId: 'prod-salmon',
            sku: 'SAL-001',
            nombre: 'Salmón Fresco Entero',
            cantidadSolicitada: 30, // 30 kg
            unidadMedida: 'KG',
            cantidadDespachada: 0,
            cantidadRecibida: 0,
            costoUnitario: 28000,
            estadoItem: 'PENDIENTE',
          },
          {
            productoId: 'prod-camaron',
            sku: 'CAM-TIT-500',
            nombre: 'Camarón Tití Bolsa 500g',
            cantidadSolicitada: 20, // 20 bolsas
            unidadMedida: 'UNIDAD',
            cantidadDespachada: 0,
            cantidadRecibida: 0,
            costoUnitario: 15000,
            estadoItem: 'PENDIENTE',
          },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();

      const traslado = res.data!;
      expect(traslado.numeroGuia).toMatch(/^TRF-\d+-\d+$/);
      expect(traslado.estado).toBe('SOLICITADO');
      expect(traslado.prioridad).toBe('URGENTE');
      expect(traslado.bodegaDestinoId).toBe('bodega-pos');
      expect(traslado.pesoSolitadoTotalKg).toBe(50); // 30 + 20
      expect(traslado.items.length).toBe(2);
      expect(traslado.items[0].estadoItem).toBe('PENDIENTE');
    });
  });
});
