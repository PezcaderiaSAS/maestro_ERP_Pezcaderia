// src/store/useResolucionStore.ts
import { create } from 'zustand';
import * as localDb from '../services/localDb';
import { zustandConsoleMiddleware } from '../lib/consoleMiddleware';
import type {
  ResolucionVenta,
  FacturaElectronicaRegistro,
  SiigoQueueItem,
  ResolucionDiagnostico,
  TipoResolucion,
} from '../types/resoluciones.types';

export const DEFAULT_RESOLUCIONES: ResolucionVenta[] = [
  {
    id: 'res-control-interno-default',
    nombre: 'Control Operativo Interno General',
    tipo: 'CONTROL_INTERNO',
    prefijo: 'VTA',
    rangoDesde: 1,
    rangoHasta: 999999,
    consecutivoActual: 100, // Base operativa interna
    esPredeterminada: true,
    activa: true,
    alertaUmbralConsecutivos: 100,
    alertaUmbralDias: 30,
  },
  {
    id: 'res-dian-siigo-default',
    nombre: 'Facturación Electrónica DIAN - Siigo Nube',
    tipo: 'FACTURA_ELECTRONICA_DIAN',
    prefijo: 'FEVP',
    numeroResolucion: '18764000001234',
    fechaExpedicion: '2026-01-01',
    fechaVencimiento: '2027-12-31',
    rangoDesde: 1,
    rangoHasta: 50000,
    consecutivoActual: 1540, // Empate exacto con lo que ya lleva en Siigo Nube
    siigoDocumentId: 2458,
    claveTecnica: 'fc8eac422eba16e122d5aa92a0660',
    esPredeterminada: true,
    activa: true,
    alertaUmbralConsecutivos: 100,
    alertaUmbralDias: 30,
  },
];

export function calcularDiagnosticoResolucion(res: ResolucionVenta): ResolucionDiagnostico {
  const consecutivosRestantes = Math.max(0, res.rangoHasta - res.consecutivoActual);
  const totalRango = Math.max(1, res.rangoHasta - res.rangoDesde + 1);
  const consumidos = Math.max(0, res.consecutivoActual - res.rangoDesde + 1);
  const porcentajeConsumido = Math.min(100, Math.round((consumidos / totalRango) * 100));

  let diasVigenciaRestantes: number | undefined = undefined;
  let isVencida = false;
  let isAlertaVigencia = false;

  if (res.fechaVencimiento) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(res.fechaVencimiento);
    venc.setHours(0, 0, 0, 0);
    const diffMs = venc.getTime() - hoy.getTime();
    diasVigenciaRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    isVencida = diasVigenciaRestantes <= 0;
    isAlertaVigencia = !isVencida && diasVigenciaRestantes <= res.alertaUmbralDias;
  }

  const isAgotada = res.consecutivoActual >= res.rangoHasta;
  const isAlertaConsecutivos = !isAgotada && consecutivosRestantes <= res.alertaUmbralConsecutivos;

  let estadoSemaforo: 'OPTIMO' | 'PRECAUCION' | 'CRITICO' = 'OPTIMO';
  if (isVencida || isAgotada || !res.activa) {
    estadoSemaforo = 'CRITICO';
  } else if (isAlertaConsecutivos || isAlertaVigencia) {
    estadoSemaforo = 'PRECAUCION';
  }

  return {
    consecutivosRestantes,
    porcentajeConsumido,
    diasVigenciaRestantes,
    isAlertaConsecutivos,
    isAlertaVigencia,
    isAgotada,
    isVencida,
    estadoSemaforo,
  };
}

interface ResolucionState {
  resoluciones: ResolucionVenta[];
  facturasElectronicas: FacturaElectronicaRegistro[];
  colaSiigo: SiigoQueueItem[];

  // CRUD y selección de resoluciones
  addResolucion: (res: Omit<ResolucionVenta, 'id'>) => ResolucionVenta;
  updateResolucion: (id: string, updates: Partial<ResolucionVenta>) => void;
  deleteResolucion: (id: string) => void;
  setPredeterminada: (id: string, tipo: TipoResolucion) => void;
  setUltimoConsecutivoSiigo: (id: string, nuevoNumero: number) => void;
  getResolucionById: (id: string) => ResolucionVenta | undefined;
  getResolucionPredeterminada: (tipo: TipoResolucion) => ResolucionVenta | undefined;

  // Facturas electrónicas registradas
  addFacturaElectronica: (factura: FacturaElectronicaRegistro) => void;
  updateFacturaElectronica: (id: string, updates: Partial<FacturaElectronicaRegistro>) => void;
  getFacturaElectronicaByVentaId: (ventaId: string) => FacturaElectronicaRegistro | undefined;

  // Cola Outbox Siigo
  enqueueSiigoItem: (
    item: Omit<SiigoQueueItem, 'id' | 'fechaCreacion' | 'intentos'>
  ) => SiigoQueueItem;
  updateSiigoQueueItem: (id: string, updates: Partial<SiigoQueueItem>) => void;
  retrySiigoQueueItem: (id: string) => void;

  // Reinicio / reset para pruebas
  resetStore: () => void;
}

const initialResoluciones = localDb.load<ResolucionVenta[]>(
  'resoluciones',
  DEFAULT_RESOLUCIONES
);

const initialFacturas = localDb.load<FacturaElectronicaRegistro[]>(
  'facturasElectronicas',
  []
);

const initialColaSiigo = localDb.load<SiigoQueueItem[]>(
  'siigoInvoicingQueue',
  []
);

export const useResolucionStore = create<ResolucionState>()(
  zustandConsoleMiddleware((set, get) => ({
    resoluciones: initialResoluciones,
    facturasElectronicas: initialFacturas,
    colaSiigo: initialColaSiigo,

    addResolucion: (resData) => {
      const nueva: ResolucionVenta = {
        ...resData,
        id: `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };

      set((state) => {
        let updated = [...state.resoluciones];
        if (nueva.esPredeterminada) {
          updated = updated.map((r) =>
            r.tipo === nueva.tipo ? { ...r, esPredeterminada: false } : r
          );
        }
        updated.push(nueva);
        localDb.save('resoluciones', updated);
        return { resoluciones: updated };
      });

      return nueva;
    },

    updateResolucion: (id, updates) => {
      set((state) => {
        let updated = state.resoluciones.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        );

        if (updates.esPredeterminada) {
          const target = updated.find((r) => r.id === id);
          if (target) {
            updated = updated.map((r) =>
              r.tipo === target.tipo && r.id !== id
                ? { ...r, esPredeterminada: false }
                : r
            );
          }
        }

        localDb.save('resoluciones', updated);
        return { resoluciones: updated };
      });
    },

    deleteResolucion: (id) => {
      set((state) => {
        const updated = state.resoluciones.filter((r) => r.id !== id);
        localDb.save('resoluciones', updated);
        return { resoluciones: updated };
      });
    },

    setPredeterminada: (id, tipo) => {
      set((state) => {
        const updated = state.resoluciones.map((r) => {
          if (r.tipo === tipo) {
            return { ...r, esPredeterminada: r.id === id };
          }
          return r;
        });
        localDb.save('resoluciones', updated);
        return { resoluciones: updated };
      });
    },

    setUltimoConsecutivoSiigo: (id, nuevoNumero) => {
      set((state) => {
        const updated = state.resoluciones.map((r) =>
          r.id === id ? { ...r, consecutivoActual: nuevoNumero } : r
        );
        localDb.save('resoluciones', updated);
        return { resoluciones: updated };
      });
    },

    getResolucionById: (id) => {
      return get().resoluciones.find((r) => r.id === id);
    },

    getResolucionPredeterminada: (tipo) => {
      const active = get().resoluciones.filter((r) => r.tipo === tipo && r.activa);
      return active.find((r) => r.esPredeterminada) || active[0];
    },

    addFacturaElectronica: (factura) => {
      set((state) => {
        const updated = [factura, ...state.facturasElectronicas];
        localDb.save('facturasElectronicas', updated);
        return { facturasElectronicas: updated };
      });
    },

    updateFacturaElectronica: (id, updates) => {
      set((state) => {
        const updated = state.facturasElectronicas.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        );
        localDb.save('facturasElectronicas', updated);
        return { facturasElectronicas: updated };
      });
    },

    getFacturaElectronicaByVentaId: (ventaId) => {
      return get().facturasElectronicas.find((f) => f.ventaId === ventaId);
    },

    enqueueSiigoItem: (itemData) => {
      const nuevoItem: SiigoQueueItem = {
        ...itemData,
        id: `queue-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fechaCreacion: new Date().toISOString(),
        intentos: 0,
      };

      set((state) => {
        const updated = [nuevoItem, ...state.colaSiigo];
        localDb.save('siigoInvoicingQueue', updated);
        return { colaSiigo: updated };
      });

      return nuevoItem;
    },

    updateSiigoQueueItem: (id, updates) => {
      set((state) => {
        const updated = state.colaSiigo.map((q) =>
          q.id === id ? { ...q, ...updates } : q
        );
        localDb.save('siigoInvoicingQueue', updated);
        return { colaSiigo: updated };
      });
    },

    retrySiigoQueueItem: (id) => {
      set((state) => {
        const updated = state.colaSiigo.map((q) =>
          q.id === id
            ? {
                ...q,
                estado: 'PENDIENTE' as const,
                intentos: q.intentos + 1,
                proximoIntento: new Date().toISOString(),
                ultimoError: undefined,
              }
            : q
        );
        localDb.save('siigoInvoicingQueue', updated);
        return { colaSiigo: updated };
      });
    },

    resetStore: () => {
      set({
        resoluciones: DEFAULT_RESOLUCIONES,
        facturasElectronicas: [],
        colaSiigo: [],
      });
      localDb.save('resoluciones', DEFAULT_RESOLUCIONES);
      localDb.save('facturasElectronicas', []);
      localDb.save('siigoInvoicingQueue', []);
    },
  }))
);
