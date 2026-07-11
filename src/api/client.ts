import { env } from '../config/env';
import { useAuthStore } from '../store/authStore';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Extra headers merged over the defaults. */
  headers?: Record<string, string>;
  /** Skip the Authorization header (login, signup, public data). */
  anonymous?: boolean;
}

/**
 * Typed fetch wrapper used by every endpoint module. Handles:
 *  - base URL + JSON serialization
 *  - bearer-token injection from the auth store
 *  - request timeouts
 *  - uniform ApiError on non-2xx responses
 *
 * Point EXPO_PUBLIC_API_URL at the backend and endpoint modules that call
 * this will go live; while EXPO_PUBLIC_USE_MOCK_API is on they route to the
 * mock adapter instead (see src/api/mock/mockApi.ts).
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, anonymous = false } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.requestTimeoutMs);

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  };

  if (!anonymous) {
    const token = useAuthStore.getState().session?.accessToken;
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${env.apiUrl}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const message =
        (data && typeof data === 'object' && 'message' in data && String(data.message)) ||
        `Request failed with status ${res.status}`;
      if (res.status === 401 && !anonymous) {
        // Session is no longer valid — sign the user out so the app
        // returns to the login flow instead of failing silently.
        useAuthStore.getState().clearSession();
      }
      throw new ApiError(res.status, message, data);
    }

    return data as T;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(0, 'Request timed out. Check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
