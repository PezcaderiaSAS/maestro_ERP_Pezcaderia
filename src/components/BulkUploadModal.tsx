import React, { useState } from 'react';
import { UploadCloud, X, CheckCircle, AlertCircle, FileSpreadsheet, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
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
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const { addCliente } = useClientStore();
  // Assume useInventoryStore has a method to add products or we update productsCatalog
  const { productsCatalog, setProductsCatalog } = useInventoryStore();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrors([]);
    }
  };

  const handleUpload = () => {
    setErrors([]);
    if (!file) {
      Swal.fire({ title: 'Error', text: 'Por favor selecciona un archivo Excel (.xlsx).', icon: 'error', background: '#1e293b', color: '#fff' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (type === 'clientes') {
          const result = BulkUploadService.parseClientesExcel(data);
          if (result.errors.length > 0) {
            setErrors(result.errors);
          }
          if (result.success) {
            result.imported.forEach(c => addCliente(c));
            Swal.fire({ title: 'Éxito', text: `Se importaron ${result.imported.length} clientes correctamente.`, icon: 'success', background: '#1e293b', color: '#fff' });
            onClose();
          }
        } else {
          const result = BulkUploadService.parseProductsExcel(data);
          if (result.errors.length > 0) {
            setErrors(result.errors);
          }
          if (result.success) {
            setProductsCatalog([...productsCatalog, ...result.imported]);
            Swal.fire({ title: 'Éxito', text: `Se importaron ${result.imported.length} productos correctamente.`, icon: 'success', background: '#1e293b', color: '#fff' });
            onClose();
          }
        }
      } catch (err) {
        setErrors(['Hubo un error al procesar el archivo. Asegúrate de que es un archivo Excel válido.']);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    let data = [];
    if (type === 'clientes') {
      data = [{ Nombre: 'Juan Perez', Identificacion: '123456789', TipoIdentificacion: 'CC', TipoPersona: 'NATURAL', Direccion: 'Calle 1', Telefono: '555-0000', Email: 'juan@test.com', Ciudad: 'Bogota', TipoPrecio: 'POS', CupoCredito: 0 }];
    } else {
      data = [{ SKU: 'SKU-001', Nombre: 'Pescado Fresco', Categoria: 'PESCADOS', Unidad: 'kg', PrecioCompra: 15000, PrecioVenta: 22000, BufferSeguridad: 5 }];
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, `plantilla_${type}.xlsx`);
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
          <div className="flex justify-between items-start mb-6">
            <p className="text-slate-300 text-sm max-w-md leading-relaxed">
              <strong>Paso 1:</strong> Descarga la plantilla y llénala en Excel.<br />
              <strong>Paso 2:</strong> Sube tu archivo `.xlsx` listo en la zona de abajo.
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <FileSpreadsheet size={16} />
              Descargar Plantilla Excel
            </button>
          </div>
          
          {/* File Upload Area */}
          <div className="relative border-2 border-dashed border-slate-600 hover:border-cyan-500 rounded-2xl p-10 text-center bg-slate-800/30 hover:bg-slate-800/60 transition-all group">
            <input 
              type="file" 
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-700 group-hover:bg-cyan-900/50 flex items-center justify-center transition-colors">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium text-lg">Arrastra tu archivo Excel aquí</p>
                <p className="text-slate-400 text-sm mt-1">O haz clic para buscarlo en tu computador (.xlsx)</p>
              </div>
              
              {file && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <FileSpreadsheet size={18} />
                  <span className="font-semibold">{file.name}</span>
                </div>
              )}
            </div>
          </div>

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
