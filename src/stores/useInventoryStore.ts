import { create } from 'zustand';
import { getSupabaseClient } from '../lib/supabase';
import { InventoryTransferInput, InventoryAdjustmentInput } from '../schemas/inventory.schema';

export type InventoryState = 'IDLE' | 'LOADING_STOCK' | 'TRANSFERRING' | 'ADJUSTING';

interface StockItem {
  id: string;
  sku: string;
  quantity: number;
  batch_id: string | null;
}

interface InventoryStore {
  state: InventoryState;
  currentWarehouseId: string | null;
  stock: StockItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchStockByWarehouse: (warehouseId: string) => Promise<void>;
  transferStock: (payload: InventoryTransferInput) => Promise<void>;
  adjustStock: (payload: InventoryAdjustmentInput) => Promise<void>;
  resetError: () => void;
}

// Valores de prueba para Tenant y Branch (idealmente vienen del contexto de Autenticación)
const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000000';
const MOCK_BRANCH_ID = '00000000-0000-0000-0000-000000000000';
const MOCK_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  state: 'IDLE',
  currentWarehouseId: null,
  stock: [],
  isLoading: false,
  error: null,

  resetError: () => set({ error: null }),

  fetchStockByWarehouse: async (warehouseId: string) => {
    set({ state: 'LOADING_STOCK', isLoading: true, error: null });
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('wms_stock')
        .select('id, sku, quantity, batch_id')
        .eq('warehouse_id', warehouseId);

      if (error) throw error;

      set({ 
        state: 'IDLE', 
        currentWarehouseId: warehouseId, 
        stock: data || [], 
        isLoading: false 
      });
    } catch (err: any) {
      set({ state: 'IDLE', error: err.message, isLoading: false });
    }
  },

  transferStock: async (payload: InventoryTransferInput) => {
    set({ state: 'TRANSFERRING', isLoading: true, error: null });
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('rpc_transfer_stock', {
        p_tenant_id: MOCK_TENANT_ID,
        p_branch_id: MOCK_BRANCH_ID,
        p_source_warehouse_id: payload.sourceWarehouseId,
        p_target_warehouse_id: payload.targetWarehouseId,
        p_batch_id: payload.batchId || null,
        p_sku: payload.sku,
        p_quantity: payload.quantity,
        p_actor_id: MOCK_ACTOR_ID,
        p_notes: payload.notes || 'Traslado de stock'
      });

      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error);

      // Recargar stock después del traslado
      const { currentWarehouseId } = get();
      if (currentWarehouseId) {
        await get().fetchStockByWarehouse(currentWarehouseId);
      } else {
        set({ state: 'IDLE', isLoading: false });
      }
    } catch (err: any) {
      set({ state: 'IDLE', error: err.message, isLoading: false });
    }
  },

  adjustStock: async (payload: InventoryAdjustmentInput) => {
    set({ state: 'ADJUSTING', isLoading: true, error: null });
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('rpc_adjust_stock', {
        p_tenant_id: MOCK_TENANT_ID,
        p_branch_id: MOCK_BRANCH_ID,
        p_warehouse_id: payload.warehouseId,
        p_batch_id: payload.batchId || null,
        p_sku: payload.sku,
        p_quantity: payload.quantity,
        p_movement_type: payload.movementType,
        p_actor_id: MOCK_ACTOR_ID,
        p_notes: payload.notes
      });

      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error);

      // Recargar stock después del ajuste
      const { currentWarehouseId } = get();
      if (currentWarehouseId === payload.warehouseId) {
        await get().fetchStockByWarehouse(currentWarehouseId);
      } else {
        set({ state: 'IDLE', isLoading: false });
      }
    } catch (err: any) {
      set({ state: 'IDLE', error: err.message, isLoading: false });
    }
  }
}));
