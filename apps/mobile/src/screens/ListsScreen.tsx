import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Field, ListTile, PlusGlyph } from '../components/ui';
import { OfflineBanner } from '../components/OfflineBanner';
import { isNetworkError } from '../api/client';
import { listsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useSocketEvent } from '../context/SocketContext';
import { createTempId, offlineDrafts, offlineQueue, offlineStorage } from '../offline';
import { colors, radius, shadow, spacing } from '../theme';
import type { ListDetail, ListSummary, ListType } from '../types';
import {
  getListCurrency,
  hasPositivePendingTotal,
  isAdvancedList,
  LIST_TYPE_ADVANCED,
  LIST_TYPE_NORMAL,
} from '../utils/aisles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ListsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { setOnline, refreshPendingCount } = useOffline();
  // Margen de la barra del sistema de Android (de borde a borde)
  const insets = useSafeAreaInsets();
  const [lists, setLists] = useState<ListSummary[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [listType, setListType] = useState<ListType>(LIST_TYPE_NORMAL);
  const [budget, setBudget] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    const cached = await offlineStorage.getLists(user.id);
    if (cached) {
      setLists(cached);
    }
    try {
      const fresh = await listsApi.all();
      setLists(fresh);
      await offlineStorage.saveLists(user.id, fresh);
      setOnline(true);
    } catch (err) {
      if (isNetworkError(err)) {
        setOnline(false);
        if (!cached) setLists([]);
      } else {
        if (!cached) setLists([]);
      }
    }
  }, [user?.id, setOnline]);

  useEffect(() => {
    void load();
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [load, navigation]);

  // Restaurar borrador de creación si existe
  useEffect(() => {
    if (!user?.id) return;
    void offlineDrafts
      .getDraft<{ name: string; listType?: ListType; budget?: string }>(user.id, 'new_list')
      .then((draft) => {
        if (draft && draft.name) {
          setName(draft.name);
          if (draft.listType) setListType(draft.listType);
          if (draft.budget) setBudget(draft.budget);
          setShowForm(true);
        }
      });
  }, [user?.id]);

  const onDraftChange = (newName: string, newType: ListType, newBudget: string) => {
    if (!user?.id) return;
    if (newName.trim()) {
      void offlineDrafts.saveDraft(user.id, 'new_list', {
        name: newName,
        listType: newType,
        budget: newBudget,
      });
    } else {
      void offlineDrafts.clearDraft(user.id, 'new_list');
    }
  };

  useSocketEvent('item:created', load);
  useSocketEvent('item:purchased', load);
  useSocketEvent('item:removed', load);
  useSocketEvent('item:reactivated', load);
  useSocketEvent('list:updated', load);
  useSocketEvent('list:deleted', load);
  useSocketEvent('list:member-added', load);

  const confirmDeleteList = (list: ListSummary) => {
    Alert.alert(
      t('detail.deleteList'),
      `${t('detail.confirmDelete')}\n\n"${list.name}"`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('detail.delete'),
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            try {
              await listsApi.remove(list.id);
              await load();
            } catch (error) {
              if (isNetworkError(error)) {
                setOnline(false);
                await offlineQueue.enqueue(user.id, 'delete_list', { listId: list.id });
                const currentLists = (lists ?? []).filter((l) => l.id !== list.id);
                setLists(currentLists);
                await offlineStorage.saveLists(user.id, currentLists);
                await offlineStorage.removeListDetail(user.id, list.id);
                void refreshPendingCount();
              } else {
                Alert.alert(t('common.oops'), (error as Error).message || t('detail.failures.deleteList'));
              }
            }
          },
        },
      ],
    );
  };

  const create = async () => {
    if (!name.trim() || !user?.id) return;
    setCreating(true);
    const parsedBudget = budget.trim() ? Number(budget.replace(',', '.')) : null;
    const payload = {
      name: name.trim(),
      listType,
      ...(listType === LIST_TYPE_ADVANCED && parsedBudget !== null && Number.isFinite(parsedBudget)
        ? { budget: parsedBudget }
        : {}),
    };

    try {
      await listsApi.create(payload);
      await offlineDrafts.clearDraft(user.id, 'new_list');
      setName('');
      setBudget('');
      setListType(LIST_TYPE_NORMAL);
      setShowForm(false);
      await load();
    } catch (error) {
      if (isNetworkError(error)) {
        setOnline(false);
        const tempId = createTempId('list');
        const optimisticSummary: ListSummary = {
          id: tempId,
          name: payload.name,
          description: null,
          color: '#1d5b45',
          icon: 'list',
          ownerId: user.id,
          isArchived: false,
          isShared: false,
          myRole: 'owner',
          notifyOnChange: true,
          listType: payload.listType ?? LIST_TYPE_NORMAL,
          budget: (payload as any).budget ?? null,
          pendingCount: 0,
          purchasedCount: 0,
          recurringCount: 0,
          overdueCount: 0,
          memberCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const optimisticDetail: ListDetail = {
          ...optimisticSummary,
          pending: [],
          purchased: [],
          members: [],
        };
        await offlineQueue.enqueue(user.id, 'create_list', { tempId, ...payload });
        const updatedLists = [optimisticSummary, ...(lists ?? [])];
        setLists(updatedLists);
        await offlineStorage.saveLists(user.id, updatedLists);
        await offlineStorage.saveListDetail(user.id, tempId, optimisticDetail);
        await offlineDrafts.clearDraft(user.id, 'new_list');
        setName('');
        setBudget('');
        setListType(LIST_TYPE_NORMAL);
        setShowForm(false);
        void refreshPendingCount();
      } else {
        Alert.alert(t('common.oops'), (error as Error).message);
      }
    } finally {
      setCreating(false);
    }
  };

  if (lists === null) {
    return (
      <View style={styles.center} testID="lists-loading">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="lists-screen">
      <FlatList
        data={lists}
        keyExtractor={(list) => list.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        ListHeaderComponent={
          <>
            <OfflineBanner />
            {showForm ? (
              <View style={styles.form} testID="new-list-form">
                <Field
                  label={t('lists.listName')}
                  testID="new-list-name"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    onDraftChange(val, listType, budget);
                  }}
                  placeholder={t('lists.namePlaceholder')}
                  autoFocus
                />
                <Text style={styles.typeHeading}>{t('advancedList.typeLabel')}</Text>
                <View style={styles.typeRow}>
                  <Pressable
                    testID="list-type-normal"
                    onPress={() => {
                      setListType(LIST_TYPE_NORMAL);
                      onDraftChange(name, LIST_TYPE_NORMAL, budget);
                    }}
                    style={[styles.typeOption, listType === LIST_TYPE_NORMAL && styles.typeOptionActive]}
                  >
                    <Text style={styles.typeTitle}>{t('advancedList.typeNormal')}</Text>
                  </Pressable>
                  <Pressable
                    testID="list-type-advanced"
                    onPress={() => {
                      setListType(LIST_TYPE_ADVANCED);
                      onDraftChange(name, LIST_TYPE_ADVANCED, budget);
                    }}
                    style={[styles.typeOption, listType === LIST_TYPE_ADVANCED && styles.typeOptionActive]}
                  >
                    <Text style={styles.typeTitle}>{t('advancedList.typeAdvanced')}</Text>
                  </Pressable>
                </View>
                {listType === LIST_TYPE_ADVANCED && (
                  <Field
                    label={t('advancedList.budgetLabel')}
                    testID="new-list-budget"
                    value={budget}
                    onChangeText={(val) => {
                      setBudget(val);
                      onDraftChange(name, listType, val);
                    }}
                    placeholder={t('advancedList.budgetLabel')}
                    keyboardType="decimal-pad"
                  />
                )}
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    title={t('lists.create')}
                    onPress={create}
                    loading={creating}
                    testID="new-list-submit"
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={t('common.cancel')}
                    variant="ghost"
                    onPress={() => {
                      setShowForm(false);
                      if (user?.id) void offlineDrafts.clearDraft(user.id, 'new_list');
                      setName('');
                      setBudget('');
                      setListType(LIST_TYPE_NORMAL);
                    }}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty} testID="lists-empty">
            <View style={styles.emptyIcon}>
              <View style={styles.emptyCheck} />
            </View>
            <Text style={styles.emptyTitle}>{t('lists.emptyTitle')}</Text>
            <Text style={styles.emptyBody}>
              {t('lists.emptyText')}
            </Text>
          </View>
        }
        renderItem={({ item: list }) => (
          <Pressable
            testID="list-card"
            accessibilityLabel={list.name}
            onPress={() => navigation.navigate('ListDetail', { id: list.id, name: list.name })}
            onLongPress={() => confirmDeleteList(list)}
            style={({ pressed }) => [styles.card, pressed && { backgroundColor: '#f8faf7' }]}
          >
            <ListTile icon={list.icon} color={list.color} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name} testID="list-card-name" numberOfLines={1}>
                {list.name}
              </Text>
              <View style={styles.badges}>
                {isAdvancedList(list) && (
                  <Badge tone="info" text={t('advancedList.premiumBadge')} />
                )}
                <Badge tone="muted" text={t('lists.pending', { count: list.pendingCount })} />
                {list.recurringCount > 0 && <Badge tone="info" text={t('lists.recurring', { count: list.recurringCount })} />}
                {list.overdueCount > 0 && (
                  <Badge tone="danger" text={t('lists.overdue', { count: list.overdueCount })} />
                )}
                {list.isShared && <Badge tone="success" text={t('lists.people', { count: list.memberCount })} />}
                {hasPositivePendingTotal(list) && (
                  <Badge
                    tone="muted"
                    text={t('advancedList.pendingTotal', {
                      amount: (list.estimatedPendingTotal ?? 0).toFixed(2),
                      currency: getListCurrency(list),
                    })}
                  />
                )}
              </View>
            </View>
            {list.ownerId === user?.id && (
              <Pressable
                testID="delete-list-button"
                accessibilityLabel={`${t('detail.deleteList')}: ${list.name}`}
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => confirmDeleteList(list)}
                style={({ pressed }) => [
                  styles.deleteListButton,
                  pressed && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.deleteListIcon} aria-hidden={true}>🗑️</Text>
              </Pressable>
            )}
          </Pressable>
        )}
      />

      {!showForm && (
        <Pressable style={[styles.fab, { bottom: spacing.xl + insets.bottom }]} onPress={() => setShowForm(true)} testID="new-list-button">
          <PlusGlyph size={22} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  deleteListButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  deleteListIcon: {
    fontSize: 18,
  },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink, letterSpacing: -0.25 },
  badges: { flexDirection: 'row', gap: spacing.xs, marginTop: 6, flexWrap: 'wrap' },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  typeHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
  },
  typeOptionActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  typeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  typeSub: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.sm },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyCheck: {
    width: 14,
    height: 26,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: colors.brand,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }, { translateY: -3 }],
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, letterSpacing: -0.25 },
  emptyBody: { fontSize: 14, color: colors.inkSoft, textAlign: 'center', paddingHorizontal: spacing.xl },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.pop,
  },
});
