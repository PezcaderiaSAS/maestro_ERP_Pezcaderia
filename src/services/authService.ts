import { getSupabaseClient } from '../lib/supabase';
import type { AuthUserProfile, RoleRbac } from '../types/auth.types';

export interface AuthServiceConfig {
  isMockMode?: boolean;
}

export interface LoginResult {
  ok: boolean;
  user?: AuthUserProfile;
  error?: string;
  redirectTo?: string;
}

export class AuthService {
  private isMockMode: boolean;
  private currentUser: AuthUserProfile | null = null;

  constructor(config?: AuthServiceConfig) {
    this.isMockMode = config?.isMockMode ?? (import.meta.env.MODE === 'test');
  }

  /**
   * Inicia sesión con proveedor OAuth 2.0 (Google o Azure AD)
   */
  public async loginWithProvider(
    provider: 'google' | 'azure',
    mockData?: { email: string; nombre: string; rol?: RoleRbac }
  ): Promise<LoginResult> {
    if (this.isMockMode && mockData) {
      const mockUser: AuthUserProfile = {
        id: `usr-mock-${mockData.email.replace(/[@.]/g, '-')}`,
        email: mockData.email,
        nombre: mockData.nombre,
        authProvider: 'mock',
        rol: mockData.rol,
      };
      this.currentUser = mockUser;
      return { ok: true, user: mockUser };
    }

    try {
      const supabase = getSupabaseClient();
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${redirectOrigin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      return { ok: true, redirectTo: data?.url };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Error al iniciar sesión con OAuth' };
    }
  }

  /**
   * Inicia sesión con correo y contraseña
   */
  public async loginWithEmail(email: string, password: string): Promise<LoginResult> {
    if (this.isMockMode) {
      const mockUser: AuthUserProfile = {
        id: `usr-mock-${email.replace(/[@.]/g, '-')}`,
        email,
        nombre: email.split('@')[0].toUpperCase(),
        authProvider: 'email',
      };
      this.currentUser = mockUser;
      return { ok: true, user: mockUser };
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { ok: false, error: error.message };
      }

      if (data.user) {
        const profile: AuthUserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          nombre: data.user.user_metadata?.full_name || email.split('@')[0],
          avatarUrl: data.user.user_metadata?.avatar_url,
          authProvider: 'email',
        };
        this.currentUser = profile;
        return { ok: true, user: profile };
      }

      return { ok: false, error: 'No se obtuvo información de usuario' };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Error al autenticar' };
    }
  }

  /**
   * Cierra la sesión activa
   */
  public async logout(): Promise<void> {
    this.currentUser = null;
    if (!this.isMockMode) {
      try {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
      } catch {
        // Ignorar errores al cerrar sesión
      }
    }
  }

  /**
   * Devuelve el usuario actualmente autenticado en memoria
   */
  public getUsuarioActivo(): AuthUserProfile | null {
    return this.currentUser;
  }

  /**
   * Asigna manualmente el usuario activo (útil para restores de sesión)
   */
  public setUsuarioActivo(user: AuthUserProfile | null): void {
    this.currentUser = user;
  }
}

export const authService = new AuthService();
