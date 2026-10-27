import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../api/secureStorage';
import type { ListDetail, ListSummary, User } from '../types';

export interface StorageDriver {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys?: () => Promise<readonly string[]>;
  multiRemove?: (keys: readonly string[]) => Promise<void>;
}

let activeDriver: StorageDriver = AsyncStorage as unknown as StorageDriver;

export function setStorageDriver(driver: StorageDriver): void {
  activeDriver = driver;
}

export function getStorageDriver(): StorageDriver {
  return activeDriver;
}

export function createTempId(prefix: 'list' | 'item'): string {
  return `temp_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const offlineStorage = {
  keys: {
    lastActiveUser: 'offline:last_active_user_id',
    profile: (userId: string) => `offline:${userId}:profile`,
    lists: (userId: string) => `offline:${userId}:lists`,
    detail: (userId: string, listId: string) => `offline:${userId}:detail:${listId}`,
    queue: (userId: string) => `offline:${userId}:queue`,
    draft: (userId: string, formKey: string) => `offline:${userId}:drafts:${formKey}`,
    idMap: (userId: string) => `offline:${userId}:id_map`,
    userPrefix: (userId: string) => `offline:${userId}:`,
  },

  async getLastActiveUserId(): Promise<string | null> {
    try {
      return await activeDriver.getItem(this.keys.lastActiveUser);
    } catch {
      return null;
    }
  },

  async setLastActiveUserId(userId: string | null): Promise<void> {
    try {
      if (userId) {
        await activeDriver.setItem(this.keys.lastActiveUser, userId);
      } else {
        await activeDriver.removeItem(this.keys.lastActiveUser);
      }
    } catch {
      // Safe ignore
    }
  },

  async saveProfile(userId: string, profile: User): Promise<void> {
    const safeProfile: User = {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      locale: profile.locale,
      preferredLocale: profile.preferredLocale,
      provider: profile.provider,
      role: profile.role ?? 'user',
      avatarUrl: profile.avatarUrl ?? null,
      notificationsEnabled: profile.notificationsEnabled ?? true,
      emailVerified: profile.emailVerified ?? false,
      mfaEnabled: profile.mfaEnabled ?? false,
      isActive: profile.isActive ?? true,
      whatsapp: profile.whatsapp ?? null,
      createdAt: profile.createdAt ?? new Date().toISOString(),
      hasPassword: profile.hasPassword,
    };
    const json = JSON.stringify(safeProfile);
    try {
      await secureStorage.set(this.keys.profile(userId), json);
    } catch {
      // Ignorar si SecureStore no está disponible en el entorno
    }
    await activeDriver.setItem(this.keys.profile(userId), json);
  },

  async getProfile(userId: string): Promise<User | null> {
    try {
      const secureRaw = await secureStorage.get(this.keys.profile(userId));
      if (secureRaw) return JSON.parse(secureRaw) as User;
    } catch {
      // Fallback a driver activo
    }
    try {
      const raw = await activeDriver.getItem(this.keys.profile(userId));
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async saveLists(userId: string, lists: ListSummary[]): Promise<void> {
    await activeDriver.setItem(this.keys.lists(userId), JSON.stringify(lists));
  },

  async getLists(userId: string): Promise<ListSummary[] | null> {
    try {
      const raw = await activeDriver.getItem(this.keys.lists(userId));
      if (!raw) return null;
      return JSON.parse(raw) as ListSummary[];
    } catch {
      return null;
    }
  },

  async saveListDetail(userId: string, listId: string, detail: ListDetail): Promise<void> {
    await activeDriver.setItem(this.keys.detail(userId, listId), JSON.stringify(detail));
  },

  async getListDetail(userId: string, listId: string): Promise<ListDetail | null> {
    try {
      const raw = await activeDriver.getItem(this.keys.detail(userId, listId));
      if (!raw) return null;
      return JSON.parse(raw) as ListDetail;
    } catch {
      return null;
    }
  },

  async removeListDetail(userId: string, listId: string): Promise<void> {
    try {
      await activeDriver.removeItem(this.keys.detail(userId, listId));
    } catch {
      // Safe ignore
    }
  },

  async saveIdMapping(userId: string, tempId: string, realId: string): Promise<void> {
    try {
      const mappings = await this.getAllIdMappings(userId);
      mappings[tempId] = realId;
      await activeDriver.setItem(this.keys.idMap(userId), JSON.stringify(mappings));
    } catch {
      // Safe ignore
    }
  },

  async getAllIdMappings(userId: string): Promise<Record<string, string>> {
    try {
      const raw = await activeDriver.getItem(this.keys.idMap(userId));
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      return {};
    }
  },

  async clearUserData(userId: string): Promise<void> {
    try {
      await secureStorage.remove(this.keys.profile(userId));
    } catch {
      // Safe ignore
    }

    try {
      if (activeDriver.getAllKeys && activeDriver.multiRemove) {
        const allKeys = await activeDriver.getAllKeys();
        const prefix = this.keys.userPrefix(userId);
        const userKeys = allKeys.filter((k) => k.startsWith(prefix));
        if (userKeys.length > 0) {
          await activeDriver.multiRemove(userKeys);
          return;
        }
      }
    } catch {
      // Fallback
    }

    try {
      await Promise.all([
        activeDriver.removeItem(this.keys.profile(userId)),
        activeDriver.removeItem(this.keys.lists(userId)),
        activeDriver.removeItem(this.keys.queue(userId)),
        activeDriver.removeItem(this.keys.idMap(userId)),
      ]);
    } catch {
      // Safe ignore
    }
  },
};
