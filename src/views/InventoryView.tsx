// src/views/InventoryView.tsx
import React, { useState, useEffect } from 'react';
import { RefreshCw, Package, ArrowRight, ShieldAlert, CheckCircle, Truck, PlusCircle, Save, Edit2, Search, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { Product, ProductCatalog, ProductPricing, Proveedor, MovimientoInventario, OrdenCompra, generateId, CategoriaConfig, DevolucionPedido, toTitleCase } from '../App.tsx';

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
}

export default function InventoryView({
  products,
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
  const [viewMode, setViewMode] = useState<'operaciones' | 'catalogo' | 'categorias' | 'cuarto_frio' | 'recepcion_devoluciones'>('operaciones');

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
    bodega: 'Bodega Principal'
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
    const totalOC = compra.cantidad * (compra.costoUnitario || selectedProduct.precio_compra || 0);
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
      bodegaDestino: compra.bodega,
      actor: userRole,
      notas: `Lote recibido: ${loteFinal}`
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
      lote: ''
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

              {/* Entrada de Compra (Replenishment) */}
              <div className="hr-table-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={18} color="#00B171" /> Entrada de Mercadería (Proveedores)
                </h3>
                <form onSubmit={handleProcesarCompra} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Proveedor Origen</label>
                      <select
                        className="form-control"
                        value={compra.proveedorId}
                        onChange={e => setCompra({ ...compra, proveedorId: e.target.value })}
                        style={{ border: '2px solid var(--primary-light)' }}
                      >
                        <option value="">-- Seleccionar Proveedor --</option>
                        {proveedores.filter(p => p.activo).map(p => (
                          <option key={p.id} value={p.id}>{p.nombre} ({p.nit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Bodega Destino</label>
                      <select className="form-control" value={compra.bodega} onChange={e => setCompra({ ...compra, bodega: e.target.value })}>
                        <option value="Bodega Principal">Bodega Principal</option>
                        <option value="Bodega Secundaria">Bodega Secundaria</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Producto a Recibir</label>
                      <select className="form-control" value={compra.sku} onChange={e => setCompra({ ...compra, sku: e.target.value })}>
                        {activeProducts.map(p => (
                          <option key={p.sku} value={p.sku}>{p.nombre} ({p.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Cantidad</label>
                      <input
                        type="number"
                        className="form-control"
                        value={compra.cantidad}
                        onChange={e => setCompra({ ...compra, cantidad: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Lote (Auto-generado si vacío)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. LT-2506"
                        value={compra.lote}
                        onChange={e => setCompra({ ...compra, lote: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Costo por Unidad ($ COP)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Ej. 12000"
                        value={compra.costoUnitario || ''}
                        onChange={e => setCompra({ ...compra, costoUnitario: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <button type="submit" className="hr-btn-new" style={{ border: 'none', justifyContent: 'center', marginTop: '8px', backgroundColor: 'var(--primary-color)' }}>
                    <span>Registrar Entrada de Compra</span>
                    <PlusCircle size={16} />
                  </button>
                </form>
              </div>

              {/* Sección de Traslados */}
              <div className="hr-table-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={18} color="#00B171" /> Traslado entre Bodegas
                </h3>
                <form onSubmit={handleTraslado} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Origen</label>
                      <select className="form-control" value={traslado.origen} onChange={e => setTraslado({ ...traslado, origen: e.target.value })}>
                        <option value="Bodega Principal">Bodega Principal</option>
                        <option value="Bodega Secundaria">Bodega Secundaria</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Destino</label>
                      <select className="form-control" value={traslado.destino} onChange={e => setTraslado({ ...traslado, destino: e.target.value })}>
                        <option value="Bodega Principal">Bodega Principal</option>
                        <option value="Bodega Secundaria">Bodega Secundaria</option>
                        <option value="Bodega Averías">Bodega Averías</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Producto a Trasladar</label>
                      <select className="form-control" value={traslado.sku} onChange={e => setTraslado({ ...traslado, sku: e.target.value })}>
                        {activeProducts.map(p => (
                          <option key={p.sku} value={p.sku}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Cantidad</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        value={traslado.cantidad}
                        onChange={e => setTraslado({ ...traslado, cantidad: e.target.value })}
                      />
                    </div>
                  </div>

                  <button type="submit" className="hr-btn-new" style={{ border: 'none', justifyContent: 'center', marginTop: '8px' }}>
                    <span>Confirmar Traslado</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            </div>

            {/* Columna Derecha: Control de Producción */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Producción y Rendimiento</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Transformación de Planta</h2>
              </div>

              <div className="hr-table-card" style={{ padding: '24px', flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={18} color="#00B171" /> Procesar Orden de Producción
                </h3>

                <form onSubmit={handleProcesarProduccion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', marginBottom: '12px' }}>MATERIA PRIMA (ENTRADA)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Insumo</label>
                        <select className="form-control" value={prodMateriaPrima} onChange={e => setProdMateriaPrima(e.target.value)}>
                          {activeProducts.filter(p => p.categoria === 'MATERIA PRIMA').map(p => (
                            <option key={p.sku} value={p.sku}>{p.nombre}</option>
                          ))}
                          {activeProducts.filter(p => p.categoria === 'MATERIA PRIMA').length === 0 && 
                            activeProducts.map(p => (
                              <option key={p.sku} value={p.sku}>{p.nombre}</option>
                            ))
                          }
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Cantidad (kg)</label>
                        <input
                          type="number"
                          step="any"
                          className="form-control"
                          value={prodMateriaCant}
                          onChange={e => setProdMateriaCant(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', marginBottom: '12px' }}>PRODUCTO FINAL (SALIDA)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Destino</label>
                        <select className="form-control" value={prodTerminado} onChange={e => setProdTerminado(e.target.value)}>
                          {activeProducts.filter(p => p.categoria !== 'MATERIA PRIMA').map(p => (
                            <option key={p.sku} value={p.sku}>{p.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Rendimiento (kg)</label>
                        <input
                          type="number"
                          step="any"
                          className="form-control"
                          value={prodTerminadoCant}
                          onChange={e => setProdTerminadoCant(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cálculo de Merma y Alertas en Vivo */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    backgroundColor: mermaPct > 35 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                    border: `1px solid ${mermaPct > 35 ? '#FCA5A5' : '#6EE7B7'}`,
                    padding: '16px', borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Porcentaje de Merma Resultante:</span>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: mermaPct > 35 ? '#EF4444' : '#10B981' }}>{mermaPct}%</span>
                    </div>
                    {mermaPct > 35 ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#B91C1C', fontSize: '12px', lineHeight: 1.4 }}>
                        <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>
                          La merma excede la tolerancia permitida (35%). Se solicitará <strong>PIN de autorización</strong> y justificación al momento de procesar.
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#047857', fontSize: '12px', lineHeight: 1.4 }}>
                        <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>La merma está dentro del rango operativo normal.</span>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="hr-btn-new" style={{ border: 'none', justifyContent: 'center', marginTop: '12px' }}>
                    Procesar Producción
                  </button>
                </form>
              </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', minHeight: '500px' }}>
          {/* COLUMNA IZQUIERDA: LISTADO DE PEDIDOS PENDIENTES */}
          <div className="hr-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>WMS - Bodega</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>Pedidos por Preparar</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
              {quotations.filter(q => q.estado === 'Approved' || q.estado === 'Pausado').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B' }}>
                  <Package size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>No hay pedidos B2B pendientes de alistamiento.</p>
                </div>
              ) : (
                quotations
                  .filter(q => q.estado === 'Approved' || q.estado === 'Pausado')
                  .map(q => {
                    const isSelected = selectedQuoteId === q.id;
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setSelectedQuoteId(q.id);
                          const initialWeights: Record<string, number> = {};
                          (q.items || []).forEach((item: any) => {
                            if (item.cantidad_real) {
                              initialWeights[item.sku] = item.cantidad_real;
                            }
                          });
                          setPreparedWeights(initialWeights);
                        }}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid var(--primary-color)' : '1px solid #E2E8F0',
                          backgroundColor: isSelected ? 'rgba(14, 116, 144, 0.05)' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                            Cotización #{q.id.slice(-6).toUpperCase()}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: q.estado === 'Pausado' ? '#FEF2F2' : '#F0FDF4',
                            color: q.estado === 'Pausado' ? '#EF4444' : '#10B981'
                          }}>
                            {q.estado === 'Pausado' ? 'PAUSADO (Discrepancia)' : 'APROBADO'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#475569' }}>
                          <div><strong>Cliente:</strong> {q.clienteNombre || 'Cliente B2B'}</div>
                          <div><strong>Fecha Límite:</strong> {q.logistica?.fechaEntrega ? new Date(q.logistica.fechaEntrega).toLocaleDateString() : 'No definida'}</div>
                          <div><strong>Conductor:</strong> {q.logistica?.conductor?.nombre || 'No asignado'}</div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: ÁREA DE TRABAJO Y PESAJE */}
          <div className="hr-table-card" style={{ padding: '24px' }}>
            {selectedQuoteId ? (
              (() => {
                const quote = quotations.find(q => q.id === selectedQuoteId);
                if (!quote) return null;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Báscula y Alistamiento</span>
                          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Alistamiento de Pedido #{quote.id.slice(-6).toUpperCase()}</h3>
                        </div>
                        <button 
                          onClick={() => setSelectedQuoteId(null)}
                          style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', fontSize: '13px', color: '#475569', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
                        <div>
                          <div><strong>Cliente:</strong> {quote.clienteNombre}</div>
                          <div><strong>Dirección:</strong> {quote.logistica?.direccion || 'N/A'}</div>
                        </div>
                        <div>
                          <div><strong>Conductor Asignado:</strong> {quote.logistica?.conductor?.nombre || 'No asignado'}</div>
                          <div><strong>Ruta / Jornada:</strong> {quote.logistica?.ruta ? `${quote.logistica.ruta} / ${quote.logistica.jornada || 'N/A'}` : 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>Productos a Pesar y Preparar (Tolerancia: 5%)</h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="hr-table">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th style={{ textAlign: 'right' }}>Cant. Solicitada</th>
                              <th style={{ width: '180px', textAlign: 'center' }}>Peso Real Báscula</th>
                              <th style={{ textAlign: 'right' }}>Desviación %</th>
                              <th>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(quote.items || []).map((item: any) => {
                              const reqQty = item.cantidad;
                              const prepQty = preparedWeights[item.sku];
                              const parsedPrepQty = Number(prepQty);
                              const dev = (prepQty !== undefined && prepQty !== '') ? ((parsedPrepQty - reqQty) / reqQty) * 100 : null;
                              const isOutOfRange = dev !== null && Math.abs(dev) > 5;
                              
                              return (
                                <tr key={item.sku}>
                                  <td style={{ fontWeight: 600 }}>{item.nombre}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{reqQty} kg</td>
                                  <td style={{ display: 'flex', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '130px' }}>
                                      <input
                                        type="number"
                                        step="any"
                                        className="form-control"
                                        style={{ textAlign: 'right', fontWeight: 700 }}
                                        value={prepQty === undefined ? '' : prepQty}
                                        onChange={e => {
                                          setPreparedWeights(prev => ({
                                            ...prev,
                                            [item.sku]: e.target.value
                                          }));
                                        }}
                                        placeholder="0.00"
                                      />
                                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>kg</span>
                                    </div>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 700, color: isOutOfRange ? '#EF4444' : '#10B981' }}>
                                    {dev !== null ? `${dev > 0 ? '+' : ''}${dev.toFixed(1)}%` : '-'}
                                  </td>
                                  <td>
                                    {dev !== null ? (
                                      isOutOfRange ? (
                                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#EF4444', backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: '4px' }}>
                                          ⚠️ AJUSTE REQUERIDO
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', backgroundColor: '#F0FDF4', padding: '2px 8px', borderRadius: '4px' }}>
                                          ✓ OK
                                        </span>
                                      )
                                    ) : (
                                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Pendiente</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button 
                        onClick={() => setSelectedQuoteId(null)}
                        className="btn-secondary"
                        style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700 }}
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => handleFinalizarAlistamiento(quote.id)}
                        className="btn-primary"
                        style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer' }}
                      >
                        Finalizar Alistamiento
                      </button>
                    </div>

                  </div>
                );
              })()
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#64748B', padding: '48px 0' }}>
                <Package size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Seleccione un pedido para iniciar el pesaje</h3>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>El sistema validará automáticamente la tolerancia del 5%.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'recepcion_devoluciones' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', minHeight: '500px' }}>
          {/* COLUMNA IZQUIERDA: LISTADO DE DEVOLUCIONES PROGRAMADAS */}
          <div className="hr-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#3B82F6', fontWeight: 600, textTransform: 'uppercase' }}>Logística Inversa</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>Devoluciones por Recibir</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
              {devoluciones.filter(d => d.estado === 'PROGRAMADA').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B' }}>
                  <RefreshCw size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>No hay devoluciones programadas pendientes.</p>
                </div>
              ) : (
                devoluciones
                  .filter(d => d.estado === 'PROGRAMADA')
                  .map(d => {
                    const isSelected = selectedDevId === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          setSelectedDevId(d.id);
                          const initialItems: Record<string, { cantidadRecibida: number; destino: 'APROBADO_REINGRESO' | 'DESCARTE_MERMA' }> = {};
                          (d.items || []).forEach((item: any) => {
                            initialItems[item.sku] = {
                              cantidadRecibida: item.cantidad || 0,
                              destino: 'APROBADO_REINGRESO'
                            };
                          });
                          setReceivedDevItems(initialItems);
                        }}
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                            Devolución #{d.id.slice(-6).toUpperCase()}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#EFF6FF',
                            color: '#3B82F6'
                          }}>
                            {d.estado}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#475569' }}>
                          <div><strong>Cliente:</strong> {d.clienteNombre}</div>
                          <div><strong>Asociado a:</strong> {d.pedidoId ? `Pedido #${d.pedidoId.slice(-6).toUpperCase()}` : 'Alistamiento manual'}</div>
                          <div><strong>Recogida:</strong> {d.fechaProgramacion ? new Date(d.fechaProgramacion).toLocaleDateString() : 'N/A'}</div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: VALIDACIÓN DE ITEMS DE DEVOLUCIÓN */}
          <div className="hr-table-card" style={{ padding: '24px' }}>
            {selectedDevId ? (
              (() => {
                const dev = devoluciones.find(d => d.id === selectedDevId);
                if (!dev) return null;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Recepción Física de Devolución</span>
                          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>Recepción de Devolución #{dev.id.slice(-6).toUpperCase()}</h3>
                        </div>
                        <button 
                          onClick={() => setSelectedDevId(null)}
                          style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', fontSize: '13px', color: '#475569', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
                        <div>
                          <div><strong>Cliente:</strong> {dev.clienteNombre}</div>
                          <div><strong>Dirección de Recogida:</strong> N/A</div>
                        </div>
                        <div>
                          <div><strong>Pedido Original:</strong> {dev.pedidoId ? `#${dev.pedidoId.slice(-6).toUpperCase()}` : 'N/A'}</div>
                          <div><strong>Motivo General:</strong> N/A</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>Productos Recibidos</h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="hr-table">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th style={{ textAlign: 'right' }}>Cant. Programada</th>
                              <th style={{ width: '150px', textAlign: 'center' }}>Cant. Recibida</th>
                              <th style={{ width: '220px' }}>Calidad y Destino</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(dev.items || []).map((item: any) => {
                              const plannedQty = item.cantidad;
                              const details = receivedDevItems[item.sku] || { cantidadRecibida: plannedQty, destino: 'APROBADO_REINGRESO' };
                              
                              return (
                                <tr key={item.sku}>
                                  <td style={{ fontWeight: 600 }}>{item.nombre}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{plannedQty} kg/un</td>
                                  <td style={{ display: 'flex', justifyContent: 'center' }}>
                                    <input
                                      type="number"
                                      step="any"
                                      className="form-control"
                                      style={{ textAlign: 'right', fontWeight: 700, width: '100px' }}
                                      value={details.cantidadRecibida}
                                      onChange={e => {
                                        setReceivedDevItems(prev => ({
                                          ...prev,
                                          [item.sku]: {
                                            ...prev[item.sku],
                                            cantidadRecibida: e.target.value
                                          }
                                        }));
                                      }}
                                    />
                                  </td>
                                  <td>
                                    <select
                                      className="form-control"
                                      style={{ fontWeight: 600 }}
                                      value={details.destino}
                                      onChange={e => {
                                        setReceivedDevItems(prev => ({
                                          ...prev,
                                          [item.sku]: {
                                            ...prev[item.sku],
                                            destino: e.target.value as any
                                          }
                                        }));
                                      }}
                                    >
                                      <option value="APROBADO_REINGRESO">Aprobado: Reingresar Stock</option>
                                      <option value="DESCARTE_MERMA">Descarte: Desperdicio/Merma</option>
                                    </select>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button 
                        onClick={() => setSelectedDevId(null)}
                        className="btn-secondary"
                        style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700 }}
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => handleProcesarRecepcionDevolucion(dev.id)}
                        className="btn-primary"
                        style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700, backgroundColor: '#3B82F6', color: 'white', border: 'none', cursor: 'pointer' }}
                      >
                        Registrar Recepción Física
                      </button>
                    </div>

                  </div>
                );
              })()
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#64748B', padding: '48px 0' }}>
                <RefreshCw size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Seleccione una devolución para registrar la entrada física</h3>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>El sistema actualizará el stock en Bodega Principal para los ítems aptos.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'catalogo' && (
        <div>
          {/* SI SE ESTÁ EDITANDO O CREANDO */}
          {(editingProductId || isCreating) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Encabezado del Formulario */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Ficha de Producto</span>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>
                    {editingProductId ? `Editar: ${productForm.nombre}` : 'Registrar Nuevo Producto'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProductId(null);
                    setIsCreating(false);
                    setProductForm({ 
                      sku: '', nombre: '', categoria: '', unidadMedida: 'kg', precio_compra: 0, buffer_seguridad: 5, 
                      codigo_barras: '', iva: 0, ivaIncluido: true, control_inventario: true, produccion: false, 
                      tipoCategoria: '', lineaCategoria: '', claseCategoria: '', imagen: '' 
                    });
                    setCustomTipo('');
                    setCustomLinea('');
                    setCustomClase('');
                  }}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                >
                  Volver al Catálogo
                </button>
              </div>

              {/* Split Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
                
                {/* PANEL IZQUIERDO: IMAGEN, SKU, INDICADORES */}
                <div className="hr-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
                  <div style={{ width: '100%', aspectRatio: '1.2', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {productForm.imagen ? (
                      <img 
                        src={productForm.imagen} 
                        alt={productForm.nombre} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isGeneratingImage ? 0.3 : 1 }} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534080391025-09795d197a5b?w=400';
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94A3B8', opacity: isGeneratingImage ? 0.3 : 1 }}>
                        <Package size={64} strokeWidth={1} />
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>Sin Imagen de Producto</span>
                      </div>
                    )}

                    {isGeneratingImage && (
                      <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        zIndex: 10
                      }}>
                        <RefreshCw className="animate-spin" size={32} color="var(--primary-color)" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)' }}>Generando con IA...</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAIImage}
                    disabled={isGeneratingImage}
                    className="btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#2563EB',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      cursor: isGeneratingImage ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <RefreshCw size={16} className={isGeneratingImage ? "animate-spin" : ""} />
                    <span>✨ Generar con IA</span>
                  </button>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Código SKU</span>
                    <span className="badge-vigente" style={{ alignSelf: 'flex-start', fontFamily: 'monospace', fontSize: '14px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', borderColor: 'transparent', padding: '4px 12px' }}>
                      {productForm.sku || 'NUEVO-PRODUCTO'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>INDICADORES DE CONTROL</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#64748B' }}>Control de Stock:</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                          backgroundColor: productForm.control_inventario ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: productForm.control_inventario ? '#10B981' : '#EF4444'
                        }}>
                          {productForm.control_inventario ? 'SÍ' : 'NO'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#64748B' }}>Transformable en Planta:</span>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                          backgroundColor: productForm.produccion ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: productForm.produccion ? '#10B981' : '#EF4444'
                        }}>
                          {productForm.produccion ? 'SÍ' : 'NO'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {editingProductId && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>RESUMEN DE STOCK</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        {Object.keys(stock).map(bodegaName => {
                          const qty = getStockInBodega(productForm.sku, bodegaName);
                          return (
                            <div key={bodegaName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                              <span style={{ color: '#64748B' }}>{bodegaName}:</span>
                              <span style={{ fontWeight: 600 }}>{qty} {productForm.unidadMedida}</span>
                            </div>
                          );
                        })}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #E2E8F0', paddingTop: '8px', marginTop: '4px', fontSize: '14px', fontWeight: 700 }}>
                          <span>Stock Total:</span>
                          <span style={{ color: 'var(--primary-color)' }}>{getTotalStock(productForm.sku)} {productForm.unidadMedida}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* PANEL DERECHO: FORMULARIO EXTENSO */}
                <div className="hr-table-card" style={{ padding: '24px' }}>
                  <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>Datos Básicos y Clasificación</h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">SKU (Código Único) *</label>
                          <input type="text" className="form-control" placeholder="Ej: FIL-ROB-004" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} disabled={editingProductId !== null} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Nombre del Producto *</label>
                          <input type="text" className="form-control" placeholder="Ej: FILETE DE RÓBALO LIMPIO" value={productForm.nombre} onChange={e => setProductForm({ ...productForm, nombre: e.target.value })} />
                        </div>
                      </div>

                      {/* SELECTORES DE CATEGORÍA ANIDADOS */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                        {/* TIPO */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Tipo de Categoría *</label>
                          <select className="form-control" value={productForm.tipoCategoria} onChange={e => { const val = e.target.value; setProductForm(prev => ({ ...prev, tipoCategoria: val, lineaCategoria: '', claseCategoria: '' })); setCustomTipo(''); setCustomLinea(''); setCustomClase(''); }}>
                            <option value="">-- Seleccione Tipo --</option>
                            {uniqueTipos.map(t => <option key={t} value={t}>{t}</option>)}
                            <option value="NEW_TIPO" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>[+ Crear nuevo Tipo]</option>
                          </select>
                          {productForm.tipoCategoria === 'NEW_TIPO' && <input type="text" className="form-control" style={{ marginTop: '8px', borderColor: 'var(--primary-color)' }} placeholder="Escriba el nuevo Tipo..." value={customTipo} onChange={e => setCustomTipo(e.target.value)} />}
                        </div>

                        {/* LÍNEA */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Línea de Categoría</label>
                          <select className="form-control" value={productForm.lineaCategoria} onChange={e => { const val = e.target.value; setProductForm(prev => ({ ...prev, lineaCategoria: val, claseCategoria: '' })); setCustomLinea(''); setCustomClase(''); }} disabled={!productForm.tipoCategoria}>
                            <option value="">-- Seleccione Línea --</option>
                            {uniqueLineas.map(l => <option key={l} value={l}>{l}</option>)}
                            <option value="NEW_LINEA" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>[+ Crear nueva Línea]</option>
                          </select>
                          {productForm.lineaCategoria === 'NEW_LINEA' && <input type="text" className="form-control" style={{ marginTop: '8px', borderColor: 'var(--primary-color)' }} placeholder="Escriba la nueva Línea..." value={customLinea} onChange={e => setCustomLinea(e.target.value)} />}
                        </div>

                        {/* CLASE */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Clase de Categoría</label>
                          <select className="form-control" value={productForm.claseCategoria} onChange={e => { const val = e.target.value; setProductForm(prev => ({ ...prev, claseCategoria: val })); setCustomClase(''); }} disabled={!productForm.lineaCategoria}>
                            <option value="">-- Seleccione Clase --</option>
                            {uniqueClases.map(c => <option key={c} value={c}>{c}</option>)}
                            <option value="NEW_CLASE" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>[+ Crear nueva Clase]</option>
                          </select>
                          {productForm.claseCategoria === 'NEW_CLASE' && <input type="text" className="form-control" style={{ marginTop: '8px', borderColor: 'var(--primary-color)' }} placeholder="Escriba la nueva Clase..." value={customClase} onChange={e => setCustomClase(e.target.value)} />}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Código de Barras</label>
                          <input type="text" className="form-control" placeholder="Ej: 770123456789" value={productForm.codigo_barras} onChange={e => setProductForm({ ...productForm, codigo_barras: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Unidad de Medida *</label>
                          <select className="form-control" value={productForm.unidadMedida} onChange={e => setProductForm({ ...productForm, unidadMedida: e.target.value as any })}>
                            <option value="kg">Kilos (kg)</option>
                            <option value="und">Unidades (und)</option>
                            <option value="lb">Libras (lb)</option>
                            <option value="gr">Gramos (gr)</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Imagen (URL)</label>
                          <input type="text" className="form-control" placeholder="https://ejemplo.com/foto.jpg" value={productForm.imagen} onChange={e => setProductForm({ ...productForm, imagen: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>Política Comercial, Impuestos y Costos</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Costo Base ($ COP)</label>
                          <input type="number" className="form-control" value={productForm.precio_compra || ''} onChange={e => setProductForm({ ...productForm, precio_compra: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Buffer de Seguridad (%)</label>
                          <input type="number" className="form-control" value={productForm.buffer_seguridad} onChange={e => setProductForm({ ...productForm, buffer_seguridad: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">IVA (Tarifa)</label>
                          <select className="form-control" value={productForm.iva} onChange={e => setProductForm({ ...productForm, iva: parseInt(e.target.value) || 0 })}>
                            <option value="0">Exento (0%)</option>
                            <option value="5">Excluido/Bajo (5%)</option>
                            <option value="19">General (19%)</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">IVA Incluido</label>
                          <select className="form-control" value={productForm.ivaIncluido ? 'si' : 'no'} onChange={e => setProductForm({ ...productForm, ivaIncluido: e.target.value === 'si' })}>
                            <option value="si">Sí, IVA Incluido</option>
                            <option value="no">No, IVA Excluido</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px' }}>Parámetros del Sistema</h4>
                      <div style={{ display: 'flex', gap: '32px', margin: '4px 0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                          <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }} checked={productForm.control_inventario} onChange={e => setProductForm({ ...productForm, control_inventario: e.target.checked })} />
                          Controlar Inventario (WMS / Kardex)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                          <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }} checked={productForm.produccion} onChange={e => setProductForm({ ...productForm, produccion: e.target.checked })} />
                          Es transformable en Planta (Producción)
                        </label>
                      </div>
                    </div>

                    {/* Previsualización de Precios Sugeridos */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                        Simulación de Precios de Venta Sugeridos (Márgenes estándar)
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                          <span style={{ color: '#64748B' }}>Precio POS (+40% + Buffer):</span>
                          <strong style={{ fontSize: '15px', color: '#0F172A' }}>
                            ${Math.round(productForm.precio_compra * (1 + (productForm.buffer_seguridad / 100) + 0.40)).toLocaleString('es-CO')}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                          <span style={{ color: '#64748B' }}>Precio Restaurante (+30% + Buffer):</span>
                          <strong style={{ fontSize: '15px', color: '#0F172A' }}>
                            ${Math.round(productForm.precio_compra * (1 + (productForm.buffer_seguridad / 100) + 0.30)).toLocaleString('es-CO')}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                          <span style={{ color: '#64748B' }}>Precio Mayorista (+15% + Buffer):</span>
                          <strong style={{ fontSize: '15px', color: '#0F172A' }}>
                            ${Math.round(productForm.precio_compra * (1 + (productForm.buffer_seguridad / 100) + 0.15)).toLocaleString('es-CO')}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ border: 'none', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        <Save size={18} />
                        <span>{editingProductId ? 'Guardar Cambios' : 'Registrar Producto'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProductId(null);
                          setIsCreating(false);
                          setProductForm({ 
                            sku: '', nombre: '', categoria: '', unidadMedida: 'kg', precio_compra: 0, buffer_seguridad: 5, 
                            codigo_barras: '', iva: 0, ivaIncluido: true, control_inventario: true, produccion: false, 
                            tipoCategoria: '', lineaCategoria: '', claseCategoria: '', imagen: '' 
                          });
                          setCustomTipo('');
                          setCustomLinea('');
                          setCustomClase('');
                        }}
                        className="btn-secondary"
                        style={{ flex: 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', borderRadius: '12px', fontWeight: 600, border: '1px solid #CBD5E1', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                    </div>

                  </form>
                </div>

              </div>

              {/* CARD INFERIOR: HISTORIAL DE INVENTARIO (KARDEX) */}
              {editingProductId && (
                <div className="hr-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Libro Auxiliar</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>Historial de Movimientos de Inventario (Kardex)</h3>
                  </div>

                  {movimientos.filter(m => m.sku === productForm.sku).length === 0 ? (
                    <p style={{ color: '#64748B', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
                      No se registran movimientos históricos para este SKU.
                    </p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="hr-table">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Tipo de Movimiento</th>
                            <th>Bodega Origen</th>
                            <th>Bodega Destino</th>
                            <th>Cantidad</th>
                            <th>Lote</th>
                            <th>Referencia</th>
                            <th>Operador</th>
                            <th>Notas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movimientos.filter(m => m.sku === productForm.sku).map(m => (
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
                              <td>{m.bodegaOrigen || '-'}</td>
                              <td>{m.bodegaDestino || '-'}</td>
                              <td style={{ fontWeight: 700 }}>{m.cantidad}</td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#3B82F6' }}>{m.lote || '-'}</td>
                              <td style={{ fontSize: '11px' }}>{m.referenciaTipo ? `${m.referenciaTipo}: ${m.referenciaId}` : '-'}</td>
                              <td>{m.actor}</td>
                              <td style={{ fontSize: '12px', color: '#64748B', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.notas}>
                                {m.notas}
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
          ) : (
            
            /* TABLA PRINCIPAL DE CATÁLOGO */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Filtros y Búsqueda</span>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>Catálogo General de Productos</h2>
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                  <PlusCircle size={18} />
                  <span>Registrar Producto</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="pos-search-bar" style={{ marginBottom: 0, flex: 1 }}>
                  <Search size={18} color="#64748B" />
                  <input
                    type="text"
                    className="pos-search-input"
                    placeholder="Buscar producto por nombre, SKU o código de barras..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>

                <select
                  className="form-control"
                  style={{ width: '180px', height: '48px', borderRadius: '12px' }}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="ACTIVOS">Solo Activos</option>
                  <option value="INACTIVOS">Solo Inactivos</option>
                </select>
              </div>

              <div className="hr-table-card">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Imagen</th>
                      <th>SKU</th>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th style={{ textAlign: 'right' }}>Costo Base</th>
                      
                      {/* Columnas dinámicas de bodegas */}
                      {Object.keys(stock).map(bodegaName => (
                        <th key={bodegaName} style={{ textAlign: 'right' }}>{bodegaName}</th>
                      ))}
                      
                      <th style={{ textAlign: 'right', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>Stock Total</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => {
                      const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                          (p.codigo_barras && p.codigo_barras.includes(searchTerm));
                      const matchStatus = statusFilter === 'TODOS' ? true : statusFilter === 'ACTIVOS' ? p.activo : !p.activo;
                      return matchSearch && matchStatus;
                    }).map(p => (
                      <tr 
                        key={p.sku} 
                        style={{ opacity: p.activo ? 1 : 0.6, cursor: 'pointer' }}
                        onClick={() => handleEditProduct(p)}
                      >
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {p.imagen ? (
                              <img src={p.imagen} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Package size={20} color="#94A3B8" />
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>{p.sku}</td>
                        <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                        <td>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', backgroundColor: '#F1F5F9', color: '#475569' }}>
                            {p.categoria}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ${(p.precio_compra || 0).toLocaleString('es-CO')}
                        </td>

                        {/* Stock por bodegas */}
                        {Object.keys(stock).map(bodegaName => {
                          const qty = getStockInBodega(p.sku, bodegaName);
                          return (
                            <td key={bodegaName} style={{ textAlign: 'right', color: qty > 0 ? '#0F172A' : '#94A3B8' }}>
                              {qty} {p.unidadMedida}
                            </td>
                          );
                        })}

                        <td style={{ textAlign: 'right', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.02)', color: 'var(--primary-color)' }}>
                          {getTotalStock(p.sku)} {p.unidadMedida}
                        </td>

                        <td onClick={e => e.stopPropagation()}>
                          <span
                            onClick={() => handleToggleProduct(p.sku)}
                            className={`badge-status ${p.activo ? 'activo' : 'inactivo'}`}
                            style={{ cursor: 'pointer' }}
                          >
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => handleEditProduct(p)} 
                            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </div>
      )}

      {viewMode === 'categorias' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
          
          {/* COLUMNA IZQUIERDA: FORMULARIO CREAR/EDITAR */}
          <div className="hr-table-card" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
              {editingCategoryId ? 'Editar Categoría' : 'Crear Nueva Categoría'}
            </h3>
            
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tipo (Grupo Principal) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Producto, Materia Prima, Insumo"
                  value={categoryForm.tipo}
                  onChange={e => setCategoryForm({ ...categoryForm, tipo: e.target.value })}
                  list="existing-types"
                />
                <datalist id="existing-types">
                  {Array.from(new Set(categorias.map(c => c.tipo))).map(t => <option key={t} value={t} />)}
                </datalist>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Línea *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Pescados, Mariscos, Abarrotes"
                  value={categoryForm.linea}
                  onChange={e => setCategoryForm({ ...categoryForm, linea: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Clase (Detalle / Especie) *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Filetes, Enteros, Camarón Tigre"
                  value={categoryForm.clase}
                  onChange={e => setCategoryForm({ ...categoryForm, clase: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ border: 'none', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  <Save size={16} />
                  <span>{editingCategoryId ? 'Actualizar Categoría' : 'Crear Categoría'}</span>
                </button>
                {editingCategoryId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCategoryForm({ tipo: '', linea: '', clase: '' });
                    }}
                    className="btn-secondary"
                    style={{ flex: 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', borderRadius: '12px', fontWeight: 600, border: '1px solid #CBD5E1', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* COLUMNA DERECHA: LISTADO Y JERARQUÍA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Buscador */}
            <div className="pos-search-bar" style={{ marginBottom: 0 }}>
              <Search size={18} color="#64748B" />
              <input
                type="text"
                className="pos-search-input"
                placeholder="Buscar categorías por tipo, línea o clase..."
                value={categorySearch}
                onChange={e => setCategorySearch(e.target.value)}
              />
            </div>

            {/* Tabla de Configuración de Categorías */}
            <div className="hr-table-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px', color: '#0F172A' }}>Registros de Configuración de Categoría (3NF)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Tipo (Nivel 1)</th>
                      <th>Línea (Nivel 2)</th>
                      <th>Clase (Nivel 3)</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.filter(c => {
                      const search = categorySearch.toLowerCase();
                      return c.tipo.toLowerCase().includes(search) || 
                             c.linea.toLowerCase().includes(search) || 
                             c.clase.toLowerCase().includes(search);
                    }).map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700 }}>{c.tipo}</td>
                        <td style={{ fontWeight: 600, color: '#475569' }}>{c.linea}</td>
                        <td style={{ color: '#0F172A' }}>{c.clase}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                              onClick={() => {
                                setEditingCategoryId(c.id);
                                setCategoryForm({ tipo: c.tipo, linea: c.linea, clase: c.clase });
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                              title="Eliminar"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categorias.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: '#64748B', padding: '16px' }}>
                          No hay categorías configuradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Árbol Jerárquico Visual */}
            <div className="hr-table-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px', color: '#0F172A' }}>Jerarquía Visual de Clasificación</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Array.from(new Set(categorias.map(c => c.tipo))).map(tipoName => {
                  const lineasForTipo = Array.from(new Set(categorias.filter(c => c.tipo === tipoName).map(c => c.linea)));
                  return (
                    <div key={tipoName} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', backgroundColor: '#F8FAFC' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary-color)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }}></span>
                        {tipoName}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', paddingLeft: '14px', borderLeft: '1px dashed #CBD5E1' }}>
                        {lineasForTipo.map(lineaName => {
                          const clasesForLinea = categorias.filter(c => c.tipo === tipoName && c.linea === lineaName).map(c => c.clase);
                          return (
                            <div key={lineaName}>
                              <div style={{ fontWeight: 700, fontSize: '13px', color: '#475569' }}>└─ {lineaName}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', paddingLeft: '24px' }}>
                                {clasesForLinea.map(claseName => (
                                  <span key={claseName} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px', backgroundColor: 'white', border: '1px solid #E2E8F0', color: '#0F172A' }}>
                                    {claseName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
