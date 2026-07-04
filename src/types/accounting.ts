export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  is_active: boolean;
  created_at: string;
}

export type ReferenceType = 'CASH_SHIFT' | 'SALE' | 'PURCHASE' | 'MANUAL';

export interface LedgerEntry {
  id: string;
  account_id: string;
  reference_type: ReferenceType;
  reference_id: string;
  debit: number;
  credit: number;
  description: string | null;
  branch_id: string;
  created_at: string;
  created_by: string;
}

// Representa el payload de entrada para la función RPC
export interface LedgerTransactionPayload {
  account_id: string;
  reference_type: ReferenceType;
  reference_id: string;
  debit: number;
  credit: number;
  description?: string;
  branch_id: string;
  created_by: string;
}
