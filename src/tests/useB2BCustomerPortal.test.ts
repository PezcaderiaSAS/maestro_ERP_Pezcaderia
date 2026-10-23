import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useB2BCart } from '../hooks/useB2BCart';
import { useB2BCustomerPortal } from '../hooks/useB2BCustomerPortal';
import type { B2BCatalogProductItem } from '../types/b2bCustomerPortal.types';

describe('Hooks Reactivos — Portal B2B HORECA (TASK-027-03)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

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

  describe('useB2BCart', () => {
    it('debe iniciar con carrito vacío y totales en cero', () => {
      const { result } = renderHook(() => useB2BCart());
      expect(result.current.items.length).toBe(0);
      expect(result.current.itemCount).toBe(0);
      expect(result.current.totalEstimadoCop).toBe(0);
      expect(result.current.pesoTotalEstimadoKg).toBe(0);
    });

    it('debe agregar un producto con corte y empaque calculando subtotales y peso estimado', () => {
      const { result } = renderHook(() => useB2BCart());

      act(() => {
        result.current.agregarItem(mockProduct, {
          corte: 'FILETE_CON_PIEL',
          empaque: 'CAJA_TERMICA_HIELO',
          modalidadVenta: 'KILOGRAMOS_ESTIMADOS',
          cantidad: 10,
          piezas: 4,
          observaciones: 'Porciones de 200g aproximadamente',
        });
      });

      expect(result.current.itemCount).toBe(1);
      expect(result.current.items[0].sku).toBe('SALM-NOR-01');
      expect(result.current.items[0].corte).toBe('FILETE_CON_PIEL');
      expect(result.current.items[0].subtotalCop).toBe(690000);
      expect(result.current.items[0].pesoEstimadoTotalKg).toBe(10);
      expect(result.current.totalEstimadoCop).toBe(690000);
      expect(result.current.piezasTotalesEstimadas).toBe(4);
    });

    it('debe acumular la cantidad si se agrega la misma línea con idéntica configuración', () => {
      const { result } = renderHook(() => useB2BCart());

      act(() => {
        result.current.agregarItem(mockProduct, {
          corte: 'FILETE_CON_PIEL',
          empaque: 'CAJA_TERMICA_HIELO',
          modalidadVenta: 'KILOGRAMOS_ESTIMADOS',
          cantidad: 5,
        });
      });

      act(() => {
        result.current.agregarItem(mockProduct, {
          corte: 'FILETE_CON_PIEL',
          empaque: 'CAJA_TERMICA_HIELO',
          modalidadVenta: 'KILOGRAMOS_ESTIMADOS',
          cantidad: 3,
        });
      });

      expect(result.current.itemCount).toBe(1);
      expect(result.current.items[0].cantidadSolicitada).toBe(8);
      expect(result.current.items[0].subtotalCop).toBe(8 * 69000);
    });

    it('debe permitir actualizar cantidad y eliminar línea si la cantidad es 0', () => {
      const { result } = renderHook(() => useB2BCart());

      act(() => {
        result.current.agregarItem(mockProduct, {
          corte: 'FILETE_CON_PIEL',
          empaque: 'CAJA_TERMICA_HIELO',
          modalidadVenta: 'KILOGRAMOS_ESTIMADOS',
          cantidad: 4,
        });
      });

      act(() => {
        result.current.actualizarCantidad(0, 7);
      });
      expect(result.current.items[0].cantidadSolicitada).toBe(7);
      expect(result.current.items[0].subtotalCop).toBe(7 * 69000);

      act(() => {
        result.current.actualizarCantidad(0, 0);
      });
      expect(result.current.itemCount).toBe(0);
    });

    it('debe cargar líneas completas desde una plantilla recurrente y vaciar carrito', () => {
      const { result } = renderHook(() => useB2BCart());

      act(() => {
        result.current.cargarDesdePlantilla([
          {
            productoId: 'prod-salmon-noruego',
            sku: 'SALM-NOR-01',
            nombre: 'Salmón Noruego Premium',
            corte: 'FILETE_CON_PIEL',
            empaque: 'CAJA_TERMICA_HIELO',
            modalidadVenta: 'KILOGRAMOS_ESTIMADOS',
            cantidadSolicitada: 6,
            precioPactadoCop: 69000,
          },
        ]);
      });

      expect(result.current.itemCount).toBe(1);
      expect(result.current.totalEstimadoCop).toBe(6 * 69000);

      act(() => {
        result.current.vaciarCarrito();
      });
      expect(result.current.itemCount).toBe(0);
    });
  });

  describe('useB2BCustomerPortal', () => {
    it('debe cargar clientes HORECA, cliente activo inicial y su catálogo preferencial', () => {
      const { result } = renderHook(() => useB2BCustomerPortal());

      expect(result.current.clientes.length).toBeGreaterThanOrEqual(2);
      expect(result.current.clienteActivo).not.toBeNull();
      expect(result.current.clienteActivo?.id).toBe('cli-restaurante-mar');
      expect(result.current.catalogo.length).toBeGreaterThan(0);
      expect(result.current.cartera.cupoTotalCop).toBe(5000000);
      expect(result.current.cartera.estadoSemaforo).toBe('AL_DIA');
    });

    it('debe permitir cambiar de cliente HORECA y actualizar catálogo y cartera', () => {
      const { result } = renderHook(() => useB2BCustomerPortal());

      act(() => {
        result.current.seleccionarCliente('cli-cevicheria-muelle');
      });

      expect(result.current.clienteActivo?.id).toBe('cli-cevicheria-muelle');
      expect(result.current.cartera.cupoDisponibleCop).toBe(50000);
      expect(result.current.cartera.estadoSemaforo).toBe('EN_ALERTA');
    });

    it('debe filtrar el catálogo por término de búsqueda y categoría', () => {
      const { result } = renderHook(() => useB2BCustomerPortal());

      act(() => {
        result.current.setBusqueda('Atún');
      });
      expect(result.current.catalogo.every((p) => p.nombre.includes('Atún'))).toBe(true);

      act(() => {
        result.current.setBusqueda('');
        result.current.setCategoriaSeleccionada('Pescados Importados');
      });
      expect(result.current.catalogo.every((p) => p.categoria === 'Pescados Importados')).toBe(true);
    });

    it('debe permitir enviar un pedido desde el carrito exitosamente', () => {
      const { result: cartResult } = renderHook(() => useB2BCart());
      const { result: portalResult } = renderHook(() => useB2BCustomerPortal());

      act(() => {
        cartResult.current.agregarItem(mockProduct, {
          corte: 'FILETE_CON_PIEL',
          empaque: 'CAJA_TERMICA_HIELO',
          modalidadVenta: 'KILOGRAMOS_ESTIMADOS',
          cantidad: 5,
        });
      });

      expect(cartResult.current.itemCount).toBe(1);

      let resultadoEnvio: any;
      act(() => {
        resultadoEnvio = portalResult.current.enviarPedidoDesdeCarrito(cartResult.current, {
          fechaRequeridaEntrega: '2026-10-24',
          jornadaRequerida: 'MANANA',
          formaPago: 'CREDITO_B2B',
          instruccionesCocina: 'Entregar por muelle de proveedores antes de las 9:00 AM',
        });
      });

      expect(resultadoEnvio.success).toBe(true);
      expect(resultadoEnvio.data?.estado).toBe('CREADO');
      expect(cartResult.current.itemCount).toBe(0);
      expect(portalResult.current.historialPedidos.length).toBeGreaterThan(0);
    });

    it('debe permitir re-ordenar con 1 clic desde una plantilla guardada', () => {
      const { result } = renderHook(() => useB2BCustomerPortal());

      expect(result.current.plantillas.length).toBeGreaterThan(0);
      const plantillaId = result.current.plantillas[0].id!;

      let resultadoReorden: any;
      act(() => {
        resultadoReorden = result.current.reordenarDesdePlantilla(plantillaId);
      });

      expect(resultadoReorden.success).toBe(true);
      expect(resultadoReorden.data?.lineas.length).toBe(2);
      expect(result.current.pedidoDetalleId).toBe(resultadoReorden.data?.id);
    });
  });
});
