// src/views/DashboardView.tsx
import { ReactNode } from 'react';
import { DollarSign, Truck, Percent, TrendingUp, ShoppingBag, PlusCircle, ArrowUpRight } from 'lucide-react';

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

export default function DashboardView({ setView }: { setView: (v: string) => void }) {
  const transaccionesRecientes = [
    { id: 'TX-001', descripcion: 'Venta Factura POS (PED-004312)', tipo: 'INGRESO', valor: 45000, hora: '12:30 PM' },
    { id: 'TX-002', descripcion: 'Gasto Combustible Ruta Norte (RUT-0081)', tipo: 'EGRESO', valor: 35000, hora: '11:15 AM' },
    { id: 'TX-003', descripcion: 'Venta Factura POS (PED-004311)', tipo: 'INGRESO', valor: 120000, hora: '10:45 AM' },
    { id: 'TX-004', descripcion: 'Gasto Peaje Ruta Sur (RUT-0082)', tipo: 'EGRESO', valor: 14500, hora: '09:20 AM' }
  ];

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
          value="$1.240.000"
          change="12% vs ayer"
          positive={true}
          icon={<DollarSign size={18} color="#00B171" />}
        />
        <MetricCard
          title="Rutas Activas"
          value="4 Rutas"
          change="2 en despacho"
          positive={true}
          icon={<Truck size={18} color="#00B171" />}
        />
        <MetricCard
          title="Merma de Planta"
          value="18.4%"
          change="-2.1% esta semana"
          positive={true}
          icon={<Percent size={18} color="#00B171" />}
        />
        <MetricCard
          title="Gastos de Ruta"
          value="$124.500"
          change="4.8% del recaudo"
          positive={false}
          icon={<TrendingUp size={18} color="#EF4444" />}
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
              {transaccionesRecientes.map(tx => (
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
              ))}
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
