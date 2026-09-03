import React, { useState } from 'react';
import { UploadCloud, X, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react';
import { BulkUploadService } from '../services/bulkUploadService';
import { useClientStore } from '../store/useClientStore';
import { useInventoryStore } from '../store/useInventoryStore';
import Swal from 'sweetalert2';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'clientes' | 'productos';
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, type }) => {
  const [csvData, setCsvData] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const { addCliente } = useClientStore();
  // Assume useInventoryStore has a method to add products or we update productsCatalog
  const { productsCatalog, setProductsCatalog } = useInventoryStore();

  if (!isOpen) return null;

  const handleUpload = () => {
    setErrors([]);
    if (!csvData.trim()) {
      Swal.fire({ title: 'Error', text: 'El CSV está vacío.', icon: 'error', background: '#1e293b', color: '#fff' });
      return;
    }

    if (type === 'clientes') {
      const result = BulkUploadService.parseClientesCSV(csvData);
      if (result.errors.length > 0) {
        setErrors(result.errors);
      }
      if (result.success) {
        // En una app real, usaríamos setClientes o insertaríamos por lotes
        result.imported.forEach(c => addCliente(c));
        Swal.fire({ title: 'Éxito', text: `Se importaron ${result.imported.length} clientes correctamente.`, icon: 'success', background: '#1e293b', color: '#fff' });
        onClose();
      }
    } else {
      const result = BulkUploadService.parseProductsCSV(csvData);
      if (result.errors.length > 0) {
        setErrors(result.errors);
      }
      if (result.success) {
        setProductsCatalog([...productsCatalog, ...result.imported]);
        Swal.fire({ title: 'Éxito', text: `Se importaron ${result.imported.length} productos correctamente.`, icon: 'success', background: '#1e293b', color: '#fff' });
        onClose();
      }
    }
  };

  const placeholderText = type === 'clientes' 
    ? "nombre,identificacion,tipoIdentificacion,tipoPersona,direccion,telefono,email,ciudad,tipoPrecio,cupoCredito\nJuan Perez,123456789,CC,NATURAL,Calle 1,555-0000,juan@test.com,Bogota,POS,0"
    : "sku,nombre,categoria,unidad,precio_compra,precio_venta_pos\nSKU-001,Pescado Fresco,PESCADOS,kg,15000,22000";

  const handleDownloadTemplate = () => {
    const blob = new Blob([placeholderText], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `plantilla_${type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="text-cyan-400" />
            Carga Masiva de {type === 'clientes' ? 'Clientes' : 'Productos'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-4">
            <p className="text-slate-300 text-sm max-w-md leading-relaxed">
              <strong>Paso 1:</strong> Descarga la plantilla y llénala en Excel.<br />
              <strong>Paso 2:</strong> Copia todo el texto de Excel y pégalo en este cuadro negro de abajo.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-400 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Download size={16} />
              Descargar Plantilla
            </button>
          </div>
          
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 mb-4">
            <p className="text-xs text-slate-400 font-mono flex items-start gap-2 whitespace-pre-wrap">
              <FileText size={16} className="text-slate-500 flex-shrink-0 mt-0.5" />
              {placeholderText}
            </p>
          </div>

          <textarea
            className="w-full h-64 bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none"
            placeholder="Pega el CSV aquí..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
          ></textarea>

          {errors.length > 0 && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h4 className="text-red-400 text-sm font-semibold flex items-center gap-2 mb-2">
                <AlertCircle size={16} /> Errores encontrados
              </h4>
              <ul className="text-xs text-red-300/80 space-y-1 list-disc list-inside">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700/50 bg-slate-800/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleUpload}
            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-cyan-900/20 transition-all"
          >
            <CheckCircle size={18} />
            Importar Datos
          </button>
        </div>

      </div>
    </div>
  );
};
