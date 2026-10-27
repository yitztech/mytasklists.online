import { getStorageDriver, offlineStorage } from './offlineStorage';

export type MutationType =
  | 'create_list'
  | 'update_list'
  | 'delete_list'
  | 'create_item'
  | 'update_item'
  | 'purchase_item'
  | 'restore_item'
  | 'close_item'
  | 'delete_item'
  | 'reorder_items';

export interface PendingMutation<T = any> {
  id: string; // clientMutationId idempotente
  type: MutationType;
  userId: string;
  payload: T;
  createdAt: string;
  retryCount: number;
}

export const offlineQueue = {
  async getQueue(userId: string): Promise<PendingMutation[]> {
    try {
      const driver = getStorageDriver();
      const raw = await driver.getItem(offlineStorage.keys.queue(userId));
      if (!raw) return [];
      return JSON.parse(raw) as PendingMutation[];
    } catch {
      return [];
    }
  },

  async saveQueue(userId: string, queue: PendingMutation[]): Promise<void> {
    try {
      const driver = getStorageDriver();
      await driver.setItem(offlineStorage.keys.queue(userId), JSON.stringify(queue));
    } catch {
      // Safe ignore
    }
  },

  async enqueue<T>(userId: string, type: MutationType, payload: T): Promise<PendingMutation<T>> {
    const queue = await this.getQueue(userId);
    const mutation: PendingMutation<T> = {
      id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      userId,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(mutation);
    await this.saveQueue(userId, queue);
    return mutation;
  },

  async dequeue(userId: string, mutationId: string): Promise<void> {
    const queue = await this.getQueue(userId);
    const filtered = queue.filter((m) => m.id !== mutationId);
    await this.saveQueue(userId, filtered);
  },

  async remapId(userId: string, tempId: string, realId: string): Promise<void> {
    const queue = await this.getQueue(userId);
    let changed = false;
    const updated = queue.map((mutation) => {
      const payload = { ...mutation.payload };
      let payloadChanged = false;

      if (payload.listId === tempId) {
        payload.listId = realId;
        payloadChanged = true;
      }
      if (payload.tempId === tempId) {
        payload.tempId = realId;
        payloadChanged = true;
      }
      if (payload.itemId === tempId) {
        payload.itemId = realId;
        payloadChanged = true;
      }
      if (Array.isArray(payload.itemIds)) {
        payload.itemIds = payload.itemIds.map((id: string) => {
          if (id === tempId) {
            payloadChanged = true;
            return realId;
          }
          return id;
        });
      }

      if (payloadChanged) {
        changed = true;
        return { ...mutation, payload };
      }
      return mutation;
    });

    if (changed) {
      await this.saveQueue(userId, updated);
    }
  },

  async count(userId: string): Promise<number> {
    const queue = await this.getQueue(userId);
    return queue.length;
  },

  async clearQueue(userId: string): Promise<void> {
    try {
      const driver = getStorageDriver();
      await driver.removeItem(offlineStorage.keys.queue(userId));
    } catch {
      // Safe ignore
    }
  },
};
