import React from 'react';
import { DollarSign, FileText, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/Button';
import Swal from 'sweetalert2';
import { usePricing } from '../hooks/usePricing';
import { CatalogTab } from './pricing/components/CatalogTab';
import { PricingTab } from './pricing/components/PricingTab';
import { QuoteWizardStep1 } from './pricing/components/QuoteWizardStep1';
import { QuoteWizardStep2 } from './pricing/components/QuoteWizardStep2';
import { QuoteWizardStep3 } from './pricing/components/QuoteWizardStep3';
import { ProductLineModal } from './pricing/components/ProductLineModal';
import { QuoteHistoryTab } from './pricing/components/QuoteHistoryTab';
import { DevolucionesTab } from './pricing/components/DevolucionesTab';
import { PriceHistoryModal } from './pricing/components/PriceHistoryModal';
import { QuotePrintModal } from './pricing/components/QuotePrintModal';

export function PricingView() {
  const {
    // Estado general y tabs
    activeTab,
    setActiveTab,
    quoteSubTab,
    setQuoteSubTab,
    selectedQuoteForPrint,
    setSelectedQuoteForPrint,

    // Catálogo
    editingProductId,
    productForm,
    setProductForm,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    categoriasUnicas,
    filteredProducts,

    // Precios
    editingPriceId,
    priceForm,
    setPriceForm,
    selectedProductHistory,
    setSelectedProductHistory,

    // Cotizaciones y Wizard
    wizardStep,
    setWizardStep,
    editingQuoteId,
    clientName,
    setClientName,
    clientIdent,
    setClientIdent,
    clientType,
    setClientType,
    origenPedido,
    setOrigenPedido,
    nuevoOrigen,
    setNuevoOrigen,
    origenesDisponibles,
    formaPago,
    setFormaPago,
    facturaElectronica,
    setFacturaElectronica,
    logisticaTipo,
    setLogisticaTipo,
    logisticaDireccion,
    setLogisticaDireccion,
    logisticaFecha,
    setLogisticaFecha,
    logisticaJornada,
    setLogisticaJornada,
    logisticaConductorId,
    setLogisticaConductorId,
    quoteItems,
    setQuoteItems,
    quoteDiscountGlobal,
    setQuoteDiscountGlobal,
    observacionesPedido,
    setObservacionesPedido,

    // Modal de producto en cotizador
    isProductModalOpen,
    setIsProductModalOpen,
    editingItemIndex,
    currentProductLine,
    setCurrentProductLine,
    quoteSearchTerm,
    setQuoteSearchTerm,

    // Devoluciones
    devClienteId,
    setDevClienteId,
    devConductorId,
    setDevConductorId,
    devFechaProg,
    setDevFechaProg,
    devPedidoId,
    setDevPedidoId,
    devItems,
    setDevItems,
    devSelProductSku,
    setDevSelProductSku,
    devSelProductCant,
    setDevSelProductCant,
    devSelProductMotivo,
    setDevSelProductMotivo,

    // Datos stores
    products,
    productPricings,
    quotations,
    devoluciones,
    clientes,
    conductores,

    // Cálculos
    quoteSubtotal,
    quoteLineDiscountsTotal,
    quoteDevolucionesTotal,
    quoteSubtotalAfterLineDiscounts,
    quoteGlobalDiscountValue,
    quoteTotalFinal,

    // Handlers
    handleSaveProduct: hookSaveProduct,
    handleEditProduct,
    handleToggleStatus,
    handleStartEditPrice,
    handleSavePrices: hookSavePrices,
    handleSaveQuotation: hookSaveQuotation,
    handleEditQuote: hookEditQuote,
    handleTransitionQuote: hookTransitionQuote,
    getProductPriceByClientType,
    getQuoteItemUnitPrice,
    saveProductLine,
    openAddItemModal,
    openEditItemModal,
    handleSaveDevolucion: hookSaveDevolucion,
    setEditingProductId,
    setEditingPriceId,
  } = usePricing();

  // --- WRAPPERS LOCALES CON ALERTA DE SWEETALERT2 ---
  const handleSaveProduct = (e: React.FormEvent) => {
    hookSaveProduct(e, {
      onSuccess: (msg) => {
        Swal.fire({
          icon: 'success',
          title: editingProductId ? 'Producto Actualizado' : 'Producto Creado',
          text: msg,
          confirmButtonColor: 'var(--primary-color)',
        });
      },
      onWarn: (title, text) => {
        Swal.fire({ icon: 'warning', title, text, confirmButtonColor: 'var(--primary-color)' });
      },
    });
  };

  const handleSavePrices = (prodId: string) => {
    hookSavePrices(prodId, {
      onSuccess: () => {
        Swal.fire({
          icon: 'success',
          title: 'Precios Actualizados',
          text: 'Los nuevos precios de venta y costos han sido guardados en el historial.',
          timer: 1500,
          showConfirmButton: false,
        });
      },
    });
  };

  const handleSaveQuotation = () => {
    hookSaveQuotation({
      onSuccess: (isEdit, no, estado) => {
        Swal.fire({
          icon: 'success',
          title: isEdit ? 'Pedido Actualizado' : 'Pedido Creado',
          text: isEdit ? 'Los cambios han sido guardados.' : `Pedido ${no} registrado como ${estado}.`,
          confirmButtonColor: 'var(--primary-color)',
        });
      },
      onWarn: (title, text) => {
        Swal.fire({ icon: 'warning', title, text, confirmButtonColor: 'var(--primary-color)' });
      },
    });
  };

  const handleEditQuote = (quote: any) => {
    hookEditQuote(quote, {
      onWarn: (title, text) => {
        Swal.fire({ icon: 'warning', title, text, confirmButtonColor: 'var(--primary-color)' });
      },
    });
    Swal.fire({
      icon: 'info',
      title: 'Modo Edición Activado',
      text: `Editando pedido ${quote.no}. Los cambios sobrescribirán el registro actual al guardar.`,
      confirmButtonColor: 'var(--primary-color)',
    });
  };

  const handleTransitionQuote = (quoteId: string, newStatus: string) => {
    hookTransitionQuote(quoteId, newStatus as any, {
      onSuccess: (msg) => {
        Swal.fire({
          icon: 'success',
          title: 'Estado Actualizado',
          text: msg,
          timer: 1500,
          showConfirmButton: false,
        });
      },
      onWarn: (title, text) => {
        Swal.fire({ icon: 'warning', title, text, confirmButtonColor: 'var(--primary-color)' });
      },
    });
  };

  const handleSaveDevolucion = () => {
    hookSaveDevolucion({
      onSuccess: () => {
        Swal.fire({
          icon: 'success',
          title: 'Devolución Programada',
          text: 'Se ha creado la orden de recogida para el conductor asignado.',
          confirmButtonColor: 'var(--primary-color)',
        });
      },
      onWarn: (title, text) => {
        Swal.fire({ icon: 'warning', title, text, confirmButtonColor: 'var(--primary-color)' });
      },
    });
  };

  const handlePrintQuote = () => {
    window.print();
  };

  return (
    <div className="hr-layout animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', padding: '24px' }}>
      {/* Cabecera / Pestañas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Políticas de Venta</span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Precios y Cotizaciones</h2>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant={activeTab === 'catalog' ? 'primary' : 'outline'} onClick={() => setActiveTab('catalog')} icon={<FileText size={16} />}>
            Catálogo
          </Button>
          <Button variant={activeTab === 'pricing' ? 'primary' : 'outline'} onClick={() => setActiveTab('pricing')} icon={<DollarSign size={16} />}>
            Gestor de Precios
          </Button>
          <Button variant={activeTab === 'quotes' ? 'primary' : 'outline'} onClick={() => setActiveTab('quotes')} icon={<ShoppingCart size={16} />}>
            Cotizador
          </Button>
        </div>
      </div>

      {/* Contoda Alert banner */}
      <div className="contoda-alert animate-fade-in">
        <div style={{ fontSize: '18px' }}>⚠️</div>
        <div style={{ flex: 1 }}>
          <h4 className="contoda-alert-title">VINCULACIÓN E INTEGRACIÓN AUTOMÁTICA CON SIIGO Y SUPERBOS</h4>
          <p className="contoda-alert-desc">
            Los precios modificados en este módulo se verán reflejados en tiempo real en la facturación del POS y la valorización de stock. Las cotizaciones generadas quedan registradas con estado{' '}
            <span className="badge-vigente" style={{ padding: '2px 6px', fontSize: '10px' }}>
              VIGENTE
            </span>{' '}
            por un periodo de 15 días.
          </p>
        </div>
      </div>

      {/* --- PESTAÑA 1: CATALOGO Y CRUD --- */}
      {activeTab === 'catalog' && (
        <CatalogTab
          editingProductId={editingProductId}
          productForm={productForm}
          setProductForm={setProductForm}
          setEditingProductId={setEditingProductId}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          categoriasUnicas={categoriasUnicas}
          filteredProducts={filteredProducts}
          onSaveProduct={handleSaveProduct}
          onEditProduct={handleEditProduct}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* --- PESTAÑA 2: GESTOR DE PRECIOS --- */}
      {activeTab === 'pricing' && (
        <PricingTab
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          categoriasUnicas={categoriasUnicas}
          filteredProducts={filteredProducts}
          editingPriceId={editingPriceId}
          setEditingPriceId={setEditingPriceId}
          priceForm={priceForm}
          setPriceForm={setPriceForm}
          onSavePrices={handleSavePrices}
          onStartEditPrice={handleStartEditPrice}
          onViewProductHistory={setSelectedProductHistory}
        />
      )}

      {/* --- PESTAÑA 3: COTIZADOR --- */}
      {activeTab === 'quotes' && !selectedQuoteForPrint && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Subnavegación de Cotizaciones */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setQuoteSubTab('create')}
              className={`pos-category-tab ${quoteSubTab === 'create' ? 'active' : ''}`}
              style={{ margin: 0, padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
            >
              Nuevo Cotizador
            </button>
            <button
              type="button"
              onClick={() => setQuoteSubTab('history')}
              className={`pos-category-tab ${quoteSubTab === 'history' ? 'active' : ''}`}
              style={{ margin: 0, padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
            >
              Historial y Workflows ({quotations.length})
            </button>
            <button
              type="button"
              onClick={() => setQuoteSubTab('devoluciones')}
              className={`pos-category-tab ${quoteSubTab === 'devoluciones' ? 'active' : ''}`}
              style={{ margin: 0, padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
            >
              Devoluciones B2B ({devoluciones.length})
            </button>
          </div>

          {quoteSubTab === 'create' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Wizard Header / Tabs */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'white',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={20} color="var(--primary-color)" />
                  {editingQuoteId ? `Editar Pedido B2B (${editingQuoteId.slice(-6).toUpperCase()})` : 'Nuevo Pedido B2B'}
                </h3>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className={`btn-secondary ${wizardStep >= 1 ? 'active' : ''}`}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '24px',
                      border: wizardStep === 1 ? '2px solid var(--primary-color)' : '1px solid #E2E8F0',
                      backgroundColor: wizardStep >= 1 ? 'var(--primary-color)' : 'white',
                      color: wizardStep >= 1 ? 'white' : '#64748B',
                      fontWeight: 700,
                    }}
                  >
                    1. Datos Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (wizardStep >= 1 && clientName) setWizardStep(2);
                    }}
                    className={`btn-secondary ${wizardStep >= 2 ? 'active' : ''}`}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '24px',
                      border: wizardStep === 2 ? '2px solid var(--primary-color)' : '1px solid #E2E8F0',
                      backgroundColor: wizardStep >= 2 ? 'var(--primary-color)' : 'white',
                      color: wizardStep >= 2 ? 'white' : '#64748B',
                      fontWeight: 700,
                      cursor: clientName ? 'pointer' : 'not-allowed',
                    }}
                    disabled={!clientName}
                  >
                    2. Datos Envío
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (wizardStep >= 2) setWizardStep(3);
                    }}
                    className={`btn-secondary ${wizardStep >= 3 ? 'active' : ''}`}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '24px',
                      border: wizardStep === 3 ? '2px solid var(--primary-color)' : '1px solid #E2E8F0',
                      backgroundColor: wizardStep >= 3 ? 'var(--primary-color)' : 'white',
                      color: wizardStep >= 3 ? 'white' : '#64748B',
                      fontWeight: 700,
                      cursor: clientName ? 'pointer' : 'not-allowed',
                    }}
                    disabled={!clientName}
                  >
                    3. Datos del Pedido
                  </button>
                </div>
              </div>

              <div className="hr-table-card" style={{ padding: '24px', minHeight: '400px' }}>
                {wizardStep === 1 && (
                  <QuoteWizardStep1
                    clientes={clientes}
                    clientName={clientName}
                    setClientName={setClientName}
                    clientIdent={clientIdent}
                    setClientIdent={setClientIdent}
                    clientType={clientType}
                    setClientType={setClientType}
                    setLogisticaDireccion={setLogisticaDireccion}
                    origenPedido={origenPedido}
                    setOrigenPedido={setOrigenPedido}
                    origenesDisponibles={origenesDisponibles}
                    nuevoOrigen={nuevoOrigen}
                    setNuevoOrigen={setNuevoOrigen}
                    formaPago={formaPago}
                    setFormaPago={setFormaPago}
                    facturaElectronica={facturaElectronica}
                    setFacturaElectronica={setFacturaElectronica}
                  />
                )}

                {wizardStep === 2 && (
                  <QuoteWizardStep2
                    logisticaTipo={logisticaTipo}
                    setLogisticaTipo={setLogisticaTipo}
                    logisticaDireccion={logisticaDireccion}
                    setLogisticaDireccion={setLogisticaDireccion}
                    logisticaFecha={logisticaFecha}
                    setLogisticaFecha={setLogisticaFecha}
                    logisticaJornada={logisticaJornada}
                    setLogisticaJornada={setLogisticaJornada}
                    logisticaConductorId={logisticaConductorId}
                    setLogisticaConductorId={setLogisticaConductorId}
                    conductores={conductores}
                  />
                )}

                {wizardStep === 3 && (
                  <QuoteWizardStep3
                    quoteItems={quoteItems}
                    setQuoteItems={setQuoteItems}
                    getQuoteItemUnitPrice={getQuoteItemUnitPrice}
                    onOpenAddItemModal={openAddItemModal}
                    onOpenEditItemModal={openEditItemModal}
                    observacionesPedido={observacionesPedido}
                    setObservacionesPedido={setObservacionesPedido}
                    quoteDiscountGlobal={quoteDiscountGlobal}
                    setQuoteDiscountGlobal={setQuoteDiscountGlobal}
                    quoteSubtotal={quoteSubtotal}
                    quoteLineDiscountsTotal={quoteLineDiscountsTotal}
                    quoteSubtotalAfterLineDiscounts={quoteSubtotalAfterLineDiscounts}
                    quoteGlobalDiscountValue={quoteGlobalDiscountValue}
                    quoteDevolucionesTotal={quoteDevolucionesTotal}
                    quoteTotalFinal={quoteTotalFinal}
                    onPrevStep={() => setWizardStep(2)}
                    onSaveQuotation={handleSaveQuotation}
                  />
                )}

                {wizardStep < 3 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (wizardStep === 1 && !clientName) {
                          Swal.fire({
                            icon: 'warning',
                            title: 'Falta Cliente',
                            text: 'Debe ingresar el nombre del cliente para continuar.',
                            confirmButtonColor: 'var(--primary-color)',
                          });
                          return;
                        }
                        setWizardStep((prev) => ((prev + 1) as any));
                      }}
                      className="btn-primary"
                      style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>

              {/* Modal de Detalle de Producto */}
              <ProductLineModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                editingItemIndex={editingItemIndex}
                currentProductLine={currentProductLine}
                setCurrentProductLine={setCurrentProductLine}
                products={products}
                quoteSearchTerm={quoteSearchTerm}
                setQuoteSearchTerm={setQuoteSearchTerm}
                getProductPriceByClientType={getProductPriceByClientType}
                onSaveLine={saveProductLine}
              />
            </div>
          ) : quoteSubTab === 'history' ? (
            <QuoteHistoryTab
              quotations={quotations}
              onSelectQuoteForPrint={setSelectedQuoteForPrint}
              onEditQuote={handleEditQuote}
              onTransitionQuote={handleTransitionQuote}
            />
          ) : (
            <DevolucionesTab
              clientes={clientes}
              conductores={conductores}
              products={products}
              quotations={quotations}
              devoluciones={devoluciones}
              devClienteId={devClienteId}
              setDevClienteId={setDevClienteId}
              devConductorId={devConductorId}
              setDevConductorId={setDevConductorId}
              devFechaProg={devFechaProg}
              setDevFechaProg={setDevFechaProg}
              devPedidoId={devPedidoId}
              setDevPedidoId={setDevPedidoId}
              devItems={devItems}
              setDevItems={setDevItems}
              devSelProductSku={devSelProductSku}
              setDevSelProductSku={setDevSelProductSku}
              devSelProductCant={devSelProductCant}
              setDevSelProductCant={setDevSelProductCant}
              devSelProductMotivo={devSelProductMotivo}
              setDevSelProductMotivo={setDevSelProductMotivo}
              onSaveDevolucion={handleSaveDevolucion}
            />
          )}
        </div>
      )}

      {/* Vista Imprimible / Proforma */}
      <QuotePrintModal
        selectedQuoteForPrint={selectedQuoteForPrint}
        onClose={() => setSelectedQuoteForPrint(null)}
        onPrint={handlePrintQuote}
      />

      {/* Modal Historial de Precios */}
      <PriceHistoryModal
        selectedProductHistory={selectedProductHistory}
        onClose={() => setSelectedProductHistory(null)}
        products={products}
        productPricings={productPricings}
      />
    </div>
  );
}

export default PricingView;
