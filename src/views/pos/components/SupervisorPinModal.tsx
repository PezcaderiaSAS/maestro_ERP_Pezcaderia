import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, KeyRound, Delete, X, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { MacWindowControls } from '../../../components/layout/components/MacWindowControls';
import { useEmployeeStore, type Empleado } from '../../../store/useEmployeeStore';

export interface SupervisorAuthResult {
  supervisorId: string;
  supervisorNombre: string;
  supervisorCargo: string;
  accionAutorizada: string;
  motivo?: string;
  timestamp: string;
}

export interface SupervisorPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  accion: string;
  descripcion?: string;
  onAuthorized: (result: SupervisorAuthResult) => void;
}

/**
 * SupervisorPinModal - Modal Táctil de Autorización con PIN de Supervisor (SPEC-032 / TASK-032-02).
 * Protege operaciones críticas (descuentos mayores, anulaciones, desbloqueos) en terminales de mostrador.
 */
export const SupervisorPinModal: React.FC<SupervisorPinModalProps> = ({
  isOpen,
  onClose,
  accion,
  descripcion = 'Esta operación requiere autorización de un supervisor o administrador.',
  onAuthorized,
}) => {
  const empleados = useEmployeeStore((s) => s.empleados) as Empleado[];
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Resetear estados al abrir
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsShaking(false);
    }
  }, [isOpen]);

  // Validar PIN ingresado
  const procesarPin = useCallback(
    (pinIngresado: string) => {
      // 1. Buscar empleado por PIN
      const empEncontrado = (empleados || []).find((e) => {
        const pinConfigurado = e.pinAcceso || '1234';
        return pinConfigurado === pinIngresado;
      });

      if (!empEncontrado) {
        setErrorMsg('PIN incorrecto o sin privilegios de supervisor');
        setIsShaking(true);
        setTimeout(() => {
          setPin('');
          setIsShaking(false);
        }, 600);
        return;
      }

      // 2. Verificar privilegios de supervisor / administrador
      const rolUpper = (empEncontrado.rolAcceso || '').toUpperCase();
      const cargoLower = (empEncontrado.cargo || '').toLowerCase();
      const esSupervisor =
        rolUpper === 'ADMINISTRADOR' ||
        rolUpper === 'GERENTE' ||
        cargoLower.includes('supervisor') ||
        cargoLower.includes('administrador') ||
        cargoLower.includes('gerente') ||
        cargoLower.includes('jefe');

      if (!esSupervisor) {
        setErrorMsg('Usuario sin privilegios de supervisor para esta acción');
        setIsShaking(true);
        setTimeout(() => {
          setPin('');
          setIsShaking(false);
        }, 600);
        return;
      }

      // 3. Éxito: invocar callback de autorización
      const authResult: SupervisorAuthResult = {
        supervisorId: empEncontrado.id,
        supervisorNombre: empEncontrado.nombre,
        supervisorCargo: empEncontrado.cargo || 'Supervisor',
        accionAutorizada: accion,
        timestamp: new Date().toISOString(),
      };

      onAuthorized(authResult);
      onClose();

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Operación Autorizada',
        text: `Autorizado por: ${empEncontrado.nombre}`,
        showConfirmButton: false,
        timer: 2000,
      });
    },
    [empleados, accion, onAuthorized, onClose]
  );

  // Manejador de teclas numéricas
  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length >= 4) return;
      setErrorMsg('');
      const nuevoPin = pin + digit;
      setPin(nuevoPin);
      if (nuevoPin.length === 4) {
        procesarPin(nuevoPin);
      }
    },
    [pin, procesarPin]
  );

  const handleBackspace = useCallback(() => {
    setErrorMsg('');
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setErrorMsg('');
    setPin('');
  }, []);

  // Soporte para teclado físico
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigit, handleBackspace, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="supervisor-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        className={`relative w-full max-w-sm rounded-2xl bg-slate-900/95 border border-amber-500/30 text-white shadow-2xl p-5 sm:p-6 transition-transform ${
          isShaking ? 'animate-bounce' : ''
        }`}
        style={{
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(245, 158, 11, 0.2)',
        }}
      >
        {/* Barra superior con controles macOS */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MacWindowControls onToggleOpen={onClose} onCloseSession={onClose} />
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 ml-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Seguridad POS
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Cancelar autorización"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cabecera y Motivo */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 mb-2">
            <KeyRound className="w-6 h-6 text-amber-400" />
          </div>
          <h2 id="supervisor-modal-title" className="text-lg font-black text-white">
            Autorización de Supervisor
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-[280px] mx-auto leading-relaxed">
            {descripcion}
          </p>
        </div>

        {/* Indicadores visuales de PIN (4 círculos) */}
        <div className="flex items-center justify-center gap-3 mb-5">
          {[0, 1, 2, 3].map((idx) => {
            const hasDigit = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  hasDigit
                    ? 'bg-amber-400 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)] scale-110'
                    : 'border-slate-600 bg-slate-800/80'
                }`}
              />
            );
          })}
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div
            role="alert"
            className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-bold mb-4 animate-fade-in text-center"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Teclado Numérico Táctil (Touch Keypad) */}
        <div
          data-testid="supervisor-pin-keypad"
          className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[260px] mx-auto mb-4"
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              data-testid={`numpad-key-${digit}`}
              onClick={() => handleDigit(digit)}
              className="h-13 min-h-[52px] rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-white/5 hover:border-amber-500/30 text-white text-lg font-bold transition-all shadow-sm flex items-center justify-center cursor-pointer select-none"
            >
              {digit}
            </button>
          ))}
          {/* Tecla C (Limpiar) */}
          <button
            data-testid="numpad-key-clear"
            onClick={handleClear}
            className="h-13 min-h-[52px] rounded-xl bg-slate-800/50 hover:bg-rose-950/40 active:scale-95 border border-white/5 hover:border-rose-500/30 text-rose-400 text-sm font-bold transition-all flex items-center justify-center cursor-pointer select-none"
            title="Borrar todo"
          >
            C
          </button>
          {/* Tecla 0 */}
          <button
            data-testid="numpad-key-0"
            onClick={() => handleDigit('0')}
            className="h-13 min-h-[52px] rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-white/5 hover:border-amber-500/30 text-white text-lg font-bold transition-all shadow-sm flex items-center justify-center cursor-pointer select-none"
          >
            0
          </button>
          {/* Tecla Backspace */}
          <button
            data-testid="numpad-key-backspace"
            onClick={handleBackspace}
            className="h-13 min-h-[52px] rounded-xl bg-slate-800/50 hover:bg-slate-700 active:scale-95 border border-white/5 text-slate-300 text-sm font-bold transition-all flex items-center justify-center cursor-pointer select-none"
            title="Retroceso"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Botón Cancelar */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
