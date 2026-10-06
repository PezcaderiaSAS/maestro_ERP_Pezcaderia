import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePosStore } from '../stores/usePosStore';
import { supabase } from '../lib/supabase';

// Mock de Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  }
}));

describe('usePosStore Zustand Store', () => {
  beforeEach(() => {
    // Resetear el estado antes de cada prueba
    usePosStore.setState({
      state: 'CLOSED',
      sessionId: null,
      registerId: null,
      expectedCash: 0,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = usePosStore.getState();
      expect(state.state).toBe('CLOSED');
      expect(state.sessionId).toBeNull();
      expect(state.expectedCash).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('openSession', () => {
    it('should transition to ACTIVE when successful', async () => {
      // Mock de supabase.from().insert().select().single()
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'session-123' }, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as any).mockReturnValue({ insert: mockInsert });

      const promise = usePosStore.getState().openSession('reg-1', 100000);
      
      // Estado intermedio: OPENING
      expect(usePosStore.getState().state).toBe('OPENING');
      expect(usePosStore.getState().isLoading).toBe(true);

      await promise;

      // Estado final: ACTIVE
      const state = usePosStore.getState();
      expect(state.state).toBe('ACTIVE');
      expect(state.sessionId).toBe('session-123');
      expect(state.expectedCash).toBe(100000);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should stay CLOSED and set error if it fails', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as any).mockReturnValue({ insert: mockInsert });

      await usePosStore.getState().openSession('reg-1', 100000);

      const state = usePosStore.getState();
      expect(state.state).toBe('CLOSED');
      expect(state.sessionId).toBeNull();
      expect(state.error).toBe('DB Error');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('closeSession', () => {
    beforeEach(() => {
      usePosStore.setState({
        state: 'ACTIVE',
        sessionId: 'session-123',
        expectedCash: 150000,
      });
    });

    it('should transition to BLIND_COUNT and then CLOSED when successful', async () => {
      (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

      const promise = usePosStore.getState().closeSession(150000);

      // Estado intermedio
      expect(usePosStore.getState().state).toBe('BLIND_COUNT');
      expect(usePosStore.getState().isLoading).toBe(true);

      await promise;

      // Estado final
      const state = usePosStore.getState();
      expect(state.state).toBe('CLOSED');
      expect(state.sessionId).toBeNull();
      expect(state.expectedCash).toBe(0);
      expect(state.isLoading).toBe(false);
    });

    it('should return to ACTIVE and set error if RPC fails', async () => {
      (supabase.rpc as any).mockResolvedValue({ data: null, error: new Error('RPC Error') });

      await usePosStore.getState().closeSession(150000);

      const state = usePosStore.getState();
      expect(state.state).toBe('ACTIVE');
      expect(state.sessionId).toBe('session-123');
      expect(state.error).toBe('RPC Error');
    });
  });

  describe('transferCash', () => {
    beforeEach(() => {
      usePosStore.setState({
        state: 'ACTIVE',
        sessionId: 'session-123',
        expectedCash: 500000,
      });
    });

    it('should reduce expectedCash when successful', async () => {
      (supabase.rpc as any).mockResolvedValue({ data: true, error: null });

      await usePosStore.getState().transferCash(100000, 'RETIRO_PARCIAL');

      const state = usePosStore.getState();
      expect(state.expectedCash).toBe(400000);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set error and not reduce expectedCash when fails', async () => {
      (supabase.rpc as any).mockResolvedValue({ data: null, error: new Error('Transfer Error') });

      await usePosStore.getState().transferCash(100000, 'RETIRO_PARCIAL');

      const state = usePosStore.getState();
      expect(state.expectedCash).toBe(500000); // Intacto
      expect(state.error).toBe('Transfer Error');
    });
  });
});
