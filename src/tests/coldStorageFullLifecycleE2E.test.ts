import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  coldStorageRentalService,
  DEFAULT_EMPRESA_ID,
  type InventarioCustodiaItem,
} from '../services/coldStorageRentalService';
import { coldStoragePdfService } from '../services/coldStoragePdfService';
import { cashService } from '../services/cashService';
import {
  ClienteCustodiaSchema,
  ContratoAlquilerCfSchema,
  ProductoCustodiaSchema,
  ProductoRapidoItemSchema,
  ProductosClienteBatchInputSchema,
  RecepcionMultipleInputSchema,
  DespachoMultipleInputSchema,
  calcularTotalesPartidasRecepcion,
  liquidarCausacionAlquiler,
  type PartidaRecepcion,
  type ItemDespacho,
} from '../../packages/validation-schemas/src/coldStorageRental.schema';

// Mock de jsPDF para validar la generación de documentos PDF sin entorno gráfico de Node
const mockSave = vi.fn();
vi.mock('jspdf', () => {
  return {
    jsPDF: vi.fn().mockImplementation(() => ({
      setFillColor: vi.fn(),
      rect: vi.fn(),
      roundedRect: vi.fn(),
      setTextColor: vi.fn(),
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      text: vi.fn(),
      setDrawColor: vi.fn(),
      setLineWidth: vi.fn(),
      setLineDashPattern: vi.fn(),
      line: vi.fn(),
      splitTextToSize: vi.fn((t: string) => [t]),
      save: mockSave,
    })),
  };
});

describe('E2E Full Lifecycle: Alquiler de Cuarto Frío WMS 3PL, Clientes, Productos, Entradas, Salidas, PDFs y Caja', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  // ==========================================================================
  // FASE 1: CLIENTES Y CONTRATOS (MISMA BASE DE DATOS / DIRECTORIO UNIFICADO)
  // ==========================================================================
  describe('Fase 1: Directorio Unificado de Clientes y Activación de Contratos', () => {
    it('debe registrar un cliente depositante en el directorio general y activar su contrato de alquiler', async () => {
      const clienteInput = {
        razon_social: 'Comercializadora Océano Azul SAS',
        numero_identificacion: '901.888.777-1',
        tipo_identificacion: 'NIT',
        telefono: '3109876543',
        email: 'logistica@oceanoazul.co',
        modalidad_tiempo: 'DIAS' as const,
        tarifa_pactada: 45000,
        capacidad_posiciones: 2, // 1.600 Kg nominales
        temperatura_acordada: -18.0,
      };

      const res = await coldStorageRentalService.crearClienteYContratoRapido(clienteInput);

      // Verificación de integridad de datos del cliente
      expect(res.cliente).toBeDefined();
      expect(res.cliente.id).toBeDefined();
      expect(res.cliente.razon_social).toBe('Comercializadora Océano Azul SAS');
      expect(res.cliente.numero_identificacion).toBe('901.888.777-1');
      expect(res.cliente.estado).toBe('ACTIVO');

      // Verificación de integridad del contrato
      expect(res.contrato).toBeDefined();
      expect(res.contrato.id).toBeDefined();
      expect(res.contrato.cliente_id).toBe(res.cliente.id);
      expect(res.contrato.consecutivo).toMatch(/^CF-CTO-\d{6}$/);
      expect(res.contrato.modalidad_tiempo).toBe('DIAS');
      expect(res.contrato.posiciones_contratadas).toBe(2);
      expect(res.contrato.tarifa_unitaria).toBe(45000);
      expect(res.contrato.estado).toBe('VIGENTE');

      // Comprobar que el cliente es recuperable en la consulta de clientes de custodia
      const clientesDirectorio = await coldStorageRentalService.getClientesCustodia();
      const clienteEncontrado = clientesDirectorio.find((c) => c.id === res.cliente.id);
      expect(clienteEncontrado).toBeDefined();
      expect(clienteEncontrado?.razon_social).toBe('Comercializadora Océano Azul SAS');
    });
  });

  // ==========================================================================
  // FASE 2: PRODUCTOS Y MERCANCÍA ASOCIADA (INDIVIDUAL Y MÚLTIPLE EN LOTE)
  // ==========================================================================
  describe('Fase 2: Catálogo de Productos/Mercancía Asociada al Cliente', () => {
    it('debe registrar productos de forma individual y en lote asociados al cliente con aislamiento de catálogo', async () => {
      // 1. Crear cliente
      const { cliente } = await coldStorageRentalService.crearClienteYContratoRapido({
        razon_social: 'Pescados del Pacífico Ltda',
        numero_identificacion: '800.123.456-7',
        telefono: '3157778899',
        tarifa_pactada: 650000,
        modalidad_tiempo: 'MESES',
      });

      // 2. Registro Individual de Producto
      const productoIndividual = await coldStorageRentalService.crearProductoCustodia({
        cliente_id: cliente.id,
        nombre: 'Corvina Entera Fresca',
        tipo_empaque: 'CANASTILLAS',
        tara_unitaria_kg: 2.0,
      });
      expect(productoIndividual.id).toBeDefined();
      expect(productoIndividual.cliente_id).toBe(cliente.id);
      expect(productoIndividual.nombre).toBe('Corvina Entera Fresca');

      // 3. Registro Múltiple en Lote (Batch)
      const loteProductos = [
        { nombre: 'Pargo Rojo Platero', tipo_empaque: 'CAJAS' as const, tara_unitaria_kg: 0.8 },
        { nombre: 'Camarón Tití Congelado', tipo_empaque: 'SUELTO' as const, tara_unitaria_kg: 0.0 },
        { nombre: 'Filete de Robalo al Vacío', tipo_empaque: 'CAJAS' as const, tara_unitaria_kg: 0.8 },
      ];

      const productosCreadosBatch = await coldStorageRentalService.crearProductosCustodiaBatch(
        cliente.id!,
        loteProductos
      );

      expect(productosCreadosBatch.length).toBe(3);
      productosCreadosBatch.forEach((prod, index) => {
        expect(prod.cliente_id).toBe(cliente.id);
        expect(prod.nombre).toBe(loteProductos[index].nombre);
      });

      // 4. Verificación de catálogo filtrado por cliente (deben estar los 4 productos)
      const catalogoCliente = await coldStorageRentalService.getProductosCustodia(cliente.id);
      expect(catalogoCliente.length).toBe(4);
      expect(catalogoCliente.some((p) => p.nombre === 'Corvina Entera Fresca')).toBe(true);
      expect(catalogoCliente.some((p) => p.nombre === 'Pargo Rojo Platero')).toBe(true);
      expect(catalogoCliente.some((p) => p.nombre === 'Camarón Tití Congelado')).toBe(true);
      expect(catalogoCliente.some((p) => p.nombre === 'Filete de Robalo al Vacío')).toBe(true);

      // 5. Verificación de aislamiento: otro cliente no debe ver estos productos en su filtro específico
      const catalogoOtroCliente = await coldStorageRentalService.getProductosCustodia('cliente-otro-999');
      expect(catalogoOtroCliente.length).toBe(0);
    });
  });

  // ==========================================================================
  // FASE 3: RECEPCIÓN EN BÁSCULA (ENTRADAS INDIVIDUALES Y MULTI-PARTIDA) + PDF
  // ==========================================================================
  describe('Fase 3: Recepción en Báscula, Taras Heterogéneas y Generación de PDF de Entrada', () => {
    it('debe registrar entrada consolidada con taras heterogéneas, crear inventario y generar acta PDF', async () => {
      // Setup: Cliente y Contrato
      const { cliente, contrato } = await coldStorageRentalService.crearClienteYContratoRapido({
        razon_social: 'Mariscos & Pescados La Costa SAS',
        numero_identificacion: '900.555.444-3',
        telefono: '3182223344',
        tarifa_pactada: 40000,
        modalidad_tiempo: 'DIAS',
      });

      // Planilla de pesaje en báscula con 3 partidas de diferentes productos y taras
      const partidasRecepcion: PartidaRecepcion[] = [
        {
          producto_nombre: 'Corvina Entera Calibrada',
          lote_cliente: 'LOT-CORV-01',
          tipo_empaque: 'CANASTILLAS',
          cantidad_bultos: 10,
          tara_unitaria_kg: 2.0,
          peso_tara_total_kg: 20.0,
          peso_bruto_kg: 320.0,
          peso_neto_kg: 300.0,
          temperatura_c: -18.5,
        },
        {
          producto_nombre: 'Pargo Rojo Seleccionado',
          lote_cliente: 'LOT-PARG-02',
          tipo_empaque: 'CAJAS',
          cantidad_bultos: 25,
          tara_unitaria_kg: 0.8,
          peso_tara_total_kg: 20.0,
          peso_bruto_kg: 520.0,
          peso_neto_kg: 500.0,
          temperatura_c: -19.0,
        },
        {
          producto_nombre: 'Atún Aleta Amarilla Lomo',
          lote_cliente: 'LOT-ATUN-03',
          tipo_empaque: 'SUELTO',
          cantidad_bultos: 4,
          tara_unitaria_kg: 0.0,
          peso_tara_total_kg: 0.0,
          peso_bruto_kg: 180.0,
          peso_neto_kg: 180.0,
          temperatura_c: -18.0,
        },
      ];

      // Verificación de totales calculados matemáticamente
      const totalesEsperados = calcularTotalesPartidasRecepcion(partidasRecepcion);
      expect(totalesEsperados.totalBultos).toBe(39);
      expect(totalesEsperados.totalTaraTotalKg).toBe(40.0);
      expect(totalesEsperados.totalPesoBrutoKg).toBe(1020.0);
      expect(totalesEsperados.totalPesoNetoKg).toBe(980.0);

      // Ejecutar recepción consolidada en el servicio
      const resRecepcion = await coldStorageRentalService.registrarRecepcionMultiple({
        contrato_id: contrato.id!,
        cliente_id: cliente.id!,
        transportador_nombre: 'Javier Transportador',
        transportador_cedula: '1098765432',
        placa_vehiculo: 'WHL-543',
        temperatura_camion_c: -18.2,
        observaciones: 'Llegada de camión refrigerado con precinto intacto',
        items: partidasRecepcion,
      });

      expect(resRecepcion.success).toBe(true);
      expect(resRecepcion.partidasGuardadas).toBe(3);
      expect(resRecepcion.acta_consecutivo).toMatch(/^REC-CF-\d{6}$/);
      expect(resRecepcion.inventarios.length).toBe(3);
      expect(resRecepcion.movimientos.length).toBe(3);

      // Validar que cada inventario se creó con estado activo y sus cantidades correctas
      resRecepcion.inventarios.forEach((inv, index) => {
        expect(inv.activo).toBe(true);
        expect(inv.bultos_actuales).toBe(partidasRecepcion[index].cantidad_bultos);
        expect(inv.peso_neto_actual_kg).toBe(partidasRecepcion[index].peso_neto_kg);
        expect(inv.lote_cliente).toBe(partidasRecepcion[index].lote_cliente);
      });

      // Generación del documento PDF de Acta de Recepción Consolidada
      const pdfDoc = coldStoragePdfService.generarActaRecepcionConsolidadaPdf({
        actaConsecutivo: resRecepcion.acta_consecutivo,
        contrato: {
          consecutivo: contrato.consecutivo,
          modalidad_tiempo: contrato.modalidad_tiempo,
          posiciones_contratadas: contrato.posiciones_contratadas,
          tarifa_unitaria: contrato.tarifa_unitaria,
        },
        cliente: {
          razon_social: cliente.razon_social,
          numero_identificacion: cliente.numero_identificacion,
          tipo_identificacion: cliente.tipo_identificacion,
          telefono: cliente.telefono || '',
        },
        transportadorNombre: 'Javier Transportador',
        transportadorCedula: '1098765432',
        placaVehiculo: 'WHL-543',
        temperaturaCamionC: -18.2,
        observaciones: 'Llegada de camión refrigerado con precinto intacto',
        items: partidasRecepcion,
        totales: totalesEsperados,
      });

      expect(pdfDoc).toBeDefined();
      expect(mockSave).toHaveBeenCalledWith(`Acta_Recepcion_Consolidada_${resRecepcion.acta_consecutivo}.pdf`);
    });
  });

  // ==========================================================================
  // FASE 4: DESPACHO CONSOLIDADO (SALIDAS MULTI-LOTE CON CHECKLIST) + PDF
  // ==========================================================================
  describe('Fase 4: Despacho Consolidado Multi-Lote, Descuento de Existencias y Acta PDF', () => {
    it('debe despachar existencias (total y parcial), descontar inventario y generar acta PDF de salida', async () => {
      // 1. Setup: Cliente, Contrato y Recepción de 2 partidas
      const { cliente, contrato } = await coldStorageRentalService.crearClienteYContratoRapido({
        razon_social: 'Distribuidora Oceánica del Sur',
        numero_identificacion: '901.333.222-9',
        telefono: '3114445566',
        tarifa_pactada: 50000,
        modalidad_tiempo: 'DIAS',
      });

      const resEntrada = await coldStorageRentalService.registrarRecepcionMultiple({
        contrato_id: contrato.id!,
        cliente_id: cliente.id!,
        transportador_nombre: 'Conductor Entrada',
        transportador_cedula: '12345678',
        placa_vehiculo: 'ENT-111',
        items: [
          {
            producto_nombre: 'Corvina Congelada',
            lote_cliente: 'LOTE-A',
            tipo_empaque: 'CANASTILLAS',
            cantidad_bultos: 20,
            tara_unitaria_kg: 2.0,
            peso_tara_total_kg: 40.0,
            peso_bruto_kg: 540.0,
            peso_neto_kg: 500.0,
          },
          {
            producto_nombre: 'Pargo Rojo Fresco',
            lote_cliente: 'LOTE-B',
            tipo_empaque: 'CAJAS',
            cantidad_bultos: 15,
            tara_unitaria_kg: 0.8,
            peso_tara_total_kg: 12.0,
            peso_bruto_kg: 312.0,
            peso_neto_kg: 300.0,
          },
        ],
      });

      const invA = resEntrada.inventarios[0];
      const invB = resEntrada.inventarios[1];

      // 2. Preparar Despacho Consolidado:
      // - Lote A: Retiro Total (20 bultos, 500 kg)
      // - Lote B: Retiro Parcial (5 bultos, 100 kg de los 300 kg existentes)
      const itemsDespacho: ItemDespacho[] = [
        {
          inventario_id: invA.id,
          producto_nombre: 'Corvina Congelada',
          tipo_empaque: 'CANASTILLAS',
          bultos_a_retirar: 20,
          peso_neto_a_retirar: 500.0,
          es_retiro_total: true,
        },
        {
          inventario_id: invB.id,
          producto_nombre: 'Pargo Rojo Fresco',
          tipo_empaque: 'CAJAS',
          bultos_a_retirar: 5,
          peso_neto_a_retirar: 100.0,
          es_retiro_total: false,
        },
      ];

      // 3. Ejecutar Despacho en el Servicio
      const resDespacho = await coldStorageRentalService.registrarDespachoMultiple({
        contrato_id: contrato.id!,
        cliente_id: cliente.id!,
        transportador_nombre: 'Rodrigo Conductor Salida',
        transportador_cedula: '987654321',
        placa_vehiculo: 'SAL-999',
        observaciones: 'Retiro autorizado con planilla de entrega B2B',
        items: itemsDespacho,
      });

      expect(resDespacho.success).toBe(true);
      expect(resDespacho.acta_consecutivo).toMatch(/^DSP-CF-\d{6}$/);
      expect(resDespacho.totales.totalBultosRetirados).toBe(25);
      expect(resDespacho.totales.totalKilosNetosRetirados).toBe(600.0);

      // 4. Verificar Existencias en Inventario tras el Despacho
      const existenciasActualizadas = await coldStorageRentalService.getInventarioCustodia(cliente.id);
      const rowA = existenciasActualizadas.find((i) => i.id === invA.id);
      const rowB = existenciasActualizadas.find((i) => i.id === invB.id);

      // Lote A retirado totalmente: activo = false y saldos en 0
      expect(rowA?.activo).toBe(false);
      expect(rowA?.bultos_actuales).toBe(0);
      expect(rowA?.peso_neto_actual_kg).toBe(0);

      // Lote B retirado parcialmente: saldo restante = 10 bultos y 200 kg
      expect(rowB?.activo).toBe(true);
      expect(rowB?.bultos_actuales).toBe(10);
      expect(rowB?.peso_neto_actual_kg).toBe(200.0);

      // 5. Generación del documento PDF de Acta de Despacho Consolidada
      const pdfDespacho = coldStoragePdfService.generarActaDespachoConsolidadaPdf({
        actaConsecutivo: resDespacho.acta_consecutivo,
        contrato: {
          consecutivo: contrato.consecutivo,
          modalidad_tiempo: contrato.modalidad_tiempo,
          posiciones_contratadas: contrato.posiciones_contratadas,
          tarifa_unitaria: contrato.tarifa_unitaria,
        },
        cliente: {
          razon_social: cliente.razon_social,
          numero_identificacion: cliente.numero_identificacion,
          tipo_identificacion: cliente.tipo_identificacion,
          telefono: cliente.telefono || '',
        },
        transportadorNombre: 'Rodrigo Conductor Salida',
        transportadorCedula: '987654321',
        placaVehiculo: 'SAL-999',
        observaciones: 'Retiro autorizado con planilla de entrega B2B',
        items: itemsDespacho,
        totales: resDespacho.totales,
      });

      expect(pdfDespacho).toBeDefined();
      expect(mockSave).toHaveBeenCalledWith(`Acta_Despacho_Consolidada_${resDespacho.acta_consecutivo}.pdf`);
    });
  });

  // ==========================================================================
  // FASE 5: FLUJO DE CAJA, LIQUIDACIÓN Y TESORERÍA INTEGRADA
  // ==========================================================================
  describe('Fase 5: Liquidación Contable, Flujo de Caja y Recibos Oficiales', () => {
    it('debe liquidar causación de alquiler, registrar cobro en caja y asentar saldo en turno', async () => {
      // 1. Cliente y Contrato de 1 mes (tarifa $650.000)
      const { cliente, contrato } = await coldStorageRentalService.crearClienteYContratoRapido({
        razon_social: 'Supermercados del Mar SAS',
        numero_identificacion: '900.888.999-0',
        telefono: '3123334455',
        tarifa_pactada: 650000,
        modalidad_tiempo: 'MESES',
        capacidad_posiciones: 1,
      });

      // 2. Liquidación Científica de Causación con IVA Colombia (19%)
      const liquidacion = liquidarCausacionAlquiler({
        posicionesContratadas: 1,
        tarifaUnitaria: 650000,
        modalidadTiempo: 'MESES',
        diasEfectivos: 30,
        recargoSobrecupo: 0,
        porcentajeRetefuente: 0,
      });

      expect(liquidacion.subtotalServicio).toBe(650000);
      expect(liquidacion.iva19).toBe(123500); // 650.000 * 0.19
      expect(liquidacion.totalPagar).toBe(773500); // 650.000 + 123.500

      // 3. Crear causación pendiente en el servicio
      const causacion = await coldStorageRentalService.crearCausacionIngreso({
        empresa_id: DEFAULT_EMPRESA_ID,
        contrato_id: contrato.id!,
        periodo_inicio: '2026-10-01',
        periodo_fin: '2026-10-31',
        recargo_sobrecupo: 0,
        porcentaje_retefuente: 0,
      });

      expect(causacion.estado_pago).toBe('PENDIENTE');

      // 4. Apertura de Turno de Caja para registrar el recaudo
      const turnoApertura = await cashService.abrirTurno({
        cajaId: 'caja-principal-01',
        cajeroId: 'cajero-test-01',
        montoBaseInicial: 100000, // Base en caja de $100.000
      });

      expect(turnoApertura.success).toBe(true);
      const turnoActivo = turnoApertura.datos;
      expect(turnoActivo).toBeDefined();

      // 5. Registrar Cobro del Servicio de Frío en Caja
      const reciboConsecutivo = `RC-CF-99001`;
      const resCobro = await coldStorageRentalService.registrarCobroEnCaja({
        turnoId: turnoActivo!.id,
        cajaId: turnoActivo!.cajaId,
        clienteId: cliente.id!,
        contratoId: contrato.id!,
        causacionId: causacion.id,
        monto: liquidacion.totalPagar,
        metodoPago: 'EFECTIVO',
        concepto: `Alquiler Cuarto Frío Mes Octubre 2026 - Ref: ${reciboConsecutivo}`,
        referenciaId: reciboConsecutivo,
      });

      expect(resCobro.success).toBe(true);

      // 6. Validar que la causación cambió a estado PAGADA
      const causacionesCliente = await coldStorageRentalService.getCausaciones(contrato.id);
      const causacionPagada = causacionesCliente.find((c) => c.id === causacion.id);
      expect(causacionPagada?.estado_pago).toBe('PAGADA');

      // 7. Validar que el movimiento de caja se asentó correctamente en la tesorería del ERP
      const movimientosCaja = cashService.obtenerMovimientosTurno(turnoActivo!.id);
      const movIngreso = movimientosCaja.find((m) => m.referenciaId === reciboConsecutivo);
      expect(movIngreso).toBeDefined();
      expect(movIngreso?.monto).toBe(liquidacion.totalPagar);
      expect(movIngreso?.metodoPago).toBe('EFECTIVO');

      // 8. Generación del Recibo de Pago PDF y Ticket Térmico 80mm
      const reciboCartaPdf = coldStoragePdfService.generarPdfReciboPagoAlquiler({
        consecutivo: reciboConsecutivo,
        cliente: cliente as any,
        concepto: `Alquiler Cuarto Frío Mes Octubre 2026`,
        modalidadTiempo: 'MESES',
        diasLiquidacion: 30,
        subtotal: liquidacion.subtotalServicio,
        iva: liquidacion.iva19,
        totalPagar: liquidacion.totalPagar,
        metodoPago: 'EFECTIVO',
      });
      expect(reciboCartaPdf).toBeDefined();
      expect(mockSave).toHaveBeenCalledWith(`Recibo_Alquiler_CF_${reciboConsecutivo}.pdf`);

      const ticketTermicoPdf = coldStoragePdfService.generarPdfTicketTermicoAlquiler({
        consecutivo: reciboConsecutivo,
        cliente: cliente as any,
        concepto: `Alquiler Cuarto Frío Mes Octubre 2026`,
        totalPagar: liquidacion.totalPagar,
        metodoPago: 'EFECTIVO',
      });
      expect(ticketTermicoPdf).toBeDefined();
      expect(mockSave).toHaveBeenCalledWith(`Ticket_Termico_${reciboConsecutivo}.pdf`);
    });
  });
});
