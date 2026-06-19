/**
 * Cliente de Integración API para Twenty CRM
 * URL Base predeterminada: http://localhost:3000 (Docker local)
 */

const TWENTY_API_URL = 'http://localhost:3000/rest/v1';

// API KEY configurada (Obtenida del panel de Twenty)
const FALLBACK_API_KEY = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjNjNTE2MTZkLTdjMTEtNGFhYi1iODI2LTViOWUyYTA3YWNkZSJ9.eyJzdWIiOiI1MmE5N2E4Zi02MDc1LTQ2Y2ItYWFiZS1iMDY2YTI5OTViOTkiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiNTJhOTdhOGYtNjA3NS00NmNiLWFhYmUtYjA2NmEyOTk1Yjk5IiwiaWF0IjoxNzgxNzE5MDExLCJleHAiOjQ5MzUzMTkwMTAsImp0aSI6ImM1ZGNkMDZhLTRmMjQtNDYwNS1hN2EyLTU1ZGZkMDZiMThiOSJ9.o8HOg9DeCzrOOYNXWZhIjznp51Zx8XtdzqO_w1uqMMr4XGYykPzeQM_uS4BKAtHg72hp-dzLNdtPl78Aw5qdOw';

let TWENTY_API_KEY = localStorage.getItem('twenty_api_key') || FALLBACK_API_KEY;

export const setTwentyApiKey = (key: string) => {
  TWENTY_API_KEY = key;
  localStorage.setItem('twenty_api_key', key);
};

export const hasTwentyApiKey = () => {
  return !!TWENTY_API_KEY;
};

/**
 * Función genérica de fetch para comunicarse con Twenty
 */
const fetchTwenty = async (endpoint: string, options: RequestInit = {}) => {
  if (!TWENTY_API_KEY) {
    console.warn('Advertencia: No hay API Key configurada para Twenty CRM. Usando fallback local si aplica.');
    throw new Error('API Key requerida');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TWENTY_API_KEY}`,
    ...options.headers,
  };

  const response = await fetch(`${TWENTY_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error HTTP: ${response.status}`);
  }

  return response.json();
};

/**
 * MÉTODOS DE CONTACTOS (Person)
 */
export const twentyContacts = {
  list: async () => {
    return fetchTwenty('/people');
  },
  create: async (data: any) => {
    return fetchTwenty('/people', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any) => {
    return fetchTwenty(`/people/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
};

/**
 * MÉTODOS DE EMPRESAS (Company)
 */
export const twentyCompanies = {
  list: async () => {
    return fetchTwenty('/companies');
  },
  create: async (data: any) => {
    return fetchTwenty('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any) => {
    return fetchTwenty(`/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
};

/**
 * MÉTODOS DE OPORTUNIDADES (Opportunities)
 */
export const twentyOpportunities = {
  list: async () => {
    return fetchTwenty('/opportunities');
  },
  create: async (data: any) => {
    return fetchTwenty('/opportunities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: any) => {
    return fetchTwenty(`/opportunities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
};
