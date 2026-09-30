export interface LegalConsentAudit {
  id?: string;
  empresa_id: string;
  user_id: string;
  regulation: string;
  version_politica: string;
  status: 'ACEPTADO' | 'REVOCADO';
  ip_address?: string;
  user_agent?: string;
  accepted_at?: string;
  metadata?: Record<string, unknown>;
}

export interface ConsentRecordLocal {
  timestamp: string;
  regulation: string;
  version: string;
  status: 'ACEPTADO' | 'REVOCADO';
  persistedInDb: boolean;
}
