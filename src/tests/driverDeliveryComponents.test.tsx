import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DriverLoginView } from '../views/driver/components/DriverLoginView';
import { DriverRouteOverview } from '../views/driver/components/DriverRouteOverview';
import { DriverStopHeaderCard } from '../views/driver/components/DriverStopHeaderCard';
import { DriverPartialReturnModal } from '../views/driver/components/DriverPartialReturnModal';
import { DriverStopExecutionView } from '../views/driver/components/DriverStopExecutionView';
import { useDriverDeliveryPwaStore } from '../store/useDriverDeliveryPwaStore';
import { driverDeliveryPwaService } from '../services/driverDeliveryPwaService';
import type { DriverDeliveryStop } from '../types/driverDeliveryPwa.types';

describe('TASK-023-04: Componentes Táctiles Móviles del Conductor ("Regla del Niño de 12 Años")', () => {
  const dummyStop: DriverDeliveryStop = {
    id: 'stop-test-1',
    pedidoId: 'ped-test-1',
    numeroPedido: 'PED-9001',
    clienteId: 'cli-001',
    clienteNombre: 'Restaurante Sabor Marino',
    clienteDireccion: 'Carrera 33 # 48-15, Cabecera',
    clienteTelefono: '+57 312 999 8877',
    montoPedidoOriginal: 350000,
    montoCobradoFinal: 0,
    formaPago: 'EFECTIVO',
    montoEfectivo: 350000,
    montoDigital: 0,
    estadoEntrega: 'PENDIENTE',
    items: [
      { sku: 'MOJ-01', nombre: 'Mojarra Roja 500g', cantidad: 10, precioUnitario: 18000 },
      { sku: 'CAM-02', nombre: 'Camarón U15', cantidad: 5, precioUnitario: 34000 }
    ]
  };

  beforeEach(() => {
    useDriverDeliveryPwaStore.getState().logout();

    // Mock HTML5 canvas context para firmas
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      scale: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      lineCap: 'round',
      lineJoin: 'round',
      lineWidth: 2.8,
      strokeStyle: '#0f172a'
    }) as any;
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    );
  });

  describe('1. DriverLoginView', () => {
    it('Renderiza tarjeta de bienvenida, selectores rápidos de vehículos e inputs >= 48px', () => {
      render(<DriverLoginView />);

      expect(screen.getByText('Portal de Repartidores')).toBeDefined();
      expect(screen.getByText('Juan Carlos Rodríguez')).toBeDefined();
      expect(screen.getByText('Andrés Felipe Morales')).toBeDefined();

      const btnSubmit = screen.getByText(/INICIAR TURNO DE RUTA/i).closest('button');
      expect(btnSubmit).toBeDefined();
      expect(btnSubmit?.className).toContain('min-h-[56px]');

      // Cambiar conductor tocando la tarjeta rápida
      const cardAndres = screen.getByText('Andrés Felipe Morales').closest('button');
      fireEvent.click(cardAndres!);

      const inputEmail = screen.getByPlaceholderText('conductor@pezcaderia.com') as HTMLInputElement;
      expect(inputEmail.value).toBe('conductor.andres@pezcaderia.com');
    });
  });

  describe('2. DriverStopHeaderCard (Acciones 1-Toque)', () => {
    it('Renderiza enlaces tel: y de navegación Waze/Maps conforme a WCAG AA+', () => {
      const handleVolver = vi.fn();
      render(<DriverStopHeaderCard stop={dummyStop} onVolver={handleVolver} />);

      expect(screen.getByText('Restaurante Sabor Marino')).toBeDefined();
      expect(screen.getByText('Carrera 33 # 48-15, Cabecera')).toBeDefined();

      // Enlace telefónico directo 1-toque
      const telLink = screen.getByLabelText('Llamar al cliente') as HTMLAnchorElement;
      expect(telLink.href).toBe('tel:+57 312 999 8877');
      expect(telLink.className).toContain('min-h-[48px]');

      // Enlace Waze
      const wazeLink = screen.getByLabelText('Abrir Waze') as HTMLAnchorElement;
      expect(wazeLink.href).toContain('waze.com/ul?q=Carrera%2033');

      // Enlace Google Maps
      const mapsLink = screen.getByLabelText('Abrir Google Maps') as HTMLAnchorElement;
      expect(mapsLink.href).toContain('maps.google.com/?q=Carrera%2033');

      // Botón volver
      const btnVolver = screen.getByText('Volver a la Ruta').closest('button');
      fireEvent.click(btnVolver!);
      expect(handleVolver).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. DriverPartialReturnModal', () => {
    it('Permite seleccionar producto, motivo y kilos devueltos hacia CUARENTENA_CALIDAD', () => {
      const handleAgregar = vi.fn();
      const handleCerrar = vi.fn();

      render(
        <DriverPartialReturnModal
          items={dummyStop.items}
          onAgregarDevolucion={handleAgregar}
          onCerrar={handleCerrar}
        />
      );

      expect(screen.getByText(/CUARENTENA_CALIDAD/i)).toBeDefined();

      // Seleccionar motivo "Cadena de Frío"
      const btnMotivoFrio = screen.getByText('Cadena de Frío').closest('button');
      fireEvent.click(btnMotivoFrio!);

      // Cambiar kilos
      const inputKilos = screen.getByDisplayValue('1');
      fireEvent.change(inputKilos, { target: { value: '2.5' } });

      // Confirmar devolución
      const btnConfirmar = screen.getByText('AGREGAR DEVOLUCIÓN').closest('button');
      fireEvent.click(btnConfirmar!);

      expect(handleAgregar).toHaveBeenCalledWith({
        sku: 'MOJ-01',
        nombre: 'Mojarra Roja 500g',
        kilosDevueltos: 2.5,
        motivoRechazo: 'CADENA_FRIO',
        observaciones: undefined
      });
      expect(handleCerrar).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. DriverRouteOverview', () => {
    it('Renderiza resumen de avance, filtros y permite seleccionar parada para atenderla', async () => {
      // Inicializar ruta en store
      const demoRoute = driverDeliveryPwaService.crearRutaDemostracion('drv-001');
      useDriverDeliveryPwaStore.setState({
        session: {
          conductorId: 'drv-001',
          conductorNombre: 'Juan Carlos Rodríguez',
          email: 'conductor.juan@pezcaderia.com',
          vehiculoPlaca: 'WPZ-482',
          activo: true
        },
        activeRoute: demoRoute,
        recaudoResumen: driverDeliveryPwaService.obtenerResumenRecaudoRuta(demoRoute)
      });

      render(<DriverRouteOverview />);

      expect(screen.getByText('Juan Carlos Rodríguez')).toBeDefined();
      expect(screen.getByText('WPZ-482')).toBeDefined();
      expect(screen.getByText('Restaurante Mar y Sabor')).toBeDefined();

      // Filtrar por pendientes
      const tabPendientes = screen.getByText(/Pendientes/i);
      fireEvent.click(tabPendientes);
      expect(screen.getByText('Restaurante Mar y Sabor')).toBeDefined();

      // Seleccionar primera parada
      const stopCard = screen.getByText('Restaurante Mar y Sabor').closest('div')!;
      fireEvent.click(stopCard);

      expect(useDriverDeliveryPwaStore.getState().selectedStop?.id).toBe('stop-001');
    });
  });

  describe('5. DriverStopExecutionView', () => {
    it('Permite verificar canastillas, ingresar temperatura HACCP y confirmar entrega con firma', async () => {
      const demoRoute = driverDeliveryPwaService.crearRutaDemostracion('drv-001');
      useDriverDeliveryPwaStore.setState({
        session: {
          conductorId: 'drv-001',
          conductorNombre: 'Juan Carlos Rodríguez',
          email: 'conductor.juan@pezcaderia.com',
          vehiculoPlaca: 'WPZ-482',
          activo: true
        },
        activeRoute: demoRoute,
        selectedStop: demoRoute.paradas[0]
      });

      render(<DriverStopExecutionView />);

      expect(screen.getByText('Control Térmico HACCP (°C)')).toBeDefined();
      expect(screen.getByText('Verificación de Canastillas')).toBeDefined();

      // Verificar un ítem de canastilla
      const itemRow = screen.getByText('Mojarra Roja Entera').closest('div')!;
      fireEvent.click(itemRow);

      // Llenar datos de receptor
      const inputNombre = screen.getByPlaceholderText('Ej: Carlos Mendoza');
      const inputCedula = screen.getByPlaceholderText('Ej: 1098765432');
      fireEvent.change(inputNombre, { target: { value: 'Don Mario Pescador' } });
      fireEvent.change(inputCedula, { target: { value: '98765432' } });

      // Abrir modal de firma
      const btnAbrirFirma = screen.getByText('TOCAR PARA CAPTURAR FIRMA DIGITAL').closest('button');
      fireEvent.click(btnAbrirFirma!);

      // En el modal de firma, trazar y confirmar
      const canvas = screen.getByLabelText('Lienzo de firma digital táctil');
      fireEvent.pointerDown(canvas, { clientX: 20, clientY: 20, pointerId: 1 });
      fireEvent.pointerMove(canvas, { clientX: 50, clientY: 50, pointerId: 1 });
      fireEvent.pointerUp(canvas, { pointerId: 1 });

      const btnConfirmarFirma = screen.getByText(/CONFIRMAR FIRMA/i).closest('button');
      fireEvent.click(btnConfirmarFirma!);

      // Ahora muestra "Firma Digital Trazada y Capturada"
      expect(screen.getByText('Firma Digital Trazada y Capturada')).toBeDefined();

      // Confirmar entrega final
      const btnFinal = screen.getByText(/CONFIRMAR ENTREGA Y CONTINUAR RUTA/i).closest('button');
      fireEvent.click(btnFinal!);

      await waitFor(() => {
        expect(useDriverDeliveryPwaStore.getState().selectedStop).toBeNull();
      });
    });
  });
});
