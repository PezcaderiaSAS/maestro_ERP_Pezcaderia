import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useBalanza } from '../../../hooks/useBalanza';
import { Button } from '../../../components/ui/Button';
import Swal from 'sweetalert2';

interface BalanzaButtonProps {
  onWeightRead: (peso: number, esManual: boolean) => void;
  unidadMedida: 'KG' | 'UNIDAD';
}

export const BalanzaButton: React.FC<BalanzaButtonProps> = ({
  onWeightRead,
  unidadMedida,
}) => {
  const { reading, leerPeso, simularLeerPeso, isSupported } = useBalanza();

  if (unidadMedida !== 'KG') {
    return null; // Solo aplica a productos vendidos por Kilogramos
  }

  const handleRead = async () => {
    try {
      if (isSupported) {
        const peso = await leerPeso();
        onWeightRead(peso, false);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Peso obtenido: ${peso} kg`,
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        // Fallback inmediato a simulación en local
        const peso = await simularLeerPeso();
        onWeightRead(peso, false);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: `Simulación: ${peso} kg (Sin hardware)`,
          showConfirmButton: false,
          timer: 1800
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'warning',
        title: 'Balanza no detectada',
        text: 'No se pudo leer el peso automáticamente. Ingrese el peso manualmente en el carrito.',
        confirmButtonColor: 'var(--primary-color)',
        showDenyButton: true,
        denyButtonText: 'Simular Peso',
        denyButtonColor: '#0ea5e9',
      }).then(async (result) => {
        if (result.isDenied) {
          const peso = await simularLeerPeso();
          onWeightRead(peso, false);
        }
      });
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleRead}
      disabled={reading}
      className={`min-h-[44px] h-11 px-3 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
        reading
          ? 'bg-slate-700/60 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-white/10 dark:border-slate-700'
          : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
      }`}
      title="Obtener peso desde balanza USB/Serial (Atajo: F8)"
      aria-label="Obtener peso desde balanza USB o Serial (Atajo F8)"
    >
      <RefreshCw size={15} className={reading ? 'animate-spin' : ''} />
      <span className="font-bold">{reading ? 'Pesando...' : 'Balanza'}</span>
      <kbd className="px-1 py-0.5 text-[9px] font-mono bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 ml-0.5">F8</kbd>
    </Button>
  );
};
