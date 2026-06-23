// src/services/warehouseService.ts
import { load, save } from './localDb';

export interface Bodega {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  activa: boolean;
  esencial: boolean;
}

export interface ServiceResponse<T> {
  data: T;
  error: string | null;
}

const BODEGAS_DEFECTO: Bodega[] = [
  {
    id: 'b-1',
    nombre: 'Bodega Principal',
    codigo: 'BPRIN',
    descripcion: 'Bodega principal de almacenamiento y venta',
    activa: true,
    esencial: true
  },
  {
    id: 'b-2',
    nombre: 'Bodega de Tránsito',
    codigo: 'BTRAN',
    descripcion: 'Bodega para mercancía en traslado',
    activa: true,
    esencial: false
  },
  {
    id: 'b-3',
    nombre: 'Bodega Averías',
    codigo: 'BAVER',
    descripcion: 'Bodega para productos devueltos o dañados',
    activa: true,
    esencial: true
  }
];

export function obtenerBodegas(): ServiceResponse<Bodega[]> {
  try {
    const data = load<Bodega[]>('bodegas', []);
    if (data.length === 0) {
      save<Bodega[]>('bodegas', BODEGAS_DEFECTO);
      return { data: BODEGAS_DEFECTO, error: null };
    }
    return { data, error: null };
  } catch (e) {
    return { data: BODEGAS_DEFECTO, error: 'Error al obtener las bodegas desde la base de datos local' };
  }
}

export function guardarBodega(bodega: Bodega): ServiceResponse<Bodega[]> {
  try {
    const { data: bodegas, error } = obtenerBodegas();
    if (error) {
      return { data: [], error };
    }

    if (!bodega.nombre.trim()) {
      return { data: bodegas, error: 'El nombre de la bodega es obligatorio.' };
    }

    if (!bodega.codigo.trim()) {
      return { data: bodegas, error: 'El código de la bodega es obligatorio.' };
    }

    const index = bodegas.findIndex(b => b.id === bodega.id);

    if (index !== -1) {
      const bodegaExistente = bodegas[index];
      
      // Validaciones para bodegas esenciales (RN-59)
      if (bodegaExistente.esencial) {
        if (bodegaExistente.nombre !== bodega.nombre) {
          return { data: bodegas, error: `La bodega '${bodegaExistente.nombre}' es esencial y no se puede renombrar.` };
        }
        if (!bodega.activa) {
          return { data: bodegas, error: `La bodega '${bodegaExistente.nombre}' es esencial y no se puede desactivar.` };
        }
      }

      // Validar código duplicado
      const codigoDuplicado = bodegas.some(b => b.id !== bodega.id && b.codigo.toUpperCase() === bodega.codigo.toUpperCase());
      if (codigoDuplicado) {
        return { data: bodegas, error: `Ya existe otra bodega con el código '${bodega.codigo}'.` };
      }

      bodegas[index] = { ...bodega, esencial: bodegaExistente.esencial };
    } else {
      // Validar código duplicado
      const codigoDuplicado = bodegas.some(b => b.codigo.toUpperCase() === bodega.codigo.toUpperCase());
      if (codigoDuplicado) {
        return { data: bodegas, error: `Ya existe otra bodega con el código '${bodega.codigo}'.` };
      }

      bodegas.push({
        ...bodega,
        esencial: false
      });
    }

    save<Bodega[]>('bodegas', bodegas);
    return { data: bodegas, error: null };
  } catch (e) {
    return { data: [], error: 'Error al guardar la bodega.' };
  }
}

export function eliminarBodega(id: string, catalogoProductos: { sku: string; stock: Record<string, number> }[]): ServiceResponse<Bodega[]> {
  try {
    const { data: bodegas, error } = obtenerBodegas();
    if (error) {
      return { data: [], error };
    }

    const bodega = bodegas.find(b => b.id === id);
    if (!bodega) {
      return { data: bodegas, error: 'La bodega seleccionada no existe.' };
    }

    // Validaciones para bodegas esenciales (RN-59)
    if (bodega.esencial) {
      return { data: bodegas, error: `La bodega '${bodega.nombre}' es esencial para el sistema y no puede ser eliminada.` };
    }

    // Validar si tiene stock activo (RN-59)
    const tieneStock = catalogoProductos.some(producto => {
      const stockBodega = producto.stock?.[bodega.nombre] || 0;
      return stockBodega > 0;
    });

    if (tieneStock) {
      return { data: bodegas, error: `No se puede eliminar la bodega '${bodega.nombre}' porque contiene productos con stock activo.` };
    }

    const nuevasBodegas = bodegas.filter(b => b.id !== id);
    save<Bodega[]>('bodegas', nuevasBodegas);
    return { data: nuevasBodegas, error: null };
  } catch (e) {
    return { data: [], error: 'Error al eliminar la bodega.' };
  }
}

export function desactivarBodega(id: string, catalogoProductos: { sku: string; stock: Record<string, number> }[]): ServiceResponse<Bodega[]> {
  try {
    const { data: bodegas, error } = obtenerBodegas();
    if (error) {
      return { data: [], error };
    }

    const index = bodegas.findIndex(b => b.id === id);
    if (index === -1) {
      return { data: bodegas, error: 'La bodega seleccionada no existe.' };
    }

    const bodega = bodegas[index];

    // Validaciones para bodegas esenciales (RN-59)
    if (bodega.esencial) {
      return { data: bodegas, error: `La bodega '${bodega.nombre}' es esencial para el sistema y no puede ser desactivada.` };
    }

    // Validar si tiene stock activo (RN-59)
    const tieneStock = catalogoProductos.some(producto => {
      const stockBodega = producto.stock?.[bodega.nombre] || 0;
      return stockBodega > 0;
    });

    if (tieneStock) {
      return { data: bodegas, error: `No se puede desactivar la bodega '${bodega.nombre}' porque contiene productos con stock activo.` };
    }

    bodegas[index].activa = false;
    save<Bodega[]>('bodegas', bodegas);
    return { data: bodegas, error: null };
  } catch (e) {
    return { data: [], error: 'Error al desactivar la bodega.' };
  }
}
