// src/hooks/useMostradorKeyboard.ts
// Hook de Atajos de Teclado — Vista de Mostrador Tipo Tabla
// F2=Preventa | F6=Parkear | F8=Buscar | F10=Cobrar | Flechas=Navegar tabla | Escape=Limpiar

import { useEffect, useCallback } from 'react';
import { useMostradorStore } from '../store/useMostradorStore';

interface UseMostradorKeyboardOptions {
  /** Ref del input de búsqueda para darle foco con F8 */
  busquedaInputRef: React.RefObject<HTMLInputElement | null>;
  /** Callback al presionar F2 (emitir preventa) */
  onF2Preventa?: () => void;
  /** Callback al presionar F10 (abrir cobro) */
  onF10Cobrar?: () => void;
  /** Si el panel de cobro está abierto (deshabilitar atajos de tabla) */
  cobrandoAbierto?: boolean;
}

export function useMostradorKeyboard({
  busquedaInputRef,
  onF2Preventa,
  onF10Cobrar,
  cobrandoAbierto = false,
}: UseMostradorKeyboardOptions): void {
  const {
    lineas,
    filaSeleccionada,
    setFilaSeleccionada,
    removeLinea,
    emitirPreventa,
    setCobrandoAbierto,
    setQueryBusqueda,
    cantidadInput,
  } = useMostradorStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // No capturar si el foco está en un input/textarea que no sea el de búsqueda
      const target = e.target as HTMLElement;
      const isInSearchInput = target === busquedaInputRef.current;
      const isInFormInput =
        !isInSearchInput &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');

      // ── F8: Foco en búsqueda ──────────────────────────────
      if (e.key === 'F8') {
        e.preventDefault();
        busquedaInputRef.current?.focus();
        busquedaInputRef.current?.select();
        return;
      }

      // ── F2: Emitir preventa ───────────────────────────────
      if (e.key === 'F2' && !cobrandoAbierto) {
        e.preventDefault();
        if (onF2Preventa) {
          onF2Preventa();
        } else {
          emitirPreventa();
        }
        return;
      }

      // ── F6: Parkear / Suspender venta ─────────────────────
      if (e.key === 'F6' && !cobrandoAbierto) {
        e.preventDefault();
        emitirPreventa();
        return;
      }

      // ── F10: Abrir cobro ──────────────────────────────────
      if (e.key === 'F10') {
        e.preventDefault();
        if (onF10Cobrar) {
          onF10Cobrar();
        } else {
          setCobrandoAbierto(true);
        }
        return;
      }

      // ── Escape: Cerrar cobro o limpiar búsqueda ───────────
      if (e.key === 'Escape') {
        if (cobrandoAbierto) {
          setCobrandoAbierto(false);
          return;
        }
        if (isInSearchInput) {
          setQueryBusqueda('');
          return;
        }
      }

      // Los siguientes atajos no aplican dentro de inputs
      if (isInFormInput) return;

      // ── Flechas: Navegar filas de tabla ───────────────────
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const max = lineas.length - 1;
        setFilaSeleccionada(Math.min(filaSeleccionada + 1, max));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFilaSeleccionada(Math.max(filaSeleccionada - 1, 0));
        return;
      }

      // ── Suprimir/Delete: Eliminar línea seleccionada ───────
      if ((e.key === 'Delete' || e.key === 'Backspace') && filaSeleccionada >= 0) {
        const linea = lineas[filaSeleccionada];
        if (linea) {
          e.preventDefault();
          removeLinea(linea.id);
          setFilaSeleccionada(Math.max(filaSeleccionada - 1, 0));
        }
        return;
      }
    },
    [
      busquedaInputRef,
      cobrandoAbierto,
      lineas,
      filaSeleccionada,
      setFilaSeleccionada,
      removeLinea,
      emitirPreventa,
      setCobrandoAbierto,
      setQueryBusqueda,
      cantidadInput,
      onF2Preventa,
      onF10Cobrar,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

