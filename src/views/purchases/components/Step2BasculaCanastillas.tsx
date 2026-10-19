import React, { useState } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Fish,
  AlertCircle,
  Package,
  Layers
} from 'lucide-react';
import { useInventoryStore, Producto } from '../../../store/useInventoryStore';
import { MuelleWeightScaleWidget } from './MuelleWeightScaleWidget';
import { PartidaRecepcionInput } from '../../../services/dockPurchasesReceivingService';
import { calcularPesajeMuelleNeto } from '../../../../packages/validation-schemas/src/dockPurchasesReceiving.schema';

interface Props {
  partidas: PartidaRecepcionInput[];
  onAddPartida: (partida: PartidaRecepcionInput) => void;
  onRemovePartida: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

// Fallback de productos marinos típicos si la base de datos está vacía
const PRODUCTOS_MUELLE_DEFAULT: Partial<Producto>[] = [
  { id: 'prod-corvina', nombre: 'Corvina de Muelle Fresca', sku: 'PES-CORV-01', precio_compra: 18000 },
  { id: 'prod-pargo', nombre: 'Pargo Rojo Entero', sku: 'PES-PARG-01', precio_compra: 26000 },
  { id: 'prod-robalo', nombre: 'Robalo Marítimo', sku: 'PES-ROB-01', precio_compra: 24000 },
  { id: 'prod-sierra', nombre: 'Sierra Entera en Posta', sku: 'PES-SIER-01', precio_compra: 16000 },
  { id: 'prod-camaron', nombre: 'Camarón Tití Fresco', sku: 'MAR-CAM-01', precio_compra: 32000 },
  { id: 'prod-tilapia', nombre: 'Tilapia Roja Entera', sku: 'PES-TIL-01', precio_compra: 12000 }
];

export const Step2BasculaCanastillas: React.FC<Props> = ({
  partidas,
  onAddPartida,
  onRemovePartida,
  onNext,
  onPrev
}) => {
  const productsFromStore = useInventoryStore((s) => s.products);
  const productosDisponibles =
    productsFromStore && productsFromStore.length > 0
      ? productsFromStore
      : (PRODUCTOS_MUELLE_DEFAULT as Producto[]);

  // Estado del formulario de pesada actual
  const [selectedProductId, setSelectedProductId] = useState<string>(
    productosDisponibles[0]?.id || ''
  );
  const [pesoBrutoKg, setPesoBrutoKg] = useState<number>(0);
  const [cantidadCanastillas, setCantidadCanastillas] = useState<number>(1);
  const [porcentajeHielo, setPorcentajeHielo] = useState<number>(5);
  const [precioKgAcordado, setPrecioKgAcordado] = useState<number>(
    productosDisponibles[0]?.precio_compra || 18000
  );
  const [calibre, setCalibre] = useState<string>('Entero');
  const [loteOrigenManual, setLoteOrigenManual] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manejar cambio de producto seleccionado
  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const prod = productosDisponibles.find((p) => p.id === id);
    if (prod && prod.precio_compra) {
      setPrecioKgAcordado(prod.precio_compra);
    }
  };

  // Agregar pesada a la lista
  const handleAddPesada = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = productosDisponibles.find((p) => p.id === selectedProductId);
    if (!prod) {
      setErrorMessage('Seleccione un producto para la pesada.');
      return;
    }

    if (pesoBrutoKg <= 0) {
      setErrorMessage('El peso bruto sobre la báscula debe ser mayor a 0 kg.');
      return;
    }

    const taraTotal = cantidadCanastillas * 2.0;
    if (pesoBrutoKg <= taraTotal) {
      setErrorMessage(`El peso bruto (${pesoBrutoKg} kg) debe superar la tara de las canastillas (${taraTotal} kg).`);
      return;
    }

    if (precioKgAcordado <= 0) {
      setErrorMessage('El precio acordado por kilo debe ser mayor a 0.');
      return;
    }

    const nuevaPartida: PartidaRecepcionInput = {
      productoId: prod.id,
      productoNombre: prod.nombre,
      sku: prod.sku,
      cantidadCanastillas,
      pesoBrutoKg,
      taraCanastillaKg: 2.0,
      porcentajeHielo,
      precioKgAcordado,
      calibre: calibre.trim() || undefined,
      loteOrigenManual: loteOrigenManual.trim() || undefined
    };

    onAddPartida(nuevaPartida);
    setErrorMessage(null);

    // Resetear peso para la siguiente tanda de canastillas manteniendo producto y precio
    setPesoBrutoKg(0);
    setCantidadCanastillas(1);
  };

  // Totales consolidados de las partidas actuales
  const totales = partidas.reduce(
    (acc, item) => {
      const calc = calcularPesajeMuelleNeto(
        item.pesoBrutoKg,
        item.cantidadCanastillas,
        item.porcentajeHielo,
        item.taraCanastillaKg ?? 2.0
      );
      const subtotal = Math.round(calc.pesoNetoRealKg * item.precioKgAcordado);
      return {
        canastillas: acc.canastillas + item.cantidadCanastillas,
        kilosNetos: Number((acc.kilosNetos + calc.pesoNetoRealKg).toFixed(2)),
        totalCOP: acc.totalCOP + subtotal
      };
    },
    { canastillas: 0, kilosNetos: 0, totalCOP: 0 }
  );

  return (
    <div data-testid="step2-bascula-canastillas" className="space-y-6 max-w-4xl mx-auto">
      {/* 1. SELECCIÓN DE PRODUCTO Y PRECIO */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Fish size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Selección de Especie / Producto</h3>
            <p className="text-sm text-slate-500">Elija la especie marina que está ingresando a pesaje</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Producto o Especie Marina <span className="text-rose-500">*</span>
            </label>
            <select
              data-testid="select-product"
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full min-h-[48px] px-4 text-base font-semibold rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
            >
              {productosDisponibles.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.nombre} {prod.sku ? `(${prod.sku})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Calibre / Presentación
            </label>
            <input
              type="text"
              data-testid="input-calibre"
              placeholder="Ej: Entero, Mediano, Grande"
              value={calibre}
              onChange={(e) => setCalibre(e.target.value)}
              className="w-full min-h-[48px] px-4 text-base font-medium rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. WIDGET DE BÁSCULA, METROLOGÍA Y DEDUCCIÓN DE HIELO */}
      <MuelleWeightScaleWidget
        pesoBrutoKg={pesoBrutoKg}
        onPesoBrutoChange={(peso) => {
          setPesoBrutoKg(peso);
          setErrorMessage(null);
        }}
        cantidadCanastillas={cantidadCanastillas}
        onCantidadCanastillasChange={setCantidadCanastillas}
        porcentajeHielo={porcentajeHielo}
        onPorcentajeHieloChange={setPorcentajeHielo}
        precioKgAcordado={precioKgAcordado}
        onPrecioKgChange={setPrecioKgAcordado}
        taraCanastillaKg={2.0}
      />

      {/* Opción de Lote Origen de Fábrica */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
          Lote Origen Proveedor / Fábrica (Opcional)
        </label>
        <input
          type="text"
          data-testid="input-lote-origen-manual"
          placeholder="Ej: EMB-2026-X99 (opcional para trazabilidad externa)"
          value={loteOrigenManual}
          onChange={(e) => setLoteOrigenManual(e.target.value)}
          className="w-full min-h-[44px] px-4 font-mono text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-blue-500 outline-hidden"
        />
      </div>

      {/* Error de validación al agregar partida */}
      {errorMessage && (
        <div
          data-testid="step2-error-message"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2"
        >
          <AlertCircle size={20} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Botón táctil para agregar pesada */}
      <button
        type="button"
        data-testid="btn-add-weighing-item"
        onClick={handleAddPesada}
        className="w-full min-h-[52px] px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        <Plus size={22} />
        <span>+ REGISTRAR PESADA DE ESTE PRODUCTO</span>
      </button>

      {/* 3. TABLA DE PARTIDAS PESADAS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Partidas Pesadas en Muelle</h3>
              <p className="text-sm text-slate-500">
                {partidas.length === 0
                  ? 'Aún no hay pesadas registradas para esta descarga'
                  : `${partidas.length} pesada(s) registradas`}
              </p>
            </div>
          </div>
        </div>

        {partidas.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Package size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-sm">Registre al menos una pesada de producto para continuar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="table-partidas-muelle">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                  <th className="py-3 px-3">Especie</th>
                  <th className="py-3 px-3 text-center">Canastillas</th>
                  <th className="py-3 px-3 text-right">Peso Bruto</th>
                  <th className="py-3 px-3 text-right">Hielo</th>
                  <th className="py-3 px-3 text-right">Neto Real</th>
                  <th className="py-3 px-3 text-right">Precio/Kg</th>
                  <th className="py-3 px-3 text-right">Subtotal COP</th>
                  <th className="py-3 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
                {partidas.map((item, idx) => {
                  const calc = calcularPesajeMuelleNeto(
                    item.pesoBrutoKg,
                    item.cantidadCanastillas,
                    item.porcentajeHielo,
                    item.taraCanastillaKg ?? 2.0
                  );
                  const subtotal = Math.round(calc.pesoNetoRealKg * item.precioKgAcordado);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {item.productoNombre}
                        {item.calibre && <span className="text-xs text-slate-500 block">({item.calibre})</span>}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{item.cantidadCanastillas} ud</td>
                      <td className="py-3 px-3 text-right font-mono">{item.pesoBrutoKg.toFixed(2)} kg</td>
                      <td className="py-3 px-3 text-right font-mono text-blue-600">-{item.porcentajeHielo}%</td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-800 bg-emerald-50/40 rounded-lg">
                        {calc.pesoNetoRealKg.toFixed(2)} kg
                      </td>
                      <td className="py-3 px-3 text-right font-mono">${item.precioKgAcordado.toLocaleString('es-CO')}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ${subtotal.toLocaleString('es-CO')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          data-testid={`btn-remove-partida-${idx}`}
                          onClick={() => onRemovePartida(idx)}
                          className="min-h-[48px] min-w-[48px] inline-flex items-center justify-center p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors active:scale-95"
                          title="Eliminar pesada"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 font-extrabold bg-slate-100 text-slate-900">
                  <td className="py-3 px-3 text-sm uppercase">TOTALES:</td>
                  <td className="py-3 px-3 text-center font-mono text-sm">{totales.canastillas} ud</td>
                  <td className="py-3 px-3 text-right font-mono text-sm" colSpan={2}>-</td>
                  <td className="py-3 px-3 text-right font-mono text-base text-emerald-900">
                    {totales.kilosNetos.toFixed(2)} kg
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm">-</td>
                  <td className="py-3 px-3 text-right font-mono text-lg text-blue-950">
                    ${totales.totalCOP.toLocaleString('es-CO')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* 4. NAVEGACIÓN (VOLVER Y CONTINUAR >= 56px) */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
        <button
          type="button"
          data-testid="btn-step2-prev"
          onClick={onPrev}
          className="w-full sm:w-auto min-h-[48px] px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-base transition-colors flex items-center justify-center gap-2 active:scale-95"
        >
          <ArrowLeft size={20} />
          <span>Volver a Furgón</span>
        </button>

        <button
          type="button"
          data-testid="btn-step2-next"
          disabled={partidas.length === 0}
          onClick={onNext}
          className={`w-full sm:flex-1 h-14 min-h-[56px] px-8 text-white font-extrabold text-lg rounded-2xl shadow-md transition-all flex items-center justify-center gap-3 ${
            partidas.length === 0
              ? 'bg-slate-300 cursor-not-allowed opacity-70'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:shadow-lg active:scale-[0.99]'
          }`}
        >
          <span>IR A LIQUIDACIÓN Y ENTRADA A FRÍO</span>
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
};
