const TOKEN_KEY = 'cainta_mis_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let errMsg = `Request failed: ${response.status}`;
    if (contentType.includes('application/json')) {
      try {
        const errJson = await response.json();
        errMsg = errJson.error || errJson.message || errMsg;
      } catch {
        // fallback
      }
    } else {
      try {
        const text = await response.text();
        if (text && !text.startsWith('<')) errMsg = text;
      } catch {
        // fallback
      }
    }
    throw new Error(errMsg);
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const rawText = await response.text();
  try {
    return JSON.parse(rawText);
  } catch {
    console.warn(`[apiClient] Expected JSON from ${endpoint}, but received: ${rawText.slice(0, 80)}`);
    return [] as unknown as T;
  }
}
