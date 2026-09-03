import { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  Truck,
  PlusCircle,
  ShoppingBag,
  Package,
  Layers,
  FileText,
  Boxes,
  ArrowRightLeft,
  Scissors,
  BarChart3,
  Scale,
  DollarSign,
  Tag,
  Settings,
  RotateCcw,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { ProductTable } from './inventory/components/ProductTable';
import { ProductForm } from './inventory/components/ProductForm';
import { CategoryManager } from './inventory/components/CategoryManager';
import { PurchaseOrderForm } from './inventory/components/PurchaseOrderForm';
import { TransferForm } from './inventory/components/TransferForm';
import { ProductionForm } from './inventory/components/ProductionForm';
import { ColdRoomPreparation } from './inventory/components/ColdRoomPreparation';
import { ReturnsReceiver } from './inventory/components/ReturnsReceiver';
import { PurchasesReport } from './inventory/components/PurchasesReport';
import { AnalisisAbcWidget } from './inventory/components/AnalisisAbcWidget';
import { StockMatrizTable } from './inventory/components/StockMatrizTable';
import { KardexTable } from './inventory/components/KardexTable';
import { WarehouseTransferPanel } from './inventory/components/WarehouseTransferPanel';
import { WarehouseConfigManager } from './inventory/components/WarehouseConfigManager';
import { useInventoryStore } from '../store/useInventoryStore';
import { useMovementStore, MovimientoInventario } from '../store/useMovementStore';
import { usePurchaseStore, OrdenCompra, CuentaPorPagar } from '../store/usePurchaseStore';
import { cashService } from '../services/cashService';
import { useCategoryStore } from '../store/useCategoryStore';
import { useOrderStore } from '../store/useOrderStore';
import { useReturnStore } from '../store/useReturnStore';
import { useEventStore } from '../store/useEventStore';
import { useAppStore } from '../store/useAppStore';
import { useSupplierStore } from '../store/useSupplierStore';
import { useWarehouseStore } from '../store/useWarehouseStore';
import type { ProductCatalog, ProductPricing, Product } from '../types/erp.types';

const generateId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;

const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s|-)\S/g, (x) => x.toUpperCase());
};


export default function InventoryView() {
  const { products, productsCatalog, setProductsCatalog, setProductPricings, setStock, setStockAsync, loadInventory, loadStock } = useInventoryStore();
  const stock = useInventoryStore((s) => s.stock) as any;
  const { movimientos, addMovimiento, addMovimientoAsync } = useMovementStore();
  const { ordenesCompra, setOrdenesCompra, addOrdenCompraAsync, addCuentaPorPagarAsync } = usePurchaseStore();
  const { categorias, setCategorias } = useCategoryStore();
  const { quotations, setQuotations } = useOrderStore();
  const { devoluciones, setDevoluciones } = useReturnStore();
  const publishEvent = useEventStore((s) => s.publishEvent);
  const userRole = useAppStore((s) => s.userRole);
  const proveedores = useSupplierStore((s) => s.proveedores);
  const bodegas = useWarehouseStore((s) => s.bodegas);
  const [activeBodega, setActiveBodega] = useState('Bodega Principal');
  const [historyTab, setHistoryTab] = useState<'movimientos' | 'compras'>('movimientos');
  const [viewMode, setViewMode] = useState<
    | 'operaciones'
    | 'kardex'
    | 'cuarto_frio'
    | 'despiece'
    | 'traslados'
    | 'analisis_abc'
    | 'compras'
    | 'registrar_compra'
    | 'catalogo'
    | 'categorias'
    | 'recepcion_devoluciones'
    | 'configuracion_bodegas'
    | 'reportes_compra'
  >('operaciones');

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
    return stock[bodegaName]?.[sku] || 0;
  };

  // Helper to calculate total stock across all bodegas for a given SKU
  const getTotalStock = (sku: string) => {
    return Object.keys(stock).reduce((acc: any, bodegaName: string) => {
      return acc + getStockInBodega(sku, bodegaName);
    }, 0);
  };

  // --- ALERTAS INVENTARIO ABC ---
  useEffect(() => {
    if (products.length === 0 || Object.keys(stock).length === 0) return;
    
    if (sessionStorage.getItem('alertedLowStockA')) return;

    const lowStockAItems = products.filter((p: any) => {
      if (p.categoriaABC !== 'A' || !p.activo || p.control_inventario === false) return false;
      const totalStock = getTotalStock(p.sku);
      return totalStock <= (p.buffer_seguridad || 5);
    });

    if (lowStockAItems.length > 0) {
      sessionStorage.setItem('alertedLowStockA', 'true');
      const itemNames = lowStockAItems.map((p: any) => `<b>${p.nombre}</b> (Stock: ${getTotalStock(p.sku)} ${p.unidadMedida || 'kg'})`).join('<br/>');
      Swal.fire({
        icon: 'warning',
        title: 'Stock Crítico - Categoría A',
        html: `<div style="text-align: left; font-size: 14px;">Los siguientes productos de Categoría A (Prioridad Alta) están por debajo de su buffer de seguridad:<br/><br/>${itemNames}</div>`,
        confirmButtonColor: 'var(--primary-color)'
      });
    }
  }, [products, stock]);

  // Derive unique categories for selectors
  const uniqueTipos = Array.from(new Set(categorias.map((c: any) => c.tipo))).filter(Boolean);
  if (productForm.tipoCategoria && !uniqueTipos.includes(productForm.tipoCategoria) && productForm.tipoCategoria !== 'NEW_TIPO') {
    uniqueTipos.push(productForm.tipoCategoria);
  }

  const uniqueLineas = Array.from(new Set(categorias.filter(c => c.tipo === productForm.tipoCategoria).map((c: any) => c.linea))).filter(Boolean);
  if (productForm.lineaCategoria && !uniqueLineas.includes(productForm.lineaCategoria) && productForm.lineaCategoria !== 'NEW_LINEA') {
    uniqueLineas.push(productForm.lineaCategoria);
  }

  const uniqueClases = Array.from(new Set(categorias.filter(c => c.tipo === productForm.tipoCategoria && c.linea === productForm.lineaCategoria).map((c: any) => c.clase))).filter(Boolean);
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
      c => (c.tipo || '').trim().toUpperCase() === finalTipo.toUpperCase() && 
           (c.linea || '').trim().toUpperCase() === finalLinea.toUpperCase() && 
           (c.clase || '').trim().toUpperCase() === finalClase.toUpperCase()
    );
    if (!existsCat && finalTipo) {
      const newCatId = generateId('cat');
      setCategorias((prev: any) => [...prev, { id: newCatId, tipo: finalTipo, linea: finalLinea, clase: finalClase }]);
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
      setProductsCatalog((prev: any) => prev.map((p: any) => p.id === editingProductId ? {
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
        setProductPricings((prev: any) => [newPricing, ...prev]);
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

      setProductsCatalog((prev: any) => [newCatalogItem, ...prev]);
      setProductPricings((prev: any) => [newPricingItem, ...prev]);
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
        setProductForm((prev: any) => ({ ...prev, imagen: result.value }));
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
        setProductForm((prev: any) => ({ ...prev, imagen: publicUrl }));
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
    setProductsCatalog((prev: any) => prev.map((p: any) => p.sku === sku ? { ...p, activo: !p.activo } : p));
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
      setCategorias((prev: any) => prev.map((c: any) => c.id === editingCategoryId ? {
        ...c,
        tipo: cleanTipo,
        linea: cleanLinea,
        clase: cleanClase
      } : c));
      setEditingCategoryId(null);
      Swal.fire({ icon: 'success', title: 'Categoría actualizada', text: 'La categoría ha sido actualizada con éxito.', timer: 1500, showConfirmButton: false });
    } else {
      const exists = categorias.some(c => 
        (c.tipo || '').toUpperCase() === cleanTipo.toUpperCase() && 
        (c.linea || '').toUpperCase() === cleanLinea.toUpperCase() && 
        (c.clase || '').toUpperCase() === cleanClase.toUpperCase()
      );
      if (exists) {
        Swal.fire({ icon: 'error', title: 'Duplicado', text: 'Esta combinación de Tipo > Línea > Clase ya existe.', confirmButtonColor: 'var(--primary-color)' });
        return;
      }

      setCategorias((prev: any) => [...prev, {
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
        setCategorias((prev: any) => prev.filter((c: any) => c.id !== id));
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
    iva: 19,
    items: [] as any[]
  });

  useEffect(() => {
    setCompra((prev: any) => {
      if (products.length > 0 && !prev.sku) {
        return { ...prev, sku: products[0].sku };
      }
      return prev;
    });
  }, [products]);

  useEffect(() => {
    const activeProv = proveedores.filter(p => p.activo);
    setCompra((prev: any) => {
      if (activeProv.length > 0 && !prev.proveedorId) {
        return { ...prev, proveedorId: activeProv[0].id };
      }
      return prev;
    });
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
    setProdMateriaPrima(prev => {
      const materias = products.filter(p => p.activo && p.categoria === 'MATERIA PRIMA');
      if (materias.length > 0 && !materias.some(m => m.sku === prev)) {
        return materias[0].sku;
      }
      return prev;
    });
    setProdTerminado(prev => {
      const terminados = products.filter(p => p.activo && p.categoria !== 'MATERIA PRIMA');
      if (terminados.length > 0 && !terminados.some(t => t.sku === prev)) {
        return terminados[0].sku;
      }
      return prev;
    });
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

  const handleProductIvaUpdate = (sku: string, newIva: number) => {
    setProductsCatalog((prev: any) => prev.map((p: any) => p.sku === sku ? { ...p, iva: newIva, ivaIncluido: newIva > 0 } : p));
  };

  const handleProcesarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compra.proveedorId) {
      Swal.fire({
        icon: 'warning',
        title: 'Proveedor Requerido',
        text: 'Por favor seleccione el proveedor origen de la compra.'
      });
      return;
    }

    const itemsAProcesar = (Array.isArray(compra.items) && compra.items.length > 0)
      ? compra.items
      : (compra.sku && compra.cantidad > 0)
        ? [{
            sku: compra.sku,
            nombre: products.find(p => p.sku === compra.sku)?.nombre || compra.sku,
            cantidad: compra.cantidad,
            precioUnitario: compra.costoUnitario || products.find(p => p.sku === compra.sku)?.precio_compra || 0,
            iva: products.find(p => p.sku === compra.sku)?.iva || 0,
            lote: (compra.lote || `LT-${Date.now().toString().slice(-6)}`).toUpperCase()
          }]
        : [];

    if (itemsAProcesar.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Lista de Ítems Vacía',
        text: 'Por favor agregue al menos un producto a la compra.'
      });
      return;
    }

    const selectedProveedor = proveedores.find(p => p.id === compra.proveedorId);
    if (!selectedProveedor) return;

    const bodegaDestino = compra.bodega || 'Bodega Principal';

    try {
      Swal.fire({
        title: 'Procesando Compra',
        text: 'Guardando datos en el servidor, por favor espere...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // 1. Calcular Totales Consolidados con IVA Individual por Producto
      const subtotal = itemsAProcesar.reduce((acc: number, item: any) => acc + (Number(item.cantidad) * Number(item.precioUnitario)), 0);
      const valorIva = itemsAProcesar.reduce((acc: number, item: any) => {
        const sub = Number(item.cantidad) * Number(item.precioUnitario);
        const itemIvaPct = item.iva !== undefined ? Number(item.iva) : 0;
        return acc + Math.round(sub * (itemIvaPct / 100));
      }, 0);
      const totalOC = subtotal + valorIva + (compra.fletes || 0);
      const ocId = generateId('oc');

      const newOC: OrdenCompra = {
        id: ocId,
        proveedorId: selectedProveedor.id,
        proveedorNombre: selectedProveedor.nombre,
        fecha: new Date().toISOString(),
        estado: 'RECIBIDA',
        items: itemsAProcesar.map((item: any) => ({
          sku: item.sku,
          nombre: item.nombre || products.find(p => p.sku === item.sku)?.nombre || item.sku,
          cantidad: Number(item.cantidad),
          precioUnitario: Number(item.precioUnitario),
          iva: item.iva !== undefined ? Number(item.iva) : 0,
          lote: item.lote || `LT-${Date.now().toString().slice(-6)}`.toUpperCase()
        })),
        totalCompra: totalOC,
        subtotal: subtotal,
        iva: 0,
        valorIva: valorIva,
        fletes: compra.fletes || 0,
        formaPago: compra.formaPago || 'CONTADO',
        saldo: (compra.formaPago || 'CONTADO') === 'CREDITO' ? totalOC : 0,
        bodegaDestino: bodegaDestino,
        actor: userRole,
        notas: `Entrada Multi-Producto (${itemsAProcesar.length} ítems). Pago: ${compra.formaPago || 'CONTADO'}. Fletes: $${compra.fletes || 0}. IVA Total: $${valorIva.toLocaleString('es-CO')}`
      };

      // Guardar Orden de Compra asíncronamente
      await addOrdenCompraAsync(newOC);

      // Tarea 3.1: Instanciar CuentaPorPagar si es a CREDITO
      if ((compra.formaPago || 'CONTADO') === 'CREDITO') {
        const diasPlazo = selectedProveedor.plazoPagoDias || 30;
        const fechaVenc = new Date();
        fechaVenc.setDate(fechaVenc.getDate() + diasPlazo);

        const nuevaCuentaPorPagar: CuentaPorPagar = {
          id: generateId('cpp'),
          ordenCompraId: ocId,
          proveedorId: selectedProveedor.id,
          proveedorNombre: selectedProveedor.nombre,
          fechaEmision: new Date().toISOString(),
          fechaVencimiento: fechaVenc.toISOString(),
          montoTotal: totalOC,
          saldoPendiente: totalOC,
          estado: 'PENDIENTE',
          notas: `Compra a crédito (${diasPlazo} días de plazo) - Orden ${ocId}`
        };
        await addCuentaPorPagarAsync(nuevaCuentaPorPagar);
      }

      // Tarea 3.2: Registrar egreso en caja si es CONTADO con resiliencia
      if ((compra.formaPago || 'CONTADO') === 'CONTADO') {
        try {
          cashService.seedCajasParaBodegas();
          const bodegaMatched = bodegas.find(b => b.nombre === bodegaDestino);
          const bodegaId = bodegaMatched ? bodegaMatched.id : '1';
          const cajasEnBodega = cashService.getCajasPorBodega(bodegaId);
          let turnoActivo = null;
          for (const c of cajasEnBodega) {
            const t = cashService.getTurnoActivo(c.id);
            if (t) {
              turnoActivo = t;
              break;
            }
          }
          if (!turnoActivo) {
            const todosTurnos = cashService.getTurnos();
            turnoActivo = todosTurnos.find(t => t.estado === 'ABIERTO') || null;
          }

          if (turnoActivo) {
            cashService.registrarMovimiento(
              turnoActivo.id,
              turnoActivo.cajaId,
              'EGRESO_GASTO',
              'EFECTIVO',
              totalOC,
              `Pago contado Compra ${ocId} a ${selectedProveedor.nombre}`,
              ocId,
              userRole
            );
          } else {
            console.warn('No hay turno de caja abierto para registrar el egreso por compra de contado.');
          }
        } catch (cashErr) {
          console.error('Error al registrar egreso en caja:', cashErr);
        }
      }

      // Tarea 3.3: Actualizar precio_compra e IVA en catálogo de productos
      setProductsCatalog((prevCatalog: ProductCatalog[]) => {
        return prevCatalog.map(prod => {
          const itemComprado = itemsAProcesar.find((item: any) => item.sku === prod.sku);
          if (itemComprado) {
            const nuevoPrecio = Number(itemComprado.precioUnitario);
            const nuevoIva = itemComprado.iva !== undefined ? Number(itemComprado.iva) : (prod.iva ?? 0);
            return {
              ...prod,
              precio_compra: nuevoPrecio > 0 ? nuevoPrecio : (prod.precio_compra ?? 0),
              iva: nuevoIva,
              ivaIncluido: nuevoIva > 0 ? true : Boolean(prod.ivaIncluido)
            };
          }
          return prod;
        });
      });

      // 2. Actualizar stock para cada producto recibido en la orden de compra asíncronamente
      const newStock = { ...stock };
      if (!newStock[bodegaDestino]) {
        newStock[bodegaDestino] = {};
      }
      itemsAProcesar.forEach((item: any) => {
        const currentStock = newStock[bodegaDestino][item.sku] || 0;
        newStock[bodegaDestino][item.sku] = currentStock + Number(item.cantidad);
      });
      await setStockAsync(newStock);

      // 3. Registrar Movimiento de Inventario (WMS Kardex) para cada producto asíncronamente
      for (const item of itemsAProcesar) {
        const loteItem = item.lote || `LT-${Date.now().toString().slice(-6)}`.toUpperCase();
        const nombreItem = item.nombre || products.find(p => p.sku === item.sku)?.nombre || item.sku;
        
        const newMov: MovimientoInventario = {
          id: generateId('mov'),
          timestamp: new Date().toISOString(),
          tipo: 'ENTRADA_COMPRA',
          sku: item.sku,
          nombreProducto: nombreItem,
          bodegaDestino: bodegaDestino,
          cantidad: Number(item.cantidad),
          lote: loteItem,
          referenciaId: ocId,
          referenciaTipo: 'ORDEN_COMPRA',
          actor: userRole,
          notas: `Entrada por compra recibida de ${selectedProveedor.nombre}`
        };
        await addMovimientoAsync(newMov);
      }

      // Publicar evento
      publishEvent('METADATA_CONFIGURED', userRole, `Entrada de Compra Multi-Producto: ${itemsAProcesar.length} ítems recibidos de ${selectedProveedor.nombre}`, { action: 'purchase', ocId, itemsCount: itemsAProcesar.length });

      Swal.fire({
        icon: 'success',
        title: '¡Compra Registrada!',
        text: `Se registraron ${itemsAProcesar.length} producto(s) en ${bodegaDestino} por $${totalOC.toLocaleString('es-CO')}.`,
        timer: 2000,
        showConfirmButton: false
      });

      // Limpiar Formulario de Compra
      // NOTE: activeProducts should be mapped from products like the original code, but since the original had activeProducts[0]?.sku || '', we use products.filter(p => p.activo) as activeProducts
      const activeProducts = products.filter(p => p.activo);
      setCompra({
        proveedorId: '',
        bodega: 'Bodega Principal',
        sku: activeProducts[0]?.sku || '',
        cantidad: 1,
        lote: '',
        costoUnitario: 0,
        formaPago: 'CONTADO',
        iva: 19,
        fletes: 0,
        items: []
      });
    } catch (error: any) {
      console.error('Error al procesar compra:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de Integridad',
        text: 'Ocurrió un error al persistir los datos de la compra. ' + error.message,
        confirmButtonColor: 'var(--primary-color)'
      });
    }
  };

  const handleTraslado = async (e: React.FormEvent) => {
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

    const stockDisponible = stock[traslado.origen]?.[traslado.sku] || 0;
    if (stockDisponible < tCant) {
      Swal.fire({ icon: 'error', title: 'Stock Insuficiente', text: 'La bodega de origen no dispone de existencias suficientes.' });
      return;
    }

    // Control FEFO Simulado
    const result = await Swal.fire({
      title: 'Validación FEFO',
      html: `
        <div style="font-size: 14px; color: #475569;">
          <p><strong>Atención:</strong> Validando regla First-Expired-First-Out (FEFO).</p>
          <p>Se priorizará el lote más antiguo disponible para este traslado.</p>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Omitir Regla',
      confirmButtonColor: 'var(--primary-color)',
      cancelButtonColor: '#EF4444'
    });

    if (result.dismiss === Swal.DismissReason.cancel) {
       const pinResult = await Swal.fire({
         title: 'Autorización de Supervisor',
         text: 'Ingrese el PIN para omitir la regla FEFO. (PIN: 1234)',
         input: 'password',
         showCancelButton: true,
         confirmButtonColor: 'var(--primary-color)'
       });

       if (!pinResult.isConfirmed || pinResult.value !== '1234') {
         Swal.fire('Denegado', 'PIN incorrecto o acción cancelada.', 'error');
         return;
       }
    } else if (!result.isConfirmed) {
      return;
    }

    // Procesar traslado de manera atómica local
    setStock((prev: any) => {
      const newStock = { ...prev };
      if (!newStock[traslado.origen]) newStock[traslado.origen] = {};
      if (!newStock[traslado.destino]) newStock[traslado.destino] = {};

      const stockOrigen = newStock[traslado.origen][traslado.sku] || 0;
      newStock[traslado.origen][traslado.sku] = Math.max(0, stockOrigen - tCant);

      const stockDestino = newStock[traslado.destino][traslado.sku] || 0;
      newStock[traslado.destino][traslado.sku] = stockDestino + tCant;

      return newStock;
    });

    // F2: Registrar los movimientos de traslado (Salida y Entrada)
    const refId = generateId('tras');
    const prodInfo = products.find(p => p.sku === traslado.sku);
    const prodNombre = prodInfo?.nombre || traslado.sku;
    const prodLote = `LT-TR-${Date.now().toString().slice(-6)}`;

    const movSalida: MovimientoInventario = {
      id: generateId('mov'),
      timestamp: new Date().toISOString(),
      tipo: 'TRASLADO_SALIDA',
      sku: traslado.sku,
      nombreProducto: prodNombre,
      bodegaOrigen: traslado.origen,
      bodegaDestino: traslado.destino,
      cantidad: tCant,
      lote: prodLote,
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
      nombreProducto: prodNombre,
      bodegaOrigen: traslado.origen,
      bodegaDestino: traslado.destino,
      cantidad: tCant,
      lote: prodLote,
      referenciaId: refId,
      referenciaTipo: 'TRASLADO',
      actor: userRole,
      notas: `Traslado desde ${traslado.origen}`
    };

    addMovimiento(movSalida);
    addMovimiento(movEntrada);

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

    const currentStockMP = stock['Bodega Principal']?.[prodMateriaPrima] || 0;
    if (currentStockMP < mpCant) {
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
    setStock((prev: any) => {
      const newStock = { ...prev };
      if (!newStock['Bodega Principal']) newStock['Bodega Principal'] = {};

      const currentMP = newStock['Bodega Principal'][prodMateriaPrima] || 0;
      newStock['Bodega Principal'][prodMateriaPrima] = Math.max(0, currentMP - mpCant);

      const currentPT = newStock['Bodega Principal'][prodTerminado] || 0;
      newStock['Bodega Principal'][prodTerminado] = currentPT + ptCant;

      return newStock;
    });

    // F2: Registrar Movimientos de Producción (Consumo MP y Entrada PT)
    const prodRefId = generateId('prod');
    const nameMP = products.find(p => p.sku === prodMateriaPrima)?.nombre || 'Materia Prima';
    const namePT = products.find(p => p.sku === prodTerminado)?.nombre || 'Producto Terminado';
    const loteMP = 'LOT-MP';
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

    addMovimiento(movConsumo);
    addMovimiento(movSalida);

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

    const stockChanges: Record<string, number> = {};
    const newMovements: MovimientoInventario[] = [];

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
      setStock((prev: any) => {
        const newStock = { ...prev };
        if (!newStock['Bodega Principal']) newStock['Bodega Principal'] = {};
        
        Object.entries(stockChanges).forEach(([sku, qty]) => {
          const currentQty = newStock['Bodega Principal'][sku] || 0;
          newStock['Bodega Principal'][sku] = currentQty + qty;
        });

        return newStock;
      });
    }

    if (newMovements.length > 0) {
      newMovements.forEach((mov: any) => addMovimiento(mov));
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

  // Valor total del inventario en libros (Stock * CPP)
  const valorTotalInventario = useMemo(() => {
    return products.reduce((acc, p) => {
      const totStock = getTotalStock(p.sku);
      const cpp = (p as any).costo_promedio_ponderado || p.precio_compra || 0;
      return acc + (totStock * cpp);
    }, 0);
  }, [products, stock]);

  const totalSkusActivos = useMemo(() => {
    return products.filter((p) => p.activo).length;
  }, [products]);

  return (
    <div className="animate-fade-in space-y-6 h-full overflow-y-auto pr-2 pb-12">
      {/* ── 1. Hero Header & Quick Action Bar ── */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ERP Data-Driven
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30">
                NIIF / NIC 2
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
              <Boxes className="w-7 h-7 text-emerald-400" />
              Gestión de Inventario, WMS & Trazabilidad
            </h1>
          </div>

          {/* Quick Action Bar Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setViewMode('catalogo');
                setEditingProductId(null);
                setIsCreating(true);
                setProductForm({ 
                  sku: '', nombre: '', categoria: '', unidadMedida: 'kg', precio_compra: 0, buffer_seguridad: 5, 
                  codigo_barras: '', iva: 0, ivaIncluido: true, control_inventario: true, produccion: false, 
                  tipoCategoria: '', lineaCategoria: '', claseCategoria: '', imagen: ''
                });
                setCustomTipo('');
                setCustomLinea('');
                setCustomClase('');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Package className="w-4 h-4" />
              Nuevo Producto
            </button>

            <button
              onClick={() => setViewMode('registrar_compra')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Recibir Compra
            </button>

            <button
              onClick={() => setViewMode('despiece')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all cursor-pointer"
            >
              <Scissors className="w-4 h-4" />
              Nuevo Despiece
            </button>

            <button
              onClick={() => setViewMode('traslados')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Traslado Bodega
            </button>

            <button
              onClick={() => setViewMode('kardex')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold text-xs transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Ver Kardex NIIF
            </button>

            <button
              onClick={() => setViewMode('configuracion_bodegas')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/5 transition-all cursor-pointer"
              title="Configuración de Bodegas y Cuartos Fríos"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 2. Tarjetas KPI Métricas de Alto Nivel ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5">
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
            <span className="text-[11px] text-slate-400 font-semibold uppercase block">Valor Total en Libros</span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              ${Math.round(valorTotalInventario).toLocaleString('es-CO')}
            </span>
            <span className="text-[10px] text-slate-500 block">Costo Promedio Ponderado</span>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
            <span className="text-[11px] text-slate-400 font-semibold uppercase block">SKUs Activos</span>
            <span className="text-lg font-black text-white font-mono">{totalSkusActivos}</span>
            <span className="text-[10px] text-slate-500 block">Referencias en Catálogo</span>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
            <span className="text-[11px] text-slate-400 font-semibold uppercase block">Alistamientos B2B</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-cyan-400 font-mono">{pendingPrepCount}</span>
              {pendingPrepCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                  Pendientes
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block">Cuarto Frío Picking</span>
          </div>

          <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
            <span className="text-[11px] text-slate-400 font-semibold uppercase block">Devoluciones</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-rose-400 font-mono">{pendingDevCount}</span>
              {pendingDevCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                  Por Recibir
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block">Control de Calidad B2B</span>
          </div>
        </div>
      </div>

      {/* ── 3. Navegación Modular por 7 Pestañas ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none">
        <button
          onClick={() => setViewMode('operaciones')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            viewMode === 'operaciones'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <Boxes className="w-4 h-4" />
          1. Existencias Multibodega
        </button>

        <button
          onClick={() => setViewMode('kardex')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            viewMode === 'kardex'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          2. Kardex Contable NIIF
        </button>

        <button
          onClick={() => setViewMode('cuarto_frio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            viewMode === 'cuarto_frio'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <Scale className="w-4 h-4" />
          3. Alistamiento Cuarto Frío
          {pendingPrepCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-500 text-slate-950 font-black">
              {pendingPrepCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setViewMode('despiece')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            viewMode === 'despiece'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <Scissors className="w-4 h-4" />
          4. Despiece & Comandas
        </button>

        <button
          onClick={() => setViewMode('traslados')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            viewMode === 'traslados'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/10'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          5. Traslados Internos
        </button>

        <button
          onClick={() => setViewMode('analisis_abc')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            viewMode === 'analisis_abc'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-500/10'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          6. Análisis Pareto ABC
        </button>

        <button
          onClick={() => setViewMode('reportes_compra')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            viewMode === 'reportes_compra' || viewMode === 'registrar_compra'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <Truck className="w-4 h-4" />
          7. Compras & Entradas
        </button>

        <div className="h-4 w-px bg-white/10 mx-1 shrink-0" />

        <button
          onClick={() => setViewMode('catalogo')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            viewMode === 'catalogo'
              ? 'bg-slate-700 text-white border border-white/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Catálogo
        </button>

        <button
          onClick={() => setViewMode('categorias')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            viewMode === 'categorias'
              ? 'bg-slate-700 text-white border border-white/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Categorías
        </button>

        <button
          onClick={() => setViewMode('recepcion_devoluciones')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            viewMode === 'recepcion_devoluciones'
              ? 'bg-slate-700 text-white border border-white/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Devoluciones ({pendingDevCount})
        </button>
      </div>

      {/* ── 4. RENDERIZADO CONDICIONAL DE VISTAS ── */}

      {/* TAB 1: Matriz de Existencias Multibodega */}
      {viewMode === 'operaciones' && (
        <div className="space-y-6">
          <StockMatrizTable products={products} stock={stock} bodegas={bodegas} />

          {/* Panel de Trazabilidad Rápida */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Trazabilidad Reciente</span>
                <h3 className="text-base font-bold text-white">Últimos Movimientos Registrados</h3>
              </div>
              <button
                onClick={() => setViewMode('kardex')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Abrir Kardex Completo <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/60 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3">Origen $\to$ Destino</th>
                    <th className="py-2.5 px-3 text-right">Cantidad</th>
                    <th className="py-2.5 px-3">Lote</th>
                    <th className="py-2.5 px-3">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {movimientos.slice(0, 10).map((m) => (
                    <tr key={m.id} className="hover:bg-white/[0.02]">
                      <td className="py-2 px-3 text-slate-400">{new Date(m.timestamp).toLocaleString('es-CO')}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-white/5">
                          {m.tipo}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium">{m.nombreProducto}</td>
                      <td className="py-2 px-3 text-slate-400">
                        {m.bodegaOrigen || '-'} $\to$ {m.bodegaDestino || '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-cyan-300">{m.cantidad}</td>
                      <td className="py-2 px-3 font-mono text-slate-400">{m.lote || '-'}</td>
                      <td className="py-2 px-3 text-slate-400">{m.actor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Kardex Contable NIIF */}
      {viewMode === 'kardex' && (
        <KardexTable bodegas={bodegas} onSelectSku={(sku) => setSearchTerm(sku)} />
      )}

      {/* TAB 3: Alistamiento Cuarto Frío */}
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

      {/* TAB 4: Despiece & Comandas */}
      {viewMode === 'despiece' && (
        <ProductionForm
          products={products as any}
          bodegas={bodegas as any}
          onProductionComplete={() => {
            loadStock();
            loadInventory();
          }}
          activeProducts={activeProducts}
          prodMateriaPrima={prodMateriaPrima}
          setProdMateriaPrima={setProdMateriaPrima}
          prodMateriaCant={prodMateriaCant}
          setProdMateriaCant={setProdMateriaCant}
          prodTerminado={prodTerminado}
          setProdTerminado={setProdTerminado}
          prodTerminadoCant={prodTerminadoCant}
          setProdTerminadoCant={setProdTerminadoCant}
          mermaPct={mermaPct}
          handleProcesarProduccion={handleProcesarProduccion}
        />
      )}

      {/* TAB 5: Traslados Multibodega */}
      {viewMode === 'traslados' && (
        <WarehouseTransferPanel
          bodegas={bodegas as any}
          products={products as any}
          onTransferComplete={() => {
            loadStock();
            loadInventory();
          }}
        />
      )}

      {/* TAB 6: Análisis Pareto ABC */}
      {viewMode === 'analisis_abc' && <AnalisisAbcWidget />}

      {/* TAB 7: Compras & Reportes */}
      {viewMode === 'reportes_compra' && (
        <PurchasesReport
          ordenesCompra={ordenesCompra}
          proveedores={proveedores}
          productsCatalog={products}
          categorias={categorias}
          userRole={userRole}
          onOpenNuevaCompra={() => setViewMode('registrar_compra')}
        />
      )}

      {viewMode === 'registrar_compra' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/80 backdrop-blur-xl border border-white/10 text-white p-5 rounded-2xl shadow-xl flex-wrap gap-3">
            <div>
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest block">
                Módulo WMS & Recepción de Mercancía
              </span>
              <h2 className="text-xl font-black text-white m-0 flex items-center gap-2 mt-0.5">
                <Truck className="w-5 h-5 text-emerald-400" />
                Entrada de Mercadería y Registro de Compras
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('reportes_compra')}
                className="px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                📊 Ver Historial / Reportes
              </button>
              <button
                onClick={() => setViewMode('operaciones')}
                className="px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                📦 Ver Stock Físico
              </button>
            </div>
          </div>

          <PurchaseOrderForm
            compra={compra}
            setCompra={setCompra}
            proveedores={proveedores}
            activeProducts={activeProducts}
            handleProcesarCompra={(e: any) => {
              handleProcesarCompra(e);
              setViewMode('reportes_compra');
            }}
            bodegas={bodegas}
            onProductCreated={(_newProd: any) => loadInventory()}
            onProductIvaUpdate={handleProductIvaUpdate}
          />
        </div>
      )}

      {/* Vistas Secundarias */}
      {viewMode === 'catalogo' && (
        <div>
          {editingProductId || isCreating ? (
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

      {viewMode === 'configuracion_bodegas' && (
        <WarehouseConfigManager
          bodegas={bodegas}
          setBodegas={useWarehouseStore.getState().setBodegas}
          stock={stock}
          products={products}
        />
      )}
    </div>
  );
}



