import React, { useState, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Warehouse,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { MacWindowControls } from '../../components/layout/components/MacWindowControls';
import {
  bulkHardwareImportService,
  type ParsedHardwareItem,
} from '../../services/bulkHardwareImportService';
import { useWarehouseStore } from '../../store/useWarehouseStore';

export interface BulkHardwareImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (count: number) => void;
}

const SAMPLE_CSV = `SKU,NOMBRE,CATEGORIA,MARCA,PASILLO,COSTO,PRECIO_VENTA,STOCK
TORN-DRY-01,Tornillo Drywall 6x1 (Caja x 100),TORNILLERIA,Mamut,Pasillo 1 - Gaveta 4,4500,8000,50
MART-EST-16,Martillo de Uña 16oz Mango Fibra,HERRAMIENTAS,Stanley,Pasillo 4 - Estante A,22000,34000,12
CINT-TEF-01,Cinta Teflón 1/2 x 10m Fontanería,PLOMERIA,Grival,Pasillo 3 - Bandeja 2,1200,2500,100
PINT-VIN-BL,Pintura Vinilo Tipo 1 Blanco Galón,PINTURAS,Pintuco,Pasillo 2 - Estiba 1,38000,56000,20
DISC-COR-45,Disco de Corte Metal 4 1/2 Delgado,ACCESORIOS,DeWalt,Pasillo 1 - Vitrina 3,2800,5000,80`;

/**
 * BulkHardwareImportModal - Modal de Carga Masiva de Ítems e Inventario para Ferretería (SPEC-032).
 * Estética Dark Glassmorphism V8, validación en tiempo real y carga atómica al catálogo de inventario.
 */
export const BulkHardwareImportModal: React.FC<BulkHardwareImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const bodegas = useWarehouseStore((s) => s.bodegas);
  const [inputText, setInputText] = useState<string>('');
  const [selectedBodega, setSelectedBodega] = useState<string>('bodega-pos');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Parsear y validar en vivo según el texto ingresado
  const { valid, invalid } = useMemo(() => {
    if (!inputText.trim()) {
      return { valid: [] as ParsedHardwareItem[], invalid: [] as ParsedHardwareItem[] };
    }
    const raw = bulkHardwareImportService.parseCsv(inputText);
    return bulkHardwareImportService.validateAndTransform(raw);
  }, [inputText]);

  if (!isOpen) return null;

  const handleCargarEjemplo = () => {
    setInputText(SAMPLE_CSV);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        setInputText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleCommit = () => {
    if (valid.length === 0) return;

    setIsProcessing(true);
    try {
      const result = bulkHardwareImportService.commitImport(valid, selectedBodega);
      setIsProcessing(false);
      onClose();

      Swal.fire({
        icon: 'success',
        title: 'Carga Masiva Exitosa',
        text: `Se importaron ${result.importedCount} productos de ferretería al catálogo y bodega activa.`,
        confirmButtonColor: '#06B6D4',
        background: '#0F172A',
        color: '#F8FAFC',
      });

      if (onSuccess) {
        onSuccess(result.importedCount);
      }
    } catch (err: any) {
      setIsProcessing(false);
      Swal.fire({
        icon: 'error',
        title: 'Error de Importación',
        text: err?.message || 'Ocurrió un error inesperado al guardar los productos.',
        confirmButtonColor: '#EF4444',
        background: '#0F172A',
        color: '#F8FAFC',
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-import-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900/95 border border-white/10 text-white shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Barra superior con controles macOS */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <MacWindowControls onToggleOpen={onClose} onCloseSession={onClose} />
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 ml-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              Carga Masiva de Ferretería & Catálogo
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Fila de controles: Archivo, Plantilla y Bodega */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Opción 1: Archivo CSV */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  <UploadCloud className="w-4 h-4 text-cyan-400" />
                  Subir Archivo (.csv / .txt)
                </span>
                <p className="text-[11px] text-slate-400">
                  Selecciona archivo plano delimitado por coma o punto y coma.
                </p>
              </div>
              <label className="mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95">
                <span>Elegir Archivo</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Opción 2: Plantilla de Ejemplo */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Plantilla FerreOn
                </span>
                <p className="text-[11px] text-slate-400">
                  Carga datos de demostración con tornillos, martillos y pinturas.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCargarEjemplo}
                className="mt-3 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-bold transition-all cursor-pointer"
              >
                Insertar Plantilla Demo
              </button>
            </div>

            {/* Opción 3: Bodega de Asignación de Stock */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  <Warehouse className="w-4 h-4 text-emerald-400" />
                  Bodega Destino
                </span>
                <p className="text-[11px] text-slate-400">
                  Bodega donde se registrará el stock inicial importado.
                </p>
              </div>
              <select
                value={selectedBodega}
                onChange={(e) => setSelectedBodega(e.target.value)}
                className="mt-3 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="bodega-pos">Punto de Venta Mostrador (POS)</option>
                {bodegas.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Área de Texto / Editor CSV */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="csv-textarea"
                className="text-xs font-bold text-slate-300 flex items-center gap-2"
              >
                <span>Pega o edita el contenido CSV directamente:</span>
              </label>
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Limpiar Texto
                </button>
              )}
            </div>
            <textarea
              id="csv-textarea"
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="SKU,NOMBRE,CATEGORIA,MARCA,PASILLO,COSTO,PRECIO_VENTA,STOCK..."
              className="w-full font-mono text-xs p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-y"
            />
          </div>

          {/* Resumen de Validación y Semáforo */}
          {inputText.trim() && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Vista Previa de Validación
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 font-semibold text-emerald-400">
                    <CheckCircle2 size={15} />
                    {valid.length} Válidas
                  </span>
                  {invalid.length > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-rose-400">
                      <AlertTriangle size={15} />
                      {invalid.length} con Errores
                    </span>
                  )}
                </div>
              </div>

              {/* Tabla de Vista Previa */}
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-950/40">
                <div className="max-h-60 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300 border-collapse">
                    <thead className="bg-slate-900/80 sticky top-0 border-b border-white/10 text-[10px] font-mono text-slate-400 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Nombre</th>
                        <th className="py-2.5 px-3">Categoría</th>
                        <th className="py-2.5 px-3">Marca / Pasillo</th>
                        <th className="py-2.5 px-3 text-right">Costo</th>
                        <th className="py-2.5 px-3 text-right">Precio POS</th>
                        <th className="py-2.5 px-3 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {valid.map((item) => (
                        <tr key={item.sku} className="hover:bg-white/5">
                          <td className="py-2 px-3 text-emerald-400 font-bold">✓ Válido</td>
                          <td className="py-2 px-3 font-mono font-bold text-white">{item.sku}</td>
                          <td className="py-2 px-3">{item.nombre}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                              {item.categoria}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px]">
                            {item.marca} • {item.pasillo}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-400">
                            ${item.precio_compra.toLocaleString('es-CO')}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                            ${item.precio_venta_pos.toLocaleString('es-CO')}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-white">
                            {item.stockInicial}
                          </td>
                        </tr>
                      ))}
                      {invalid.map((item, idx) => (
                        <tr key={`inv-${idx}`} className="bg-rose-950/20 text-rose-300">
                          <td className="py-2 px-3 text-rose-400 font-bold">⚠ Error</td>
                          <td className="py-2 px-3 font-mono">{item.sku || 'N/A'}</td>
                          <td className="py-2 px-3">{item.nombre}</td>
                          <td colSpan={5} className="py-2 px-3 text-rose-300 text-[11px]">
                            {item.errors.join(' | ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barra Inferior con Botones de Acción */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={valid.length === 0 || isProcessing}
            onClick={handleCommit}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg ${
              valid.length > 0 && !isProcessing
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-95 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importando Ítems...</span>
              </>
            ) : (
              <>
                <span>Importar {valid.length} Ítems al Catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
