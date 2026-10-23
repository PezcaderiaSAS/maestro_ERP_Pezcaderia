import { describe, it, expect } from 'vitest';
import {
  B2BProductCutSchema,
  B2BPackagingSchema,
  B2BOrderLineInputSchema,
  CreateB2BOrderInputSchema,
  B2BRecurringTemplateSchema,
} from '../../packages/validation-schemas/src/b2bCustomerPortal.schema';

describe('Esquemas Zod — Portal B2B HORECA (TASK-027-01)', () => {
  it('debe validar cortes y empaques autorizados para pescados y mariscos', () => {
    expect(B2BProductCutSchema.parse('FILETE_SIN_PIEL')).toBe('FILETE_SIN_PIEL');
    expect(B2BProductCutSchema.parse('ENTERO_EVISCERADO')).toBe('ENTERO_EVISCERADO');
    expect(() => B2BProductCutSchema.parse('CORTE_INEXISTENTE')).toThrow();

    expect(B2BPackagingSchema.parse('CAJA_TERMICA_HIELO')).toBe('CAJA_TERMICA_HIELO');
    expect(B2BPackagingSchema.parse('BOLSA_VACIO')).toBe('BOLSA_VACIO');
    expect(() => B2BPackagingSchema.parse('EMPAQUE_INVALIDO')).toThrow();
  });

  it('debe validar una línea de pedido HORECA con datos correctos', () => {
    const lineaValida = {
      productoId: 'prod-salmon-01',
      sku: 'SALM-NOR-01',
      nombre: 'Salmón Noruego Fresco',
      corte: 'FILETE_CON_PIEL',
      empaque: 'CAJA_TERMICA_HIELO',
      modalidadVenta: 'KILOGRAMOS_ESTIMADOS',
      cantidadSolicitada: 15.5,
      piezasEstimadas: 6,
      precioPactadoCop: 68000,
      observacionesCorte: 'Filetes limpios, sin espinas laterales',
    };

    const resultado = B2BOrderLineInputSchema.safeParse(lineaValida);
    expect(resultado.success).toBe(true);
  });

  it('debe rechazar líneas de pedido con cantidad negativa o precio cero', () => {
    const lineaInvalida = {
      productoId: 'prod-salmon-01',
      sku: 'SALM-NOR-01',
      nombre: 'Salmón Noruego Fresco',
      corte: 'FILETE_CON_PIEL',
      empaque: 'CAJA_TERMICA_HIELO',
      modalidadVenta: 'KILOGRAMOS_ESTIMADOS',
      cantidadSolicitada: -5, // Inválido
      precioPactadoCop: 0, // Inválido
    };

    const resultado = B2BOrderLineInputSchema.safeParse(lineaInvalida);
    expect(resultado.success).toBe(false);
  });

  it('debe validar la creación de un pedido B2B completo', () => {
    const pedidoValido = {
      clienteId: 'cli-hotel-grand',
      clienteNombre: 'Grand Hotel & Spa',
      nit: '900876543-1',
      sucursalEntrega: 'Cocina Principal - Sede Norte',
      direccionEntrega: 'Calle 127 # 7-20, Bogotá',
      telefonoContacto: '3109876543',
      fechaRequeridaEntrega: '2026-10-24',
      jornadaRequerida: 'MANANA',
      formaPago: 'CREDITO_B2B',
      instruccionesCocina: 'Entregar por muelle de proveedores antes de las 9:00 AM',
      lineas: [
        {
          productoId: 'prod-trucha-01',
          sku: 'TRUCH-ARC-01',
          nombre: 'Trucha Arcoiris',
          corte: 'ENTERO_EVISCERADO',
          empaque: 'CAJA_TERMICA_HIELO',
          modalidadVenta: 'PIEZAS_FIJAS',
          cantidadSolicitada: 20,
          piezasEstimadas: 20,
          precioPactadoCop: 28000,
        },
      ],
    };

    const resultado = CreateB2BOrderInputSchema.safeParse(pedidoValido);
    expect(resultado.success).toBe(true);
  });

  it('debe rechazar pedidos con fecha mal formada o sin productos', () => {
    const pedidoSinLineas = {
      clienteId: 'cli-hotel-grand',
      clienteNombre: 'Grand Hotel & Spa',
      nit: '900876543-1',
      sucursalEntrega: 'Cocina',
      direccionEntrega: 'Calle 100',
      fechaRequeridaEntrega: '24/10/2026', // Formato incorrecto
      jornadaRequerida: 'MANANA',
      formaPago: 'CREDITO_B2B',
      lineas: [], // Vacío
    };

    const resultado = CreateB2BOrderInputSchema.safeParse(pedidoSinLineas);
    expect(resultado.success).toBe(false);
  });

  it('debe validar la estructura de plantillas de compras recurrentes HORECA', () => {
    const plantillaValida = {
      clienteId: 'cli-restaurante-mar',
      nombrePlantilla: 'Pedido Base Pescados del Fin de Semana',
      diasSemana: ['JUEVES', 'VIERNES'],
      jornadaEntrega: 'MANANA',
      activa: true,
      lineas: [
        {
          productoId: 'prod-camaron-01',
          sku: 'CAM-TIGRE-01',
          nombre: 'Camarón Tigre U15',
          corte: 'ENTERO_FRESCO',
          empaque: 'BOLSA_VACIO',
          modalidadVenta: 'KILOGRAMOS_ESTIMADOS',
          cantidadSolicitada: 10,
          precioPactadoCop: 52000,
        },
      ],
    };

    const resultado = B2BRecurringTemplateSchema.safeParse(plantillaValida);
    expect(resultado.success).toBe(true);
  });
});
