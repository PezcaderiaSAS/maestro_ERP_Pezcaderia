/**
 * Componente Táctil de Firma Digital con Canvas HTML5 Nativo
 * Especificación: SPEC-023 (TASK-023-03)
 * Estándar: Pointer Events API (W3C/MDN), touch-action: none, Retina DPR Scaling
 * Gobernanza UI: Regla del Niño de 12 Años, botones >= 48px y >= 56px, WCAG AA+
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PenTool, RotateCcw, CheckCircle2, X, AlertCircle } from 'lucide-react';

export interface DriverSignaturePadCanvasProps {
  titulo?: string;
  subtitulo?: string;
  onFirmaConfirmada: (base64Png: string) => void;
  onCancelar?: () => void;
  valorInicial?: string;
  altura?: number; // default 220px
}

export const DriverSignaturePadCanvas: React.FC<DriverSignaturePadCanvasProps> = ({
  titulo = 'Firma Digital del Receptor',
  subtitulo = 'Trace la firma con el dedo o lápiz dentro del recuadro',
  onFirmaConfirmada,
  onCancelar,
  valorInicial,
  altura = 220
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Inicializa el lienzo con escalado para pantallas Retina / High-DPI
   */
  const inicializarCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    // Dimensionar lienzo interno multiplicado por DPR
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(altura * dpr);

    // Dimensionar estilo CSS
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${altura}px`;

    // Escalar contexto para trazo nítido sin pixelado
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = '#0f172a'; // slate-900 de alto contraste
  }, [altura]);

  useEffect(() => {
    inicializarCanvas();

    const handleResize = () => {
      // Si ya hay firma, redimensionar suavemente
      inicializarCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [inicializarCanvas]);

  /**
   * Obtiene las coordenadas X, Y relativas al lienzo
   */
  const obtenerCoordenadas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  /**
   * Inicia el trazo con captura de puntero W3C
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignorar si el navegador ya maneja el puntero
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = obtenerCoordenadas(e);
    ctx.beginPath();
    ctx.moveTo(x, y);

    setIsDrawing(true);
    setHasSignature(true);
    setValidationError(null);
  };

  /**
   * Dibuja el trazo mientras el puntero se mueve
   */
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = obtenerCoordenadas(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  /**
   * Finaliza el trazo con liberación segura de captura
   */
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar si el puntero ya fue liberado
    }
  };

  /**
   * Limpia el lienzo por completo
   */
  const handleLimpiarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasSignature(false);
    setValidationError(null);
  };

  /**
   * Valida y exporta la firma a imagen PNG Base64
   */
  const handleConfirmar = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      setValidationError('Debe capturar la firma del cliente antes de continuar');
      return;
    }

    try {
      const base64Png = canvas.toDataURL('image/png');
      onFirmaConfirmada(base64Png);
    } catch (err: any) {
      setValidationError('Error al generar imagen de firma digital');
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-4 sm:p-5 flex flex-col gap-4">
      {/* Cabecera del Pad */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">{titulo}</h3>
            <p className="text-xs text-slate-500 font-medium">{subtitulo}</p>
          </div>
        </div>

        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
            title="Cerrar modal de firma"
            aria-label="Cerrar firma"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Área del Lienzo Canvas con touch-action: none */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 overflow-hidden select-none"
        style={{ height: `${altura}px` }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="Lienzo de firma digital táctil"
        />

        {/* Marca de agua / Guía visual si no ha firmado */}
        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-1.5 text-slate-400">
            <PenTool className="w-7 h-7 opacity-40" />
            <span className="text-xs font-semibold tracking-wide uppercase">
              Firme aquí con el dedo o stylus
            </span>
            <div className="w-3/4 border-b border-dashed border-slate-300 mt-4" />
          </div>
        )}

        {/* Indicador de firma activa en vivo */}
        {hasSignature && (
          <div className="absolute top-2 right-2 pointer-events-none bg-emerald-100/90 border border-emerald-300 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Trazo Capturado
          </div>
        )}
      </div>

      {/* Alerta de validación si no firmó */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Botones Táctiles ("Regla del Niño de 12 Años" - Secundario >= 48px, Primario >= 56px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Botón Limpiar (Secundario >= 48px) */}
        <button
          type="button"
          onClick={handleLimpiarFirma}
          disabled={!hasSignature}
          className={`min-h-[48px] px-4 py-3 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            hasSignature
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 active:scale-95'
              : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Borrar y Repetir Firma</span>
        </button>

        {/* Botón Confirmar (Principal >= 56px) */}
        <button
          type="button"
          onClick={handleConfirmar}
          disabled={!hasSignature}
          className={`h-14 min-h-[56px] px-6 py-3.5 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all ${
            hasSignature
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-98 cursor-pointer'
              : 'bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>CONFIRMAR FIRMA →</span>
        </button>
      </div>
    </div>
  );
};
