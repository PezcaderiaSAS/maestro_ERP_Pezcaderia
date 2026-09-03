import { describe, it, expect } from 'vitest';
import { B2BSalesService } from '../services/b2bSalesService';
import { Cliente } from '../types/erp.types';

const mockClientDefault: Cliente = {
  id: '1', nombre: 'Cliente Normal', identificacion: '111', tipoIdentificacion: 'NIT', tipoPersona: 'JURIDICA',
  direccion: 'Calle 1', telefono: '123', email: 'a@a.com', ciudad: 'Bogota', tipoPrecio: 'RESTAURANTE',
  cupoCredito: 1000000, cupoCreditoUsado: 500000, isGranContribuyente: false, activo: true
};

const mockClientVIP: Cliente = {
  ...mockClientDefault,
  id: '2',
  nombre: 'Gran Superficie',
  isGranContribuyente: true,
  isAutoretenedor: false
};

describe('B2BSalesService', () => {
  describe('verificarCupoCredito', () => {
    it('debe aprobar si el pedido es menor o igual al cupo disponible', () => {
      // Cupo total 1M, Usado 500k -> Disponible 500k
      const result = B2BSalesService.verificarCupoCredito(mockClientDefault, 400000);
      expect(result.aprobado).toBe(true);
      expect(result.cupoDisponible).toBe(500000);
    });

    it('debe rechazar si el pedido supera el cupo disponible', () => {
      const result = B2BSalesService.verificarCupoCredito(mockClientDefault, 600000);
      expect(result.aprobado).toBe(false);
      expect(result.mensaje).toContain('Crédito insuficiente');
    });
  });

  describe('calcularTotalesCotizacionNIIF', () => {
    it('no debe calcular retenciones si el cliente es normal', () => {
      const base = 1000000;
      const iva = 190000;
      const totales = B2BSalesService.calcularTotalesCotizacionNIIF(base, iva, mockClientDefault);
      
      expect(totales.retefuente).toBe(0);
      expect(totales.reteica).toBe(0);
      expect(totales.valor_neto_a_cobrar).toBe(1190000);
    });

    it('debe calcular retefuente (2.5%) y reteICA (0.414%) si el cliente es Gran Contribuyente', () => {
      const base = 1000000;
      const iva = 190000;
      const totales = B2BSalesService.calcularTotalesCotizacionNIIF(base, iva, mockClientVIP);
      
      // 2.5% de 1M = 25,000
      // 0.414% de 1M = 4,140
      expect(totales.retefuente).toBe(25000);
      expect(totales.reteica).toBe(4140);
      expect(totales.total_retenciones).toBe(29140);
      expect(totales.valor_neto_a_cobrar).toBe(1190000 - 29140); // 1,160,860
    });
  });

  describe('calcularAjusteMermasPicking', () => {
    it('debe calcular la merma y su costo asumido cuando peso real < peso teórico', () => {
      // Reservó 10kg, pero al hacer el corte solo salieron 9kg para empacar.
      // 1kg es merma de limpieza/corte en cuarto frío.
      const result = B2BSalesService.calcularAjusteMermasPicking(10, 9, 25000);
      
      expect(result.requiere_ajuste_inventario).toBe(true);
      expect(result.merma_kg).toBe(1);
      expect(result.costo_merma_asumida).toBe(25000);
    });

    it('no debe generar merma si peso real >= peso teorico', () => {
      const result = B2BSalesService.calcularAjusteMermasPicking(10, 10, 25000);
      
      expect(result.requiere_ajuste_inventario).toBe(false);
      expect(result.merma_kg).toBe(0);
      expect(result.costo_merma_asumida).toBe(0);
    });
  });
});
