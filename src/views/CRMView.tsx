import { useState, useEffect } from 'react';
import { 
  Building2, Users, PieChart, Plus, Search, Filter, 
  MoreVertical, Mail, Phone, MapPin, ChevronRight,
  KanbanSquare
} from 'lucide-react';
import Swal from 'sweetalert2';
import { twentyCompanies, twentyContacts, twentyOpportunities, hasTwentyApiKey } from '../services/twentyClient';

interface CRMViewProps {
  currentActor: string;
}

type TabType = 'COMPANIES' | 'CONTACTS' | 'OPPORTUNITIES';

export default function CRMView({ currentActor }: CRMViewProps) {
  useEffect(() => {
    if (currentActor) console.debug('CRM View loaded for:', currentActor);
  }, [currentActor]);

  const [activeTab, setActiveTab] = useState<TabType>('OPPORTUNITIES');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const mockCompanies = [
    { id: '1', name: 'Restaurante Central', domainName: 'restaurantecentral.com', employees: 45, city: 'Bogotá' },
    { id: '2', name: 'Pescadería La Playa', domainName: 'laplayapescaderia.com', employees: 12, city: 'Barranquilla' },
  ];

  const mockContacts = [
    { id: '1', name: { firstName: 'Martín', lastName: 'Gómez' }, email: 'compras@restaurantecentral.com', phones: ['+57 3151234567'], companyId: '1', jobTitle: 'Jefe de Compras' },
    { id: '2', name: { firstName: 'Carlos', lastName: 'Rojas' }, email: 'gerencia@laplayapescaderia.com', phones: ['+57 3009876543'], companyId: '2', jobTitle: 'Gerente' },
  ];

  const mockOpportunities = [
    { id: '1', name: 'Cotización 50kg Corvina', amount: 1500000, stage: 'NEW', closeDate: '2026-06-20', companyId: '1' },
    { id: '2', name: 'Provisión Mensual Mariscos', amount: 4500000, stage: 'NEGOTIATION', closeDate: '2026-06-25', companyId: '2' },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (hasTwentyApiKey()) {
        if (activeTab === 'COMPANIES') {
          const res = await twentyCompanies.list();
          setCompanies(res.data?.companies?.edges?.map((e: any) => e.node) || mockCompanies);
        } else if (activeTab === 'CONTACTS') {
          const res = await twentyContacts.list();
          setContacts(res.data?.people?.edges?.map((e: any) => e.node) || mockContacts);
        } else {
          const res = await twentyOpportunities.list();
          setOpportunities(res.data?.opportunities?.edges?.map((e: any) => e.node) || mockOpportunities);
        }
      } else {
        setCompanies(mockCompanies);
        setContacts(mockContacts);
        setOpportunities(mockOpportunities);
      }
    } catch (error) {
      console.error("Error conectando con Twenty API", error);
      setCompanies(mockCompanies);
      setContacts(mockContacts);
      setOpportunities(mockOpportunities);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    Swal.fire({
      title: `Nuevo ${activeTab === 'COMPANIES' ? 'Empresa' : activeTab === 'CONTACTS' ? 'Contacto' : 'Oportunidad'}`,
      text: 'Esta función abrirá el modal de creación sincronizado con Twenty CRM.',
      icon: 'info',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#2563eb'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', width: '100%', height: '100%', overflowY: 'auto' }}>
      {/* HEADER */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        backgroundColor: 'white', padding: '24px', borderRadius: '16px', 
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)',
        flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <PieChart color="#2563eb" size={28} />
            Gestión CRM 
            <span style={{ fontSize: '12px', fontWeight: 500, backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 8px', borderRadius: '9999px', marginLeft: '8px' }}>
              Powered by Twenty
            </span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Administra empresas, contactos y el pipeline de ventas corporativas.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleCreate}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', 
              backgroundColor: '#2563eb', color: 'white', borderRadius: '12px', 
              fontWeight: 500, border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Plus size={20} />
            Crear Registro
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'max-content' }}>
        {[
          { id: 'OPPORTUNITIES', icon: <KanbanSquare size={18} />, label: 'Oportunidades' },
          { id: 'COMPANIES', icon: <Building2 size={18} />, label: 'Empresas (B2B)' },
          { id: 'CONTACTS', icon: <Users size={18} />, label: 'Contactos' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
              borderRadius: '8px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#1d4ed8' : '#64748b',
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TOOLBAR */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
          <input 
            type="text" 
            placeholder={`Buscar en ${activeTab.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '10px 16px 10px 40px', backgroundColor: 'white', 
              border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', fontSize: '14px' 
            }}
          />
        </div>
        <button style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', 
          backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#334155', 
          borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' 
        }}>
          <Filter size={18} />
          Filtros Avanzados
        </button>
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          {activeTab === 'COMPANIES' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empresa</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dominio</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ubicación</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empleados</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr 
                      key={c.id} 
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                      onClick={() => {
                        Swal.fire({
                          title: `Detalle Empresa`,
                          html: `<b>${c.name}</b><br>Dominio: ${c.domainName}<br>Ubicación: ${c.city}<br>Empleados: ${c.employees || '-'}`,
                          icon: 'info',
                          confirmButtonText: 'Cerrar',
                          confirmButtonColor: '#2563eb'
                        });
                      }}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.name}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {c.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#2563eb' }}>{c.domainName}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} /> {c.city}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>{c.employees || '-'}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button style={{ color: '#94a3b8', padding: '8px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>No hay empresas registradas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'CONTACTS' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cargo</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teléfono</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr 
                      key={c.id} 
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                      onClick={() => {
                        Swal.fire({
                          title: `Detalle Contacto`,
                          html: `<b>${c.name.firstName} ${c.name.lastName}</b><br>Cargo: ${c.jobTitle || 'N/A'}<br>Email: ${c.email}<br>Teléfono: ${c.phones?.[0] || 'N/A'}`,
                          icon: 'info',
                          confirmButtonText: 'Cerrar',
                          confirmButtonColor: '#2563eb'
                        });
                      }}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {c.name.firstName?.charAt(0)}{c.name.lastName?.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.name.firstName} {c.name.lastName}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>{c.jobTitle || 'N/A'}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Mail size={14} color="#94a3b8" /> {c.email}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Phone size={14} color="#94a3b8" /> {c.phones?.[0] || 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button style={{ color: '#94a3b8', padding: '8px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                          <MoreVertical size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {contacts.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>No hay contactos registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'OPPORTUNITIES' && (
            <div style={{ padding: '24px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
                {['NEW', 'NEGOTIATION', 'WON', 'LOST'].map(stage => {
                  const stageOps = opportunities.filter(o => o.stage === stage);
                  
                  const stageStyles: Record<string, { bg: string, color: string, border: string, label: string }> = {
                    'NEW': { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe', label: 'Nuevas' },
                    'NEGOTIATION': { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'En Negociación' },
                    'WON': { bg: '#d1fae5', color: '#047857', border: '#a7f3d0', label: 'Ganadas' },
                    'LOST': { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca', label: 'Perdidas' }
                  };

                  return (
                    <div key={stage} style={{ flex: '1', minWidth: '300px', backgroundColor: '#f1f5f9', borderRadius: '16px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                        <h3 style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '15px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: stageStyles[stage].bg, border: `1px solid ${stageStyles[stage].border}` }}></div>
                          {stageStyles[stage].label}
                          <span style={{ fontSize: '12px', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '9999px', color: '#475569', marginLeft: '4px' }}>
                            {stageOps.length}
                          </span>
                        </h3>
                        <button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}><Plus size={18} /></button>
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {stageOps.map(op => (
                          <div 
                            key={op.id} 
                            onClick={() => {
                              Swal.fire({
                                title: `Detalle Oportunidad`,
                                html: `<b>${op.name}</b><br>Monto: $${op.amount?.toLocaleString() || '0'}<br>Cierre: ${new Date(op.closeDate).toLocaleDateString()}`,
                                icon: 'info',
                                confirmButtonText: 'Cerrar',
                                confirmButtonColor: '#2563eb'
                              });
                            }}
                            style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <h4 style={{ fontWeight: 500, color: '#1e293b', margin: 0, fontSize: '14px' }}>{op.name}</h4>
                              <button 
                                style={{ color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreate();
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#334155', marginBottom: '12px' }}>
                              ${op.amount?.toLocaleString() || '0'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Building2 size={12}/> {companies.find(c => c.id === op.companyId)?.name || 'Empresa'}
                              </span>
                              <span>{new Date(op.closeDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                        {stageOps.length === 0 && (
                          <div style={{ height: '96px', border: '2px dashed #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#94a3b8' }}>
                            Sin oportunidades
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
