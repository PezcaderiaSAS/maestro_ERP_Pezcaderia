import DashboardView from '../views/DashboardView';
import POSView from '../views/POSView';
import InventoryView from '../views/InventoryView';
import HRView from '../views/HRView';
import PricingView from '../views/PricingView';
import ARView from '../views/ARView';
import ClientsView from '../views/ClientsView';
import SuppliersView from '../views/SuppliersView';
import OrderKanbanView from '../views/OrderKanbanView';
import { CashierKanbanView } from '../views/pos/components/CashierKanbanView';
import PayrollView from '../views/PayrollView';
import CRMView from '../views/CRMView';
import CashFlowView from '../views/cash/CashFlowView';
import { AlistamientoBodegaView } from '../views/inventory/AlistamientoBodegaView';
import { DispatchView } from '../views/inventory/DispatchView';
import AccountingView from '../views/AccountingView';
import { ColdStorageRentalView } from '../views/coldStorageRental/ColdStorageRentalView';
import { B2BExternalSalesView } from '../views/b2b/B2BExternalSalesView';
import { PurchasesReceivingView } from '../views/purchases/PurchasesReceivingView';
import { DriverPortalView } from '../views/driver/DriverPortalView';
import { OtifDashboardView } from '../views/logistics/OtifDashboardView';
import { B2BCustomerPortalView } from '../views/b2b/portal/B2BCustomerPortalView';
import { SuperAdminMasterView } from '../views/admin/SuperAdminMasterView';
import { MostradorView } from '../views/mostrador/MostradorView';
import { PosDashboard } from '../components/pos/PosDashboard';
import { useAppStore } from '../store/useAppStore';

export interface AppRouterProps {
  handleCancelarPedidoDigital: (logId: string) => void;
  handleAprobarPedidoManual: (logId: string, modo: 'parcial' | 'forzar') => void;
}

/**
 * Enrutador declarativo de vistas del ERP.
 * Despacha de forma exhaustiva las 28 pantallas según `currentView` en `useAppStore`.
 */
export function AppRouter({ handleCancelarPedidoDigital, handleAprobarPedidoManual }: AppRouterProps) {
  const currentView = useAppStore((s) => s.currentView);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const userRole = useAppStore((s) => s.userRole);

  switch (currentView) {
    case 'dashboard':
      return <DashboardView />;
    case 'pos':
      return (
        <POSView
          handleCancelarPedidoDigital={handleCancelarPedidoDigital}
          handleAprobarPedidoManual={handleAprobarPedidoManual}
        />
      );
    case 'pos_offline':
      return <PosDashboard />;
    case 'inventario':
      return <InventoryView />;
    case 'configuracion_bodegas':
      return <InventoryView initialViewMode="configuracion_bodegas" />;
    case 'kardex':
      return <InventoryView initialViewMode="kardex" />;
    case 'compras_muelle':
      return <PurchasesReceivingView />;
    case 'despiece':
      return <InventoryView initialViewMode="despiece" />;
    case 'alistamiento':
      return <AlistamientoBodegaView />;
    case 'despachos':
      return <DispatchView />;
    case 'metricas_otif':
      return <OtifDashboardView />;
    case 'precios':
      return <PricingView />;
    case 'rrhh':
      return <HRView />;
    case 'nomina':
      return <PayrollView />;
    case 'cartera':
      return <ARView />;
    case 'clientes':
      return <ClientsView />;
    case 'compras':
      return <SuppliersView />;
    case 'comandas_kanban':
      return <CashierKanbanView />;
    case 'kanban':
      return (
        <OrderKanbanView
          onEditOrder={(quote) => {
            setCurrentView('pos');
            setTimeout(() => {
              const btn = document.getElementById(`quote-btn-${quote.id}`);
              if (btn) btn.click();
            }, 500);
          }}
        />
      );
    case 'crm':
      return <CRMView />;
    case 'caja':
      if (userRole === 'vendedor') {
        return <CashierKanbanView />;
      }
      return <CashFlowView />;
    case 'contabilidad':
      return <AccountingView />;
    case 'alquiler_cf':
      return <ColdStorageRentalView />;
    case 'ventas_b2b':
      return <B2BExternalSalesView onNavigateToKanban={() => setCurrentView('kanban')} />;
    case 'portal_b2b':
      return <B2BCustomerPortalView />;
    case 'repartidor':
      return <DriverPortalView />;
    case 'superadmin':
      return <SuperAdminMasterView />;
    case 'mostrador':
      return <MostradorView />;
    default:
      return <DashboardView />;
  }
}
