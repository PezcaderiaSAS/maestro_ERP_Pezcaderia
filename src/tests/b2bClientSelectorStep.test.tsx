import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { B2BClientSelectorStep } from '../views/b2b/components/B2BClientSelectorStep';
import { Cliente } from '../types/erp.types';

describe('TASK-016-02: B2BClientSelectorStep (Regla del Niño de 12 Años & Semáforo de Crédito)', () => {
  const mockClienteVerde: Cliente = {
    id: 'cli-01',
    nombre: 'Restaurante El Faro del Mar',
    identificacion: '900123456-7',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    direccion: 'Carrera 7 # 45-20',
    ciudad: 'Bogotá',
    telefono: '3101234567',
    email: 'contacto@elfaro.com',
    tipoPrecio: 'RESTAURANTE',
    cupoCredito: 10000000,
    cupoCreditoUsado: 2000000, // 20% usado -> VERDE
    isGranContribuyente: false,
    isAutoretenedor: false,
    activo: true,
  };

  const mockClienteAmarillo: Cliente = {
    id: 'cli-02',
    nombre: 'Cevichería La Ola Marina',
    identificacion: '900987654-3',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    direccion: 'Calle 85 # 15-30',
    ciudad: 'Bogotá',
    telefono: '3159876543',
    email: 'compras@laolamarina.com',
    tipoPrecio: 'RESTAURANTE',
    cupoCredito: 10000000,
    cupoCreditoUsado: 8500000, // 85% usado -> AMARILLO
    isGranContribuyente: false,
    isAutoretenedor: false,
    activo: true,
  };

  const mockClienteRojo: Cliente = {
    id: 'cli-03',
    nombre: 'Pescadería del Puerto S.A.S.',
    identificacion: '800555444-1',
    tipoIdentificacion: 'NIT',
    tipoPersona: 'JURIDICA',
    direccion: 'Avenida Chile # 12-40',
    ciudad: 'Bogotá',
    telefono: '3205554441',
    email: 'gerencia@delpuerto.com',
    tipoPrecio: 'MAYORISTA',
    cupoCredito: 5000000,
    cupoCreditoUsado: 5000000, // 100% usado -> ROJO
    isGranContribuyente: true,
    isAutoretenedor: false,
    activo: true,
  };

  const mockClientes = [mockClienteVerde, mockClienteAmarillo, mockClienteRojo];

  const defaultProps = {
    selectedCliente: null,
    onSelectCliente: vi.fn(),
    formaPago: 'CREDITO' as const,
    onChangeFormaPago: vi.fn(),
    onNext: vi.fn(),
    clientesList: mockClientes,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. El buscador de clientes debe tener touch target >= 48px y permitir búsqueda predictiva en tiempo real', () => {
    render(<B2BClientSelectorStep {...defaultProps} />);

    const searchInput = screen.getByTestId('b2b-client-search-input') as HTMLInputElement;
    expect(searchInput).toBeInTheDocument();
    
    // Altura táctil mínima de 48px (h-12 o h-14)
    expect(searchInput.className).toMatch(/h-14|h-12|min-h-\[48px\]/);

    // Escribir en el buscador filtra clientes
    fireEvent.change(searchInput, { target: { value: 'Faro' } });
    expect(screen.getByText('Restaurante El Faro del Mar')).toBeInTheDocument();
    expect(screen.queryByText('Cevichería La Ola Marina')).not.toBeInTheDocument();
  });

  it('2. Las tarjetas de selección de cliente deben tener target size >= 48px y disparar onSelectCliente al toque', () => {
    render(<B2BClientSelectorStep {...defaultProps} />);

    const clientCard = screen.getByTestId('b2b-client-card-cli-01');
    expect(clientCard).toBeInTheDocument();
    expect(clientCard.className).toMatch(/min-h-\[48px\]|min-h-\[56px\]|p-4/);

    fireEvent.click(clientCard);
    expect(defaultProps.onSelectCliente).toHaveBeenCalledWith(mockClienteVerde);
  });

  it('3. El semáforo de crédito muestra estado VERDE y cupo disponible para cliente con uso <= 75%', () => {
    render(
      <B2BClientSelectorStep
        {...defaultProps}
        selectedCliente={mockClienteVerde}
      />
    );

    const semaforo = screen.getByTestId('b2b-credit-semaphore');
    expect(semaforo).toBeInTheDocument();
    expect(semaforo.textContent).toMatch(/Saludable|Verde|Óptimo|8\.000\.000/i);
    expect(screen.getByText(/8\.000\.000/)).toBeInTheDocument();
  });

  it('4. El semáforo de crédito muestra estado AMARILLO/ALERTA para cliente con uso entre 76% y 99%', () => {
    render(
      <B2BClientSelectorStep
        {...defaultProps}
        selectedCliente={mockClienteAmarillo}
      />
    );

    const semaforo = screen.getByTestId('b2b-credit-semaphore');
    expect(semaforo).toBeInTheDocument();
    expect(semaforo.textContent).toMatch(/Atención|Alerta|Amarillo|85%|1\.500\.000/i);
  });

  it('5. El semáforo de crédito muestra estado ROJO/AGOTADO para cliente con 100% de uso', () => {
    render(
      <B2BClientSelectorStep
        {...defaultProps}
        selectedCliente={mockClienteRojo}
      />
    );

    const semaforo = screen.getByTestId('b2b-credit-semaphore');
    expect(semaforo).toBeInTheDocument();
    expect(semaforo.textContent).toMatch(/Agotado|Bloqueado|Rojo|100%/i);
  });

  it('6. El selector táctil de forma de pago permite alternar entre CRÉDITO y CONTADO con targets >= 48px', () => {
    render(
      <B2BClientSelectorStep
        {...defaultProps}
        selectedCliente={mockClienteVerde}
        formaPago="CREDITO"
      />
    );

    const btnContado = screen.getByTestId('b2b-payment-toggle-contado');
    const btnCredito = screen.getByTestId('b2b-payment-toggle-credito');

    expect(btnContado.className).toMatch(/min-h-\[48px\]|min-h-\[52px\]|h-12|h-14/);
    expect(btnCredito.className).toMatch(/min-h-\[48px\]|min-h-\[52px\]|h-12|h-14/);

    fireEvent.click(btnContado);
    expect(defaultProps.onChangeFormaPago).toHaveBeenCalledWith('CONTADO');
  });

  it('7. El botón CONTINUAR A PRODUCTOS debe tener altura >= 56px, estar deshabilitado sin cliente y ejecutar onNext al seleccionarlo', () => {
    const { rerender } = render(<B2BClientSelectorStep {...defaultProps} selectedCliente={null} />);

    const btnContinuar = screen.getByTestId('b2b-btn-continue-step1');
    expect(btnContinuar).toBeDisabled();
    expect(btnContinuar.className).toMatch(/h-14|min-h-\[56px\]/);

    // Al seleccionar cliente se habilita
    rerender(
      <B2BClientSelectorStep
        {...defaultProps}
        selectedCliente={mockClienteVerde}
      />
    );

    expect(btnContinuar).not.toBeDisabled();
    fireEvent.click(btnContinuar);
    expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
  });
});
