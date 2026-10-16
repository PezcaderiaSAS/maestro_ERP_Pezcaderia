import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutiveTrafficLightWidget } from '../views/dashboard/components/ExecutiveTrafficLightWidget';
import DashboardView from '../views/DashboardView';
import { useAppStore } from '../store/useAppStore';
import { useOrderStore } from '../store/useOrderStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { cashService } from '../services/cashService';
import { AppRouteId } from '../routes/AppRoute';

describe('TASK-018-11: ExecutiveTrafficLightWidget & DashboardView Suite (Regla del Niño de 12 Años)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    useAppStore.setState({
      currentView: AppRouteId.DASHBOARD,
    });

    useOrderStore.setState({
      quotations: [
        { id: 'q-1', estado: 'LISTO' },
        { id: 'q-2', estado: 'LISTO' },
        { id: 'q-3', estado: 'EN_DESPACHO' },
        { id: 'q-4', estado: 'ENTREGADO' },
      ] as any,
    });

    useInventoryStore.setState({
      products: [
        { id: 'p-1', sku: 'MOJ-01', nombre: 'Mojarra', activo: true, control_inventario: true, buffer_seguridad: 20 },
        { id: 'p-2', sku: 'SALM-01', nombre: 'Salmón', activo: true, control_inventario: true, buffer_seguridad: 15 },
        { id: 'p-3', sku: 'CAM-01', nombre: 'Camarón', activo: true, control_inventario: true, buffer_seguridad: 10 },
      ] as any,
      stock: {
        'Bodega Central': {
          'MOJ-01': 5, // Crítico (5 <= 20)
          'SALM-01': 30, // Óptimo (30 > 15)
          'CAM-01': 0, // Crítico/Agotado (0 <= 10)
        },
      },
    });

    vi.spyOn(cashService, 'getTurnos').mockReturnValue([
      {
        id: 'turno-1',
        cajaId: 'caja-1',
        estado: 'ABIERTO',
        saldoTeoricoGlobal: 800000,
        totalEfectivo: 450000,
        totalTransferencias: 150000,
        totalDatafono: 200000,
      } as any,
    ]);
  });

  it('1. debe renderizarse con CERO etiquetas <img> y paleta Light Mode WCAG 2.2 AA+', () => {
    const { container } = render(<ExecutiveTrafficLightWidget />);

    const imgElements = container.querySelectorAll('img');
    expect(imgElements.length).toBe(0);

    expect(screen.getByTestId('executive-traffic-light-widget')).toHaveClass('bg-white');
    expect(screen.getByText('Semáforo Operativo Ejecutivo')).toBeInTheDocument();
  });

  it('2. debe calcular y mostrar el semáforo 1 (Caja Disponible Hoy) con altura táctil >= 56px', () => {
    render(<ExecutiveTrafficLightWidget />);

    const cardCaja = screen.getByTestId('traffic-light-caja');
    expect(cardCaja).toBeInTheDocument();
    expect(cardCaja.className).toContain('min-h-[100px]');
    expect(cardCaja.className).toContain('active:scale-95');

    // 450.000 + 150.000 + 200.000 = $800.000
    expect(screen.getByText('$800.000')).toBeInTheDocument();
    expect(screen.getByText('Caja Operativa')).toBeInTheDocument();
  });

  it('3. al pulsar la tarjeta de Caja Disponible, debe navegar a AppRouteId.CASH_DESK (caja)', () => {
    const handleNavigate = vi.fn();
    render(<ExecutiveTrafficLightWidget onNavigate={handleNavigate} />);

    const cardCaja = screen.getByTestId('traffic-light-caja');
    fireEvent.click(cardCaja);

    expect(handleNavigate).toHaveBeenCalledWith(AppRouteId.CASH_DESK);
  });

  it('4. debe calcular y mostrar el semáforo 2 (Despachos B2B) con desglose en cava y furgón', () => {
    render(<ExecutiveTrafficLightWidget />);

    const cardDespachos = screen.getByTestId('traffic-light-despachos');
    expect(cardDespachos).toBeInTheDocument();
    expect(cardDespachos.className).toContain('min-h-[100px]');

    // 2 listos + 1 en despacho = 3 pedidos en tránsito
    expect(screen.getByText('3 Pedidos')).toBeInTheDocument();
    expect(screen.getByText(/2 listos en cava · 1 en furgón/i)).toBeInTheDocument();
  });

  it('5. al pulsar la tarjeta de Despachos B2B, debe navegar a AppRouteId.ORDERS_KANBAN (kanban)', () => {
    const handleNavigate = vi.fn();
    render(<ExecutiveTrafficLightWidget onNavigate={handleNavigate} />);

    const cardDespachos = screen.getByTestId('traffic-light-despachos');
    fireEvent.click(cardDespachos);

    expect(handleNavigate).toHaveBeenCalledWith(AppRouteId.ORDERS_KANBAN);
  });

  it('6. debe calcular y mostrar el semáforo 3 (Stock Crítico) alertando productos bajo buffer', () => {
    render(<ExecutiveTrafficLightWidget />);

    const cardStock = screen.getByTestId('traffic-light-stock');
    expect(cardStock).toBeInTheDocument();
    expect(cardStock.className).toContain('min-h-[100px]');

    // MOJ-01 (5 <= 20) y CAM-01 (0 <= 10) -> 2 productos bajo buffer
    expect(screen.getByText('2 Productos Bajo Buffer')).toBeInTheDocument();
    expect(screen.getByText('Reposición Requerida')).toBeInTheDocument();
  });

  it('7. al pulsar la tarjeta de Stock Crítico, debe navegar a AppRouteId.INVENTORY (inventario)', () => {
    const handleNavigate = vi.fn();
    render(<ExecutiveTrafficLightWidget onNavigate={handleNavigate} />);

    const cardStock = screen.getByTestId('traffic-light-stock');
    fireEvent.click(cardStock);

    expect(handleNavigate).toHaveBeenCalledWith(AppRouteId.INVENTORY);
  });

  it('8. debe renderizarse e integrarse correctamente dentro de DashboardView', () => {
    render(<DashboardView ventas={[]} devoluciones={[]} />);

    // El widget debe estar presente en el Dashboard
    expect(screen.getByTestId('executive-traffic-light-widget')).toBeInTheDocument();
    expect(screen.getByText('Semáforo Operativo Ejecutivo')).toBeInTheDocument();
    expect(screen.getByTestId('traffic-light-caja')).toBeInTheDocument();
    expect(screen.getByTestId('traffic-light-despachos')).toBeInTheDocument();
    expect(screen.getByTestId('traffic-light-stock')).toBeInTheDocument();
  });
});
