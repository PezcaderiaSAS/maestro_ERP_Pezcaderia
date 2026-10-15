import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualWeightModal } from '../views/pos/components/ManualWeightModal';
import { ProductSearchPanel } from '../views/pos/components/ProductSearchPanel';
import { LineaVentaRow } from '../views/pos/components/LineaVentaRow';
import { PaymentPanel } from '../views/pos/components/PaymentPanel';
import type { LineaVenta } from '../types/pos.types';

describe('TASK-014-06: Suite Integral E2E de Ergonomía Táctil en POS (Regla del Niño de 12 Años)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('1. Flujo de Pesaje Manual Asistido (Balanza de Mostrador sin hardware conectado)', () => {
    const mockProduct = {
      id: 'prod-robalo',
      sku: 'ROB-01',
      nombre: 'Róbalo Fresco Entero',
      precio: 35000,
      precioLista: 35000,
      unidad: 'kg',
      unidadMedida: 'KG',
      precioCompra: 22000,
    };

    it('debe permitir seleccionar un chip de peso rápido y agregar al carrito con botón gigante de 56px', () => {
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProduct as any}
          onClose={onClose}
          onConfirmWeight={onConfirm}
        />
      );

      // 1. Tocar chip de 1.5 kg
      const chip15 = screen.getByRole('button', { name: /1.5 kg/i });
      fireEvent.click(chip15);

      // 2. Verificar subtotal en COP (1.5 * 35000 = $52.500)
      expect(screen.getByTestId('manual-weight-subtotal').textContent).toContain('52.500');

      // 3. Confirmar con botón gigante AGREGAR AL CARRITO (>= 56px)
      const btnAgregar = screen.getByRole('button', { name: /agregar al carrito/i });
      expect(btnAgregar.className).toContain('min-h-[56px]');
      fireEvent.click(btnAgregar);

      expect(onConfirm).toHaveBeenCalledWith(1.5);
    });

    it('debe permitir ingresar peso manual fino usando el Keypad numérico táctil de pantalla', () => {
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProduct as any}
          onClose={onClose}
          onConfirmWeight={onConfirm}
        />
      );

      // Tocar teclas: Borrar -> '2' -> '.' -> '7' -> '5'
      fireEvent.click(screen.getByRole('button', { name: /borrar/i }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: '.' }));
      fireEvent.click(screen.getByRole('button', { name: '7' }));
      fireEvent.click(screen.getByRole('button', { name: '5' }));

      // Verificar que el input tenga 2.75
      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      expect(input.value).toBe('2.75');

      // Subtotal: 2.75 * 35000 = $96.250
      expect(screen.getByTestId('manual-weight-subtotal').textContent).toContain('96.250');

      const btnAgregar = screen.getByRole('button', { name: /agregar al carrito/i });
      fireEvent.click(btnAgregar);
      expect(onConfirm).toHaveBeenCalledWith(2.75);
    });
  });

  describe('2. Búsqueda Táctil y Adición por Unidad (1 Solo Toque)', () => {
    const mockProducts = [
      {
        id: 'p-und-1',
        sku: 'SALSA-01',
        nombre: 'Salsa Marinera Artesanal 250g',
        categoria: 'Abarrotes',
        precio_venta_pos: 12000,
        unidad_medida: 'UND',
        unidadMedida: 'UND',
      },
    ];

    it('debe mantener auto-foco persistente en el buscador y permitir adición directa en 1 toque', () => {
      const onAddProduct = vi.fn();

      render(
        <ProductSearchPanel
          activeProducts={mockProducts}
          dynamicFields={[]}
          cliente={null}
          getProductPrice={() => 12000}
          getProductStock={() => 40}
          onAddProduct={onAddProduct}
        />
      );

      const searchInput = screen.getByPlaceholderText(/buscar por nombre o sku/i);
      expect(searchInput).toHaveFocus();
      expect(searchInput.className).toContain('min-h-[48px]');

      // Seleccionar producto por unidad
      const cardProducto = screen.getByText('Salsa Marinera Artesanal 250g');
      fireEvent.click(cardProducto);

      expect(onAddProduct).toHaveBeenCalledWith(mockProducts[0]);
    });
  });

  describe('3. Ergonomía Táctil en Líneas de Carrito (Targets >= 48px)', () => {
    const mockLinea: LineaVenta = {
      productoId: 'prod-1',
      sku: 'CAM-01',
      nombre: 'Camarón Tití Crudo',
      cantidad: 2.0,
      unidad: 'KG',
      precioLista: 30000,
      descuentoPct: 0,
      precioFinal: 30000,
      totalLinea: 60000,
      precioCompra: 20000,
      esPesoManual: true,
    };

    it('debe contar con botones de ajuste y eliminación de al menos 48px de tamaño táctil', () => {
      const onUpdateCantidad = vi.fn();
      const onRemove = vi.fn();

      render(
        <LineaVentaRow
          linea={mockLinea}
          stockDisponible={25}
          precioFinalDisplay={30000}
          onUpdateCantidad={onUpdateCantidad}
          onUpdateDescuentoLinea={vi.fn()}
          onRemove={onRemove}
          onWeightRead={vi.fn()}
          onAplicarPrecioHistorico={vi.fn()}
          onResetPrecio={vi.fn()}
        />
      );

      const btnAumentar = screen.getByRole('button', { name: /aumentar cantidad/i });
      const btnDisminuir = screen.getByRole('button', { name: /disminuir cantidad/i });
      const btnEliminar = screen.getByRole('button', { name: /eliminar producto/i });

      expect(btnAumentar.className).toContain('min-w-[48px]');
      expect(btnAumentar.className).toContain('min-h-[48px]');
      expect(btnDisminuir.className).toContain('min-w-[48px]');
      expect(btnDisminuir.className).toContain('min-h-[48px]');
      expect(btnEliminar.className).toContain('min-w-[48px]');
      expect(btnEliminar.className).toContain('min-h-[48px]');

      fireEvent.click(btnAumentar);
      expect(onUpdateCantidad).toHaveBeenCalledWith('prod-1', 3.0);

      fireEvent.click(btnEliminar);
      expect(onRemove).toHaveBeenCalledWith('prod-1');
    });
  });

  describe('4. Cobro Fricción Cero con Botón Gigante (>= 56px) y Retorno de Foco', () => {
    const mockLineas: LineaVenta[] = [
      {
        productoId: 'prod-1',
        sku: 'CAM-01',
        nombre: 'Camarón Tití Crudo',
        cantidad: 2.0,
        unidad: 'KG',
        precioLista: 30000,
        descuentoPct: 0,
        precioFinal: 30000,
        totalLinea: 60000,
        precioCompra: 20000,
        esPesoManual: true,
      },
    ];

    it('debe ejecutar el cobro con el botón gigante de 56px y re-enfocar el buscador inmediatamente', async () => {
      const searchInput = document.createElement('input');
      searchInput.id = 'pos-product-search-input';
      document.body.appendChild(searchInput);

      const onPagar = vi.fn().mockResolvedValue({ id: 'vta-999', total: 60000 });
      const onLimpiar = vi.fn();

      render(
        <PaymentPanel
          totalFinal={60000}
          lineas={mockLineas}
          cliente={null}
          stock={{ 'b-1': { 'CAM-01': 50 } }}
          bodegaActivaId="b-1"
          bodegaActivaNombre="Bodega Central"
          onGuardarBorrador={vi.fn()}
          onPagar={onPagar}
          onLimpiarCarrito={onLimpiar}
          isDisabled={false}
          isTurnoAbierto={true}
        />
      );

      const btnCobrar = screen.getByTestId('btn-cobrar');
      expect(btnCobrar.className).toContain('min-h-[56px]');
      expect(btnCobrar.textContent).toContain('$60.000');

      fireEvent.click(btnCobrar);

      await waitFor(() => {
        expect(onPagar).toHaveBeenCalled();
        expect(onLimpiar).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(document.activeElement).toBe(searchInput);
      });
    });
  });
});
