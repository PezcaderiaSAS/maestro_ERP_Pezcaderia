import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  B2BClientHeaderBar,
  B2BCreditCardSummary,
  B2BCatalogGrid,
  B2BItemConfiguratorModal,
  B2BRecurringTemplatesDrawer,
  B2BOrderTrackingTimeline,
} from '../views/b2b/portal/components';
import type {
  B2BCustomerProfile,
  B2BCreditStatus,
  B2BCatalogProductItem,
  B2BRecurringTemplate,
  B2BOrderRecord,
} from '../types/b2bCustomerPortal.types';

describe('Componentes Atómicos UI — Portal B2B HORECA (TASK-027-04)', () => {
  const mockCliente: B2BCustomerProfile = {
    id: 'cli-restaurante-mar',
    razonSocial: 'Restaurante Mar Gourmet S.A.S.',
    nombreComercial: 'Mar Gourmet',
    nit: '900123456-7',
    tipoPrecio: 'RESTAURANTE',
    cupoCreditoCop: 5000000,
    saldoCarteraPendienteCop: 1200000,
    cupoDisponibleCop: 3800000,
    plazoDiasPago: 15,
    direccionPrincipal: 'Calle 93 # 12-45, Bogotá',
    sucursales: [
      {
        id: 'suc-mar-parque93',
        nombre: 'Sede Parque 93',
        direccion: 'Calle 93 # 12-45, Bogotá',
        telefono: '3109876543',
        ciudad: 'Bogotá',
      },
    ],
    activo: true,
  };

  const mockCartera: B2BCreditStatus = {
    cupoTotalCop: 5000000,
    saldoPendienteCop: 1200000,
    cupoDisponibleCop: 3800000,
    estadoSemaforo: 'AL_DIA',
    facturasPendientesCount: 2,
    diasPromedioPago: 12,
  };

  const mockProduct: B2BCatalogProductItem = {
    productoId: 'prod-salmon-noruego',
    sku: 'SALM-NOR-01',
    nombre: 'Salmón Noruego Premium',
    especie: 'Salmo salar',
    categoria: 'Pescados Importados',
    precioBaseCop: 75000,
    precioPactadoCop: 69000,
    modalidadVentaDefault: 'KILOGRAMOS_ESTIMADOS',
    cortesDisponibles: ['FILETE_CON_PIEL', 'FILETE_SIN_PIEL'],
    empaquesDisponibles: ['CAJA_TERMICA_HIELO', 'BOLSA_VACIO'],
    stockDisponibleKg: 45,
    origen: 'Noruega',
  };

  describe('B2BClientHeaderBar', () => {
    it('debe renderizar el selector de cliente y botones de plantillas y carrito', () => {
      const onSeleccionarCliente = vi.fn();
      const onOpenCart = vi.fn();
      const onOpenTemplates = vi.fn();

      render(
        <B2BClientHeaderBar
          clientes={[mockCliente]}
          clienteActivo={mockCliente}
          onSeleccionarCliente={onSeleccionarCliente}
          sucursalSeleccionadaId="suc-mar-parque93"
          onSeleccionarSucursal={vi.fn()}
          itemCount={3}
          totalEstimadoCop={250000}
          onOpenCart={onOpenCart}
          onOpenTemplates={onOpenTemplates}
          modoAcceso="ERP_COMERCIAL"
        />
      );

      expect(screen.getByTestId('b2b-client-header-bar')).toBeDefined();
      expect(screen.getByTestId('cart-badge-count').textContent).toBe('3');

      // Click en abrir plantillas
      fireEvent.click(screen.getByTestId('btn-open-recurring-templates'));
      expect(onOpenTemplates).toHaveBeenCalled();

      // Click en abrir carrito
      fireEvent.click(screen.getByTestId('btn-open-cart-drawer'));
      expect(onOpenCart).toHaveBeenCalled();
    });
  });

  describe('B2BCreditCardSummary', () => {
    it('debe mostrar los valores de cupo y el semáforo en estado AL_DIA', () => {
      render(<B2BCreditCardSummary cartera={mockCartera} cliente={mockCliente} />);

      expect(screen.getByTestId('credit-cupo-total').textContent).toContain('5.000.000');
      expect(screen.getByTestId('credit-saldo-pendiente').textContent).toContain('1.200.000');
      expect(screen.getByTestId('credit-cupo-disponible').textContent).toContain('3.800.000');
      expect(screen.getByTestId('credit-status-badge').textContent).toContain('Crédito al Día');
    });

    it('debe mostrar el semáforo EN_ALERTA cuando el cupo está próximo a agotarse', () => {
      const carteraAlerta: B2BCreditStatus = {
        ...mockCartera,
        estadoSemaforo: 'EN_ALERTA',
        cupoDisponibleCop: 50000,
      };

      render(<B2BCreditCardSummary cartera={carteraAlerta} cliente={mockCliente} />);
      expect(screen.getByTestId('credit-status-badge').textContent).toContain('Cupo Próximo a Excederse');
    });
  });

  describe('B2BCatalogGrid', () => {
    it('debe listar productos con precio preferencial y disparar selección', () => {
      const onSelectProduct = vi.fn();
      const onSelectCategoria = vi.fn();

      render(
        <B2BCatalogGrid
          catalogo={[mockProduct]}
          categorias={['TODAS', 'Pescados Importados']}
          categoriaSeleccionada="TODAS"
          onSelectCategoria={onSelectCategoria}
          busqueda=""
          onSearchChange={vi.fn()}
          onSelectProduct={onSelectProduct}
        />
      );

      expect(screen.getByTestId('catalog-card-SALM-NOR-01')).toBeDefined();
      expect(screen.getByText('Salmón Noruego Premium')).toBeDefined();

      fireEvent.click(screen.getByTestId('btn-select-product-SALM-NOR-01'));
      expect(onSelectProduct).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('B2BItemConfiguratorModal', () => {
    it('debe permitir cambiar corte, empaque, cantidad y confirmar agregar al carrito', () => {
      const onAddToCart = vi.fn();
      const onClose = vi.fn();

      render(
        <B2BItemConfiguratorModal
          isOpen={true}
          producto={mockProduct}
          onClose={onClose}
          onAddToCart={onAddToCart}
        />
      );

      expect(screen.getByTestId('b2b-item-configurator-modal')).toBeDefined();

      // Cambiar a FILETE_SIN_PIEL
      fireEvent.click(screen.getByTestId('btn-corte-filete_sin_piel'));

      // Incrementar cantidad
      fireEvent.click(screen.getByTestId('btn-qty-increment')); // 5 -> 6

      // Confirmar agregar
      fireEvent.click(screen.getByTestId('btn-confirm-add-cart'));
      expect(onAddToCart).toHaveBeenCalledWith(
        mockProduct,
        expect.objectContaining({
          corte: 'FILETE_SIN_PIEL',
          cantidad: 6,
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('B2BRecurringTemplatesDrawer', () => {
    it('debe renderizar plantilla y permitir re-ordenar con 1 clic', () => {
      const mockPlantilla: B2BRecurringTemplate = {
        id: 'tmpl-1',
        clienteId: 'cli-restaurante-mar',
        nombrePlantilla: 'Suministro Pescados de Semana',
        diasSemana: ['MARTES', 'JUEVES'],
        jornadaEntrega: 'MANANA',
        activa: true,
        lineas: [
          {
            productoId: 'prod-salmon-noruego',
            sku: 'SALM-NOR-01',
            nombre: 'Salmón Noruego Premium',
            corte: 'FILETE_CON_PIEL',
            empaque: 'CAJA_TERMICA_HIELO',
            modalidadVenta: 'KILOGRAMOS_ESTIMADOS',
            cantidadSolicitada: 10,
            precioPactadoCop: 69000,
          },
        ],
      };

      const onReordenarPlantilla = vi.fn();
      const onClose = vi.fn();

      render(
        <B2BRecurringTemplatesDrawer
          isOpen={true}
          onClose={onClose}
          plantillas={[mockPlantilla]}
          onReordenarPlantilla={onReordenarPlantilla}
        />
      );

      expect(screen.getByTestId('template-card-tmpl-1')).toBeDefined();
      expect(screen.getByText('Suministro Pescados de Semana')).toBeDefined();

      fireEvent.click(screen.getByTestId('btn-reorder-template-tmpl-1'));
      expect(onReordenarPlantilla).toHaveBeenCalledWith('tmpl-1');
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('B2BOrderTrackingTimeline', () => {
    it('debe renderizar el ciclo de vida del pedido, temperatura y remisión', () => {
      const mockOrder: B2BOrderRecord = {
        id: 'order-1',
        numeroPedido: 'PED-B2B-1001',
        clienteId: 'cli-restaurante-mar',
        clienteNombre: 'Restaurante Mar Gourmet S.A.S.',
        nit: '900123456-7',
        sucursalEntrega: 'Sede Parque 93',
        direccionEntrega: 'Calle 93 # 12-45',
        fechaCreacion: '2026-10-23T10:00:00Z',
        fechaRequeridaEntrega: '2026-10-24',
        jornadaRequerida: 'MANANA',
        formaPago: 'CREDITO_B2B',
        estado: 'EN_RUTA_FRIO',
        temperaturaDespachoCelsius: 2.4,
        numeroRemision: 'REM-WMS-8841',
        subtotalEstimadoCop: 690000,
        ivaEstimadoCop: 0,
        totalEstimadoCop: 690000,
        lineas: [],
      };

      render(<B2BOrderTrackingTimeline pedido={mockOrder} />);

      expect(screen.getByTestId('b2b-order-tracking-timeline')).toBeDefined();
      expect(screen.getByText('PED-B2B-1001')).toBeDefined();
      expect(screen.getByTestId('temperature-display').textContent).toContain('2.4°C');
      expect(screen.getByTestId('remision-display').textContent).toContain('REM-WMS-8841');
    });
  });
});
