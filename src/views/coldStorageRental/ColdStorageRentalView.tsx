import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Snowflake,
  FileText,
  Scale,
  Users,
  Box,
  DollarSign,
  Plus,
  Download,
  AlertTriangle,
  CheckCircle,
  Truck,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  Search,
  RefreshCw,
  Send,
} from 'lucide-react';

import {
  coldStorageRentalService,
  DEFAULT_EMPRESA_ID,
  type InventarioCustodiaItem,
  type MovimientoCustodiaItem,
  type CausacionAlquilerItem,
} from '../../services/coldStorageRentalService';
import { coldStoragePdfService } from '../../services/coldStoragePdfService';
import {
  calcularPosicionesNecesarias,
  calcularSobrecupoKg,
  calcularRecargoSobrecupo,
  calcularMermaSalida,
  liquidarCausacionAlquiler,
  type ContratoAlquilerCf,
  type ClienteCustodia,
  type ProductoCustodia,
  type CuartoFrio,
} from '../../../packages/validation-schemas/src/coldStorageRental.schema';

export const ColdStorageRentalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'contratos' | 'clientes_productos' | 'bascula_movimientos' | 'existencias' | 'contabilidad'
  >('dashboard');

  const [loading, setLoading] = useState(false);
  const [cuartosFrios, setCuartosFrios] = useState<CuartoFrio[]>([]);
  const [clientes, setClientes] = useState<ClienteCustodia[]>([]);
  const [productos, setProductos] = useState<ProductoCustodia[]>([]);
  const [contratos, setContratos] = useState<ContratoAlquilerCf[]>([]);
  const [inventario, setInventario] = useState<InventarioCustodiaItem[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoCustodiaItem[]>([]);
  const [causaciones, setCausaciones] = useState<CausacionAlquilerItem[]>([]);

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClienteFilter, setSelectedClienteFilter] = useState('');

  // Modales
  const [showContratoModal, setShowContratoModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [showRecepcionModal, setShowRecepcionModal] = useState(false);
  const [showDespachoModal, setShowDespachoModal] = useState(false);
  const [showCausacionModal, setShowCausacionModal] = useState(false);
  const [selectedContratoForCausacion, setSelectedContratoForCausacion] = useState<ContratoAlquilerCf | null>(null);
  const [selectedInvForDespacho, setSelectedInvForDespacho] = useState<InventarioCustodiaItem | null>(null);

  // Form states para creación rápida
  const [nuevoContrato, setNuevoContrato] = useState({
    cliente_id: '',
    cuarto_frio_id: '',
    modalidad_tiempo: 'MESES' as 'DIAS' | 'MESES',
    posiciones_contratadas: 1,
    tarifa_unitaria: 650000,
    tarifa_recargo_sobrepeso_kg: 250,
    modalidad_facturacion: 'ANTICIPADA' as 'ANTICIPADA' | 'VENCIDA',
    requiere_cuentas_orden: false,
    fecha_inicio: new Date().toISOString().substring(0, 10),
    fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    observaciones: '',
  });

  const [nuevoCliente, setNuevoCliente] = useState({
    razon_social: '',
    numero_identificacion: '',
    tipo_identificacion: 'NIT',
    responsable_contacto: '',
    telefono: '',
    email: '',
  });

  const [nuevoProducto, setNuevoProducto] = useState({
    cliente_id: '',
    nombre: '',
    codigo_cliente: '',
    tipo_empaque: 'CAJA_CARTON',
    modalidad_medicion: 'SOLO_PESO' as 'SOLO_PESO' | 'PESO_ESTABLE' | 'MIXTO_BULTOS_PESO',
    peso_unitario_nominal: 20,
    temperatura_optima: '-18C a -22C',
  });

  const [nuevaRecepcion, setNuevaRecepcion] = useState({
    contrato_id: '',
    producto_custodia_id: '',
    lote_cliente: '',
    bultos: 1,
    peso_bruto_kg: 820,
    peso_tara_kg: 20,
    temperatura: -18.5,
    transportador_nombre: '',
    transportador_cedula: '',
    placa_vehiculo: '',
    fecha_vencimiento: '',
    observaciones: '',
  });

  const [nuevoDespacho, setNuevoDespacho] = useState({
    inventario_id: '',
    bultos_despacho: 1,
    peso_bruto_salida: 820,
    peso_tara_salida: 20,
    transportador_nombre: '',
    transportador_cedula: '',
    placa_vehiculo: '',
    observaciones: '',
  });

  const [nuevaCausacion, setNuevaCausacion] = useState({
    contrato_id: '',
    periodo_inicio: '',
    periodo_fin: '',
    recargo_sobrecupo: 0,
    porcentaje_retefuente: 4.0,
  });

  // Cargar datos
  const cargarTodo = async () => {
    try {
      setLoading(true);
      const [cfs, cls, prods, ctrs, invs, movs, causs] = await Promise.all([
        coldStorageRentalService.getCuartosFrios().catch(() => []),
        coldStorageRentalService.getClientesCustodia().catch(() => []),
        coldStorageRentalService.getProductosCustodia().catch(() => []),
        coldStorageRentalService.getContratos().catch(() => []),
        coldStorageRentalService.getInventarioCustodia().catch(() => []),
        coldStorageRentalService.getMovimientos().catch(() => []),
        coldStorageRentalService.getCausaciones().catch(() => []),
      ]);

      setCuartosFrios(cfs);
      setClientes(cls);
      setProductos(prods);
      setContratos(ctrs);
      setInventario(invs);
      setMovimientos(movs);
      setCausaciones(causs);
    } catch (err: any) {
      console.error('Error cargando datos de cuarto frío:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error de Conexión',
        text: 'No se pudieron cargar todos los registros del cuarto frío.',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  // Cálculos de métricas del Dashboard
  const totalPosicionesCapacidad = cuartosFrios.reduce((acc, cf) => acc + (cf.capacidad_total_posiciones || 0), 0);
  const totalPosicionesContratadas = contratos
    .filter((c) => c.estado === 'VIGENTE')
    .reduce((acc, c) => acc + (c.posiciones_contratadas || 0), 0);
  const posicionesDisponibles = Math.max(0, totalPosicionesCapacidad - totalPosicionesContratadas);

  const totalKilosEnCustodia = inventario.reduce((acc, inv) => acc + Number(inv.peso_neto_actual_kg || 0), 0);
  const totalBultosEnCustodia = inventario.reduce((acc, inv) => acc + (inv.bultos_actuales || 0), 0);
  const totalIngresosMes = causaciones.reduce((acc, c) => acc + Number(c.total || 0), 0);

  // Manejadores de Formularios
  const handleGuardarContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const consecutivo = `CTR-CF-${new Date().getFullYear()}-${String(contratos.length + 1).padStart(3, '0')}`;
      
      const payload: Partial<ContratoAlquilerCf> = {
        empresa_id: DEFAULT_EMPRESA_ID,
        consecutivo,
        cliente_id: nuevoContrato.cliente_id,
        cuarto_frio_id: nuevoContrato.cuarto_frio_id,
        modalidad_tiempo: nuevoContrato.modalidad_tiempo,
        posiciones_contratadas: Number(nuevoContrato.posiciones_contratadas),
        tarifa_unitaria: Number(nuevoContrato.tarifa_unitaria),
        tarifa_recargo_sobrepeso_kg: Number(nuevoContrato.tarifa_recargo_sobrepeso_kg),
        modalidad_facturacion: nuevoContrato.modalidad_facturacion,
        requiere_cuentas_orden: nuevoContrato.requiere_cuentas_orden,
        fecha_inicio: nuevoContrato.fecha_inicio,
        fecha_fin: nuevoContrato.fecha_fin,
        estado: 'VIGENTE',
        observaciones: nuevoContrato.observaciones,
      };

      await coldStorageRentalService.crearContrato(payload);
      setShowContratoModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Contrato Creado',
        text: `Contrato ${consecutivo} registrado exitosamente (${payload.posiciones_contratadas! * 800} Kg asegurados).`,
        background: '#0f172a',
        color: '#f8fafc',
      });
      await cargarTodo();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo crear el contrato.',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await coldStorageRentalService.crearClienteCustodia({
        empresa_id: DEFAULT_EMPRESA_ID,
        ...(nuevoCliente as any),
      });
      setShowClienteModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Cliente Registrado',
        text: 'Cliente 3PL registrado satisfactoriamente.',
        background: '#0f172a',
        color: '#f8fafc',
      });
      await cargarTodo();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al guardar cliente.',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await coldStorageRentalService.crearProductoCustodia({
        empresa_id: DEFAULT_EMPRESA_ID,
        ...(nuevoProducto as any),
      });
      setShowProductoModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Producto Registrado',
        text: 'SKU de cliente registrado para custodia.',
        background: '#0f172a',
        color: '#f8fafc',
      });
      await cargarTodo();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error al guardar producto.',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarRecepcion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await coldStorageRentalService.registrarRecepcion({
        empresa_id: DEFAULT_EMPRESA_ID,
        contrato_id: nuevaRecepcion.contrato_id,
        producto_custodia_id: nuevaRecepcion.producto_custodia_id,
        lote_cliente: nuevaRecepcion.lote_cliente,
        bultos: Number(nuevaRecepcion.bultos),
        peso_bruto_kg: Number(nuevaRecepcion.peso_bruto_kg),
        peso_tara_kg: Number(nuevaRecepcion.peso_tara_kg),
        temperatura: Number(nuevaRecepcion.temperatura),
        transportador_nombre: nuevaRecepcion.transportador_nombre,
        transportador_cedula: nuevaRecepcion.transportador_cedula,
        placa_vehiculo: nuevaRecepcion.placa_vehiculo,
        operador_id: '00000000-0000-0000-0000-000000000000',
        fecha_vencimiento: nuevaRecepcion.fecha_vencimiento || null,
        observaciones: nuevaRecepcion.observaciones,
      } as any);

      setShowRecepcionModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Acta de Recepción Generada',
        html: `
          <p>Acta: <b>${res.acta_consecutivo}</b></p>
          <p>Peso Neto Ingresado: <b>${res.peso_neto_ingresado} Kg</b></p>
          ${res.sobrecupo_detectado_kg > 0 ? `<p style="color:#ef4444">⚠️ Sobrecupo Detectado: <b>${res.sobrecupo_detectado_kg} Kg</b></p>` : ''}
        `,
        background: '#0f172a',
        color: '#f8fafc',
      });
      await cargarTodo();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error en Recepción',
        text: err.message || 'No se pudo registrar la recepción.',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarDespacho = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await coldStorageRentalService.registrarDespacho({
        empresa_id: DEFAULT_EMPRESA_ID,
        inventario_id: nuevoDespacho.inventario_id,
        bultos_despacho: Number(nuevoDespacho.bultos_despacho),
        peso_bruto_salida: Number(nuevoDespacho.peso_bruto_salida),
        peso_tara_salida: Number(nuevoDespacho.peso_tara_salida),
        transportador_nombre: nuevoDespacho.transportador_nombre,
        transportador_cedula: nuevoDespacho.transportador_cedula,
        placa_vehiculo: nuevoDespacho.placa_vehiculo,
        operador_id: '00000000-0000-0000-0000-000000000000',
        observaciones: nuevoDespacho.observaciones,
      } as any);

      setShowDespachoModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Acta de Despacho Generada',
        html: `
          <p>Acta: <b>${res.acta_consecutivo}</b></p>
          <p>Peso Despachado: <b>${res.peso_despachado_kg} Kg</b></p>
          <p>Merma Registrada: <b>${res.merma_kg} Kg</b></p>
          <p>Saldo Remanente: <b>${res.remanente_peso_kg} Kg (${res.remanente_bultos} bultos)</b></p>
        `,
        background: '#0f172a',
        color: '#f8fafc',
      });
      await cargarTodo();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error en Despacho',
        text: err.message || 'No se pudo despachar la mercancía.',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarCausacion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await coldStorageRentalService.causarIngresoAlquiler({
        empresa_id: DEFAULT_EMPRESA_ID,
        contrato_id: nuevaCausacion.contrato_id,
        periodo_inicio: nuevaCausacion.periodo_inicio,
        periodo_fin: nuevaCausacion.periodo_fin,
        recargo_sobrecupo: Number(nuevaCausacion.recargo_sobrecupo),
        porcentaje_retefuente: Number(nuevaCausacion.porcentaje_retefuente),
      } as any);

      setShowCausacionModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Causación Contable Exitosa (4155)',
        html: `
          <p>Consecutivo: <b>${res.consecutivo_causacion}</b></p>
          <p>Subtotal Servicio: <b>$${Number(res.subtotal).toLocaleString('es-CO')}</b></p>
          <p>IVA 19% (2408): <b>$${Number(res.iva_19).toLocaleString('es-CO')}</b></p>
          <p>Total a Cobrar (1305): <b>$${Number(res.total).toLocaleString('es-CO')}</b></p>
        `,
        background: '#0f172a',
        color: '#f8fafc',
      });
      await cargarTodo();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error en Causación',
        text: err.message || 'No se pudo liquidar la causación contable.',
        background: '#0f172a',
        color: '#f8fafc',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
            <Snowflake className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              Alquiler de Cuarto Frío y Custodia 3PL
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                800 Kg / Posición
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Gestión de contratos de almacenamiento frigorífico, báscula calibrada, actas y causación en cuenta 4155.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowRecepcionModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-950 transition-all text-sm"
          >
            <Scale className="w-4 h-4" />
            Recepción Báscula (Entrada)
          </button>
          <button
            onClick={() => setShowContratoModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-lg shadow-sky-950 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Contrato
          </button>
          <button
            onClick={cargarTodo}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10"
            title="Refrescar Datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs de Navegación */}
      <div className="flex border-b border-white/10 space-x-2 overflow-x-auto pb-1">
        {[
          { id: 'dashboard', label: 'Dashboard & Capacidad', icon: TrendingUp },
          { id: 'contratos', label: 'Contratos de Alquiler', icon: FileText },
          { id: 'clientes_productos', label: 'Clientes & Catálogo 3PL', icon: Users },
          { id: 'bascula_movimientos', label: 'Báscula & Movimientos', icon: Scale },
          { id: 'existencias', label: 'Existencias en Custodia', icon: Box },
          { id: 'contabilidad', label: 'Causación Contable (4155)', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD & CAPACIDAD */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Métricas Clave */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10">
              <span className="text-xs uppercase tracking-wider text-slate-400">Capacidad Total Cuartos</span>
              <div className="text-2xl font-bold text-white mt-1">
                {totalPosicionesCapacidad}{' '}
                <span className="text-xs font-normal text-slate-400">pos. ({(totalPosicionesCapacidad * 800).toLocaleString('es-CO')} Kg)</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>800 Kg estándar por posición</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10">
              <span className="text-xs uppercase tracking-wider text-slate-400">Posiciones Contratadas</span>
              <div className="text-2xl font-bold text-sky-400 mt-1">
                {totalPosicionesContratadas} <span className="text-xs font-normal text-slate-400">ocupadas</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{posicionesDisponibles} posiciones libres disponibles</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10">
              <span className="text-xs uppercase tracking-wider text-slate-400">Kilos Reales en Custodia</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {totalKilosEnCustodia.toLocaleString('es-CO')}{' '}
                <span className="text-xs font-normal text-slate-400">Kg netos</span>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                {totalBultosEnCustodia} bultos / cajas almacenadas
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10">
              <span className="text-xs uppercase tracking-wider text-slate-400">Ingresos Acumulados (4155)</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                ${Math.round(totalIngresosMes).toLocaleString('es-CO')}
              </div>
              <div className="mt-3 text-xs text-slate-400">
                Facturación por servicio frigorífico
              </div>
            </div>
          </div>

          {/* Tarjetas de Cuartos Fríos Físicos */}
          <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              Estado y Setpoint de Cuartos Fríos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cuartosFrios.map((cf) => {
                const contratosEnCuarto = contratos.filter((c) => c.cuarto_frio_id === cf.id && c.estado === 'VIGENTE');
                const posOcupadas = contratosEnCuarto.reduce((acc, c) => acc + c.posiciones_contratadas, 0);
                const porcentajeOcupacion = cf.capacidad_total_posiciones > 0
                  ? Math.min(100, Math.round((posOcupadas / cf.capacidad_total_posiciones) * 100))
                  : 0;

                return (
                  <div key={cf.id} className="p-5 rounded-xl bg-slate-950/60 border border-white/5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono text-sky-400">{cf.codigo}</span>
                        <h3 className="font-semibold text-white">{cf.nombre}</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {cf.temperatura_setpoint} °C
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Ocupación</span>
                        <span>{posOcupadas} / {cf.capacidad_total_posiciones} pos. ({porcentajeOcupacion}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            porcentajeOcupacion > 90
                              ? 'bg-rose-500'
                              : porcentajeOcupacion > 70
                              ? 'bg-amber-500'
                              : 'bg-sky-500'
                          }`}
                          style={{ width: `${porcentajeOcupacion}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-white/5">
                      <span>Capacidad Kg:</span>
                      <span className="font-semibold text-slate-200">
                        {(cf.capacidad_total_posiciones * 800).toLocaleString('es-CO')} Kg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONTRATOS DE ALQUILER */}
      {/* ========================================================================= */}
      {activeTab === 'contratos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Contratos de Prestación de Servicios Frigoríficos</h2>
            <button
              onClick={() => setShowContratoModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo Contrato
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-4">Consecutivo</th>
                  <th className="p-4">Cliente (3PL)</th>
                  <th className="p-4">Cuarto Frío</th>
                  <th className="p-4">Posiciones (800kg)</th>
                  <th className="p-4">Tarifa Unitaria</th>
                  <th className="p-4">Vigencia</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {contratos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No hay contratos registrados. Haz clic en "Nuevo Contrato" para iniciar.
                    </td>
                  </tr>
                ) : (
                  contratos.map((ctr) => {
                    const clienteData = clientes.find((c) => c.id === ctr.cliente_id);
                    const cfData = cuartosFrios.find((cf) => cf.id === ctr.cuarto_frio_id);

                    return (
                      <tr key={ctr.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-mono font-bold text-sky-400">{ctr.consecutivo}</td>
                        <td className="p-4 font-medium text-white">{clienteData?.razon_social || 'Cliente'}</td>
                        <td className="p-4">{cfData?.nombre || 'Cuarto Frío'}</td>
                        <td className="p-4">
                          <span className="font-semibold text-emerald-400">{ctr.posiciones_contratadas} pos.</span>{' '}
                          <span className="text-xs text-slate-500">({ctr.posiciones_contratadas * 800} Kg)</span>
                        </td>
                        <td className="p-4">
                          ${Number(ctr.tarifa_unitaria).toLocaleString('es-CO')} / {ctr.modalidad_tiempo}
                        </td>
                        <td className="p-4 text-xs font-mono">
                          {ctr.fecha_inicio} a {ctr.fecha_fin}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              ctr.estado === 'VIGENTE'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {ctr.estado}
                          </span>
                        </td>
                        <td className="p-4 text-center space-x-2">
                          <button
                            onClick={() => {
                              if (clienteData) {
                                coldStoragePdfService.generarPdfContratoAlquiler(ctr, clienteData, cfData);
                              }
                            }}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-white/10"
                            title="Descargar Contrato PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedContratoForCausacion(ctr);
                              setNuevaCausacion({
                                contrato_id: ctr.id || '',
                                periodo_inicio: ctr.fecha_inicio,
                                periodo_fin: ctr.fecha_fin,
                                recargo_sobrecupo: 0,
                                porcentaje_retefuente: 4.0,
                              });
                              setShowCausacionModal(true);
                            }}
                            className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/30"
                            title="Causar Ingreso (4155)"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CLIENTES & CATÁLOGO 3PL */}
      {/* ========================================================================= */}
      {activeTab === 'clientes_productos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clientes 3PL */}
          <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                Clientes de Custodia 3PL
              </h2>
              <button
                onClick={() => setShowClienteModal(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs"
              >
                <Plus className="w-4 h-4" />
                Nuevo Cliente
              </button>
            </div>

            <div className="space-y-3">
              {clientes.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-white">{c.razon_social}</h4>
                      <span className="text-xs font-mono text-slate-400">
                        {c.tipo_identificacion}: {c.numero_identificacion}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        c.estado === 'ACTIVO'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {c.estado}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex gap-4 pt-1">
                    <span>Contacto: {c.responsable_contacto || 'N/A'}</span>
                    <span>Tel: {c.telefono || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Catálogo de SKUs de Clientes */}
          <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Box className="w-5 h-5 text-emerald-400" />
                Catálogo de SKUs en Custodia
              </h2>
              <button
                onClick={() => setShowProductoModal(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs"
              >
                <Plus className="w-4 h-4" />
                Nuevo SKU
              </button>
            </div>

            <div className="space-y-3">
              {productos.map((p) => {
                const clienteData = clientes.find((c) => c.id === p.cliente_id);
                return (
                  <div key={p.id} className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white">{p.nombre}</h4>
                        <span className="text-xs text-sky-400">Cliente: {clienteData?.razon_social || 'N/A'}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
                        {p.modalidad_medicion}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex gap-4 pt-1">
                      <span>Empaque: {p.tipo_empaque}</span>
                      {p.peso_unitario_nominal && <span>Nominal: {p.peso_unitario_nominal} Kg</span>}
                      <span>Temp: {p.temperatura_optima}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BÁSCULA & MOVIMIENTOS */}
      {/* ========================================================================= */}
      {activeTab === 'bascula_movimientos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-sky-400" />
              Actas de Recepción e Ingreso / Despacho y Salida
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRecepcionModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Entrada (Recepción)
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-4">Acta</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Fecha/Hora</th>
                  <th className="p-4">Bultos</th>
                  <th className="p-4">Bruto (Kg)</th>
                  <th className="p-4">Tara (Kg)</th>
                  <th className="p-4">Neto (Kg)</th>
                  <th className="p-4">Merma (Kg)</th>
                  <th className="p-4">Transportador</th>
                  <th className="p-4 text-center">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No hay actas de movimientos registradas.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-mono font-bold text-white">{m.consecutivo_acta}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            m.tipo_movimiento === 'ENTRADA'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {m.tipo_movimiento}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-mono">{new Date(m.fecha_movimiento).toLocaleString('es-CO')}</td>
                      <td className="p-4 font-semibold">{m.bultos}</td>
                      <td className="p-4">{Number(m.peso_bruto_kg).toFixed(2)}</td>
                      <td className="p-4">{Number(m.peso_tara_kg).toFixed(2)}</td>
                      <td className="p-4 font-bold text-sky-400">{Number(m.peso_neto_kg).toFixed(2)}</td>
                      <td className="p-4 font-mono text-rose-400">{Number(m.merma_kg).toFixed(2)}</td>
                      <td className="p-4 text-xs">
                        {m.transportador_nombre} <span className="text-slate-500">({m.placa_vehiculo})</span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            const invItem = inventario.find((i) => i.id === m.inventario_custodia_id);
                            const clData = clientes.find((c) => c.id === invItem?.cliente_id);
                            const prData = productos.find((p) => p.id === invItem?.producto_custodia_id);

                            if (m.tipo_movimiento === 'ENTRADA' && invItem && clData && prData) {
                              coldStoragePdfService.generarPdfActaRecepcion({
                                movimiento: m,
                                inventario: invItem,
                                cliente: clData,
                                producto: prData,
                              });
                            } else if (m.tipo_movimiento === 'SALIDA' && invItem && clData && prData) {
                              coldStoragePdfService.generarPdfActaDespacho({
                                movimiento: m,
                                inventario: invItem,
                                cliente: clData,
                                producto: prData,
                                remanenteBultos: invItem.bultos_actuales,
                                remanentePesoKg: Number(invItem.peso_neto_actual_kg),
                              });
                            }
                          }}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400"
                          title="Descargar Acta PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: EXISTENCIAS EN CUSTODIA */}
      {/* ========================================================================= */}
      {activeTab === 'existencias' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-emerald-400" />
              Inventario de Terceros en Custodia (Aislado de Cuenta 1435)
            </h2>

            <div className="flex items-center gap-3">
              <select
                value={selectedClienteFilter}
                onChange={(e) => setSelectedClienteFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-slate-200"
              >
                <option value="">Todos los Clientes</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razon_social}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  if (!selectedClienteFilter) {
                    Swal.fire({
                      icon: 'info',
                      title: 'Selecciona un Cliente',
                      text: 'Por favor selecciona un cliente en el filtro para emitir su Certificado Oficial de Existencias.',
                      background: '#0f172a',
                      color: '#f8fafc',
                    });
                    return;
                  }
                  const cli = clientes.find((c) => c.id === selectedClienteFilter);
                  const items = inventario.filter((i) => i.cliente_id === selectedClienteFilter);
                  if (cli) {
                    coldStoragePdfService.generarPdfCertificadoCustodia({
                      cliente: cli,
                      inventarioItems: items,
                      fechaCorte: new Date().toISOString().substring(0, 10),
                    });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm"
              >
                <FileText className="w-4 h-4" />
                Certificado Oficial PDF
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-4">Lote Cliente</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Fecha Ingreso</th>
                  <th className="p-4">Bultos Actuales</th>
                  <th className="p-4">Kilos Actuales</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inventario.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No hay inventario activo en custodia.
                    </td>
                  </tr>
                ) : (
                  inventario
                    .filter((i) => !selectedClienteFilter || i.cliente_id === selectedClienteFilter)
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-mono font-bold text-sky-400">{item.lote_cliente}</td>
                        <td className="p-4 text-white font-medium">{item.cliente?.razon_social || 'Cliente'}</td>
                        <td className="p-4">{item.producto?.nombre || 'Producto'}</td>
                        <td className="p-4 text-xs font-mono">{item.fecha_ingreso ? item.fecha_ingreso.substring(0, 10) : 'N/A'}</td>
                        <td className="p-4 font-semibold">{item.bultos_actuales}</td>
                        <td className="p-4 font-bold text-emerald-400">{Number(item.peso_neto_actual_kg).toFixed(2)} Kg</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedInvForDespacho(item);
                              setNuevoDespacho({
                                inventario_id: item.id,
                                bultos_despacho: item.bultos_actuales,
                                peso_bruto_salida: Number(item.peso_neto_actual_kg) + 10,
                                peso_tara_salida: 10,
                                transportador_nombre: '',
                                transportador_cedula: '',
                                placa_vehiculo: '',
                                observaciones: '',
                              });
                              setShowDespachoModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white text-xs font-medium"
                          >
                            Despachar (Salida)
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: CAUSACIÓN CONTABLE (4155) */}
      {/* ========================================================================= */}
      {activeTab === 'contabilidad' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              Causaciones Contables de Almacenamiento (Ingresos 4155 / IVA 2408 / Cartera 1305)
            </h2>
          </div>

          <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-4">Consecutivo</th>
                  <th className="p-4">Periodo</th>
                  <th className="p-4">Subtotal (4155)</th>
                  <th className="p-4">Sobrecupo</th>
                  <th className="p-4">Base Gravable</th>
                  <th className="p-4">IVA 19% (2408)</th>
                  <th className="p-4">Retefuente</th>
                  <th className="p-4">Total a Cobrar (1305)</th>
                  <th className="p-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {causaciones.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No hay causaciones liquidadas todavía.
                    </td>
                  </tr>
                ) : (
                  causaciones.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-mono font-bold text-sky-400">{c.consecutivo_causacion}</td>
                      <td className="p-4 text-xs font-mono">
                        {c.periodo_inicio} a {c.periodo_fin}
                      </td>
                      <td className="p-4">${Number(c.subtotal).toLocaleString('es-CO')}</td>
                      <td className="p-4 text-amber-400">${Number(c.recargo_sobrecupo).toLocaleString('es-CO')}</td>
                      <td className="p-4 font-semibold">${Number(c.base_gravable).toLocaleString('es-CO')}</td>
                      <td className="p-4">${Number(c.iva_19).toLocaleString('es-CO')}</td>
                      <td className="p-4 text-rose-400">-${Number(c.retefuente).toLocaleString('es-CO')}</td>
                      <td className="p-4 font-bold text-emerald-400">${Number(c.total).toLocaleString('es-CO')}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {c.estado_pago}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR CONTRATO */}
      {/* ========================================================================= */}
      {showContratoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400" />
              Nuevo Contrato de Alquiler de Cuarto Frío
            </h3>

            <form onSubmit={handleGuardarContrato} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cliente (3PL)</label>
                  <select
                    required
                    value={nuevoContrato.cliente_id}
                    onChange={(e) => setNuevoContrato({ ...nuevoContrato, cliente_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  >
                    <option value="">Selecciona Cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.razon_social}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cuarto Frío</label>
                  <select
                    required
                    value={nuevoContrato.cuarto_frio_id}
                    onChange={(e) => setNuevoContrato({ ...nuevoContrato, cuarto_frio_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  >
                    <option value="">Selecciona Cuarto Frío...</option>
                    {cuartosFrios.map((cf) => (
                      <option key={cf.id} value={cf.id}>
                        {cf.nombre} ({cf.temperatura_setpoint} °C)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Posiciones (800 Kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={nuevoContrato.posiciones_contratadas}
                    onChange={(e) =>
                      setNuevoContrato({ ...nuevoContrato, posiciones_contratadas: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                  <span className="text-[11px] text-sky-400 font-mono">
                    = {nuevoContrato.posiciones_contratadas * 800} Kg asegurados
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Modalidad Tiempo</label>
                  <select
                    value={nuevoContrato.modalidad_tiempo}
                    onChange={(e) =>
                      setNuevoContrato({ ...nuevoContrato, modalidad_tiempo: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  >
                    <option value="MESES">Meses</option>
                    <option value="DIAS">Días</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tarifa Unitaria ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={nuevoContrato.tarifa_unitaria}
                    onChange={(e) => setNuevoContrato({ ...nuevoContrato, tarifa_unitaria: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    required
                    value={nuevoContrato.fecha_inicio}
                    onChange={(e) => setNuevoContrato({ ...nuevoContrato, fecha_inicio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    required
                    value={nuevoContrato.fecha_fin}
                    onChange={(e) => setNuevoContrato({ ...nuevoContrato, fecha_fin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowContratoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium"
                >
                  {loading ? 'Guardando...' : 'Crear Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECEPCIÓN BÁSCULA */}
      {/* ========================================================================= */}
      {showRecepcionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              Operación de Báscula: Recepción / Ingreso en Custodia
            </h3>

            <form onSubmit={handleGuardarRecepcion} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Contrato Vigente</label>
                  <select
                    required
                    value={nuevaRecepcion.contrato_id}
                    onChange={(e) => setNuevaRecepcion({ ...nuevaRecepcion, contrato_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  >
                    <option value="">Selecciona Contrato...</option>
                    {contratos.map((ctr) => {
                      const cl = clientes.find((c) => c.id === ctr.cliente_id);
                      return (
                        <option key={ctr.id} value={ctr.id}>
                          {ctr.consecutivo} - {cl?.razon_social} ({ctr.posiciones_contratadas * 800} Kg)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Producto / SKU</label>
                  <select
                    required
                    value={nuevaRecepcion.producto_custodia_id}
                    onChange={(e) =>
                      setNuevaRecepcion({ ...nuevaRecepcion, producto_custodia_id: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  >
                    <option value="">Selecciona SKU...</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.tipo_empaque})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Lote del Cliente</label>
                  <input
                    type="text"
                    required
                    placeholder="LOT-2026-..."
                    value={nuevaRecepcion.lote_cliente}
                    onChange={(e) => setNuevaRecepcion({ ...nuevaRecepcion, lote_cliente: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Bultos / Cajas</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={nuevaRecepcion.bultos}
                    onChange={(e) => setNuevaRecepcion({ ...nuevaRecepcion, bultos: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Temp. Ingreso (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={nuevaRecepcion.temperatura}
                    onChange={(e) => setNuevaRecepcion({ ...nuevaRecepcion, temperatura: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Báscula */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/20 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Peso Bruto (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={nuevaRecepcion.peso_bruto_kg}
                    onChange={(e) =>
                      setNuevaRecepcion({ ...nuevaRecepcion, peso_bruto_kg: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tara Estibas (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={nuevaRecepcion.peso_tara_kg}
                    onChange={(e) =>
                      setNuevaRecepcion({ ...nuevaRecepcion, peso_tara_kg: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1">Peso Neto Calculado</label>
                  <div className="text-xl font-bold font-mono text-emerald-400 pt-2">
                    {Math.max(0, nuevaRecepcion.peso_bruto_kg - nuevaRecepcion.peso_tara_kg).toFixed(2)} Kg
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Conductor</label>
                  <input
                    type="text"
                    required
                    value={nuevaRecepcion.transportador_nombre}
                    onChange={(e) =>
                      setNuevaRecepcion({ ...nuevaRecepcion, transportador_nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cédula</label>
                  <input
                    type="text"
                    required
                    value={nuevaRecepcion.transportador_cedula}
                    onChange={(e) =>
                      setNuevaRecepcion({ ...nuevaRecepcion, transportador_cedula: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Placa Vehículo</label>
                  <input
                    type="text"
                    required
                    value={nuevaRecepcion.placa_vehiculo}
                    onChange={(e) =>
                      setNuevaRecepcion({ ...nuevaRecepcion, placa_vehiculo: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowRecepcionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  {loading ? 'Procesando Báscula...' : 'Confirmar Recepción e Imprimir Acta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DESPACHO BÁSCULA */}
      {/* ========================================================================= */}
      {showDespachoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-rose-400" />
              Operación de Báscula: Despacho / Retiro de Custodia
            </h3>

            {selectedInvForDespacho && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-white/5 text-xs space-y-1">
                <p>
                  Lote: <b className="text-sky-400">{selectedInvForDespacho.lote_cliente}</b> | Producto:{' '}
                  <b className="text-white">{selectedInvForDespacho.producto?.nombre}</b>
                </p>
                <p>
                  Disponible en Bodega:{' '}
                  <b className="text-emerald-400">
                    {selectedInvForDespacho.peso_neto_actual_kg} Kg ({selectedInvForDespacho.bultos_actuales} bultos)
                  </b>
                </p>
              </div>
            )}

            <form onSubmit={handleGuardarDespacho} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Bultos a Despachar</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedInvForDespacho?.bultos_actuales}
                    required
                    value={nuevoDespacho.bultos_despacho}
                    onChange={(e) =>
                      setNuevoDespacho({ ...nuevoDespacho, bultos_despacho: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Peso Bruto Salida (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={nuevoDespacho.peso_bruto_salida}
                    onChange={(e) =>
                      setNuevoDespacho({ ...nuevoDespacho, peso_bruto_salida: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Conductor</label>
                  <input
                    type="text"
                    required
                    value={nuevoDespacho.transportador_nombre}
                    onChange={(e) =>
                      setNuevoDespacho({ ...nuevoDespacho, transportador_nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cédula</label>
                  <input
                    type="text"
                    required
                    value={nuevoDespacho.transportador_cedula}
                    onChange={(e) =>
                      setNuevoDespacho({ ...nuevoDespacho, transportador_cedula: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Placa Vehículo</label>
                  <input
                    type="text"
                    required
                    value={nuevoDespacho.placa_vehiculo}
                    onChange={(e) => setNuevoDespacho({ ...nuevoDespacho, placa_vehiculo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowDespachoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium"
                >
                  {loading ? 'Despachando...' : 'Confirmar Salida e Imprimir Acta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CAUSACIÓN CONTABLE */}
      {/* ========================================================================= */}
      {showCausacionModal && selectedContratoForCausacion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              Causación Contable de Ingresos (4155 / 2408 / 1305)
            </h3>

            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 text-xs space-y-1">
              <p>
                Contrato: <b className="text-sky-400">{selectedContratoForCausacion.consecutivo}</b>
              </p>
              <p>
                Posiciones: <b>{selectedContratoForCausacion.posiciones_contratadas}</b> | Tarifa:{' '}
                <b>${Number(selectedContratoForCausacion.tarifa_unitaria).toLocaleString('es-CO')}</b>
              </p>
            </div>

            <form onSubmit={handleGuardarCausacion} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Periodo Desde</label>
                  <input
                    type="date"
                    required
                    value={nuevaCausacion.periodo_inicio}
                    onChange={(e) => setNuevaCausacion({ ...nuevaCausacion, periodo_inicio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Periodo Hasta</label>
                  <input
                    type="date"
                    required
                    value={nuevaCausacion.periodo_fin}
                    onChange={(e) => setNuevaCausacion({ ...nuevaCausacion, periodo_fin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Recargo Sobrecupo ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={nuevaCausacion.recargo_sobrecupo}
                    onChange={(e) =>
                      setNuevaCausacion({ ...nuevaCausacion, recargo_sobrecupo: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">% Retefuente</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={nuevaCausacion.porcentaje_retefuente}
                    onChange={(e) =>
                      setNuevaCausacion({ ...nuevaCausacion, porcentaje_retefuente: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCausacionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium"
                >
                  {loading ? 'Generando Asiento...' : 'Registrar Causación Contable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVO CLIENTE */}
      {/* ========================================================================= */}
      {showClienteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              Nuevo Cliente de Custodia (3PL)
            </h3>

            <form onSubmit={handleGuardarCliente} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="Distribuidora del Caribe SAS"
                  value={nuevoCliente.razon_social}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, razon_social: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tipo ID</label>
                  <select
                    value={nuevoCliente.tipo_identificacion}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipo_identificacion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  >
                    <option value="NIT">NIT</option>
                    <option value="CC">Cédula</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Número ID</label>
                  <input
                    type="text"
                    required
                    placeholder="900.123.456-7"
                    value={nuevoCliente.numero_identificacion}
                    onChange={(e) =>
                      setNuevoCliente({ ...nuevoCliente, numero_identificacion: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Contacto</label>
                  <input
                    type="text"
                    placeholder="Carlos Pérez"
                    value={nuevoCliente.responsable_contacto}
                    onChange={(e) =>
                      setNuevoCliente({ ...nuevoCliente, responsable_contacto: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="300 123 4567"
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowClienteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium"
                >
                  {loading ? 'Guardando...' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVO PRODUCTO SKU */}
      {/* ========================================================================= */}
      {showProductoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-emerald-400" />
              Nuevo SKU para Custodia
            </h3>

            <form onSubmit={handleGuardarProducto} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cliente Propietario</label>
                <select
                  required
                  value={nuevoProducto.cliente_id}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, cliente_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                >
                  <option value="">Selecciona Cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razon_social}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  placeholder="Filete de Salmón Congelado"
                  value={nuevoProducto.nombre}
                  onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Modalidad de Medición</label>
                  <select
                    value={nuevoProducto.modalidad_medicion}
                    onChange={(e) =>
                      setNuevoProducto({ ...nuevoProducto, modalidad_medicion: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                  >
                    <option value="SOLO_PESO">Solo Peso Variable</option>
                    <option value="PESO_ESTABLE">Peso Estable (Fijo)</option>
                    <option value="MIXTO_BULTOS_PESO">Mixto (Bultos + Peso)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Peso Nominal (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={nuevoProducto.peso_unitario_nominal}
                    onChange={(e) =>
                      setNuevoProducto({ ...nuevoProducto, peso_unitario_nominal: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowProductoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  {loading ? 'Guardando...' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColdStorageRentalView;
