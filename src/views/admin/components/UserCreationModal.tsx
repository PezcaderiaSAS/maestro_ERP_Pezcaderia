// src/views/admin/components/UserCreationModal.tsx
// Modal de Creación de Usuarios con Matriz de Checkboxes Personalizada
// Sistema de Diseño Dark Glassmorphism V8 (#070A10) - La Pezcadería ERP

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  UserPlus,
  KeyRound,
  ShieldCheck,
  CheckSquare,
  Square,
  RotateCcw,
  AlertCircle,
  Building2,
  Lock,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  CANONICAL_PERMISSIONS,
  type CanonicalPermissionItem,
} from '../../../schemas/permissions.schema';
import {
  validarUserCreation,
  type UserCreationInput,
} from '../../../schemas/auth.schema';
import {
  userManagementService,
  getDefaultPermissionsForRole,
  type UsuarioTenant,
} from '../../../services/userManagementService';

export interface UserCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantNombre?: string;
  onUserCreated?: (usuario: UsuarioTenant) => void;
}

const ROLES_DISPONIBLES: Array<UserCreationInput['rol']> = [
  'VENDEDOR',
  'CAJERO',
  'BODEGUERO',
  'SUPERVISOR',
  'CONTADOR',
  'GERENTE',
  'ADMINISTRADOR',
];

export const UserCreationModal: React.FC<UserCreationModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  tenantNombre,
  onUserCreated,
}) => {
  const [nombre, setNombre] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState<UserCreationInput['rol']>('VENDEDOR');
  const [permisos, setPermisos] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar permisos por defecto según el rol seleccionado
  const resetPermisosPorRol = (rolSeleccionado: string) => {
    const defaults = getDefaultPermissionsForRole(rolSeleccionado);
    setPermisos(defaults);
  };

  useEffect(() => {
    if (isOpen) {
      setNombre('');
      setIdentificacion('');
      setEmail('');
      setTelefono('');
      setRol('VENDEDOR');
      resetPermisosPorRol('VENDEDOR');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleRolChange = (nuevoRol: UserCreationInput['rol']) => {
    setRol(nuevoRol);
    resetPermisosPorRol(nuevoRol);
  };

  const handleTogglePermission = (key: string) => {
    setPermisos((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleMarcarTodos = () => {
    const todos: Record<string, boolean> = {};
    CANONICAL_PERMISSIONS.forEach((p) => {
      todos[p.key] = true;
    });
    setPermisos(todos);
  };

  const handleDesmarcarTodos = () => {
    const ninguno: Record<string, boolean> = {};
    CANONICAL_PERMISSIONS.forEach((p) => {
      ninguno[p.key] = false;
    });
    setPermisos(ninguno);
  };

  // Agrupar permisos canónicos por módulo
  const permisosPorModulo = useMemo(() => {
    const map = new Map<string, CanonicalPermissionItem[]>();
    CANONICAL_PERMISSIONS.forEach((item) => {
      const list = map.get(item.modulo) || [];
      list.push(item);
      map.set(item.modulo, list);
    });
    return Array.from(map.entries());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const inputData: UserCreationInput = {
      nombre: nombre.trim(),
      identificacion: identificacion.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
      rol,
      permisosPersonalizados: permisos,
    };

    const validation = validarUserCreation(inputData);
    if (!validation.success || !validation.data) {
      await Swal.fire({
        icon: 'error',
        title: 'Formulario Incompleto o Datos Inválidos',
        text: validation.error || 'Por favor revise los campos requeridos.',
        background: '#070A10',
        color: '#ffffff',
        confirmButtonColor: '#06b6d4',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const resultado = await userManagementService.crearUsuario(tenantId, validation.data);

      if (!resultado.ok || !resultado.usuario) {
        await Swal.fire({
          icon: 'error',
          title: 'Error al Registrar Usuario',
          text: resultado.error || 'No se pudo crear el usuario.',
          background: '#070A10',
          color: '#ffffff',
          confirmButtonColor: '#06b6d4',
        });
        setIsSubmitting(false);
        return;
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Usuario Creado Exitosamente!',
        html: `
          <div style="text-align: left; font-size: 13px; line-height: 1.6;">
            <p><strong>Colaborador:</strong> ${resultado.usuario.nombre}</p>
            <p><strong>Identificación (Cédula):</strong> ${resultado.usuario.identificacion}</p>
            <p><strong>Rol Asignado:</strong> ${resultado.usuario.rol}</p>
            <p style="margin-top: 10px; padding: 8px; border-radius: 8px; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); color: #67e8f9;">
              🔑 <strong>Clave Provisional:</strong> Se ha asignado su número de cédula como contraseña temporal. En su primer login se le exigirá cambiarla.
            </p>
          </div>
        `,
        background: '#070A10',
        color: '#ffffff',
        confirmButtonColor: '#06b6d4',
      });

      if (onUserCreated) {
        onUserCreated(resultado.usuario);
      }
      onClose();
    } catch (err: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error Inesperado',
        text: err.message || 'Ocurrió un error al procesar la solicitud.',
        background: '#070A10',
        color: '#ffffff',
        confirmButtonColor: '#06b6d4',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl my-8 rounded-3xl bg-[#070A10]/95 border border-white/10 shadow-2xl backdrop-blur-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 bg-slate-900/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-24 bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <UserPlus size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Crear Nuevo Usuario
                </h2>
                {tenantNombre && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-300 border border-cyan-500/30">
                    <Building2 size={11} />
                    {tenantNombre}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Alta de nuevo colaborador y asignación de matriz granular de permisos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido Desplazable del Formulario */}
        <form noValidate onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Banner Informativo Cédula / Password Provisional */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200">
            <KeyRound size={20} className="shrink-0 text-cyan-400 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-cyan-100 font-bold block">
                Seguridad y Contraseña Provisional:
              </strong>
              <span>
                La cédula servirá como contraseña provisional. En su primer inicio de sesión, el sistema le exigirá definir una nueva contraseña segura para garantizar la confidencialidad.
              </span>
            </div>
          </div>

          {/* Bloque 1: Datos Personales del Colaborador */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={14} className="text-cyan-400" />
              <span>1. Credenciales y Datos Personales</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre Completo */}
              <div className="space-y-1.5">
                <label htmlFor="user-nombre" className="block text-xs font-semibold text-slate-300">
                  Nombre Completo <span className="text-rose-400">*</span>
                </label>
                <input
                  id="user-nombre"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Carlos Arturo Gómez"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>

              {/* Identificación / Cédula */}
              <div className="space-y-1.5">
                <label htmlFor="user-identificacion" className="block text-xs font-semibold text-slate-300">
                  Número de Identificación / Cédula <span className="text-rose-400">*</span>
                </label>
                <input
                  id="user-identificacion"
                  type="text"
                  required
                  value={identificacion}
                  onChange={(e) => setIdentificacion(e.target.value.replace(/\D/g, ''))}
                  placeholder="Solo dígitos (Ej. 1098765432)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm font-mono text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>

              {/* Correo Electrónico */}
              <div className="space-y-1.5">
                <label htmlFor="user-email" className="block text-xs font-semibold text-slate-300">
                  Correo Electrónico <span className="text-rose-400">*</span>
                </label>
                <input
                  id="user-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej. carlos@pezcaderia.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>

              {/* Teléfono / Celular */}
              <div className="space-y-1.5">
                <label htmlFor="user-telefono" className="block text-xs font-semibold text-slate-300">
                  Teléfono / Celular <span className="text-rose-400">*</span>
                </label>
                <input
                  id="user-telefono"
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 3123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white placeholder-slate-500 transition-all outline-none"
                />
              </div>

              {/* Rol en el Sistema */}
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="user-rol" className="block text-xs font-semibold text-slate-300">
                  Rol en el Sistema <span className="text-rose-400">*</span>
                </label>
                <select
                  id="user-rol"
                  value={rol}
                  onChange={(e) => handleRolChange(e.target.value as UserCreationInput['rol'])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm font-bold text-white transition-all outline-none cursor-pointer"
                >
                  {ROLES_DISPONIBLES.map((r) => (
                    <option key={r} value={r} className="bg-slate-900 text-white">
                      {r}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400">
                  Al cambiar el rol, se preseleccionan los permisos recomendados de forma automática.
                </span>
              </div>
            </div>
          </div>

          {/* Bloque 2: Matriz de Checkboxes de Permisos Granulares */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-teal-400" />
                  <span>2. Matriz de Permisos por Módulo</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Personalice de forma granular los accesos para este usuario.
                </p>
              </div>

              {/* Botones de acción rápida para la matriz */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarcarTodos}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] border border-white/5 transition-colors cursor-pointer"
                >
                  <CheckSquare size={13} />
                  <span>Marcar Todos</span>
                </button>
                <button
                  type="button"
                  onClick={handleDesmarcarTodos}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] border border-white/5 transition-colors cursor-pointer"
                >
                  <Square size={13} />
                  <span>Desmarcar Todos</span>
                </button>
                <button
                  type="button"
                  onClick={() => resetPermisosPorRol(rol)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-[11px] border border-cyan-500/20 transition-colors cursor-pointer"
                  title="Restablece la selección predeterminada del rol"
                >
                  <RotateCcw size={13} />
                  <span>Por Defecto</span>
                </button>
              </div>
            </div>

            {/* Renderizado de módulos y permisos */}
            <div className="space-y-4">
              {permisosPorModulo.map(([modulo, items]) => (
                <div
                  key={modulo}
                  className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-cyan-300 tracking-wide">
                      {modulo}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {items.filter((i) => permisos[i.key]).length}/{items.length} activos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {items.map((item) => {
                      const isChecked = !!permisos[item.key];
                      const isDefault = item.rolesDefault.includes(rol);

                      return (
                        <label
                          key={item.key}
                          htmlFor={`perm-${item.key}`}
                          className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-slate-800/80 border-cyan-500/40 shadow-sm shadow-cyan-500/5'
                              : 'bg-slate-900/20 border-white/5 hover:bg-slate-800/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            id={`perm-${item.key}`}
                            data-testid={`checkbox-perm-${item.key}`}
                            checked={isChecked}
                            onChange={() => handleTogglePermission(item.key)}
                            className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-white">
                                {item.label}
                              </span>
                              {isDefault && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                              {item.descripcion}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pie de Acciones del Formulario */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <UserPlus size={16} />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar y Crear Usuario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
