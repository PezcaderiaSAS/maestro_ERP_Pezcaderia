export const SEED_DATA: Record<string, unknown> = {
  pezcaderia_bodegas: [
    { id: 'b1', nombre: 'Bodega Principal', activa: true }
  ],
  pezcaderia_cajas: [
    { id: 'caja-test-menor', bodegaId: 'Bodega Principal', nombre: 'Caja Menor - Bodega Principal', activa: true },
    { id: 'caja-test-mayor', bodegaId: 'Bodega Principal', nombre: 'Caja Mayor - Bodega Principal', activa: true }
  ],
  pezcaderia_turnos_caja: [],
  pezcaderia_products_catalog: [
    { id: 'prod-salmon', sku: 'PES-ENT-001', nombre: 'Salmón Fresco', categoria: 'Pescados', activo: true, categoriaABC: 'A' },
    { id: 'prod-tilapia', sku: 'FIL-LIM-002', nombre: 'Tilapia Roja', categoria: 'Pescados', activo: true, categoriaABC: 'B' },
    { id: 'prod-trucha', sku: 'CAM-TIG-003', nombre: 'Trucha Arcoiris', categoria: 'Pescados', activo: true, categoriaABC: 'A' }
  ],
  pezcaderia_product_pricings: [
    { id: 'prc-salmon', productoId: 'prod-salmon', vigenciaDesde: new Date().toISOString(), precio_compra: 20000, buffer_seguridad: 5, precio_venta_pos: 35000, precio_venta_restaurante: 32000, precio_venta_mayorista: 30000, actualizadoPor: 'admin' },
    { id: 'prc-tilapia', productoId: 'prod-tilapia', vigenciaDesde: new Date().toISOString(), precio_compra: 8000, buffer_seguridad: 5, precio_venta_pos: 15000, precio_venta_restaurante: 12000, precio_venta_mayorista: 10000, actualizadoPor: 'admin' },
    { id: 'prc-trucha', productoId: 'prod-trucha', vigenciaDesde: new Date().toISOString(), precio_compra: 15000, buffer_seguridad: 5, precio_venta_pos: 25000, precio_venta_restaurante: 22000, precio_venta_mayorista: 20000, actualizadoPor: 'admin' }
  ],
  pezcaderia_stock: {
    'caja-test-menor': {
      'PES-ENT-001': 10,
      'FIL-LIM-002': 5,
      'CAM-TIG-003': 8
    },
    'Bodega Principal': {
      'PES-ENT-001': 10,
      'FIL-LIM-002': 5,
      'CAM-TIG-003': 8
    }
  },
  pezcaderia_clientes: [
    {
      id: 'cli-consumidor-final',
      nombre: 'Consumidor Final',
      identificacion: '222222222222',
      tipoIdentificacion: 'CC',
      tipoPersona: 'NATURAL',
      tipoPrecio: 'DETAL',
      cupoCredito: 0,
      activo: true
    }
  ]
};

export function applySeed(): void {
  for (const [key, value] of Object.entries(SEED_DATA)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  console.log('✅ POS Seed applied successfully');
}
