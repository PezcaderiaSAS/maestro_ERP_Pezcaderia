import React from 'react';
import {
  Scale,
  Plus,
  Minus,
  Snowflake,
  PackageCheck,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { calcularPesajeMuelleNeto } from '../../../../packages/validation-schemas/src/dockPurchasesReceiving.schema';

interface Props {
  pesoBrutoKg: number;
  onPesoBrutoChange: (peso: number) => void;
  cantidadCanastillas: number;
  onCantidadCanastillasChange: (canastillas: number) => void;
  porcentajeHielo: number;
  onPorcentajeHieloChange: (pct: number) => void;
  precioKgAcordado: number;
  onPrecioKgChange: (precio: number) => void;
  taraCanastillaKg?: number;
  className?: string;
}

const OPCIONES_HIELO = [0, 3, 5, 7, 10, 12, 15];

export const MuelleWeightScaleWidget: React.FC<Props> = ({
  pesoBrutoKg,
  onPesoBrutoChange,
  cantidadCanastillas,
  onCantidadCanastillasChange,
  porcentajeHielo,
  onPorcentajeHieloChange,
  precioKgAcordado,
  onPrecioKgChange,
  taraCanastillaKg = 2.0,
  className = ''
}) => {
  const metrologia = calcularPesajeMuelleNeto(
    pesoBrutoKg,
    cantidadCanastillas,
    porcentajeHielo,
    taraCanastillaKg
  );

  const subtotalCOP = Math.round(metrologia.pesoNetoRealKg * precioKgAcordado);
  const taraTotal = cantidadCanastillas * taraCanastillaKg;
  const esPesoInvalido = pesoBrutoKg > 0 && pesoBrutoKg <= taraTotal;

  return (
    <div
      data-testid="muelle-weight-scale-widget"
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all ${className}`}
    >
      {/* 1. Header con indicador de báscula */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2 text-slate-800">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
            <Scale size={20} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 m-0">Báscula de Muelle & Metrología</h4>
            <p className="text-xs text-slate-500 m-0">Tara fija {taraCanastillaKg.toFixed(1)} kg/canastilla plástica</p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
          Báscula Muelle #1
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 2. Display Gigante de Peso Bruto */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950 text-white p-5 rounded-2xl shadow-inner">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
              PESO BRUTO CAPTURADO
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              BÁSCULA ACTIVA
            </span>
          </div>

          <div className="my-4 flex items-baseline justify-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              data-testid="input-peso-bruto"
              value={pesoBrutoKg === 0 ? '' : pesoBrutoKg}
              onChange={(e) => onPesoBrutoChange(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0.00"
              className="w-full text-center font-mono text-4xl sm:text-5xl font-black bg-transparent border-0 text-white placeholder-slate-700 focus:outline-hidden focus:ring-0"
            />
            <span className="text-xl font-bold text-slate-400">kg</span>
          </div>

          {esPesoInvalido ? (
            <div className="flex items-center gap-1.5 p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold">
              <AlertTriangle size={16} />
              <span>Peso menor o igual a la tara ({taraTotal} kg)</span>
            </div>
          ) : (
            <div className="flex justify-between text-xs font-semibold text-slate-400 border-t border-white/10 pt-2">
              <span>Tara Canastillas: {metrologia.pesoTaraTotalKg} kg</span>
              <span className="text-emerald-400 font-bold">Neto: {metrologia.pesoNetoRealKg} kg</span>
            </div>
          )}
        </div>

        {/* 3. Controles Táctiles (Canastillas & Descuento de Hielo) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Canastillas plásticas */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <PackageCheck size={16} className="text-slate-500" />
                Número de Canastillas
              </label>
              <span className="text-xs font-bold text-slate-600">
                Tara: -{(cantidadCanastillas * taraCanastillaKg).toFixed(1)} kg
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onCantidadCanastillasChange(Math.max(1, cantidadCanastillas - 1))}
                className="min-w-[48px] min-h-[48px] w-12 h-12 bg-white border-2 border-slate-300 rounded-xl flex items-center justify-center font-black text-lg text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
              >
                <Minus size={20} />
              </button>

              <div className="flex-1 min-h-[48px] h-12 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center font-extrabold text-xl text-slate-900">
                {cantidadCanastillas} {cantidadCanastillas === 1 ? 'canastilla' : 'canastillas'}
              </div>

              <button
                type="button"
                onClick={() => onCantidadCanastillasChange(cantidadCanastillas + 1)}
                className="min-w-[48px] min-h-[48px] w-12 h-12 bg-white border-2 border-slate-300 rounded-xl flex items-center justify-center font-black text-lg text-slate-700 hover:bg-slate-100 active:scale-95 transition-transform"
              >
                <Plus size={20} />
              </button>

              <button
                type="button"
                onClick={() => onCantidadCanastillasChange(cantidadCanastillas + 5)}
                className="min-w-[48px] min-h-[48px] h-12 px-3 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center justify-center font-black text-sm text-blue-700 hover:bg-blue-100 active:scale-95 transition-transform"
              >
                +5
              </button>
            </div>
          </div>

          {/* Descuento por Hielo */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Snowflake size={16} className="text-blue-500" />
                Descuento por Hielo Escama
              </label>
              <span className="text-xs font-bold text-blue-700">
                {porcentajeHielo}% (-{metrologia.descuentoHieloKg.toFixed(2)} kg)
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {OPCIONES_HIELO.map((pct) => {
                const seleccionado = porcentajeHielo === pct;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onPorcentajeHieloChange(pct)}
                    className={`min-h-[48px] h-12 rounded-xl font-black text-sm transition-all active:scale-95 flex items-center justify-center ${
                      seleccionado
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 border-2 border-blue-700'
                        : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>
          </div>

          {/* Precio Acordado por Kg */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <DollarSign size={18} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block">Precio Acordado / Kg</label>
                <span className="text-xs text-slate-500 font-semibold">Valor pactado con proveedor</span>
              </div>
            </div>

            <div className="flex items-center gap-1 max-w-[180px]">
              <span className="font-bold text-slate-600">$</span>
              <input
                type="number"
                min="0"
                step="100"
                value={precioKgAcordado === 0 ? '' : precioKgAcordado}
                onChange={(e) => onPrecioKgChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
                placeholder="0"
                className="w-full min-h-[48px] h-12 px-3 border-2 border-slate-300 rounded-xl font-extrabold text-base text-right text-slate-900 focus:border-emerald-500 focus:ring-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Resumen Metrológico Consolidado */}
      <div className="mt-4 p-4 rounded-xl bg-slate-100/80 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Peso Bruto</span>
          <span className="text-sm font-extrabold text-slate-800">{pesoBrutoKg.toFixed(2)} kg</span>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Tara Canastillas</span>
          <span className="text-sm font-extrabold text-rose-700">-{metrologia.pesoTaraTotalKg.toFixed(2)} kg</span>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Descuento Hielo ({porcentajeHielo}%)</span>
          <span className="text-sm font-extrabold text-blue-700">-{metrologia.descuentoHieloKg.toFixed(2)} kg</span>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Subtotal Partida COP</span>
          <span className="text-sm font-black text-emerald-700">${subtotalCOP.toLocaleString('es-CO')}</span>
        </div>
      </div>
    </div>
  );
};
