import { IDomainEventPublisher } from '../../../contracts/b2b.contracts';
import { useEventStore, DomainEvent } from '../../../store/useEventStore';

/**
 * Adaptador de Infraestructura para Publicación de Eventos de Dominio respaldado por Zustand.
 * Cumple con el principio de Inversión de Dependencias (DIP).
 */
export class ZustandEventPublisherAdapter implements IDomainEventPublisher {
  publicarEvento(
    tipo: string,
    emisor: string,
    mensaje: string,
    metadata: Record<string, unknown>
  ): void {
    const { publishEvent } = useEventStore.getState();
    const eventTipo = (tipo as DomainEvent['tipo']) || 'QUOTE_STATUS_CHANGED';
    publishEvent(eventTipo, emisor, mensaje, metadata);
  }
}

export const zustandEventPublisher = new ZustandEventPublisherAdapter();
