import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WarehouseTransferPanel } from '../views/inventory/components/WarehouseTransferPanel';
import { save } from '../services/localDb';
import type { WarehouseTransfer, Product } from '../types/erp.types';

describe('WarehouseTransferPanel Component - Tarea 4 Suite', () => {
  const MOCK_TRANSFERS: WarehouseTransfer[] = [
    {
      id: 'trf-1',
      codigo_guia: 'TRF-260902-001',
      bodega_origen_id: 'bodega-principal',
      bodega_origen_nombre: 'Cuarto Frío 1',
      bodega_destino_id: 'bodega-pos',
      bodega_destino_nombre: 'Mostrador POS',
      estado: 'EN_TRANSITO',
      fecha_creacion: '2026-09-02T10:00:00.000Z',
      usuario_despacha: 'Bodeguero Central',
      items: [
        {
          producto_id: 'prod-1',
          sku: 'SALM-001',
          nombre: 'Salmón Entero Fresco',
          cantidad_kg: 25,
          costo_unitario: 30000,
        },
      ],
    },
  ];

  const MOCK_PRODUCTS: Product[] = [
    {
      id: 'prod-1',
      sku: 'SALM-001',
      nombre: 'Salmón Entero Fresco',
      categoria: 'Pescados',
      precio_compra: 30000,
      buffer_seguridad: 10,
      precio_venta_pos: 42000,
      precio_venta_restaurante: 40000,
      precio_venta_mayorista: 38000,
      activo: true,
    },
  ];

  beforeEach(() => {
    save('warehouse_transfers', MOCK_TRANSFERS);
    save('stock', {
      'bodega-principal': { 'SALM-001': 100 },
    });
  });

  it('debe renderizar la pestaña de traslados en tránsito y el código de guía', () => {
    render(
      <WarehouseTransferPanel
        bodegas={[
          { id: 'bodega-principal', nombre: 'Cuarto Frío 1', codigo: 'B01', activa: true, esencial: true },
          { id: 'bodega-pos', nombre: 'Mostrador POS', codigo: 'B02', activa: true, esencial: false },
        ]}
        products={MOCK_PRODUCTS}
      />
    );

    expect(screen.getByText('En Tránsito (1)')).toBeDefined();
    expect(screen.getByText('TRF-260902-001')).toBeDefined();
    expect(screen.getByText('Confirmar Recepción')).toBeDefined();
  });

  it('debe renderizar las opciones de emisión de nueva guía e historial', () => {
    render(
      <WarehouseTransferPanel
        bodegas={[
          { id: 'bodega-principal', nombre: 'Cuarto Frío 1', codigo: 'B01', activa: true, esencial: true },
          { id: 'bodega-pos', nombre: 'Mostrador POS', codigo: 'B02', activa: true, esencial: false },
        ]}
        products={MOCK_PRODUCTS}
      />
    );

    expect(screen.getByText('Emitir Nueva Guía')).toBeDefined();
    expect(screen.getByText('Historial de Traslados')).toBeDefined();
  });
});
