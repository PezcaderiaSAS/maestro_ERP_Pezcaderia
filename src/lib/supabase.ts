/// <reference types="vite/client" />

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error(
        'Supabase no configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env'
      );
    }
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
      db: { schema: 'public' },
    });
  }
  return client;
}

export function mapRole(role: string): string {
  const map: Record<string, string> = {
    admin: 'ADMIN',
    vendedor: 'VENDEDOR',
    bodega: 'BODEGUERO',
    administrativo: 'ADMIN',
    conductor: 'CONDUCTOR',
  };
  return map[role.trim().toLowerCase()] || 'VENDEDOR';
}

export function resetSupabaseClient(): void {
  client = null;
}
