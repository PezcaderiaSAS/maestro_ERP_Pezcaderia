import React, { useState } from 'react';
import { Sparkles, Clipboard, Check, X, Building2, Phone, Mail, MapPin, Hash } from 'lucide-react';
import { parseContactText, ParsedClientData } from '../../utils/smartContactParser';
import { calcularDigitoVerificacion } from '../../utils/dianValidator';
import Swal from 'sweetalert2';

interface SmartAutofillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ParsedClientData) => void;
}

export const SmartAutofillModal: React.FC<SmartAutofillModalProps> = ({ isOpen, onClose, onApply }) => {
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedClientData | null>(null);

  if (!isOpen) return null;

  const handleProcessText = () => {
    if (!rawText.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Texto vacío',
        text: 'Por favor pega el texto de WhatsApp, firma de correo o RUT para procesar.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    const parsed = parseContactText(rawText);
    setParsedData(parsed);

    const extractedCount = Object.values(parsed).filter(Boolean).length;
    if (extractedCount === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin datos detectados',
        text: 'No se pudieron extraer campos automáticamente. Intenta pegar un texto con NIT, teléfono o dirección.',
        confirmButtonColor: 'var(--primary-color)'
      });
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRawText(text);
      const parsed = parseContactText(text);
      setParsedData(parsed);
    } catch {
      // Si el navegador bloquea permisos de portapapeles, solo focus en textarea
      Swal.fire({
        icon: 'info',
        title: 'Pegar manualmente',
        text: 'Usa Ctrl + V o presiona en el cuadro de texto para pegar.',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const handleConfirm = () => {
    if (!parsedData) return;
    onApply(parsedData);
    Swal.fire({
      icon: 'success',
      title: 'Datos autocompletados',
      text: 'Los campos del cliente han sido rellenados con éxito.',
      timer: 1500,
      showConfirmButton: false
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Autocompletar Inteligente de Cliente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pega mensajes de WhatsApp, firmas de email o datos de RUT (0ms de latencia, 100% privado)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Área de Entrada */}
        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Texto desestructurado
            </label>
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <Clipboard className="h-3.5 w-3.5" /> Pegar Portapapeles
            </button>
          </div>

          <textarea
            rows={4}
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              if (e.target.value.trim().length > 10) {
                setParsedData(parseContactText(e.target.value));
              }
            }}
            placeholder="Ejemplo: Buenas tardes, facturar a Inversiones La Bahía SAS, NIT 901.456.789-2, Calle 50 # 40-20 Medellín, Cel 3109876543, facturas@labahia.co"
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleProcessText}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
            >
              <Sparkles className="h-3.5 w-3.5" /> Analizar Texto
            </button>
          </div>
        </div>

        {/* Vista Previa de Datos Detectados */}
        {parsedData && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2 dark:border-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Datos Extraídos
              </span>
              {parsedData.identificacion && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  DIAN DV: {parsedData.dv ?? calcularDigitoVerificacion(parsedData.identificacion)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="font-semibold">Nombre:</span>
                <span className="truncate">{parsedData.nombre || <span className="text-slate-400 italic">No detectado</span>}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Hash className="h-4 w-4 text-purple-500 shrink-0" />
                <span className="font-semibold">Identificación:</span>
                <span>{parsedData.identificacion ? `${parsedData.identificacion}-${parsedData.dv}` : <span className="text-slate-400 italic">No detectado</span>}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="font-semibold">Teléfono:</span>
                <span>{parsedData.telefono || <span className="text-slate-400 italic">No detectado</span>}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-semibold">Email:</span>
                <span className="truncate">{parsedData.email || <span className="text-slate-400 italic">No detectado</span>}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 md:col-span-2">
                <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                <span className="font-semibold">Dirección:</span>
                <span className="truncate">{parsedData.direccion ? `${parsedData.direccion} (${parsedData.ciudad || 'Bogotá'})` : <span className="text-slate-400 italic">No detectado</span>}</span>
              </div>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!parsedData || Object.keys(parsedData).length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition"
          >
            <Check className="h-4 w-4" /> Aplicar al Formulario
          </button>
        </div>

      </div>
    </div>
  );
};
