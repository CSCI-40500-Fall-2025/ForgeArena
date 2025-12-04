// API configuration
// In production (Heroku), use same domain. In development, use localhost:5000
const API_URL = process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL
  : (process.env.NODE_ENV === 'production' 
      ? ''  // Use same domain in production (Heroku serves both frontend and API)
      : 'http://localhost:5000');

/**
 * Get access token from localStorage
 */
function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

/**
 * Make an authenticated API request
 */
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  // If unauthorized, try to refresh token
  if (response.status === 401 || response.status === 403) {
    const refreshed = await refreshAccessToken();
    
    if (refreshed) {
      // Retry request with new token
      const newToken = getAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
        });
      }
    }
  }
  
  return response;
}

/**
 * Refresh access token
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear tokens on refresh failure
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return false;
  }
}

/**
 * Make a GET request with authentication
 */
export async function apiGet(endpoint: string): Promise<any> {
  const response = await authenticatedFetch(endpoint, {
    method: 'GET',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
}

/**
 * Make a POST request with authentication
 */
export async function apiPost(endpoint: string, data?: any): Promise<any> {
  const response = await authenticatedFetch(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
}

/**
 * Make a PUT request with authentication
 */
export async function apiPut(endpoint: string, data?: any): Promise<any> {
  const response = await authenticatedFetch(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
}

/**
 * Make a DELETE request with authentication
 */
export async function apiDelete(endpoint: string): Promise<any> {
  const response = await authenticatedFetch(endpoint, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
}

const api = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
};

export default api;

