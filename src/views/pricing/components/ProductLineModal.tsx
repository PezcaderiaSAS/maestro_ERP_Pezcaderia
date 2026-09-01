import React from 'react';
import { X, Search, Check } from 'lucide-react';
import Swal from 'sweetalert2';
import type { Product } from '../../../types/erp.types';

export interface ProductLineState {
  product: Product | null;
  cantidad: string | number;
  descuento: string | number;
  precioOverride: string | number;
  detalle: string;
  listo: boolean;
  esDevolucion: boolean;
  devolucionId: string;
}

interface ProductLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItemIndex: number | null;
  currentProductLine: ProductLineState;
  setCurrentProductLine: React.Dispatch<React.SetStateAction<ProductLineState>>;
  products: Product[];
  quoteSearchTerm: string;
  setQuoteSearchTerm: (term: string) => void;
  getProductPriceByClientType: (p: Product) => number;
  onSaveLine: (itemToSave: {
    product: Product;
    cantidad: number;
    descuento: number;
    precioOverride: number;
    detalle: string;
    listo: boolean;
    esDevolucion: boolean;
    devolucionId: string;
  }) => void;
}

export const ProductLineModal: React.FC<ProductLineModalProps> = ({
  isOpen,
  onClose,
  editingItemIndex,
  currentProductLine,
  setCurrentProductLine,
  products,
  quoteSearchTerm,
  setQuoteSearchTerm,
  getProductPriceByClientType,
  onSaveLine,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!currentProductLine.product) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto Requerido',
        text: 'Debe seleccionar un producto.',
        confirmButtonColor: 'var(--primary-color)',
      });
      return;
    }

    onSaveLine({
      product: currentProductLine.product,
      cantidad: Number(currentProductLine.cantidad) || 0,
      descuento: Number(currentProductLine.descuento) || 0,
      precioOverride: Number(currentProductLine.precioOverride) || 0,
      detalle: currentProductLine.detalle,
      listo: currentProductLine.listo,
      esDevolucion: currentProductLine.esDevolucion,
      devolucionId: currentProductLine.devolucionId,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          width: '450px',
          backgroundColor: 'white',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s ease-out',
          boxShadow: '-5px 0 15px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>
            {editingItemIndex !== null ? 'Editar Producto' : 'Añadir Producto'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 'bold' }}>
              Producto *
            </label>
            {!currentProductLine.product ? (
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por SKU o Nombre..."
                  value={quoteSearchTerm}
                  onChange={(e) => setQuoteSearchTerm(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
                {quoteSearchTerm && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '0 0 8px 8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                  >
                    {products
                      .filter(
                        (p) =>
                          p.activo &&
                          (p.nombre.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
                            p.sku.toLowerCase().includes(quoteSearchTerm.toLowerCase()))
                      )
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setCurrentProductLine((prev) => ({
                              ...prev,
                              product: p,
                              precioOverride: getProductPriceByClientType(p),
                            }));
                            setQuoteSearchTerm('');
                          }}
                          style={{
                            padding: '10px 12px',
                            borderBottom: '1px solid #F1F5F9',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.nombre}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>
                              SKU: {p.sku} | Costo: ${p.precio_compra.toLocaleString('es-CO')}
                            </div>
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                            ${getProductPriceByClientType(p).toLocaleString('es-CO')}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: '12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{currentProductLine.product.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>SKU: {currentProductLine.product.sku}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentProductLine((prev) => ({ ...prev, product: null }))}
                  style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          {currentProductLine.product && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Cantidad ({currentProductLine.product.unidadMedida || 'kg'}) *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    className="form-control"
                    value={currentProductLine.cantidad}
                    onChange={(e) => setCurrentProductLine((prev) => ({ ...prev, cantidad: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Precio Venta (Unit)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    value={currentProductLine.precioOverride}
                    onChange={(e) => setCurrentProductLine((prev) => ({ ...prev, precioOverride: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Detalle / Observación</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Sin cabeza, fileteado..."
                  value={currentProductLine.detalle}
                  onChange={(e) => setCurrentProductLine((prev) => ({ ...prev, detalle: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Descuento (%)</span>
                    <span style={{ color: '#EF4444', fontWeight: 'bold' }}>{currentProductLine.descuento}%</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    className="form-control"
                    value={currentProductLine.descuento}
                    onChange={(e) => setCurrentProductLine((prev) => ({ ...prev, descuento: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Estado Preparación</label>
                  <button
                    type="button"
                    onClick={() => setCurrentProductLine((prev) => ({ ...prev, listo: !prev.listo }))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: currentProductLine.listo ? '2px solid #10B981' : '1px solid #CBD5E1',
                      backgroundColor: currentProductLine.listo ? '#D1FAE5' : 'white',
                      color: currentProductLine.listo ? '#065F46' : '#64748B',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {currentProductLine.listo ? (
                      <>
                        <Check size={16} /> Listo
                      </>
                    ) : (
                      'Pendiente'
                    )}
                  </button>
                </div>
              </div>

              <div
                className="form-group"
                style={{
                  marginBottom: 0,
                  padding: '16px',
                  backgroundColor: currentProductLine.esDevolucion ? '#FEF2F2' : '#F1F5F9',
                  borderRadius: '8px',
                  border: currentProductLine.esDevolucion ? '1px dashed #EF4444' : '1px dashed #CBD5E1',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <label
                      className="form-label"
                      style={{ margin: 0, fontWeight: 'bold', color: currentProductLine.esDevolucion ? '#B91C1C' : '#475569' }}
                    >
                      ¿Es Devolución?
                    </label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748B' }}>
                      Marca si esta línea cruza un saldo a favor de devolución.
                    </p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentProductLine.esDevolucion}
                      onChange={(e) =>
                        setCurrentProductLine((prev) => ({
                          ...prev,
                          esDevolucion: e.target.checked,
                          descuento: e.target.checked ? 0 : prev.descuento,
                        }))
                      }
                      style={{ width: '20px', height: '20px', accentColor: '#EF4444' }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ marginTop: 'auto', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '18px',
                    fontWeight: 800,
                    color: 'var(--primary-color)',
                  }}
                >
                  <span>Total Línea:</span>
                  <span>
                    $
                    {Math.round(
                      Number(currentProductLine.cantidad || 0) *
                        Number(currentProductLine.precioOverride || 0) *
                        (1 - Number(currentProductLine.descuento || 0) / 100)
                    ).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: 'white',
              color: '#64748B',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-primary"
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {editingItemIndex !== null ? 'Actualizar' : 'Añadir a Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
};
