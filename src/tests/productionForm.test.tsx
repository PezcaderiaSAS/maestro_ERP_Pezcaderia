import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductionForm } from '../views/inventory/components/ProductionForm';
import { save } from '../services/localDb';
import type { Product, ProcessingOrder } from '../types/erp.types';

describe('ProductionForm Component - Tarea 5 Suite', () => {
  const MOCK_PRODUCTS: Product[] = [
    {
      id: 'prod-salmon-entero',
      sku: 'SALM-001',
      nombre: 'Salmón Entero Fresco',
      categoria: 'Materia Prima',
      precio_compra: 30000,
      costo_promedio_ponderado: 30000,
      buffer_seguridad: 10,
      precio_venta_pos: 42000,
      precio_venta_restaurante: 40000,
      precio_venta_mayorista: 38000,
      activo: true,
    },
    {
      id: 'prod-filete-salmon',
      sku: 'SALM-002',
      nombre: 'Filete de Salmón Premium',
      categoria: 'Pescados',
      precio_compra: 45000,
      costo_promedio_ponderado: 45000,
      buffer_seguridad: 5,
      precio_venta_pos: 60000,
      precio_venta_restaurante: 58000,
      precio_venta_mayorista: 55000,
      activo: true,
    },
  ];

  const MOCK_COMANDAS: ProcessingOrder[] = [
    {
      id: 'cmd-1',
      codigo_comanda: 'CMD-260902-001',
      origen: 'POS_MOSTRADOR',
      producto_solicitado_id: 'prod-filete-salmon',
      sku_solicitado: 'SALM-002',
      nombre_producto_solicitado: 'Filete de Salmón Premium',
      cantidad_solicitada_kg: 5,
      materia_prima_disponible_id: 'prod-salmon-entero',
      materia_prima_nombre: 'Salmón Entero Fresco',
      estado: 'PENDIENTE',
      prioridad: 'ALTA',
      fecha_emision: '2026-09-02T10:00:00.000Z',
    },
  ];

  beforeEach(() => {
    save('processing_orders', MOCK_COMANDAS);
    save('stock', {
      'bodega-principal': { 'SALM-001': 100 },
    });
  });

  it('debe renderizar el formulario de despiece con balance de masa y comandas en vivo', () => {
    render(<ProductionForm products={MOCK_PRODUCTS} />);

    expect(screen.getByText('Transformación & Despiece de Materia Prima')).toBeDefined();
    expect(screen.getByText(/1\. Materia Prima Origen/)).toBeDefined();
    expect(screen.getByText(/2\. Productos Finales Obtenidos/)).toBeDefined();
    expect(screen.getByText(/Comandas Urgentes de Corte/)).toBeDefined();
    expect(screen.getByText('CMD-260902-001')).toBeDefined();
  });
});
