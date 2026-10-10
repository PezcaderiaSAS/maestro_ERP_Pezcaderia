import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calcularPosicionesNecesarias,
  calcularSobrecupoKg,
  calcularRecargoSobrecupo,
  calcularMermaSalida,
  liquidarCausacionAlquiler,
  calcularTaraYNetoExacto,
  calcularLiquidacionDias,
  evaluarCarteraYVencimiento,
  TARAS_PREDETERMINADAS_KG,
  ContratoAlquilerCfSchema,
  ProductoCustodiaSchema,
  RecepcionCustodiaInputSchema,
  DespachoCustodiaInputSchema,
  NOMINAL_KG_POR_POSICION,
  PartidaRecepcionSchema,
  RecepcionMultipleInputSchema,
  ClienteRapidoInputSchema,
  ProductoRapidoItemSchema,
  ProductosClienteBatchInputSchema,
  ItemDespachoCustodiaSchema,
  DespachoMultipleInputSchema,
  calcularTotalesPartidasRecepcion,
} from '../../packages/validation-schemas/src/coldStorageRental.schema';
import type { PartidaRecepcion, ItemDespacho } from '../../packages/validation-schemas/src/coldStorageRental.schema';
import { coldStorageRentalService } from '../services/coldStorageRentalService';
import { coldStoragePdfService } from '../services/coldStoragePdfService';

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

describe('Módulo Alquiler de Cuarto Frío WMS 3PL - Reglas de Negocio', () => {
  describe('Cálculo Determinista de Posiciones de 800 kg', () => {
    it('debe tener una constante nominal de 800 kg por posición', () => {
      expect(NOMINAL_KG_POR_POSICION).toBe(800.0);
    });

    it('debe calcular 0 posiciones para 0 kg o valores negativos', () => {
      expect(calcularPosicionesNecesarias(0)).toBe(0);
      expect(calcularPosicionesNecesarias(-100)).toBe(0);
    });

    it('debe asignar 1 posición para cualquier peso entre 1 kg y 800 kg', () => {
      expect(calcularPosicionesNecesarias(1)).toBe(1);
      expect(calcularPosicionesNecesarias(400)).toBe(1);
      expect(calcularPosicionesNecesarias(800)).toBe(1);
    });

    it('debe asignar 2 posiciones cuando supere 800 kg así sea por 1 kg', () => {
      expect(calcularPosicionesNecesarias(800.1)).toBe(2);
      expect(calcularPosicionesNecesarias(801)).toBe(2);
      expect(calcularPosicionesNecesarias(1600)).toBe(2);
    });

    it('debe calcular correctamente múltiplos superiores (p.ej. 2401 kg = 4 posiciones)', () => {
      expect(calcularPosicionesNecesarias(1601)).toBe(3);
      expect(calcularPosicionesNecesarias(2400)).toBe(3);
      expect(calcularPosicionesNecesarias(2401)).toBe(4);
      expect(calcularPosicionesNecesarias(10000)).toBe(13);
    });
  });

  describe('Cálculo de Sobrecupo y Recargos por Kilogramo', () => {
    it('debe retornar 0 sobrecupo si el peso está dentro de la capacidad contratada', () => {
      const capacidadContratada = 2 * 800; // 1600 kg
      expect(calcularSobrecupoKg(1500, capacidadContratada)).toBe(0.0);
      expect(calcularSobrecupoKg(1600, capacidadContratada)).toBe(0.0);
      expect(calcularRecargoSobrecupo(0, 500)).toBe(0.0);
    });

    it('debe calcular con precisión los kilogramos excedentes cuando supera la capacidad', () => {
      const capacidadContratada = 800; // 1 posición
      const pesoAlmacenado = 950.5;
      const sobrecupo = calcularSobrecupoKg(pesoAlmacenado, capacidadContratada);
      expect(sobrecupo).toBe(150.5);

      const tarifaRecargo = 250; // $250 COP por kg extra
      const recargoMonetario = calcularRecargoSobrecupo(sobrecupo, tarifaRecargo);
      expect(recargoMonetario).toBe(37625.0); // 150.5 * 250
    });
  });

  describe('Cálculo de Mermas de Deshidratación en Frío', () => {
    it('debe retornar merma 0 si el peso de salida coincide con el teórico', () => {
      const { mermaKg, porcentajeMerma } = calcularMermaSalida(500, 500);
      expect(mermaKg).toBe(0.0);
      expect(porcentajeMerma).toBe(0.0);
    });

    it('debe calcular la merma en kilogramos y porcentaje si el producto perdió peso', () => {
      // 1000 kg teóricos, salen 980 kg reales -> 20 kg de merma (2%)
      const { mermaKg, porcentajeMerma } = calcularMermaSalida(1000, 980);
      expect(mermaKg).toBe(20.0);
      expect(porcentajeMerma).toBe(2.0);
    });

    it('debe manejar decimales correctamente en cálculo de merma', () => {
      // 800 kg teóricos, salen 791.5 kg reales -> 8.5 kg merma (1.06%)
      const { mermaKg, porcentajeMerma } = calcularMermaSalida(800, 791.5);
      expect(mermaKg).toBe(8.5);
      expect(porcentajeMerma).toBe(1.06);
    });
  });

  describe('Liquidación y Causación Contable (4155, 2408, 1305, 1355)', () => {
    it('debe liquidar contrato por DÍAS con IVA 19%', () => {
      // 2 posiciones a $45,000 COP/día c/u por 10 días
      const liquidacion = liquidarCausacionAlquiler({
        posicionesContratadas: 2,
        tarifaUnitaria: 45000,
        modalidadTiempo: 'DIAS',
        diasEfectivos: 10,
        recargoSobrecupo: 0,
        porcentajeRetefuente: 0,
      });

      expect(liquidacion.unidades).toBe(10);
      expect(liquidacion.subtotalServicio).toBe(900000.0); // 2 * 10 * 45000
      expect(liquidacion.baseGravable).toBe(900000.0);
      expect(liquidacion.iva19).toBe(171000.0); // 900000 * 0.19
      expect(liquidacion.retefuente).toBe(0.0);
      expect(liquidacion.totalPagar).toBe(1071000.0);
    });

    it('debe liquidar contrato por MESES con recargo de sobrecupo y retención en la fuente', () => {
      // 3 posiciones a $850,000 COP/mes por 2 meses (60 días)
      // Sobrecupo de $120,000, Retención del 4% (servicios)
      const liquidacion = liquidarCausacionAlquiler({
        posicionesContratadas: 3,
        tarifaUnitaria: 850000,
        modalidadTiempo: 'MESES',
        diasEfectivos: 60,
        recargoSobrecupo: 120000,
        porcentajeRetefuente: 4.0,
      });

      expect(liquidacion.unidades).toBe(2);
      expect(liquidacion.subtotalServicio).toBe(5100000.0); // 3 * 2 * 850000
      expect(liquidacion.baseGravable).toBe(5220000.0); // 5100000 + 120000
      expect(liquidacion.iva19).toBe(991800.0); // 5220000 * 0.19
      expect(liquidacion.retefuente).toBe(208800.0); // 5220000 * 0.04
      expect(liquidacion.totalPagar).toBe(6003000.0); // 5220000 + 991800 - 208800
    });
  });

  describe('Validaciones de Esquemas Zod', () => {
    it('debe rechazar contrato con fecha de fin anterior a la de inicio', () => {
      const payloadInvalido = {
        empresa_id: 'a0000000-0000-0000-0000-000000000001',
        consecutivo: 'CTR-CF-001',
        cliente_id: 'b0000000-0000-0000-0000-000000000001',
        cuarto_frio_id: 'c0000000-0000-0000-0000-000000000001',
        modalidad_tiempo: 'MESES',
        posiciones_contratadas: 2,
        tarifa_unitaria: 500000,
        tarifa_recargo_sobrepeso_kg: 300,
        modalidad_facturacion: 'ANTICIPADA',
        requiere_cuentas_orden: false,
        fecha_inicio: '2026-10-15',
        fecha_fin: '2026-10-10', // ANTERIOR
        estado: 'VIGENTE',
      };

      const result = ContratoAlquilerCfSchema.safeParse(payloadInvalido);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('La fecha de fin no puede ser anterior');
      }
    });

    it('debe rechazar contrato con 0 posiciones contratadas', () => {
      const payload = {
        empresa_id: 'a0000000-0000-0000-0000-000000000001',
        consecutivo: 'CTR-CF-002',
        cliente_id: 'b0000000-0000-0000-0000-000000000001',
        cuarto_frio_id: 'c0000000-0000-0000-0000-000000000001',
        modalidad_tiempo: 'DIAS',
        posiciones_contratadas: 0, // INVÁLIDO
        tarifa_unitaria: 50000,
        tarifa_recargo_sobrepeso_kg: 0,
        modalidad_facturacion: 'ANTICIPADA',
        requiere_cuentas_orden: false,
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-10-10',
        estado: 'VIGENTE',
      };

      const result = ContratoAlquilerCfSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('debe exigir peso nominal cuando la modalidad del producto es PESO_ESTABLE', () => {
      const productoInvalido = {
        empresa_id: 'a0000000-0000-0000-0000-000000000001',
        cliente_id: 'b0000000-0000-0000-0000-000000000001',
        nombre: 'Caja Salmón Congelado 20kg',
        tipo_empaque: 'CAJA_MASTER',
        modalidad_medicion: 'PESO_ESTABLE',
        peso_unitario_nominal: null, // Falta peso
        activo: true,
      };

      const result = ProductoCustodiaSchema.safeParse(productoInvalido);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('peso unitario nominal es obligatorio');
      }
    });

    it('debe rechazar pesaje en báscula donde peso bruto sea menor o igual a la tara', () => {
      const pesajeInvalido = {
        empresa_id: 'a0000000-0000-0000-0000-000000000001',
        contrato_id: 'b0000000-0000-0000-0000-000000000001',
        producto_custodia_id: 'c0000000-0000-0000-0000-000000000001',
        lote_cliente: 'LOT-2026-09-01',
        bultos: 20,
        peso_bruto_kg: 50.0,
        peso_tara_kg: 50.0, // Bruto no supera tara
        temperatura: -18.5,
        transportador_nombre: 'Carlos Gómez',
        transportador_cedula: '12345678',
        placa_vehiculo: 'ABC-123',
        operador_id: 'd0000000-0000-0000-0000-000000000001',
      };

      const result = RecepcionCustodiaInputSchema.safeParse(pesajeInvalido);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('peso bruto debe ser estrictamente mayor a la tara');
      }
    });

    it('debe aceptar recepción válida de báscula', () => {
      const recepcionValida = {
        empresa_id: 'a0000000-0000-0000-0000-000000000001',
        contrato_id: 'b0000000-0000-0000-0000-000000000001',
        producto_custodia_id: 'c0000000-0000-0000-0000-000000000001',
        lote_cliente: 'LOT-2026-09-01',
        bultos: 40,
        peso_bruto_kg: 820.0,
        peso_tara_kg: 20.0, // Neto = 800 kg
        temperatura: -19.2,
        transportador_nombre: 'Carlos Gómez',
        transportador_cedula: '12345678',
        placa_vehiculo: 'ABC-123',
        operador_id: 'd0000000-0000-0000-0000-000000000001',
        observaciones: 'Ingreso estándar en estiba plástica',
      };

      const result = RecepcionCustodiaInputSchema.safeParse(recepcionValida);
      expect(result.success).toBe(true);
    });

    it('debe validar despacho de báscula correctamente', () => {
      const despachoValido = {
        empresa_id: 'a0000000-0000-0000-0000-000000000001',
        inventario_id: 'e0000000-0000-0000-0000-000000000001',
        bultos_despacho: 20,
        peso_bruto_salida: 410.0,
        peso_tara_salida: 10.0, // Neto salida = 400 kg
        transportador_nombre: 'Andrés Pérez',
        transportador_cedula: '98765432',
        placa_vehiculo: 'XYZ-789',
        operador_id: 'd0000000-0000-0000-0000-000000000001',
      };

      const result = DespachoCustodiaInputSchema.safeParse(despachoValido);
      expect(result.success).toBe(true);
    });
  });

  describe('Generación de Documentos PDF Oficiales WMS 3PL', () => {
    beforeEach(() => {
      mockSave.mockClear();
    });

    it('debe generar el Contrato de Alquiler de Espacio Frigorífico sin errores', async () => {
      const { coldStoragePdfService } = await import('../services/coldStoragePdfService');

      const doc = coldStoragePdfService.generarPdfContratoAlquiler(
        {
          id: '123',
          empresa_id: 'emp-1',
          consecutivo: 'CTR-CF-2026-001',
          cliente_id: 'cli-1',
          cuarto_frio_id: 'cf-1',
          modalidad_tiempo: 'MESES',
          posiciones_contratadas: 2,
          tarifa_unitaria: 600000,
          tarifa_recargo_sobrepeso_kg: 200,
          modalidad_facturacion: 'ANTICIPADA',
          requiere_cuentas_orden: false,
          fecha_inicio: '2026-10-01',
          fecha_fin: '2026-12-31',
          estado: 'VIGENTE',
        },
        {
          empresa_id: 'emp-1',
          razon_social: 'Distribuidora del Caribe SAS',
          numero_identificacion: '900987654-1',
          tipo_identificacion: 'NIT',
          responsable_contacto: 'Juan Camilo Pérez',
          telefono: '3001234567',
          autorizados_retiro: [],
          estado: 'ACTIVO',
        },
        {
          empresa_id: 'emp-1',
          codigo: 'CF-TUNEL',
          nombre: 'Túnel de Congelación Principal',
          temperatura_setpoint: -20.0,
          capacidad_total_posiciones: 20,
          activo: true,
        }
      );

      expect(doc).toBeDefined();
      expect(mockSave).toHaveBeenCalledWith('Contrato_Alquiler_CTR-CF-2026-001.pdf');
    });

    it('debe generar Acta de Recepción e Ingreso en Custodia', async () => {
      const { coldStoragePdfService } = await import('../services/coldStoragePdfService');

      const doc = coldStoragePdfService.generarPdfActaRecepcion({
        movimiento: {
          id: 'mov-1',
          empresa_id: 'emp-1',
          inventario_custodia_id: 'inv-1',
          tipo_movimiento: 'ENTRADA',
          consecutivo_acta: 'ACT-REC-20260928-101',
          fecha_movimiento: new Date().toISOString(),
          bultos: 40,
          peso_bruto_kg: 820.0,
          peso_tara_kg: 20.0,
          peso_neto_kg: 800.0,
          temperatura_medida: -19.5,
          merma_kg: 0,
          transportador_nombre: 'Pedro Navaja',
          transportador_cedula: '11223344',
          placa_vehiculo: 'WKL-999',
        },
        inventario: {
          id: 'inv-1',
          empresa_id: 'emp-1',
          contrato_id: 'ctr-1',
          cliente_id: 'cli-1',
          producto_custodia_id: 'prod-1',
          lote_cliente: 'LOT-SALM-001',
          fecha_ingreso: new Date().toISOString(),
          fecha_vencimiento: '2027-09-28',
          bultos_iniciales: 40,
          bultos_actuales: 40,
          peso_neto_inicial_kg: 800,
          peso_neto_actual_kg: 800,
          activo: true,
          creado_en: '',
          actualizado_en: '',
        },
        cliente: {
          empresa_id: 'emp-1',
          razon_social: 'Mariscos Gourmet Ltda',
          numero_identificacion: '800111222-3',
          tipo_identificacion: 'NIT',
          autorizados_retiro: [],
          estado: 'ACTIVO',
        },
        producto: {
          empresa_id: 'emp-1',
          cliente_id: 'cli-1',
          nombre: 'Filete de Salmón Chileno Premium',
          tipo_empaque: 'CAJA_MASTER',
          modalidad_medicion: 'PESO_ESTABLE',
          peso_unitario_nominal: 20.0,
          temperatura_optima: '-18C a -22C',
          activo: true,
        },
      });

      expect(doc).toBeDefined();
      expect(mockSave).toHaveBeenCalledWith('Acta_Recepcion_ACT-REC-20260928-101.pdf');
    });

    it('debe generar Acta de Despacho con balance de remanente y merma', async () => {
      const { coldStoragePdfService } = await import('../services/coldStoragePdfService');

      const doc = coldStoragePdfService.generarPdfActaDespacho({
        movimiento: {
          id: 'mov-2',
          empresa_id: 'emp-1',
          inventario_custodia_id: 'inv-1',
          tipo_movimiento: 'SALIDA',
          consecutivo_acta: 'ACT-DESP-20260928-202',
          fecha_movimiento: new Date().toISOString(),
          bultos: 20,
          peso_bruto_kg: 405.0,
          peso_tara_kg: 10.0,
          peso_neto_kg: 395.0,
          merma_kg: 5.0,
          transportador_nombre: 'Mario Silva',
          transportador_cedula: '77665544',
          placa_vehiculo: 'TRK-555',
        },
        inventario: {
          id: 'inv-1',
          empresa_id: 'emp-1',
          contrato_id: 'ctr-1',
          cliente_id: 'cli-1',
          producto_custodia_id: 'prod-1',
          lote_cliente: 'LOT-SALM-001',
          fecha_ingreso: new Date().toISOString(),
          bultos_iniciales: 40,
          bultos_actuales: 20,
          peso_neto_inicial_kg: 800,
          peso_neto_actual_kg: 400,
          activo: true,
          creado_en: '',
          actualizado_en: '',
        },
        cliente: {
          empresa_id: 'emp-1',
          razon_social: 'Mariscos Gourmet Ltda',
          numero_identificacion: '800111222-3',
          tipo_identificacion: 'NIT',
          autorizados_retiro: [],
          estado: 'ACTIVO',
        },
        producto: {
          empresa_id: 'emp-1',
          cliente_id: 'cli-1',
          nombre: 'Filete de Salmón Chileno Premium',
          tipo_empaque: 'CAJA_MASTER',
          modalidad_medicion: 'PESO_ESTABLE',
          temperatura_optima: '-18C a -22C',
          activo: true,
        },
        remanenteBultos: 20,
        remanentePesoKg: 400.0,
      });

      expect(doc).toBeDefined();
      expect(mockSave).toHaveBeenCalledWith('Acta_Despacho_ACT-DESP-20260928-202.pdf');
    });

    it('debe emitir Certificado Oficial de Existencias en Custodia', async () => {
      const { coldStoragePdfService } = await import('../services/coldStoragePdfService');

      const doc = coldStoragePdfService.generarPdfCertificadoCustodia({
        cliente: {
          empresa_id: 'emp-1',
          razon_social: 'Pescados del Pacífico SAS',
          numero_identificacion: '901555666-4',
          tipo_identificacion: 'NIT',
          autorizados_retiro: [],
          estado: 'ACTIVO',
        },
        inventarioItems: [
          {
            id: 'inv-1',
            empresa_id: 'emp-1',
            contrato_id: 'ctr-1',
            cliente_id: 'cli-1',
            producto_custodia_id: 'prod-1',
            lote_cliente: 'LOT-CORV-01',
            fecha_ingreso: '2026-09-10',
            bultos_iniciales: 30,
            bultos_actuales: 30,
            peso_neto_inicial_kg: 600,
            peso_neto_actual_kg: 600,
            activo: true,
            creado_en: '',
            actualizado_en: '',
            producto: { nombre: 'Corvina Entera Eviscerada', tipo_empaque: 'Caja', modalidad_medicion: 'SOLO_PESO' },
          },
        ],
        fechaCorte: '2026-09-28',
      });

      expect(doc).toBeDefined();
      expect(mockSave).toHaveBeenCalledWith('Certificado_Custodia_901555666-4_2026-09-28.pdf');
    });

    it('debe generar el Recibo Oficial de Caja y Paz y Salvo en formato ejecutivo carta', async () => {
      const { coldStoragePdfService } = await import('../services/coldStoragePdfService');
      const doc = coldStoragePdfService.generarPdfReciboPagoAlquiler({
        consecutivo: 'RC-CF-2026-001',
        cliente: {
          empresa_id: 'emp-1',
          razon_social: 'Distribuidora del Caribe SAS',
          numero_identificacion: '900111222-3',
          tipo_identificacion: 'NIT',
          autorizados_retiro: [],
          estado: 'ACTIVO',
        },
        concepto: 'Alquiler de cuarto frío mes de octubre (1 posición 800 kg)',
        subtotal: 650000,
        iva: 123500,
        retefuente: 26000,
        totalPagar: 747500,
        metodoPago: 'TRANSFERENCIA',
        referenciaCaja: 'CAJA-BODEGA-01',
        cajeroNombre: 'Yurgen Martinez',
      });

      expect(doc).toBeDefined();
      expect(mockSave).toHaveBeenCalledWith('Recibo_Caja_RC-CF-2026-001.pdf');
    });

    it('debe generar el Ticket Térmico de Caja POS en formato rollo 80mm', async () => {
      const { coldStoragePdfService } = await import('../services/coldStoragePdfService');
      const doc = coldStoragePdfService.generarPdfTicketTermicoAlquiler({
        consecutivo: 'TCK-CF-0042',
        cliente: {
          empresa_id: 'emp-1',
          razon_social: 'Pescados y Mariscos La Herradura',
          numero_identificacion: '800999888-1',
          tipo_identificacion: 'NIT',
          autorizados_retiro: [],
          estado: 'ACTIVO',
        },
        concepto: 'Liquidación 3 días almacenamiento (450 kg corvina)',
        totalPagar: 202500,
        metodoPago: 'EFECTIVO',
      });

      expect(doc).toBeDefined();
      expect(mockSave).toHaveBeenCalledWith('Ticket_TCK-CF-0042.pdf');
    });
  });

  describe('Cálculo Milimétrico de Tara y Peso Neto por Empaque (Cajas, Canastillas, Suelto)', () => {
    it('debe tener taras estándar calibradas para cada embalaje', () => {
      expect(TARAS_PREDETERMINADAS_KG.CANASTILLAS).toBe(2.0);
      expect(TARAS_PREDETERMINADAS_KG.CAJAS).toBe(0.8);
      expect(TARAS_PREDETERMINADAS_KG.SUELTO).toBe(0.0);
    });

    it('debe calcular correctamente la tara de 10 canastillas estándar y el neto', () => {
      // 10 canastillas * 2.0 kg = 20 kg tara. Bruto 320 kg -> Neto 300.00 kg
      const res = calcularTaraYNetoExacto({
        tipoEmpaque: 'CANASTILLAS',
        cantidadBultos: 10,
        pesoBrutoKg: 320,
      });

      expect(res.esValido).toBe(true);
      expect(res.taraUnitaria).toBe(2.0);
      expect(res.taraTotalKg).toBe(20.0);
      expect(res.pesoNetoKg).toBe(300.0);
    });

    it('debe permitir calibrar tara unitaria personalizada por cliente con precisión milimétrica', () => {
      // Canastilla pesada a 2.15 kg c/u. 15 canastillas = 32.25 kg tara. Bruto 450.75 kg -> Neto 418.50 kg
      const res = calcularTaraYNetoExacto({
        tipoEmpaque: 'CANASTILLAS',
        cantidadBultos: 15,
        pesoBrutoKg: 450.75,
        taraUnitariaConfigurada: 2.15,
      });

      expect(res.esValido).toBe(true);
      expect(res.taraUnitaria).toBe(2.15);
      expect(res.taraTotalKg).toBe(32.25);
      expect(res.pesoNetoKg).toBe(418.5);
    });

    it('debe calcular empaque en cajas con tara estándar o personalizada', () => {
      // 25 cajas * 0.8 kg = 20 kg tara. Bruto 520 kg -> Neto 500 kg
      const res = calcularTaraYNetoExacto({
        tipoEmpaque: 'CAJAS',
        cantidadBultos: 25,
        pesoBrutoKg: 520,
      });

      expect(res.esValido).toBe(true);
      expect(res.taraTotalKg).toBe(20.0);
      expect(res.pesoNetoKg).toBe(500.0);
    });

    it('debe admitir pesaje suelto a granel con tara cero o tara de tina', () => {
      const res = calcularTaraYNetoExacto({
        tipoEmpaque: 'SUELTO',
        cantidadBultos: 1,
        pesoBrutoKg: 850.55,
      });

      expect(res.esValido).toBe(true);
      expect(res.taraTotalKg).toBe(0.0);
      expect(res.pesoNetoKg).toBe(850.55);
    });

    it('debe rechazar pesaje si el peso bruto no supera la tara', () => {
      // 10 canastillas = 20 kg tara, pero bruto solo 18 kg
      const res = calcularTaraYNetoExacto({
        tipoEmpaque: 'CANASTILLAS',
        cantidadBultos: 10,
        pesoBrutoKg: 18,
      });

      expect(res.esValido).toBe(false);
      expect(res.pesoNetoKg).toBe(0);
      expect(res.error).toContain('debe ser mayor a la tara total');
    });

    it('debe rechazar cero bultos en cajas o canastillas', () => {
      const res = calcularTaraYNetoExacto({
        tipoEmpaque: 'CANASTILLAS',
        cantidadBultos: 0,
        pesoBrutoKg: 100,
      });

      expect(res.esValido).toBe(false);
      expect(res.error).toContain('al menos 1 unidad');
    });
  });

  describe('Liquidación de Almacenamiento Frigorífico por DÍAS', () => {
    it('debe liquidar tarifa por kilogramos netos y días efectivos con IVA', () => {
      // 1000 kg netos, 5 días de frío, tarifa $150 COP por kg/día
      // Subtotal = 1000 * 5 * 150 = $750,000 COP
      // IVA 19% = $142,500 COP
      // Total = $892,500 COP
      const res = calcularLiquidacionDias({
        fechaIngreso: '2026-10-01',
        fechaSalida: '2026-10-06',
        pesoNetoKg: 1000,
        tarifaDia: 150,
        baseCobro: 'KILOGRAMOS',
        cobrarIva: true,
      });

      expect(res.diasCustodia).toBe(5);
      expect(res.subtotal).toBe(750000);
      expect(res.iva).toBe(142500);
      expect(res.totalPagar).toBe(892500);
    });

    it('debe liquidar tarifa por posiciones (800 kg c/u) y días efectivos', () => {
      // 1500 kg netos -> 2 posiciones (800 kg c/u)
      // 3 días de frío a $25,000 COP por posición/día
      // Subtotal = 2 * 3 * 25,000 = $150,000 COP
      // IVA 19% = $28,500 COP
      // Retefuente 4% = $6,000 COP
      // Total = $172,500 COP
      const res = calcularLiquidacionDias({
        fechaIngreso: '2026-10-01',
        fechaSalida: '2026-10-04',
        pesoNetoKg: 1500,
        tarifaDia: 25000,
        baseCobro: 'POSICIONES',
        cobrarIva: true,
        porcentajeRetefuente: 4,
      });

      expect(res.diasCustodia).toBe(3);
      expect(res.unidadesCobro).toBe(2);
      expect(res.subtotal).toBe(150000);
      expect(res.iva).toBe(28500);
      expect(res.retefuente).toBe(6000);
      expect(res.totalPagar).toBe(172500);
    });

    it('debe computar mínimo 1 día de almacenamiento si entra y sale el mismo día', () => {
      const res = calcularLiquidacionDias({
        fechaIngreso: '2026-10-05',
        fechaSalida: '2026-10-05',
        pesoNetoKg: 500,
        tarifaDia: 200,
        cobrarIva: false,
      });

      expect(res.diasCustodia).toBe(1);
      expect(res.subtotal).toBe(100000); // 500 * 1 * 200
      expect(res.totalPagar).toBe(100000);
    });
  });

  describe('Semáforo y Evaluación de Cartera / Vencimientos de Mensualidades', () => {
    it('debe retornar AL_DIA si la causación ya fue pagada', () => {
      const sem = evaluarCarteraYVencimiento({
        fechaCorteMensualidad: '2026-09-30',
        valorMensualidad: 650000,
        estadoPago: 'PAGADA',
      });

      expect(sem.estadoSemaforo).toBe('AL_DIA');
      expect(sem.saldoPendiente).toBe(0);
      expect(sem.diasMora).toBe(0);
    });

    it('debe detectar EN_MORA con los días exactos si la fecha de corte venció', () => {
      const sem = evaluarCarteraYVencimiento({
        fechaCorteMensualidad: '2026-10-01',
        fechaActual: '2026-10-10',
        valorMensualidad: 650000,
        estadoPago: 'PENDIENTE',
      });

      expect(sem.estadoSemaforo).toBe('EN_MORA');
      expect(sem.diasMora).toBe(9);
      expect(sem.saldoPendiente).toBe(650000);
      expect(sem.mensajeAlerta).toContain('9 días de mora');
    });

    it('debe alertar POR_VENCER si vence hoy o en los próximos 3 días', () => {
      const sem = evaluarCarteraYVencimiento({
        fechaCorteMensualidad: '2026-10-10',
        fechaActual: '2026-10-10',
        valorMensualidad: 650000,
        estadoPago: 'PENDIENTE',
      });

      expect(sem.estadoSemaforo).toBe('POR_VENCER');
      expect(sem.diasMora).toBe(0);
      expect(sem.mensajeAlerta).toBe('Vence hoy');
    });
  });

  describe('Recepción Múltiple, Creación Express y Despacho Consolidado WMS 3PL (Fase SDD 006)', () => {
    describe('Cálculo Gravimétrico Consolidado de Partidas Múltiples con Taras Heterogéneas', () => {
      it('debe consolidar exactamente un producto registrado 3 veces con canastillas, cajas y suelto', () => {
        const partidas: PartidaRecepcion[] = [
          {
            producto_nombre: 'Corvina Entera Congelada',
            lote_cliente: 'LOT-CORV-01',
            temperatura_c: -18.0,
            tipo_empaque: 'CANASTILLAS',
            cantidad_bultos: 10,
            tara_unitaria_kg: 2.0,
            peso_tara_total_kg: 20.0,
            peso_bruto_kg: 220.0,
            peso_neto_kg: 200.0,
          },
          {
            producto_nombre: 'Corvina Entera Congelada',
            lote_cliente: 'LOT-CORV-02',
            temperatura_c: -18.0,
            tipo_empaque: 'CAJAS',
            cantidad_bultos: 5,
            tara_unitaria_kg: 0.8,
            peso_tara_total_kg: 4.0,
            peso_bruto_kg: 104.0,
            peso_neto_kg: 100.0,
          },
          {
            producto_nombre: 'Corvina Entera Congelada',
            lote_cliente: 'LOT-CORV-03',
            temperatura_c: -18.0,
            tipo_empaque: 'SUELTO',
            cantidad_bultos: 0,
            tara_unitaria_kg: 0.0,
            peso_tara_total_kg: 0.0,
            peso_bruto_kg: 50.5,
            peso_neto_kg: 50.5,
          },
        ];

        const totales = calcularTotalesPartidasRecepcion(partidas);

        expect(totales.totalBultos).toBe(15);
        expect(totales.totalPesoBrutoKg).toBe(374.5);
        expect(totales.totalTaraTotalKg).toBe(24.0);
        expect(totales.totalPesoNetoKg).toBe(350.5);

        // Resumen por producto
        const resumenProd = totales.resumenPorProducto['CORVINA ENTERA CONGELADA'];
        expect(resumenProd).toBeDefined();
        expect(resumenProd.bultos).toBe(15);
        expect(resumenProd.pesoNetoKg).toBe(350.5);
        expect(resumenProd.partidasCount).toBe(3);

        // Resumen por empaque
        expect(totales.resumenPorEmpaque.CANASTILLAS.bultos).toBe(10);
        expect(totales.resumenPorEmpaque.CANASTILLAS.pesoNetoKg).toBe(200.0);
        expect(totales.resumenPorEmpaque.CAJAS.bultos).toBe(5);
        expect(totales.resumenPorEmpaque.CAJAS.pesoNetoKg).toBe(100.0);
        expect(totales.resumenPorEmpaque.SUELTO.bultos).toBe(0);
        expect(totales.resumenPorEmpaque.SUELTO.pesoNetoKg).toBe(50.5);
      });

      it('debe validar la estructura de cada partida con PartidaRecepcionSchema', () => {
        const itemValido = {
          producto_nombre: 'Filete de Tilapia',
          tipo_empaque: 'CANASTILLAS',
          cantidad_bultos: 8,
          tara_unitaria_kg: 2.0,
          peso_tara_total_kg: 16.0,
          peso_bruto_kg: 176.0,
          peso_neto_kg: 160.0,
        };

        const parsed = PartidaRecepcionSchema.safeParse(itemValido);
        expect(parsed.success).toBe(true);

        const itemInvalido = {
          producto_nombre: '',
          tipo_empaque: 'CANASTILLAS',
          cantidad_bultos: -5,
          tara_unitaria_kg: 2.0,
          peso_tara_total_kg: 10.0,
          peso_bruto_kg: 5.0,
          peso_neto_kg: -5.0,
        };
        const parsedInv = PartidaRecepcionSchema.safeParse(itemInvalido);
        expect(parsedInv.success).toBe(false);
      });
    });

    describe('Creación Rápida de Cliente Express in-situ (15 Segundos)', () => {
      it('debe validar y crear cliente y contrato rápido con ClienteRapidoInputSchema', async () => {
        const input = {
          razon_social: 'Distribuidora del Caribe SAS',
          numero_identificacion: '901888777-2',
          tipo_identificacion: 'NIT',
          telefono: '3109998888',
          email: 'logistica@delcaribe.co',
          modalidad_tiempo: 'DIAS' as const,
          tarifa_pactada: 45000,
          capacidad_posiciones: 2,
          temperatura_acordada: -18.0,
        };

        const validated = ClienteRapidoInputSchema.parse(input);
        expect(validated.razon_social).toBe('Distribuidora del Caribe SAS');

        const resultado = await coldStorageRentalService.crearClienteYContratoRapido(input);

        expect(resultado.cliente).toBeDefined();
        expect(resultado.cliente.id).toBeDefined();
        expect(resultado.cliente.razon_social).toBe('Distribuidora del Caribe SAS');
        expect(resultado.cliente.estado).toBe('ACTIVO');

        expect(resultado.contrato).toBeDefined();
        expect(resultado.contrato.id).toBeDefined();
        expect(resultado.contrato.consecutivo).toContain('CF-CTO-');
        expect(resultado.contrato.posiciones_contratadas).toBe(2);
        expect(resultado.contrato.tarifa_unitaria).toBe(45000);
        expect(resultado.contrato.estado).toBe('VIGENTE');
      });
    });

    describe('Registro de Recepción Múltiple Consolidada en Servicio', () => {
      it('debe guardar recepción múltiple retornando consecutivo de acta y totales consolidados', async () => {
        const recepcionInput = {
          contrato_id: 'contrato-mock-123',
          cliente_id: 'cliente-mock-456',
          transportador_nombre: 'Carlos Conductor',
          transportador_cedula: '1098765432',
          placa_vehiculo: 'WKL-890',
          temperatura_camion_c: -19.5,
          observaciones: 'Descargue en rampa frigorífica 1',
          items: [
            {
              producto_nombre: 'Pargo Rojo Entero',
              lote_cliente: 'LOT-PRG-01',
              temperatura_c: -18.5,
              tipo_empaque: 'CANASTILLAS' as const,
              cantidad_bultos: 12,
              tara_unitaria_kg: 2.0,
              peso_tara_total_kg: 24.0,
              peso_bruto_kg: 264.0,
              peso_neto_kg: 240.0,
            },
            {
              producto_nombre: 'Pargo Rojo Entero',
              lote_cliente: 'LOT-PRG-02',
              temperatura_c: -18.5,
              tipo_empaque: 'CAJAS' as const,
              cantidad_bultos: 4,
              tara_unitaria_kg: 0.8,
              peso_tara_total_kg: 3.2,
              peso_bruto_kg: 83.2,
              peso_neto_kg: 80.0,
            },
          ],
        };

        const res = await coldStorageRentalService.registrarRecepcionMultiple(recepcionInput);

        expect(res.success).toBe(true);
        expect(res.acta_consecutivo).toContain('REC-CF-');
        expect(res.partidasGuardadas).toBe(2);
        expect(res.totales.totalBultos).toBe(16);
        expect(res.totales.totalPesoBrutoKg).toBe(347.2);
        expect(res.totales.totalTaraTotalKg).toBe(27.2);
        expect(res.totales.totalPesoNetoKg).toBe(320.0);
        expect(res.inventarios.length).toBe(2);
        expect(res.movimientos.length).toBe(2);
      });
    });

    describe('Registro de Despacho Múltiple Consolidado en Servicio', () => {
      it('debe procesar retiro total y parcial con consecutivo único de despacho', async () => {
        const itemsDespacho: ItemDespacho[] = [
          {
            inventario_id: 'inv-lote-1',
            producto_nombre: 'Pargo Rojo Entero',
            tipo_empaque: 'CANASTILLAS',
            bultos_a_retirar: 12,
            peso_neto_a_retirar: 240.0,
            es_retiro_total: true,
          },
          {
            inventario_id: 'inv-lote-2',
            producto_nombre: 'Corvina Entera',
            tipo_empaque: 'CAJAS',
            bultos_a_retirar: 2,
            peso_neto_a_retirar: 40.0,
            es_retiro_total: false,
          },
        ];

        const despachoInput = {
          contrato_id: 'contrato-mock-123',
          cliente_id: 'cliente-mock-456',
          transportador_nombre: 'Marcos Retiro',
          transportador_cedula: '79888999',
          placa_vehiculo: 'SST-345',
          items: itemsDespacho,
          observaciones: 'Despacho para distribución local',
          autorizar_salida_mora: false,
        };

        const res = await coldStorageRentalService.registrarDespachoMultiple(despachoInput);

        expect(res.success).toBe(true);
        expect(res.acta_consecutivo).toContain('DSP-CF-');
        expect(res.totalBultosDespachados).toBe(14);
        expect(res.totalPesoDespachadoKg).toBe(280.0);
        expect(res.itemsProcesados).toBe(2);
        expect(res.movimientos.length).toBe(2);
      });
    });

    describe('Generación de Documentos PDF Multi-Partida', () => {
      it('debe generar Acta Consolidada de Recepción con tabla de múltiples pesadas', () => {
        const doc = coldStoragePdfService.generarPdfActaRecepcionMultiple({
          actaConsecutivo: 'REC-CF-99001',
          cliente: {
            empresa_id: 'emp-1',
            razon_social: 'Distribuidora del Caribe SAS',
            numero_identificacion: '901888777-2',
            tipo_identificacion: 'NIT',
            autorizados_retiro: [],
            estado: 'ACTIVO',
          },
          transportadorNombre: 'Carlos Conductor',
          transportadorCedula: '1098765432',
          placaVehiculo: 'WKL-890',
          temperaturaC: -19.5,
          items: [
            {
              producto_nombre: 'Corvina Entera',
              lote_cliente: 'LOT-CORV-01',
              temperatura_c: -18.0,
              tipo_empaque: 'CANASTILLAS',
              cantidad_bultos: 10,
              tara_unitaria_kg: 2.0,
              peso_tara_total_kg: 20.0,
              peso_bruto_kg: 220.0,
              peso_neto_kg: 200.0,
            },
            {
              producto_nombre: 'Corvina Entera',
              lote_cliente: 'LOT-CORV-02',
              temperatura_c: -18.0,
              tipo_empaque: 'CAJAS',
              cantidad_bultos: 5,
              tara_unitaria_kg: 0.8,
              peso_tara_total_kg: 4.0,
              peso_bruto_kg: 104.0,
              peso_neto_kg: 100.0,
            },
          ],
        });

        expect(doc).toBeDefined();
        expect(mockSave).toHaveBeenCalledWith('Acta_Recepcion_Consolidada_REC-CF-99001.pdf');
      });

      it('debe generar Acta Consolidada de Despacho con múltiples lotes', () => {
        const doc = coldStoragePdfService.generarPdfActaDespachoMultiple({
          actaConsecutivo: 'DSP-CF-77002',
          cliente: {
            empresa_id: 'emp-1',
            razon_social: 'Distribuidora del Caribe SAS',
            numero_identificacion: '901888777-2',
            tipo_identificacion: 'NIT',
            autorizados_retiro: [],
            estado: 'ACTIVO',
          },
          transportadorNombre: 'Marcos Retiro',
          transportadorCedula: '79888999',
          placaVehiculo: 'SST-345',
          items: [
            {
              inventario_id: 'inv-1',
              producto_nombre: 'Corvina Entera',
              tipo_empaque: 'CANASTILLAS',
              bultos_a_retirar: 10,
              peso_neto_a_retirar: 200.0,
              es_retiro_total: true,
            },
          ],
        });

        expect(doc).toBeDefined();
        expect(mockSave).toHaveBeenCalledWith('Acta_Despacho_Consolidada_DSP-CF-77002.pdf');
      });
    });

    describe('Creación Rápida Múltiple de Productos Asociados al Cliente (Batch)', () => {
      it('debe validar ProductoRapidoItemSchema y ProductosClienteBatchInputSchema correctamente', () => {
        const item1 = ProductoRapidoItemSchema.parse({
          nombre: 'Corvina Entera',
          tipo_empaque: 'CANASTILLAS',
          tara_unitaria_kg: 2.0,
        });
        expect(item1.nombre).toBe('Corvina Entera');
        expect(item1.tipo_empaque).toBe('CANASTILLAS');
        expect(item1.tara_unitaria_kg).toBe(2.0);

        const lote = ProductosClienteBatchInputSchema.parse({
          cliente_id: 'cl-1234',
          productos: [
            { nombre: 'Corvina Entera', tipo_empaque: 'CANASTILLAS', tara_unitaria_kg: 2.0 },
            { nombre: 'Pargo Rojo', tipo_empaque: 'CAJAS', tara_unitaria_kg: 0.8 },
            { nombre: 'Camarón Tití', tipo_empaque: 'SUELTO', tara_unitaria_kg: 0.0 },
          ],
        });
        expect(lote.productos.length).toBe(3);
        expect(lote.cliente_id).toBe('cl-1234');
      });

      it('debe registrar múltiples productos en lote asignando el cliente_id en coldStorageRentalService', async () => {
        const clienteId = 'cliente-asociado-777';
        const items = [
          { nombre: 'Robalo Fresco', tipo_empaque: 'CANASTILLAS' as const, tara_unitaria_kg: 2.0 },
          { nombre: 'Sierra Fileteada', tipo_empaque: 'CAJAS' as const, tara_unitaria_kg: 0.8 },
          { nombre: 'Calamar Tubo', tipo_empaque: 'SUELTO' as const, tara_unitaria_kg: 0.0 },
        ];

        const creados = await coldStorageRentalService.crearProductosCustodiaBatch(clienteId, items);

        expect(creados.length).toBe(3);
        expect(creados[0].cliente_id).toBe(clienteId);
        expect(creados[0].nombre).toBe('Robalo Fresco');
        expect(creados[1].cliente_id).toBe(clienteId);
        expect(creados[1].nombre).toBe('Sierra Fileteada');
        expect(creados[2].cliente_id).toBe(clienteId);
        expect(creados[2].nombre).toBe('Calamar Tubo');

        // Verificar que el catálogo del cliente retorne los productos creados
        const productosCliente = await coldStorageRentalService.getProductosCustodia(clienteId);
        expect(productosCliente.some((p) => p.nombre === 'Robalo Fresco')).toBe(true);
        expect(productosCliente.some((p) => p.nombre === 'Sierra Fileteada')).toBe(true);
        expect(productosCliente.some((p) => p.nombre === 'Calamar Tubo')).toBe(true);
      });
    });
  });
});

