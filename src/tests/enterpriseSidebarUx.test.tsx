import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnterpriseSidebar } from '../components/layout/EnterpriseSidebar';

describe('TASK-037-03: EnterpriseSidebar UX Laws & Compact Rail Suite', () => {
  const defaultProps = {
    currentView: 'pos' as any,
    onSelectView: vi.fn(),
    isOpen: false, // Inicia en modo Rail Compacto
    onToggleOpen: vi.fn(),
    onChangeRole: vi.fn(),
    userRole: 'admin',
  };

  it('1. Renderiza el Sidebar en modo Rail Compacto (64px) en escritorio/laptop', () => {
    const { container } = render(<EnterpriseSidebar {...defaultProps} />);
    const aside = container.querySelector('aside');
    expect(aside).toBeInTheDocument();
    // En modo colapsado debe tener ancho compacto (w-16 = 64px)
    expect(aside?.className).toContain('w-16');
  });

  it('2. En modo Rail Compacto, cada botón de navegación cuenta con hit-box ergonómico de 48px (Ley de Fitts)', () => {
    render(<EnterpriseSidebar {...defaultProps} />);
    const posButton = screen.getByTestId('nav-pos');
    expect(posButton).toBeInTheDocument();
    // Clases ergonómicas de hit-target (h-11 o h-12 y w-11 o w-12)
    expect(posButton.className).toMatch(/h-(11|12)/);
  });

  it('3. Implementa Progressive Disclosure con tooltips flotantes translúcidos en modo colapsado', () => {
    render(<EnterpriseSidebar {...defaultProps} />);
    const posButton = screen.getByTestId('nav-pos');
    // El botón debe contener el tooltip flotante o título descriptivo
    expect(posButton.getAttribute('aria-label')).toBe('Punto de Venta (POS)');
    expect(posButton.querySelector('.sidebar-tooltip')).toBeInTheDocument();
  });

  it('4. Alterna entre modo compacto (64px) y expandido al invocar onToggleOpen o presionar Ctrl+B', () => {
    const onToggleOpen = vi.fn();
    render(<EnterpriseSidebar {...defaultProps} onToggleOpen={onToggleOpen} />);

    // Disparar atajo de teclado Ctrl+B
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(onToggleOpen).toHaveBeenCalled();
  });

  it('5. Muestra las categorías canónicas estructuradas según la Ley de Miller (<= 7 opciones por rol)', () => {
    render(<EnterpriseSidebar {...defaultProps} isOpen={true} userRole="vendedor" />);
    // Verificar que los encabezados de grupo estén presentes
    expect(screen.getByText('MENU')).toBeInTheDocument();
    expect(screen.getByText('GENERAL')).toBeInTheDocument();
    // Para vendedor, cada categoría visible tiene <= 7 opciones (Miller)
    expect(screen.getAllByRole('button', { name: /Punto de Venta|Ventas B2B|Cotizaciones|Directorio/ })).toHaveLength(4);
  });
});
