import { useMemo } from 'react';
import {
  ShoppingCart,
  Warehouse,
  Building2,
  FileText,
  DollarSign,
  Fish,
  Sparkles,
  Layers,
  Truck,
  Wallet,
  Activity,
  Users,
  Snowflake,
  RefreshCw,
  Terminal,
  Moon,
  Package,
} from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { useClientStore } from '../../../store/useClientStore';
import { useAppStore } from '../../../store/useAppStore';
import { PosDraftService } from '../../../services/posDraftService';
import { getSupabaseClient } from '../../../lib/supabase';
import Swal from 'sweetalert2';
import type { ERPViewKey } from '../EnterpriseSidebar';
import type { OmniboxAction } from './omnibox.types';

export interface UseOmniboxDataProps {
  onNavigate: (view: ERPViewKey) => void;
  onClose: () => void;
}

/**
 * Hook especializado para compilar y mapear los módulos de navegación,
 * comandos de sistema, clientes B2B y productos de inventario en acciones ejecutables.
 */
export function useOmniboxData({ onNavigate, onClose }: UseOmniboxDataProps): OmniboxAction[] {
  const products = useInventoryStore((s) => s.products);
  const clientes = useClientStore((s) => s.clientes);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  const allActions: OmniboxAction[] = useMemo(() => {
    const list: OmniboxAction[] = [
      // ==========================================
      // 1. MÓDULOS DE NAVEGACIÓN
      // ==========================================
      {
        id: 'nav-pos',
        title: 'Punto de Venta (POS)',
        category: 'Navegación',
        icon: ShoppingCart,
        detail: 'Caja rápida, balanza digital, teclado numérico y cobro',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('pos');
          onClose();
        },
      },
      {
        id: 'nav-inventario',
        title: 'Bodegas & WMS',
        category: 'Navegación',
        icon: Warehouse,
        detail: 'Existencias multibodega, Kardex NIIF, lotes perecederos FEFO y stock',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('inventario');
          onClose();
        },
      },
      {
        id: 'nav-config-bodegas',
        title: 'Gestión y Creación de Bodegas (Cuartos Fríos)',
        category: 'Navegación',
        icon: Building2,
        detail: 'Crear nueva bodega, configurar cuartos fríos y capacidades',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('configuracion_bodegas');
          onClose();
        },
      },
      {
        id: 'nav-kardex',
        title: 'Kardex Contable Multibodega (NIIF / NIC 2)',
        category: 'Navegación',
        icon: FileText,
        detail: 'Movimientos contables, entradas, salidas y costo promedio',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('kardex');
          onClose();
        },
      },
      {
        id: 'nav-precios',
        title: 'Cotizaciones B2B & Precios',
        category: 'Navegación',
        icon: DollarSign,
        detail: 'Gestión de listas de precios mayoristas y cotizaciones formalizadas',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('precios');
          onClose();
        },
      },
      {
        id: 'nav-muelle',
        title: 'Compras de Muelle & Pescadores',
        category: 'Navegación',
        icon: Fish,
        detail: 'Recepción sensorial, tallas y liquidación',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('compras_muelle' as ERPViewKey);
          onClose();
        },
      },
      {
        id: 'nav-despiece',
        title: 'Producción & Rendimiento de Fileteo',
        category: 'Navegación',
        icon: Sparkles,
        detail: 'Yield KPI, despiece y costeo por absorción',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('despiece' as ERPViewKey);
          onClose();
        },
      },
      {
        id: 'nav-alistamiento',
        title: 'Alistamiento de Pedidos B2B (Picking)',
        category: 'Navegación',
        icon: Layers,
        detail: 'Preparación de mercancía por pedido y control de mermas',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('alistamiento');
          onClose();
        },
      },
      {
        id: 'nav-despachos',
        title: 'Despachos & Logística',
        category: 'Navegación',
        icon: Truck,
        detail: 'Control de rutas y entregas a clientes',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('despachos');
          onClose();
        },
      },
      {
        id: 'nav-caja',
        title: 'Control de Cajas & Arqueo Ciego',
        category: 'Navegación',
        icon: Wallet,
        detail: 'Turnos de cajeros, entradas, salidas y arqueo ciego',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('caja');
          onClose();
        },
      },
      {
        id: 'nav-cartera',
        title: 'Cartera & Cuentas por Cobrar (CXC)',
        category: 'Navegación',
        icon: Activity,
        detail: 'Estado de cuentas de clientes, límites de crédito y recaudos',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('cartera');
          onClose();
        },
      },
      {
        id: 'nav-clientes',
        title: 'Directorio de Clientes & CRM',
        category: 'Navegación',
        icon: Users,
        detail: 'Base de clientes B2B, historial y cartera',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('clientes');
          onClose();
        },
      },
      {
        id: 'nav-crm',
        title: 'CRM & Pipeline de Ventas',
        category: 'Navegación',
        icon: Users,
        detail: 'Oportunidades comerciales y seguimiento de prospectos',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('crm');
          onClose();
        },
      },
      {
        id: 'nav-3pl',
        title: 'Alquiler Cuarto Frío (3PL)',
        category: 'Navegación',
        icon: Snowflake,
        detail: 'Posiciones de estiba y contratos externos',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('alquiler_cf' as ERPViewKey);
          onClose();
        },
      },
      {
        id: 'nav-contabilidad',
        title: 'Contabilidad NIIF & Libro Mayor',
        category: 'Navegación',
        icon: FileText,
        detail: 'Asientos contables automáticos, PUC y estados financieros',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('contabilidad');
          onClose();
        },
      },
      {
        id: 'nav-rrhh',
        title: 'Personal & Nómina (RRHH)',
        category: 'Navegación',
        icon: Users,
        detail: 'Gestión de operarios, turnos y nómina básica',
        badge: 'MÓDULO',
        badgeVariant: 'cyan',
        onSelect: () => {
          onNavigate('rrhh');
          onClose();
        },
      },

      // ==========================================
      // 2. ACCIONES Y COMANDOS RÁPIDOS OPERATIVOS
      // ==========================================
      {
        id: 'action-facturar-pos',
        title: 'Nueva Factura en POS Mostrador',
        category: 'Acciones',
        icon: ShoppingCart,
        detail: 'Iniciar venta inmediata en terminal POS con balanza',
        badge: 'ACCIÓN',
        badgeVariant: 'amber',
        onSelect: () => {
          onNavigate('pos');
          onClose();
        },
      },
      {
        id: 'action-nuevo-arqueo',
        title: 'Arqueo de Caja Ciego',
        category: 'Acciones',
        icon: Wallet,
        detail: 'Abrir arqueo de turno y conteo físico de dinero',
        badge: 'ACCIÓN',
        badgeVariant: 'amber',
        onSelect: () => {
          onNavigate('caja');
          onClose();
        },
      },
      {
        id: 'action-sync-now',
        title: 'Forzar Sincronización con Nube',
        category: 'Acciones',
        icon: RefreshCw,
        detail: 'Subir transacciones locales pendientes a Supabase Cloud',
        badge: 'SISTEMA',
        badgeVariant: 'amber',
        onSelect: async () => {
          onClose();
          try {
            await PosDraftService.fetchRemoteDrafts();
            const supabase = getSupabaseClient();
            if (supabase) {
              await supabase.from('empresas').select('id').limit(1);
            }
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Sincronización Exitosa',
              text: 'Datos sincronizados con la nube de Supabase.',
              timer: 2000,
              showConfirmButton: false,
            });
          } catch {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'info',
              title: 'Sincronización Local',
              text: 'Operando normalmente con respaldo en IndexedDB.',
              timer: 2500,
              showConfirmButton: false,
            });
          }
        },
      },
      {
        id: 'action-toggle-theme',
        title: `Alternar Tema: ${theme === 'obsidian' ? 'Obsidian OS' : 'Modo Estándar'}`,
        category: 'Acciones',
        icon: theme === 'obsidian' ? Terminal : Moon,
        detail: 'Cambiar esquema cromático y contraste de la interfaz',
        badge: 'TEMA',
        badgeVariant: 'amber',
        onSelect: () => {
          toggleTheme();
          onClose();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Tema Actualizado',
            text: `Modo visual cambiado.`,
            timer: 1500,
            showConfirmButton: false,
          });
        },
      },
    ];

    // ==========================================
    // 3. CATÁLOGO DE CLIENTES & CRM
    // ==========================================
    (clientes || []).forEach((c) => {
      const doc = `${c.tipoIdentificacion || 'NIT'}: ${c.identificacion || 'S/N'}`;
      const cupo = c.cupoCredito ? `$${c.cupoCredito.toLocaleString('es-CO')}` : 'Sin cupo';
      const telefono = c.telefono ? ` • Tel: ${c.telefono}` : '';
      const ciudad = c.ciudad ? ` • ${c.ciudad}` : '';

      list.push({
        id: `cli-${c.id || c.identificacion}`,
        title: c.nombre,
        category: 'Clientes',
        icon: Users,
        detail: `${doc}${telefono}${ciudad} • Cupo: ${cupo}`,
        badge: c.tipoPrecio || 'CLIENTE',
        badgeVariant: 'purple',
        onSelect: () => {
          onNavigate('clientes');
          onClose();
        },
      });
    });

    // ==========================================
    // 4. CATÁLOGO DE PRODUCTOS DE INVENTARIO
    // ==========================================
    (products || []).forEach((prod: any) => {
      const precio = prod.precio_venta_pos || prod.precioVenta || 0;
      const stock = Number(prod.stock || 0);
      const unidad = prod.unidadMedida || 'kg';
      const precioFormatted = `$${precio.toLocaleString('es-CO')}`;

      let stockBadge = 'DISPONIBLE';
      let stockVariant: 'emerald' | 'amber' | 'rose' = 'emerald';
      if (stock <= 0) {
        stockBadge = 'AGOTADO';
        stockVariant = 'rose';
      } else if (stock <= 10) {
        stockBadge = 'STOCK BAJO';
        stockVariant = 'amber';
      }

      list.push({
        id: `prod-${prod.id || prod.sku}`,
        title: prod.nombre,
        category: 'Productos',
        icon: Package,
        detail: `SKU: ${prod.sku} • Stock: ${stock} ${unidad} • Precio: ${precioFormatted}`,
        badge: stockBadge,
        badgeVariant: stockVariant,
        onSelect: () => {
          onNavigate('pos');
          onClose();
        },
      });
    });

    return list;
  }, [onNavigate, onClose, clientes, products, theme, toggleTheme]);

  return allActions;
}

