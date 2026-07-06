import { create } from 'zustand';
import { getSupabaseClient } from '../lib/supabase';
import type { LedgerEntry, Account } from '../types/accounting';

interface AccountSummary {
  account: Account;
  totalDebit: number;
  totalCredit: number;
  balance: number; // Para Activos/Gastos: débito - crédito. Para Pasivos/Patrimonio/Ingresos: crédito - débito.
}

interface AccountingState {
  accounts: Account[];
  entries: LedgerEntry[];
  summary: AccountSummary[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  fetchEntriesByDateRange: (branchId: string, startDate: string, endDate: string) => Promise<void>;
  generateSummary: () => void;
}

export const useAccountingStore = create<AccountingState>((set, get) => ({
  accounts: [],
  entries: [],
  summary: [],
  loading: false,
  error: null,

  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;
      set({ accounts: data as Account[] });
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchEntriesByDateRange: async (branchId: string, startDate: string, endDate: string) => {
    set({ loading: true, error: null });
    try {
      const supabase = getSupabaseClient();
      // Usamos gte y lte para el rango de fechas
      const { data, error } = await supabase
        .from('ledger_entries')
        .select('*, accounts(*)')
        .eq('branch_id', branchId)
        .gte('created_at', `${startDate}T00:00:00.000Z`)
        .lte('created_at', `${endDate}T23:59:59.999Z`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ entries: data as LedgerEntry[] });
      get().generateSummary();
    } catch (err: any) {
      console.error('Error fetching ledger entries:', err);
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  generateSummary: () => {
    const { entries, accounts } = get();
    const summaryMap = new Map<string, AccountSummary>();

    // Inicializar mapa con todas las cuentas
    accounts.forEach(acc => {
      summaryMap.set(acc.id, {
        account: acc,
        totalDebit: 0,
        totalCredit: 0,
        balance: 0
      });
    });

    // Sumar débitos y créditos
    entries.forEach(entry => {
      const accSummary = summaryMap.get(entry.account_id);
      if (accSummary) {
        accSummary.totalDebit += Number(entry.debit) || 0;
        accSummary.totalCredit += Number(entry.credit) || 0;
      }
    });

    // Calcular balance real según tipo de cuenta
    const summaryArray = Array.from(summaryMap.values()).map(s => {
      const type = s.account.type;
      if (type === 'ASSET' || type === 'EXPENSE') {
        s.balance = s.totalDebit - s.totalCredit;
      } else {
        // LIABILITY, EQUITY, REVENUE
        s.balance = s.totalCredit - s.totalDebit;
      }
      return s;
    });

    // Filtrar solo cuentas con movimiento o balance
    const activeSummary = summaryArray.filter(s => s.totalDebit > 0 || s.totalCredit > 0 || s.balance !== 0);

    set({ summary: activeSummary });
  }
}));
