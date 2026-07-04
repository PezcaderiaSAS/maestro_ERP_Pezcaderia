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
      className={reading ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'text-slate-600 hover:bg-slate-50'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        padding: '4px 8px',
        height: '36px',
        border: '1px solid #CBD5E1',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
      title="Obtener peso desde balanza USB/Serial"
    >
      <RefreshCw size={12} className={reading ? 'animate-spin' : ''} />
      <span>{reading ? 'Pesando...' : 'Balanza'}</span>
    </Button>
  );
};
