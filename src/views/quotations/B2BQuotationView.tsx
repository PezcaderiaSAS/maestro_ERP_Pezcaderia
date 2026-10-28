// src/views/quotations/B2BQuotationView.tsx
// Mesa de Trabajo de Cotizaciones B2B, Precios Diferenciales y Conversión a Preventa POS (SPEC-040)
// Estándar Dark Glassmorphism V8 (#070A10), retícula 8px, composite GPU 120 FPS.

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ChevronDown,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import Swal from 'sweetalert2';
import type {
  B2BQuotation,
  B2BQuotationItem,
  QuotationStatus,
} from '../../types/b2bQuotation.types';
import type { CustomerPricingTier } from '../../types/differentialPricing.types';
import { b2bQuotationService } from '../../services/b2bQuotationService';
import { differentialPricingService } from '../../services/differentialPricingService';
import { useAuthStore } from '../../store/useAuthStore';
import { PriceTierBadge } from '../pos/components/PriceTierBadge';
import { ConvertToPosModal } from './ConvertToPosModal';

export const B2BQuotationView: React.FC = () => {
  const activeTenant = useAuthStore((s) => s.activeTenant);
  const currentUser = useAuthStore((s) => s.currentUser);

  const tenantId = activeTenant?.id || 'ten-default';
  const asesorId = currentUser?.id || 'usr-asesor-01';

  const [cotizaciones, setCotizaciones] = useState<B2BQuotation[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Estados de Modales
  const [isCrearModalOpen, setIsCrearModalOpen] = useState<boolean>(false);
  const [cotizacionParaConversion, setCotizacionParaConversion] = useState<B2BQuotation | null>(null);
  const [cotizacionDetalle, setCotizacionDetalle] = useState<B2BQuotation | null>(null);

  // Estados del Formulario de Nueva Cotización
  const [nuevoClienteId, setNuevoClienteId] = useState<string>('cli-constructora-oriente');
  const [perfilCliente, setPerfilCliente] = useState<CustomerPricingTier>('MAYORISTA');
  const [diasVigencia, setDiasVigencia] = useState<number>(15);
  const [observaciones, setObservaciones] = useState<string>('');
  const [itemsEnEdicion, setItemsEnEdicion] = useState<B2BQuotationItem[]>([
    {
      id: 'item-demo-1',
      productoSku: 'HERR-TALADRO-750W',
      nombre: 'Taladro Percutor 1/2 Pulgada 750W Industrial',
      cantidad: 12,
      precioUnitarioPactado: 185000,
      tarifaAplicada: 'MAYORISTA',
      descuentoPct: 0,
      subtotalItem: 2220000,
    },
    {
      id: 'item-demo-2',
      productoSku: 'ABRA-DISCO-45',
      nombre: 'Disco Abrasivo de Corte Inox 4 1/2',
      cantidad: 100,
      precioUnitarioPactado: 3800,
      tarifaAplicada: 'MAYORISTA',
      descuentoPct: 5,
      subtotalItem: 361000,
    },
  ]);

  // Carga inicial de cotizaciones
  const recargarCotizaciones = async () => {
    setIsLoading(true);
    try {
      const lista = await b2bQuotationService.listarCotizaciones(tenantId);
      // Si la lista está vacía en primer arranque, creamos una demo si no hay datos
      if (lista.length === 0) {
        const demo = await b2bQuotationService.crearCotizacion({
          tenantId,
          clienteId: 'cli-ferreteria-el-martillo',
          asesorUsuarioId: asesorId,
          diasVigencia: 20,
          observaciones: 'Lote inicial de herramientas y discos para contrato de remodelación',
          items: itemsEnEdicion,
        });
        setCotizaciones([demo]);
      } else {
        setCotizaciones(lista);
      }
    } catch (err) {
      console.error('Error cargando cotizaciones B2B:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    recargarCotizaciones();
  }, [tenantId]);

  // Filtrado reactivo de cotizaciones
  const cotizacionesFiltradas = useMemo(() => {
    return cotizaciones.filter((c) => {
      const coincideEstado = filtroEstado === 'TODAS' || c.estado === filtroEstado;
      const q = busqueda.toLowerCase().trim();
      const coincideBusqueda =
        !q ||
        c.codigoCotizacion.toLowerCase().includes(q) ||
        c.clienteId.toLowerCase().includes(q) ||
        (c.observaciones && c.observaciones.toLowerCase().includes(q));
      return coincideEstado && coincideBusqueda;
    });
  }, [cotizaciones, filtroEstado, busqueda]);

  // Totales acumulados para métricas rápidas
  const metricas = useMemo(() => {
    const total = cotizaciones.length;
    const convertidas = cotizaciones.filter((c) => c.estado === 'CONVERTIDA').length;
    const aprobadas = cotizaciones.filter((c) => c.estado === 'APROBADA').length;
    const volumenNegociado = cotizaciones.reduce((acc, c) => acc + c.totalGeneral, 0);
    return { total, convertidas, aprobadas, volumenNegociado };
  }, [cotizaciones]);

  // Acciones sobre cotización
  const handleAprobar = async (cot: B2BQuotation) => {
    try {
      await b2bQuotationService.actualizarEstado(tenantId, cot.id, 'APROBADA');
      await Swal.fire({
        icon: 'success',
        title: 'Cotización Aprobada',
        text: `La cotización ${cot.codigoCotizacion} está lista para ser convertida a preventa POS.`,
        timer: 1800,
        showConfirmButton: false,
        background: '#0F172A',
        color: '#F8FAFC',
      });
      recargarCotizaciones();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
        background: '#0F172A',
        color: '#F8FAFC',
      });
    }
  };

  const handleCrearCotizacion = async () => {
    if (itemsEnEdicion.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cotización Vacía',
        text: 'Agregue al menos un producto a la cotización.',
        background: '#0F172A',
        color: '#F8FAFC',
      });
      return;
    }

    try {
      const nueva = await b2bQuotationService.crearCotizacion({
        tenantId,
        clienteId: nuevoClienteId,
        asesorUsuarioId: asesorId,
        items: itemsEnEdicion,
        diasVigencia,
        observaciones,
      });

      await Swal.fire({
        icon: 'success',
        title: '¡Cotización Creada!',
        text: `Se emitió con éxito la cotización ${nueva.codigoCotizacion}`,
        background: '#0F172A',
        color: '#F8FAFC',
        confirmButtonColor: '#10B981',
      });

      setIsCrearModalOpen(false);
      recargarCotizaciones();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Creación',
        text: err.message,
        background: '#0F172A',
        color: '#F8FAFC',
      });
    }
  };

  const getStatusBadge = (estado: QuotationStatus) => {
    switch (estado) {
      case 'BORRADOR':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-300 border border-slate-600/40">
            BORRADOR
          </span>
        );
      case 'EMITIDA':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            EMITIDA
          </span>
        );
      case 'APROBADA':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            APROBADA
          </span>
        );
      case 'CONVERTIDA':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            CONVERTIDA A POS
          </span>
        );
      case 'VENCIDA':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            VENCIDA
          </span>
        );
      case 'RECHAZADA':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            RECHAZADA
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Mesa de Cotizaciones B2B
              </h1>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                SPEC-040
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Tarifas diferenciales automáticas, umbrales mayoristas y conversión instantánea a Preventa POS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCrearModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-600/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cotización</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Propuestas</p>
          <p className="text-2xl font-bold font-mono text-white mt-1">{metricas.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Aprobadas</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{metricas.aprobadas}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Convertidas a POS</p>
          <p className="text-2xl font-bold font-mono text-purple-400 mt-1">{metricas.convertidas}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Volumen Negociado</p>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
            ${metricas.volumenNegociado.toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-white/5">
        {/* Chips de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(['TODAS', 'EMITIDA', 'APROBADA', 'CONVERTIDA', 'VENCIDA'] as const).map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filtroEstado === est
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {est}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código o cliente..."
            className="w-full bg-slate-800/60 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Tabla de Cotizaciones */}
      <div className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-b border-white/5 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Código / Fecha</th>
                <th className="px-6 py-4">Cliente B2B</th>
                <th className="px-6 py-4">Ítems</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Total Liquidado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {cotizacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron cotizaciones con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                cotizacionesFiltradas.map((cot) => (
                  <tr
                    key={cot.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-white group-hover:text-purple-400 transition-colors">
                        {cot.codigoCotizacion}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Vence: {new Date(cot.fechaVencimiento).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{cot.clienteId}</div>
                      <div className="text-xs text-slate-500">{cot.observaciones || 'Sin notas'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300 font-medium">
                        {cot.items.length} producto{cot.items.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-slate-500">
                        {cot.items[0]?.nombre.substring(0, 28)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(cot.estado)}
                      {cot.convertidaPrefacturaId && (
                        <div className="text-[11px] font-mono text-purple-300 mt-1 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          <span>ID: {cot.convertidaPrefacturaId.substring(0, 12)}...</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-emerald-400 text-base">
                        ${cot.totalGeneral.toLocaleString('es-CO')}
                      </div>
                      {cot.totalDescuentos > 0 && (
                        <div className="text-xs text-slate-400">
                          Ahorro: -${cot.totalDescuentos.toLocaleString('es-CO')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {cot.estado === 'EMITIDA' && (
                          <button
                            onClick={() => handleAprobar(cot)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aprobar</span>
                          </button>
                        )}

                        {(cot.estado === 'APROBADA' || cot.estado === 'EMITIDA') && (
                          <button
                            onClick={() => setCotizacionParaConversion(cot)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition-all flex items-center gap-1"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Convertir a POS</span>
                          </button>
                        )}

                        <button
                          onClick={() => setCotizacionDetalle(cot)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                          title="Ver detalle"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Conversión 1-Clic a Preventa POS */}
      <ConvertToPosModal
        isOpen={Boolean(cotizacionParaConversion)}
        onClose={() => setCotizacionParaConversion(null)}
        cotizacion={cotizacionParaConversion}
        onSuccess={() => {
          recargarCotizaciones();
        }}
      />

      {/* Modal / Drawer de Creación de Nueva Cotización */}
      {isCrearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-800/40">
              <h3 className="text-lg font-semibold text-white">Nueva Propuesta Comercial B2B</h3>
              <button
                onClick={() => setIsCrearModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Cliente Comercial / Razón Social
                </label>
                <input
                  type="text"
                  value={nuevoClienteId}
                  onChange={(e) => setNuevoClienteId(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Perfil Tarifario
                  </label>
                  <select
                    value={perfilCliente}
                    onChange={(e) => setPerfilCliente(e.target.value as CustomerPricingTier)}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="MAYORISTA">Mayorista Estándar</option>
                    <option value="CONTRATISTA">Contratista de Obra</option>
                    <option value="INSTITUCIONAL">Institucional / Gobierno</option>
                    <option value="DETAL">Detal Mostrador</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Vigencia (Días)
                  </label>
                  <input
                    type="number"
                    value={diasVigencia}
                    onChange={(e) => setDiasVigencia(Number(e.target.value))}
                    min={1}
                    max={90}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Observaciones de la Propuesta
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  placeholder="Condiciones de pago, entrega en obra, etc."
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Ítems Cotizados ({itemsEnEdicion.length})
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {itemsEnEdicion.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-white/5 text-xs"
                    >
                      <div>
                        <div className="font-medium text-slate-200">{item.nombre}</div>
                        <div className="text-slate-400">
                          {item.cantidad} unds × ${item.precioUnitarioPactado.toLocaleString('es-CO')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <PriceTierBadge tarifa={item.tarifaAplicada} />
                        <span className="font-mono font-bold text-slate-200">
                          ${item.subtotalItem.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-slate-800/40">
              <button
                onClick={() => setIsCrearModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearCotizacion}
                className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md"
              >
                Emitir Cotización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
