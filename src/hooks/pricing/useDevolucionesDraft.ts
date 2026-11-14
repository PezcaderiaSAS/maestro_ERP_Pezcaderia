import { useState, useCallback } from 'react';
import { generateId } from '../../lib/utils';
import { useReturnStore } from '../../store/useReturnStore.ts';
import { useClientStore } from '../../store/useClientStore.ts';
import { useDriverStore } from '../../store/useDriverStore.ts';
import { useOrderStore } from '../../store/useOrderStore.ts';
import type { DevolucionDraftItem } from './pricing.types';

export interface UseDevolucionesDraftOptions {
  userRole: string;
  publishEvent: (type: any, role: string, description: string) => void;
  clientes?: any[];
  conductores?: any[];
  quotations?: any[];
}

export function useDevolucionesDraft({
  userRole,
  publishEvent,
  clientes: clientesProp,
  conductores: conductoresProp,
  quotations: quotationsProp,
}: UseDevolucionesDraftOptions) {
  const storeClientes = useClientStore((s) => s.clientes);
  const storeConductores = useDriverStore((s) => s.conductores);
  const storeQuotations = useOrderStore((s) => s.quotations);
  const { devoluciones, setDevoluciones } = useReturnStore();

  const clientesList = clientesProp ?? storeClientes;
  const conductoresList = conductoresProp ?? storeConductores;
  const quotationsList = quotationsProp ?? storeQuotations;

  // Estados de solicitud de devolución
  const [devClienteId, setDevClienteId] = useState('');
  const [devConductorId, setDevConductorId] = useState('');
  const [devFechaProg, setDevFechaProg] = useState(() => new Date().toISOString().split('T')[0]);
  const [devPedidoId, setDevPedidoId] = useState('');
  const [devItems, setDevItems] = useState<DevolucionDraftItem[]>([]);
  const [devSelProductSku, setDevSelProductSku] = useState('');
  const [devSelProductCant, setDevSelProductCant] = useState<number | string>(1);
  const [devSelProductMotivo, setDevSelProductMotivo] = useState('MAL_ESTADO');

  const handleSaveDevolucion = useCallback(
    (callbacks: { onSuccess: () => void; onWarn: (title: string, text: string) => void }) => {
      if (!devClienteId || !devConductorId || devItems.length === 0) {
        callbacks.onWarn(
          'Campos incompletos',
          'Por favor complete todos los campos requeridos (Cliente, Conductor y al menos un producto).'
        );
        return;
      }

      const cli = clientesList.find((c: any) => c.id === devClienteId);
      const cond = conductoresList.find((c: any) => c.id === devConductorId);
      const newDev: any = {
        id: generateId('dev'),
        pedidoId: devPedidoId || '',
        pedidoNo: (quotationsList.find((q: any) => q.id === devPedidoId) as any)?.no || 'S/O',
        clienteId: devClienteId,
        clienteNombre: cli?.nombre || '',
        conductorId: devConductorId,
        conductorNombre: cond?.nombre || '',
        estado: 'PROGRAMADA',
        fechaProgramacion: devFechaProg,
        items: devItems.map((i) => ({
          sku: i.sku,
          nombre: i.nombre,
          cantidadSolicitada: i.cantidad,
          precioUnitarioVenta: i.precio,
          motivo: i.motivo,
        })),
      };

      setDevoluciones((prev: any[]) => [newDev, ...prev]);
      publishEvent(
        'QUOTE_STATUS_CHANGED',
        userRole,
        `Solicitud de devolución programada para cliente ${newDev.clienteNombre} asignada a conductor ${newDev.conductorNombre}`
      );

      // Reset
      setDevClienteId('');
      setDevConductorId('');
      setDevFechaProg(new Date().toISOString().split('T')[0]);
      setDevPedidoId('');
      setDevItems([]);
      setDevSelProductSku('');
      setDevSelProductCant(1);
      setDevSelProductMotivo('MAL_ESTADO');

      callbacks.onSuccess();
    },
    [
      devClienteId,
      devConductorId,
      devItems,
      clientesList,
      conductoresList,
      devPedidoId,
      quotationsList,
      devFechaProg,
      setDevoluciones,
      publishEvent,
      userRole,
    ]
  );

  return {
    devClienteId,
    setDevClienteId,
    devConductorId,
    setDevConductorId,
    devFechaProg,
    setDevFechaProg,
    devPedidoId,
    setDevPedidoId,
    devItems,
    setDevItems,
    devSelProductSku,
    setDevSelProductSku,
    devSelProductCant,
    setDevSelProductCant,
    devSelProductMotivo,
    setDevSelProductMotivo,
    devoluciones,
    setDevoluciones,
    handleSaveDevolucion,
  };
}

