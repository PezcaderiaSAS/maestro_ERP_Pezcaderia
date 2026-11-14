import { useState, useMemo, useCallback } from 'react';
import type React from 'react';
import type { ProductFormData } from './pricing.types';

export interface UseCatalogManagementProps {
  products: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  setProductsCatalog: (updater: (prev: any[]) => any[]) => void;
}

export interface UseCatalogManagementReturn {
  editingProductId: string | null;
  setEditingProductId: React.Dispatch<React.SetStateAction<string | null>>;
  productForm: ProductFormData;
  setProductForm: React.Dispatch<React.SetStateAction<ProductFormData>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  categoryFilter: string;
  setCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
  categoriasUnicas: string[];
  filteredProducts: any[];
  handleSaveProduct: (
    e: React.FormEvent,
    callbacks: { onSuccess: (msg: string) => void; onWarn: (title: string, text: string) => void }
  ) => void;
  handleEditProduct: (prod: any) => void;
  handleToggleStatus: (id: string) => void;
}

const INITIAL_PRODUCT_FORM: ProductFormData = {
  sku: '',
  nombre: '',
  categoria: '',
  unidadMedida: 'kg',
  precio_compra: 0,
  buffer_seguridad: 5,
};

/**
 * Hook modular para la gestión del catálogo de productos, validación de SKU,
 * filtros por categoría y cálculo de precios de venta sugeridos basados en buffer.
 */
export function useCatalogManagement({
  products,
  setProducts,
  setProductsCatalog,
}: UseCatalogManagementProps): UseCatalogManagementReturn {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>(INITIAL_PRODUCT_FORM);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');

  // Categorías únicas detectadas dinámicamente
  const categoriasUnicas = useMemo(() => {
    return ['TODAS', ...Array.from(new Set(products.map((p) => p.categoria)))];
  }, [products]);

  // Manejador para crear o actualizar producto con recálculo de precios sugeridos
  const handleSaveProduct = useCallback(
    (
      e: React.FormEvent,
      callbacks: { onSuccess: (msg: string) => void; onWarn: (title: string, text: string) => void }
    ) => {
      e.preventDefault();
      if (!productForm.sku || !productForm.nombre || !productForm.categoria) {
        callbacks.onWarn('Campos incompletos', 'Por favor complete todos los campos obligatorios.');
        return;
      }

      if (editingProductId) {
        setProducts((prev: any[]) =>
          prev.map((p: any) => {
            if (p.id === editingProductId) {
              const compra = productForm.precio_compra;
              const buffer = productForm.buffer_seguridad;
              const sugPos = Math.round(compra * (1 + buffer / 100 + 0.4));
              const sugRest = Math.round(compra * (1 + buffer / 100 + 0.3));
              const sugMay = Math.round(compra * (1 + buffer / 100 + 0.15));

              return {
                ...p,
                sku: productForm.sku.toUpperCase(),
                nombre: productForm.nombre.toUpperCase(),
                categoria: productForm.categoria.toUpperCase(),
                precio_compra: compra,
                buffer_seguridad: buffer,
                precio_venta_pos:
                  p.precio_compra === compra && p.buffer_seguridad === buffer ? p.precio_venta_pos : sugPos,
                precio_venta_restaurante:
                  p.precio_compra === compra && p.buffer_seguridad === buffer
                    ? p.precio_venta_restaurante
                    : sugRest,
                precio_venta_mayorista:
                  p.precio_compra === compra && p.buffer_seguridad === buffer ? p.precio_venta_mayorista : sugMay,
              };
            }
            return p;
          })
        );
        setEditingProductId(null);
        callbacks.onSuccess('Producto actualizado exitosamente.');
      } else {
        const skuExists = products.some((p) => p.sku.toUpperCase() === productForm.sku.toUpperCase());
        if (skuExists) {
          callbacks.onWarn('SKU duplicado', 'Ya existe un producto con el SKU digitado.');
          return;
        }

        const compra = productForm.precio_compra;
        const buffer = productForm.buffer_seguridad;
        const sugPos = Math.round(compra * (1 + buffer / 100 + 0.4));
        const sugRest = Math.round(compra * (1 + buffer / 100 + 0.3));
        const sugMay = Math.round(compra * (1 + buffer / 100 + 0.15));

        const nuevoProd: any = {
          id: `p-${Date.now()}`,
          sku: productForm.sku.toUpperCase(),
          nombre: productForm.nombre.toUpperCase(),
          categoria: productForm.categoria.toUpperCase(),
          precio_compra: compra,
          buffer_seguridad: buffer,
          precio_venta_pos: sugPos,
          precio_venta_restaurante: sugRest,
          precio_venta_mayorista: sugMay,
          activo: true,
        };

        setProducts((prev: any[]) => [...prev, nuevoProd]);
        callbacks.onSuccess('Producto creado con éxito.');
      }

      setProductForm(INITIAL_PRODUCT_FORM);
    },
    [productForm, editingProductId, products, setProducts]
  );

  const handleEditProduct = useCallback((prod: any) => {
    setEditingProductId(prod.id);
    setProductForm({
      sku: prod.sku,
      nombre: prod.nombre,
      categoria: prod.categoria,
      unidadMedida: prod.unidadMedida || 'kg',
      precio_compra: prod.precio_compra,
      buffer_seguridad: prod.buffer_seguridad,
    });
  }, []);

  const handleToggleStatus = useCallback(
    (id: string) => {
      setProductsCatalog((prev: any[]) =>
        prev.map((p: any) => (p.id === id ? { ...p, activo: !p.activo } : p))
      );
    },
    [setProductsCatalog]
  );

  // Productos filtrados por búsqueda y categoría
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'TODAS' || p.categoria === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  return {
    editingProductId,
    setEditingProductId,
    productForm,
    setProductForm,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    categoriasUnicas,
    filteredProducts,
    handleSaveProduct,
    handleEditProduct,
    handleToggleStatus,
  };
}

