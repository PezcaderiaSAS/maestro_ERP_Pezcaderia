import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';

let dataService: IDataService = new LocalDataService();
export const setCategoryDataService = (ds: IDataService) => { dataService = ds; };

export interface CategoriaConfig {
  id: string;
  tipo: string;
  linea: string;
  clase: string;
}

const DEFAULT_CATEGORIAS: CategoriaConfig[] = [
  { id: 'cat-1', tipo: 'Producto', linea: 'Pescados', clase: 'Filetes' },
  { id: 'cat-2', tipo: 'Producto', linea: 'Mariscos', clase: 'Camarones' },
  { id: 'cat-3', tipo: 'Materia Prima', linea: 'Pescados Enteros', clase: 'Corvina' },
];

interface CategoryState {
  categorias: CategoriaConfig[];
  loadCategorias: () => void;
  setCategorias: (categoriasOrUpdater: any) => void;
  addCategoria: (categoria: CategoriaConfig) => void;
  updateCategoria: (id: string, data: Partial<CategoriaConfig>) => void;
  deleteCategoria: (id: string) => void;
}

export const useCategoryStore = create<CategoryState>()((set) => ({
  categorias: [],

  loadCategorias: async () => {
    try {
      const loaded = await dataService.getAll<CategoriaConfig>('categorias');
      set({ categorias: loaded.length ? loaded : DEFAULT_CATEGORIAS });
    } catch {
      set({ categorias: DEFAULT_CATEGORIAS });
    }
  },

  setCategorias: (categoriasOrUpdater: any) => set((state) => {
    const newCategorias = typeof categoriasOrUpdater === 'function' ? categoriasOrUpdater(state.categorias) : categoriasOrUpdater;
    return { categorias: newCategorias };
  }),

  addCategoria: (categoria) => {
    dataService.create('categorias', categoria);
    set((state) => ({ categorias: [...state.categorias, categoria] }));
  },

  updateCategoria: (id, data) => {
    dataService.update('categorias', id, data);
    set((state) => ({
      categorias: state.categorias.map(c => c.id === id ? { ...c, ...data } : c),
    }));
  },

  deleteCategoria: (id) => {
    dataService.hardDelete('categorias', id);
    set((state) => ({ categorias: state.categorias.filter(c => c.id !== id) }));
  },
}));
