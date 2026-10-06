import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInventoryStore } from '../stores/useInventoryStore';
import { supabase } from '../lib/supabase';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('useInventoryStore (WMS)', () => {
  beforeEach(() => {
    // Reset store state
    useInventoryStore.setState({
      state: 'IDLE',
      currentWarehouseId: null,
      stock: [],
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const state = useInventoryStore.getState();
    expect(state.state).toBe('IDLE');
    expect(state.stock).toEqual([]);
    expect(state.error).toBeNull();
  });

  it('should fetch stock successfully', async () => {
    const mockStock = [{ id: '1', sku: 'S1', quantity: 10, batch_id: null }];
    
    // Setup mock
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockStock, error: null }),
      }),
    });

    const store = useInventoryStore.getState();
    await store.fetchStockByWarehouse('w-123');

    const newState = useInventoryStore.getState();
    expect(newState.state).toBe('IDLE');
    expect(newState.stock).toEqual(mockStock);
    expect(newState.currentWarehouseId).toBe('w-123');
  });

  it('should handle transferStock successfully', async () => {
    // Mock rpc success
    (supabase.rpc as any).mockResolvedValue({ data: { success: true }, error: null });
    
    // We mock fetchStockByWarehouse so it doesn't fail when called after transfer
    const fetchSpy = vi.spyOn(useInventoryStore.getState(), 'fetchStockByWarehouse')
      .mockResolvedValue(undefined);

    useInventoryStore.setState({ currentWarehouseId: 'w-123' });

    await useInventoryStore.getState().transferStock({
      sourceWarehouseId: 'w-123',
      targetWarehouseId: 'w-456',
      sku: 'SKU1',
      quantity: 5,
    });

    const newState = useInventoryStore.getState();
    expect(supabase.rpc).toHaveBeenCalledWith('rpc_transfer_stock', expect.any(Object));
    expect(newState.error).toBeNull();
    
    fetchSpy.mockRestore();
  });

  it('should handle adjustStock error', async () => {
    // Mock rpc error
    (supabase.rpc as any).mockResolvedValue({ 
      data: null, 
      error: new Error('Insufficient stock') 
    });

    await useInventoryStore.getState().adjustStock({
      warehouseId: 'w-123',
      sku: 'SKU1',
      quantity: -100,
      movementType: 'SCRAP',
      notes: 'Testing scrap error',
    });

    const newState = useInventoryStore.getState();
    expect(newState.error).toBe('Insufficient stock');
    expect(newState.state).toBe('IDLE');
  });
});
