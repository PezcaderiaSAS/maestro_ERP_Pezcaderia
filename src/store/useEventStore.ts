import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setEventDataService = (ds: IDataService) => { dataService = ds; };

export interface DomainEvent {
  id: string;
  timestamp: string;
  tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED' | 'QUOTE_UPDATED';
  actor: string;
  descripcion: string;
  metadata?: any;
}

export interface SyncJob {
  id: string;
  eventTipo: string;
  payload: any;
  estado: 'PENDIENTE' | 'SINCRONIZADO' | 'FALLO';
  intentos: number;
  timestamp: string;
}

interface EventState {
  events: DomainEvent[];
  syncQueue: SyncJob[];
  loadEvents: () => void;
  setEvents: (eventsOrUpdater: any) => void;
  loadSyncQueue: () => void;
  setSyncQueue: (syncOrUpdater: any) => void;
  publishEvent: (
    tipo: DomainEvent['tipo'],
    actor: string,
    descripcion: string,
    metadata?: any,
    enqueueSync?: boolean
  ) => void;
}

export const useEventStore = create<EventState>()(
  zustandConsoleMiddleware((set) => ({
  events: [],
  syncQueue: [],

  loadEvents: async () => {
    try {
      const loaded = await dataService.getAll<DomainEvent>('eventos');
      set({ events: loaded });
    } catch {
      set({ events: [] });
    }
  },

  setEvents: (eventsOrUpdater: any) => set((state) => {
    const newEvents = typeof eventsOrUpdater === 'function' ? eventsOrUpdater(state.events) : eventsOrUpdater;
    return { events: newEvents };
  }),

  loadSyncQueue: async () => {
    try {
      const loaded = await dataService.getAll<SyncJob>('syncQueue');
      set({ syncQueue: loaded });
    } catch {
      set({ syncQueue: [] });
    }
  },

  setSyncQueue: (syncOrUpdater: any) => set((state) => {
    const newSync = typeof syncOrUpdater === 'function' ? syncOrUpdater(state.syncQueue) : syncOrUpdater;
    return { syncQueue: newSync };
  }),

  publishEvent: (
    tipo,
    actor,
    descripcion,
    metadata,
    enqueueSync = true
  ) => {
    const newEvent: DomainEvent = {
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      tipo,
      actor,
      descripcion,
      metadata
    };
    set((state) => ({ events: [newEvent, ...state.events] }));

    if (enqueueSync) {
      const newSyncJob: SyncJob = {
        id: 'job-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        eventTipo: tipo,
        payload: { newEvent },
        estado: 'PENDIENTE',
        intentos: 0,
        timestamp: new Date().toISOString()
      };
      set((state) => ({ syncQueue: [newSyncJob, ...state.syncQueue] }));
    }
  },
  })));
