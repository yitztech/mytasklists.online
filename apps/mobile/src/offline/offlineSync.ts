import { ApiError, isNetworkError } from '../api/client';
import { itemsApi, listsApi } from '../api/endpoints';
import { offlineQueue, type PendingMutation } from './offlineQueue';
import { offlineStorage } from './offlineStorage';
import type { ListDetail } from '../types';

const isSyncingUser = new Map<string, boolean>();

export interface SyncResult {
  success: number;
  failed: number;
  remaining: number;
}

export interface SyncCallbacks {
  onListIdMapped?: (tempId: string, realId: string) => void;
  onItemIdMapped?: (tempId: string, realId: string) => void;
  onMutationDropped?: (mutation: PendingMutation, error: Error) => void;
}

export const offlineSync = {
  isSyncing(userId: string): boolean {
    return isSyncingUser.get(userId) ?? false;
  },

  async syncPending(userId: string, callbacks?: SyncCallbacks): Promise<SyncResult> {
    if (!userId) return { success: 0, failed: 0, remaining: 0 };
    if (isSyncingUser.get(userId)) {
      const currentQueue = await offlineQueue.getQueue(userId);
      return { success: 0, failed: 0, remaining: currentQueue.length };
    }

    isSyncingUser.set(userId, true);
    const idMap = new Map<string, string>();
    let success = 0;
    let failed = 0;

    try {
      // Restaurar mapeos persistidos de pasadas anteriores
      const persistedMappings = await offlineStorage.getAllIdMappings(userId);
      for (const [tempId, realId] of Object.entries(persistedMappings)) {
        idMap.set(tempId, realId);
      }

      const queue = await offlineQueue.getQueue(userId);
      if (queue.length === 0) {
        return { success: 0, failed: 0, remaining: 0 };
      }

      for (const mutation of queue) {
        try {
          const payload = { ...mutation.payload };

          // Remap IDs in payload if they reference a tempId that was previously mapped
          if (payload.listId && idMap.has(payload.listId)) {
            payload.listId = idMap.get(payload.listId)!;
          }
          if (payload.itemId && idMap.has(payload.itemId)) {
            payload.itemId = idMap.get(payload.itemId)!;
          }
          if (Array.isArray(payload.itemIds)) {
            payload.itemIds = payload.itemIds.map((id: string) => idMap.get(id) ?? id);
          }

          switch (mutation.type) {
            case 'create_list': {
              const { tempId, ...listPayload } = payload;
              const created = await listsApi.create(listPayload);
              if (tempId && created?.id) {
                idMap.set(tempId, created.id);
                await offlineStorage.saveIdMapping(userId, tempId, created.id);
                await offlineQueue.remapId(userId, tempId, created.id);
                callbacks?.onListIdMapped?.(tempId, created.id);

                // Update local storage detail cache key from tempId to created.id
                const cachedDetail = await offlineStorage.getListDetail(userId, tempId);
                if (cachedDetail) {
                  await offlineStorage.removeListDetail(userId, tempId);
                  const updatedDetail: ListDetail = { ...cachedDetail, id: created.id };
                  await offlineStorage.saveListDetail(userId, created.id, updatedDetail);
                }
              }
              break;
            }

            case 'update_list': {
              const { listId, ...updatePayload } = payload;
              await listsApi.update(listId, updatePayload);
              break;
            }

            case 'delete_list': {
              await listsApi.remove(payload.listId);
              break;
            }

            case 'create_item': {
              const { tempId, listId, ...itemPayload } = payload;
              const created = await itemsApi.create(listId, itemPayload);
              if (tempId && created?.id) {
                idMap.set(tempId, created.id);
                await offlineStorage.saveIdMapping(userId, tempId, created.id);
                await offlineQueue.remapId(userId, tempId, created.id);
                callbacks?.onItemIdMapped?.(tempId, created.id);
              }
              break;
            }

            case 'update_item': {
              const { itemId, payload: itemPayload } = payload;
              await itemsApi.update(itemId, itemPayload);
              break;
            }

            case 'purchase_item': {
              await itemsApi.purchase(payload.itemId);
              break;
            }

            case 'restore_item': {
              await itemsApi.restore(payload.itemId);
              break;
            }

            case 'close_item': {
              await itemsApi.close(payload.itemId);
              break;
            }

            case 'delete_item': {
              await itemsApi.remove(payload.itemId);
              break;
            }

            case 'reorder_items': {
              await itemsApi.reorder(payload.listId, payload.itemIds);
              break;
            }
          }

          // Mutation processed successfully
          await offlineQueue.dequeue(userId, mutation.id);
          success++;
        } catch (err) {
          if (isNetworkError(err)) {
            // Network connection dropped during sync: stop processing for now
            break;
          }

          const status = (err as ApiError)?.status;
          if (status === 404) {
            // Resource was deleted on server: discard mutation as obsolete
            await offlineQueue.dequeue(userId, mutation.id);
            success++;
          } else if (status === 409) {
            // Conflict (e.g. state already matched): treat as success and discard
            await offlineQueue.dequeue(userId, mutation.id);
            success++;
          } else if (status === 400 || status === 422) {
            // Validation error: drop invalid mutation so queue does not block permanently
            await offlineQueue.dequeue(userId, mutation.id);
            callbacks?.onMutationDropped?.(mutation, err as Error);
            failed++;
          } else {
            // Unexpected server error: retry count tracking
            mutation.retryCount = (mutation.retryCount ?? 0) + 1;
            if (mutation.retryCount >= 3) {
              await offlineQueue.dequeue(userId, mutation.id);
              callbacks?.onMutationDropped?.(mutation, err as Error);
              failed++;
            } else {
              const remainingQueue = await offlineQueue.getQueue(userId);
              const updated = remainingQueue.map((m) => (m.id === mutation.id ? mutation : m));
              await offlineQueue.saveQueue(userId, updated);
              break;
            }
          }
        }
      }

      // Reconcile list state with server
      if (success > 0) {
        try {
          const freshLists = await listsApi.all();
          await offlineStorage.saveLists(userId, freshLists);
        } catch {
          // ignore
        }
      }

      const remaining = (await offlineQueue.getQueue(userId)).length;
      return { success, failed, remaining };
    } finally {
      isSyncingUser.set(userId, false);
    }
  },
};
