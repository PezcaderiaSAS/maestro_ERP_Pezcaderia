import { getSupabaseClient } from '../../lib/supabase';
import { AnalisisAbcItemDTO } from '../../types/inventarioAbc';

export interface IAnalisisAbcService {
  obtenerAnalisisPareto(diasHistorial?: number): Promise<readonly AnalisisAbcItemDTO[]>;
}

export class SpringAnalisisAbcService implements IAnalisisAbcService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_SPRING_BOOT_API_URL || 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async obtenerAnalisisPareto(diasHistorial: number = 30): Promise<readonly AnalisisAbcItemDTO[]> {
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      // Fallback para entornos de desarrollo / pruebas sin sesion activa
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      return this.ejecutarFetch(diasHistorial, headers);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };

    return this.ejecutarFetch(diasHistorial, headers);
  }

  private async ejecutarFetch(diasHistorial: number, headers: Record<string, string>): Promise<readonly AnalisisAbcItemDTO[]> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/inventario/abc/calcular?diasHistorial=${diasHistorial}`,
      {
        method: 'GET',
        headers
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al consultar servicio Spring Boot ABC (${response.status}): ${errorText}`);
    }

    const data: AnalisisAbcItemDTO[] = await response.json();
    return Object.freeze([...data]);
  }
}

export const springAnalisisAbcService = new SpringAnalisisAbcService();
