import React from 'react';
import type { Conductor } from '../../../types/erp.types';

interface QuoteWizardStep2Props {
  logisticaTipo: 'EN_RUTA' | 'INMEDIATA' | 'RECOGEN';
  setLogisticaTipo: (val: 'EN_RUTA' | 'INMEDIATA' | 'RECOGEN') => void;
  logisticaDireccion: string;
  setLogisticaDireccion: (val: string) => void;
  logisticaFecha: string;
  setLogisticaFecha: (val: string) => void;
  logisticaJornada: 'MANANA' | 'TARDE';
  setLogisticaJornada: (val: 'MANANA' | 'TARDE') => void;
  logisticaConductorId: string;
  setLogisticaConductorId: (val: string) => void;
  conductores: Conductor[];
}

export const QuoteWizardStep2: React.FC<QuoteWizardStep2Props> = ({
  logisticaTipo,
  setLogisticaTipo,
  logisticaDireccion,
  setLogisticaDireccion,
  logisticaFecha,
  setLogisticaFecha,
  logisticaJornada,
  setLogisticaJornada,
  logisticaConductorId,
  setLogisticaConductorId,
  conductores,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s' }}>
      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        Paso 2: Logística de Entrega
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Tipo de Entrega</label>
          <select
            className="form-control"
            value={logisticaTipo}
            onChange={(e) => setLogisticaTipo(e.target.value as any)}
          >
            <option value="EN_RUTA">En Ruta (Domicilio programado)</option>
            <option value="INMEDIATA">Entrega Inmediata (Express)</option>
            <option value="RECOGEN">Cliente Recoge en Punto de Venta</option>
          </select>
        </div>

        {logisticaTipo !== 'RECOGEN' && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Dirección de Entrega</label>
            <input
              type="text"
              className="form-control"
              placeholder="Dirección completa del cliente"
              value={logisticaDireccion}
              onChange={(e) => setLogisticaDireccion(e.target.value)}
            />
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Fecha Programada</label>
          <input
            type="date"
            className="form-control"
            value={logisticaFecha}
            onChange={(e) => setLogisticaFecha(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Jornada</label>
          <select
            className="form-control"
            value={logisticaJornada}
            onChange={(e) => setLogisticaJornada(e.target.value as any)}
          >
            <option value="MANANA">Mañana (6:00 AM - 12:00 PM)</option>
            <option value="TARDE">Tarde (12:00 PM - 6:00 PM)</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Conductor Asignado (Opcional)</label>
          <select
            className="form-control"
            value={logisticaConductorId}
            onChange={(e) => setLogisticaConductorId(e.target.value)}
          >
            <option value="">-- Sin asignar por ahora --</option>
            {conductores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.celular})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
