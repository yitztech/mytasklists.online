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
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext';
import { offlineQueue, offlineSync, type SyncCallbacks } from '../offline';

interface OfflineContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  setOnline: (online: boolean) => void;
  syncNow: (callbacks?: SyncCallbacks) => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue>({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  setOnline: () => undefined,
  syncNow: async () => undefined,
  refreshPendingCount: async () => undefined,
});

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    if (!user?.id) {
      setPendingCount(0);
      return;
    }
    const count = await offlineQueue.count(user.id);
    setPendingCount(count);
  }, [user?.id]);

  useEffect(() => {
    void refreshPendingCount();
  }, [refreshPendingCount]);

  const syncNow = useCallback(
    async (callbacks?: SyncCallbacks) => {
      if (!user?.id || isSyncing) return;
      setIsSyncing(true);
      try {
        const result = await offlineSync.syncPending(user.id, callbacks);
        setPendingCount(result.remaining);
        if (result.success > 0 || result.remaining === 0) {
          setIsOnline(true);
        }
      } catch {
        // Safe ignore
      } finally {
        setIsSyncing(false);
      }
    },
    [user?.id, isSyncing],
  );

  // Intentar sincronizar cuando la app vuelve al primer plano
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user?.id) {
        void refreshPendingCount();
        void syncNow();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [user?.id, refreshPendingCount, syncNow]);

  const setOnline = useCallback(
    (online: boolean) => {
      setIsOnline((prev) => {
        if (!prev && online) {
          // Reconectado: disparar sincronización de operaciones pendientes
          void syncNow();
        }
        return online;
      });
    },
    [syncNow],
  );

  const value = useMemo<OfflineContextValue>(
    () => ({
      isOnline,
      isSyncing,
      pendingCount,
      setOnline,
      syncNow,
      refreshPendingCount,
    }),
    [isOnline, isSyncing, pendingCount, setOnline, syncNow, refreshPendingCount],
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export const useOffline = (): OfflineContextValue => useContext(OfflineContext);
