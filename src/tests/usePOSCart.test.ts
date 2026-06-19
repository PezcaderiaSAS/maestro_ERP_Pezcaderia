import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePOSCart } from '../hooks/usePOSCart';
import { crearProducto } from './utils/testFactories';
import type { ClientePOS } from '../hooks/usePOSCart';

describe('usePOSCart Hook', () => {
  const mockProducto = crearProducto({
    id: 'p-1',
    sku: 'SAL-001',
    nombre: 'Salmón',
    precioVentaPOS: 20000,
    precioVentaRestaurante: 18000,
    precioVentaMayorista: 16000,
    unidadMedida: 'KG'
  });

  it('debería inicializar con carrito vacío', () => {
    const { result } = renderHook(() => usePOSCart());
    expect(result.current.lineas).toEqual([]);
    expect(result.current.totales.totalFinal).toBe(0);
  });

  it('debería agregar un producto con precio estándar POS', () => {
    const { result } = renderHook(() => usePOSCart());

    act(() => {
      result.current.agregarProducto(mockProducto, 2);
    });

    expect(result.current.lineas.length).toBe(1);
    expect(result.current.lineas[0].precioLista).toBe(20000);
    expect(result.current.lineas[0].cantidad).toBe(2);
    expect(result.current.lineas[0].totalLinea).toBe(40000);
    expect(result.current.totales.totalFinal).toBe(40000);
  });

  it('debería agregar producto con precio de Restaurante si el cliente está vinculado', () => {
    const clienteRestaurante: ClientePOS = {
      id: 'c-1',
      nombre: 'Pescados Restaurante',
      identificacion: '900111222',
      tipoPrecio: 'RESTAURANTE',
      cupoCredito: 1000000,
      activo: true
    };

    const { result } = renderHook(() => usePOSCart(clienteRestaurante));

    act(() => {
      result.current.agregarProducto(mockProducto, 1.5);
    });

    expect(result.current.lineas[0].precioLista).toBe(18000);
    expect(result.current.lineas[0].totalLinea).toBe(27000); // 18000 * 1.5
  });

  it('debería incrementar cantidad de un producto si ya existe en el carrito', () => {
    const { result } = renderHook(() => usePOSCart());

    act(() => {
      result.current.agregarProducto(mockProducto, 1);
    });
    act(() => {
      result.current.agregarProducto(mockProducto, 2.5);
    });

    expect(result.current.lineas.length).toBe(1);
    expect(result.current.lineas[0].cantidad).toBe(3.5);
    expect(result.current.lineas[0].totalLinea).toBe(70000);
  });

  it('debería actualizar cantidad y aplicar cambios al total', () => {
    const { result } = renderHook(() => usePOSCart());

    act(() => {
      result.current.agregarProducto(mockProducto, 1);
    });
    act(() => {
      result.current.actualizarCantidad('p-1', 5);
    });

    expect(result.current.lineas[0].cantidad).toBe(5);
    expect(result.current.totales.totalFinal).toBe(100000);
  });

  it('debería remover el producto si la cantidad es cero o menor', () => {
    const { result } = renderHook(() => usePOSCart());

    act(() => {
      result.current.agregarProducto(mockProducto, 1);
    });
    act(() => {
      result.current.actualizarCantidad('p-1', 0);
    });

    expect(result.current.lineas.length).toBe(0);
  });

  it('debería aplicar descuento a nivel de línea y recalcular totales', () => {
    const { result } = renderHook(() => usePOSCart());

    act(() => {
      result.current.agregarProducto(mockProducto, 2); // 40000
    });
    act(() => {
      result.current.actualizarDescuentoLinea('p-1', 10); // 10%
    });

    expect(result.current.lineas[0].precioFinal).toBe(18000);
    expect(result.current.lineas[0].totalLinea).toBe(36000);
    expect(result.current.totales.totalFinal).toBe(36000);
  });

  it('debería aplicar descuento global y validar totales', () => {
    const { result } = renderHook(() => usePOSCart());

    act(() => {
      result.current.agregarProducto(mockProducto, 2); // 40000
    });
    act(() => {
      result.current.setDescuentoGlobalValor(5000);
    });

    expect(result.current.totales.subtotal).toBe(40000);
    expect(result.current.totales.descuento).toBe(5000);
    expect(result.current.totales.totalFinal).toBe(35000);
  });

  it('debería capturar el error si el descuento global supera el subtotal', () => {
    const { result } = renderHook(() => usePOSCart());

    act(() => {
      result.current.agregarProducto(mockProducto, 1); // 20000
    });
    act(() => {
      result.current.setDescuentoGlobalValor(25000);
    });

    expect(result.current.totales.error).toBe('El descuento no puede superar el total del pedido');
    expect(result.current.totales.totalFinal).toBe(0);
  });
});
