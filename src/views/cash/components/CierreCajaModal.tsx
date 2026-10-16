/**
 * @deprecated Este componente ha sido unificado con ArqueoCajaModal.tsx bajo la especificación SPEC-018.
 * Re-exporta ArqueoCajaModal para mantener compatibilidad y evitar duplicidad de código.
 */
import React from 'react';
import ArqueoCajaModal from './ArqueoCajaModal';
import { TurnoCaja } from '../../../types/cash.types';

interface CierreCajaModalProps {
  turnoActivo: TurnoCaja;
  usuarioId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CierreCajaModal(props: CierreCajaModalProps) {
  return <ArqueoCajaModal {...props} />;
}
