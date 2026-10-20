import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

import {
  registerServiceWorker,
  applyServiceWorkerUpdate,
  unregisterServiceWorker
} from '../services/serviceWorkerRegistration';
import { usePwaStore } from '../store/usePwaStore';
import { PwaUpdatePromptModal } from '../components/pwa/PwaUpdatePromptModal';
import { PwaInstallBannerButton } from '../components/pwa/PwaInstallBannerButton';
import { DriverStopExecutionView } from '../views/driver/components/DriverStopExecutionView';
import { useDriverDeliveryPwaStore } from '../store/useDriverDeliveryPwaStore';
import type { DriverDeliveryStop } from '../types/driverDeliveryPwa.types';

describe('SPEC-024: Service Worker PWA, Web App Manifest y Caché Offline Suite', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
    usePwaStore.setState({
      isInstallable: false,
      isStandalone: false,
      hasUpdatePending: false,
      waitingWorker: null,
      deferredPrompt: null
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true
    });
  });

  describe('1. Verificación Estándar W3C del Web App Manifest (public/manifest.webmanifest)', () => {
    it('debe contener un archivo manifest.webmanifest válido con metadatos y shortcuts', () => {
      const manifestPath = path.resolve(process.cwd(), 'public/manifest.webmanifest');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const content = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(content);

      expect(manifest.name).toContain('La Pezcadería ERP');
      expect(manifest.short_name).toBe('Pezcadería');
      expect(manifest.start_url).toBe('/');
      expect(manifest.display).toBe('standalone');
      expect(manifest.orientation).toBe('portrait-primary');
      expect(manifest.theme_color).toBe('#0f172a');
      expect(manifest.background_color).toBe('#ffffff');

      // Iconos requeridos
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
      const icon192 = manifest.icons.find((i: any) => i.sizes === '192x192');
      expect(icon192).toBeDefined();

      // Accesos directos requeridos (Shortcuts)
      expect(Array.isArray(manifest.shortcuts)).toBe(true);
      const conductorShortcut = manifest.shortcuts.find((s: any) => s.url === '/repartidor');
      expect(conductorShortcut).toBeDefined();
      expect(conductorShortcut.name).toContain('Conductor');
    });

    it('deben existir los iconos SVG referenciados en public/icons/', () => {
      const icon192 = path.resolve(process.cwd(), 'public/icons/icon-192.svg');
      const icon512 = path.resolve(process.cwd(), 'public/icons/icon-512.svg');
      const shortcutDriver = path.resolve(process.cwd(), 'public/icons/shortcut-driver.svg');
      const shortcutPos = path.resolve(process.cwd(), 'public/icons/shortcut-pos.svg');

      expect(fs.existsSync(icon192)).toBe(true);
      expect(fs.existsSync(icon512)).toBe(true);
      expect(fs.existsSync(shortcutDriver)).toBe(true);
      expect(fs.existsSync(shortcutPos)).toBe(true);
    });
  });

  describe('2. Ciclo de Vida y Registro de Service Worker (serviceWorkerRegistration.ts)', () => {
    it('retorna null silenciosamente si serviceWorker no está presente en navigator', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true
      });

      const reg = await registerServiceWorker();
      expect(reg).toBeNull();
    });

    it('registra sw.js con scope "/" cuando serviceWorker está disponible', async () => {
      const mockRegister = vi.fn().mockResolvedValue({
        scope: '/',
        installing: null,
        waiting: null,
        active: { state: 'activated' },
        onupdatefound: null
      });

      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: mockRegister,
            controller: null
          }
        },
        writable: true,
        configurable: true
      });

      const onUpdate = vi.fn();
      const onSuccess = vi.fn();

      const reg = await registerServiceWorker({ onUpdate, onSuccess });

      expect(mockRegister).toHaveBeenCalledWith('/sw.js', { scope: '/' });
      expect(reg).toBeDefined();
    });

    it('dispara onUpdate inmediatamente si registration ya tiene un worker en estado waiting', async () => {
      const waitingWorker = { postMessage: vi.fn(), state: 'installed' };
      const mockRegister = vi.fn().mockResolvedValue({
        scope: '/',
        installing: null,
        waiting: waitingWorker,
        active: { state: 'activated' },
        onupdatefound: null
      });

      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            register: mockRegister,
            controller: {}
          }
        },
        writable: true,
        configurable: true
      });

      const onUpdate = vi.fn();
      await registerServiceWorker({ onUpdate });

      expect(onUpdate).toHaveBeenCalled();
    });

    it('applyServiceWorkerUpdate envía mensaje SKIP_WAITING al worker en espera', () => {
      const mockPostMessage = vi.fn();
      const fakeWorker = { postMessage: mockPostMessage } as unknown as ServiceWorker;

      const mockAddEventListener = vi.fn();
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            addEventListener: mockAddEventListener
          }
        },
        writable: true,
        configurable: true
      });

      applyServiceWorkerUpdate(fakeWorker);
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'controllerchange',
        expect.any(Function),
        { once: true }
      );
    });

    it('unregisterServiceWorker desregistra correctamente el worker activo', async () => {
      const mockUnregister = vi.fn().mockResolvedValue(true);
      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            getRegistration: vi.fn().mockResolvedValue({ unregister: mockUnregister })
          }
        },
        writable: true,
        configurable: true
      });

      const result = await unregisterServiceWorker();
      expect(result).toBe(true);
      expect(mockUnregister).toHaveBeenCalled();
    });
  });

  describe('3. Store Reactivo Zustand usePwaStore', () => {
    it('setWaitingWorker activa hasUpdatePending y almacena el worker', () => {
      const worker = { postMessage: vi.fn() } as unknown as ServiceWorker;
      usePwaStore.getState().setWaitingWorker(worker);

      expect(usePwaStore.getState().hasUpdatePending).toBe(true);
      expect(usePwaStore.getState().waitingWorker).toBe(worker);
    });

    it('dismissUpdate desactiva hasUpdatePending', () => {
      usePwaStore.getState().setWaitingWorker({} as ServiceWorker);
      expect(usePwaStore.getState().hasUpdatePending).toBe(true);

      usePwaStore.getState().dismissUpdate();
      expect(usePwaStore.getState().hasUpdatePending).toBe(false);
    });

    it('promptInstall invoca prompt y retorna true si el usuario acepta', async () => {
      const mockPrompt = vi.fn().mockResolvedValue(undefined);
      const fakeEvent = {
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' })
      } as any;

      usePwaStore.setState({
        isInstallable: true,
        deferredPrompt: fakeEvent
      });

      const success = await usePwaStore.getState().promptInstall();
      expect(mockPrompt).toHaveBeenCalled();
      expect(success).toBe(true);
      expect(usePwaStore.getState().isInstallable).toBe(false);
    });
  });

  describe('4. Componentes Táctiles PWA ("Regla del Niño de 12 Años")', () => {
    it('PwaUpdatePromptModal se renderiza con botón gigante >= 56px cuando hay actualización', () => {
      usePwaStore.setState({ hasUpdatePending: true });

      render(<PwaUpdatePromptModal />);

      expect(screen.getByText('Nueva Versión Disponible')).toBeInTheDocument();
      const updateButton = screen.getByRole('button', { name: /ACTUALIZAR AHORA/i });
      expect(updateButton).toBeInTheDocument();
      expect(updateButton.className).toContain('min-h-[56px]');
    });

    it('PwaInstallBannerButton renderiza botón táctil >= 48px si la app es instalable y no está en standalone', async () => {
      usePwaStore.setState({
        isInstallable: true,
        isStandalone: false
      });

      render(<PwaInstallBannerButton />);

      const installButton = screen.getByRole('button', {
        name: /INSTALAR APP EN PANTALLA PRINCIPAL/i
      });
      expect(installButton).toBeInTheDocument();
      expect(installButton.className).toContain('min-h-[48px]');
    });

    it('PwaInstallBannerButton no se renderiza si ya está en modo standalone', () => {
      usePwaStore.setState({
        isInstallable: true,
        isStandalone: true
      });

      const { container } = render(<PwaInstallBannerButton />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('5. Selector Táctil de Forma de Pago en /repartidor (DriverStopExecutionView)', () => {
    const mockStop: DriverDeliveryStop = {
      id: 'stop-pwa-credit-1',
      pedidoId: 'ped-credit-1',
      numeroPedido: 'PED-CR-100',
      clienteId: 'cli-001',
      clienteNombre: 'Restaurante El Pescador',
      clienteDireccion: 'Calle 36 # 22-05, Centro',
      clienteTelefono: '+57 310 111 2233',
      montoPedidoOriginal: 480000,
      montoCobradoFinal: 0,
      formaPago: 'EFECTIVO',
      montoEfectivo: 480000,
      montoDigital: 0,
      estadoEntrega: 'PENDIENTE',
      items: [
        { sku: 'SALM-01', nombre: 'Salmón Premium', cantidad: 8, precioUnitario: 60000 }
      ]
    };

    beforeEach(() => {
      // Mock Canvas HTML5 para firma digital
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
        scale: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        clearRect: vi.fn(),
        lineCap: 'round',
        lineJoin: 'round',
        strokeStyle: '#000',
        lineWidth: 2.5
      });
      HTMLCanvasElement.prototype.toDataURL = vi
        .fn()
        .mockReturnValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

      useDriverDeliveryPwaStore.setState({
        session: {
          conductorId: 'drv-001',
          conductorNombre: 'Carlos Conductor',
          email: 'carlos@pezcaderia.com',
          activo: true
        },
        activeRoute: {
          manifiestoId: 'mani-test-cr',
          numeroManifiesto: 'MAN-2026-CR',
          fecha: new Date().toISOString(),
          estado: 'EN_RUTA',
          conductorId: 'drv-001',
          conductorNombre: 'Carlos Conductor',
          vehiculoPlaca: 'BTL-999',
          paradas: [mockStop],
          progresoPorcentaje: 0,
          paradasCompletadas: 0,
          paradasTotales: 1,
          totalKilosCargados: 8
        },
        selectedStop: mockStop
      });
    });

    it('debe permitir seleccionar "Crédito", mostrar badge informativo y fijar recaudo en $0', async () => {
      render(<DriverStopExecutionView />);

      // Verificar que los 4 botones de forma de pago existen con altura táctil >= 48px
      const btnEfectivo = screen.getByTestId('btn-pago-efectivo');
      const btnTransferencia = screen.getByTestId('btn-pago-transferencia_digital');
      const btnCredito = screen.getByTestId('btn-pago-credito_b2b');
      const btnMixto = screen.getByTestId('btn-pago-mixto');

      expect(btnEfectivo).toBeInTheDocument();
      expect(btnTransferencia).toBeInTheDocument();
      expect(btnCredito).toBeInTheDocument();
      expect(btnMixto).toBeInTheDocument();

      expect(btnCredito.className).toContain('min-h-[48px]');

      // Cambiar forma de pago a Crédito B2B
      fireEvent.click(btnCredito);

      // Debe mostrar el badge informativo de venta a Crédito B2B
      expect(screen.getByText('Venta Entregada a Crédito B2B')).toBeInTheDocument();
      expect(
        screen.getByText(/El cliente recibe la mercancía a satisfacción/i)
      ).toBeInTheDocument();

      // No deben mostrarse inputs de efectivo o transferencia en pantalla
      expect(screen.queryByLabelText(/Efectivo Físico Recibido/i)).not.toBeInTheDocument();
    });
  });
});
