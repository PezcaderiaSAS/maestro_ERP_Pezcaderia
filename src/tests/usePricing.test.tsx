import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePricing } from '../hooks/usePricing';
import { useInventoryStore } from '../store/useInventoryStore.ts';
import { useOrderStore } from '../store/useOrderStore.ts';
import { useClientStore } from '../store/useClientStore.ts';
import { useDriverStore } from '../store/useDriverStore.ts';
import { useReturnStore } from '../store/useReturnStore.ts';

describe('Hook: usePricing - Lógica de Negocio de Cotizaciones', () => {
  beforeEach(() => {
    localStorage.clear();

    // Resetear y poblar datos iniciales de control en los stores de Zustand
    useInventoryStore.setState({
      products: [
        {
          id: 'p-1',
          sku: 'FIL-ROB-001',
          nombre: 'FILETE DE ROBALO',
          categoria: 'PESCADOS',
          unidadMedida: 'kg',
          precio_compra: 10000,
          buffer_seguridad: 10,
          precio_venta_pos: 15000,
          precio_venta_restaurante: 14000,
          precio_venta_mayorista: 12500,
          activo: true,
        },
      ],
      productPricings: [],
      stock: {
        'Bodega Principal': {
          'FIL-ROB-001': 50,
        },
      },
    });

    useOrderStore.setState({ quotations: [] });
    useReturnStore.setState({ devoluciones: [] });

    useClientStore.setState({
      clientes: [
        {
          id: 'c-1',
          nombre: 'Restaurante Central',
          identificacion: 'NIT-12345',
          tipoIdentificacion: 'NIT',
          tipoPersona: 'JURIDICA',
          direccion: 'Calle 45 # 12-30',
          telefono: '3001234567',
          email: 'contacto@central.com',
          ciudad: 'Bogotá',
          tipoPrecio: 'RESTAURANTE',
          cupoCredito: 5000000,
          activo: true,
        },
      ],
      lastClientPrices: {},
    });

    useDriverStore.setState({
      conductores: [
        {
          id: 'd-1',
          nombre: 'Juan Perez',
          identificacion: 'CC-98765',
          licencia: 'C2',
          celular: '3159876543',
          activo: true,
        },
      ],
    });
  });

  it('debería inicializar con estados de cotización por defecto', () => {
    const { result } = renderHook(() => usePricing());

    expect(result.current.activeTab).toBe('quotes');
    expect(result.current.quoteSubTab).toBe('create');
    expect(result.current.wizardStep).toBe(1);
    expect(result.current.clientName).toBe('');
    expect(result.current.quoteItems).toEqual([]);
    expect(result.current.quoteTotalFinal).toBe(0);
  });

  it('debería actualizar datos del cliente al buscar/seleccionar cliente registrado', () => {
    const { result } = renderHook(() => usePricing());

    // Simular el cambio de cliente
    const cliente = result.current.clientes[0];
    act(() => {
      result.current.setClientName(cliente.nombre);
      result.current.setClientIdent(cliente.identificacion);
      result.current.setClientType(cliente.tipoPrecio as any);
      result.current.setLogisticaDireccion(cliente.direccion || '');
    });

    expect(result.current.clientName).toBe('Restaurante Central');
    expect(result.current.clientIdent).toBe('NIT-12345');
    expect(result.current.clientType).toBe('RESTAURANTE');
    expect(result.current.logisticaDireccion).toBe('Calle 45 # 12-30');
  });

  it('debería agregar un producto a la cotización y calcular el subtotal según el tipo de cliente', () => {
    const { result } = renderHook(() => usePricing());

    // Configurar cliente de tipo RESTAURANTE
    act(() => {
      result.current.setClientType('RESTAURANTE');
    });

    // Agregar producto
    const prod = result.current.products[0];
    act(() => {
      result.current.openAddItemModal(prod);
    });

    act(() => {
      result.current.setCurrentProductLine({
        product: prod,
        cantidad: 10, // 10 kg
        descuento: 0,
        precioOverride: 0,
        detalle: '',
        listo: true,
        esDevolucion: false,
        devolucionId: '',
      });
    });

    act(() => {
      result.current.saveProductLine();
    });

    expect(result.current.quoteItems.length).toBe(1);
    // Para RESTAURANTE, el precio unitario del producto es 14,000 COP
    expect(result.current.quoteSubtotal).toBe(140000);
    expect(result.current.quoteTotalFinal).toBe(140000);
  });

  it('debería disparar el callback de éxito al guardar cotización válida', () => {
    const { result } = renderHook(() => usePricing());

    act(() => {
      result.current.setClientName('RESTAURANTE CENTRAL');
      result.current.setClientIdent('NIT-12345');
      result.current.setClientType('RESTAURANTE');
    });

    const prod = result.current.products[0];
    act(() => {
      result.current.openAddItemModal(prod);
    });
    act(() => {
      result.current.setCurrentProductLine({
        product: prod,
        cantidad: 5,
        descuento: 0,
        precioOverride: 0,
        detalle: 'Nota de test',
        listo: true,
        esDevolucion: false,
        devolucionId: '',
      });
    });
    act(() => {
      result.current.saveProductLine();
    });

    const onSuccessMock = vi.fn();
    const onWarnMock = vi.fn();

    act(() => {
      result.current.handleSaveQuotation({
        onSuccess: onSuccessMock,
        onWarn: onWarnMock,
      });
    });

    expect(onWarnMock).not.toHaveBeenCalled();
    expect(onSuccessMock).toHaveBeenCalled();
  });
});
