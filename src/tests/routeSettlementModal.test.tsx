import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RouteSettlementModal } from '../views/inventory/components/RouteSettlementModal';
import { deliveryRouteService, DeliveryRouteRecord } from '../services/deliveryRouteService';
import { save } from '../services/localDb';

// Mock SweetAlert2 para pruebas unitarias
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockImplementation(() => Promise.resolve({ isConfirmed: true })),
  },
}));

describe('CARD-012-06: RouteSettlementModal & CashService Integration Suite', () => {
  let mockManifiesto: DeliveryRouteRecord;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    save('cajas', [
      { id: 'caja-1', nombre: 'Caja Principal', bodegaId: 'Bodega Principal', activa: true, tipo: 'MAYOR' },
    ]);
    save('turnosCaja', [
      {
        id: 'turno-test-01',
        cajaId: 'caja-1',
        cajeroId: 'usr-auditor',
        createdBy: 'usr-auditor',
        baseInicial: 100000,
        saldoInicial: 100000,
        saldoTeoricoGlobal: 100000,
        totalEfectivo: 100000,
        totalDatafono: 0,
        totalTransferencias: 0,
        fechaApertura: new Date().toISOString(),
        fechaCierre: null,
        justificacion: null,
        estado: 'ABIERTO',
        branch_id: 'branch-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    // Crear un manifiesto de prueba con 2 pedidos entregados
    const res = deliveryRouteService.crearManifiestoRuta(
      {
        conductorId: 'cond-01',
        conductorNombre: 'Wilson Gómez',
        conductorTelefono: '3109876543',
        vehiculoPlaca: 'TRK-982',
        vehiculoTipo: 'Furgón Refrigerado Hino',
        zonaRuta: 'Cabecera - Cañaveral',
        kilometrajeInicial: 12500,
        temperaturaSalidaCelsius: -18,
        pedidosIds: ['PED-101', 'PED-102'],
      },
      [
        {
          id: 'PED-101',
          numeroPedido: 'PED-101',
          clienteNombre: 'Restaurante Mar Azul',
          clienteDireccion: 'Calle 48 # 28-12',
          totalNeto: 350000,
          items: [{ sku: 'ROB-01', nombre: 'Róbalo', cantidad: 10, precioUnitario: 35000 }],
        },
        {
          id: 'PED-102',
          numeroPedido: 'PED-102',
          clienteNombre: 'Cevichería del Puerto',
          clienteDireccion: 'Carrera 33 # 52-19',
          totalNeto: 200000,
          items: [{ sku: 'CAM-01', nombre: 'Camarón', cantidad: 4, precioUnitario: 50000 }],
        },
      ]
    );

    const m = res.data!;
    deliveryRouteService.iniciarRuta(m.id);

    // Registrar entregas:
    // Pedido 1: Pago Efectivo $350.000
    deliveryRouteService.registrarEntregaPedido({
      manifiestoId: m.id,
      pedidoId: 'PED-101',
      estadoEntrega: 'ENTREGADO_TOTAL',
      formaPago: 'EFECTIVO',
      montoOriginal: 350000,
      montoCobradoFinal: 350000,
      montoEfectivo: 350000,
      montoDigital: 0,
      firmaClienteUrl: 'data:image/svg+xml;base64,firma1',
    });

    // Pedido 2: Pago Digital $120.000 + Devolución $80.000
    deliveryRouteService.registrarEntregaPedido({
      manifiestoId: m.id,
      pedidoId: 'PED-102',
      estadoEntrega: 'ENTREGADO_PARCIAL',
      formaPago: 'TRANSFERENCIA_DIGITAL',
      montoOriginal: 200000,
      montoCobradoFinal: 120000,
      montoEfectivo: 0,
      montoDigital: 120000,
      referenciaDigital: 'NEQUI-456789',
      firmaClienteUrl: 'data:image/svg+xml;base64,firma2',
      devoluciones: [
        {
          productoId: 'CAM-01',
          sku: 'CAM-01',
          nombre: 'Camarón Tigre',
          cantidadDevueltaKg: 1.6,
          precioUnitario: 50000,
          montoDescontado: 80000,
          motivoRechazo: 'CADENA_FRIO',
          destinoBodega: 'CUARENTENA_CALIDAD',
        },
      ],
    });

    // Pasar ruta a EN_LIQUIDACION
    deliveryRouteService.finalizarRecorridoChofer({
      manifiestoId: m.id,
      kilometrajeFinal: 12580,
      temperaturaRetornoCelsius: -16.5,
    });

    mockManifiesto = deliveryRouteService.obtenerManifiestoPorId(m.id)!;
  });

  it('1. Debe renderizar los 4 cuadrantes de recaudo multimedio con valores correctos', () => {
    render(
      <RouteSettlementModal
        isOpen={true}
        onClose={vi.fn()}
        manifiesto={mockManifiesto}
        onSettlementCompleted={vi.fn()}
      />
    );

    // Debe mostrar título de auditoría y datos del manifiesto
    expect(screen.getByText(/Liquidación de Conductor & Cierre de Ruta/i)).toBeInTheDocument();
    expect(screen.getByText(mockManifiesto.numeroManifiesto)).toBeInTheDocument();
    expect(screen.getByText(mockManifiesto.conductorNombre)).toBeInTheDocument();

    // Cuadrantes de recaudo
    expect(screen.getAllByText(/\$350\.000/i)[0]).toBeInTheDocument(); // Efectivo cobrado
    expect(screen.getByText(/\$120\.000/i)).toBeInTheDocument(); // Digital cobrado
    expect(screen.getByText(/\$80\.000/i)).toBeInTheDocument();  // Devolución en cuarentena
  });

  it('2. Debe permitir agregar y deducir un gasto operativo ajustando el efectivo esperado', async () => {
    render(
      <RouteSettlementModal
        isOpen={true}
        onClose={vi.fn()}
        manifiesto={mockManifiesto}
        onSettlementCompleted={vi.fn()}
      />
    );

    // Inicialmente efectivo esperado = $350.000
    expect(screen.getAllByText(/\$350\.000/i)[0]).toBeInTheDocument();

    // Agregar gasto de combustible por $50.000
    const inputMonto = screen.getByPlaceholderText('0');
    fireEvent.change(inputMonto, { target: { value: '50000' } });

    const inputComprobante = screen.getByPlaceholderText(/Ej\. Tkt-9382/i);
    fireEvent.change(inputComprobante, { target: { value: 'REC-BOMBA-01' } });

    const btnAgregar = screen.getByRole('button', { name: /Deducir Gasto/i });
    fireEvent.click(btnAgregar);

    // Ahora debe aparecer el gasto y el efectivo neto esperado debe recalcularse a $300.000
    expect(screen.getAllByText(/-\$50\.000/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/\$300\.000/i)).toBeInTheDocument();
  });

  it('3. Debe calcular el descuadre de caja (faltante/sobrante) en tiempo real', () => {
    render(
      <RouteSettlementModal
        isOpen={true}
        onClose={vi.fn()}
        manifiesto={mockManifiesto}
        onSettlementCompleted={vi.fn()}
      />
    );

    // Si el conductor entrega $330.000 cuando se esperaban $350.000, hay un faltante de -$20.000
    const inputEfectivoEntregado = screen.getByLabelText(/Efectivo Físico Entregado/i);
    fireEvent.change(inputEfectivoEntregado, { target: { value: '330000' } });

    expect(screen.getByText(/▼ Faltante de Caja/i)).toBeInTheDocument();
    expect(screen.getByText(/\-\$20\.000/i)).toBeInTheDocument();
  });

  it('4. Debe liquidar exitosamente la ruta e invocar onSettlementCompleted', async () => {
    const handleCompleted = vi.fn();
    const handleClose = vi.fn();

    render(
      <RouteSettlementModal
        isOpen={true}
        onClose={handleClose}
        manifiesto={mockManifiesto}
        onSettlementCompleted={handleCompleted}
      />
    );

    const btnLiquidar = screen.getByRole('button', { name: /Finalizar y Liquidar Ruta/i });
    fireEvent.click(btnLiquidar);

    await waitFor(() => {
      expect(handleCompleted).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });

    // Verificar que el manifiesto quedó en estado LIQUIDADA en el storage
    const manifiestoActualizado = deliveryRouteService.obtenerManifiestoPorId(mockManifiesto.id);
    expect(manifiestoActualizado?.estado).toBe('LIQUIDADA');
    expect(manifiestoActualizado?.efectivoNetoEntregado).toBe(350000);
  });
});
