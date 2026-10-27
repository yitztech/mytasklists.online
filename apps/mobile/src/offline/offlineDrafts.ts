import { getStorageDriver, offlineStorage } from './offlineStorage';

export function getItemDraftKey(listId: string): string {
  return `item_${listId}`;
}

export const offlineDrafts = {
  async saveDraft<T>(userId: string, formKey: string, draft: T): Promise<void> {
    try {
      const driver = getStorageDriver();
      const key = offlineStorage.keys.draft(userId, formKey);
      await driver.setItem(key, JSON.stringify(draft));
    } catch {
      // Safe ignore
    }
  },

  async getDraft<T>(userId: string, formKey: string): Promise<T | null> {
    try {
      const driver = getStorageDriver();
      const key = offlineStorage.keys.draft(userId, formKey);
      const raw = await driver.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async clearDraft(userId: string, formKey: string): Promise<void> {
    try {
      const driver = getStorageDriver();
      const key = offlineStorage.keys.draft(userId, formKey);
      await driver.removeItem(key);
    } catch {
      // Safe ignore
    }
  },
};
