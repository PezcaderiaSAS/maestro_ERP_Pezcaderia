import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalOmniboxModal } from '../components/layout/GlobalOmniboxModal';
import { useInventoryStore } from '../store/useInventoryStore';
import { useClientStore } from '../store/useClientStore';
import { useAppStore } from '../store/useAppStore';

describe('GlobalOmniboxModal Enterprise Palette Suite (Paso 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock estado inventario
    useInventoryStore.setState({
      products: [
        {
          id: 'p-1',
          nombre: 'Salmón Premium Fresco Noruego',
          sku: 'SALM-001',
          categoria: 'Pescados',
          precio_venta_pos: 45000,
          stock: 25,
          unidadMedida: 'kg',
        },
        {
          id: 'p-2',
          nombre: 'Camarón Tigre Ecuatoriano 16/20',
          sku: 'CAM-002',
          categoria: 'Mariscos',
          precio_venta_pos: 32000,
          stock: 4,
          unidadMedida: 'kg',
        },
        {
          id: 'p-3',
          nombre: 'Filete de Corvina Blanca',
          sku: 'CORV-003',
          categoria: 'Pescados',
          precio_venta_pos: 28000,
          stock: 0,
          unidadMedida: 'kg',
        },
      ] as any,
    });

    // Mock estado clientes
    useClientStore.setState({
      clientes: [
        {
          id: 'cli-001',
          nombre: 'Restaurante El Faro del Mar',
          identificacion: '901234567-8',
          tipoIdentificacion: 'NIT',
          tipoPersona: 'JURIDICA',
          direccion: 'Calle 100 # 15-20',
          telefono: '3109876543',
          email: 'contacto@elfaro.com',
          ciudad: 'Bogotá',
          tipoPrecio: 'RESTAURANTE',
          cupoCredito: 5000000,
          activo: true,
        },
        {
          id: 'cli-002',
          nombre: 'Carlos Mario Pescadería Gourmet',
          identificacion: '1020304050',
          tipoIdentificacion: 'CC',
          tipoPersona: 'NATURAL',
          direccion: 'Carrera 7 # 45-12',
          telefono: '3201112233',
          email: 'carlos@gourmet.co',
          ciudad: 'Medellín',
          tipoPrecio: 'MAYORISTA',
          cupoCredito: 12000000,
          activo: true,
        },
      ] as any,
    });
  });

  it('debe renderizar los chips de categoría y atajos principales', () => {
    render(<GlobalOmniboxModal isOpen={true} onClose={() => {}} onNavigate={() => {}} />);

    // Verificar presencia de chips de categorías mediante botones de filtrado
    expect(screen.getByRole('button', { name: /todos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /módulos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clientes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /productos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /acciones/i })).toBeInTheDocument();

    // Atajos de pie
    expect(screen.getByText(/Pezcadería Omnibox/i)).toBeInTheDocument();
  });

  it('debe permitir buscar y filtrar clientes mostrando NIT, cupo y tarifa', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();

    render(<GlobalOmniboxModal isOpen={true} onClose={onClose} onNavigate={onNavigate} />);

    const input = screen.getByPlaceholderText(/buscar módulo, producto/i);
    fireEvent.change(input, { target: { value: 'El Faro' } });

    // Debe mostrar al cliente Restaurante El Faro del Mar
    expect(screen.getByText('Restaurante El Faro del Mar')).toBeInTheDocument();
    expect(screen.getByText(/NIT: 901234567-8/i)).toBeInTheDocument();
    expect(screen.getByText(/5\.000\.000/i)).toBeInTheDocument();

    // Al hacer clic, navega a la vista de clientes
    fireEvent.click(screen.getByText('Restaurante El Faro del Mar'));
    expect(onNavigate).toHaveBeenCalledWith('clientes');
    expect(onClose).toHaveBeenCalled();
  });

  it('debe permitir buscar con prefijo @ para filtrar directamente por clientes', () => {
    render(<GlobalOmniboxModal isOpen={true} onClose={() => {}} onNavigate={() => {}} />);

    const input = screen.getByPlaceholderText(/buscar módulo, producto/i);
    fireEvent.change(input, { target: { value: '@Carlos' } });

    expect(screen.getByText('Carlos Mario Pescadería Gourmet')).toBeInTheDocument();
    expect(screen.queryByText('Salmón Premium Fresco Noruego')).not.toBeInTheDocument();
  });

  it('debe permitir buscar y visualizar productos con stock semántico y precio', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();

    render(<GlobalOmniboxModal isOpen={true} onClose={onClose} onNavigate={onNavigate} />);

    const input = screen.getByPlaceholderText(/buscar módulo, producto/i);
    fireEvent.change(input, { target: { value: 'Salmón' } });

    expect(screen.getByText('Salmón Premium Fresco Noruego')).toBeInTheDocument();
    expect(screen.getByText(/SKU: SALM-001/i)).toBeInTheDocument();
    expect(screen.getByText(/45\.000/i)).toBeInTheDocument();
    expect(screen.getByText('DISPONIBLE')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Salmón Premium Fresco Noruego'));
    expect(onNavigate).toHaveBeenCalledWith('pos');
    expect(onClose).toHaveBeenCalled();
  });

  it('debe mostrar badges de stock bajo y agotado según corresponda', () => {
    render(<GlobalOmniboxModal isOpen={true} onClose={() => {}} onNavigate={() => {}} />);

    const input = screen.getByPlaceholderText(/buscar módulo, producto/i);

    // Buscar camarón con stock 4
    fireEvent.change(input, { target: { value: 'Camarón' } });
    expect(screen.getByText('Camarón Tigre Ecuatoriano 16/20')).toBeInTheDocument();
    expect(screen.getByText('STOCK BAJO')).toBeInTheDocument();

    // Buscar corvina con stock 0
    fireEvent.change(input, { target: { value: 'Corvina' } });
    expect(screen.getByText('Filete de Corvina Blanca')).toBeInTheDocument();
    expect(screen.getByText('AGOTADO')).toBeInTheDocument();
  });

  it('debe ejecutar comandos rápidos de acciones operativas como alternar tema', () => {
    const toggleThemeMock = vi.fn();
    useAppStore.setState({ toggleTheme: toggleThemeMock, theme: 'legacy' });

    render(<GlobalOmniboxModal isOpen={true} onClose={() => {}} onNavigate={() => {}} />);

    const input = screen.getByPlaceholderText(/buscar módulo, producto/i);
    fireEvent.change(input, { target: { value: 'Tema' } });

    const themeAction = screen.getByText(/Alternar Tema/i);
    expect(themeAction).toBeInTheDocument();

    fireEvent.click(themeAction);
    expect(toggleThemeMock).toHaveBeenCalled();
  });

  it('debe soportar navegación por teclado con flechas y selección con Enter', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();

    render(<GlobalOmniboxModal isOpen={true} onClose={onClose} onNavigate={onNavigate} />);

    // Presionar flecha abajo para seleccionar la segunda opción
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'Enter' });

    // La segunda opción por defecto es Bodegas & WMS
    expect(onNavigate).toHaveBeenCalledWith('inventario');
    expect(onClose).toHaveBeenCalled();
  });

  it('debe permitir seleccionar mediante atajos numéricos Alt + 1', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();

    render(<GlobalOmniboxModal isOpen={true} onClose={onClose} onNavigate={onNavigate} />);

    // Presionar Alt + 1 para seleccionar el primer item (POS)
    fireEvent.keyDown(window, { key: '1', altKey: true });

    expect(onNavigate).toHaveBeenCalledWith('pos');
    expect(onClose).toHaveBeenCalled();
  });

  it('debe cerrar el modal al presionar Escape o tecla Esc', () => {
    const onClose = vi.fn();
    render(<GlobalOmniboxModal isOpen={true} onClose={onClose} onNavigate={() => {}} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
