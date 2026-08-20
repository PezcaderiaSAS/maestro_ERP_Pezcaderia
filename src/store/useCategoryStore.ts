import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setCategoryDataService = (ds: IDataService) => { dataService = ds; };

export interface CategoriaConfig {
  id: string;
  nombre: string;
  parentId: string | null;
  // Campos legacy opcionales para compatibilidad
  tipo?: string;
  linea?: string;
  clase?: string;
}

const DEFAULT_CATEGORIAS: CategoriaConfig[] = [
  { id: 'cat-root-1', nombre: 'Producto', parentId: null },
  { id: 'cat-linea-1', nombre: 'Pescados', parentId: 'cat-root-1' },
  { id: 'cat-1', nombre: 'Filetes', parentId: 'cat-linea-1' },
  { id: 'cat-linea-2', nombre: 'Mariscos', parentId: 'cat-root-1' },
  { id: 'cat-2', nombre: 'Camarones', parentId: 'cat-linea-2' },
  { id: 'cat-root-2', nombre: 'Materia Prima', parentId: null },
  { id: 'cat-linea-3', nombre: 'Pescados Enteros', parentId: 'cat-root-2' },
  { id: 'cat-3', nombre: 'Corvina', parentId: 'cat-linea-3' },
];

export const getCategoryPath = (id: string, categorias: CategoriaConfig[]): string => {
  const cat = categorias.find(c => c.id === id);
  if (!cat) return '';
  
  // Legacy fallback
  if (!cat.nombre && cat.tipo) {
    return `${cat.tipo.toUpperCase()} > ${cat.linea?.toUpperCase()} > ${cat.clase?.toUpperCase()}`;
  }

  if (!cat.parentId) return cat.nombre;
  
  const parentPath = getCategoryPath(cat.parentId, categorias);
  return parentPath ? `${parentPath} > ${cat.nombre}` : cat.nombre;
};

interface CategoryState {
  categorias: CategoriaConfig[];
  loadCategorias: () => void;
  setCategorias: (categoriasOrUpdater: any) => void;
  addCategoria: (categoria: CategoriaConfig) => void;
  updateCategoria: (id: string, data: Partial<CategoriaConfig>) => void;
  deleteCategoria: (id: string) => void;
}

export const useCategoryStore = create<CategoryState>()(
  zustandConsoleMiddleware((set) => ({
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
  })));
