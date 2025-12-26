const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('API_URL:', API_URL);

interface FetchOptions extends RequestInit {
  body?: any;
}

export async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const response = await fetch(url, config);
  
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error('No autorizado');
  }
  
  return response;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

export async function uploadFile(endpoint: string, file: File, additionalData?: Record<string, any>) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  console.log('uploadFile - Token:', token ? 'Present' : 'Not found');
  console.log('uploadFile - Endpoint:', endpoint);
  console.log('uploadFile - File:', file.name, file.size, file.type);

  if (!token) {
    console.error('uploadFile - No token found, redirecting to login');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('No autenticado');
  }

  const formData = new FormData();
  formData.append('archivo', file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
      console.log('uploadFile - Additional data:', key, value);
    });
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  console.log('uploadFile - Full URL:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    console.log('uploadFile - Response status:', response.status);

    if (response.status === 401) {
      console.log('uploadFile - 401 Unauthorized, removing token');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw new Error('No autorizado');
    }

    return response;
  } catch (error) {
    console.error('uploadFile - Fetch error:', error);
    throw error;
  }
}

export { API_URL };
