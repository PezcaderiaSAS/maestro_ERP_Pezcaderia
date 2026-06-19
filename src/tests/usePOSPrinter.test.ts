import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePOSPrinter } from '../hooks/usePOSPrinter';
import type { VentaPOS } from '../types/pos.types';

describe('usePOSPrinter Hook', () => {
  const mockVenta: VentaPOS = {
    id: 'vta-1',
    fecha: '2026-06-19T14:00:00.000Z',
    items: [
      {
        productoId: 'p-1',
        sku: 'SAL-001',
        nombre: 'Salmón Premium',
        cantidad: 2.5,
        unidad: 'KG',
        precioLista: 20000,
        descuentoPct: 0,
        precioFinal: 20000,
        totalLinea: 50000,
        esPesoManual: false
      }
    ],
    subtotal: 50000,
    descuento: 5000,
    total: 45000,
    metodoPago: 'CONTADO',
    montoPagadoEfectivo: 50000,
    cambioEntregado: 5000,
    actor: 'Cajero Juan'
  };

  const mockCliente = {
    nombre: 'Juan Pérez',
    identificacion: '10203040'
  };

  it('debería generar texto formateado a 40 columnas', () => {
    const { result } = renderHook(() => usePOSPrinter());
    const ticketText = result.current.formatearTextoTicket(mockVenta, mockCliente);

    // Verificar que todas las líneas tengan un ancho máximo de 40 caracteres (excluyendo saltos de línea)
    const lineas = ticketText.split('\n');
    lineas.forEach((line) => {
      expect(line.length).toBeLessThanOrEqual(40);
    });

    // Verificar contenido clave (sin importar mayúsculas/minúsculas)
    expect(ticketText.toUpperCase()).toContain('JUAN PÉREZ');
    expect(ticketText).toContain('10203040');
    expect(ticketText).toContain('Salmón Premium');
    expect(ticketText).toContain('45.000');
    expect(ticketText).toContain('Cajero Juan');
  });

  it('debería generar ticket sin cliente (Consumidor Final) si no se pasa cliente', () => {
    const { result } = renderHook(() => usePOSPrinter());
    const ticketText = result.current.formatearTextoTicket(mockVenta, null);

    expect(ticketText).toContain('CONSUMIDOR FINAL');
  });
});
