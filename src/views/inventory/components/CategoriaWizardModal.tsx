import React, { useState } from 'react';
import { Layers, X, Save } from 'lucide-react';
import { useCategoryStore, getCategoryPath } from '../../../store/useCategoryStore';
import Swal from 'sweetalert2';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (categoriaId: string, categoriaStr: string) => void;
}

export function CategoriaWizardModal({ isOpen, onClose, onCategoryCreated }: Props) {
  const [nombre, setNombre] = useState('');
  const [parentId, setParentId] = useState<string>('');
  
  const { categorias, addCategoria } = useCategoryStore();

  if (!isOpen) return null;

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Debes ingresar el nombre de la categoría.'
      });
      return;
    }

    const newId = `cat-${Date.now()}`;
    const newCat = {
      id: newId,
      nombre: nombre.trim(),
      parentId: parentId || null
    };

    addCategoria(newCat);
    
    // Obtenemos la ruta para devolverla
    // Usamos el arreglo modificado que incluye a newCat para calcular la ruta
    const categoriaStr = getCategoryPath(newId, [...categorias, newCat]);
    
    Swal.fire({
      icon: 'success',
      title: 'Categoría Creada',
      text: categoriaStr,
      timer: 1500,
      showConfirmButton: false
    });

    onCategoryCreated(newId, categoriaStr);
    
    // Reset state
    setNombre('');
    setParentId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="bg-emerald-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white m-0">Nueva Categoría</h3>
              <p className="text-xs text-emerald-200/80 m-0">Estructura jerárquica de inventario</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleFinish} className="p-6">
          <div className="mb-4">
            <label className="block text-xs font-black text-slate-700 uppercase mb-2">Nombre de la Categoría *</label>
            <input
              type="text"
              className="w-full h-11 px-3 border-2 border-emerald-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              placeholder="Ej. Filetes, Pescados, Conservas..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-black text-slate-700 uppercase mb-2">Categoría Padre</label>
            <p className="text-xs text-slate-500 mb-2">Selecciona "Ninguna" si es una categoría principal o raíz.</p>
            <select
              className="w-full h-11 px-3 border-2 border-emerald-200 bg-white rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">-- Ninguna (Categoría Principal) --</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {getCategoryPath(cat.id, categorias)}
                </option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nombre.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} /> Finalizar y Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
