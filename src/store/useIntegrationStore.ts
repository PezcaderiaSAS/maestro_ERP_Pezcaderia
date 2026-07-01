import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import * as localDb from '../services/localDb';

let dataService: IDataService = new LocalDataService();
export const setIntegrationDataService = (ds: IDataService) => { dataService = ds; };

export interface LogIntegracion {
  id: string;
  id_pedido_externo: string;
  canal: string;
  fecha_recepcion: string;
  payload_json: string;
  estado: 'PENDIENTE' | 'PROCESADO' | 'ERROR' | 'REVISION_MANUAL';
  id_factura_pos?: string;
  mensaje_error?: string;
}

const DEFAULT_PARAMETROS: Record<string, any> = {
  metodosPagoExternos: {
    rappi: 'RAP-001',
    shopify: 'SHO-001',
    b2b: 'B2B-001'
  },
  cajaAisladaMetodos: ['RAP-001', 'SHO-001', 'B2B-001']
};

interface IntegrationState {
  logIntegracion: LogIntegracion[];
  parametros: Record<string, any>;
  loadLogIntegracion: () => void;
  setLogIntegracion: (logOrUpdater: any) => void;
  addLogIntegracion: (log: LogIntegracion) => void;
  loadParametros: () => void;
  setParametros: (paramsOrUpdater: any) => void;
}

export const useIntegrationStore = create<IntegrationState>()((set) => ({
  logIntegracion: [],
  parametros: {},

  loadLogIntegracion: async () => {
    try {
      const loaded = await dataService.getAll<LogIntegracion>('logIntegracion');
      set({ logIntegracion: loaded });
    } catch {
      set({ logIntegracion: [] });
    }
  },

  setLogIntegracion: (logOrUpdater: any) => set((state) => {
    const newLog = typeof logOrUpdater === 'function' ? logOrUpdater(state.logIntegracion) : logOrUpdater;
    return { logIntegracion: newLog };
  }),

  addLogIntegracion: (log) => {
    dataService.create('logIntegracion', log);
    set((state) => ({ logIntegracion: [...state.logIntegracion, log] }));
  },

  loadParametros: () => {
    const loaded = localDb.load<Record<string, any> | null>('parametros', null);
    set({ parametros: loaded ?? DEFAULT_PARAMETROS });
  },

  setParametros: (paramsOrUpdater: any) => set((state) => {
    const newParams = typeof paramsOrUpdater === 'function' ? paramsOrUpdater(state.parametros) : paramsOrUpdater;
    localDb.save('parametros', newParams);
    return { parametros: newParams };
  }),
}));
