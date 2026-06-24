import { useState } from 'react';

export function useInventory(props: any) {
  const {
    products, setProducts, productsCatalog, setProductsCatalog,
    stock, setStock, movimientos, setMovimientos,
    proveedores, publishEvent, userRole, ordenesCompra,
    setOrdenesCompra, categorias, setCategorias,
    quotations, setQuotations, devoluciones, setDevoluciones
  } = props;

  const [activeBodega, setActiveBodega] = useState('Bodega Principal');
  const [historyTab, setHistoryTab] = useState<'movimientos' | 'compras'>('movimientos');
  const [viewMode, setViewMode] = useState<'operaciones' | 'catalogo' | 'categorias' | 'cuarto_frio' | 'recepcion_devoluciones' | 'reportes_compra'>('operaciones');

  // State de Catalogo de Productos
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [productForm, setProductForm] = useState({
    sku: '', nombre: '', categoria: '', unidadMedida: 'KG' as 'KG' | 'UNIDAD' | 'GRAMO', precio_compra: 0, buffer_seguridad: 5,
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

  // State de Entrada de Compra (Replenishment)
  const [compra, setCompra] = useState({
    proveedorId: '',
    sku: '',
    cantidad: 10,
    costoUnitario: 0,
    lote: '',
    bodega: 'Bodega Principal'
  });

  // State de Traslados
  const [traslado, setTraslado] = useState<{ origen: string; destino: string; sku: string; cantidad: number | string }>({
    origen: 'Bodega Principal',
    destino: 'Bodega Secundaria',
    sku: '',
    cantidad: 10
  });

  // State de Producción
  const [prodMateriaPrima, setProdMateriaPrima] = useState('');
  const [prodMateriaCant, setProdMateriaCant] = useState<number | string>(100);
  const [prodTerminado, setProdTerminado] = useState('');
  const [prodTerminadoCant, setProdTerminadoCant] = useState<number | string>(60);
  const [mermaPct, setMermaPct] = useState(0);

  return {
    // States
    activeBodega, setActiveBodega,
    historyTab, setHistoryTab,
    viewMode, setViewMode,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    editingProductId, setEditingProductId,
    isCreating, setIsCreating,
    productForm, setProductForm,
    customTipo, setCustomTipo,
    customLinea, setCustomLinea,
    customClase, setCustomClase,
    isGeneratingImage, setIsGeneratingImage,
    editingCategoryId, setEditingCategoryId,
    categoryForm, setCategoryForm,
    categorySearch, setCategorySearch,
    selectedQuoteId, setSelectedQuoteId,
    preparedWeights, setPreparedWeights,
    selectedDevId, setSelectedDevId,
    receivedDevItems, setReceivedDevItems,
    compra, setCompra,
    traslado, setTraslado,
    prodMateriaPrima, setProdMateriaPrima,
    prodMateriaCant, setProdMateriaCant,
    prodTerminado, setProdTerminado,
    prodTerminadoCant, setProdTerminadoCant,
    mermaPct, setMermaPct,
    
    // Props
    products, setProducts, productsCatalog, setProductsCatalog,
    stock, setStock, movimientos, setMovimientos,
    proveedores, publishEvent, userRole, ordenesCompra,
    setOrdenesCompra, categorias, setCategorias,
    quotations, setQuotations, devoluciones, setDevoluciones
  };
}
