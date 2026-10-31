import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartPanel } from '../views/pos/components/CartPanel';
import { PreventaSyncSchema, ItemPreventaSyncSchema } from '../types/deltaSync.schema';

describe('TASK-043-03: Anotaciones de Despacho en Doble Nivel (Comanda + Ítem) & Emisión F6', () => {
  it('1. El esquema Zod debe validar preventas con notas generales y notas por ítem', () => {
    const itemData = {
      productoId: 'prod-101',
      sku: 'VAR-58',
      nombre: 'PARARRAYO / VARILLA COBRE 5/8',
      cantidad: 2,
      precioUnitario: 45000,
      descuentoPct: 0,
      subtotal: 90000,
      notaItem: 'Cortar a 1.20 metros cada tramo',
    };

    const parsedItem = ItemPreventaSyncSchema.safeParse(itemData);
    expect(parsedItem.success).toBe(true);

    const preventaData = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      tenantId: 'tenant-03',
      codigoPreventa: 'PRE-2026-00101',
      terminalId: 'term-mostrador-01',
      vendedorId: 'user-josase-01',
      vendedorNombre: 'Diego Díaz',
      clienteDocumento: '901475457',
      clienteNombre: 'MFL INGENIEROS CONSULTORES S.A.S.',
      items: [itemData],
      subtotal: 90000,
      descuentoTotal: 0,
      total: 90000,
      estado: 'PENDIENTE_COBRO',
      notas: 'Despachar por portón 2 a don Pedro con remisión física',
      detallesDespacho: 'Requiere montacargas',
      version: 1,
      idempotencyKey: 'a'.repeat(64),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const parsedPreventa = PreventaSyncSchema.safeParse(preventaData);
    expect(parsedPreventa.success).toBe(true);
  });

  it('2. En CartPanel (Modo Mostrador) debe exhibir el campo de instrucciones de despacho y botón F6', () => {
    const mockGuardarBorrador = vi.fn();
    const mockLineas = [
      {
        productoId: 'prod-1',
        sku: 'TUB-PVC',
        nombre: 'TUBO PVC SANITARIA 3 PULGADAS',
        cantidad: 3,
        precioLista: 28000,
        precioFinal: 28000,
        precioCompra: 18000,
        unidad: 'UND',
        descuentoPct: 0,
        subtotal: 84000,
        notaItem: 'Cortar a la mitad',
      },
    ];

    render(
      <CartPanel
        lineas={mockLineas as any}
        cliente={{ id: 'cli-1', nombre: 'MFL INGENIEROS' } as any}
        descuentoGlobalPct={0}
        descuentoGlobalValor={0}
        totales={{
          subtotal: 84000,
          descuento: 0,
          totalFinal: 84000,
          totalIva: 0,
          subtotalBaseGravable: 84000,
        } as any}
        bodegaActivaId="bodega-1"
        bodegaActivaNombre="Bodega Principal"
        stock={{}}
        lastClientPrices={{}}
        drafts={[]}
        activeDraftId={null}
        onUpdateCantidad={vi.fn()}
        onUpdateDescuentoLinea={vi.fn()}
        onWeightRead={vi.fn()}
        onRemoveLinea={vi.fn()}
        onSetLineas={vi.fn()}
        onSelectCliente={vi.fn()}
        onClearCliente={vi.fn()}
        onDescuentoClick={vi.fn()}
        onPagar={vi.fn()}
        onGuardarBorrador={mockGuardarBorrador}
        onSetActiveDraftId={vi.fn()}
        onSetDrafts={vi.fn()}
        onSetDescuentoGlobal={vi.fn()}
        onLimpiarCarrito={vi.fn()}
        onUpdatePrecio={vi.fn()}
        onResetItemPrice={vi.fn()}
        isTurnoAbierto={true}
        onAbrirTurnoRequest={vi.fn()}
        onCerrarTurnoClick={vi.fn()}
        saldoEfectivoGaveta={0}
        topeMaximoGaveta={1000000}
        onRetiroParcialRequest={vi.fn()}
        isAsesorMostrador={true}
      />
    );

    // Debe mostrar botón F6 de mostrador
    const btnEmitir = screen.getByTestId('btn-emitir-preventa-mostrador');
    expect(btnEmitir).toBeDefined();

    // Debe mostrar el textarea o input de notas de despacho
    const inputNotas = screen.getByPlaceholderText(/Instrucciones de entrega, corte o despacho/i);
    expect(inputNotas).toBeDefined();

    fireEvent.change(inputNotas, { target: { value: 'Entregar urgente antes de las 3pm' } });
    expect((inputNotas as HTMLTextAreaElement).value).toBe('Entregar urgente antes de las 3pm');

    // Debe ejecutar onGuardarBorrador al hacer click
    fireEvent.click(btnEmitir);
    expect(mockGuardarBorrador).toHaveBeenCalled();

    // No debe haber panel de pago con métodos de cobro
    expect(screen.queryByText(/Seleccionar Método de Pago/i)).toBeNull();
  });
});
