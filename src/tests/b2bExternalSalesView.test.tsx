import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { B2BExternalSalesView } from '../views/b2b/B2BExternalSalesView';
import { Cliente } from '../types/erp.types';
import { Producto } from '../store/useInventoryStore';
import { b2bIntegrationService } from '../services/b2bIntegrationService';

describe('TASK-016-04: B2BExternalSalesView & B2BCartSummaryStep (Stepper Táctil & Envío Directo)', () => {
  const mockClienteConCupo: Cliente = {
    id: 'cli-01',
    nombre: 'Restaurante El Faro del Mar',
    identificacion: '900123456-7',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    direccion: 'Carrera 7 # 45-20',
    ciudad: 'Bogotá',
    telefono: '3101234567',
    email: 'contacto@elfaro.com',
    tipoPrecio: 'RESTAURANTE',
    cupoCredito: 10000000,
    cupoCreditoUsado: 2000000, // Disponible 8M
    activo: true,
  };

  const mockClienteSinCupo: Cliente = {
    id: 'cli-02',
    nombre: 'Cevichería Sin Cupo S.A.S.',
    identificacion: '900999888-1',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    direccion: 'Calle 100 # 15-20',
    ciudad: 'Bogotá',
    telefono: '3119998881',
    email: 'contacto@sincupo.com',
    tipoPrecio: 'RESTAURANTE',
    cupoCredito: 1000000,
    cupoCreditoUsado: 1000000, // Disponible 0
    activo: true,
  };

  const mockProductos: Producto[] = [
    {
      id: 'prod-01',
      sku: 'TRU-ENT-001',
      nombre: 'Trucha Arcoíris Entera',
      categoria: 'PESCADOS',
      unidadMedida: 'kg',
      precio_compra: 16000,
      buffer_seguridad: 5,
      precio_venta_pos: 26000,
      precio_venta_restaurante: 24000,
      precio_venta_mayorista: 22000,
      activo: true,
    },
  ];

  const mockStock = {
    'Bodega Principal': {
      'TRU-ENT-001': 100,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. El Stepper superior debe mostrar 3 pasos táctiles identificables y permitir navegación guiada', () => {
    render(
      <B2BExternalSalesView
        initialClientes={[mockClienteConCupo]}
        initialProducts={mockProductos}
        initialStock={mockStock}
      />
    );

    // Stepper superior visible
    expect(screen.getByTestId('b2b-stepper-step-1')).toBeInTheDocument();
    expect(screen.getByTestId('b2b-stepper-step-2')).toBeInTheDocument();
    expect(screen.getByTestId('b2b-stepper-step-3')).toBeInTheDocument();
  });

  it('2. Flujo completo: Seleccionar cliente -> Elegir producto con Catch Weight -> Ver resumen y Enviar Pedido a Bodega', async () => {
    const spyCrear = vi.spyOn(b2bIntegrationService, 'crearPedidoVentaExternaB2B').mockResolvedValueOnce({
      id: 'ped-test-123',
      numeroPedido: 'PED-B2B-888999',
      fecha: new Date().toISOString(),
      origen: 'VISITA',
      clienteId: mockClienteConCupo.id,
      bodegaId: '1',
      branch_id: '00000000-0000-0000-0000-000000000001',
      vendedorId: 'vend-01',
      vendedorNombre: 'Carlos Vendedor',
      formaPago: 'CREDITO',
      tipoEntrega: 'EN_RUTA',
      fechaEntrega: '2026-10-17',
      jornada: 'MANANA',
      estado: 'CREADO',
      observaciones: '',
      lineas: [],
      subtotal: 57000,
      descuentoGlobalPct: 0,
      descuentoGlobalValor: 0,
      totalFinal: 57000,
      retefuenteValor: 0,
      reteicaValor: 0,
      ivaValor: 0,
      subtotalNeto: 57000,
      idempotencyKey: 'idemp-test',
      rutaId: null,
      facturacionElectronica: false,
      idSiigo: null,
      inventarioDescontado: false,
    });

    render(
      <B2BExternalSalesView
        initialClientes={[mockClienteConCupo]}
        initialProducts={mockProductos}
        initialStock={mockStock}
      />
    );

    // Paso 1: Seleccionar cliente
    const cardCliente = screen.getByTestId(`b2b-client-card-${mockClienteConCupo.id}`);
    fireEvent.click(cardCliente);

    // Continuar a Paso 2 (Catálogo)
    const btnPaso1 = screen.getByTestId('b2b-btn-continue-step1');
    fireEvent.click(btnPaso1);

    // Paso 2: Seleccionar producto
    const cardProd = screen.getByTestId('b2b-product-card-TRU-ENT-001');
    fireEvent.click(cardProd);

    // Modal Catch Weight Dual: Confirmar 5 piezas
    const btnConfirmarItem = screen.getByTestId('b2b-btn-confirm-add-item');
    fireEvent.click(btnConfirmarItem);

    // Continuar a Paso 3 (Resumen)
    const btnPaso2 = screen.getByTestId('b2b-btn-continue-step2');
    fireEvent.click(btnPaso2);

    // Paso 3: Resumen y Envío
    expect(screen.getByTestId('b2b-cart-summary-step')).toBeInTheDocument();
    expect(screen.getByText('Trucha Arcoíris Entera')).toBeInTheDocument();
    expect(screen.getByText(/5 piezas/i)).toBeInTheDocument();

    // Botón de Envío verde para cliente con cupo suficiente
    const btnSubmit = screen.getByTestId('b2b-btn-submit-order');
    expect(btnSubmit).toBeInTheDocument();
    expect(btnSubmit.textContent).toMatch(/ENVIAR PEDIDO A BODEGA PRINCIPAL/i);
    expect(btnSubmit.className).toMatch(/h-14|min-h-\[56px\]/);

    fireEvent.click(btnSubmit);

    await waitFor(() => {
      expect(spyCrear).toHaveBeenCalledWith(
        expect.objectContaining({
          clienteId: mockClienteConCupo.id,
          formaPago: 'CREDITO',
          lineas: expect.arrayContaining([
            expect.objectContaining({
              sku: 'TRU-ENT-001',
              modalidadVenta: 'CATCH_WEIGHT_PIEZAS',
              cantidadSolicitada: 5,
            }),
          ]),
        })
      );
    });

    // Muestra pantalla de confirmación exitosa con número de pedido
    await waitFor(() => {
      expect(screen.getByText(/PED-B2B-888999/)).toBeInTheDocument();
      expect(screen.getByText(/Pedido Creado con Éxito/i)).toBeInTheDocument();
    });
  });

  it('3. Si el cliente no tiene cupo en Crédito, el botón se torna ámbar y envía como PAUSADO_POR_CREDITO', async () => {
    const spyCrear = vi.spyOn(b2bIntegrationService, 'crearPedidoVentaExternaB2B').mockResolvedValueOnce({
      id: 'ped-test-pausado',
      numeroPedido: 'PED-B2B-777111',
      fecha: new Date().toISOString(),
      origen: 'VISITA',
      clienteId: mockClienteSinCupo.id,
      bodegaId: '1',
      branch_id: '00000000-0000-0000-0000-000000000001',
      vendedorId: 'vend-01',
      vendedorNombre: 'Carlos Vendedor',
      formaPago: 'CREDITO',
      tipoEntrega: 'EN_RUTA',
      fechaEntrega: '2026-10-17',
      jornada: 'MANANA',
      estado: 'PAUSADO_POR_CREDITO',
      observaciones: '',
      lineas: [],
      subtotal: 57000,
      descuentoGlobalPct: 0,
      descuentoGlobalValor: 0,
      totalFinal: 57000,
      retefuenteValor: 0,
      reteicaValor: 0,
      ivaValor: 0,
      subtotalNeto: 57000,
      idempotencyKey: 'idemp-test-pausado',
      rutaId: null,
      facturacionElectronica: false,
      idSiigo: null,
      inventarioDescontado: false,
    });

    render(
      <B2BExternalSalesView
        initialClientes={[mockClienteSinCupo]}
        initialProducts={mockProductos}
        initialStock={mockStock}
      />
    );

    // Seleccionar cliente sin cupo
    fireEvent.click(screen.getByTestId(`b2b-client-card-${mockClienteSinCupo.id}`));
    fireEvent.click(screen.getByTestId('b2b-btn-continue-step1'));

    // Seleccionar producto y confirmar
    fireEvent.click(screen.getByTestId('b2b-product-card-TRU-ENT-001'));
    fireEvent.click(screen.getByTestId('b2b-btn-confirm-add-item'));
    fireEvent.click(screen.getByTestId('b2b-btn-continue-step2'));

    // Botón de envío debe solicitar aprobación de crédito
    const btnSubmit = screen.getByTestId('b2b-btn-submit-order');
    expect(btnSubmit.textContent).toMatch(/APROBACIÓN DE CRÉDITO/i);

    fireEvent.click(btnSubmit);

    await waitFor(() => {
      expect(spyCrear).toHaveBeenCalled();
      expect(screen.getByText(/PAUSADO_POR_CREDITO|Pendiente de Aprobación/i)).toBeInTheDocument();
    });
  });
});
