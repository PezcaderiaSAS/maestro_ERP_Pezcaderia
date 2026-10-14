import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { UserCheck, KeyRound, ArrowLeft, Delete, X, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import {
  type ActiveUserSession,
  DEFAULT_INITIAL_SELLERS,
  mapRolAccesoToUserRole,
  getInitials,
} from '../../utils/roleMapper';

interface UserSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const UserSwitchModal: React.FC<UserSwitchModalProps> = ({
  isOpen,
  onClose,
  title = '¿Quién está operando?',
  subtitle = 'Selecciona tu usuario e ingresa tu PIN de 4 dígitos',
}) => {
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const empleados = useEmployeeStore((s) => s.empleados);

  const [selectedSeller, setSelectedSeller] = useState<ActiveUserSession | null>(null);
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Construir la lista de usuarios elegibles
  const availableUsers: ActiveUserSession[] = useMemo(() => {
    if (empleados && empleados.length > 0) {
      return empleados.map((emp) => ({
        empleadoId: emp.id,
        nombre: emp.nombre,
        identificacion: emp.identificacion,
        cargo: emp.cargo || 'Colaborador',
        rol: mapRolAccesoToUserRole(emp.rolAcceso),
        avatarColor: emp.avatarColor || 'from-indigo-600 to-blue-700',
        turnoIniciadoAt: new Date().toISOString(),
      }));
    }
    return DEFAULT_INITIAL_SELLERS;
  }, [empleados]);

  // Resetear estados al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setSelectedSeller(null);
      setPin('');
      setIsError(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  // Manejo de la digitación de PIN
  const handleKeypadPress = useCallback(
    (char: string) => {
      if (pin.length >= 4) return;
      const nextPin = pin + char;
      setPin(nextPin);

      if (nextPin.length === 4 && selectedSeller) {
        // Encontrar si el empleado tiene un PIN configurado
        const empOriginal = empleados.find((e) => e.id === selectedSeller.empleadoId);
        const correctPin = empOriginal?.pinAcceso || '1234';

        if (nextPin === correctPin) {
          // Éxito: fijar usuario activo
          setCurrentUser(selectedSeller);
          onClose();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `Sesión iniciada: ${selectedSeller.nombre}`,
            text: `Rol: ${selectedSeller.rol.toUpperCase()}`,
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
          });
        } else {
          // Error: feedback táctil y sacudida
          setIsError(true);
          setErrorMessage('PIN incorrecto. Intenta de nuevo.');
          setTimeout(() => {
            setPin('');
            setIsError(false);
          }, 450);
        }
      }
    },
    [pin, selectedSeller, empleados, setCurrentUser, onClose]
  );

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  }, []);

  // Soporte para teclado físico (0-9, Backspace, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (!selectedSeller) return;

      if (/^[0-9]$/.test(e.key)) {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedSeller, handleKeypadPress, handleBackspace, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl shadow-cyan-950/50 text-slate-100 relative">
        {/* Botón cerrar / cancelar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Cerrar"
        >
          <X size={20} />
        </button>

        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 mb-3 shadow-inner">
            {selectedSeller ? <KeyRound size={24} /> : <UserCheck size={24} />}
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            {!selectedSeller ? title : `PIN para ${selectedSeller.nombre}`}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {!selectedSeller ? subtitle : 'Ingresa tu PIN de 4 dígitos para identificarte'}
          </p>
        </div>

        {!selectedSeller ? (
          /* ========================================================= */
          /* PASO 1: Selección Táctil de Colaboradores (Regla 12 Años)   */
          /* ========================================================= */
          <div>
            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {availableUsers.map((user) => {
                const initials = getInitials(user.nombre);
                return (
                  <button
                    key={user.empleadoId}
                    onClick={() => {
                      setSelectedSeller(user);
                      setPin('');
                      setErrorMessage('');
                    }}
                    className="bg-slate-900/90 border border-slate-800 hover:border-cyan-400 hover:bg-slate-800/80 transition-all duration-150 rounded-2xl p-4 flex flex-col items-center cursor-pointer active:scale-95 group shadow-sm text-left w-full"
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${
                        user.avatarColor || 'from-indigo-600 to-blue-700'
                      } text-white font-black text-lg flex items-center justify-center shadow-md mb-2 group-hover:scale-105 transition-transform`}
                    >
                      {initials}
                    </div>
                    <span className="text-slate-100 font-bold text-sm text-center truncate w-full">
                      {user.nombre}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold uppercase mt-0.5">
                      {user.rol}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-400">
                ¿PIN predeterminado? Usa <strong className="text-cyan-400 font-mono">1234</strong>
              </span>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* PASO 2: Keypad Táctil y 4 Bullets Enmascarados (Min 56px) */
          /* ========================================================= */
          <div className="flex flex-col items-center">
            {/* 4 Bullets Enmascarados de PIN con animación Shake */}
            <div
              className={`flex justify-center gap-4 my-3 transition-transform ${
                isError ? 'animate-shake' : ''
              }`}
            >
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < pin.length;
                return (
                  <div
                    key={index}
                    className={`w-5 h-5 rounded-full transition-all duration-150 ${
                      isFilled
                        ? isError
                          ? 'bg-rose-500 border-2 border-rose-400 shadow-lg shadow-rose-500/50 scale-110'
                          : 'bg-cyan-400 border-2 border-cyan-300 shadow-md shadow-cyan-400/50 scale-110'
                        : 'border-2 border-slate-700 bg-slate-800/50'
                    }`}
                  />
                );
              })}
            </div>

            {/* Mensaje de error visual */}
            {errorMessage ? (
              <div
                role="alert"
                data-testid="pin-error-message"
                className="text-xs text-rose-400 flex items-center gap-1.5 font-semibold mb-2"
              >
                <ShieldAlert size={14} />
                <span>{errorMessage}</span>
              </div>
            ) : (
              <div className="h-5 mb-2" />
            )}

            {/* Teclado Táctil 0-9 (Área mínima 56px para dedos en pantalla) */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs select-none">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeypadPress(digit)}
                  className="h-14 w-full bg-slate-800/80 border border-slate-700/80 text-white font-bold text-2xl rounded-2xl hover:bg-slate-700 active:bg-cyan-600 active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              <button
                onClick={() => {
                  setSelectedSeller(null);
                  setPin('');
                  setErrorMessage('');
                }}
                className="h-14 w-full bg-slate-800/40 border border-slate-800 text-slate-300 text-xs font-bold rounded-2xl hover:bg-slate-800 active:bg-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Volver</span>
              </button>

              <button
                onClick={() => handleKeypadPress('0')}
                className="h-14 w-full bg-slate-800/80 border border-slate-700/80 text-white font-bold text-2xl rounded-2xl hover:bg-slate-700 active:bg-cyan-600 active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer"
              >
                0
              </button>

              <button
                onClick={handleBackspace}
                className="h-14 w-full bg-slate-800/40 border border-slate-800 text-slate-300 text-sm font-bold rounded-2xl hover:bg-slate-800 active:bg-rose-950 active:text-rose-400 transition-colors flex items-center justify-center cursor-pointer"
                title="Borrar dígito"
              >
                <Delete size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
