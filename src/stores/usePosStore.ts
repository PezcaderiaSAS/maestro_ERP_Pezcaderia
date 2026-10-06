import { create } from 'zustand';
import { supabase } from '../lib/supabase'; // Asume que existe un cliente supabase

export type PosState = 'CLOSED' | 'OPENING' | 'ACTIVE' | 'BLIND_COUNT' | 'CLOSING';

interface PosStore {
  state: PosState;
  sessionId: string | null;
  registerId: string | null;
  expectedCash: number;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  openSession: (registerId: string, openingAmount: number) => Promise<void>;
  closeSession: (declaredAmount: number) => Promise<void>;
  transferCash: (amount: number, reason: string) => Promise<void>;
  resetError: () => void;
}

export const usePosStore = create<PosStore>((set, get) => ({
  state: 'CLOSED',
  sessionId: null,
  registerId: null,
  expectedCash: 0,
  isLoading: false,
  error: null,

  resetError: () => set({ error: null }),

  openSession: async (registerId, openingAmount) => {
    set({ state: 'OPENING', isLoading: true, error: null });
    try {
      // Simulación o llamada real a supabase
      const { data, error } = await supabase
        .from('pos_sessions')
        .insert({ register_id: registerId, opening_amount: openingAmount, expected_cash: openingAmount })
        .select('id')
        .single();
        
      if (error) throw error;
      
      set({ 
        state: 'ACTIVE', 
        registerId, 
        sessionId: data.id, 
        expectedCash: openingAmount,
        isLoading: false
      });
    } catch (err: any) {
      set({ state: 'CLOSED', error: err.message, isLoading: false });
    }
  },

  closeSession: async (declaredAmount) => {
    const { sessionId } = get();
    if (!sessionId) return;
    
    set({ state: 'BLIND_COUNT', isLoading: true, error: null });
    try {
      // Llamada al RPC de Arqueo Ciego
      const { data, error } = await supabase.rpc('rpc_perform_blind_cash_count', {
        p_session_id: sessionId,
        p_declared_amount: declaredAmount
      });

      if (error) throw error;

      // Al cerrar exitosamente, volvemos a CLOSED
      set({ state: 'CLOSED', sessionId: null, expectedCash: 0, isLoading: false });
    } catch (err: any) {
      set({ state: 'ACTIVE', error: err.message, isLoading: false });
    }
  },

  transferCash: async (amount, reason) => {
    const { sessionId, expectedCash } = get();
    if (!sessionId) return;

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.rpc('rpc_transfer_cash', {
        p_session_id: sessionId,
        p_amount: amount,
        p_reason: reason
      });

      if (error) throw error;

      set({ expectedCash: expectedCash - amount, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  }
}));
