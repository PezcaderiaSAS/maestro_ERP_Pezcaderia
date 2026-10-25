import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EnterpriseSidebar } from '../components/layout/EnterpriseSidebar';

describe('EnterpriseSidebar Saneamiento Visual & Regla del Niño de 12 Años (DTV-UIUX)', () => {
  it('debe presentar un único acceso directo y limpio al Punto de Venta (POS) sin duplicidad de rutas', () => {
    render(
      <EnterpriseSidebar
        currentView="pos"
        onSelectView={() => {}}
        isOpen={true}
        onToggleOpen={() => {}}
        userRole="admin"
        onChangeRole={() => {}}
      />
    );

    // Debe existir el acceso canónico al POS
    expect(screen.getByTestId('nav-pos')).toBeInTheDocument();
    expect(screen.getByText('Punto de Venta (POS)')).toBeInTheDocument();

    // No debe existir una ruta duplicada confusa como "POS Offline V2"
    expect(screen.queryByTestId('nav-pos-offline')).toBeNull();
    expect(screen.queryByText('POS Offline V2')).toBeNull();
  });

  it('no debe mostrar badges estáticos ruidosos (FEFO, Yield KPI, Caja, Nuevo, B2B, HORECA)', () => {
    render(
      <EnterpriseSidebar
        currentView="inventario"
        onSelectView={() => {}}
        isOpen={true}
        onToggleOpen={() => {}}
        userRole="admin"
        onChangeRole={() => {}}
      />
    );

    // Badges estáticos decorativos deben estar ausentes
    expect(screen.queryByText('FEFO')).toBeNull();
    expect(screen.queryByText('Yield KPI')).toBeNull();
    expect(screen.queryByText('Caja')).toBeNull();
    expect(screen.queryByText('Nuevo')).toBeNull();
    expect(screen.queryByText('B2B')).toBeNull();
    expect(screen.queryByText('HORECA')).toBeNull();
  });

  it('debe mantener badges dinámicos cuando existan contadores operacionales reales', () => {
    render(
      <EnterpriseSidebar
        currentView="inventario"
        onSelectView={() => {}}
        isOpen={true}
        onToggleOpen={() => {}}
        userRole="admin"
        onChangeRole={() => {}}
        pendingPrepCount={4}
        activeRoutesCount={2}
      />
    );

    // Contadores dinámicos legítimos dentro de sus respectivos módulos
    const navAlistamiento = screen.getByTestId('nav-alistamiento');
    expect(within(navAlistamiento).getByText('4')).toBeInTheDocument();

    const navDespachos = screen.getByTestId('nav-despachos');
    expect(within(navDespachos).getByText('2')).toBeInTheDocument();
  });

  it('debe proveer title y aria-label accesible en todos los botones para eliminar la navegación a ciegas', () => {
    render(
      <EnterpriseSidebar
        currentView="inventario"
        onSelectView={() => {}}
        isOpen={false} // Estado colapsado
        onToggleOpen={() => {}}
        userRole="admin"
        onChangeRole={() => {}}
      />
    );

    // En estado colapsado, cada botón debe tener su title descriptivo para el operador
    const btnPos = screen.getByTestId('nav-pos');
    expect(btnPos).toHaveAttribute('title', 'Punto de Venta (POS)');
    expect(btnPos).toHaveAttribute('aria-label', 'Punto de Venta (POS)');

    const btnInventario = screen.getByTestId('nav-inventario');
    expect(btnInventario).toHaveAttribute('title', 'Bodegas & WMS');
    expect(btnInventario).toHaveAttribute('aria-label', 'Bodegas & WMS');
  });

  it('debe invocar onSelectView al hacer clic en los módulos de navegación', () => {
    const onSelectView = vi.fn();

    render(
      <EnterpriseSidebar
        currentView="inventario"
        onSelectView={onSelectView}
        isOpen={true}
        onToggleOpen={() => {}}
        userRole="admin"
        onChangeRole={() => {}}
      />
    );

    fireEvent.click(screen.getByTestId('nav-pos'));
    expect(onSelectView).toHaveBeenCalledWith('pos');

    fireEvent.click(screen.getByTestId('nav-compras-muelle'));
    expect(onSelectView).toHaveBeenCalledWith('compras_muelle');
  });
});
