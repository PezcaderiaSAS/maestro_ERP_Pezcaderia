import { useState, useEffect } from 'react';
import { Menu, LayoutDashboard, ShoppingBag, Box, Users, DollarSign, HelpCircle, Home, ShoppingCart, LogOut, FileText, PlusCircle, Wallet } from 'lucide-react';
import DashboardView from './views/DashboardView.tsx';
import POSView from './views/POSView.tsx';
import InventoryView from './views/InventoryView.tsx';
import HRView from './views/HRView.tsx';
import PricingView from './views/PricingView.tsx';
import ARView, { InvoiceAR } from './views/ARView.tsx';


export interface Product {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  precio_compra: number;
  buffer_seguridad: number;
  precio_venta_pos: number;
  precio_venta_restaurante: number;
  precio_venta_mayorista: number;
  imagen?: string;
  activo: boolean;
  metadata?: Record<string, string>;
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    sku: 'PES-ENT-001',
    nombre: 'PESCADO ENTERO (MATERIA PRIMA)',
    categoria: 'MATERIA PRIMA',
    precio_compra: 12000,
    buffer_seguridad: 5,
    precio_venta_pos: 18000,
    precio_venta_restaurante: 16800,
    precio_venta_mayorista: 15000,
    activo: true
  },
  {
    id: 'p-2',
    sku: 'FIL-LIM-002',
    nombre: 'FILETE LIMPIO (TERMINADO)',
    categoria: 'PESCADOS',
    precio_compra: 22000,
    buffer_seguridad: 10,
    precio_venta_pos: 35000,
    precio_venta_restaurante: 32000,
    precio_venta_mayorista: 29000,
    activo: true
  },
  {
    id: 'p-3',
    sku: 'CAM-TIG-003',
    nombre: 'CAMARÓN TIGRE (TERMINADO)',
    categoria: 'MARISCOS',
    precio_compra: 35000,
    buffer_seguridad: 12,
    precio_venta_pos: 55000,
    precio_venta_restaurante: 51000,
    precio_venta_mayorista: 46000,
    activo: true
  },
  {
    id: 'p-4',
    sku: 'BAT-001',
    nombre: 'BATIDO AMARILLO',
    categoria: 'BATIDOS',
    precio_compra: 3000,
    buffer_seguridad: 0,
    precio_venta_pos: 8000,
    precio_venta_restaurante: 7200,
    precio_venta_mayorista: 6500,
    imagen: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-5',
    sku: 'BAT-002',
    nombre: 'BATIDO CÍTRICO',
    categoria: 'BATIDOS',
    precio_compra: 3000,
    buffer_seguridad: 0,
    precio_venta_pos: 8000,
    precio_venta_restaurante: 7200,
    precio_venta_mayorista: 6500,
    imagen: 'https://images.unsplash.com/photo-1623065422902-30a2ad4dc9b5?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-6',
    sku: 'BAT-003',
    nombre: 'BATIDO NARANJA',
    categoria: 'BATIDOS',
    precio_compra: 3000,
    buffer_seguridad: 0,
    precio_venta_pos: 8000,
    precio_venta_restaurante: 7200,
    precio_venta_mayorista: 6500,
    imagen: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-7',
    sku: 'BAT-004',
    nombre: 'BATIDO VERDE',
    categoria: 'BATIDOS',
    precio_compra: 3000,
    buffer_seguridad: 0,
    precio_venta_pos: 8000,
    precio_venta_restaurante: 7200,
    precio_venta_mayorista: 6500,
    imagen: 'https://images.unsplash.com/photo-1610970881699-44a5587caa90?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-8',
    sku: 'BAT-005',
    nombre: 'BATIDO ROJO',
    categoria: 'BATIDOS',
    precio_compra: 3000,
    buffer_seguridad: 0,
    precio_venta_pos: 8000,
    precio_venta_restaurante: 7200,
    precio_venta_mayorista: 6500,
    imagen: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-9',
    sku: 'BEB-001',
    nombre: 'JUGO DE MANDARINA',
    categoria: 'BEBIDAS',
    precio_compra: 2000,
    buffer_seguridad: 0,
    precio_venta_pos: 5000,
    precio_venta_restaurante: 4500,
    precio_venta_mayorista: 4000,
    imagen: 'https://images.unsplash.com/photo-1522012147041-30a112008767?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-10',
    sku: 'BEB-002',
    nombre: 'JUGO DE GUANÁBANA',
    categoria: 'BEBIDAS',
    precio_compra: 2000,
    buffer_seguridad: 0,
    precio_venta_pos: 5000,
    precio_venta_restaurante: 4500,
    precio_venta_mayorista: 4000,
    imagen: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-11',
    sku: 'ENS-001',
    nombre: 'ENSALADA VERDE',
    categoria: 'ENSALADAS',
    precio_compra: 4500,
    buffer_seguridad: 5,
    precio_venta_pos: 12000,
    precio_venta_restaurante: 10800,
    precio_venta_mayorista: 9500,
    imagen: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-12',
    sku: 'ENS-002',
    nombre: 'ENSALADA DE AGUACATE',
    categoria: 'ENSALADAS',
    precio_compra: 5000,
    buffer_seguridad: 5,
    precio_venta_pos: 13000,
    precio_venta_restaurante: 11700,
    precio_venta_mayorista: 10000,
    imagen: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-13',
    sku: 'ENS-003',
    nombre: 'ENSALADA DE COLORES',
    categoria: 'ENSALADAS',
    precio_compra: 4500,
    buffer_seguridad: 5,
    precio_venta_pos: 12000,
    precio_venta_restaurante: 10800,
    precio_venta_mayorista: 9500,
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-14',
    sku: 'ENS-004',
    nombre: 'ENSALADA DE POLLO',
    categoria: 'ENSALADAS',
    precio_compra: 4500,
    buffer_seguridad: 5,
    precio_venta_pos: 12000,
    precio_venta_restaurante: 10800,
    precio_venta_mayorista: 9500,
    imagen: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-15',
    sku: 'ENT-001',
    nombre: 'CANELONE DE PUERRO',
    categoria: 'ENTRADAS',
    precio_compra: 5000,
    buffer_seguridad: 5,
    precio_venta_pos: 13000,
    precio_venta_restaurante: 11700,
    precio_venta_mayorista: 10000,
    imagen: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-16',
    sku: 'ENT-002',
    nombre: 'ESTOFADO DE LENTEJAS',
    categoria: 'ENTRADAS',
    precio_compra: 4000,
    buffer_seguridad: 5,
    precio_venta_pos: 12000,
    precio_venta_restaurante: 10800,
    precio_venta_mayorista: 9500,
    imagen: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  },
  {
    id: 'p-17',
    sku: 'GEN-001',
    nombre: 'HAMBURGUESA DE GARBANZO',
    categoria: 'GENERAL',
    precio_compra: 6000,
    buffer_seguridad: 8,
    precio_venta_pos: 15000,
    precio_venta_restaurante: 13500,
    precio_venta_mayorista: 12000,
    imagen: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    activo: true
  }
];

export interface DomainEvent {
  id: string;
  timestamp: string;
  tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED';
  actor: string;
  descripcion: string;
  metadata?: any;
}

export interface SyncJob {
  id: string;
  eventTipo: string;
  payload: any;
  estado: 'PENDIENTE' | 'SINCRONIZADO' | 'FALLO';
  intentos: number;
  timestamp: string;
}

export interface DynamicField {
  key: string;
  label: string;
  tipo: 'text' | 'number';
  defaultValue: string;
}

export default function App() {
  const [userRole, setUserRole] = useState<'admin' | 'vendedor' | 'bodega' | 'administrativo'>('admin');
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Products state (loaded from local storage or pre-populated with metadata)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pezcaderia_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_PRODUCTS.map(p => {
      let grp = 'General';
      if (p.categoria === 'MATERIA PRIMA') grp = 'Materia Prima';
      else if (p.categoria === 'PESCADOS') grp = 'Pescado Blanco';
      else if (p.categoria === 'MARISCOS') grp = 'Camarones';
      else if (p.categoria === 'BATIDOS') grp = 'Batidos Saludables';
      else if (p.categoria === 'BEBIDAS') grp = 'Jugos Naturales';
      else if (p.categoria === 'ENSALADAS') grp = 'Ensaladas Frescas';
      else if (p.categoria === 'ENTRADAS') grp = 'Entradas';
      return {
        ...p,
        metadata: p.metadata || { categoria_descriptiva: grp }
      };
    });
  });

  // Save products to localStorage on change
  useEffect(() => {
    localStorage.setItem('pezcaderia_products', JSON.stringify(products));
  }, [products]);

  // Role persistent loading
  useEffect(() => {
    const savedRole = localStorage.getItem('pezcaderia_role');
    if (savedRole) {
      setUserRole(savedRole as any);
    }
  }, []);

  const handleSetUserRole = (role: 'admin' | 'vendedor' | 'bodega' | 'administrativo') => {
    setUserRole(role);
    localStorage.setItem('pezcaderia_role', role);
  };

  // Other dynamic states
  const [events, setEvents] = useState<DomainEvent[]>(() => {
    const saved = localStorage.getItem('pezcaderia_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [syncQueue, setSyncQueue] = useState<SyncJob[]>(() => {
    const saved = localStorage.getItem('pezcaderia_sync_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>(() => {
    const saved = localStorage.getItem('pezcaderia_dynamic_fields');
    return saved ? JSON.parse(saved) : [
      {
        key: 'categoria_descriptiva',
        label: 'Categoría Descriptiva (Grupo)',
        tipo: 'text',
        defaultValue: 'General'
      }
    ];
  });

  const [quotations, setQuotations] = useState<any[]>(() => {
    const saved = localStorage.getItem('pezcaderia_quotations');
    return saved ? JSON.parse(saved) : [];
  });

  const [stock, setStock] = useState<Record<string, any[]>>(() => {
    const saved = localStorage.getItem('pezcaderia_stock');
    return saved ? JSON.parse(saved) : {};
  });

  const [lastClientPrices, setLastClientPrices] = useState<Record<string, Record<string, number>>>(() => {
    const saved = localStorage.getItem('pezcaderia_last_client_prices');
    return saved ? JSON.parse(saved) : {};
  });

  const [cartera, setCartera] = useState<InvoiceAR[]>(() => {
    const saved = localStorage.getItem('pezcaderia_cartera');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'PED-045091',
        clienteId: 'c-1',
        clienteNombre: 'Restaurante Central',
        clienteIdentificacion: '123',
        fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        total: 350000,
        saldo: 200000,
        pagado: 150000,
        pagos: [
          {
            id: 'pgo-1',
            fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            monto: 150000,
            metodo: 'Transferencia'
          }
        ]
      },
      {
        id: 'PED-098231',
        clienteId: 'c-2',
        clienteNombre: 'Restaurante del Mar',
        clienteIdentificacion: '900123456-1',
        fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        total: 500000,
        saldo: 500000,
        pagado: 0,
        pagos: []
      }
    ];
  });

  // Save changes to local storage on change
  useEffect(() => {
    localStorage.setItem('pezcaderia_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('pezcaderia_sync_queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  useEffect(() => {
    localStorage.setItem('pezcaderia_dynamic_fields', JSON.stringify(dynamicFields));
  }, [dynamicFields]);

  useEffect(() => {
    localStorage.setItem('pezcaderia_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('pezcaderia_stock', JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem('pezcaderia_last_client_prices', JSON.stringify(lastClientPrices));
  }, [lastClientPrices]);

  useEffect(() => {
    localStorage.setItem('pezcaderia_cartera', JSON.stringify(cartera));
  }, [cartera]);

  // Synchronize stock based on current products catalog
  useEffect(() => {
    setStock(prev => {
      const newStock = { ...prev };
      const bodegas = ['Bodega Principal', 'Bodega Secundaria', 'Bodega Averías'];
      
      bodegas.forEach(bodega => {
        if (!newStock[bodega]) {
          newStock[bodega] = [];
        }
        
        // Agregar productos faltantes
        const currentSkus = new Set(newStock[bodega].map((item: any) => item.sku));
        products.forEach(p => {
          if (!currentSkus.has(p.sku)) {
            let qty = 0;
            if (bodega === 'Bodega Principal') {
              if (p.sku === 'PES-ENT-001') qty = 500;
              else if (p.sku === 'FIL-LIM-002') qty = 120;
              else if (p.sku === 'CAM-TIG-003') qty = 85;
            } else if (bodega === 'Bodega Secundaria') {
              if (p.sku === 'PES-ENT-001') qty = 200;
              else if (p.sku === 'FIL-LIM-002') qty = 45;
            } else if (bodega === 'Bodega Averías') {
              if (p.sku === 'FIL-LIM-002') qty = 12;
            }
            
            newStock[bodega].push({
              sku: p.sku,
              nombre: p.nombre,
              stock: qty,
              lote: `LOT-2026-${p.sku.slice(0, 3)}-${bodega.slice(7, 10).toUpperCase()}`
            });
          }
        });

        // Actualizar nombres y filtrar productos obsoletos
        newStock[bodega] = newStock[bodega].map((item: any) => {
          const matched = products.find(p => p.sku === item.sku);
          if (matched) {
            return { ...item, nombre: matched.nombre };
          }
          return item;
        }).filter((item: any) => products.some(p => p.sku === item.sku));
      });

      return newStock;
    });
  }, [products]);

  const updateLastClientPrice = (clientKey: string, sku: string, price: number) => {
    setLastClientPrices(prev => {
      const clientKeyNormalized = clientKey.trim().toLowerCase();
      const updated = {
        ...prev,
        [clientKeyNormalized]: {
          ...(prev[clientKeyNormalized] || {}),
          [sku]: price
        }
      };
      return updated;
    });
  };


  // Publish dynamic event
  const publishEvent = (
    tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED',
    actor: string,
    descripcion: string,
    metadata?: any,
    enqueueSync = true
  ) => {
    const newEvent: DomainEvent = {
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      tipo,
      actor,
      descripcion,
      metadata
    };
    setEvents(prev => [newEvent, ...prev]);

    if (enqueueSync) {
      const newSyncJob: SyncJob = {
        id: 'job-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        eventTipo: tipo,
        payload: { newEvent },
        estado: 'PENDIENTE',
        intentos: 0,
        timestamp: new Date().toISOString()
      };
      setSyncQueue(prev => [newSyncJob, ...prev]);
    }
  };

  // Background processor for simulated resilient outbox integration queue (metasfresh style)
  useEffect(() => {
    const pendingJobs = syncQueue.filter(j => j.estado === 'PENDIENTE');
    if (pendingJobs.length === 0) return;

    // FIFO processing
    const jobToProcess = pendingJobs[pendingJobs.length - 1];

    const timer = setTimeout(() => {
      const isSuccess = Math.random() < 0.8; // 80% success rate
      
      setSyncQueue(prev =>
        prev.map(j => {
          if (j.id === jobToProcess.id) {
            return {
              ...j,
              intentos: j.intentos + 1,
              estado: isSuccess ? 'SINCRONIZADO' : 'FALLO'
            };
          }
          return j;
        })
      );

      if (!isSuccess) {
        publishEvent(
          'METADATA_CONFIGURED',
          'System Worker',
          `Fallo de red al sincronizar job ${jobToProcess.id} para Siigo (Intento ${jobToProcess.intentos + 1})`,
          null,
          false
        );
      } else {
        publishEvent(
          'METADATA_CONFIGURED',
          'System Worker',
          `Sincronización exitosa de ${jobToProcess.eventTipo} en Siigo`,
          null,
          false
        );
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [syncQueue]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', userRole);
  }, [userRole]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            setView={setCurrentView}
            events={events}
            setEvents={setEvents}
            syncQueue={syncQueue}
            setSyncQueue={setSyncQueue}
            dynamicFields={dynamicFields}
            setDynamicFields={setDynamicFields}
            products={products}
            setProducts={setProducts}
            publishEvent={publishEvent}
          />
        );
      case 'pos':
        return (
          <POSView 
            products={products} 
            dynamicFields={dynamicFields}
            publishEvent={publishEvent}
            userRole={userRole}
            stock={stock}
            setStock={setStock}
            lastClientPrices={lastClientPrices}
            updateLastClientPrice={updateLastClientPrice}
            setCartera={setCartera}
          />
        );
      case 'inventario':
        return (
          <InventoryView 
            products={products} 
            setProducts={setProducts} 
            stock={stock}
            setStock={setStock}
          />
        );
      case 'precios':
        return (
          <PricingView 
            products={products} 
            setProducts={setProducts} 
            quotations={quotations}
            setQuotations={setQuotations}
            publishEvent={publishEvent}
            userRole={userRole}
            stock={stock}
            setStock={setStock}
            lastClientPrices={lastClientPrices}
            updateLastClientPrice={updateLastClientPrice}
          />
        );
      case 'rrhh':
        return <HRView />;
      case 'cartera':
        return (
          <ARView 
            cartera={cartera}
            setCartera={setCartera}
            publishEvent={publishEvent}
            userRole={userRole}
          />
        );
      default:
        return <DashboardView setView={setCurrentView} />;
    }
  };

  const getBreadcrumbs = () => {
    switch (currentView) {
      case 'dashboard':
        return { cat: 'Administrativo', sub: 'Panel de Control' };
      case 'pos':
        return { cat: 'Comercial', sub: 'Punto de Venta (POS)' };
      case 'inventario':
        return { cat: 'Inventario y Planta', sub: 'Bodegas y Producción' };
      case 'precios':
        return { cat: 'Comercial', sub: 'Precios y Cotizaciones' };
      case 'rrhh':
        return { cat: 'Administrativo', sub: 'Recursos Humanos' };
      case 'cartera':
        return { cat: 'Comercial', sub: 'Cartera de Clientes' };
      default:
        return { cat: 'General', sub: 'ERP' };
    }
  };

  return (
    <div className="spa-container">
      {/* Top Navbar */}
      <header className="top-navbar">
        <div className="navbar-left">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: 'white', marginRight: '10px' }}>
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>🐟 La Pezcadería</span>
            <button className="navbar-icon-btn" onClick={() => setCurrentView('pos')}>
              <PlusCircle size={18} />
            </button>
          </div>
          
          <div className="breadcrumbs" style={{ marginLeft: '24px' }}>
            <span>{getBreadcrumbs().cat}</span>
            <span>&gt;</span>
            <span className="breadcrumbs-current">{getBreadcrumbs().sub}</span>
          </div>
        </div>

        <div className="navbar-right">
          <span className="navbar-company">PEZCADERIA S.A.S</span>
          <button className="navbar-icon-btn" title="Ayuda">
            <HelpCircle size={18} />
          </button>
          <button className="navbar-icon-btn" title="Inicio" onClick={() => setCurrentView('dashboard')}>
            <Home size={18} />
          </button>
          <button className="navbar-cart-btn" onClick={() => setCurrentView('pos')}>
            <ShoppingCart size={16} />
            <span>Facturar</span>
          </button>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '14px', border: '1px solid rgba(255,255,255,0.4)'
          }}>
            Yu
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="spa-body">
        {/* Sidebar Navigation */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          {/* User Profile Card */}
          <div className="sidebar-profile-card">
            <div className="orange-avatar">Yu</div>
            <div className="sidebar-profile-info">
              <span className="sidebar-profile-name">Yurgen Moreno</span>
              <select 
                className="sidebar-profile-role-select" 
                value={userRole} 
                onChange={(e) => handleSetUserRole(e.target.value as any)}
              >
                <option value="admin">Super administrador</option>
                <option value="vendedor">Vendedor</option>
                <option value="bodega">Jefe de bodega</option>
                <option value="administrativo">Administrativo</option>
              </select>
            </div>
          </div>

          {/* Quick billing button */}
          <button className="sidebar-btn-facturar" onClick={() => setCurrentView('pos')}>
            <FileText size={18} />
            <span>Facturar</span>
          </button>

          {/* Categories and links */}
          <nav className="sidebar-menu">
            <div className="sidebar-category-header">Comercial</div>
            <div
              className={`sidebar-item ${currentView === 'pos' ? 'active' : ''}`}
              onClick={() => { setCurrentView('pos'); setSidebarOpen(false); }}
            >
              <ShoppingBag size={16} />
              <span>Punto de Venta (POS)</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'precios' ? 'active' : ''}`}
              onClick={() => { setCurrentView('precios'); setSidebarOpen(false); }}
            >
              <DollarSign size={16} />
              <span>Precios y Cotizaciones</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'cartera' ? 'active' : ''}`}
              onClick={() => { setCurrentView('cartera'); setSidebarOpen(false); }}
            >
              <Wallet size={16} />
              <span>Cartera de Clientes</span>
            </div>

            <div className="sidebar-category-header">Inventario y Planta</div>
            <div
              className={`sidebar-item ${currentView === 'inventario' ? 'active' : ''}`}
              onClick={() => { setCurrentView('inventario'); setSidebarOpen(false); }}
            >
              <Box size={16} />
              <span>Bodegas y Producción</span>
            </div>

            <div className="sidebar-category-header">Administrativo</div>
            <div
              className={`sidebar-item ${currentView === 'rrhh' ? 'active' : ''}`}
              onClick={() => { setCurrentView('rrhh'); setSidebarOpen(false); }}
            >
              <Users size={16} />
              <span>Recursos Humanos</span>
            </div>

            <div
              className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }}
            >
              <LayoutDashboard size={16} />
              <span>Panel de Control</span>
            </div>
          </nav>

          {/* Log out */}
          <button className="sidebar-btn-exit" onClick={() => alert('Cerrando sesión...')}>
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </aside>

        {/* View Content */}
        <div className="main-content">
          <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {renderView()}
          </main>
        </div>
      </div>
    </div>
  );
}
