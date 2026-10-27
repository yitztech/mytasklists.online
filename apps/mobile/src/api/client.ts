import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { secureStorage } from './secureStorage';
import type { AppUpdateRequiredError } from '../types';
import i18n, { currentLanguage } from '../i18n';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string; socketUrl?: string };

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  extra.apiUrl ??
  'http://localhost:8084/api'
).replace(/\/$/, '');

export const SOCKET_URL = (
  process.env.EXPO_PUBLIC_SOCKET_URL ??
  extra.socketUrl ??
  API_URL.replace(/\/api$/, '')
).replace(/\/$/, '');

/**
 * Versión de la app (la `version` de app.json). Viaja en cada petición para que la
 * API corte a las que ya no son compatibles (docs/COMPATIBILIDAD.md).
 */
export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

const clientHeaders: Record<string, string> = {
  'X-App-Version': APP_VERSION,
  'X-App-Platform': Platform.OS,
};

const KEYS = { access: 'lc.mobile.access', refresh: 'lc.mobile.refresh' };

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokens = {
  get access() {
    return accessToken;
  },
  get refresh() {
    return refreshToken;
  },
  async load(): Promise<void> {
    [accessToken, refreshToken] = await Promise.all([
      secureStorage.get(KEYS.access),
      secureStorage.get(KEYS.refresh),
    ]);
  },
  async save(access: string, refresh: string): Promise<void> {
    accessToken = access;
    refreshToken = refresh;
    await Promise.all([secureStorage.set(KEYS.access, access), secureStorage.set(KEYS.refresh, refresh)]);
  },
  async clear(): Promise<void> {
    accessToken = null;
    refreshToken = null;
    await Promise.all([secureStorage.remove(KEYS.access), secureStorage.remove(KEYS.refresh)]);
  },
};

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof ApiError) return false;
  const msg = String((error as any)?.message ?? '').toLowerCase();
  const name = String((error as any)?.name ?? '');
  const code = String((error as any)?.code ?? '').toLowerCase();

  return (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('fetch failed') ||
    msg.includes('network error') ||
    msg.includes('the network connection was lost') ||
    msg.includes('the internet connection appears to be offline') ||
    msg.includes('connection refused') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('eai_again') ||
    msg.includes('etimedout') ||
    msg.includes('socket hang up') ||
    name === 'AbortError' ||
    code === 'econnrefused' ||
    code === 'enotfound' ||
    code === 'eai_again' ||
    code === 'etimedout'
  );
}

const listeners = new Set<() => void>();
export const onSessionExpired = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export interface UpdateRequired {
  downloadUrl?: string;
  webUrl?: string;
  message: string;
  minVersion: string;
  storeUrl: string | null;
}

const updateListeners = new Set<(info: UpdateRequired) => void>();
export const onUpdateRequired = (listener: (info: UpdateRequired) => void): (() => void) => {
  updateListeners.add(listener);
  return () => {
    updateListeners.delete(listener);
  };
};

let refreshing: Promise<boolean> | null = null;

export async function renewSession(): Promise<boolean> {
  if (refreshing) return refreshing;
  if (!refreshToken) return false;

  refreshing = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { ...clientHeaders, 'Accept-Language': currentLanguage(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      await tokens.save(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

interface Options {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
  headers?: Record<string, string>;
}

export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, auth = true, retry = true, headers: customHeaders } = options;

  const headers: Record<string, string> = {
    ...clientHeaders,
    ...(customHeaders ?? {}),
    // La API responde los errores en el idioma de la app
    'Accept-Language': currentLanguage(),
    Accept: 'application/json',
  };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body as FormData : JSON.stringify(body),
  });

  if (response.status === 401 && auth && retry) {
    if (await renewSession()) return request<T>(path, { ...options, retry: false });
    await tokens.clear();
    listeners.forEach((listener) => listener());
    throw new ApiError(i18n.t('common.sessionExpired'), 401);
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (response.status === 426) {
    const problem = payload as AppUpdateRequiredError | null;
    const info: UpdateRequired = {
      message: String(problem?.message ?? i18n.t('common.updateRequired')),
      minVersion: problem?.details?.minVersion ?? '',
      storeUrl: problem?.details?.storeUrl ?? null,
      downloadUrl: problem?.details?.downloadUrl,
      webUrl: problem?.details?.webUrl,
    };
    updateListeners.forEach((listener) => listener(info));
  }

  if (!response.ok) {
    const raw = payload?.message;
    throw new ApiError(
      Array.isArray(raw) ? raw.join('. ') : (raw ?? i18n.t('common.unexpectedError')),
      response.status,
    );
  }
  return payload as T;
}

type HttpHeaders = Record<string, string>;

export const api = {
  get<T>(path: string, headers?: HttpHeaders) {
    return request<T>(path, { headers });
  },
  post<T>(path: string, body?: unknown, auth = true, headers?: HttpHeaders) {
    return request<T>(path, { method: 'POST', body, auth, headers });
  },
  patch<T>(path: string, body?: unknown, headers?: HttpHeaders) {
    return request<T>(path, { method: 'PATCH', body, headers });
  },
  delete<T>(path: string, body?: unknown, headers?: HttpHeaders) {
    return request<T>(path, { method: 'DELETE', body, headers });
  },
};
