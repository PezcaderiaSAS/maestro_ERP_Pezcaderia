// src/views/DashboardView.tsx
import { ReactNode } from 'react';
import { DollarSign, ShoppingBag, PlusCircle, ArrowUpRight, Wallet, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { calculateDashboardMetrics } from '../services/metricsService';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: ReactNode;
}

function MetricCard({ title, value, change, positive, icon }: MetricCardProps) {
  return (
    <div style={{
      backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '16px',
      padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{title}</span>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          backgroundColor: positive ? 'rgba(0, 177, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center'
        }}>
          {icon}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>{value}</span>
        <span style={{ fontSize: '12px', color: positive ? '#10B981' : '#EF4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
          {positive ? '+' : ''}{change} <ArrowUpRight size={12} />
        </span>
      </div>
    </div>
  );
}

export default function DashboardView({ ventas = [], parametros: _parametros = {}, devoluciones = [] }: any) {
  const setView = useAppStore((s) => s.setCurrentView);
  const {
    totalSalesToday,
    salesTodayCount,
    isolatedCajaFisica,
    totalDigitalSales,
    totalDevoluciones,
    transaccionesRecientes
  } = calculateDashboardMetrics(ventas, devoluciones);

  return (
    <div className="hr-layout animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Encabezado */}
      <div>
        <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Resumen Ejecutivo</span>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Panel de Control La Pezcadería</h2>
      </div>
 
      {/* Grid de Metricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <MetricCard
          title="Ventas del Día"
          value={`$${totalSalesToday.toLocaleString('es-CO')}`}
          change={`${salesTodayCount} transacciones`}
          positive={totalSalesToday > 0}
          icon={<DollarSign size={18} color="#00B171" />}
        />
        <MetricCard
          title="Caja Chica (Efectivo Neto)"
          value={`$${isolatedCajaFisica.toLocaleString('es-CO')}`}
          change="Excluye canales digitales (RN-06)"
          positive={true}
          icon={<Wallet size={18} color="#00B171" />}
        />
        <MetricCard
          title="Canales Digitales (Shopify/Rappi)"
          value={`$${totalDigitalSales.toLocaleString('es-CO')}`}
          change="Procesado en cola (RN-03)"
          positive={totalDigitalSales > 0}
          icon={<ShoppingBag size={18} color="#00B171" />}
        />
        <MetricCard
          title="Notas de Crédito Hoy"
          value={`$${totalDevoluciones.toLocaleString('es-CO')}`}
          change="Cancelaciones de pedido"
          positive={false}
          icon={<RefreshCw size={18} color="#EF4444" />}
        />
      </div>
 
      {/* Dashboard Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        
        {/* Izquierda: Historial de Transacciones */}
        <div className="hr-table-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Transacciones del Día</h3>
          <table className="hr-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px' }}>ID</th>
                <th style={{ padding: '12px 16px' }}>Descripción</th>
                <th style={{ padding: '12px 16px' }}>Tipo</th>
                <th style={{ padding: '12px 16px' }}>Hora</th>
                <th style={{ padding: '12px 16px' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {transaccionesRecientes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                    No se han registrado transacciones el día de hoy.
                  </td>
                </tr>
              ) : (
                transaccionesRecientes.map((tx: any) => (
                  <tr key={tx.id}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#64748B' }}>{tx.id}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{tx.descripcion}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge-status ${tx.tipo === 'INGRESO' ? 'activo' : 'inactivo'}`}>
                        {tx.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '13px' }}>{tx.hora}</td>
                    <td style={{
                      padding: '12px 16px', fontWeight: 700,
                      color: tx.tipo === 'INGRESO' ? '#10B981' : '#EF4444'
                    }}>
                      {tx.tipo === 'INGRESO' ? '+' : '-'}${tx.valor.toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Derecha: Accesos Rápidos */}
        <div className="hr-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>Operaciones Rápidas</h3>
          
          <button onClick={() => setView('pos')} className="hr-btn-new" style={{ border: 'none', width: '100%', justifyContent: 'center', padding: '16px' }}>
            <ShoppingBag size={18} />
            <span>Abrir Punto de Venta (POS)</span>
          </button>

          <button onClick={() => setView('inventario')} className="hr-btn-new" style={{
            border: '1px solid #00B171', backgroundColor: 'transparent', color: '#00B171',
            width: '100%', justifyContent: 'center', padding: '16px'
          }}>
            <PlusCircle size={18} />
            <span>Iniciar Transformación</span>
          </button>
        </div>
      </div>
    </div>
  );
}
