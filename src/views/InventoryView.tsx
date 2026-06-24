// src/views/InventoryView.tsx
import React, { useState, useEffect } from 'react';

import Swal from 'sweetalert2';
import { Product, ProductCatalog, ProductPricing, Proveedor, MovimientoInventario, OrdenCompra, generateId, CategoriaConfig, DevolucionPedido, toTitleCase } from '../App.tsx';
import { Bodega } from '../services/warehouseService.ts';
import { ProductTable } from './inventory/components/ProductTable.tsx';
import { ProductForm } from './inventory/components/ProductForm.tsx';
import { CategoryManager } from './inventory/components/CategoryManager.tsx';
import { PurchaseOrderForm } from './inventory/components/PurchaseOrderForm.tsx';
import { TransferForm } from './inventory/components/TransferForm.tsx';
import { ProductionForm } from './inventory/components/ProductionForm.tsx';
import { ColdRoomPreparation } from './inventory/components/ColdRoomPreparation.tsx';
import { ReturnsReceiver } from './inventory/components/ReturnsReceiver.tsx';
import { PurchasesReport } from './inventory/components/PurchasesReport.tsx';

interface StockItem {
  sku: string;
  nombre: string;
  stock: number;
  lote: string;
}

interface InventoryViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  productsCatalog: ProductCatalog[];
  setProductsCatalog: React.Dispatch<React.SetStateAction<ProductCatalog[]>>;
  productPricings: ProductPricing[];
  setProductPricings: React.Dispatch<React.SetStateAction<ProductPricing[]>>;
  stock: Record<string, StockItem[]>;
  setStock: React.Dispatch<React.SetStateAction<Record<string, StockItem[]>>>;
  proveedores: Proveedor[];
  publishEvent: (
    tipo: 'SALE_COMPLETED' | 'PRICE_CHANGED' | 'MERMA_ALERT' | 'QUOTE_STATUS_CHANGED' | 'METADATA_CONFIGURED',
    actor: string,
    descripcion: string,
    metadata?: any,
    enqueueSync?: boolean
  ) => void;
  userRole: string;
  movimientos: MovimientoInventario[];
  setMovimientos: React.Dispatch<React.SetStateAction<MovimientoInventario[]>>;
  ordenesCompra: OrdenCompra[];
  setOrdenesCompra: React.Dispatch<React.SetStateAction<OrdenCompra[]>>;
  categorias: CategoriaConfig[];
  setCategorias: React.Dispatch<React.SetStateAction<CategoriaConfig[]>>;
  quotations: any[];
  setQuotations: React.Dispatch<React.SetStateAction<any[]>>;
  devoluciones?: DevolucionPedido[];
  setDevoluciones?: React.Dispatch<React.SetStateAction<DevolucionPedido[]>>;
  bodegas: Bodega[];
  setBodegas: React.Dispatch<React.SetStateAction<Bodega[]>>;
}

export default function InventoryView({
  products,
  productsCatalog,
  setProductsCatalog,
  setProductPricings,
  stock,
  setStock,
  proveedores,
  publishEvent,
  userRole,
  movimientos,
  setMovimientos,
  ordenesCompra,
  setOrdenesCompra,
  categorias,
  setCategorias,
  quotations,
  setQuotations,
  devoluciones = [],
  setDevoluciones
}: InventoryViewProps) {
  const [activeBodega, setActiveBodega] = useState('Bodega Principal');
  const [historyTab, setHistoryTab] = useState<'movimientos' | 'compras'>('movimientos');
  const [viewMode, setViewMode] = useState<'operaciones' | 'catalogo' | 'categorias' | 'cuarto_frio' | 'recepcion_devoluciones' | 'configuracion_bodegas' | 'reportes_compra'>('operaciones');

  // State de Catalogo de Productos
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [productForm, setProductForm] = useState({
    sku: '', nombre: '', categoria: '', unidadMedida: 'kg' as 'kg' | 'und' | 'lb' | 'gr', precio_compra: 0, buffer_seguridad: 5,
    codigo_barras: '', iva: 0, ivaIncluido: true, control_inventario: true, produccion: false, tipoCategoria: '', lineaCategoria: '', claseCategoria: '', imagen: ''
  });

  const [customTipo, setCustomTipo] = useState('');
  const [customLinea, setCustomLinea] = useState('');
  const [customClase, setCustomClase] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // State de Gestión de Categorías
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ tipo: '', linea: '', clase: '' });
  const [categorySearch, setCategorySearch] = useState('');

  // --- ESTADO: ALISTAMIENTO CUARTO FRÍO B2B ---
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [preparedWeights, setPreparedWeights] = useState<Record<string, number | string>>({});

  // --- ESTADO: RECEPCIÓN DE DEVOLUCIONES B2B ---
  const [selectedDevId, setSelectedDevId] = useState<string | null>(null);
  const [receivedDevItems, setReceivedDevItems] = useState<Record<string, { cantidadRecibida: number | string; destino: 'APROBADO_REINGRESO' | 'DESCARTE_MERMA' }>>({});

  // Helper to calculate stock in a specific bodega for a given SKU
  const getStockInBodega = (sku: string, bodegaName: string) => {
    const items = stock[bodegaName] || [];
    return items.filter(item => item.sku === sku).reduce((acc, item) => acc + item.stock, 0);
  };

  // Helper to calculate total stock across all bodegas for a given SKU
  const getTotalStock = (sku: string) => {
    return Object.keys(stock).reduce((acc, bodegaName) => {
      return acc + getStockInBodega(sku, bodegaName);
    }, 0);
  };

  // Derive unique categories for selectors
  const uniqueTipos = Array.from(new Set(categorias.map(c => c.tipo))).filter(Boolean);
  if (productForm.tipoCategoria && !uniqueTipos.includes(productForm.tipoCategoria) && productForm.tipoCategoria !== 'NEW_TIPO') {
    uniqueTipos.push(productForm.tipoCategoria);
  }

  const uniqueLineas = Array.from(new Set(categorias.filter(c => c.tipo === productForm.tipoCategoria).map(c => c.linea))).filter(Boolean);
  if (productForm.lineaCategoria && !uniqueLineas.includes(productForm.lineaCategoria) && productForm.lineaCategoria !== 'NEW_LINEA') {
    uniqueLineas.push(productForm.lineaCategoria);
  }

  const uniqueClases = Array.from(new Set(categorias.filter(c => c.tipo === productForm.tipoCategoria && c.linea === productForm.lineaCategoria).map(c => c.clase))).filter(Boolean);
  if (productForm.claseCategoria && !uniqueClases.includes(productForm.claseCategoria) && productForm.claseCategoria !== 'NEW_CLASE') {
    uniqueClases.push(productForm.claseCategoria);
  }

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.sku || !productForm.nombre || !productForm.unidadMedida) {
      Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'SKU, nombre y unidad son requeridos.', confirmButtonColor: 'var(--primary-color)' });
      return;
    }

    const finalTipo = productForm.tipoCategoria === 'NEW_TIPO' ? customTipo.trim() : productForm.tipoCategoria.trim();
    const finalLinea = productForm.lineaCategoria === 'NEW_LINEA' ? customLinea.trim() : productForm.lineaCategoria.trim();
    const finalClase = productForm.claseCategoria === 'NEW_CLASE' ? customClase.trim() : productForm.claseCategoria.trim();

    // Auto-crear categoría si no existe
    let finalCategoriaId = '';
    const existsCat = categorias.find(
      c => c.tipo.trim().toUpperCase() === finalTipo.toUpperCase() && 
           c.linea.trim().toUpperCase() === finalLinea.toUpperCase() && 
           c.clase.trim().toUpperCase() === finalClase.toUpperCase()
    );
    if (!existsCat && finalTipo) {
      const newCatId = generateId('cat');
      setCategorias(prev => [...prev, { id: newCatId, tipo: finalTipo, linea: finalLinea, clase: finalClase }]);
      finalCategoriaId = newCatId;
    } else if (existsCat) {
      finalCategoriaId = existsCat.id;
    }

    const categoryText = finalTipo + 
      (finalLinea ? ` - ${finalLinea}` : '') +
      (finalClase ? ` - ${finalClase}` : '');

    if (editingProductId) {
      const currentProduct = products.find(p => p.id === editingProductId);
      if (!currentProduct) return;

      // 1. Actualizar catálogo
      setProductsCatalog(prev => prev.map(p => p.id === editingProductId ? {
        ...p,
        sku: productForm.sku.toUpperCase().trim(),
        nombre: toTitleCase(productForm.nombre.trim()),
        categoria: categoryText.toUpperCase().trim(),
        unidadMedida: productForm.unidadMedida,
        imagen: productForm.imagen || '',
        codigo_barras: productForm.codigo_barras || '',
        iva: productForm.iva || 0,
        ivaIncluido: productForm.ivaIncluido,
        control_inventario: productForm.control_inventario,
        produccion: productForm.produccion,
        metadata: { 
          ...p.metadata, 
          categoria_id: finalCategoriaId, 
          tipo: finalTipo, 
          linea: finalLinea, 
          clase: finalClase 
        }
      } : p));

      // 2. Si costo o buffer cambiaron, agregar registro a productPricings
      const costOrBufferChanged = currentProduct.precio_compra !== productForm.precio_compra || 
                                  currentProduct.buffer_seguridad !== productForm.buffer_seguridad;
      if (costOrBufferChanged) {
        const sugPos = Math.round(productForm.precio_compra * (1 + (productForm.buffer_seguridad / 100) + 0.40));
        const sugRest = Math.round(productForm.precio_compra * (1 + (productForm.buffer_seguridad / 100) + 0.30));
        const sugMay = Math.round(productForm.precio_compra * (1 + (productForm.buffer_seguridad / 100) + 0.15));

        const newPricing: ProductPricing = {
          id: generateId('prc'),
          productoId: editingProductId,
          vigenciaDesde: new Date().toISOString(),
          precio_compra: productForm.precio_compra,
          buffer_seguridad: productForm.buffer_seguridad,
          precio_venta_pos: sugPos,
          precio_venta_restaurante: sugRest,
          precio_venta_mayorista: sugMay,
          actualizadoPor: userRole
        };
        setProductPricings(prev => [newPricing, ...prev]);
        publishEvent('PRICE_CHANGED', userRole, `Actualización de precios para el producto ${productForm.nombre} por edición de costo`);
      }

      setEditingProductId(null);
      Swal.fire({ icon: 'success', title: 'Producto actualizado', text: 'Los datos del producto han sido guardados.', timer: 1500, showConfirmButton: false });
    } else {
      if (products.some(p => p.sku === productForm.sku.toUpperCase().trim())) {
        Swal.fire({ icon: 'error', title: 'SKU Duplicado', text: 'Ya existe un producto con este código SKU.', confirmButtonColor: 'var(--primary-color)' });
        return;
      }
      
      const newProdId = generateId('prd');
      const newCatalogItem: ProductCatalog = {
        id: newProdId,
        sku: productForm.sku.toUpperCase().trim(),
        nombre: toTitleCase(productForm.nombre.trim()),
        categoria: categoryText.toUpperCase().trim(),
        unidadMedida: productForm.unidadMedida,
        imagen: productForm.imagen || '',
        codigo_barras: productForm.codigo_barras || '',
        iva: productForm.iva || 0,
        ivaIncluido: productForm.ivaIncluido,
        control_inventario: productForm.control_inventario,
        produccion: productForm.produccion,
        activo: true,
        metadata: { 
          categoria_id: finalCategoriaId, 
          tipo: finalTipo, 
          linea: finalLinea, 
          clase: finalClase 
        }
      };

      const sugPos = Math.round(productForm.precio_compra * (1 + (productForm.buffer_seguridad / 100) + 0.40));
      const sugRest = Math.round(productForm.precio_compra * (1 + (productForm.buffer_seguridad / 100) + 0.30));
      const sugMay = Math.round(productForm.precio_compra * (1 + (productForm.buffer_seguridad / 100) + 0.15));

      const newPricingItem: ProductPricing = {
        id: generateId('prc'),
        productoId: newProdId,
        vigenciaDesde: new Date().toISOString(),
        precio_compra: productForm.precio_compra,
        buffer_seguridad: productForm.buffer_seguridad,
        precio_venta_pos: sugPos,
        precio_venta_restaurante: sugRest,
        precio_venta_mayorista: sugMay,
        actualizadoPor: userRole
      };

      setProductsCatalog(prev => [newCatalogItem, ...prev]);
      setProductPricings(prev => [newPricingItem, ...prev]);
      setIsCreating(false);

      publishEvent('METADATA_CONFIGURED', userRole, `Nuevo producto registrado: ${productForm.nombre} (${productForm.sku})`);
      Swal.fire({ icon: 'success', title: 'Producto creado', text: 'El nuevo producto ha sido registrado con éxito.', timer: 1500, showConfirmButton: false });
    }

    setProductForm({ sku: '', nombre: '', categoria: '', unidadMedida: 'kg', precio_compra: 0, buffer_seguridad: 5, codigo_barras: '', iva: 0, ivaIncluido: true, control_inventario: true, produccion: false, tipoCategoria: '', lineaCategoria: '', claseCategoria: '', imagen: '' });
    setCustomTipo('');
    setCustomLinea('');
    setCustomClase('');
  };

  // Imágenes curadas premium de stock para fallback de pescadería y comida de mar
  const PREMIUM_STOCK_IMAGES = [
    {
      id: 'salmon-filete',
      name: 'Filete de Salmón / Pescado Rojo',
      url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
      tags: ['salmón', 'filete', 'rojo', 'premium']
    },
    {
      id: 'pescado-entero',
      name: 'Pescado Entero Fresco en Hielo',
      url: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600&auto=format&fit=crop&q=80',
      tags: ['entero', 'róbalo', 'pargo', 'trucha', 'corvina', 'fresco']
    },
    {
      id: 'camarones',
      name: 'Camarones / Mariscos Cocidos',
      url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&auto=format&fit=crop&q=80',
      tags: ['camarón', 'camarones', 'langostino', 'langostinos', 'marisco']
    },
    {
      id: 'mariscos-mix',
      name: 'Mix de Mariscos Variados',
      url: 'https://images.unsplash.com/photo-1534080391025-09795d197a5b?w=600&auto=format&fit=crop&q=80',
      tags: ['mix', 'cazuela', 'mejillón', 'almeja', 'mariscos', 'pulpo']
    },
    {
      id: 'pulpo-preparado',
      name: 'Pulpo Fresco / Preparado',
      url: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=600&auto=format&fit=crop&q=80',
      tags: ['pulpo', 'calamar', 'tentáculos']
    },
    {
      id: 'pescaderia-general',
      name: 'Selección de la Casa (Pescados)',
      url: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&auto=format&fit=crop&q=80',
      tags: ['general', 'pescadería', 'mercado', 'pescado']
    }
  ];

  // Función para abrir la galería de stock premium interactiva
  const openPremiumStockGallery = async (reason?: string) => {
    let selectedUrl = '';
    
    await Swal.fire({
      title: 'Galería de Stock Premium',
      html: `
        <div style="text-align: left; margin-bottom: 12px;">
          ${reason ? `<div style="font-size: 13px; color: #EF4444; background: #FEF2F2; border: 1px solid #FEE2E2; padding: 10px; border-radius: 8px; margin-bottom: 12px; font-weight: 500;">⚠️ ${reason}</div>` : ''}
          <p style="font-size: 13px; color: #475569; margin: 0;">
            Seleccione una imagen profesional de alta calidad de nuestro catálogo de stock para el producto:
          </p>
        </div>
        <style>
          .stock-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            max-height: 280px;
            overflow-y: auto;
            padding: 4px;
          }
          .stock-card {
            border: 2px solid #E2E8F0;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            text-align: center;
          }
          .stock-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border-color: #CBD5E1;
          }
          .stock-card.selected {
            border-color: var(--primary-color) !important;
            box-shadow: 0 0 0 2px rgba(14, 116, 144, 0.2) !important;
          }
        </style>
        <div class="stock-grid">
          ${PREMIUM_STOCK_IMAGES.map(img => `
            <div class="stock-card" id="card-${img.id}" data-url="${img.url}">
              <img src="${img.url}" style="width: 100%; height: 80px; object-fit: cover; display: block;" />
              <div style="font-size: 11px; padding: 6px; background: #F8FAFC; font-weight: 600; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${img.name}</div>
            </div>
          `).join('')}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Aplicar Imagen',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-color)',
      didOpen: () => {
        const cards = document.querySelectorAll('.stock-card');
        cards.forEach(card => {
          card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedUrl = card.getAttribute('data-url') || '';
          });
        });
      },
      preConfirm: () => {
        if (!selectedUrl) {
          Swal.showValidationMessage('Por favor, seleccione una imagen de la galería.');
          return false;
        }
        return selectedUrl;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        setProductForm(prev => ({ ...prev, imagen: result.value }));
        Swal.fire({
          icon: 'success',
          title: '¡Imagen Asignada!',
          text: 'La imagen de stock premium ha sido cargada con éxito.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const handleGenerateAIImage = async () => {
    if (!productForm.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre Requerido',
        text: 'Por favor, asigne un nombre al producto antes de generar la imagen.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    const defaultPrompt = `Fresh raw ${productForm.nombre.toLowerCase().trim()} on crushed ice, professional food photography, commercial studio lighting, clean solid neutral background, 8k resolution, hyperrealistic, sharp focus`;

    const { value: customPrompt } = await Swal.fire({
      title: 'Generar Imagen con IA (Costo 0)',
      html: `
        <p style="font-size: 13px; color: #64748B; margin-bottom: 12px; text-align: left;">
          Escriba o ajuste el prompt para el generador. Es preferible que sea en inglés para obtener mejores resultados fotorrealistas:
        </p>
        <textarea id="prompt-ia-input" class="swal2-textarea" style="width: 100%; box-sizing: border-box; height: 100px; font-size: 13px; margin: 0;" placeholder="Prompt de generación...">${defaultPrompt}</textarea>
        <div style="text-align: left; margin-top: 10px;">
          <a href="#" id="lnk-stock-fallback" style="font-size: 12px; color: var(--primary-color); font-weight: 500; text-decoration: none;">✨ O seleccionar de Galería de Stock Premium directamente</a>
        </div>
      `,
      focusConfirm: true,
      showCancelButton: true,
      confirmButtonText: 'Generar Imagen',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary-color)',
      didOpen: () => {
        const lnk = document.getElementById('lnk-stock-fallback');
        if (lnk) {
          lnk.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.close();
            openPremiumStockGallery();
          });
        }
      },
      preConfirm: () => {
        return (document.getElementById('prompt-ia-input') as HTMLTextAreaElement).value;
      }
    });

    if (!customPrompt || !customPrompt.trim()) return;

    setIsGeneratingImage(true);

    const MAX_RETRIES = 2;
    let lastError = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const seed = Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(customPrompt.trim());
      
      // URL pública permanente (se guardará en el catálogo)
      const publicUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=400&height=400&nologo=true&seed=${seed}`;
      
      // URL de fetch: usa el proxy local de Vite en desarrollo para evitar CORS/bloqueos
      const fetchUrl = (import.meta as any).env?.DEV
        ? `/api/pollinations/prompt/${encodedPrompt}?width=400&height=400&nologo=true&seed=${seed}`
        : publicUrl;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

      try {
        const response = await fetch(fetchUrl, {
          signal: controller.signal,
          headers: { 'Accept': 'image/*' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
          throw new Error('La respuesta del servidor no es una imagen válida');
        }

        // Si la descarga es exitosa, guardamos la URL pública en el producto
        setProductForm(prev => ({ ...prev, imagen: publicUrl }));
        setIsGeneratingImage(false);

        Swal.fire({
          icon: 'success',
          title: '¡Imagen Generada!',
          text: attempt > 0 ? `Generada exitosamente en el intento ${attempt + 1}.` : 'La imagen ha sido asignada al producto.',
          timer: 1800,
          showConfirmButton: false
        });
        return; // Salir de la función al completarse con éxito

      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          lastError = `Tiempo de espera agotado (90s) en intento ${attempt + 1}`;
        } else {
          lastError = `${error.message} (intento ${attempt + 1})`;
        }
        console.warn(`Intento ${attempt + 1} fallido: ${lastError}`);
        
        // Esperar 2 segundos antes de reintentar si no es el último intento
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Si fallaron todos los intentos, activamos el fallback interactivo de stock premium
    setIsGeneratingImage(false);
    openPremiumStockGallery(`La IA reportó problemas de cuota/límites (HTTP 402) tras ${MAX_RETRIES + 1} intentos.`);
  };

  const handleEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProductForm({
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria,
      unidadMedida: p.unidadMedida as any,
      precio_compra: p.precio_compra || 0,
      buffer_seguridad: p.buffer_seguridad || 5,
      codigo_barras: p.codigo_barras || '',
      iva: p.iva || 0,
      ivaIncluido: p.ivaIncluido ?? true,
      control_inventario: p.control_inventario ?? true,
      produccion: p.produccion ?? false,
      tipoCategoria: p.metadata?.tipo || '',
      lineaCategoria: p.metadata?.linea || '',
      claseCategoria: p.metadata?.clase || '',
      imagen: p.imagen || ''
    });
    setCustomTipo('');
    setCustomLinea('');
    setCustomClase('');
  };

  const handleToggleProduct = (sku: string) => {
    setProductsCatalog(prev => prev.map(p => p.sku === sku ? { ...p, activo: !p.activo } : p));
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.tipo.trim() || !categoryForm.linea.trim() || !categoryForm.clase.trim()) {
      Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Todos los campos son requeridos para la categoría.', confirmButtonColor: 'var(--primary-color)' });
      return;
    }

    const cleanTipo = categoryForm.tipo.trim();
    const cleanLinea = categoryForm.linea.trim();
    const cleanClase = categoryForm.clase.trim();

    if (editingCategoryId) {
      setCategorias(prev => prev.map(c => c.id === editingCategoryId ? {
        ...c,
        tipo: cleanTipo,
        linea: cleanLinea,
        clase: cleanClase
      } : c));
      setEditingCategoryId(null);
      Swal.fire({ icon: 'success', title: 'Categoría actualizada', text: 'La categoría ha sido actualizada con éxito.', timer: 1500, showConfirmButton: false });
    } else {
      const exists = categorias.some(c => 
        c.tipo.toUpperCase() === cleanTipo.toUpperCase() && 
        c.linea.toUpperCase() === cleanLinea.toUpperCase() && 
        c.clase.toUpperCase() === cleanClase.toUpperCase()
      );
      if (exists) {
        Swal.fire({ icon: 'error', title: 'Duplicado', text: 'Esta combinación de Tipo > Línea > Clase ya existe.', confirmButtonColor: 'var(--primary-color)' });
        return;
      }

      setCategorias(prev => [...prev, {
        id: generateId('cat'),
        tipo: cleanTipo,
        linea: cleanLinea,
        clase: cleanClase
      }]);
      Swal.fire({ icon: 'success', title: 'Categoría creada', text: 'La nueva categoría ha sido añadida con éxito.', timer: 1500, showConfirmButton: false });
    }

    setCategoryForm({ tipo: '', linea: '', clase: '' });
  };

  const handleDeleteCategory = (id: string) => {
    Swal.fire({
      title: '¿Eliminar categoría?',
      text: 'Se eliminará esta rama de la jerarquía. Los productos existentes que la usen conservarán sus datos de clasificación actual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444'
    }).then(result => {
      if (result.isConfirmed) {
        setCategorias(prev => prev.filter(c => c.id !== id));
        Swal.fire({ icon: 'success', title: 'Eliminada', text: 'La categoría ha sido eliminada.', timer: 1500, showConfirmButton: false });
      }
    });
  };

  // State de Entrada de Compra (Replenishment)
  const [compra, setCompra] = useState({
    proveedorId: '',
    sku: '',
    cantidad: 10,
    costoUnitario: 0,
    lote: '',
    bodega: 'Bodega Principal',
    formaPago: 'CONTADO' as 'CONTADO' | 'CREDITO',
    fletes: 0,
    iva: 19
  });

  useEffect(() => {
    if (products.length > 0 && !compra.sku) {
      setCompra(prev => ({ ...prev, sku: products[0].sku }));
    }
  }, [products]);

  useEffect(() => {
    const activeProv = proveedores.filter(p => p.activo);
    if (activeProv.length > 0 && !compra.proveedorId) {
      setCompra(prev => ({ ...prev, proveedorId: activeProv[0].id }));
    }
  }, [proveedores]);

  // State de Traslados
  const [traslado, setTraslado] = useState<{ origen: string; destino: string; sku: string; cantidad: number | string }>({
    origen: 'Bodega Principal',
    destino: 'Bodega Secundaria',
    sku: 'PES-ENT-001',
    cantidad: 10
  });

  // State de Producción
  const [prodMateriaPrima, setProdMateriaPrima] = useState('PES-ENT-001');
  const [prodMateriaCant, setProdMateriaCant] = useState<number | string>(100); // 100 kg
  const [prodTerminado, setProdTerminado] = useState('FIL-LIM-002');
  const [prodTerminadoCant, setProdTerminadoCant] = useState<number | string>(60); // 60 kg (Merma 40%)
  const [mermaPct, setMermaPct] = useState(0);

  // Asegurar que los selectores de producción tengan valores iniciales válidos si cambia el catálogo
  useEffect(() => {
    const materias = products.filter(p => p.activo && p.categoria === 'MATERIA PRIMA');
    if (materias.length > 0 && !materias.some(m => m.sku === prodMateriaPrima)) {
      setProdMateriaPrima(materias[0].sku);
    }
    const terminados = products.filter(p => p.activo && p.categoria !== 'MATERIA PRIMA');
    if (terminados.length > 0 && !terminados.some(t => t.sku === prodTerminado)) {
      setProdTerminado(terminados[0].sku);
    }
  }, [products]);

  useEffect(() => {
    const mpCant = Number(prodMateriaCant) || 0;
    const ptCant = Number(prodTerminadoCant) || 0;
    if (mpCant > 0) {
      const merma = ((mpCant - ptCant) / mpCant) * 100;
      setMermaPct(parseFloat(merma.toFixed(1)));
    } else {
      setMermaPct(0);
    }
  }, [prodMateriaCant, prodTerminadoCant]);

  const handleProcesarCompra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compra.proveedorId || !compra.sku || compra.cantidad <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos Incompletos',
        text: 'Por favor complete todos los datos de la compra (Proveedor, Producto y Cantidad > 0).'
      });
      return;
    }

    const selectedProduct = products.find(p => p.sku === compra.sku);
    const selectedProveedor = proveedores.find(p => p.id === compra.proveedorId);
    if (!selectedProduct || !selectedProveedor) return;

    // Generar lote
    const loteFinal = (compra.lote || `LT-${Date.now().toString().slice(-6)}`).toUpperCase();

    // Actualizar stock
    setStock(prev => {
      const newStock = { ...prev };
      const currentList = newStock[compra.bodega] || [];
      const existingIndex = currentList.findIndex(item => item.sku === compra.sku && item.lote === loteFinal);
      if (existingIndex > -1) {
        const updatedList = [...currentList];
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          stock: updatedList[existingIndex].stock + compra.cantidad
        };
        newStock[compra.bodega] = updatedList;
      } else {
        newStock[compra.bodega] = [
          ...currentList,
          {
            sku: compra.sku,
            nombre: selectedProduct.nombre,
            stock: compra.cantidad,
            lote: loteFinal
          }
        ];
      }
      return newStock;
    });

    // F2: Crear y registrar Orden de Compra
    const ocId = generateId('oc');
    const subtotal = compra.cantidad * (compra.costoUnitario || selectedProduct.precio_compra || 0);
    const valorIva = Math.round(subtotal * (compra.iva / 100));
    const totalOC = subtotal + valorIva + (compra.fletes || 0);

    const newOC: OrdenCompra = {
      id: ocId,
      proveedorId: selectedProveedor.id,
      proveedorNombre: selectedProveedor.nombre,
      fecha: new Date().toISOString(),
      estado: 'RECIBIDA',
      items: [
        {
          sku: compra.sku,
          nombre: selectedProduct.nombre,
          cantidad: compra.cantidad,
          precioUnitario: compra.costoUnitario || selectedProduct.precio_compra || 0,
          lote: loteFinal
        }
      ],
      totalCompra: totalOC,
      subtotal: subtotal,
      iva: compra.iva,
      valorIva: valorIva,
      fletes: compra.fletes || 0,
      formaPago: compra.formaPago || 'CONTADO',
      saldo: (compra.formaPago || 'CONTADO') === 'CREDITO' ? totalOC : 0,
      bodegaDestino: compra.bodega,
      actor: userRole,
      notas: `Lote recibido: ${loteFinal}. Forma de Pago: ${compra.formaPago || 'CONTADO'}. Flete: $${compra.fletes || 0}. IVA: ${compra.iva}%`
    };
    setOrdenesCompra(prev => [newOC, ...prev]);

    // F2: Registrar Movimiento de Inventario
    const newMov: MovimientoInventario = {
      id: generateId('mov'),
      timestamp: new Date().toISOString(),
      tipo: 'ENTRADA_COMPRA',
      sku: compra.sku,
      nombreProducto: selectedProduct.nombre,
      bodegaDestino: compra.bodega,
      cantidad: compra.cantidad,
      lote: loteFinal,
      referenciaId: ocId,
      referenciaTipo: 'ORDEN_COMPRA',
      actor: userRole,
      notas: `Entrada por compra recibida de ${selectedProveedor.nombre}`
    };
    setMovimientos(prev => [newMov, ...prev]);

    // Publicar evento
    publishEvent(
      'METADATA_CONFIGURED',
      userRole,
      `Entrada de Compra: ${compra.cantidad} unidades de ${selectedProduct.nombre} ingresadas a ${compra.bodega} provenientes de ${selectedProveedor.nombre}. Lote: ${loteFinal}`,
      { proveedor: selectedProveedor, producto: selectedProduct, cantidad: compra.cantidad, lote: loteFinal, bodega: compra.bodega }
    );

    Swal.fire({
      icon: 'success',
      title: 'Entrada Registrada',
      text: `Se registraron ${compra.cantidad} unidades en ${compra.bodega} con Lote ${loteFinal}.`,
      confirmButtonColor: '#00B171'
    });

    // Resetear formulario (manteniendo proveedor y bodega)
    setCompra(prev => ({
      ...prev,
      cantidad: 10,
      costoUnitario: 0,
      lote: '',
      fletes: 0,
      iva: 19,
      formaPago: 'CONTADO'
    }));
  };

  const handleTraslado = (e: React.FormEvent) => {
    e.preventDefault();
    if (traslado.origen === traslado.destino) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'La bodega origen y destino no pueden ser iguales.' });
      return;
    }

    const tCant = Number(traslado.cantidad) || 0;
    
    if (tCant <= 0) {
      Swal.fire({ icon: 'warning', title: 'Cantidad Inválida', text: 'Ingrese una cantidad mayor a cero para trasladar.' });
      return;
    }

    const itemOrigen = stock[traslado.origen]?.find(i => i.sku === traslado.sku);
    if (!itemOrigen || itemOrigen.stock < tCant) {
      Swal.fire({ icon: 'error', title: 'Stock Insuficiente', text: 'La bodega de origen no dispone de existencias del lote.' });
      return;
    }

    // Procesar traslado de manera atómica local
    setStock(prev => {
      const newStock = { ...prev };
      // Restar
      newStock[traslado.origen] = newStock[traslado.origen].map(i =>
        i.sku === traslado.sku ? { ...i, stock: i.stock - tCant } : i
      );
      // Sumar
      const itemDestino = newStock[traslado.destino]?.find(i => i.sku === traslado.sku);
      if (itemDestino) {
        newStock[traslado.destino] = newStock[traslado.destino].map(i =>
          i.sku === traslado.sku ? { ...i, stock: i.stock + tCant } : i
        );
      } else {
        newStock[traslado.destino] = [
          ...(newStock[traslado.destino] || []),
          { sku: traslado.sku, nombre: itemOrigen.nombre, stock: tCant, lote: itemOrigen.lote }
        ];
      }
      return newStock;
    });

    // F2: Registrar los movimientos de traslado (Salida y Entrada)
    const refId = generateId('tras');
    const movSalida: MovimientoInventario = {
      id: generateId('mov'),
      timestamp: new Date().toISOString(),
      tipo: 'TRASLADO_SALIDA',
      sku: traslado.sku,
      nombreProducto: itemOrigen.nombre,
      bodegaOrigen: traslado.origen,
      bodegaDestino: traslado.destino,
      cantidad: tCant,
      lote: itemOrigen.lote,
      referenciaId: refId,
      referenciaTipo: 'TRASLADO',
      actor: userRole,
      notas: `Traslado a ${traslado.destino}`
    };
    const movEntrada: MovimientoInventario = {
      id: generateId('mov'),
      timestamp: new Date().toISOString(),
      tipo: 'TRASLADO_ENTRADA',
      sku: traslado.sku,
      nombreProducto: itemOrigen.nombre,
      bodegaOrigen: traslado.origen,
      bodegaDestino: traslado.destino,
      cantidad: tCant,
      lote: itemOrigen.lote,
      referenciaId: refId,
      referenciaTipo: 'TRASLADO',
      actor: userRole,
      notas: `Traslado desde ${traslado.origen}`
    };

    setMovimientos(prev => [movSalida, movEntrada, ...prev]);

    Swal.fire({
      icon: 'success',
      title: 'Traslado Exitoso',
      text: `Se trasladaron ${traslado.cantidad} unidades del lote a ${traslado.destino}.`,
      confirmButtonColor: '#00B171'
    });
  };

  const handleProcesarProduccion = async (e: React.FormEvent) => {
    e.preventDefault();

    const mpCant = Number(prodMateriaCant) || 0;
    const ptCant = Number(prodTerminadoCant) || 0;

    if (mpCant <= 0 || ptCant <= 0) {
      Swal.fire({ icon: 'warning', title: 'Cantidades Inválidas', text: 'Ingrese valores mayores a cero.' });
      return;
    }

    const itemMP = stock['Bodega Principal']?.find(i => i.sku === prodMateriaPrima);
    if (!itemMP || itemMP.stock < mpCant) {
      Swal.fire({ icon: 'error', title: 'Falta Materia Prima', text: 'No hay suficiente pescado entero disponible en Bodega Principal.' });
      return;
    }

    let justificacionText = '';

    if (mermaPct > 35) {
      // Pedir PIN y justificación
      const { value: formValues } = await Swal.fire({
        title: 'Autorización Requerida (Merma > 35%)',
        html:
          '<p style="font-size: 13px; color: #EF4444; margin-bottom: 12px;">Se requiere autorización firmada para una merma del ' + mermaPct + '%.</p>' +
          '<input id="pin-input" class="swal2-input" type="password" placeholder="PIN de 4 dígitos" maxlength="4">' +
          '<textarea id="just-input" class="swal2-textarea" placeholder="Justificación de la merma alta (Ej. Pescado con mucha víscera)..."></textarea>',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Autorizar y Guardar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#EF4444',
        preConfirm: () => {
          return {
            pin: (document.getElementById('pin-input') as HTMLInputElement).value,
            justificacion: (document.getElementById('just-input') as HTMLTextAreaElement).value
          };
        }
      });

      if (!formValues || !formValues.pin || !formValues.justificacion) {
        Swal.fire({ icon: 'error', title: 'Denegado', text: 'Debe ingresar el PIN y la justificación.' });
        return;
      }

      // Validar PIN (Simulado, ej: 1234 o 4321)
      if (formValues.pin !== '1234' && formValues.pin !== '4321') {
        Swal.fire({ icon: 'error', title: 'PIN Inválido', text: 'El código ingresado no corresponde a un Jefe de Bodega autorizado.' });
        return;
      }
      justificacionText = formValues.justificacion;
    }

    // Procesar Producción
    setStock(prev => {
      const newStock = { ...prev };
      // Restar materia prima
      newStock['Bodega Principal'] = newStock['Bodega Principal'].map(i =>
        i.sku === prodMateriaPrima ? { ...i, stock: i.stock - mpCant } : i
      );
      // Sumar producto terminado
      newStock['Bodega Principal'] = newStock['Bodega Principal'].map(i =>
        i.sku === prodTerminado ? { ...i, stock: i.stock + ptCant } : i
      );
      return newStock;
    });

    // F2: Registrar Movimientos de Producción (Consumo MP y Entrada PT)
    const prodRefId = generateId('prod');
    const nameMP = products.find(p => p.sku === prodMateriaPrima)?.nombre || 'Materia Prima';
    const namePT = products.find(p => p.sku === prodTerminado)?.nombre || 'Producto Terminado';
    const loteMP = stock['Bodega Principal']?.find(i => i.sku === prodMateriaPrima)?.lote || 'LOT-MP';
    const lotePT = `LT-PT-${Date.now().toString().slice(-6)}`;

    // Si merma > 35%, guardar la justificación en las notas
    const justificacionNotas = mermaPct > 35 && justificacionText 
      ? ` | Justificación: ${justificacionText}`
      : '';

    const movConsumo: MovimientoInventario = {
      id: generateId('mov'),
      timestamp: new Date().toISOString(),
      tipo: 'PRODUCCION_CONSUMO',
      sku: prodMateriaPrima,
      nombreProducto: nameMP,
      bodegaOrigen: 'Bodega Principal',
      cantidad: mpCant,
      lote: loteMP,
      referenciaId: prodRefId,
      referenciaTipo: 'PRODUCCION',
      actor: userRole,
      notas: `Consumo de materia prima para producción. Merma: ${mermaPct}%${justificacionNotas}`
    };

    const movSalida: MovimientoInventario = {
      id: generateId('mov'),
      timestamp: new Date().toISOString(),
      tipo: 'PRODUCCION_SALIDA',
      sku: prodTerminado,
      nombreProducto: namePT,
      bodegaDestino: 'Bodega Principal',
      cantidad: ptCant,
      lote: lotePT,
      referenciaId: prodRefId,
      referenciaTipo: 'PRODUCCION',
      actor: userRole,
      notas: `Ingreso de producto terminado procesado. Merma: ${mermaPct}%`
    };

    setMovimientos(prev => [movConsumo, movSalida, ...prev]);

    Swal.fire({
      icon: 'success',
      title: 'Orden de Producción Procesada',
      text: `Se transformaron ${mpCant}kg de ${nameMP} en ${ptCant}kg de ${namePT} con una merma del ${mermaPct}%.`,
      confirmButtonColor: 'var(--primary-color)'
    });
  };

  // --- HANDLERS: ALISTAMIENTO Y RECEPCIÓN B2B ---
  const handleFinalizarAlistamiento = (quoteId: string) => {
    const quote = quotations.find(q => q.id === quoteId);
    if (!quote) return;

    const items = quote.items || [];
    const missing = items.some((item: any) => {
      const pWeight = Number(preparedWeights[item.sku]);
      return isNaN(pWeight) || preparedWeights[item.sku] === '' || pWeight < 0;
    });
    if (missing) {
      Swal.fire({
        icon: 'warning',
        title: 'Pesos Incompletos',
        text: 'Por favor, registre el peso real en báscula para todos los productos del pedido.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    let hasDeviationAlert = false;
    let maxDeviationInfo = '';
    const updatedItems = items.map((item: any) => {
      const pWeight = Number(preparedWeights[item.sku]) || 0;
      const reqWeight = Number(item.cantidad) || 0;
      const deviation = reqWeight > 0 ? Math.abs(pWeight - reqWeight) / reqWeight : 0;
      if (deviation > 0.05) {
        hasDeviationAlert = true;
        maxDeviationInfo = `${item.nombre} (Diferencia: ${(deviation * 100).toFixed(1)}%)`;
      }
      return {
        ...item,
        cantidad_real: pWeight
      };
    });

    const newStatus = hasDeviationAlert ? 'Pausado' : 'Listo';
    
    const updatedQuotations = quotations.map(q => {
      if (q.id === quoteId) {
        return {
          ...q,
          estado: newStatus,
          items: updatedItems,
          fechaPreparado: new Date().toISOString()
        };
      }
      return q;
    });
    setQuotations(updatedQuotations);

    publishEvent(
      'QUOTE_STATUS_CHANGED',
      userRole,
      `Alistamiento finalizado para cotización B2B #${quoteId}. Estado: ${newStatus.toUpperCase()}.${hasDeviationAlert ? ` Pausado por discrepancia de peso en ${maxDeviationInfo}.` : ' Listo para facturación.'}`,
      { quoteId, estado: newStatus, hasDeviationAlert, maxDeviationInfo }
    );

    if (hasDeviationAlert) {
      Swal.fire({
        icon: 'error',
        title: '⚠️ ¡Alerta de Discrepancia!',
        html: `El pedido presenta una discrepancia superior al <strong>5% de tolerancia</strong> en:<br/><span style="color: #EF4444; font-weight: bold;">${maxDeviationInfo}</span>.<br/><br/>El estado ha sido cambiado a <strong>PAUSADO</strong> y se notificó al área comercial para renegociación.`,
        confirmButtonColor: 'var(--primary-color)'
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: '¡Alistamiento Exitoso!',
        text: 'Todas las cantidades están dentro del 5% de tolerancia. El pedido ha sido marcado como LISTO para facturar.',
        confirmButtonColor: '#10B981'
      });
    }

    setSelectedQuoteId(null);
    setPreparedWeights({});
  };

  const handleProcesarRecepcionDevolucion = (devId: string) => {
    const dev = devoluciones.find(d => d.id === devId);
    if (!dev) return;

    const items = dev.items || [];
    const missing = items.some((item: any) => {
      const details = receivedDevItems[item.sku];
      const recQty = Number(details?.cantidadRecibida);
      return !details || details.cantidadRecibida === '' || isNaN(recQty) || recQty < 0;
    });

    if (missing) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidades Incompletas',
        text: 'Por favor, registre la cantidad física recibida para todos los productos de la devolución.',
        confirmButtonColor: 'var(--primary-color)'
      });
      return;
    }

    const updatedItems = items.map((item: any) => {
      const details = receivedDevItems[item.sku];
      const recQty = Number(details?.cantidadRecibida) || 0;
      return {
        ...item,
        cantidadRecibida: recQty,
        estadoCalidad: details?.destino
      };
    });

    let stockChanges: Record<string, number> = {};
    let newMovements: MovimientoInventario[] = [];

    updatedItems.forEach((item: any) => {
      if (item.cantidadRecibida > 0) {
        const refMovId = generateId('mov');
        
        if (item.estadoCalidad === 'APROBADO_REINGRESO') {
          stockChanges[item.sku] = (stockChanges[item.sku] || 0) + item.cantidadRecibida;
          
          newMovements.push({
            id: refMovId,
            timestamp: new Date().toISOString(),
            tipo: 'ENTRADA_COMPRA',
            sku: item.sku,
            nombreProducto: item.nombre,
            bodegaDestino: 'Bodega Principal',
            cantidad: item.cantidadRecibida,
            lote: 'LOTE-DEV',
            referenciaId: devId,
            referenciaTipo: 'DEVOLUCION',
            actor: userRole,
            notes: `Reingreso por devolución B2B aprobada. Cliente: ${dev.clienteNombre}`
          } as any);
        } else {
          newMovements.push({
            id: refMovId,
            timestamp: new Date().toISOString(),
            tipo: 'SALIDA_AJUSTE',
            sku: item.sku,
            nombreProducto: item.nombre,
            bodegaOrigen: 'Bodega Principal',
            cantidad: item.cantidadRecibida,
            lote: 'LOTE-DEV',
            referenciaId: devId,
            referenciaTipo: 'DEVOLUCION',
            actor: userRole,
            notes: `Descarte por merma/daño en devolución B2B. Cliente: ${dev.clienteNombre}`
          } as any);

          publishEvent(
            'MERMA_ALERT',
            userRole,
            `Alerta de Merma en Devolución: ${item.cantidadRecibida} un de ${item.nombre} descartado por calidad.`,
            { devId, sku: item.sku, cantidad: item.cantidadRecibida }
          );
        }
      }
    });

    if (Object.keys(stockChanges).length > 0) {
      setStock(prev => {
        const newStock = { ...prev };
        const mainList = [...(newStock['Bodega Principal'] || [])];
        
        Object.entries(stockChanges).forEach(([sku, qty]) => {
          const prodObj = products.find(p => p.sku === sku);
          const index = mainList.findIndex(i => i.sku === sku && i.lote === 'LOTE-DEV');
          if (index > -1) {
            mainList[index] = {
              ...mainList[index],
              stock: mainList[index].stock + qty
            };
          } else {
            mainList.push({
              sku,
              nombre: prodObj?.nombre || 'Producto de Devolución',
              stock: qty,
              lote: 'LOTE-DEV'
            });
          }
        });

        newStock['Bodega Principal'] = mainList;
        return newStock;
      });
    }

    if (newMovements.length > 0) {
      setMovimientos(prev => [...newMovements, ...prev]);
    }

    const updatedDevoluciones = devoluciones.map(d => {
      if (d.id === devId) {
        return {
          ...d,
          estado: 'RECIBIDA_BODEGA' as const,
          items: updatedItems,
          fechaRecibido: new Date().toISOString(),
          recibidoPor: userRole
        };
      }
      return d;
    });
    if (setDevoluciones) {
      setDevoluciones(updatedDevoluciones);
    }

    publishEvent(
      'METADATA_CONFIGURED',
      userRole,
      `Devolución B2B #${devId} recibida en bodega. Estado: RECIBIDA_BODEGA.`,
      { devId, itemsRecibidos: updatedItems }
    );

    Swal.fire({
      icon: 'success',
      title: 'Devolución Procesada',
      text: 'Se ha registrado la recepción física de la devolución y actualizado el inventario/kardex según corresponda.',
      confirmButtonColor: '#3B82F6'
    });

    setSelectedDevId(null);
    setReceivedDevItems({});
  };

  const activeProducts = products.filter(p => p.activo);
  const pendingPrepCount = quotations.filter(q => q.estado === 'Approved' || q.estado === 'Pausado').length;
  const pendingDevCount = devoluciones.filter(d => d.estado === 'PROGRAMADA').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', height: '100%', overflowY: 'auto', paddingRight: '8px' }}>
      
      {/* Top Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setViewMode('operaciones')}
          style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: viewMode === 'operaciones' ? 800 : 500, color: viewMode === 'operaciones' ? 'var(--primary-color)' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          Operaciones de Inventario
        </button>
        <button 
          onClick={() => setViewMode('catalogo')}
          style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: viewMode === 'catalogo' ? 800 : 500, color: viewMode === 'catalogo' ? 'var(--primary-color)' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          Catálogo de Productos
        </button>
        <button 
          onClick={() => setViewMode('categorias')}
          style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: viewMode === 'categorias' ? 800 : 500, color: viewMode === 'categorias' ? 'var(--primary-color)' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          Gestión de Categorías
        </button>
        
        <button 
          onClick={() => setViewMode('cuarto_frio')}
          style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: viewMode === 'cuarto_frio' ? 800 : 500, color: viewMode === 'cuarto_frio' ? 'var(--primary-color)' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          ❄️ Alistamiento Cuarto Frío
          {pendingPrepCount > 0 && (
            <span style={{ fontSize: '10px', backgroundColor: '#EF4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontWeight: 800 }}>
              {pendingPrepCount}
            </span>
          )}
        </button>

        <button 
          onClick={() => setViewMode('recepcion_devoluciones')}
          style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: viewMode === 'recepcion_devoluciones' ? 800 : 500, color: viewMode === 'recepcion_devoluciones' ? 'var(--primary-color)' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          🔄 Devoluciones Recibidas
          {pendingDevCount > 0 && (
            <span style={{ fontSize: '10px', backgroundColor: '#3B82F6', color: 'white', padding: '2px 6px', borderRadius: '10px', fontWeight: 800 }}>
              {pendingDevCount}
            </span>
          )}
        </button>

        {(userRole === 'admin' || userRole === 'administrativo') && (
          <button 
            onClick={() => setViewMode('reportes_compra')}
            style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: viewMode === 'reportes_compra' ? 800 : 500, color: viewMode === 'reportes_compra' ? 'var(--primary-color)' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📊 Reporte de Compras
          </button>
        )}
      </div>

      {viewMode === 'operaciones' && (
        <>
          {/* Grid de Operaciones */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
            {/* Columna Izquierda: Consulta de Stock e Inventario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Inventario WMS</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Stock por Bodegas</h2>
              </div>

              <div className="pos-categories" style={{ marginBottom: '0px' }}>
                {Object.keys(stock).map(bod => (
                  <button
                    key={bod}
                    className={`pos-category-tab ${activeBodega === bod ? 'active' : ''}`}
                    onClick={() => setActiveBodega(bod)}
                  >
                    {bod}
                  </button>
                ))}
              </div>

              <div className="hr-table-card">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Lote</th>
                      <th>SKU</th>
                      <th>Nombre del Producto</th>
                      <th>Stock Físico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stock[activeBodega] || []).map(item => (
                      <tr key={item.sku}>
                        <td style={{ fontWeight: 700, color: '#00B171' }}>{item.lote}</td>
                        <td>{item.sku}</td>
                        <td style={{ fontWeight: 600 }}>{item.nombre}</td>
                        <td style={{ fontWeight: 700, fontSize: '15px' }}>{item.stock} unidades</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PurchaseOrderForm 
                compra={compra} 
                setCompra={setCompra} 
                proveedores={proveedores} 
                activeProducts={activeProducts} 
                handleProcesarCompra={handleProcesarCompra} 
              />

              <TransferForm 
                traslado={traslado} 
                setTraslado={setTraslado} 
                activeProducts={activeProducts} 
                handleTraslado={handleTraslado} 
              />
            </div>

            {/* Columna Derecha: Control de Producción */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Producción y Rendimiento</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Transformación de Planta</h2>
              </div>

              <ProductionForm 
                prodMateriaPrima={prodMateriaPrima} 
                setProdMateriaPrima={setProdMateriaPrima} 
                prodMateriaCant={prodMateriaCant} 
                setProdMateriaCant={setProdMateriaCant} 
                prodTerminado={prodTerminado} 
                setProdTerminado={setProdTerminado} 
                prodTerminadoCant={prodTerminadoCant} 
                setProdTerminadoCant={setProdTerminadoCant} 
                mermaPct={mermaPct} 
                activeProducts={activeProducts} 
                handleProcesarProduccion={handleProcesarProduccion} 
              />
            </div>
          </div> {/* Fin del Grid de Operaciones */}

          {/* Panel de Trazabilidad e Historial */}
          <div className="hr-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Auditoría y Registro Operativo</span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>Trazabilidad Transaccional</h3>
              </div>
              <div className="pos-categories" style={{ marginBottom: '0px', gap: '8px' }}>
                <button
                  className={`pos-category-tab ${historyTab === 'movimientos' ? 'active' : ''}`}
                  onClick={() => setHistoryTab('movimientos')}
                >
                  Movimientos (Kardex)
                </button>
                <button
                  className={`pos-category-tab ${historyTab === 'compras' ? 'active' : ''}`}
                  onClick={() => setHistoryTab('compras')}
                >
                  Órdenes de Compra
                </button>
              </div>
            </div>

            {historyTab === 'movimientos' ? (
              <div>
                {movimientos.length === 0 ? (
                  <p style={{ color: '#64748B', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No se han registrado movimientos de inventario aún.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="hr-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Producto</th>
                          <th>Origen</th>
                          <th>Destino</th>
                          <th>Cant.</th>
                          <th>Lote</th>
                          <th>Referencia</th>
                          <th>Usuario</th>
                          <th>Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientos.map(m => (
                          <tr key={m.id}>
                            <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{new Date(m.timestamp).toLocaleString()}</td>
                            <td>
                              <span style={{
                                padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                                backgroundColor: m.tipo.startsWith('ENTRADA') || m.tipo.includes('SALIDA_PRODUCCION') || m.tipo.includes('ENTRADA_TRASLADO') || m.tipo === 'PRODUCCION_SALIDA' || m.tipo === 'TRASLADO_ENTRADA' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: m.tipo.startsWith('ENTRADA') || m.tipo.includes('SALIDA_PRODUCCION') || m.tipo.includes('ENTRADA_TRASLADO') || m.tipo === 'PRODUCCION_SALIDA' || m.tipo === 'TRASLADO_ENTRADA' ? '#10B981' : '#EF4444'
                              }}>
                                {m.tipo}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{m.nombreProducto} <span style={{ fontSize: '11px', color: '#64748B' }}>({m.sku})</span></td>
                            <td style={{ fontSize: '13px' }}>{m.bodegaOrigen || '-'}</td>
                            <td style={{ fontSize: '13px' }}>{m.bodegaDestino || '-'}</td>
                            <td style={{ fontWeight: 700 }}>{m.cantidad}</td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#3B82F6' }}>{m.lote || '-'}</td>
                            <td style={{ fontSize: '11px', color: '#64748B' }}>
                              {m.referenciaTipo ? `${m.referenciaTipo}: ${m.referenciaId}` : '-'}
                            </td>
                            <td style={{ fontSize: '13px', fontWeight: 500 }}>{m.actor}</td>
                            <td style={{ fontSize: '12px', color: '#64748B', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.notas}>
                              {m.notas}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {ordenesCompra.length === 0 ? (
                  <p style={{ color: '#64748B', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No hay órdenes de compra registradas.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="hr-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>OC-ID</th>
                          <th>Proveedor</th>
                          <th>Destino</th>
                          <th>Productos Recibidos</th>
                          <th>Total</th>
                          <th>Usuario</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenesCompra.map(oc => (
                          <tr key={oc.id}>
                            <td style={{ fontSize: '12px' }}>{new Date(oc.fecha).toLocaleString()}</td>
                            <td style={{ fontWeight: 700 }}>{oc.id}</td>
                            <td style={{ fontWeight: 600 }}>{oc.proveedorNombre}</td>
                            <td>{oc.bodegaDestino}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {oc.items.map((item, idx) => (
                                  <span key={idx} style={{ fontSize: '12px' }}>
                                    {item.cantidad}x {item.nombre} ({item.sku}) - Lote: {item.lote}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ fontWeight: 700, color: '#10B981' }}>
                              ${oc.totalCompra.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td>{oc.actor}</td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                                {oc.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {viewMode === 'cuarto_frio' && (
        <ColdRoomPreparation 
          quotations={quotations}
          selectedQuoteId={selectedQuoteId}
          setSelectedQuoteId={setSelectedQuoteId}
          preparedWeights={preparedWeights}
          setPreparedWeights={setPreparedWeights}
          handleFinalizarAlistamiento={handleFinalizarAlistamiento}
        />
      )}

      {viewMode === 'recepcion_devoluciones' && (
        <ReturnsReceiver 
          devoluciones={devoluciones}
          selectedDevId={selectedDevId}
          setSelectedDevId={setSelectedDevId}
          receivedDevItems={receivedDevItems}
          setReceivedDevItems={setReceivedDevItems}
          handleProcesarRecepcionDevolucion={handleProcesarRecepcionDevolucion}
        />
      )}

      {viewMode === 'catalogo' && (
        <div>
          {/* SI SE ESTÁ EDITANDO O CREANDO */}
          {(editingProductId || isCreating) ? (
            <ProductForm 
              productForm={productForm}
              setProductForm={setProductForm}
              editingProductId={editingProductId}
              setEditingProductId={setEditingProductId}
              isCreating={isCreating}
              setIsCreating={setIsCreating}
              handleSaveProduct={handleSaveProduct}
              isGeneratingImage={isGeneratingImage}
              handleGenerateAIImage={handleGenerateAIImage}
              uniqueTipos={uniqueTipos}
              uniqueLineas={uniqueLineas}
              uniqueClases={uniqueClases}
              customTipo={customTipo}
              setCustomTipo={setCustomTipo}
              customLinea={customLinea}
              setCustomLinea={setCustomLinea}
              customClase={customClase}
              setCustomClase={setCustomClase}
              stock={stock}
              getTotalStock={getTotalStock}
              getStockInBodega={getStockInBodega}
            />
          ) : (
            <ProductTable 
              products={products}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              stock={stock}
              getTotalStock={getTotalStock}
              getStockInBodega={getStockInBodega}
              handleEditProduct={handleEditProduct}
              handleToggleProduct={handleToggleProduct}
              setIsCreating={setIsCreating}
              setProductForm={setProductForm}
              setCustomTipo={setCustomTipo}
              setCustomLinea={setCustomLinea}
              setCustomClase={setCustomClase}
            />
          )}
        </div>
      )}

      {viewMode === 'categorias' && (
        <CategoryManager 
          categorias={categorias}
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          editingCategoryId={editingCategoryId}
          setEditingCategoryId={setEditingCategoryId}
          categorySearch={categorySearch}
          setCategorySearch={setCategorySearch}
          handleSaveCategory={handleSaveCategory}
          handleDeleteCategory={handleDeleteCategory}
        />
      )}

      {viewMode === 'reportes_compra' && (
        <PurchasesReport 
          ordenesCompra={ordenesCompra}
          proveedores={proveedores}
          productsCatalog={productsCatalog}
          categorias={categorias}
          userRole={userRole}
        />
      )}

    </div>
  );
}
