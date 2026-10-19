import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DriverPortalView } from '../views/driver/DriverPortalView';
import { useDriverDeliveryPwaStore } from '../store/useDriverDeliveryPwaStore';
import { useAppStore } from '../store/useAppStore';
import { AppRouteId } from '../routes/AppRoute';
import { driverDeliveryPwaService } from '../services/driverDeliveryPwaService';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

// Mock del canvas getContext
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(400) }),
  } as any);
  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mocked');
});

describe('DriverPortalView — Suite Shell PWA Standalone (TASK-023-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    driverDeliveryPwaService.cerrarSesion();
    useDriverDeliveryPwaStore.setState({
      session: null,
      activeRoute: null,
      selectedStop: null,
      isLoading: false,
      syncStatus: {
        pendientesSync: 0,
        estaEnLinea: true,
        sincronizando: false,
      },
      error: null,
    });
    useAppStore.setState({
      currentView: 'repartidor',
    });
  });

  it('debe renderizar el shell PWA y mostrar la pantalla de Login cuando no hay sesión', () => {
    render(<DriverPortalView />);

    expect(screen.getByTestId('driver-pwa-shell')).toBeInTheDocument();
    expect(screen.getByText(/LA PEZCADERIA/i)).toBeInTheDocument();
    expect(screen.getByText(/EXPRESS/i)).toBeInTheDocument();
    expect(screen.getByText(/Portal de Repartidores/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /INICIAR TURNO DE RUTA/i })).toBeInTheDocument();
  });

  it('debe permitir iniciar sesión y pasar a la Hoja de Ruta activa', async () => {
    render(<DriverPortalView />);

    const submitBtn = screen.getByRole('button', { name: /INICIAR TURNO DE RUTA/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const state = useDriverDeliveryPwaStore.getState();
      expect(state.session).not.toBeNull();
      expect(state.session?.conductorId).toBe('drv-001');
    });

    // Al iniciar sesión, login() carga la ruta demo con "Restaurante Mar y Sabor"
    expect(await screen.findByText(/Restaurante Mar y Sabor/i, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getAllByText(/WPZ-482/i).length).toBeGreaterThanOrEqual(1);
  });

  it('debe permitir seleccionar una parada y renderizar la vista de ejecución con semáforo térmico', async () => {
    const session = await driverDeliveryPwaService.loginConductor('conductor.juan@pezcaderia.com', 'ClaveSegura2026*');
    const route = await driverDeliveryPwaService.obtenerRutaActivaConductor('drv-001');

    useDriverDeliveryPwaStore.setState({
      session,
      activeRoute: route,
      selectedStop: null,
    });

    render(<DriverPortalView />);

    // Buscar tarjeta de parada y seleccionarla
    const stopButton = await screen.findByText(/Restaurante Mar y Sabor/i);
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(useDriverDeliveryPwaStore.getState().selectedStop).not.toBeNull();
      expect(useDriverDeliveryPwaStore.getState().selectedStop?.clienteNombre).toBe('Restaurante Mar y Sabor');
    });

    // Debe mostrar la vista de ejecución de parada
    expect(await screen.findByText(/Control Térmico HACCP/i)).toBeInTheDocument();
    expect(screen.getByText(/Datos de Quien Recibe y Firma/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CONFIRMAR ENTREGA Y CONTINUAR RUTA/i })).toBeInTheDocument();
  });

  it('debe permitir volver de la ejecución de parada a la hoja de ruta usando el botón Volver', async () => {
    const session = await driverDeliveryPwaService.loginConductor('conductor.juan@pezcaderia.com', 'ClaveSegura2026*');
    const route = await driverDeliveryPwaService.obtenerRutaActivaConductor('drv-001');
    const parada = route?.paradas[0] || null;

    useDriverDeliveryPwaStore.setState({
      session,
      activeRoute: route,
      selectedStop: parada,
    });

    render(<DriverPortalView />);

    const volverBtn = await screen.findByRole('button', { name: /Volver a la Ruta/i });
    fireEvent.click(volverBtn);

    await waitFor(() => {
      expect(useDriverDeliveryPwaStore.getState().selectedStop).toBeNull();
    });

    expect(await screen.findByText(/Restaurante Mar y Sabor/i)).toBeInTheDocument();
  });

  it('debe permitir volver al panel ERP de escritorio al presionar el botón de flecha izquierda', async () => {
    render(<DriverPortalView />);

    const volverErpBtn = screen.getByLabelText(/Volver al ERP/i);
    fireEvent.click(volverErpBtn);

    await waitFor(() => {
      expect(useAppStore.getState().currentView).toBe(AppRouteId.DISPATCHES);
    });
  });
});
