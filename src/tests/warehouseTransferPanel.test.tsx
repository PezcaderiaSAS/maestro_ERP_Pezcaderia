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

  /* --------------------------------------------------------------------------
   * TDD SUITE - TASK-018-06: Wizard de Traslados a Sucursales (Regla Niño 12 Años)
   * -------------------------------------------------------------------------- */
  it('TASK-018-06: al entrar a Emitir Nueva Guía, debe renderizar el Wizard con tarjetas de sucursal >= 56px', async () => {
    const { fireEvent } = await import('@testing-library/react');
    render(
      <WarehouseTransferPanel
        bodegas={[
          { id: 'bodega-principal', nombre: 'Cuarto Frío 1', codigo: 'B01', activa: true, esencial: true },
          { id: 'bodega-pos', nombre: 'Mostrador POS', codigo: 'B02', activa: true, esencial: false },
          { id: 'bodega-congelados', nombre: 'Cámara Congelados', codigo: 'B03', activa: true, esencial: false },
        ]}
        products={MOCK_PRODUCTS}
      />
    );

    // Navegar a Emitir Nueva Guía
    const btnNuevaGuia = screen.getByText('Emitir Nueva Guía');
    fireEvent.click(btnNuevaGuia);

    // Debe mostrar el stepper o título del Paso 1
    expect(screen.getByText(/1\. ¿A dónde lo enviamos\?|Paso 1: Destino/i)).toBeDefined();

    // Las tarjetas de destino deben tener data-testid="target-bodega-card" y clase min-h-[56px] o h-14/h-16
    const bodegaCards = screen.getAllByTestId('target-bodega-card');
    expect(bodegaCards.length).toBeGreaterThanOrEqual(1);
    bodegaCards.forEach((card) => {
      const className = card.className;
      const hasErgonomicHeight =
        className.includes('min-h-[56px]') ||
        className.includes('min-h-[64px]') ||
        className.includes('h-14') ||
        className.includes('h-16');
      expect(hasErgonomicHeight).toBe(true);
    });
  });

  it('TASK-018-06: en el Paso 2, los botones de incremento rápido de kilos deben medir >= 48px', async () => {
    const { fireEvent } = await import('@testing-library/react');
    render(
      <WarehouseTransferPanel
        bodegas={[
          { id: 'bodega-principal', nombre: 'Cuarto Frío 1', codigo: 'B01', activa: true, esencial: true },
          { id: 'bodega-pos', nombre: 'Mostrador POS', codigo: 'B02', activa: true, esencial: false },
        ]}
        products={MOCK_PRODUCTS}
      />
    );

    // 1. Abrir Wizard
    fireEvent.click(screen.getByText('Emitir Nueva Guía'));

    // 2. Seleccionar destino en Paso 1 (Mostrador POS)
    const cardDestino = screen.getByTestId('target-bodega-bodega-pos');
    fireEvent.click(cardDestino);

    // 3. Debe avanzar al Paso 2: Producto y Kilos
    expect(screen.getByText(/2\. ¿Qué producto y cuántos kilos\?|Paso 2: Producto/i)).toBeDefined();

    // 4. Los botones de incremento rápido (+5 kg, +10 kg, +20 kg, etc.) deben tener data-testid="quick-kilo-btn"
    const quickButtons = screen.getAllByTestId('quick-kilo-btn');
    expect(quickButtons.length).toBeGreaterThanOrEqual(3);
    quickButtons.forEach((btn) => {
      const className = btn.className;
      const hasTouchTarget48 =
        className.includes('min-h-[48px]') ||
        className.includes('h-12') ||
        className.includes('h-14');
      expect(hasTouchTarget48).toBe(true);
    });
  });

  it('TASK-018-06: el botón principal de confirmación de traslado debe tener una altura ergonómica >= 56px', async () => {
    const { fireEvent } = await import('@testing-library/react');
    render(
      <WarehouseTransferPanel
        bodegas={[
          { id: 'bodega-principal', nombre: 'Cuarto Frío 1', codigo: 'B01', activa: true, esencial: true },
          { id: 'bodega-pos', nombre: 'Mostrador POS', codigo: 'B02', activa: true, esencial: false },
        ]}
        products={MOCK_PRODUCTS}
      />
    );

    // Abrir Wizard y seleccionar destino
    fireEvent.click(screen.getByText('Emitir Nueva Guía'));
    fireEvent.click(screen.getByTestId('target-bodega-bodega-pos'));

    // Botón de confirmación
    const submitBtn = screen.getByTestId('submit-transfer-btn');
    const className = submitBtn.className;
    const hasGiantHeight56 =
      className.includes('min-h-[56px]') ||
      className.includes('h-14') ||
      className.includes('h-16');
    expect(hasGiantHeight56).toBe(true);
  });

  it('TASK-018-06: si la cantidad supera el stock disponible en origen, debe alertar y bloquear el botón', async () => {
    const { fireEvent } = await import('@testing-library/react');
    render(
      <WarehouseTransferPanel
        bodegas={[
          { id: 'bodega-principal', nombre: 'Cuarto Frío 1', codigo: 'B01', activa: true, esencial: true },
          { id: 'bodega-pos', nombre: 'Mostrador POS', codigo: 'B02', activa: true, esencial: false },
        ]}
        products={MOCK_PRODUCTS}
      />
    );

    // 1. Abrir Wizard y seleccionar destino
    fireEvent.click(screen.getByText('Emitir Nueva Guía'));
    fireEvent.click(screen.getByTestId('target-bodega-bodega-pos'));

    // 2. Seleccionar producto (Salmón con stock 100 kg en bodega-principal)
    const productCard = screen.getByTestId('product-card-SALM-001');
    fireEvent.click(productCard);

    // 3. Ingresar 150 kg (más de los 100 disponibles)
    const inputCantidad = screen.getByTestId('transfer-kilos-input') as HTMLInputElement;
    fireEvent.change(inputCantidad, { target: { value: '150' } });

    // 4. Debe mostrar mensaje de stock insuficiente y botón deshabilitado
    expect(screen.getByText(/Stock insuficiente en origen/i)).toBeDefined();
    const submitBtn = screen.getByTestId('submit-transfer-btn') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });
});
