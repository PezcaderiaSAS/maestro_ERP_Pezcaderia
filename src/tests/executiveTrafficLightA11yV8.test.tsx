import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExecutiveTrafficLightWidget } from '../views/dashboard/components/ExecutiveTrafficLightWidget';
import { useOrderStore } from '../store/useOrderStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { cashService } from '../services/cashService';

describe('TASK-039-02: ExecutiveTrafficLightWidget - Accesibilidad WCAG 2.2 AAA en Tarjeta de Stock Crítico', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    useOrderStore.setState({
      quotations: [
        { id: 'q-1', estado: 'LISTO' },
      ] as any,
    });

    useInventoryStore.setState({
      products: [
        { id: 'p1', sku: 'PES-01', nombre: 'Pescado Sierra', activo: true, control_inventario: true, buffer_seguridad: 10 },
      ] as any,
      stock: {
        'Bodega Principal': { 'PES-01': 2 },
      },
    });

    vi.spyOn(cashService, 'getTurnos').mockReturnValue([]);
  });

  it('debe utilizar una superficie neutra dark glassmorphism (bg-slate-900/90) y borde perimetral de alerta (border-rose-500/40) evitando fondos burdeos de bajo contraste', () => {
    render(<ExecutiveTrafficLightWidget stockCriticoOverride={3} />);

    const cardStock = screen.getByTestId('traffic-light-stock');
    expect(cardStock).toBeInTheDocument();

    // Debe contener superficie neutra dark glassmorphism y borde de advertencia
    expect(cardStock.className).toContain('bg-slate-900/90');
    expect(cardStock.className).toContain('border-rose-500/40');
    // NO debe contener el fondo burdeos inaccesible que falla contraste
    expect(cardStock.className).not.toContain('bg-rose-950/40');
  });

  it('el conteo numérico principal debe renderizarse en text-white font-mono para garantizar ratio de contraste >= 12:1 (WCAG AAA)', () => {
    render(<ExecutiveTrafficLightWidget stockCriticoOverride={5} />);

    const valorCritico = screen.getByText('5 Productos Bajo Buffer');
    expect(valorCritico).toBeInTheDocument();
    expect(valorCritico.className).toContain('text-white');
    expect(valorCritico.className).toContain('font-mono');
    expect(valorCritico.className).not.toContain('text-rose-400');
  });

  it('el badge de estado de reposición debe utilizar texto legible de alto contraste', () => {
    render(<ExecutiveTrafficLightWidget stockCriticoOverride={4} />);

    const badgeReposicion = screen.getByText('Reposición Requerida').closest('span');
    expect(badgeReposicion).toBeInTheDocument();
    expect(badgeReposicion?.className).toContain('text-rose-200');
    expect(badgeReposicion?.className).toContain('border-rose-500/40');
  });

  it('cuando no hay stock crítico (Nivel Óptimo), debe usar superficie neutra con borde esmeralda y texto blanco', () => {
    render(<ExecutiveTrafficLightWidget stockCriticoOverride={0} />);

    const cardStock = screen.getByTestId('traffic-light-stock');
    expect(cardStock.className).toContain('bg-slate-900/90');
    expect(cardStock.className).toContain('border-emerald-500/40');
    expect(screen.getByText('Sin Quiebres de Stock')).toHaveClass('text-white');
  });
});
