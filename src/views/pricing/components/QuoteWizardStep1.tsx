import React from 'react';
import type { Cliente } from '../../../types/erp.types';

interface QuoteWizardStep1Props {
  clientes: Cliente[];
  clientName: string;
  setClientName: (val: string) => void;
  clientIdent: string;
  setClientIdent: (val: string) => void;
  clientType: 'POS' | 'RESTAURANTE' | 'MAYORISTA';
  setClientType: (val: 'POS' | 'RESTAURANTE' | 'MAYORISTA') => void;
  setLogisticaDireccion: (val: string) => void;
  origenPedido: string;
  setOrigenPedido: (val: string) => void;
  origenesDisponibles: string[];
  nuevoOrigen: string;
  setNuevoOrigen: (val: string) => void;
  formaPago: 'CREDITO' | 'CONTADO';
  setFormaPago: (val: 'CREDITO' | 'CONTADO') => void;
  facturaElectronica: boolean;
  setFacturaElectronica: (val: boolean) => void;
}

export const QuoteWizardStep1: React.FC<QuoteWizardStep1Props> = ({
  clientes,
  clientName,
  setClientName,
  clientIdent,
  setClientIdent,
  clientType,
  setClientType,
  setLogisticaDireccion,
  origenPedido,
  setOrigenPedido,
  origenesDisponibles,
  nuevoOrigen,
  setNuevoOrigen,
  formaPago,
  setFormaPago,
  facturaElectronica,
  setFacturaElectronica,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s' }}>
      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        Paso 1: Información Comercial
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
            Buscar Cliente en BD
          </label>
          <select
            className="form-control"
            style={{ border: '2px solid var(--primary-color)', borderRadius: '8px' }}
            value={clientes.find((c) => c.identificacion === clientIdent)?.id || ''}
            onChange={(e) => {
              const selected = clientes.find((c) => c.id === e.target.value);
              if (selected) {
                setClientName(selected.nombre);
                setClientIdent(selected.identificacion);
                setClientType(selected.tipoPrecio as any);
                setLogisticaDireccion(selected.direccion || '');
              } else {
                setClientName('');
                setClientIdent('');
                setClientType('POS');
                setLogisticaDireccion('');
              }
            }}
          >
            <option value="">-- Seleccionar cliente --</option>
            {clientes
              .filter((c) => c.activo)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.identificacion}) [Tarifa: {c.tipoPrecio}]
                </option>
              ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Cliente (Nombre o Razón Social) *</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ej. Restaurante Puerto Mar"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">NIT / Cédula</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ej. 900.123.456-1"
            value={clientIdent}
            onChange={(e) => setClientIdent(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Lista de Precios a Aplicar</label>
          <select
            className="form-control"
            value={clientType}
            onChange={(e) => setClientType(e.target.value as any)}
            style={{ fontWeight: 700, color: 'var(--primary-color)' }}
          >
            <option value="POS">Lista POS (Venta Directa)</option>
            <option value="RESTAURANTE">Lista Restaurante (Margen intermedio)</option>
            <option value="MAYORISTA">Lista Mayorista / B2B (Mejor Precio)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '8px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Origen de Pedido</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className="form-control"
              value={origenPedido}
              onChange={(e) => setOrigenPedido(e.target.value)}
              style={{ flex: 1 }}
            >
              {origenesDisponibles.map((origen) => (
                <option key={origen} value={origen}>
                  {origen}
                </option>
              ))}
              <option value="OTRO">Otro (Especificar)</option>
            </select>
            {origenPedido === 'OTRO' && (
              <input
                type="text"
                className="form-control"
                placeholder="Nuevo origen..."
                value={nuevoOrigen}
                onChange={(e) => setNuevoOrigen(e.target.value.toUpperCase())}
                style={{ flex: 1 }}
              />
            )}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Forma de Pago</label>
          <select
            className="form-control"
            value={formaPago}
            onChange={(e) => setFormaPago(e.target.value as any)}
          >
            <option value="CREDITO">Crédito (Cartera)</option>
            <option value="CONTADO">Contado (Pago Inmediato)</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Factura Electrónica</label>
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setFacturaElectronica(true)}
              className={`btn-secondary ${facturaElectronica ? 'active' : ''}`}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: facturaElectronica ? '2px solid var(--primary-color)' : '1px solid #E2E8F0',
                backgroundColor: facturaElectronica ? '#EFF6FF' : 'white',
                color: facturaElectronica ? 'var(--primary-color)' : '#64748B',
                fontWeight: 600,
              }}
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => setFacturaElectronica(false)}
              className={`btn-secondary ${!facturaElectronica ? 'active' : ''}`}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: !facturaElectronica ? '2px solid var(--primary-color)' : '1px solid #E2E8F0',
                backgroundColor: !facturaElectronica ? '#EFF6FF' : 'white',
                color: !facturaElectronica ? 'var(--primary-color)' : '#64748B',
                fontWeight: 600,
              }}
            >
              No
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
