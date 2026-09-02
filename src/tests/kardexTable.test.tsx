import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KardexTable } from '../views/inventory/components/KardexTable';
import { save } from '../services/localDb';
import type { KardexMovement } from '../types/erp.types';

describe('KardexTable UI Component - Tarea 3 Suite', () => {
  const MOCK_KARDEX: KardexMovement[] = [
    {
      id: 'k-1',
      fecha: '2026-09-02T10:00:00.000Z',
      producto_id: 'prod-1',
      sku: 'SALM-001',
      nombre_producto: 'Salmón Entero Fresco',
      tipo_movimiento: 'ENTRADA_COMPRA',
      cantidad_kg: 100,
      costo_unitario: 30000,
      costo_total: 3000000,
      saldo_cantidad_kg: 100,
      saldo_costo_promedio: 30000,
      saldo_valor_total: 3000000,
      documento_referencia: 'FAC-001',
      usuario_responsable: 'Admin',
    },
    {
      id: 'k-2',
      fecha: '2026-09-02T11:00:00.000Z',
      producto_id: 'prod-1',
      sku: 'SALM-001',
      nombre_producto: 'Salmón Entero Fresco',
      tipo_movimiento: 'SALIDA_VENTA_POS',
      cantidad_kg: 20,
      costo_unitario: 30000,
      costo_total: 600000,
      saldo_cantidad_kg: 80,
      saldo_costo_promedio: 30000,
      saldo_valor_total: 2400000,
      documento_referencia: 'POS-001',
      usuario_responsable: 'Cajero 1',
    },
  ];

  beforeEach(() => {
    save('kardex_movements', MOCK_KARDEX);
  });

  it('debe renderizar los KPIs y encabezados del Kardex correctamente', () => {
    render(<KardexTable />);

    expect(screen.getByText('Total Entradas')).toBeDefined();
    expect(screen.getByText('Total Salidas')).toBeDefined();
    expect(screen.getByText('Saldo en Libros')).toBeDefined();
    expect(screen.getByText('CPP Vigente (NIIF)')).toBeDefined();

    expect(screen.getAllByText('SALM-001').length).toBeGreaterThan(0);
    expect(screen.getByText('FAC-001')).toBeDefined();
    expect(screen.getByText('POS-001')).toBeDefined();
  });

  it('debe renderizar los botones de exportación PDF y CSV', () => {
    render(<KardexTable />);

    expect(screen.getByText('Exportar PDF')).toBeDefined();
    expect(screen.getByText('Exportar CSV')).toBeDefined();
  });
});
