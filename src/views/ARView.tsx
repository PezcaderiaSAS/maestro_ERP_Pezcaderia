// src/views/ARView.tsx
import React, { useState } from 'react';
import { Search, DollarSign, Wallet, FileText, Check, Plus, Calendar, Clock, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export interface PaymentAR {
  id: string;
  fecha: string;
  monto: number;
  metodo: 'Transferencia' | 'Datáfono' | 'Efectivo';
}

export interface InvoiceAR {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteIdentificacion: string;
  fecha: string;
  total: number;
  saldo: number;
  pagado: number;
  pagos: PaymentAR[];
}

interface ARViewProps {
  cartera: InvoiceAR[];
  setCartera: React.Dispatch<React.SetStateAction<InvoiceAR[]>>;
  publishEvent: (
    tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED',
    actor: string,
    descripcion: string,
    metadata?: any,
    enqueueSync?: boolean
  ) => void;
  userRole: string;
}

export default function ARView({ cartera, setCartera, publishEvent, userRole }: ARViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODAS' | 'PENDIENTES' | 'CANCELADAS'>('PENDIENTES');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceAR | null>(null);

  // Cálculos consolidados de cartera
  const totalPorCobrar = cartera.reduce((sum, inv) => sum + inv.saldo, 0);
  const totalRecaudado = cartera.reduce((sum, inv) => {
    return sum + inv.pagos.reduce((pSum, p) => pSum + p.monto, 0);
  }, 0);
  const facturasPendientesCount = cartera.filter(inv => inv.saldo > 0).length;

  // Filtrado de facturas
  const filteredInvoices = cartera.filter(inv => {
    const matchesSearch = 
      inv.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clienteIdentificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'TODAS' ||
      (statusFilter === 'PENDIENTES' && inv.saldo > 0) ||
      (statusFilter === 'CANCELADAS' && inv.saldo === 0);

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
    <div className="pos-layout animate-fade-in" style={{ flexDirection: 'row', gap: '20px', padding: '20px', overflowY: 'auto' }}>
      
      {/* Listado y Filtros de Cartera */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Indicadores Consolidados */}
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

        {/* Buscador y Filtros */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'white', padding: '12px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="pos-search-bar" style={{ flex: 1, marginBottom: 0 }}>
            <Search size={18} color="#64748B" />
            <input
              type="text"
              className="pos-search-input"
              placeholder="Buscar por cliente, NIT o Nro Factura..."
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
              Pendientes
            </button>
            <button
              className={`pos-category-tab ${statusFilter === 'CANCELADAS' ? 'active' : ''}`}
              onClick={() => setStatusFilter('CANCELADAS')}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Canceladas
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

        {/* Tabla de Facturas */}
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
                  <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }} onClick={() => setSelectedInvoice(inv)}>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)' }}>{inv.id}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{inv.clienteNombre}</span>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>NIT: {inv.clienteIdentificacion}</span>
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
      </div>

      {/* Historial de Abonos / Detalle de la Factura Seleccionada */}
      <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
        {selectedInvoice ? (
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

            {/* Ficha rápida */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#64748B' }}>Cliente:</span>
                <strong style={{ color: '#1E293B' }}>{selectedInvoice.clienteNombre}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#64748B' }}>NIT / Identificación:</span>
                <span style={{ color: '#1E293B' }}>{selectedInvoice.clienteIdentificacion}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#64748B' }}>Fecha de Emisión:</span>
                <span style={{ color: '#1E293B' }}>{new Date(selectedInvoice.fecha).toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Barra de Progreso de Pago */}
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

            {/* Listado de Pagos */}
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

            {/* Acción de abono rápido desde el detalle */}
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
        )}
      </div>

    </div>
  );
}
