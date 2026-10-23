import { describe, it, expect, beforeEach } from 'vitest';
import { b2bCustomerPortalService } from '../services/b2bCustomerPortalService';
import type { CreateB2BOrderInput } from '../types/b2bCustomerPortal.types';

describe('Servicio de Negocio — Portal B2B HORECA (TASK-027-02)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('debe listar clientes HORECA y obtener el perfil de un restaurante', () => {
    const clientes = b2bCustomerPortalService.obtenerClientesHoreca();
    expect(clientes.length).toBeGreaterThanOrEqual(2);

    const perfil = b2bCustomerPortalService.obtenerPerfilCliente('cli-restaurante-mar');
    expect(perfil).not.toBeNull();
    expect(perfil?.razonSocial).toBe('Restaurante Mar Gourmet S.A.S.');
    expect(perfil?.tipoPrecio).toBe('RESTAURANTE');
    expect(perfil?.sucursales.length).toBe(2);
  });

  it('debe calcular precios de catálogo preferenciales según el tipo de cliente', () => {
    // Cliente Restaurante (-8%)
    const catalogoRestaurante = b2bCustomerPortalService.obtenerCatalogoCliente('cli-restaurante-mar');
    const salmonRestaurante = catalogoRestaurante.find((p) => p.sku === 'SALM-NOR-01');
    expect(salmonRestaurante?.precioPactadoCop).toBe(Math.round(75000 * 0.92));

    // Cliente Mayorista (-15%)
    const catalogoMayorista = b2bCustomerPortalService.obtenerCatalogoCliente('cli-hotel-grand');
    const salmonMayorista = catalogoMayorista.find((p) => p.sku === 'SALM-NOR-01');
    expect(salmonMayorista?.precioPactadoCop).toBe(Math.round(75000 * 0.85));

    // Cortes disponibles
    expect(salmonRestaurante?.cortesDisponibles).toContain('FILETE_CON_PIEL');
    expect(salmonRestaurante?.cortesDisponibles).toContain('FILETE_SIN_PIEL');
  });

  it('debe calcular el estado de cartera y semáforo de crédito', () => {
    const cartera = b2bCustomerPortalService.obtenerEstadoCartera('cli-restaurante-mar');
    expect(cartera.cupoTotalCop).toBe(5000000);
    expect(cartera.saldoPendienteCop).toBe(1200000);
    expect(cartera.cupoDisponibleCop).toBe(3800000);
    expect(cartera.estadoSemaforo).toBe('AL_DIA');

    // Cliente con cupo casi agotado
    const carteraMuelle = b2bCustomerPortalService.obtenerEstadoCartera('cli-cevicheria-muelle');
    expect(carteraMuelle.cupoDisponibleCop).toBe(50000);
    expect(carteraMuelle.estadoSemaforo).toBe('EN_ALERTA');
  });

  it('debe crear pedido en estado CREADO si cumple con el cupo de crédito disponible', () => {
    const ordenInput: CreateB2BOrderInput = {
      clienteId: 'cli-restaurante-mar',
      clienteNombre: 'Restaurante Mar Gourmet S.A.S.',
      nit: '900123456-7',
      sucursalEntrega: 'Sede Parque 93',
      direccionEntrega: 'Calle 93 # 12-45',
      fechaRequeridaEntrega: '2026-10-24',
      jornadaRequerida: 'MANANA',
      formaPago: 'CREDITO_B2B',
      lineas: [
        {
          productoId: 'prod-salmon-noruego',
          sku: 'SALM-NOR-01',
          nombre: 'Salmón Noruego Premium',
          corte: 'FILETE_CON_PIEL',
          empaque: 'CAJA_TERMICA_HIELO',
          modalidadVenta: 'KILOGRAMOS_ESTIMADOS',
          cantidadSolicitada: 10,
          precioPactadoCop: 69000,
        },
      ],
    };

    const resultado = b2bCustomerPortalService.crearPedidoB2B(ordenInput);
    expect(resultado.success).toBe(true);
    expect(resultado.data?.estado).toBe('CREADO');
    expect(resultado.data?.totalEstimadoCop).toBe(690000);
  });

  it('debe enviar el pedido a PENDIENTE_APROBACION_CARTERA si excede el cupo disponible', () => {
    // Cliente El Muelle solo tiene $50.000 disponibles
    const ordenSobregiro: CreateB2BOrderInput = {
      clienteId: 'cli-cevicheria-muelle',
      clienteNombre: 'Cevichería El Muelle',
      nit: '901234567-8',
      sucursalEntrega: 'Local Zona Rosa',
      direccionEntrega: 'Carrera 15 # 85-30',
      fechaRequeridaEntrega: '2026-10-24',
      jornadaRequerida: 'MANANA',
      formaPago: 'CREDITO_B2B',
      lineas: [
        {
          productoId: 'prod-salmon-noruego',
          sku: 'SALM-NOR-01',
          nombre: 'Salmón Noruego Premium',
          corte: 'FILETE_SIN_PIEL',
          empaque: 'CAJA_TERMICA_HIELO',
          modalidadVenta: 'KILOGRAMOS_ESTIMADOS',
          cantidadSolicitada: 10,
          precioPactadoCop: 69000, // Total $690.000 > $50.000
        },
      ],
    };

    const resultado = b2bCustomerPortalService.crearPedidoB2B(ordenSobregiro);
    expect(resultado.success).toBe(true);
    expect(resultado.data?.estado).toBe('PENDIENTE_APROBACION_CARTERA');
  });

  it('debe permitir re-ordenar con 1 clic desde una plantilla guardada', () => {
    const templates = b2bCustomerPortalService.obtenerPlantillasRecurrentes('cli-restaurante-mar');
    expect(templates.length).toBeGreaterThan(0);

    const resultadoReorden = b2bCustomerPortalService.reordenarDesdePlantilla(templates[0].id!);
    expect(resultadoReorden.success).toBe(true);
    expect(resultadoReorden.data?.lineas.length).toBe(2);
    expect(resultadoReorden.data?.clienteId).toBe('cli-restaurante-mar');
  });
});
