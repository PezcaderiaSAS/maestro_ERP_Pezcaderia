// src/views/ARView.tsx
import React, { useState } from 'react';
import { Search, DollarSign, Wallet, FileText, Check, Plus, Calendar, Clock, AlertCircle, Undo2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { Cliente, DevolucionPedido } from '../App.tsx';

export interface PaymentAR {
  id: string;
  fecha: string;
  monto: number;
  metodo: 'Transferencia' | 'Datáfono' | 'Efectivo';
}

export interface InvoiceAR {
  id: string;
  clienteId: string;              // FK formal hacia Cliente.id
  clienteNombre: string;          // ⚠️ Legado — usar sólo como fallback
  clienteIdentificacion: string;  // ⚠️ Legado — usar sólo como fallback
  fecha: string;
  fechaVencimiento?: string;
  total: number;
  saldo: number;
  pagado: number;
  pagos: PaymentAR[];
}

interface ARViewProps {
  cartera: InvoiceAR[];
  setCartera: React.Dispatch<React.SetStateAction<InvoiceAR[]>>;
  clientes: Cliente[];            // Fuente de verdad para nombres en runtime
  publishEvent: (
    tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED',
    actor: string,
    descripcion: string,
    metadata?: any,
    enqueueSync?: boolean
  ) => void;
  userRole: string;
  devoluciones?: DevolucionPedido[];
  setDevoluciones?: React.Dispatch<React.SetStateAction<DevolucionPedido[]>>;
}

export default function ARView({ 
  cartera, 
  setCartera, 
  clientes, 
  publishEvent, 
  userRole, 
  devoluciones = [], 
  setDevoluciones: _setDevoluciones 
}: ARViewProps) {
  const [activeTab, setActiveTab] = useState<'facturas' | 'devoluciones'>('facturas');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODAS' | 'PENDIENTES' | 'CANCELADAS'>('PENDIENTES');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceAR | null>(null);
  const [selectedDev, setSelectedDev] = useState<DevolucionPedido | null>(null);


  /**
   * Resuelve el nombre de un cliente usando la fuente de verdad (clientes[]).
   * Si el invoice tiene clienteId y se encuentra el cliente, usa el nombre actualizado.
   * Si no, usa el nombre almacenado en la factura como fallback (datos históricos).
   */
  const resolveClienteName = (inv: InvoiceAR): string => {
    if (inv.clienteId) {
      const found = clientes.find(c => c.id === inv.clienteId);
      if (found) return found.nombre;
    }
    return inv.clienteNombre || 'Cliente desconocido';
  };

  const resolveClienteIdentificacion = (inv: InvoiceAR): string => {
    if (inv.clienteId) {
      const found = clientes.find(c => c.id === inv.clienteId);
      if (found) return found.identificacion;
    }
    return inv.clienteIdentificacion || '—';
  };

  // Cálculos consolidados de cartera
  const totalPorCobrar = cartera.reduce((sum, inv) => sum + inv.saldo, 0);
  const totalRecaudado = cartera.reduce((sum, inv) => {
    return sum + inv.pagos.reduce((pSum, p) => pSum + p.monto, 0);
  }, 0);
  const facturasPendientesCount = cartera.filter(inv => inv.saldo > 0).length;

  // Cálculos para devoluciones B2B
  const getReturnAmount = (dev: DevolucionPedido) => {
    return (dev.items || []).reduce((sum, item) => {
      const qty = item.cantidadRecibida || 0;
      return sum + qty * (item.precioUnitarioVenta || 0);
    }, 0);
  };

  const totalSaldosFavor = (devoluciones || [])
    .filter(d => d.estado === 'RECIBIDA_BODEGA')
    .reduce((sum, d) => sum + getReturnAmount(d), 0);

  const totalNotasAplicadas = (devoluciones || [])
    .filter(d => d.estado === 'VALIDADA_FINANZAS')
    .reduce((sum, d) => sum + getReturnAmount(d), 0);

  const totalDevsCount = (devoluciones || [])
    .filter(d => d.estado === 'RECIBIDA_BODEGA' || d.estado === 'VALIDADA_FINANZAS').length;

  // Filtrado de facturas — usa resolveClienteName para buscar por nombre actualizado
  const filteredInvoices = cartera.filter(inv => {
    const nombre = resolveClienteName(inv);
    const identificacion = resolveClienteIdentificacion(inv);
    const matchesSearch =
      nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      identificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'TODAS' ||
      (statusFilter === 'PENDIENTES' && inv.saldo > 0) ||
      (statusFilter === 'CANCELADAS' && inv.saldo === 0);

    return matchesSearch && matchesStatus;
  });

  // Filtrado de devoluciones / Saldos a favor B2B
  const filteredDevs = (devoluciones || []).filter(dev => {
    if (dev.estado !== 'RECIBIDA_BODEGA' && dev.estado !== 'VALIDADA_FINANZAS') return false;

    const nombre = dev.clienteNombre || '';
    const matchesSearch =
      nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dev.pedidoNo || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'TODAS' ||
      (statusFilter === 'PENDIENTES' && dev.estado === 'RECIBIDA_BODEGA') ||
      (statusFilter === 'CANCELADAS' && dev.estado === 'VALIDADA_FINANZAS');

    return matchesSearch && matchesStatus;
  });


  const handleRegistrarAbono = async (invoice: InvoiceAR) => {
    const { value: formValues } = await Swal.fire({
      title: `Registrar Abono a ${invoice.id}`,
      html: `
        <div style="text-align: left; font-size: 14px; color: var(--text-primary);">
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between;">
            <strong>Cliente:</strong> <span>${invoice.clienteNombre}</span>
          </div>
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between;">
            <strong>Total Factura:</strong> <span>$${invoice.total.toLocaleString('es-CO')}</span>
          </div>
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px dashed #CBD5E1;">
            <strong>Saldo Pendiente:</strong> <span style="color: #EF4444; font-weight: bold;">$${invoice.saldo.toLocaleString('es-CO')}</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-weight: bold; margin-bottom: 6px;">Tipo de Abono:</label>
            <div style="display: flex; gap: 10px;">
              <label style="flex: 1; border: 1px solid #E2E8F0; padding: 8px; border-radius: 6px; cursor: pointer; text-align: center;" id="label-tipo-total">
                <input type="radio" name="tipoAbono" id="tipo-total" value="TOTAL" checked style="margin-right: 4px;" />
                Abono Total
              </label>
              <label style="flex: 1; border: 1px solid #E2E8F0; padding: 8px; border-radius: 6px; cursor: pointer; text-align: center;" id="label-tipo-parcial">
                <input type="radio" name="tipoAbono" id="tipo-parcial" value="PARCIAL" style="margin-right: 4px;" />
                Abono Parcial
              </label>
            </div>
          </div>

          <div style="margin-bottom: 10px;">
            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Abonar con Transferencia ($):</label>
            <input id="abono-transfer" type="number" class="swal2-input" style="margin: 0; width: 100%; box-sizing: border-box;" value="0" />
          </div>

          <div style="margin-bottom: 10px;">
            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Abonar con Datáfono ($):</label>
            <input id="abono-card" type="number" class="swal2-input" style="margin: 0; width: 100%; box-sizing: border-box;" value="0" />
          </div>

          <div style="margin-bottom: 10px;">
            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Abonar con Efectivo ($):</label>
            <input id="abono-cash" type="number" class="swal2-input" style="margin: 0; width: 100%; box-sizing: border-box;" value="${invoice.saldo}" />
          </div>

          <div style="margin-top: 16px; padding: 12px; background-color: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>Total a Abonar:</span>
              <strong id="abono-total-amount" style="color: var(--primary-color); font-size: 16px;">$0</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span id="abono-validation-label">Estado de Validación:</span>
              <strong id="abono-validation-status" style="color: #10B981;">Válido</strong>
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Procesar Abono',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-color)',
      didOpen: () => {
        const radioTotal = document.getElementById('tipo-total') as HTMLInputElement;
        const radioParcial = document.getElementById('tipo-parcial') as HTMLInputElement;
        const inputTransfer = document.getElementById('abono-transfer') as HTMLInputElement;
        const inputCard = document.getElementById('abono-card') as HTMLInputElement;
        const inputCash = document.getElementById('abono-cash') as HTMLInputElement;
        const labelTotal = document.getElementById('label-tipo-total');
        const labelParcial = document.getElementById('label-tipo-parcial');
        const totalAmountEl = document.getElementById('abono-total-amount');
        const validationStatusEl = document.getElementById('abono-validation-status');

        if (labelTotal && labelParcial) {
          labelTotal.style.borderColor = 'var(--primary-color)';
          labelTotal.style.backgroundColor = '#ECFDF5';
        }

        const updateCalculations = () => {
          const transfer = parseFloat(inputTransfer.value) || 0;
          const card = parseFloat(inputCard.value) || 0;
          const cash = parseFloat(inputCash.value) || 0;
          const totalPaid = transfer + card + cash;

          if (totalAmountEl) {
            totalAmountEl.innerText = '$' + totalPaid.toLocaleString('es-CO');
          }

          const isTotal = radioTotal.checked;
          if (validationStatusEl) {
            if (isTotal) {
              if (totalPaid === invoice.saldo) {
                validationStatusEl.innerText = 'Válido (Abono Total)';
                validationStatusEl.style.color = '#10B981';
              } else {
                validationStatusEl.innerText = `Incorrecto (Debe sumar $${invoice.saldo.toLocaleString('es-CO')})`;
                validationStatusEl.style.color = '#EF4444';
              }
            } else {
              if (totalPaid <= 0) {
                validationStatusEl.innerText = 'Ingrese un monto mayor a $0';
                validationStatusEl.style.color = '#EF4444';
              } else if (totalPaid > invoice.saldo) {
                validationStatusEl.innerText = `Excede el saldo ($${invoice.saldo.toLocaleString('es-CO')})`;
                validationStatusEl.style.color = '#EF4444';
              } else {
                validationStatusEl.innerText = 'Monto Parcial Válido';
                validationStatusEl.style.color = '#10B981';
              }
            }
          }
        };

        radioTotal.addEventListener('change', () => {
          if (radioTotal.checked) {
            inputCash.value = invoice.saldo.toString();
            inputTransfer.value = '0';
            inputCard.value = '0';
            if (labelTotal && labelParcial) {
              labelTotal.style.borderColor = 'var(--primary-color)';
              labelTotal.style.backgroundColor = '#ECFDF5';
              labelParcial.style.borderColor = '#E2E8F0';
              labelParcial.style.backgroundColor = 'transparent';
            }
            updateCalculations();
          }
        });

        radioParcial.addEventListener('change', () => {
          if (radioParcial.checked) {
            inputCash.value = '0';
            inputTransfer.value = '0';
            inputCard.value = '0';
            if (labelTotal && labelParcial) {
              labelParcial.style.borderColor = 'var(--primary-color)';
              labelParcial.style.backgroundColor = '#ECFDF5';
              labelTotal.style.borderColor = '#E2E8F0';
              labelTotal.style.backgroundColor = 'transparent';
            }
            updateCalculations();
          }
        });

        [inputTransfer, inputCard, inputCash].forEach(input => {
          input.addEventListener('input', updateCalculations);
          input.addEventListener('focus', () => {
            if (input.value === '0') input.value = '';
          });
          input.addEventListener('blur', () => {
            if (input.value === '') input.value = '0';
          });
        });

        updateCalculations();
      },
      preConfirm: () => {
        const radioTotal = (document.getElementById('tipo-total') as HTMLInputElement).checked;
        const transfer = parseFloat((document.getElementById('abono-transfer') as HTMLInputElement).value) || 0;
        const card = parseFloat((document.getElementById('abono-card') as HTMLInputElement).value) || 0;
        const cash = parseFloat((document.getElementById('abono-cash') as HTMLInputElement).value) || 0;
        const totalAbonado = transfer + card + cash;

        if (totalAbonado <= 0) {
          Swal.showValidationMessage('El monto total del abono debe ser mayor a $0.');
          return false;
        }

        if (radioTotal && totalAbonado !== invoice.saldo) {
          Swal.showValidationMessage(`Para un Abono Total, la suma debe ser exactamente igual al saldo pendiente ($${invoice.saldo.toLocaleString('es-CO')}).`);
          return false;
        }

        if (!radioTotal && totalAbonado > invoice.saldo) {
          Swal.showValidationMessage(`El abono total ($${totalAbonado.toLocaleString('es-CO')}) no puede ser superior al saldo pendiente ($${invoice.saldo.toLocaleString('es-CO')}).`);
          return false;
        }

        return { transfer, card, cash, totalAbonado };
      }
    });

    if (formValues) {
      const { transfer, card, cash, totalAbonado } = formValues;

      setCartera(prev => prev.map(inv => {
        if (inv.id === invoice.id) {
          const nuevosPagos: PaymentAR[] = [];
          if (transfer > 0) {
            nuevosPagos.push({
              id: 'pgo-t-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              fecha: new Date().toISOString(),
              monto: transfer,
              metodo: 'Transferencia'
            });
          }
          if (card > 0) {
            nuevosPagos.push({
              id: 'pgo-c-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              fecha: new Date().toISOString(),
              monto: card,
              metodo: 'Datáfono'
            });
          }
          if (cash > 0) {
            nuevosPagos.push({
              id: 'pgo-cs-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              fecha: new Date().toISOString(),
              monto: cash,
              metodo: 'Efectivo'
            });
          }

          const nuevoSaldo = Math.max(0, inv.saldo - totalAbonado);
          const nuevoPagado = inv.pagado + totalAbonado;
          const detallesPago = nuevosPagos.map(p => `$${p.monto.toLocaleString('es-CO')} (${p.metodo})`).join(', ');

          publishEvent(
            'SALE_COMPLETED',
            userRole,
            `Abono de $${totalAbonado.toLocaleString('es-CO')} registrado a la factura ${invoice.id} [${detallesPago}] para el cliente ${invoice.clienteNombre}`,
            { invoiceId: invoice.id, totalAbonado, nuevosPagos, saldoRestante: nuevoSaldo }
          );

          return {
            ...inv,
            saldo: nuevoSaldo,
            pagado: nuevoPagado,
            pagos: [...inv.pagos, ...nuevosPagos]
          };
        }
        return inv;
      }));

      Swal.fire({
        icon: 'success',
        title: 'Abono Registrado',
        text: `Se aplicó un abono total de $${totalAbonado.toLocaleString('es-CO')} a la factura ${invoice.id}.`,
        confirmButtonColor: 'var(--primary-color)'
      });
    }
  };

  return (
    <div className="pos-layout animate-fade-in" style={{ flexDirection: 'column', gap: '20px', padding: '20px', overflowY: 'auto' }}>
      
      {/* Pestañas Superiores de Cartera / Notas de Crédito */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px', marginBottom: '-10px' }}>
        <button
          onClick={() => {
            setActiveTab('facturas');
            setSelectedInvoice(null);
            setSelectedDev(null);
          }}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 700,
            color: activeTab === 'facturas' ? 'var(--primary-color)' : '#64748B',
            backgroundColor: activeTab === 'facturas' ? '#EFF6FF' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'facturas' ? '2px solid var(--primary-color)' : 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <FileText size={16} /> Cuentas por Cobrar (AR)
        </button>
        <button
          onClick={() => {
            setActiveTab('devoluciones');
            setSelectedInvoice(null);
            setSelectedDev(null);
          }}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 700,
            color: activeTab === 'devoluciones' ? 'var(--primary-color)' : '#64748B',
            backgroundColor: activeTab === 'devoluciones' ? '#EFF6FF' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'devoluciones' ? '2px solid var(--primary-color)' : 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Undo2 size={16} /> Notas Crédito y Saldos a Favor B2B
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', flex: 1, minHeight: 0 }}>
        
        {/* Columna Izquierda: Listado y Filtros */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Indicadores Consolidados */}
          {activeTab === 'facturas' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="stat-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px' }}>
                <div style={{ padding: '10px', background: '#FEE2E2', color: '#EF4444', borderRadius: '50%' }}>
                  <DollarSign size={24} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Saldo Pendiente</span>
                  <strong style={{ fontSize: '18px', color: '#EF4444' }}>${totalPorCobrar.toLocaleString('es-CO')}</strong>
                </div>
              </div>

              <div className="stat-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: '#ECFDF5', border: '1px solid #D1FAE5', borderRadius: '12px' }}>
                <div style={{ padding: '10px', background: '#D1FAE5', color: '#10B981', borderRadius: '50%' }}>
                  <Wallet size={24} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Total Recaudado</span>
                  <strong style={{ fontSize: '18px', color: '#10B981' }}>${totalRecaudado.toLocaleString('es-CO')}</strong>
                </div>
              </div>

              <div className="stat-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '12px' }}>
                <div style={{ padding: '10px', background: '#DBEAFE', color: '#3B82F6', borderRadius: '50%' }}>
                  <FileText size={24} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Clientes con Deuda</span>
                  <strong style={{ fontSize: '18px', color: '#3B82F6' }}>{facturasPendientesCount} facturas</strong>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="stat-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: '#ECFDF5', border: '1px solid #D1FAE5', borderRadius: '12px' }}>
                <div style={{ padding: '10px', background: '#D1FAE5', color: '#10B981', borderRadius: '50%' }}>
                  <Wallet size={24} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Saldos Disponibles B2B</span>
                  <strong style={{ fontSize: '18px', color: '#10B981' }}>${totalSaldosFavor.toLocaleString('es-CO')}</strong>
                </div>
              </div>

              <div className="stat-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '12px' }}>
                <div style={{ padding: '10px', background: '#DBEAFE', color: '#3B82F6', borderRadius: '50%' }}>
                  <FileText size={24} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Notas de Crédito Aplicadas</span>
                  <strong style={{ fontSize: '18px', color: '#3B82F6' }}>${totalNotasAplicadas.toLocaleString('es-CO')}</strong>
                </div>
              </div>

              <div className="stat-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                <div style={{ padding: '10px', background: '#E2E8F0', color: '#64748B', borderRadius: '50%' }}>
                  <Undo2 size={24} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Historial Devoluciones</span>
                  <strong style={{ fontSize: '18px', color: '#1E293B' }}>{totalDevsCount} registros</strong>
                </div>
              </div>
            </div>
          )}

          {/* Buscador y Filtros */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'white', padding: '12px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="pos-search-bar" style={{ flex: 1, marginBottom: 0 }}>
              <Search size={18} color="#64748B" />
              <input
                type="text"
                className="pos-search-input"
                placeholder={activeTab === 'facturas' ? "Buscar por cliente, NIT o Nro Factura..." : "Buscar por cliente o Nro Devolución..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`pos-category-tab ${statusFilter === 'PENDIENTES' ? 'active' : ''}`}
                onClick={() => setStatusFilter('PENDIENTES')}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                {activeTab === 'facturas' ? 'Pendientes' : 'Saldos Activos'}
              </button>
              <button
                className={`pos-category-tab ${statusFilter === 'CANCELADAS' ? 'active' : ''}`}
                onClick={() => setStatusFilter('CANCELADAS')}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                {activeTab === 'facturas' ? 'Canceladas' : 'Notas Aplicadas'}
              </button>
              <button
                className={`pos-category-tab ${statusFilter === 'TODAS' ? 'active' : ''}`}
                onClick={() => setStatusFilter('TODAS')}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                Todas
              </button>
            </div>
          </div>

          {/* Tabla de Datos Principal */}
          {activeTab === 'facturas' ? (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Nro Factura</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Cliente</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Fecha</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Total Venta</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Pagado</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Saldo</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                        No se encontraron facturas en cartera.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => (
                      <tr 
                        key={inv.id} 
                        style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', backgroundColor: selectedInvoice?.id === inv.id ? '#F1F5F9' : 'transparent' }} 
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)' }}>{inv.id}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{resolveClienteName(inv)}</span>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>NIT: {resolveClienteIdentificacion(inv)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', color: '#64748B' }}>
                          {new Date(inv.fecha).toLocaleDateString('es-CO')}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 500 }}>
                          ${inv.total.toLocaleString('es-CO')}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: '#10B981', fontWeight: 500 }}>
                          ${inv.pagado.toLocaleString('es-CO')}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: inv.saldo > 0 ? '#EF4444' : '#10B981' }}>
                          ${inv.saldo.toLocaleString('es-CO')}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          {inv.saldo > 0 ? (
                            <button
                              onClick={() => handleRegistrarAbono(inv)}
                              className="btn-primary"
                              style={{
                                fontSize: '11px',
                                padding: '6px 12px',
                                backgroundColor: 'var(--primary-color)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                borderRadius: '4px',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus size={12} /> Abonar
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#10B981', backgroundColor: '#ECFDF5', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              PAGADO
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Nro Devolución</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Cliente</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Pedido Orig.</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Fecha Recibido</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Monto Devolución</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Estado Finanzas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                        No se encontraron devoluciones o notas de crédito registradas.
                      </td>
                    </tr>
                  ) : (
                    filteredDevs.map(dev => {
                      const amount = getReturnAmount(dev);
                      return (
                        <tr 
                          key={dev.id} 
                          style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', backgroundColor: selectedDev?.id === dev.id ? '#F1F5F9' : 'transparent' }} 
                          onClick={() => setSelectedDev(dev)}
                        >
                          <td style={{ padding: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)' }}>{dev.id}</td>
                          <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{dev.clienteNombre}</td>
                          <td style={{ padding: '12px', fontSize: '12px', color: '#64748B' }}>#{dev.pedidoNo}</td>
                          <td style={{ padding: '12px', fontSize: '12px', color: '#64748B' }}>
                            {dev.fechaRecibido ? new Date(dev.fechaRecibido).toLocaleDateString('es-CO') : '—'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)' }}>
                            ${amount.toLocaleString('es-CO')}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {dev.estado === 'RECIBIDA_BODEGA' ? (
                              <span style={{ fontSize: '11px', color: '#3B82F6', backgroundColor: '#EFF6FF', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #DBEAFE' }}>
                                Saldo Disponible
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                Nota Crédito Aplicada
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Columna Derecha: Detalle de Item Seleccionado */}
        <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
          
          {activeTab === 'facturas' ? (
            selectedInvoice ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Detalle de Cartera</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>{selectedInvoice.id}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedInvoice(null)}
                    style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '20px', cursor: 'pointer' }}
                  >
                    &times;
                  </button>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B' }}>Cliente:</span>
                    <strong style={{ color: '#1E293B' }}>{resolveClienteName(selectedInvoice)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B' }}>NIT / Identificación:</span>
                    <span style={{ color: '#1E293B' }}>{resolveClienteIdentificacion(selectedInvoice)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B' }}>Fecha de Emisión:</span>
                    <span style={{ color: '#1E293B' }}>{new Date(selectedInvoice.fecha).toLocaleString('es-CO')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
                    <span style={{ color: '#64748B' }}>Cobrado: {Math.round((selectedInvoice.pagado / selectedInvoice.total) * 100)}%</span>
                    <span style={{ color: '#64748B' }}>Restante: ${selectedInvoice.saldo.toLocaleString('es-CO')}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        backgroundColor: selectedInvoice.saldo === 0 ? '#10B981' : '#3B82F6', 
                        width: `${(selectedInvoice.pagado / selectedInvoice.total) * 100}%`,
                        transition: 'width 0.4s ease'
                      }} 
                    />
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> Historial de Abonos
                  </span>
                  
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', paddingRight: '4px' }}>
                    {selectedInvoice.pagos.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', gap: '4px', padding: '20px 0' }}>
                        <AlertCircle size={20} />
                        <span style={{ fontSize: '11px' }}>No hay abonos registrados para esta factura.</span>
                      </div>
                    ) : (
                      selectedInvoice.pagos.map((p) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>${p.monto.toLocaleString('es-CO')}</span>
                            <span style={{ fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={10} /> {new Date(p.fecha).toLocaleDateString('es-CO')} ({p.metodo})
                            </span>
                          </div>
                          <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', fontSize: '10px', fontWeight: 700, backgroundColor: '#ECFDF5', padding: '2px 6px', borderRadius: '4px' }}>
                            <Check size={10} style={{ marginRight: '2px' }} /> Recibido
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {selectedInvoice.saldo > 0 && (
                  <button 
                    onClick={() => handleRegistrarAbono(selectedInvoice)}
                    className="btn-primary"
                    style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    <Plus size={16} /> Registrar Nuevo Abono
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B', gap: '8px', padding: '40px 0' }}>
                <span style={{ fontSize: '32px' }}>📁</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Selecciona una factura</span>
                <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>
                  Haz clic en cualquier factura para consultar su historial de abonos y realizar transacciones individuales.
                </p>
              </div>
            )
          ) : (
            selectedDev ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Detalle de Devolución</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>{selectedDev.id}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedDev(null)}
                    style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '20px', cursor: 'pointer' }}
                  >
                    &times;
                  </button>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B' }}>Cliente:</span>
                    <strong style={{ color: '#1E293B' }}>{selectedDev.clienteNombre}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B' }}>Pedido Relacionado:</span>
                    <strong style={{ color: 'var(--primary-color)' }}>#{selectedDev.pedidoNo}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#64748B' }}>Recibido en Bodega:</span>
                    <span style={{ color: '#1E293B' }}>{selectedDev.fechaRecibido ? new Date(selectedDev.fechaRecibido).toLocaleString('es-CO') : 'Pendiente'}</span>
                  </div>
                  {selectedDev.fechaValidacion && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#64748B' }}>Fecha Validación:</span>
                      <span style={{ color: '#10B981', fontWeight: 500 }}>{new Date(selectedDev.fechaValidacion).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                </div>

                {/* Lista de productos devueltos */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Productos Devueltos</span>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px' }}>
                    {(selectedDev.items || []).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', border: '1px solid #F1F5F9', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: '12px', color: '#1E293B' }}>{item.nombre}</strong>
                          <span style={{ fontSize: '10px', color: '#64748B' }}>
                            Cant. Reportada: {item.cantidadSolicitada}kg | Recibida: <strong style={{ color: 'var(--primary-color)' }}>{item.cantidadRecibida}kg</strong>
                          </span>
                          <span style={{ fontSize: '9px', color: '#94A3B8' }}>
                            Destino: {item.estadoCalidad === 'APROBADO_REINGRESO' ? 'Reingreso a Stock' : 'Merma / Descarte'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>${(item.precioUnitarioVenta || 0).toLocaleString('es-CO')}/kg</span>
                          <strong style={{ fontSize: '12px', color: 'var(--primary-color)' }}>
                            ${((item.cantidadRecibida || 0) * (item.precioUnitarioVenta || 0)).toLocaleString('es-CO')}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total e Información de Aplicación */}
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Total Crédito:</span>
                    <strong style={{ fontSize: '18px', color: 'var(--primary-color)' }}>
                      ${getReturnAmount(selectedDev).toLocaleString('es-CO')}
                    </strong>
                  </div>
                  {selectedDev.estado === 'VALIDADA_FINANZAS' ? (
                    <div style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '11px', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 600, marginTop: '4px' }}>
                      ✓ Este saldo a favor ya fue aplicado como Nota de Crédito en la consolidación de facturación.
                    </div>
                  ) : (
                    <div style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 600, marginTop: '4px', border: '1px solid #BFDBFE' }}>
                      ℹ Saldo disponible para aplicar en la próxima liquidación de facturas B2B de este cliente.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B', gap: '8px', padding: '40px 0' }}>
                <span style={{ fontSize: '32px' }}>🔄</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Selecciona una devolución</span>
                <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>
                  Haz clic en cualquier devolución para ver los detalles de los productos devueltos y su estado de aplicación contable.
                </p>
              </div>
            )
          )}
        </div>

      </div>

    </div>
  );
}
