import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError, onSessionExpired, tokens } from '../api/client';
import { authApi, usersApi } from '../api/endpoints';
import { currentLanguage, setLanguage, type Language } from '../i18n';
import { offlineStorage } from '../offline';
import type { AuthResponse, LoginResponse, User } from '../types';

/** Sesión iniciada o reto de 2FA pendiente */
export type LoginStep = { status: 'done' } | { status: 'mfa'; mfaToken: string };

interface Value {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginStep>;
  verifyMfa: (mfaToken: string, code: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<LoginStep>;
  loginWithApple: (identityToken: string, fullName?: string) => Promise<LoginStep>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  /** Olvida la sesión local sin llamar al backend (p. ej. tras borrar la cuenta) */
  forgetSession: () => Promise<void>;
}

const AuthContext = createContext<Value | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hydratedUserId = useRef<string | null>(null);

  const clear = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  useEffect(() => onSessionExpired(clear), [clear]);

  // La cuenta es la fuente inicial; los cambios posteriores se guardan para que
  // web, app móvil, correos y push permanezcan sincronizados.
  const { i18n } = useTranslation();
  useEffect(() => {
    const language = currentLanguage();
    if (!user) {
      hydratedUserId.current = null;
      return;
    }
    if (hydratedUserId.current !== user.id) {
      hydratedUserId.current = user.id;
      const accountLanguage = (user.preferredLocale ?? user.locale) as Language;
      if (accountLanguage !== language) {
        setLanguage(accountLanguage);
        return;
      }
    }
    if ((user.preferredLocale ?? user.locale) === language) return;
    usersApi
      .updateProfile({ locale: language })
      .then((updated) => setUser((current) => (current ? { ...current, ...updated } : current)))
      .catch(() => undefined);
  }, [user, i18n.language]);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      await tokens.load();
      const lastUserId = await offlineStorage.getLastActiveUserId();
      if (!tokens.access) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) {
          setUser(me);
          setAccessToken(tokens.access);
          if (me?.id) {
            await offlineStorage.setLastActiveUserId(me.id);
            await offlineStorage.saveProfile(me.id, me);
          }
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await tokens.clear();
          await offlineStorage.setLastActiveUserId(null);
          if (lastUserId) {
            await offlineStorage.clearUserData(lastUserId);
          }
        } else if (lastUserId) {
          // Sin conexión: cargar perfil seguro desde el almacenamiento local
          const cachedUser = await offlineStorage.getProfile(lastUserId);
          if (cachedUser && !cancelled) {
            setUser(cachedUser);
            setAccessToken(tokens.access);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = useCallback(async (result: AuthResponse) => {
    await tokens.save(result.accessToken, result.refreshToken);
    setAccessToken(result.accessToken);
    setUser(result.user);
    if (result.user?.id) {
      await offlineStorage.setLastActiveUserId(result.user.id);
      await offlineStorage.saveProfile(result.user.id, result.user);
    }
  }, []);

  const handle = useCallback(
    async (result: LoginResponse): Promise<LoginStep> => {
      if ('mfaRequired' in result) return { status: 'mfa', mfaToken: result.mfaToken };
      await adopt(result);
      return { status: 'done' };
    },
    [adopt],
  );

  const value = useMemo<Value>(
    () => ({
      user,
      accessToken,
      loading,
      login: async (email, password) => handle(await authApi.login(email, password)),
      verifyMfa: async (mfaToken, code) => adopt(await authApi.verifyMfa(mfaToken, code)),
      loginWithGoogle: async (idToken) => handle(await authApi.google(idToken)),
      loginWithApple: async (identityToken, fullName) =>
        handle(await authApi.apple(identityToken, fullName)),
      refreshUser: async () => setUser(await authApi.me()),
      logout: async () => {
        const currentUserId = user?.id || (await offlineStorage.getLastActiveUserId());
        try {
          await authApi.logout(tokens.refresh);
        } catch {
          /* la sesión local se limpia igualmente */
        }
        await tokens.clear();
        await offlineStorage.setLastActiveUserId(null);
        if (currentUserId) {
          await offlineStorage.clearUserData(currentUserId);
        }
        clear();
      },
      forgetSession: async () => {
        const currentUserId = user?.id || (await offlineStorage.getLastActiveUserId());
        await tokens.clear();
        await offlineStorage.setLastActiveUserId(null);
        if (currentUserId) {
          await offlineStorage.clearUserData(currentUserId);
        }
        clear();
      },
    }),
    [user, accessToken, loading, adopt, handle, clear],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Value {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
