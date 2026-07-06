import { getSupabaseClient } from '../lib/supabase';
import type { LedgerTransactionPayload, ReferenceType } from '../types/accounting';

export interface TransactionCategory {
  debitAccountCode: string;
  creditAccountCode: string;
}

// Mapa a prueba de tontos para categorías comunes
export const TRANSACTION_CATEGORIES: Record<string, TransactionCategory> = {
  'SALE_CASH': {
    debitAccountCode: '1105', // Caja
    creditAccountCode: '4135', // Ventas
  },
  'PURCHASE_CASH': {
    debitAccountCode: '1435', // Inventario
    creditAccountCode: '1105', // Caja
  },
  'EXPENSE_PAYROLL': {
    debitAccountCode: '5105', // Gastos de personal
    creditAccountCode: '1105', // Caja
  },
  'EXPENSE_GENERAL': {
    debitAccountCode: '5195', // Gastos diversos
    creditAccountCode: '1105', // Caja
  }
};

export const accountingService = {
  /**
   * Obtiene el ID de una cuenta basado en su código (ej. '1105')
   */
  async getAccountIdByCode(code: string): Promise<string> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('accounts')
      .select('id')
      .eq('code', code)
      .single();

    if (error || !data) {
      throw new Error(`Cuenta contable con código ${code} no encontrada.`);
    }

    return data.id;
  },

  /**
   * Registra una transacción usando una categoría predefinida garantizando la partida doble.
   */
  async recordCategorizedTransaction(params: {
    categoryKey: keyof typeof TRANSACTION_CATEGORIES;
    amount: number;
    referenceType: ReferenceType;
    referenceId: string;
    description: string;
    branchId: string;
    createdBy: string;
  }): Promise<void> {
    const category = TRANSACTION_CATEGORIES[params.categoryKey];
    if (!category) {
      throw new Error(`Categoría de transacción '${params.categoryKey}' no existe.`);
    }

    const debitAccountId = await this.getAccountIdByCode(category.debitAccountCode);
    const creditAccountId = await this.getAccountIdByCode(category.creditAccountCode);

    const payload: LedgerTransactionPayload[] = [
      {
        account_id: debitAccountId,
        reference_type: params.referenceType,
        reference_id: params.referenceId,
        debit: params.amount,
        credit: 0,
        description: params.description,
        branch_id: params.branchId,
        created_by: params.createdBy
      },
      {
        account_id: creditAccountId,
        reference_type: params.referenceType,
        reference_id: params.referenceId,
        debit: 0,
        credit: params.amount,
        description: params.description,
        branch_id: params.branchId,
        created_by: params.createdBy
      }
    ];

    const supabase = getSupabaseClient();
    
    const { error } = await supabase.rpc('record_ledger_transaction', {
      p_entries: payload
    });

    if (error) {
      console.error('Error registrando transacción contable:', error);
      throw error;
    }
  },

  /**
   * Registra un asiento contable personalizado (para casos más complejos).
   * Valida manualmente (aunque la BD también lo hará) que débitos = créditos antes de enviar.
   */
  async recordManualTransaction(entries: LedgerTransactionPayload[]): Promise<void> {
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    if (totalDebit !== totalCredit) {
      throw new Error('El asiento manual está desequilibrado. Total débito debe ser igual al total crédito.');
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('record_ledger_transaction', {
      p_entries: entries
    });

    if (error) {
      console.error('Error en asiento contable manual:', error);
      throw error;
    }
  }
};
