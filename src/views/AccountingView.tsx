import React, { useEffect, useState } from 'react';
import { useAccountingStore } from '../store/useAccountingStore';
import { useWarehouseStore } from '../store/useWarehouseStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BookOpen, Search, RefreshCw, AlertCircle, DollarSign } from 'lucide-react';
export default function AccountingView() {
  const { summary, loading, error, fetchAccounts, fetchEntriesByDateRange } = useAccountingStore();
  const { bodegas } = useWarehouseStore();
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Primer día del mes actual
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [selectedBranch, setSelectedBranch] = useState<string>('');

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (bodegas.length > 0 && !selectedBranch) {
      setSelectedBranch(bodegas[0].id);
    }
  }, [bodegas, selectedBranch]);

  const handleSearch = () => {
    if (selectedBranch && startDate && endDate) {
      fetchEntriesByDateRange(selectedBranch, startDate, endDate);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  // Group summary by account type
  const groupedSummary = summary.reduce((acc, curr) => {
    const type = curr.account.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(curr);
    return acc;
  }, {} as Record<string, typeof summary>);

  const getTypeName = (type: string) => {
    const types: Record<string, string> = {
      ASSET: 'Activos',
      LIABILITY: 'Pasivos',
      EQUITY: 'Patrimonio',
      REVENUE: 'Ingresos',
      EXPENSE: 'Gastos'
    };
    return types[type] || type;
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" />
            Libro Mayor Simplificado
          </h1>
          <p className="text-slate-500 text-sm mt-1">Consulte los saldos de cuentas por periodo</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Bodega (Sucursal)</label>
          <select 
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {bodegas.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio</label>
          <Input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
          />
        </div>
        
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Fin</label>
          <Input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
          />
        </div>

        <div className="flex-none">
          <Button onClick={handleSearch} disabled={loading || !selectedBranch} icon={loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}>
            Consultar
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {summary.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
            <DollarSign className="w-12 h-12 mb-2 text-slate-300" />
            <p>No hay movimientos en el periodo seleccionado.</p>
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {Object.entries(groupedSummary).map(([type, accounts]) => (
              <div key={type} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
                  <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm">{getTypeName(type)}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">Código</th>
                        <th className="px-6 py-3">Nombre de Cuenta</th>
                        <th className="px-6 py-3 text-right">Débitos</th>
                        <th className="px-6 py-3 text-right">Créditos</th>
                        <th className="px-6 py-3 text-right font-bold">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accounts.map((s) => (
                        <tr key={s.account.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-medium text-slate-600">{s.account.code}</td>
                          <td className="px-6 py-3 text-slate-800">{s.account.name}</td>
                          <td className="px-6 py-3 text-right text-slate-600">{formatMoney(s.totalDebit)}</td>
                          <td className="px-6 py-3 text-right text-slate-600">{formatMoney(s.totalCredit)}</td>
                          <td className={`px-6 py-3 text-right font-bold ${s.balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                            {formatMoney(s.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
