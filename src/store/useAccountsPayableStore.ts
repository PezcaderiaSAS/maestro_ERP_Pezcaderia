import { create } from 'zustand';
import { accountsPayableService } from '../services/accountsPayableService';
import type {
  CuentaPorPagar,
  RegistrarCuentaPorPagarInput,
  RegistrarAbonoInput,
  EstadoCuentaPorPagar
} from '../types/accountsPayable.types';

interface AccountsPayableState {
  cuentas: CuentaPorPagar[];
  isLoading: boolean;
  filtroProveedorId: string | null;
  filtroEstado: EstadoCuentaPorPagar | 'TODAS';
  totalSaldoPendiente: number;
  totalCuentasVencidas: number;

  // Acciones
  recargarCuentas: () => void;
  crearCuentaPorPagar: (input: RegistrarCuentaPorPagarInput) => CuentaPorPagar;
  abonarCuenta: (input: RegistrarAbonoInput) => CuentaPorPagar;
  setFiltroProveedorId: (proveedorId: string | null) => void;
  setFiltroEstado: (estado: EstadoCuentaPorPagar | 'TODAS') => void;
}

function calcularTotales(cuentas: CuentaPorPagar[]) {
  let totalSaldoPendiente = 0;
  let totalCuentasVencidas = 0;

  for (const c of cuentas) {
    if (c.saldoPendiente > 0 && c.estado !== 'ANULADO') {
      totalSaldoPendiente += c.saldoPendiente;
      if (c.estado === 'VENCIDO') {
        totalCuentasVencidas++;
      }
    }
  }

  return { totalSaldoPendiente, totalCuentasVencidas };
}

export const useAccountsPayableStore = create<AccountsPayableState>((set, get) => {
  const initialCuentas = accountsPayableService.obtenerTodas();
  const initialTotales = calcularTotales(initialCuentas);

  return {
    cuentas: initialCuentas,
    isLoading: false,
    filtroProveedorId: null,
    filtroEstado: 'TODAS',
    totalSaldoPendiente: initialTotales.totalSaldoPendiente,
    totalCuentasVencidas: initialTotales.totalCuentasVencidas,

    recargarCuentas: () => {
      accountsPayableService.actualizarEstadosVencimiento();
      const cuentas = accountsPayableService.obtenerTodas();
      const totales = calcularTotales(cuentas);
      set({ cuentas, ...totales });
    },

    crearCuentaPorPagar: (input: RegistrarCuentaPorPagarInput) => {
      const nueva = accountsPayableService.registrarCuentaPorPagar(input);
      get().recargarCuentas();
      return nueva;
    },

    abonarCuenta: (input: RegistrarAbonoInput) => {
      const actualizada = accountsPayableService.registrarAbono(input);
      get().recargarCuentas();
      return actualizada;
    },

    setFiltroProveedorId: (proveedorId: string | null) => {
      set({ filtroProveedorId: proveedorId });
    },

    setFiltroEstado: (estado: EstadoCuentaPorPagar | 'TODAS') => {
      set({ filtroEstado: estado });
    }
  };
});
