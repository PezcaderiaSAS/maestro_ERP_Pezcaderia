import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calcularPosicionesNecesarias,
  calcularSobrecupoKg,
  calcularRecargoSobrecupo,
  calcularMermaSalida,
  liquidarCausacionAlquiler,
  ContratoAlquilerCfSchema,
  ProductoCustodiaSchema,
  RecepcionCustodiaInputSchema,
  DespachoCustodiaInputSchema,
  NOMINAL_KG_POR_POSICION,
} from '../../packages/validation-schemas/src/coldStorageRental.schema';

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
  });
});
