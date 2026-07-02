import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setDynamicFieldDataService = (ds: IDataService) => { dataService = ds; };

export interface DynamicField {
  key: string;
  label: string;
  tipo: 'text' | 'number';
  defaultValue: string;
}

const DEFAULT_DYNAMIC_FIELDS: DynamicField[] = [
  { key: 'categoria_descriptiva', label: 'Categoría Descriptiva (Grupo)', tipo: 'text', defaultValue: 'General' },
];

interface DynamicFieldState {
  dynamicFields: DynamicField[];
  loadDynamicFields: () => void;
  setDynamicFields: (fieldsOrUpdater: any) => void;
}

export const useDynamicFieldStore = create<DynamicFieldState>()(
  zustandConsoleMiddleware((set) => ({
  dynamicFields: [],

  loadDynamicFields: async () => {
    try {
      const loaded = await dataService.getAll<DynamicField>('dynamicFields');
      set({ dynamicFields: loaded.length ? loaded : DEFAULT_DYNAMIC_FIELDS });
    } catch {
      set({ dynamicFields: DEFAULT_DYNAMIC_FIELDS });
    }
  },

  setDynamicFields: (fieldsOrUpdater: any) => set((state) => {
    const newFields = typeof fieldsOrUpdater === 'function' ? fieldsOrUpdater(state.dynamicFields) : fieldsOrUpdater;
    return { dynamicFields: newFields };
  }),
  })));
