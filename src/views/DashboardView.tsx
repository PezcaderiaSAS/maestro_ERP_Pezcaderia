// src/views/DashboardView.tsx
import { ReactNode } from 'react';
import { DollarSign, ShoppingBag, PlusCircle, ArrowUpRight, Wallet, RefreshCw } from 'lucide-react';

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

export default function DashboardView({ setView, ventas = [], parametros: _parametros = {}, devoluciones = [] }: any) {
  const todayStr = new Date().toISOString().split('T')[0];
  const salesToday = ventas.filter((v: any) => v.fecha.startsWith(todayStr));
  
  // 1. Ventas del Día
  const totalSalesToday = salesToday.reduce((sum: number, v: any) => sum + v.total, 0);

  // 2. Caja Chica (Efectivo Neto en POS) - RN-06: Aislar canales digitales
  const isolatedCajaFisica = salesToday.reduce((sum: number, v: any) => {
    // Excluir si viene de un canal digital
    if (v.metadata?.canal) return sum;
    
    // Sumar el efectivo recibido neto del cambio entregado
    const efectivoRecibido = v.montoPagadoEfectivo || 0;
    const cambio = v.cambioEntregado || 0;
    return sum + Math.max(0, efectivoRecibido - cambio);
  }, 0);

  // 3. Ventas por Canales Digitales
  const totalDigitalSales = salesToday
    .filter((v: any) => v.metadata?.canal)
    .reduce((sum: number, v: any) => sum + v.total, 0);

  // 4. Devoluciones / Notas de Crédito
  const totalDevoluciones = devoluciones
    .filter((d: any) => d.fechaValidacion && d.fechaValidacion.startsWith(todayStr))
    .reduce((sum: number, d: any) => {
      const devAmount = (d.items || []).reduce((s: number, item: any) => {
        const qty = item.cantidadRecibida || 0;
        return s + qty * (item.precioUnitarioVenta || 0);
      }, 0);
      return sum + devAmount;
    }, 0);

  // Mapear transacciones recientes dinámicamente
  const transaccionesRecientes = ventas.slice(0, 5).map((v: any) => {
    const hora = new Date(v.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const esDigital = !!v.metadata?.canal;
    const desc = esDigital 
      ? `Pedido Digital (${v.metadata.canal.toUpperCase()}) - ${v.metadata.id_pedido_externo}` 
      : `Venta POS (${v.clienteNombre})`;
    return {
      id: v.id.slice(0, 10).toUpperCase(),
      descripcion: desc,
      tipo: 'INGRESO',
      valor: v.total,
      hora
    };
  });

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
          change={`${salesToday.length} transacciones`}
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
