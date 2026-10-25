import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  Save,
  RotateCcw,
  AlertTriangle,
  Lock,
  Percent,
  Fish,
  CheckCircle2,
} from 'lucide-react';
import Swal from 'sweetalert2';
import type {
  PricingGlobalConfig,
  CategoryWasteConfig,
} from '../../../types/pricingEngine.types';
import { DEFAULT_CATEGORY_WASTE_CONFIGS } from '../../../services/pricing/pricingConfigService';

interface PricingConfigManagerProps {
  userRole?: string;
  globalConfig: PricingGlobalConfig;
  onSaveConfig: (config: PricingGlobalConfig) => { success: boolean; error?: string };
}

export const PricingConfigManager: React.FC<PricingConfigManagerProps> = ({
  userRole = 'vendedor',
  globalConfig,
  onSaveConfig,
}) => {
  const esAdmin =
    userRole.toLowerCase() === 'admin' ||
    userRole.toLowerCase() === 'administrador';

  // Estado local para edición
  const [formData, setFormData] = useState<PricingGlobalConfig>(() =>
    JSON.parse(JSON.stringify(globalConfig))
  );

  // 1. Verificación de Seguridad y RBAC
  if (!esAdmin) {
    return (
      <div
        data-testid="pricing-config-access-denied"
        className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center max-w-xl mx-auto my-12 shadow-sm"
      >
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-xs">
          <Lock className="w-8 h-8 stroke-[1.75]" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Acceso Restringido</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          La parametrización de buffers de merma biológica y márgenes comerciales
          maestros está reservada exclusivamente para usuarios con rol <strong>ADMINISTRADOR</strong>.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-500 font-medium shadow-2xs">
          <span>Tu rol actual:</span>
          <span className="uppercase font-bold text-slate-800">{userRole}</span>
        </div>
      </div>
    );
  }

  // Handlers para márgenes de canales
  const handleMarginChange = (
    field: keyof typeof formData.canales,
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      canales: {
        ...prev.canales,
        [field]: value,
      },
    }));
  };

  // Handlers para buffers por categoría
  const handleCategoryBufferChange = (
    catId: string,
    field: keyof CategoryWasteConfig,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      categoriasWaste: prev.categoriasWaste.map((cat) => {
        if (cat.categoriaId === catId) {
          return { ...cat, [field]: value };
        }
        return cat;
      }),
    }));
  };

  // Restaurar valores recomendados
  const handleRestoreDefaults = () => {
    Swal.fire({
      title: '¿Restaurar valores de fábrica?',
      text: 'Se restablecerán los buffers biológicos (Salmón 10%, Blanco 8%, Mariscos 12%) y los márgenes por canal por defecto.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
    }).then((res) => {
      if (res.isConfirmed) {
        setFormData((prev) => ({
          ...prev,
          canales: {
            margenPosPct: 40,
            margenRestaurantePct: 30,
            margenMayoristaPct: 15,
            margenMinimoSeguridadPct: 10,
          },
          categoriasWaste: JSON.parse(JSON.stringify(DEFAULT_CATEGORY_WASTE_CONFIGS)),
        }));
        Swal.fire({
          title: 'Valores restablecidos',
          text: 'Recuerda guardar los cambios para aplicarlos en producción.',
          icon: 'info',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    });
  };

  // Guardar configuración completa
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const res = onSaveConfig(formData);
    if (res.success) {
      Swal.fire({
        title: '¡Configuración Guardada!',
        text: 'Los nuevos márgenes y buffers de merma han sido actualizados y están activos en todo el ERP.',
        icon: 'success',
        confirmButtonColor: '#16a34a',
      });
    } else {
      Swal.fire({
        title: 'Error de Validación',
        text: res.error || 'No se pudo guardar la configuración.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  return (
    <form
      data-testid="pricing-config-manager"
      onSubmit={handleSubmit}
      className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm"
    >
      {/* Header del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
            <Sliders className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Configuración Maestra de Mermas y Márgenes
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Panel Administrativo de Control Financiero y Rendimiento Biológico
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="h-12 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-2 transition-colors active:scale-[0.99]"
            title="Restaurar parámetros sugeridos"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Restaurar Fábrica</span>
          </button>

          <button
            type="submit"
            data-testid="btn-save-pricing-config"
            className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md transition-all active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>

      {/* Sección 1: Márgenes Comerciales por Canal */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Márgenes Comerciales Objetivos por Canal de Venta
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Margen POS */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Canal POS / Mostrador</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-extrabold bg-blue-100 text-blue-800">
                +{formData.canales.margenPosPct}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Venta directa al detal en punto de venta.</p>
            <input
              type="number"
              min={1}
              max={200}
              data-testid="input-margen-pos"
              value={formData.canales.margenPosPct}
              onChange={(e) => handleMarginChange('margenPosPct', Number(e.target.value))}
              className="w-full h-12 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Margen HORECA */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Restaurante / HORECA</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-extrabold bg-indigo-100 text-indigo-800">
                +{formData.canales.margenRestaurantePct}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Tarifa corporativa para hoteles y chefs.</p>
            <input
              type="number"
              min={1}
              max={200}
              data-testid="input-margen-restaurante"
              value={formData.canales.margenRestaurantePct}
              onChange={(e) => handleMarginChange('margenRestaurantePct', Number(e.target.value))}
              className="w-full h-12 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Margen Mayorista */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Mayorista / Granel</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-extrabold bg-slate-200 text-slate-800">
                +{formData.canales.margenMayoristaPct}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Volúmenes altos de canastilla completa.</p>
            <input
              type="number"
              min={1}
              max={200}
              data-testid="input-margen-mayorista"
              value={formData.canales.margenMayoristaPct}
              onChange={(e) => handleMarginChange('margenMayoristaPct', Number(e.target.value))}
              className="w-full h-12 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Margen Mínimo de Seguridad */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">Umbral Mínimo Seguro</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-extrabold bg-amber-200 text-amber-900">
                {formData.canales.margenMinimoSeguridadPct}%
              </span>
            </div>
            <p className="text-[11px] text-amber-700">Márgenes inferiores disparan alerta y bloqueo.</p>
            <input
              type="number"
              min={0}
              max={50}
              data-testid="input-margen-seguridad"
              value={formData.canales.margenMinimoSeguridadPct}
              onChange={(e) => handleMarginChange('margenMinimoSeguridadPct', Number(e.target.value))}
              className="w-full h-12 px-3 bg-white border border-amber-300 rounded-lg text-amber-900 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sección 2: Tabla de Buffers de Merma Biológica por Categoría */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Buffers de Merma Biológica por Categoría de Producto
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Fórmula: Costo Ajustado = Costo Compra × (1 + Buffer%)
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table
            data-testid="table-waste-configs"
            className="w-full text-left text-xs divide-y divide-slate-200"
          >
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Categoría / Especie</th>
                <th className="px-4 py-3.5 text-center">Buffer Total (%)</th>
                <th className="px-4 py-3.5 text-center">Despiece / Fileteo (%)</th>
                <th className="px-4 py-3.5 text-center">Descongelación / Glaseo (%)</th>
                <th className="px-4 py-3.5 text-center">Vísceras / Cocina (%)</th>
                <th className="px-4 py-3.5">Descripción de Merma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {formData.categoriasWaste.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900 text-sm">{cat.nombreCategoria}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{cat.categoriaId}</div>
                  </td>

                  {/* Buffer Total */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        data-testid={`input-buffer-${cat.categoriaId}`}
                        value={cat.bufferDefaultPct}
                        onChange={(e) =>
                          handleCategoryBufferChange(
                            cat.categoriaId,
                            'bufferDefaultPct',
                            Number(e.target.value)
                          )
                        }
                        className="w-16 h-10 text-center font-extrabold text-blue-700 bg-blue-50/60 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-600">%</span>
                    </div>
                  </td>

                  {/* Despiece */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={cat.mermaDespiecePct}
                        onChange={(e) =>
                          handleCategoryBufferChange(
                            cat.categoriaId,
                            'mermaDespiecePct',
                            Number(e.target.value)
                          )
                        }
                        className="w-14 h-9 text-center font-medium bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <span className="text-[11px] text-slate-400">%</span>
                    </div>
                  </td>

                  {/* Descongelación */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={cat.mermaDescongelacionGlaseoPct}
                        onChange={(e) =>
                          handleCategoryBufferChange(
                            cat.categoriaId,
                            'mermaDescongelacionGlaseoPct',
                            Number(e.target.value)
                          )
                        }
                        className="w-14 h-9 text-center font-medium bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <span className="text-[11px] text-slate-400">%</span>
                    </div>
                  </td>

                  {/* Vísceras */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={cat.mermaCocinaViscerasPct}
                        onChange={(e) =>
                          handleCategoryBufferChange(
                            cat.categoriaId,
                            'mermaCocinaViscerasPct',
                            Number(e.target.value)
                          )
                        }
                        className="w-14 h-9 text-center font-medium bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <span className="text-[11px] text-slate-400">%</span>
                    </div>
                  </td>

                  {/* Descripción */}
                  <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                    {cat.descripcion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección 3: Guardas de Integridad y Redondeo */}
      <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={formData.bloquearVentaBajoCosto}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  bloquearVentaBajoCosto: e.target.checked,
                }))
              }
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span>Bloquear Venta por Debajo de Costo Ajustado</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={formData.redondeoEnteroCop}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  redondeoEnteroCop: e.target.checked,
                }))
              }
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span>Redondeo Estricto al Peso Entero en COP (RN-06)</span>
          </label>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Versión de Configuración: {formData.version}
        </div>
      </div>
    </form>
  );
};
