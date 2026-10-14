import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeliveryDriverPortalModal } from '../views/inventory/components/DeliveryDriverPortalModal';
import { DeliveryExecutionModal } from '../views/inventory/components/DeliveryExecutionModal';
import { deliveryRouteService, DeliveryRouteRecord } from '../services/deliveryRouteService';

// Mock SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockImplementation(() => Promise.resolve({ isConfirmed: true })),
  },
}));

describe('CARD-012-05: DeliveryDriverPortalModal & DeliveryExecutionModal (Portal Móvil Chofer 375px)', () => {
  let mockManifiesto: DeliveryRouteRecord;

  beforeEach(() => {
    localStorage.clear();

    const created = deliveryRouteService.crearManifiestoRuta(
      {
        conductorId: 'cond-01',
        conductorNombre: 'Wilson Gómez',
        conductorTelefono: '3109876543',
        vehiculoPlaca: 'TRK-982',
        vehiculoTipo: 'Furgón Refrigerado Hino',
        zonaRuta: 'Cabecera - Cañaveral',
        kilometrajeInicial: 12500,
        pedidosIds: ['PED-001', 'PED-002'],
      },
      [
        {
          id: 'PED-001',
          numeroPedido: 'PED-001',
          clienteNombre: 'Restaurante Mar Azul',
          clienteDireccion: 'Calle 48 # 28-12, Cabecera',
          totalNeto: 350000,
          items: [{ sku: 'ROB-ENT-01', nombre: 'Róbalo Entero', cantidad: 10, precioUnitario: 35000 }],
        },
        {
          id: 'PED-002',
          numeroPedido: 'PED-002',
          clienteNombre: 'Cevichería del Puerto',
          clienteDireccion: 'Carrera 33 # 52-19, Cabecera',
          totalNeto: 180000,
          items: [{ sku: 'CAM-TIG-01', nombre: 'Camarón Tigre', cantidad: 4, precioUnitario: 45000 }],
        },
      ]
    );

    mockManifiesto = created.data!;
  });

  it('1. Debe renderizar el portal del conductor con placa del camión y temperatura de frío', () => {
    render(
      <DeliveryDriverPortalModal
        isOpen={true}
        onClose={vi.fn()}
        manifiesto={mockManifiesto}
        onManifestUpdated={vi.fn()}
      />
    );

    expect(screen.getByText('TRK-982')).toBeDefined();
    expect(screen.getByText('Wilson Gómez')).toBeDefined();
    expect(screen.getByText('Paso 1: Verificación de Carga & Frío')).toBeDefined();
  });

  it('2. Debe permitir verificar pedidos a bordo y salir a ruta con temperatura <= 4°C', async () => {
    const onManifestUpdated = vi.fn();
    render(
      <DeliveryDriverPortalModal
        isOpen={true}
        onClose={vi.fn()}
        manifiesto={mockManifiesto}
        onManifestUpdated={onManifestUpdated}
      />
    );

    // Botón seleccionar todos
    const btnSelectAll = screen.getByText('Seleccionar todos');
    fireEvent.click(btnSelectAll);

    // Botón confirmar carga y salir a ruta
    const btnConfirmar = screen.getByText('Confirmar Carga & Salir a Ruta');
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(onManifestUpdated).toHaveBeenCalled();
    });

    const updated = deliveryRouteService.obtenerManifiestoPorId(mockManifiesto.id);
    expect(updated?.estado).toBe('EN_RUTA');
    expect(updated?.cargaVerificadaEnBodega).toBe(true);
    expect(updated?.temperaturaSalidaCelsius).toBeLessThanOrEqual(4.0);
  });

  it('3. Debe registrar la llegada en sitio ("Llegué a Sitio") calculando tiempo de tránsito', async () => {
    // Primero iniciamos la ruta
    deliveryRouteService.confirmarCheckinCarga({
      manifiestoId: mockManifiesto.id,
      temperaturaSalidaCelsius: 2.2,
      pedidosConfirmados: ['PED-001', 'PED-002'],
    });

    const manifiestoEnRuta = deliveryRouteService.obtenerManifiestoPorId(mockManifiesto.id)!;
    const onManifestUpdated = vi.fn();

    render(
      <DeliveryDriverPortalModal
        isOpen={true}
        onClose={vi.fn()}
        manifiesto={manifiestoEnRuta}
        onManifestUpdated={onManifestUpdated}
      />
    );

    // Los botones de "Llegué a Sitio" están presentes
    const btnsLlegue = screen.getAllByText('Llegué a Sitio');
    expect(btnsLlegue.length).toBeGreaterThan(0);

    fireEvent.click(btnsLlegue[0]);

    await waitFor(() => {
      expect(onManifestUpdated).toHaveBeenCalled();
    });

    const postLlegada = deliveryRouteService.obtenerManifiestoPorId(mockManifiesto.id)!;
    const p1 = postLlegada.pedidos.find((p) => p.pedidoId === 'PED-001');
    expect(p1?.horaLlegadaEnSitio).toBeDefined();
    expect(p1?.tiempoTransitoMinutos).toBeGreaterThanOrEqual(1);
  });

  it('4. Debe registrar una eventualidad / novedad en ruta (TRAFICO_BLOQUEO)', async () => {
    deliveryRouteService.iniciarRuta(mockManifiesto.id);
    const manifiestoEnRuta = deliveryRouteService.obtenerManifiestoPorId(mockManifiesto.id)!;
    const onManifestUpdated = vi.fn();

    render(
      <DeliveryDriverPortalModal
        isOpen={true}
        onClose={vi.fn()}
        manifiesto={manifiestoEnRuta}
        onManifestUpdated={onManifestUpdated}
      />
    );

    // Abrir modal de novedad
    const btnNovedad = screen.getByLabelText('Reportar novedad');
    fireEvent.click(btnNovedad);

    // Escribir descripción
    const textarea = screen.getByPlaceholderText('Explica qué ocurrió...');
    fireEvent.change(textarea, { target: { value: 'Accidente en autopista demora 25 minutos' } });

    // Enviar novedad
    const btnEnviar = screen.getByText('Enviar Novedad');
    fireEvent.click(btnEnviar);

    await waitFor(() => {
      expect(onManifestUpdated).toHaveBeenCalled();
    });

    const postInc = deliveryRouteService.obtenerManifiestoPorId(mockManifiesto.id)!;
    expect(postInc.incidenciasRuta?.length).toBe(1);
    expect(postInc.incidenciasRuta?.[0].descripcion).toContain('Accidente en autopista');
  });

  it('5. Debe ejecutar entrega en sitio en DeliveryExecutionModal con firma y cobro en efectivo', async () => {
    const pedido = mockManifiesto.pedidos[0];
    const onDeliveryRecorded = vi.fn();

    render(
      <DeliveryExecutionModal
        isOpen={true}
        onClose={vi.fn()}
        manifiesto={mockManifiesto}
        pedidoItem={pedido}
        onDeliveryRecorded={onDeliveryRecorded}
      />
    );

    expect(screen.getByText('Pedido #PED-001')).toBeDefined();
    expect(screen.getByText('Entregado Total')).toBeDefined();

    // Escribir nombre de quien recibe
    const inputRecibe = screen.getByPlaceholderText('Ej. Chef Carlos Pérez');
    fireEvent.change(inputRecibe, { target: { value: 'Chef Mauricio Rivas' } });

    // Confirmar entrega
    const btnConfirmar = screen.getByText('Confirmar y Registrar Entrega');
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(onDeliveryRecorded).toHaveBeenCalled();
    });

    const updated = deliveryRouteService.obtenerManifiestoPorId(mockManifiesto.id)!;
    const pedActualizado = updated.pedidos.find((p) => p.pedidoId === 'PED-001')!;
    expect(pedActualizado.estadoEntrega).toBe('ENTREGADO_TOTAL');
    expect(pedActualizado.montoCobradoFinal).toBe(350000);
    expect(pedActualizado.montoEfectivo).toBe(350000);
  });

  it('6. Debe procesar entrega parcial con devolución de ítem por cadena de frío', async () => {
    const pedido = mockManifiesto.pedidos[0];
    const onDeliveryRecorded = vi.fn();

    render(
      <DeliveryExecutionModal
        isOpen={true}
        onClose={vi.fn()}
        manifiesto={mockManifiesto}
        pedidoItem={pedido}
        onDeliveryRecorded={onDeliveryRecorded}
      />
    );

    // Seleccionar Entrega Parcial
    const btnParcial = screen.getByText('Entrega Parcial');
    fireEvent.click(btnParcial);

    // Añadir devolución de 2 kg
    const btnAddDev = screen.getByText('Añadir Devolución');
    fireEvent.click(btnAddDev);

    // Nombre quien recibe
    const inputRecibe = screen.getByPlaceholderText('Ej. Chef Carlos Pérez');
    fireEvent.change(inputRecibe, { target: { value: 'Administradora Patricia' } });

    // Confirmar entrega
    const btnConfirmar = screen.getByText('Confirmar y Registrar Entrega');
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(onDeliveryRecorded).toHaveBeenCalled();
    });

    const updated = deliveryRouteService.obtenerManifiestoPorId(mockManifiesto.id)!;
    const pedActualizado = updated.pedidos.find((p) => p.pedidoId === 'PED-001')!;
    expect(pedActualizado.estadoEntrega).toBe('ENTREGADO_PARCIAL');
    expect(pedActualizado.devoluciones?.length).toBe(1);
    expect(pedActualizado.montoCobradoFinal).toBeLessThan(350000);
  });

  it('7. Debe permitir finalizar el recorrido con odómetro de retorno y pasar a EN_LIQUIDACION', async () => {
    deliveryRouteService.iniciarRuta(mockManifiesto.id);
    const manifiestoEnRuta = deliveryRouteService.obtenerManifiestoPorId(mockManifiesto.id)!;
    const onManifestUpdated = vi.fn();

    render(
      <DeliveryDriverPortalModal
        isOpen={true}
        onClose={vi.fn()}
        manifiesto={manifiestoEnRuta}
        onManifestUpdated={onManifestUpdated}
      />
    );

    // Abrir modal de retorno
    const btnFin = screen.getByText('Finalizar Recorrido / Retorno a Bodega');
    fireEvent.click(btnFin);

    expect(screen.getByText('Finalizar Recorrido y Retorno a Bodega')).toBeDefined();

    // Confirmar retorno
    const btnConfirmarRetorno = screen.getByText('Confirmar Retorno');
    fireEvent.click(btnConfirmarRetorno);

    await waitFor(() => {
      expect(onManifestUpdated).toHaveBeenCalled();
    });

    const updated = deliveryRouteService.obtenerManifiestoPorId(mockManifiesto.id)!;
    expect(updated.estado).toBe('EN_LIQUIDACION');
    expect(updated.kilometrajeFinal).toBeGreaterThanOrEqual(12500);
  });
});
