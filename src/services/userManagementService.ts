import { load, save, type DbKey } from './localDb';
import { getSupabaseClient } from '../lib/supabase';
import {
  validarUserCreation,
  validarMandatoryPasswordChange,
  type UserCreationInput,
} from '../schemas/auth.schema';
import { CANONICAL_PERMISSIONS } from '../schemas/permissions.schema';

export interface UsuarioTenant {
  id: string;
  tenantId: string;
  nombre: string;
  identificacion: string;
  email: string;
  telefono: string;
  rol: 'ADMINISTRADOR' | 'VENDEDOR' | 'CAJERO' | 'BODEGUERO' | 'SUPERVISOR' | 'CONTADOR' | 'GERENTE';
  permisos: Record<string, boolean>;
  mustChangePassword: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResultadoCrearUsuario {
  ok: boolean;
  usuario?: UsuarioTenant;
  error?: string;
}

export interface ResultadoActualizarPassword {
  ok: boolean;
  usuario?: UsuarioTenant;
  error?: string;
}

export interface ResultadoActualizarPermisos {
  ok: boolean;
  usuario?: UsuarioTenant;
  error?: string;
}

// Almacén en memoria para tests y aislamiento SSR
let inMemoryUsuarios: UsuarioTenant[] = [];
let memoryInitialized = false;

const STORAGE_KEY: DbKey = 'usuariosTenants';

function getStore(): UsuarioTenant[] {
  try {
    const list = load<UsuarioTenant[]>(STORAGE_KEY, []);
    if (list && list.length > 0) {
      inMemoryUsuarios = list;
      memoryInitialized = true;
      return list;
    }
  } catch {
    // Si falla LocalDb, continuar en memoria
  }

  if (!memoryInitialized) {
    memoryInitialized = true;
  }
  return inMemoryUsuarios;
}

function persistStore(list: UsuarioTenant[]): void {
  inMemoryUsuarios = [...list];
  try {
    save(STORAGE_KEY, list);
  } catch {
    // Continuar en memoria si save falla
  }
}

/**
 * Resuelve los permisos predeterminados para un rol dado
 */
export function getDefaultPermissionsForRole(rol: string): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  CANONICAL_PERMISSIONS.forEach((item) => {
    map[item.key] = item.rolesDefault.includes(rol);
  });
  return map;
}

export class UserManagementService {
  private isTestMode: boolean;

  constructor(isTestMode = import.meta.env.MODE === 'test') {
    this.isTestMode = isTestMode;
  }

  /**
   * Resuelve los permisos predeterminados para un rol dado
   */
  public getDefaultPermissionsForRole(rol: string): Record<string, boolean> {
    return getDefaultPermissionsForRole(rol);
  }

  /**
   * Limpia el almacén en memoria para pruebas
   */
  public limpiarEnMemoria(): void {
    inMemoryUsuarios = [];
    persistStore([]);
  }

  /**
   * Registra un nuevo usuario en un tenant con password = número de identificación
   */
  public async crearUsuario(
    tenantId: string,
    input: UserCreationInput
  ): Promise<ResultadoCrearUsuario> {
    const validation = validarUserCreation(input);
    if (!validation.success || !validation.data) {
      return { ok: false, error: validation.error || 'Datos de usuario inválidos' };
    }

    const validData = validation.data;
    const list = getStore();

    // 1. Validar no duplicidad de Cédula dentro del mismo tenant
    const duplicadoCedula = list.find(
      (u) => u.tenantId === tenantId && u.identificacion === validData.identificacion && u.activo
    );
    if (duplicadoCedula) {
      return {
        ok: false,
        error: `Ya existe un usuario con la identificación / cédula ${validData.identificacion} en esta empresa.`,
      };
    }

    // 2. Validar no duplicidad de Correo dentro del mismo tenant
    const duplicadoEmail = list.find(
      (u) => u.tenantId === tenantId && u.email === validData.email && u.activo
    );
    if (duplicadoEmail) {
      return {
        ok: false,
        error: `Ya existe un usuario con el correo ${validData.email} en esta empresa.`,
      };
    }

    // 3. Fusionar permisos por defecto del rol con los checkboxes personalizados
    const defaultPerms = getDefaultPermissionsForRole(validData.rol);
    const permisosFinales: Record<string, boolean> = {
      ...defaultPerms,
      ...(validData.permisosPersonalizados || {}),
    };

    const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const nuevoUsuario: UsuarioTenant = {
      id: userId,
      tenantId,
      nombre: validData.nombre,
      identificacion: validData.identificacion,
      email: validData.email,
      telefono: validData.telefono,
      rol: validData.rol,
      permisos: permisosFinales,
      mustChangePassword: true,
      activo: true,
      createdAt: now,
      updatedAt: now,
    };

    // 4. Intentar aprovisionar en Supabase Auth si no estamos en test puro
    if (!this.isTestMode) {
      try {
        const supabase = getSupabaseClient();
        await supabase.auth.signUp({
          email: validData.email,
          password: validData.identificacion, // Cédula como contraseña inicial
          options: {
            data: {
              full_name: validData.nombre,
              identificacion: validData.identificacion,
              phone: validData.telefono,
              role: validData.rol,
              tenant_id: tenantId,
              must_change_password: true,
            },
          },
        });
      } catch (err: any) {
        console.warn('Advertencia: Supabase Auth signUp diferido:', err.message);
      }
    }

    const updatedList = [nuevoUsuario, ...list];
    persistStore(updatedList);

    return { ok: true, usuario: nuevoUsuario };
  }

  /**
   * Cambia la contraseña inicial obligatoria y desactiva mustChangePassword
   */
  public async actualizarPasswordInicial(
    userId: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ResultadoActualizarPassword> {
    const validation = validarMandatoryPasswordChange({ newPassword, confirmPassword });
    if (!validation.success || !validation.data) {
      return { ok: false, error: validation.error || 'Contraseña inválida' };
    }

    const list = getStore();
    const index = list.findIndex((u) => u.id === userId);
    if (index === -1) {
      return { ok: false, error: 'Usuario no encontrado' };
    }

    const usuario = list[index];

    // Actualizar en Supabase Auth si aplica
    if (!this.isTestMode) {
      try {
        const supabase = getSupabaseClient();
        await supabase.auth.updateUser({
          password: newPassword,
          data: { must_change_password: false },
        });
      } catch (err: any) {
        console.warn('Advertencia: Supabase updateUser diferido:', err.message);
      }
    }

    const usuarioActualizado: UsuarioTenant = {
      ...usuario,
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    };

    list[index] = usuarioActualizado;
    persistStore(list);

    return { ok: true, usuario: usuarioActualizado };
  }

  /**
   * Obtiene todos los usuarios activos de un tenant específico
   */
  public obtenerUsuariosPorTenant(tenantId: string): UsuarioTenant[] {
    const list = getStore();
    return list.filter((u) => u.tenantId === tenantId && u.activo);
  }

  /**
   * Obtiene un usuario por su ID único
   */
  public obtenerUsuarioPorId(userId: string): UsuarioTenant | null {
    const list = getStore();
    return list.find((u) => u.id === userId) || null;
  }

  /**
   * Obtiene un usuario por su correo electrónico
   */
  public obtenerUsuarioPorEmail(email: string): UsuarioTenant | null {
    const list = getStore();
    return list.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.activo) || null;
  }

  /**
   * Actualiza la matriz personalizada de permisos de un usuario
   */
  public actualizarPermisosUsuario(
    userId: string,
    permisos: Record<string, boolean>
  ): ResultadoActualizarPermisos {
    const list = getStore();
    const index = list.findIndex((u) => u.id === userId);
    if (index === -1) {
      return { ok: false, error: 'Usuario no encontrado' };
    }

    const usuario = list[index];
    const updatedPermisos = { ...usuario.permisos, ...permisos };

    const usuarioActualizado: UsuarioTenant = {
      ...usuario,
      permisos: updatedPermisos,
      updatedAt: new Date().toISOString(),
    };

    list[index] = usuarioActualizado;
    persistStore(list);

    return { ok: true, usuario: usuarioActualizado };
  }
}

export const userManagementService = new UserManagementService();
