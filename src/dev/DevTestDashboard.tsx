import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { applySeed as applySeedPOS } from './seeds/seedPOS';
import { applySeed as applySeedB2B } from './seeds/seedB2B';
import { applySeed as applySeedInventory } from './seeds/seedInventory';
import { applySeed as applySeedCash } from './seeds/seedCash';
import { X, TestTube, ShoppingCart, Truck, Factory, DollarSign, RefreshCw } from 'lucide-react';

export const DevTestDashboard: React.FC = () => {
  // Guard: Only render in development
  if (!import.meta.env.DEV) return null;

  const [isOpen, setIsOpen] = useState(false);

  const confirmAndSeed = (scenarioName: string, seedFunction: () => void) => {
    Swal.fire({
      title: `¿Cargar ${scenarioName}?`,
      text: "¡ATENCIÓN! Esto sobreescribirá la base de datos local con datos de prueba. Se perderán los datos actuales.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, sobreescribir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Clear only app keys or just apply on top (seeds overwrite specific keys, which is safer, but normally we might want to clear to avoid artifacts. The seed files do the explicit setting.)
        // According to the task: "⚠️ Todas las semillas usan las claves exactas de DB_KEYS de localDb.ts. NO usan localStorage.clear()."
        seedFunction();
        Swal.fire({
          title: 'Semilla Aplicada',
          text: `El escenario de prueba para ${scenarioName} está listo. Recargando...`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          window.location.reload();
        });
      }
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
        title="Panel de Pruebas Dev"
      >
        <TestTube size={24} />
      </button>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-indigo-700 font-bold">
          <TestTube size={20} />
          <span>DevTest Dashboard</span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3 overflow-y-auto">
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
          Semillas de Datos (E2E)
        </p>
        
        <button 
          onClick={() => confirmAndSeed('POS', applySeedPOS)}
          className="flex items-center gap-3 p-3 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors w-full text-left font-medium border border-blue-200"
        >
          <ShoppingCart size={18} />
          🛒 Escenario POS
        </button>
        
        <button 
          onClick={() => confirmAndSeed('B2B', applySeedB2B)}
          className="flex items-center gap-3 p-3 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors w-full text-left font-medium border border-emerald-200"
        >
          <Truck size={18} />
          📦 Escenario B2B
        </button>
        
        <button 
          onClick={() => confirmAndSeed('Inventario', applySeedInventory)}
          className="flex items-center gap-3 p-3 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors w-full text-left font-medium border border-amber-200"
        >
          <Factory size={18} />
          🏭 Escenario Inventario
        </button>
        
        <button 
          onClick={() => confirmAndSeed('Caja', applySeedCash)}
          className="flex items-center gap-3 p-3 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors w-full text-left font-medium border border-purple-200"
        >
          <DollarSign size={18} />
          💰 Escenario Caja
        </button>
      </div>
      
      <div className="mt-auto p-4 border-t border-gray-200 bg-gray-50">
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 p-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors w-full text-sm font-medium"
        >
          <RefreshCw size={16} />
          🔄 Recargar App
        </button>
      </div>
    </div>
  );
};
