import { ReactNode } from 'react';
import { DollarSign, ShoppingBag, PlusCircle, ArrowUpRight, Wallet, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { calculateDashboardMetrics } from '../services/metricsService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: ReactNode;
}

function MetricCard({ title, value, change, positive, icon }: MetricCardProps) {
  return (
    <Card glass style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary, #64748B)', fontWeight: 600 }}>{title}</span>
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
        <span style={{ fontSize: '12px', color: positive ? 'var(--success-color, #10B981)' : 'var(--error-color, #EF4444)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
          {positive ? '+' : ''}{change} <ArrowUpRight size={12} />
        </span>
      </div>
    </Card>
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      
      {/* Encabezado */}
      <div>
        <span style={{ fontSize: '14px', color: 'var(--text-secondary, #64748B)', fontWeight: 500 }}>Resumen Ejecutivo</span>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px', color: 'var(--primary-color)' }}>Panel de Control La Pezcadería</h2>
      </div>
 
      {/* Grid de Metricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <MetricCard
          title="Ventas del Día"
          value={`$${totalSalesToday.toLocaleString('es-CO')}`}
          change={`${salesTodayCount} transacciones`}
          positive={totalSalesToday > 0}
          icon={<DollarSign size={18} color="var(--success-color, #00B171)" />}
        />
        <MetricCard
          title="Caja Chica (Efectivo Neto)"
          value={`$${isolatedCajaFisica.toLocaleString('es-CO')}`}
          change="Excluye canales digitales (RN-06)"
          positive={true}
          icon={<Wallet size={18} color="var(--success-color, #00B171)" />}
        />
        <MetricCard
          title="Canales Digitales (Shopify/Rappi)"
          value={`$${totalDigitalSales.toLocaleString('es-CO')}`}
          change="Procesado en cola (RN-03)"
          positive={totalDigitalSales > 0}
          icon={<ShoppingBag size={18} color="var(--success-color, #00B171)" />}
        />
        <MetricCard
          title="Notas de Crédito Hoy"
          value={`$${totalDevoluciones.toLocaleString('es-CO')}`}
          change="Cancelaciones de pedido"
          positive={false}
          icon={<RefreshCw size={18} color="var(--error-color, #EF4444)" />}
        />
      </div>
 
      {/* Dashboard Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        
        {/* Izquierda: Historial de Transacciones */}
        <Card glass style={{ padding: '0' }}>
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Transacciones del Día</h3>
            <table className="hr-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>ID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>Descripción</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>Tipo</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>Hora</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid var(--border-color, #E2E8F0)' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {transaccionesRecientes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary, #64748B)' }}>
                      No se han registrado transacciones el día de hoy.
                    </td>
                  </tr>
                ) : (
                  transaccionesRecientes.map((tx: any) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(0, 255, 209, 0.1)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary, #64748B)' }}>{tx.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{tx.descripcion}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant={tx.tipo === 'INGRESO' ? 'success' : 'danger'}>
                          {tx.tipo}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary, #64748B)', fontSize: '13px' }}>{tx.hora}</td>
                      <td style={{
                        padding: '12px 16px', fontWeight: 700, textAlign: 'right',
                        color: tx.tipo === 'INGRESO' ? 'var(--success-color, #10B981)' : 'var(--error-color, #EF4444)'
                      }}>
                        {tx.tipo === 'INGRESO' ? '+' : '-'}${tx.valor.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
 
        {/* Derecha: Accesos Rápidos */}
        <Card glass style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>Operaciones Rápidas</h3>
          
          <Button 
            variant="primary" 
            onClick={() => setView('pos')}
            className="w-full justify-center p-4 text-base"
            icon={<ShoppingBag size={18} />}
          >
            Abrir Punto de Venta (POS)
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setView('inventario')}
            className="w-full justify-center p-4 text-base"
            icon={<PlusCircle size={18} />}
          >
            Iniciar Transformación
          </Button>
        </Card>
      </div>
    </div>
  );
}
