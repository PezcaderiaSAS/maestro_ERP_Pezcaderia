import React, { useState } from 'react';
import { FileText, Calculator, CheckCircle, ArrowLeft, Sun, XOctagon, Zap } from 'lucide-react';
import Swal from 'sweetalert2';
import { generateId } from '../lib/utils';
import type { NominaRegistro } from '../store/useEmployeeStore';
import type { Gasto } from '../store/useExpenseStore';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PayrollWizard3Steps } from './payroll/components/PayrollWizard3Steps';

export default function PayrollView() {
  const { empleados, nominas, setNominas } = useEmployeeStore();
  const { addGastoAsync } = useExpenseStore();
  const setView = useAppStore((s) => s.setCurrentView);
  const [wizardType, setWizardType] = useState<'REGULAR' | 'VACACIONES' | 'LIQUIDACION_FINAL' | null>(null);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>('');

  const handleOpenWizard = (type: 'REGULAR' | 'VACACIONES' | 'LIQUIDACION_FINAL') => {
    if (empleados.length === 0) {
      Swal.fire('Error', 'No hay colaboradores registrados en el sistema.', 'error');
      return;
    }
    setSelectedEmpleadoId(empleados[0].id);
    setWizardType(type);
  };

  const handlePagar = (id: string) => {
    const nom = nominas.find(n => n.id === id);
    if (!nom) return;

    Swal.fire({
      title: 'Confirmar Desembolso',
      html: `¿Registrar salida de <b>$${Math.round(nom.netoAPagar).toLocaleString('es-CO')}</b> para <b>${nom.empleadoNombre}</b>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Pagar y Contabilizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#00B171'
    }).then(async (result) => {
      if (result.isConfirmed) {
        let cat = 'NÓMINA';
        if (nom.tipoLiquidacion === 'LIQUIDACION_FINAL') cat = 'LIQUIDACIÓN';
        if (nom.tipoLiquidacion === 'VACACIONES') cat = 'NÓMINA (VAC)';

        const nuevoGasto: Gasto = {
          id: generateId('gas'),
          fecha: new Date().toISOString(),
          categoria: cat as any,
          concepto: `Pago ${nom.tipoLiquidacion || 'REGULAR'} ${nom.periodoInicio} - ${nom.periodoFin} (${nom.empleadoNombre})`,
          monto: nom.netoAPagar,
          referenciaId: nom.id,
          metodoPago: 'TRANSFERENCIA'
        };

        await addGastoAsync(nuevoGasto);

        setNominas((prev: NominaRegistro[]) => prev.map((n: NominaRegistro) => {
          if (n.id === id) {
            return {
              ...n,
              estadoPago: 'PAGADO',
              gastoIdGenerado: nuevoGasto.id
            };
          }
          return n;
        }));
        Swal.fire('Pago Contabilizado', 'Gasto registrado correctamente en el Flujo de Caja.', 'success');
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-fade-in" data-testid="payroll-view-container">
      {/* Cabecera Ergonómica */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          {setView && (
            <button 
              type="button"
              onClick={() => setView('rrhh')}
              className="p-2.5 min-h-[48px] min-w-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all active:scale-95 touch-manipulation"
              title="Volver a Personal"
              aria-label="Volver a Personal"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motor Contable & Laboral</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Liquidación de Nómina & Prestaciones
            </h2>
          </div>
        </div>

        {/* Acciones de 1-Toque */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button 
            type="button"
            onClick={() => handleOpenWizard('REGULAR')}
            className="px-4 py-3 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 touch-manipulation"
            data-testid="btn-open-payroll-wizard"
          >
            <Zap size={18} />
            <span>Nómina Rápida (3 Pasos)</span>
          </button>

          <button 
            type="button"
            onClick={() => handleOpenWizard('VACACIONES')}
            className="px-3.5 py-3 min-h-[48px] rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 touch-manipulation"
          >
            <Sun size={16} className="text-amber-600" />
            <span>Vacaciones</span>
          </button>

          <button 
            type="button"
            onClick={() => handleOpenWizard('LIQUIDACION_FINAL')}
            className="px-3.5 py-3 min-h-[48px] rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 touch-manipulation"
          >
            <XOctagon size={16} className="text-rose-600" />
            <span>Liq. Definitiva</span>
          </button>
        </div>
      </div>

      {/* Tabla Histórica de Liquidaciones */}
      <Card glass className="overflow-hidden p-0 border border-slate-200 shadow-sm rounded-2xl bg-white">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            Histórico de Liquidaciones ({nominas.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">Actualizado en tiempo real</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" data-testid="payroll-history-table">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600">
                <th className="p-4">Tipo / Colaborador</th>
                <th className="p-4">Período / Días</th>
                <th className="p-4">Costo Empresa</th>
                <th className="p-4">Neto a Pagar</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {nominas.map(nom => (
                <tr key={nom.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block mb-1 ${
                      nom.tipoLiquidacion === 'LIQUIDACION_FINAL' 
                        ? 'bg-rose-100 text-rose-800' 
                        : nom.tipoLiquidacion === 'VACACIONES' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {nom.tipoLiquidacion || 'REGULAR'}
                    </span>
                    <div className="font-bold text-slate-900">{nom.empleadoNombre}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <FileText size={12} /> Ref: {nom.id.slice(-6).toUpperCase()}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="text-xs font-medium text-slate-700">
                      {nom.periodoInicio} al {nom.periodoFin}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{nom.diasTrabajados} Días liquidados</div>
                  </td>

                  <td className="p-4">
                    <div className="font-bold text-slate-900">
                      ${Math.round(nom.costoTotalEmpresa).toLocaleString('es-CO')}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="text-base font-black text-emerald-700">
                      ${Math.round(nom.netoAPagar).toLocaleString('es-CO')}
                    </div>
                  </td>

                  <td className="p-4">
                    <Badge variant={nom.estadoPago === 'PAGADO' ? 'success' : 'warning'}>
                      {nom.estadoPago}
                    </Badge>
                  </td>

                  <td className="p-4 text-right">
                    {nom.estadoPago === 'PENDIENTE' ? (
                      <button 
                        type="button"
                        onClick={() => handlePagar(nom.id)} 
                        className="px-3.5 py-2 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 ml-auto transition-all active:scale-95 touch-manipulation shadow-sm"
                        data-testid={`btn-pagar-nomina-${nom.id}`}
                      >
                        <CheckCircle size={14} />
                        <span>Pagar Gasto</span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                        <CheckCircle size={14} className="text-emerald-600" />
                        <span>Desembolsado</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {nominas.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                    No hay liquidaciones registradas en el histórico. Utiliza el botón superior para liquidar la nómina.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Wizard de Nómina en 3 Pasos */}
      <PayrollWizard3Steps
        isOpen={!!wizardType}
        onClose={() => setWizardType(null)}
        initialType={wizardType || 'REGULAR'}
        preselectedEmpleadoId={selectedEmpleadoId}
        onSuccess={() => setWizardType(null)}
      />
    </div>
  );
}
