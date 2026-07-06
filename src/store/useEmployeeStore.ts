import { create } from 'zustand';
import type { IDataService } from '../types/services.types';
import { LocalDataService } from '../services/LocalDataService';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';

let dataService: IDataService = new LocalDataService();
export const setEmployeeDataService = (ds: IDataService) => { dataService = ds; };

export interface Empleado {
  id: string;
  nombre: string;
  identificacion: string;
  rolAcceso: 'ADMINISTRADOR' | 'VENDEDOR' | 'BODEGUERO' | 'REPARTIDOR' | 'GERENTE';
  cargo: string;
  salarioBase: number;
  fechaIngreso: string;
  tipoContrato: 'INDEFINIDO' | 'FIJO' | 'PRESTACION_SERVICIOS' | 'APRENDIZAJE';
  estado: 'ACTIVO' | 'INACTIVO' | 'VACACIONES' | 'INCAPACIDAD';
  prestamosActivos: number;
  auxilioTransporte: number;
  telefono: string;
  email: string;
  riesgoARL: 'I' | 'II' | 'III' | 'IV' | 'V';
  aplicaExoneracion: boolean;
}

export interface NominaRegistro {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  fechaEmision: string;
  periodoInicio: string;
  periodoFin: string;
  diasTrabajados: number;
  tipoLiquidacion?: 'REGULAR' | 'VACACIONES' | 'LIQUIDACION_FINAL';
  salarioBaseProporcional: number;
  auxilioTransporte: number;
  horasExtrasDevengado: number;
  bonificaciones: number;
  viaticos: number;
  totalDevengado: number;
  saludDeduccion: number;
  pensionDeduccion: number;
  prestamosDeduccion: number;
  otrasDeducciones: number;
  totalDeducido: number;
  netoAPagar: number;
  estadoPago: 'PENDIENTE' | 'PAGADO';
  gastoIdGenerado?: string;
  baseCotizacionIBC: number;
  provisionCesantias: number;
  provisionInteresesCesantias: number;
  provisionPrima: number;
  provisionVacaciones: number;
  aportePensionEmpresa: number;
  aporteSaludEmpresa: number;
  aporteARL: number;
  aporteCCF: number;
  aporteSENAICBF: number;
  costoTotalEmpresa: number;
}

interface EmployeeState {
  empleados: Empleado[];
  nominas: NominaRegistro[];
  loadEmpleados: () => void;
  setEmpleados: (empleadosOrUpdater: any) => void;
  addEmpleado: (empleado: Empleado) => void;
  updateEmpleado: (id: string, data: Partial<Empleado>) => void;
  loadNominas: () => void;
  setNominas: (nominasOrUpdater: any) => void;
  addNomina: (nomina: NominaRegistro) => void;
  updateNomina: (id: string, data: Partial<NominaRegistro>) => void;
}

export const useEmployeeStore = create<EmployeeState>()(
  zustandConsoleMiddleware((set) => ({
  empleados: [],
  nominas: [],

  loadEmpleados: async () => {
    try {
      const loaded = await dataService.getAll<Empleado>('empleados');
      set({ empleados: loaded });
    } catch {
      set({ empleados: [] });
    }
  },

  setEmpleados: (empleadosOrUpdater: any) => set((state) => {
    const newEmpleados = typeof empleadosOrUpdater === 'function' ? empleadosOrUpdater(state.empleados) : empleadosOrUpdater;
    return { empleados: newEmpleados };
  }),

  addEmpleado: (empleado) => {
    dataService.create('empleados', empleado);
    set((state) => ({ empleados: [...state.empleados, empleado] }));
  },

  updateEmpleado: (id, data) => {
    dataService.update('empleados', id, data);
    set((state) => ({
      empleados: state.empleados.map(e => e.id === id ? { ...e, ...data } : e),
    }));
  },

  loadNominas: async () => {
    try {
      const loaded = await dataService.getAll<NominaRegistro>('nominas');
      set({ nominas: loaded });
    } catch {
      set({ nominas: [] });
    }
  },

  setNominas: (nominasOrUpdater: any) => set((state) => {
    const newNominas = typeof nominasOrUpdater === 'function' ? nominasOrUpdater(state.nominas) : nominasOrUpdater;
    return { nominas: newNominas };
  }),

  addNomina: (nomina) => {
    dataService.create('nominas', nomina);
    set((state) => ({ nominas: [...state.nominas, nomina] }));
  },

  updateNomina: (id, data) => {
    dataService.update('nominas', id, data);
    set((state) => ({
      nominas: state.nominas.map(n => n.id === id ? { ...n, ...data } : n),
    }));
  },
  })));
