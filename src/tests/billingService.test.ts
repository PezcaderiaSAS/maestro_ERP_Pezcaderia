import { describe, it, expect } from 'vitest';
import { BillingService, OrdenProforma } from '../services/billingService';
import { Cliente } from '../types/erp.types';

const mockClient: Cliente = {
  id: 'C-001',
  nombre: 'Restaurante Test',
  identificacion: '900000000',
  tipoIdentificacion: 'NIT',
  tipoPersona: 'JURIDICA',
  direccion: 'Calle Falsa 123',
  telefono: '123',
  email: 'test@test.com',
  ciudad: 'Bogota',
  tipoPrecio: 'RESTAURANTE',
  cupoCredito: 1000000,
  cupoCreditoUsado: 0,
  isGranContribuyente: false,
  isAutoretenedor: false,
  activo: true
};

describe('BillingService', () => {
  it('debe generar factura correctamente con las cantidades aceptadas', () => {
    const orden: OrdenProforma = {
      id: 'ORD-001',
      cliente: mockClient,
      estado: 'ENTREGADO_CON_ACEPTACION',
      items: [
        { sku: 'P1', nombre: 'Pescado 1', cantidadOriginal: 10, cantidadAceptada: 8, precioUnitario: 10000 },
        { sku: 'P2', nombre: 'Pescado 2', cantidadOriginal: 5, cantidadAceptada: 5, precioUnitario: 20000 }
      ]
    };

    const factura = BillingService.generarFacturaDesdeAceptacion(orden, 'ADMIN');

    expect(factura.items).toHaveLength(2);
    expect(factura.items[0].cantidad).toBe(8); // Solo factura los 8 aceptados
    expect(factura.subtotal).toBe((8 * 10000) + (5 * 20000)); // 80k + 100k = 180,000
  });

  it('debe arrojar error si la orden no está en ENTREGADO_CON_ACEPTACION', () => {
    const orden: OrdenProforma = {
      id: 'ORD-002',
      cliente: mockClient,
      estado: 'DISPATCHED', // Estado incorrecto
      items: [
        { sku: 'P1', nombre: 'Pescado 1', cantidadOriginal: 10, cantidadAceptada: 10, precioUnitario: 10000 }
      ]
    };

    expect(() => BillingService.generarFacturaDesdeAceptacion(orden, 'ADMIN')).toThrowError('La orden no puede facturarse');
  });

  it('debe arrojar error si la cantidad aceptada es 0', () => {
    const orden: OrdenProforma = {
      id: 'ORD-003',
      cliente: mockClient,
      estado: 'ENTREGADO_CON_ACEPTACION',
      items: [
        { sku: 'P1', nombre: 'Pescado 1', cantidadOriginal: 10, cantidadAceptada: 0, precioUnitario: 10000 } // Todo rechazado
      ]
    };

    expect(() => BillingService.generarFacturaDesdeAceptacion(orden, 'ADMIN')).toThrowError('0 ítems aceptados');
  });
});
