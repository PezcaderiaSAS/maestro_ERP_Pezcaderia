import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  User,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  CreditCard,
  Banknote,
  ArrowRight,
  RefreshCw,
  X,
  Building2,
  Phone,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { Cliente } from '../../../types/erp.types';
import { useClientStore } from '../../../store/useClientStore';

export interface B2BClientSelectorStepProps {
  selectedCliente: Cliente | null;
  onSelectCliente: (cliente: Cliente) => void;
  formaPago: 'CONTADO' | 'CREDITO';
  onChangeFormaPago: (forma: 'CONTADO' | 'CREDITO') => void;
  onNext: () => void;
  clientesList?: Cliente[];
}

export const B2BClientSelectorStep: React.FC<B2BClientSelectorStepProps> = ({
  selectedCliente,
  onSelectCliente,
  formaPago,
  onChangeFormaPago,
  onNext,
  clientesList,
}) => {
  const storeClientes = useClientStore((s) => s.clientes);
  const clientes = clientesList ?? storeClientes;

  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus continuo en el buscador para rapidez en calle/móvil
  useEffect(() => {
    if (!selectedCliente && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [selectedCliente]);

  // Filtrado predictivo instantáneo
  const filteredClientes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return clientes.slice(0, 8); // Top 8 iniciales
    return clientes
      .filter(
        (c) =>
          c.nombre?.toLowerCase().includes(term) ||
          c.identificacion?.toLowerCase().includes(term) ||
          c.ciudad?.toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [clientes, searchTerm]);

  // Cálculos del Semáforo de Crédito para el cliente seleccionado
  const creditAnalysis = useMemo(() => {
    if (!selectedCliente) return null;
    const cupoTotal = selectedCliente.cupoCredito || 0;
    const cupoUsado = selectedCliente.cupoCreditoUsado || 0;
    const cupoDisponible = Math.max(0, cupoTotal - cupoUsado);
    const porcentajeUso =
      cupoTotal > 0 ? Math.min(100, Math.round((cupoUsado / cupoTotal) * 100)) : 0;

    let estadoSemaforo: 'VERDE' | 'AMARILLO' | 'ROJO' = 'ROJO';
    let labelSemaforo = 'Agotado (100% Usado)';
    let colorClase = 'emerald';

    if (cupoTotal === 0) {
      estadoSemaforo = 'ROJO';
      labelSemaforo = 'Sin Cupo Asignado';
      colorClase = 'rose';
    } else if (porcentajeUso <= 75 && cupoDisponible > 0) {
      estadoSemaforo = 'VERDE';
      labelSemaforo = `Saludable (${porcentajeUso}% usado)`;
      colorClase = 'emerald';
    } else if (porcentajeUso < 100 && cupoDisponible > 0) {
      estadoSemaforo = 'AMARILLO';
      labelSemaforo = `Atención (${porcentajeUso}% usado)`;
      colorClase = 'amber';
    } else {
      estadoSemaforo = 'ROJO';
      labelSemaforo = 'Agotado (100% Usado)';
      colorClase = 'rose';
    }

    return {
      cupoTotal,
      cupoUsado,
      cupoDisponible,
      porcentajeUso,
      estadoSemaforo,
      labelSemaforo,
      colorClase,
    };
  }, [selectedCliente]);

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Encabezado del Paso 1 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-cyan-700 uppercase bg-cyan-50 px-2.5 py-1 rounded-full">
            Paso 1 de 3: Identificación
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
            Selecciona el Cliente
          </h2>
          <p className="text-sm text-slate-500">
            Regla de Oro: Consulta de cupo a la vista antes de cotizar productos.
          </p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-lg">
          1
        </div>
      </div>

      {/* Si NO hay cliente seleccionado: Buscador y Lista predictiva */}
      {!selectedCliente ? (
        <div className="flex flex-col gap-4">
          {/* Buscador táctil auto-enfocado >= 48px */}
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-6 h-6 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              data-testid="b2b-client-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Escribe el nombre, NIT o ciudad..."
              className="w-full h-14 pl-12 pr-12 text-base md:text-lg rounded-xl border-2 border-slate-300 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 active:scale-95"
                title="Limpiar búsqueda"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Lista de Clientes con dimensiones táctiles cómodas */}
          <div className="flex flex-col gap-2.5 mt-1 max-h-[360px] overflow-y-auto pr-1">
            {filteredClientes.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <User className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-slate-700 font-medium">No se encontraron clientes</p>
                <p className="text-xs text-slate-500 mt-1">
                  Verifica que el nombre o NIT esté bien escrito.
                </p>
              </div>
            ) : (
              filteredClientes.map((cliente) => {
                const cupo = cliente.cupoCredito || 0;
                const usado = cliente.cupoCreditoUsado || 0;
                const disponible = Math.max(0, cupo - usado);

                return (
                  <button
                    key={cliente.id}
                    data-testid={`b2b-client-card-${cliente.id}`}
                    type="button"
                    onClick={() => onSelectCliente(cliente)}
                    className="w-full min-h-[56px] p-4 text-left rounded-xl border-2 border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50 active:bg-cyan-100/70 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-cyan-100 text-slate-700 group-hover:text-cyan-800 flex items-center justify-center shrink-0 font-bold text-sm">
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-cyan-950 text-base leading-tight">
                          {cliente.nombre}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{cliente.tipoIdentificacion}: {cliente.identificacion}</span>
                          <span>•</span>
                          <span>{cliente.ciudad || 'Bogotá'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-slate-400 block">
                        Cupo Disponible:
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          disponible > 0 ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {formatCOP(disponible)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Si HAY cliente seleccionado: Ficha Completa + Semáforo + Toggle Forma de Pago */
        <div className="flex flex-col gap-5">
          {/* Tarjeta de Cliente Activo */}
          <div className="p-4 md:p-5 rounded-2xl bg-cyan-50/60 border-2 border-cyan-200 relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight">
                      {selectedCliente.nombre}
                    </h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                      {selectedCliente.tipoPrecio || 'RESTAURANTE'}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 font-medium mt-0.5">
                    {selectedCliente.tipoIdentificacion}: {selectedCliente.identificacion}
                  </p>
                </div>
              </div>

              {/* Botón táctil para cambiar de cliente */}
              <button
                type="button"
                onClick={() => onSelectCliente(null as any)}
                className="min-h-[48px] px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs md:text-sm flex items-center gap-1.5 hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4 text-cyan-600" />
                <span>Cambiar</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-cyan-200/60 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-700 shrink-0" />
                <span className="truncate">{selectedCliente.direccion || 'Sin dirección'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-cyan-700 shrink-0" />
                <span>{selectedCliente.telefono || 'Sin teléfono'}</span>
              </div>
            </div>
          </div>

          {/* Semáforo Visual de Cupo de Crédito */}
          {creditAnalysis && (
            <div
              data-testid="b2b-credit-semaphore"
              className={`p-4 md:p-5 rounded-2xl border-2 transition-all ${
                creditAnalysis.estadoSemaforo === 'VERDE'
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : creditAnalysis.estadoSemaforo === 'AMARILLO'
                  ? 'bg-amber-50/70 border-amber-300'
                  : 'bg-rose-50/70 border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {creditAnalysis.estadoSemaforo === 'VERDE' && (
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  )}
                  {creditAnalysis.estadoSemaforo === 'AMARILLO' && (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                  {creditAnalysis.estadoSemaforo === 'ROJO' && (
                    <AlertOctagon className="w-5 h-5 text-rose-600" />
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Semáforo de Crédito:
                  </span>
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      creditAnalysis.estadoSemaforo === 'VERDE'
                        ? 'bg-emerald-200 text-emerald-900'
                        : creditAnalysis.estadoSemaforo === 'AMARILLO'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {creditAnalysis.labelSemaforo}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {creditAnalysis.porcentajeUso}% Utilizado
                </span>
              </div>

              {/* Barra de Progreso Cromática */}
              <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    creditAnalysis.estadoSemaforo === 'VERDE'
                      ? 'bg-emerald-500'
                      : creditAnalysis.estadoSemaforo === 'AMARILLO'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${creditAnalysis.porcentajeUso}%` }}
                />
              </div>

              {/* Cifras en texto grande y legible */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Cupo Disponible:
                  </span>
                  <span
                    className={`text-lg md:text-xl font-black ${
                      creditAnalysis.estadoSemaforo === 'VERDE'
                        ? 'text-emerald-800'
                        : creditAnalysis.estadoSemaforo === 'AMARILLO'
                        ? 'text-amber-800'
                        : 'text-rose-800'
                    }`}
                  >
                    {formatCOP(creditAnalysis.cupoDisponible)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Cupo Total Aprobado:
                  </span>
                  <span className="text-sm md:text-base font-bold text-slate-700">
                    {formatCOP(creditAnalysis.cupoTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Selector Táctil de Forma de Pago (Toggle de 1 toque) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Condición Comercial del Pedido:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                data-testid="b2b-payment-toggle-credito"
                onClick={() => onChangeFormaPago('CREDITO')}
                className={`min-h-[52px] p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-sm font-bold ${
                  formaPago === 'CREDITO'
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-950 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <CreditCard className="w-5 h-5 text-cyan-700" />
                <span>Condición: CRÉDITO</span>
              </button>

              <button
                type="button"
                data-testid="b2b-payment-toggle-contado"
                onClick={() => onChangeFormaPago('CONTADO')}
                className={`min-h-[52px] p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-sm font-bold ${
                  formaPago === 'CONTADO'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-700" />
                <span>Condición: CONTADO</span>
              </button>
            </div>

            {/* Ayuda contextual bajo la Regla del Niño de 12 Años */}
            {formaPago === 'CONTADO' ? (
              <p className="text-xs text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Aprobación Inmediata:</strong> El cobro se realiza contra entrega o por
                  transferencia sin consumir cupo de crédito.
                </span>
              </p>
            ) : creditAnalysis?.estadoSemaforo === 'ROJO' ? (
              <p className="text-xs text-rose-800 bg-rose-50/80 p-2.5 rounded-xl border border-rose-200 flex items-center gap-2 font-medium">
                <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Alerta de Cartera:</strong> Cliente sin cupo disponible. El pedido se
                  guardará como <strong>PAUSADO_POR_CREDITO</strong> para autorización de Cartera.
                </span>
              </p>
            ) : (
              <p className="text-xs text-cyan-900 bg-cyan-50/60 p-2.5 rounded-xl border border-cyan-200 flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0" />
                <span>
                  <strong>Crédito Habitual:</strong> Se cargará a la cuenta corriente del cliente según
                  plazo pactado.
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Botón Prominente de Avance >= 56px (h-14) */}
      <div className="pt-2">
        <button
          type="button"
          data-testid="b2b-btn-continue-step1"
          disabled={!selectedCliente}
          onClick={onNext}
          className={`w-full h-14 rounded-xl font-black text-base md:text-lg flex items-center justify-center gap-3 transition-all ${
            selectedCliente
              ? 'bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white shadow-lg shadow-cyan-600/30 active:scale-[0.99] cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>CONTINUAR A PRODUCTOS</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
