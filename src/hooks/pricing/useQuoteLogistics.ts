import { useState } from 'react';
import type { LogisticsTipo, LogisticsJornada } from './pricing.types';

export interface UseQuoteLogisticsReturn {
  logisticaTipo: LogisticsTipo;
  setLogisticaTipo: React.Dispatch<React.SetStateAction<LogisticsTipo>>;
  logisticaDireccion: string;
  setLogisticaDireccion: React.Dispatch<React.SetStateAction<string>>;
  logisticaFecha: string;
  setLogisticaFecha: React.Dispatch<React.SetStateAction<string>>;
  logisticaJornada: LogisticsJornada;
  setLogisticaJornada: React.Dispatch<React.SetStateAction<LogisticsJornada>>;
  logisticaConductorId: string;
  setLogisticaConductorId: React.Dispatch<React.SetStateAction<string>>;
  observacionesPedido: string;
  setObservacionesPedido: React.Dispatch<React.SetStateAction<string>>;
  resetLogistics: () => void;
}

/**
 * Hook modular para la gestión de datos logísticos, tipo de entrega (EN_RUTA, INMEDIATA, RECOGEN),
 * fecha, jornada de entrega y asignación de conductor.
 */
export function useQuoteLogistics(): UseQuoteLogisticsReturn {
  const [logisticaTipo, setLogisticaTipo] = useState<LogisticsTipo>('EN_RUTA');
  const [logisticaDireccion, setLogisticaDireccion] = useState('');
  const [logisticaFecha, setLogisticaFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [logisticaJornada, setLogisticaJornada] = useState<LogisticsJornada>('MANANA');
  const [logisticaConductorId, setLogisticaConductorId] = useState('');
  const [observacionesPedido, setObservacionesPedido] = useState('');

  const resetLogistics = () => {
    setLogisticaTipo('EN_RUTA');
    setLogisticaDireccion('');
    setLogisticaFecha(new Date().toISOString().split('T')[0]);
    setLogisticaJornada('MANANA');
    setLogisticaConductorId('');
    setObservacionesPedido('');
  };

  return {
    logisticaTipo,
    setLogisticaTipo,
    logisticaDireccion,
    setLogisticaDireccion,
    logisticaFecha,
    setLogisticaFecha,
    logisticaJornada,
    setLogisticaJornada,
    logisticaConductorId,
    setLogisticaConductorId,
    observacionesPedido,
    setObservacionesPedido,
    resetLogistics,
  };
}

