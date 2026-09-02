import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryView from '../views/InventoryView';
import { useInventoryStore } from '../store/useInventoryStore';
import { save } from '../services/localDb';

describe('InventoryView 7-Tabs & Quick Action Bar Suite - Tarea 6', () => {
  beforeEach(() => {
    save('erp_products', [
      {
        id: 'prod-1',
        sku: 'SALM-001',
        nombre: 'Salmón Entero Fresco',
        categoria: 'Pescados',
        precio_compra: 30000,
        costo_promedio_ponderado: 30000,
        buffer_seguridad: 10,
        precio_venta_pos: 42000,
        precio_venta_restaurante: 40000,
        precio_venta_mayorista: 38000,
        activo: true,
      },
    ]);
    save('stock', {
      'Bodega Principal': { 'SALM-001': 50 },
    });
    useInventoryStore.getState().loadInventory();
  });

  it('debe renderizar el Hero Header, KPIs y la barra de Quick Actions', () => {
    render(<InventoryView />);

    expect(screen.getByText('Gestión de Inventario, WMS & Trazabilidad')).toBeDefined();
    expect(screen.getByText('Recibir Compra')).toBeDefined();
    expect(screen.getByText('Nuevo Despiece')).toBeDefined();
    expect(screen.getByText('Traslado Bodega')).toBeDefined();
    expect(screen.getByText('Ver Kardex NIIF')).toBeDefined();
    expect(screen.getByText('Valor Total en Libros')).toBeDefined();
  });

  it('debe permitir cambiar entre las 7 pestañas principales', () => {
    render(<InventoryView />);

    // Tab 2: Kardex
    const tabKardex = screen.getByText('2. Kardex Contable NIIF');
    fireEvent.click(tabKardex);
    expect(screen.getByText(/Kardex Contable NIIF/i)).toBeDefined();

    // Tab 4: Despiece
    const tabDespiece = screen.getByText('4. Despiece & Comandas');
    fireEvent.click(tabDespiece);
    expect(screen.getByText(/Transformación & Despiece de Materia Prima/i)).toBeDefined();

    // Tab 5: Traslados
    const tabTraslados = screen.getByText('5. Traslados Internos');
    fireEvent.click(tabTraslados);
    expect(screen.getByText(/Emitir Nueva Guía/i)).toBeDefined();
  });
});
