import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, AlertTriangle, X } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase';
import type { ConsentRecordLocal } from '../../types/legal.types';

export const ConsentGateModal: React.FC = () => {
  const [hasConsented, setHasConsented] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const checkConsent = async () => {
      const stored = localStorage.getItem('erp_habeas_data_consent');
      if (stored) {
        try {
          const parsed: ConsentRecordLocal = JSON.parse(stored);
          if (parsed.status === 'ACEPTADO' && parsed.version === '1.0.0-enterprise') {
            setHasConsented(true);
            return;
          }
        } catch {
          // JSON malformado, continuar a comprobación en base de datos
        }
      }

      // Si no está en caché local, verificar si el usuario autenticado ya aceptó en la base de datos
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data, error } = await supabase
            .from('legal_consents_audit')
            .select('id, version_politica, status')
            .eq('user_id', session.user.id)
            .eq('version_politica', '1.0.0-enterprise')
            .eq('status', 'ACEPTADO')
            .limit(1);

          if (!error && data && data.length > 0) {
            const consentRecord: ConsentRecordLocal = {
              timestamp: new Date().toISOString(),
              regulation: 'Ley 1581 de 2012 (Colombia) / RGPD',
              version: '1.0.0-enterprise',
              status: 'ACEPTADO',
              persistedInDb: true,
            };
            localStorage.setItem('erp_habeas_data_consent', JSON.stringify(consentRecord));
            setHasConsented(true);
            return;
          }
        }
      } catch {
        // En caso de entorno local sin Supabase configurado o modo offline
      }

      setHasConsented(false);
    };

    checkConsent();
  }, []);

  const handleAccept = async () => {
    setIsProcessing(true);
    let persistedInDb = false;

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const empresaId =
          session.user.user_metadata?.empresa_id ||
          localStorage.getItem('erp_empresa_id') ||
          '00000000-0000-0000-0000-000000000001';

        const { error } = await supabase.from('legal_consents_audit').insert({
          empresa_id: empresaId,
          user_id: session.user.id,
          regulation: 'Ley 1581 de 2012 (Colombia) / RGPD',
          version_politica: '1.0.0-enterprise',
          status: 'ACEPTADO',
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser',
          metadata: {
            accepted_at: new Date().toISOString(),
            platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
            screen_resolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
            compliance_officer: 'Oficial de Protección de Datos La Pezcadería SAS',
          },
        });

        if (!error) {
          persistedInDb = true;
        }
      }
    } catch {
      // Fallback resiliente offline / modo local
      persistedInDb = false;
    }

    const consentRecord: ConsentRecordLocal = {
      timestamp: new Date().toISOString(),
      regulation: 'Ley 1581 de 2012 (Colombia) / RGPD',
      version: '1.0.0-enterprise',
      status: 'ACEPTADO',
      persistedInDb,
    };

    localStorage.setItem('erp_habeas_data_consent', JSON.stringify(consentRecord));
    setTimeout(() => {
      setHasConsented(true);
      setIsProcessing(false);
    }, 200);
  };

  if (hasConsented) return null;

  return (
    <div className="fixed inset-0 isolate z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 min-h-dvh">
      <div className="max-w-lg w-full bg-zinc-950 border border-zinc-800 rounded-md p-6 shadow-2xl space-y-4 text-zinc-200 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/60 border border-emerald-800/40 rounded-sm text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-zinc-100 uppercase text-balance">
                Aviso de Habeas Data & Confidencialidad
              </h2>
              <p className="text-[11px] text-zinc-400 font-mono text-pretty">
                Marco Legal: Ley 1581 de 2012 & Estándares RGPD
              </p>
            </div>
          </div>
          <button
            onClick={() => setHasConsented(true)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
            title="Cerrar aviso temporalmente"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 text-xs leading-relaxed text-zinc-300">
          <p>
            Usted está accediendo a un entorno corporativo confidencial de{' '}
            <strong className="text-zinc-100">La Pezcadería ERP</strong>. La captura, almacenamiento
            y tratamiento de hojas de vida, historiales salariales de empleados, identidades de clientes y transacciones financieras están estrictamente regulados por la{' '}
            <strong className="text-zinc-100">Ley Estatutaria 1581 de 2012 de Colombia</strong>.
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-400">
            <li>
              <strong>Aislamiento Criptográfico:</strong> La información está segmentada por empresa (Tenant) con políticas RLS de base de datos.
            </li>
            <li>
              <strong>Trazabilidad y Auditoría:</strong> Cada consulta, modificación o descarga de documentos queda registrada en bitácoras inmutables.
            </li>
            <li>
              <strong>Custodia de Datos:</strong> Se prohíbe la extracción no autorizada o copia de información personal sensible fuera de los cuartos de datos autorizados.
            </li>
          </ul>
        </div>

        {/* Security badge */}
        <div className="flex items-start gap-2.5 p-3 rounded-sm bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-zinc-300">Bloqueo de Seguridad Activo:</span>{' '}
            No podrá realizar operaciones operativas, ingresar a cuartos fríos o crear pedidos hasta confirmar la aceptación de este acuerdo.
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAccept}
          disabled={isProcessing}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs rounded-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isProcessing ? (
            <span>Registrando consentimiento...</span>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Acepto Términos, Políticas de Tratamiento y Continuar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
