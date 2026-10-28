// src/tests/b2bQuotationView.test.tsx
// Pruebas de Componentes UI para B2BQuotationView y ConvertToPosModal (SPEC-040)

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { B2BQuotationView } from '../views/quotations/B2BQuotationView';
import { ConvertToPosModal } from '../views/quotations/ConvertToPosModal';
import { b2bQuotationService } from '../services/b2bQuotationService';
import { prefacturaService } from '../services/prefacturaService';
import type { B2BQuotation } from '../types/b2bQuotation.types';

// Mock SweetAlert2 para evitar alerts en pruebas
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

describe('B2BQuotationView & ConvertToPosModal - Pruebas de Renderizado e Interacción', () => {
  const TENANT_ID = 'tenant-test-01';

  beforeEach(() => {
    b2bQuotationService.limpiarEstadoPruebas();
    prefacturaService.limpiarEstadoPruebas();
  });

  it('debe renderizar la cabecera, insignias y métricas clave de cotizaciones', async () => {
    render(<B2BQuotationView />);

    await waitFor(() => {
      expect(screen.getByText(/Mesa de Cotizaciones B2B/i)).toBeInTheDocument();
      expect(screen.getByText('SPEC-040')).toBeInTheDocument();
      expect(screen.getByText(/Total Propuestas/i)).toBeInTheDocument();
      expect(screen.getByText(/Convertidas a POS/i)).toBeInTheDocument();
      expect(screen.getByText(/Nueva Cotización/i)).toBeInTheDocument();
    });
  });

  it('debe renderizar el modal de conversión a POS con detalles y selector de bodega', async () => {
    const mockCotizacion: B2BQuotation = {
      id: 'cot-test-123',
      tenantId: TENANT_ID,
      codigoCotizacion: 'COT-2026-00042',
      clienteId: 'cli-constructor-premium',
      asesorUsuarioId: 'user-01',
      estado: 'APROBADA',
      items: [
        {
          id: 'item-1',
          productoSku: 'HERR-PALA-01',
          nombre: 'Pala Cuadrada Cabo Madera',
          cantidad: 15,
          precioUnitarioPactado: 42000,
          tarifaAplicada: 'MAYORISTA',
          descuentoPct: 0,
          subtotalItem: 630000,
        },
      ],
      subtotal: 630000,
      totalDescuentos: 0,
      totalImpuestos: 0,
      totalGeneral: 630000,
      diasVigencia: 15,
      fechaEmision: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 86400000 * 15).toISOString(),
    };

    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <ConvertToPosModal
        isOpen={true}
        onClose={handleClose}
        cotizacion={mockCotizacion}
        onSuccess={handleSuccess}
      />
    );

    expect(screen.getByText(/Convertir Cotización a Preventa POS/i)).toBeInTheDocument();
    expect(screen.getByText('COT-2026-00042')).toBeInTheDocument();
    expect(screen.getByText(/Pala Cuadrada Cabo Madera/i)).toBeInTheDocument();
    expect(screen.getByText(/Bodega de Despacho/i)).toBeInTheDocument();
    expect(screen.getByText(/Terminal POS de Destino/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirmar y Enviar a Caja Central/i)).toBeInTheDocument();
  });

  it('debe no renderizar ConvertToPosModal si isOpen es false o cotizacion es null', () => {
    const { container } = render(
      <ConvertToPosModal
        isOpen={false}
        onClose={vi.fn()}
        cotizacion={null}
        onSuccess={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
