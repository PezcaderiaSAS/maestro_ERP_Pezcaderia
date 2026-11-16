import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';
import { useOrderStore } from './store/useOrderStore';
import { EnterpriseSidebar, type ERPViewKey } from './components/layout/EnterpriseSidebar';
import { EnterpriseTopbar } from './components/layout/EnterpriseTopbar';
import { getMainLayoutClasses } from './components/layout/layoutModes';
import { GlobalOmniboxModal } from './components/layout/GlobalOmniboxModal';
import { ConsentGateModal } from './components/legal/ConsentGateModal';
import { PwaUpdatePromptModal } from './components/pwa/PwaUpdatePromptModal';
import { DevTestDashboard } from './dev/DevTestDashboard';
import { DriverPortalView } from './views/driver/DriverPortalView';
import { LoginView } from './views/auth/LoginView';
import { AppRouter } from './routes/AppRouter';
import { useHashRouting } from './routes/useHashRouting';
import { useAppListeners } from './hooks/useAppListeners';
import { useDataBootstrapper } from './hooks/useDataBootstrapper';
import { useOutboxWorker } from './hooks/useOutboxWorker';
import { useDigitalOrdersIntegration } from './hooks/useDigitalOrdersIntegration';

// Re-exportaciones públicas para compatibilidad 100% hacia atrás
export { generateId, toTitleCase } from './lib/utils';
export type { Cliente, Proveedor, Conductor, DevolucionPedido, ProductCatalog, ProductPricing, Product, Venta, ItemVenta } from './types/erp.types';
export type { Empleado, NominaRegistro } from './store/useEmployeeStore';
export type { Gasto } from './store/useExpenseStore';
export type { CategoriaConfig } from './store/useCategoryStore';
export type { DomainEvent, SyncJob } from './store/useEventStore';
export type { DynamicField } from './store/useDynamicFieldStore';
export type { MovimientoInventario } from './store/useMovementStore';
export type { ItemOrdenCompra, OrdenCompra } from './store/usePurchaseStore';
export type { LogIntegracion } from './store/useIntegrationStore';
export { INITIAL_CLIENTS, INITIAL_PROVEEDORES, INITIAL_PRODUCTS, migrateProductsToCatalogAndPricing } from './data/appSeedData';

/**
 * Componente Raíz del ERP La Pezcadería.
 * Orquestador ultraligero que compone la infraestructura, autenticación, layout shell y enrutamiento.
 */
export default function App() {
  const authStatus = useAuthStore((s) => s.status);
  const authUser = useAuthStore((s) => s.currentUser);
  const initSession = useAuthStore((s) => s.initSession);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const {
    userRole,
    setUserRole,
    currentView,
    setCurrentView,
    sidebarOpen,
    toggleSidebar,
    theme,
    toggleTheme,
    setTheme,
  } = useAppStore();

  const quotations = useOrderStore((s) => s.quotations);
  const [isOmniboxOpen, setIsOmniboxOpen] = useState(false);
  const handleToggleOmnibox = useCallback(() => setIsOmniboxOpen((prev) => !prev), []);

  // Hooks orquestadores desacoplados (SRP)
  useHashRouting();
  useAppListeners({ onToggleOmnibox: handleToggleOmnibox });
  useDataBootstrapper();
  useOutboxWorker();
  const { handleCancelarPedidoDigital, handleAprobarPedidoManual } = useDigitalOrdersIntegration();

  // Modo PWA Standalone para Conductor / Repartidor Móvil
  if (currentView === 'repartidor') {
    return (
      <div className="w-screen h-screen overflow-y-auto bg-slate-950 font-sans select-none">
        <DriverPortalView />
        <ConsentGateModal />
        {import.meta.env.DEV && <DevTestDashboard />}
      </div>
    );
  }

  // Guardia de Autenticación SPEC-035 / SPEC-036
  if (authStatus === 'unauthenticated' || !authUser) {
    return (
      <div className="w-screen h-screen overflow-y-auto bg-[#070A10] font-sans select-none">
        <LoginView isDevMode={import.meta.env.DEV} />
        <ConsentGateModal />
        {import.meta.env.DEV && <DevTestDashboard />}
      </div>
    );
  }

  return (
    <div 
      className="flex h-screen w-screen overflow-hidden bg-[#070A10] text-slate-100 font-sans select-none relative" 
      style={{ backgroundColor: 'var(--bg-color, #070A10)', color: 'var(--text-primary, #F8FAFC)' }}
    >
      {/* Mesh Gradients de Fondo (Depth Field) */}
      <div 
        aria-hidden="true" 
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" 
      />
      <div 
        aria-hidden="true" 
        className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" 
      />

      {/* Enterprise Sidebar Flotante V8 */}
      <EnterpriseSidebar
        currentView={currentView as ERPViewKey}
        onSelectView={(v) => setCurrentView(v)}
        isOpen={sidebarOpen}
        onToggleOpen={toggleSidebar}
        onCloseSession={() => useAuthStore.getState().logout()}
        userRole={userRole}
        onChangeRole={(r) => setUserRole(r as any)}
        pendingPrepCount={quotations.filter((q) => q.estado === 'Approved' || q.estado === 'Pausado').length}
        activeRoutesCount={0}
      />

      {/* Área de Contenido Principal con Topbar Flotante V8 */}
      <div className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 relative z-10 ${sidebarOpen ? 'lg:pl-[284px]' : 'lg:pl-[88px]'}`}>
        <EnterpriseTopbar
          currentView={currentView as ERPViewKey}
          onNavigateHome={() => setCurrentView('dashboard')}
          onNavigatePOS={() => setCurrentView('pos')}
          onNavigateKanban={() => setCurrentView('comandas_kanban')}
          onToggleSidebar={toggleSidebar}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSelectTheme={(t) => setTheme(t as any)}
          activeBodega="Bodega Principal"
          onOpenOmnibox={() => setIsOmniboxOpen(true)}
        />

        <main className={getMainLayoutClasses(currentView as string)}>
          <AppRouter
            handleCancelarPedidoDigital={handleCancelarPedidoDigital}
            handleAprobarPedidoManual={handleAprobarPedidoManual}
          />
        </main>
      </div>

      <GlobalOmniboxModal
        isOpen={isOmniboxOpen}
        onClose={() => setIsOmniboxOpen(false)}
        onNavigate={(v) => setCurrentView(v as any)}
      />
      <ConsentGateModal />
      <PwaUpdatePromptModal />
      {import.meta.env.DEV && <DevTestDashboard />}
    </div>
  );
}
