import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PurchasesReceivingView } from '../views/purchases/PurchasesReceivingView';
import { dockPurchasesReceivingService } from '../services/dockPurchasesReceivingService';
import { AppRouteId, APP_ROUTES_METADATA, isRouteAllowedForRole } from '../routes/AppRoute';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true })
  }
}));

describe('TASK-022-06: Vista Principal de Compras y Recepción en Muelle', () => {
  beforeEach(() => {
    dockPurchasesReceivingService.limpiarEnMemoria();
  });

  it('1. Renderiza encabezado de muelle, pestañas táctiles >= 48px y cero etiquetas <img>', () => {
    const { container } = render(<PurchasesReceivingView />);

    // Título y subtítulo
    expect(screen.getByText('Compras y Recepción en Muelle')).toBeDefined();
    expect(screen.getByText(/Pesaje metrológico con deducción de hielo/i)).toBeDefined();

    // Pestañas principales táctiles >= 48px
    const tabNueva = screen.getByTestId('tab-nueva-recepcion');
    const tabHistorial = screen.getByTestId('tab-historial-furgones');
    expect(tabNueva.className).toContain('min-h-[48px]');
    expect(tabHistorial.className).toContain('min-h-[48px]');

    // Regla del Niño de 12 Años: Cero imágenes externas
    expect(container.querySelectorAll('img')).toHaveLength(0);

    // Por defecto renderiza el Wizard de recepción
    expect(screen.getByTestId('dock-receiving-wizard')).toBeDefined();
  });

  it('2. Cambia a la pestaña de Historial de Furgones Recibidos y muestra estado vacío inicial', () => {
    render(<PurchasesReceivingView />);

    const tabHistorial = screen.getByTestId('tab-historial-furgones');
    fireEvent.click(tabHistorial);

    expect(screen.getByTestId('panel-historial-recepciones')).toBeDefined();
    expect(screen.getByText('No se encontraron recepciones de muelle')).toBeDefined();
    expect(screen.getByTestId('input-search-dock-history')).toBeDefined();
  });

  it('3. Muestra recepciones registradas en la tabla del historial con datos metrológicos y badge de temperatura', async () => {
    // Mockear recepción en el historial
    vi.spyOn(dockPurchasesReceivingService, 'obtenerHistorialRecepciones').mockReturnValue([
      {
        consecutivoMuelle: 'REC-20261019-001',
        proveedorId: 'prov-pacifico-1',
        proveedorNombre: 'Pescadores del Pacífico S.A.S',
        proveedorNit: '900888777-1',
        placaVehiculo: 'TRK-892',
        conductorNombre: 'Carlos Mena',
        temperaturaCava: 2.5,
        fechaFaena: '2026-10-19',
        tipoConservacion: 'FRESCO',
        bodegaDestinoId: 'camara-1',
        bodegaDestinoNombre: 'Cámara 1 - Pescado Fresco',
        totalKilosNetos: 250.5,
        totalCompraCOP: 4500000,
        formaPago: 'CREDITO (15 días)',
        lotesGenerados: [
          {
            loteId: 'lote-corv-1',
            codigoLote: 'LOT-20261019-PAC-001',
            productoId: 'prod-corvina',
            productoNombre: 'Corvina de Muelle Fresca',
            pesoNetoKg: 250.5,
            fechaVencimiento: '2026-10-27'
          }
        ],
        createdAt: '2026-10-19T06:30:00'
      }
    ]);

    render(<PurchasesReceivingView />);

    // Ir a pestaña de historial
    fireEvent.click(screen.getByTestId('tab-historial-furgones'));

    // Verificar datos en la tabla
    expect(screen.getByTestId('table-historial-furgones')).toBeDefined();
    expect(screen.getByText('REC-20261019-001')).toBeDefined();
    expect(screen.getByText('Pescadores del Pacífico S.A.S')).toBeDefined();
    expect(screen.getByText('TRK-892')).toBeDefined();
    expect(screen.getByText('2.5°C')).toBeDefined();
    expect(screen.getAllByText('$4.500.000').length).toBeGreaterThan(0);

    // Abrir modal de detalle con el botón de ojo
    const btnDetail = screen.getByTestId('btn-view-detail-REC-20261019-001');
    fireEvent.click(btnDetail);

    // Modal de detalle y trazabilidad FEFO
    expect(screen.getByTestId('modal-detail-dock-receiving')).toBeDefined();
    expect(screen.getByText('LOT-20261019-PAC-001')).toBeDefined();
    expect(screen.getByTestId('btn-print-acta-from-modal')).toBeDefined();

    // Cerrar modal
    fireEvent.click(screen.getByTestId('btn-close-detail-modal'));
    expect(screen.queryByTestId('modal-detail-dock-receiving')).toBeNull();
  });

  it('4. Valida la integración de AppRouteId.DOCK_PURCHASES en metadatos y RBAC', () => {
    expect(AppRouteId.DOCK_PURCHASES).toBe('compras_muelle');

    const metadata = APP_ROUTES_METADATA[AppRouteId.DOCK_PURCHASES];
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Compras de Muelle');
    expect(metadata.isPrimaryNav).toBe(true);
    expect(metadata.iconName).toBe('Anchor');

    // Permisos RBAC
    expect(isRouteAllowedForRole(AppRouteId.DOCK_PURCHASES, 'admin')).toBe(true);
    expect(isRouteAllowedForRole(AppRouteId.DOCK_PURCHASES, 'bodega')).toBe(true);
    expect(isRouteAllowedForRole(AppRouteId.DOCK_PURCHASES, 'administrativo')).toBe(true);
    expect(isRouteAllowedForRole(AppRouteId.DOCK_PURCHASES, 'vendedor')).toBe(false);
  });
});
