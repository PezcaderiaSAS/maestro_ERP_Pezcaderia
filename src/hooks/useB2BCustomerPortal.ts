/**
 * ============================================================================
 * LA PEZCADERIA ERP — HOOK REACTIVO: useB2BCustomerPortal
 * ============================================================================
 * Orquestador central del Portal B2B HORECA.
 * Sincroniza cliente activo bimodal, catálogo con tarifas preferenciales,
 * semáforo de cupo de crédito, historial de pedidos y plantillas recurrentes.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { b2bCustomerPortalService } from '../services/b2bCustomerPortalService';
import type {
  B2BCustomerProfile,
  B2BCatalogProductItem,
  B2BOrderRecord,
  B2BCreditStatus,
  B2BRecurringTemplate,
  B2BDeliverySchedule,
  B2BPaymentMethod,
  CreateB2BOrderInput,
} from '../types/b2bCustomerPortal.types';
import type { UseB2BCartReturn } from './useB2BCart';

export interface UseB2BCustomerPortalOptions {
  initialClienteId?: string;
  initialModoAcceso?: 'ERP_COMERCIAL' | 'PORTAL_CLIENTE';
}

export function useB2BCustomerPortal(options: UseB2BCustomerPortalOptions = {}) {
  const [modoAcceso, setModoAcceso] = useState<'ERP_COMERCIAL' | 'PORTAL_CLIENTE'>(
    options.initialModoAcceso || 'ERP_COMERCIAL'
  );

  // Lista de clientes HORECA disponibles
  const [clientes, setClientes] = useState<B2BCustomerProfile[]>(() =>
    b2bCustomerPortalService.obtenerClientesHoreca()
  );

  // Cliente activo
  const [clienteActivoId, setClienteActivoId] = useState<string>(() => {
    if (options.initialClienteId) return options.initialClienteId;
    const inicial = b2bCustomerPortalService.obtenerClientesHoreca();
    return inicial[0]?.id || '';
  });

  const clienteActivo = useMemo<B2BCustomerProfile | null>(() => {
    return clientes.find((c) => c.id === clienteActivoId) || null;
  }, [clientes, clienteActivoId]);

  // Sucursal de entrega seleccionada
  const [sucursalSeleccionadaId, setSucursalSeleccionadaId] = useState<string>('');

  useEffect(() => {
    if (clienteActivo && clienteActivo.sucursales.length > 0) {
      setSucursalSeleccionadaId(clienteActivo.sucursales[0].id);
    }
  }, [clienteActivo]);

  const sucursalSeleccionada = useMemo(() => {
    if (!clienteActivo) return null;
    return (
      clienteActivo.sucursales.find((s) => s.id === sucursalSeleccionadaId) ||
      clienteActivo.sucursales[0] ||
      null
    );
  }, [clienteActivo, sucursalSeleccionadaId]);

  // Catálogo preferencial del cliente activo
  const catalogo = useMemo<B2BCatalogProductItem[]>(() => {
    if (!clienteActivoId) return [];
    return b2bCustomerPortalService.obtenerCatalogoCliente(clienteActivoId);
  }, [clienteActivoId]);

  // Filtros de catálogo
  const [busqueda, setBusqueda] = useState<string>('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('TODAS');

  const categorias = useMemo<string[]>(() => {
    const set = new Set(catalogo.map((p) => p.categoria));
    return ['TODAS', ...Array.from(set)];
  }, [catalogo]);

  const catalogoFiltrado = useMemo<B2BCatalogProductItem[]>(() => {
    return catalogo.filter((producto) => {
      const coincideBusqueda =
        busqueda.trim() === '' ||
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.especie.toLowerCase().includes(busqueda.toLowerCase());

      const coincideCategoria =
        categoriaSeleccionada === 'TODAS' ||
        producto.categoria === categoriaSeleccionada;

      return coincideBusqueda && coincideCategoria;
    });
  }, [catalogo, busqueda, categoriaSeleccionada]);

  // Estado de cartera y cupo de crédito
  const [cartera, setCartera] = useState<B2BCreditStatus>(() => {
    if (!clienteActivoId) {
      return {
        cupoTotalCop: 0,
        saldoPendienteCop: 0,
        cupoDisponibleCop: 0,
        estadoSemaforo: 'AL_DIA',
        facturasPendientesCount: 0,
        diasPromedioPago: 15,
      };
    }
    return b2bCustomerPortalService.obtenerEstadoCartera(clienteActivoId);
  });

  // Historial de pedidos
  const [historialPedidos, setHistorialPedidos] = useState<B2BOrderRecord[]>([]);

  // Plantillas recurrentes
  const [plantillas, setPlantillas] = useState<B2BRecurringTemplate[]>([]);

  // Pedido seleccionado para ver timeline de trazabilidad
  const [pedidoDetalleId, setPedidoDetalleId] = useState<string | null>(null);

  const pedidoDetalle = useMemo<B2BOrderRecord | null>(() => {
    if (!pedidoDetalleId) return null;
    return historialPedidos.find((p) => p.id === pedidoDetalleId) || null;
  }, [historialPedidos, pedidoDetalleId]);

  // Recarga de datos al cambiar de cliente
  const recargarDatosCliente = useCallback(() => {
    if (!clienteActivoId) return;
    setCartera(b2bCustomerPortalService.obtenerEstadoCartera(clienteActivoId));
    setHistorialPedidos(b2bCustomerPortalService.obtenerHistorialPedidos(clienteActivoId));
    setPlantillas(b2bCustomerPortalService.obtenerPlantillasRecurrentes(clienteActivoId));
  }, [clienteActivoId]);

  useEffect(() => {
    recargarDatosCliente();
  }, [recargarDatosCliente]);

  // Selector de cliente
  const seleccionarCliente = useCallback((clienteId: string) => {
    setClienteActivoId(clienteId);
    setPedidoDetalleId(null);
  }, []);

  // Enviar pedido desde el carrito
  const enviarPedidoDesdeCarrito = useCallback(
    (
      cart: UseB2BCartReturn,
      config: {
        fechaRequeridaEntrega: string;
        jornadaRequerida: B2BDeliverySchedule;
        formaPago: B2BPaymentMethod;
        instruccionesCocina?: string;
      }
    ): { success: boolean; data?: B2BOrderRecord; error?: string } => {
      if (!clienteActivo) {
        return { success: false, error: 'No hay un cliente HORECA seleccionado' };
      }
      if (cart.items.length === 0) {
        return { success: false, error: 'El carrito no contiene productos' };
      }

      const input: CreateB2BOrderInput = {
        clienteId: clienteActivo.id,
        clienteNombre: clienteActivo.razonSocial,
        nit: clienteActivo.nit,
        sucursalEntrega: sucursalSeleccionada?.nombre || 'Sede Principal',
        direccionEntrega: sucursalSeleccionada?.direccion || clienteActivo.direccionPrincipal,
        telefonoContacto: sucursalSeleccionada?.telefono,
        fechaRequeridaEntrega: config.fechaRequeridaEntrega,
        jornadaRequerida: config.jornadaRequerida,
        formaPago: config.formaPago,
        lineas: cart.items.map((i) => ({
          productoId: i.productoId,
          sku: i.sku,
          nombre: i.nombre,
          corte: i.corte,
          empaque: i.empaque,
          modalidadVenta: i.modalidadVenta,
          cantidadSolicitada: i.cantidadSolicitada,
          piezasEstimadas: i.piezasEstimadas,
          precioPactadoCop: i.precioPactadoCop,
          observacionesCorte: i.observacionesCorte,
        })),
        instruccionesCocina: config.instruccionesCocina || cart.instruccionesCocina,
      };

      const resultado = b2bCustomerPortalService.crearPedidoB2B(input);
      if (resultado.success && resultado.data) {
        cart.vaciarCarrito();
        recargarDatosCliente();
        setPedidoDetalleId(resultado.data.id);
      }
      return resultado;
    },
    [clienteActivo, sucursalSeleccionada, recargarDatosCliente]
  );

  // Re-ordenar instantáneo desde plantilla
  const reordenarDesdePlantilla = useCallback(
    (
      plantillaId: string,
      fechaEntrega?: string,
      jornada?: B2BDeliverySchedule
    ): { success: boolean; data?: B2BOrderRecord; error?: string } => {
      const resultado = b2bCustomerPortalService.reordenarDesdePlantilla(
        plantillaId,
        fechaEntrega,
        jornada
      );
      if (resultado.success && resultado.data) {
        recargarDatosCliente();
        setPedidoDetalleId(resultado.data.id);
      }
      return resultado;
    },
    [recargarDatosCliente]
  );

  // Guardar nueva plantilla o actualizar
  const guardarPlantilla = useCallback(
    (plantilla: B2BRecurringTemplate) => {
      const resultado = b2bCustomerPortalService.guardarPlantillaRecurrente(plantilla);
      if (resultado.success) {
        recargarDatosCliente();
      }
      return resultado;
    },
    [recargarDatosCliente]
  );

  return {
    modoAcceso,
    setModoAcceso,
    clientes,
    clienteActivo,
    clienteActivoId,
    seleccionarCliente,
    sucursalSeleccionada,
    sucursalSeleccionadaId,
    setSucursalSeleccionadaId,
    catalogo: catalogoFiltrado,
    catalogoCompleto: catalogo,
    categorias,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    busqueda,
    setBusqueda,
    cartera,
    historialPedidos,
    plantillas,
    pedidoDetalle,
    pedidoDetalleId,
    setPedidoDetalleId,
    recargarDatosCliente,
    enviarPedidoDesdeCarrito,
    reordenarDesdePlantilla,
    guardarPlantilla,
  };
}
