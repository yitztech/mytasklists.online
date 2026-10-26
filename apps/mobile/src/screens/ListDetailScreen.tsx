import { useAuth } from '../context/AuthContext';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge, Button, SectionLabel } from '../components/ui';
import { ItemRow } from '../components/ItemRow';
import { PurchasedRow } from '../components/PurchasedRow';
import { ItemPhotoPicker } from '../components/ItemPhotoPicker';
import { SelectField } from '../components/SelectField';
import { EditItemModal } from '../components/EditItemModal';
import { itemsApi, listsApi, type PendingInvitation } from '../api/endpoints';
import { useSocket, useSocketEvent } from '../context/SocketContext';
import { colors, radius, shadow, spacing } from '../theme';
import type { Item, ListDetail } from '../types';
import {
  formatMoney,
  getListCurrency,
  getProjectedTotal,
  groupItemsByAisle,
  hasPositiveBudget,
  isAdvancedList,
  isOverBudget,
} from '../utils/aisles';
import { isPendingSection, SECTION_PENDING, SECTION_PURCHASED } from '../i18n/ui-helpers';
import { itemImageForm } from '../utils/item-image';
import { CUSTOM_UNIT, localizedUnits } from '../utils/units';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SHOW_DATES_KEY = 'lc.mobile.showItemDates';

const PRESETS = [3, 7, 14, 30];
const MENU_OFFSET = Platform.select({ android: 52, default: 44 });

export function ListDetailScreen({ route, navigation }: any) {
  const listId: string = route.params.id;
  const { socket } = useSocket();
  const { user } = useAuth();
  // Android dibuja de borde a borde: sin este margen, la barra del sistema tapa el último producto
  const insets = useSafeAreaInsets();
  const [pending, setPending] = useState<PendingInvitation[]>([]);
  const { t, i18n } = useTranslation();
  const [quantity,setQuantity]=useState('1');
  const [unit,setUnit]=useState('pza');
  const [customUnit,setCustomUnit]=useState('');

  const [list, setList] = useState<ListDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [name, setName] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [smartText, setSmartText] = useState('');
  const [receiptText, setReceiptText] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState(14);
  const [shareEmail, setShareEmail] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showDates, setShowDates] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [draggingItem, setDraggingItem] = useState<{ section: 'pending' | 'purchased'; id: string } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ section: 'pending' | 'purchased'; id: string } | null>(null);

  useLayoutEffect(() => {
    if (list?.ownerId === user?.id) {
      navigation.setOptions({
        headerRight: () => (
          <Pressable
            testID="list-menu-button"
            accessibilityLabel={t('detail.menu')}
            accessibilityRole="button"
            onPress={() => setMenuVisible(true)}
            hitSlop={12}
            style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
          >
            <Text style={styles.menuButtonText}>⋮</Text>
          </Pressable>
        ),
      });
    } else {
      navigation.setOptions({ headerRight: () => null });
    }
  }, [navigation, list?.ownerId, user?.id, t]);

  useEffect(() => {
    AsyncStorage.getItem(SHOW_DATES_KEY).then((value) => setShowDates(value === 'true')).catch(() => undefined);
  }, []);
  const toggleDates = (value: boolean) => {
    setShowDates(value);
    AsyncStorage.setItem(SHOW_DATES_KEY, String(value)).catch(() => undefined);
  };

  const load = useCallback(async () => {
    try {
      const detail = await listsApi.detail(listId);
      setList(detail);
      navigation.setOptions({ title: detail.name });
    } catch {
      Alert.alert(t('detail.loadFailed'));
    }
  }, [listId, navigation, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const connected = () => { void load(); };
    socket.on('connect', connected);
    socket.emit('list:join', { listId });
    return () => {
      socket.off('connect', connected);
      socket.emit('list:leave', { listId });
    };
  }, [socket, listId, load]);

  useEffect(() => {
    const timer = setInterval(() => { if (AppState.currentState === 'active') void load(); }, 240000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, [load]);
  useEffect(() => {
    if (!showShare || list?.ownerId !== user?.id) return;
    void listsApi.invitations(listId).then(setPending).catch(error => Alert.alert(t('common.oops'), error.message));
  }, [showShare, list, listId, user?.id, t]);

  const onEvent = useCallback(
    (payload: { listId?: string }) => {
      if (!payload?.listId || payload.listId === listId) void load();
    },
    [listId, load],
  );

  useSocketEvent('item:created', onEvent);
  useSocketEvent('item:updated', onEvent);
  useSocketEvent('item:purchased', onEvent);
  useSocketEvent('item:restored', onEvent);
  useSocketEvent('item:removed', onEvent);
  useSocketEvent('item:reactivated', onEvent);
  useSocketEvent('item:overdue', onEvent);
  useSocketEvent('list:updated', onEvent);
  useSocketEvent('list:deleted', (payload: { listId?: string }) => {
    if (payload?.listId === listId) {
      Alert.alert(t('detail.deletedTitle'), t('detail.deletedBody'));
      navigation.goBack();
    }
  });

  const deleteList = () => {
    Alert.alert(
      t('detail.deleteList'),
      `${t('detail.confirmDelete')}\n\n"${list?.name ?? ''}"`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('detail.delete'),
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await listsApi.remove(listId);
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('common.oops'), (error as Error).message || t('detail.failures.deleteList'));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const guard = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (error) {
      Alert.alert(t('common.oops'), (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const addItem = async () => {
    if (!name.trim() || busy) return;
    const amount=Number(quantity.replace(',','.'));const selected=unit===CUSTOM_UNIT?customUnit.trim():unit;
    if(!Number.isFinite(amount)||amount<0.01||amount>99999||Math.abs(Math.round(amount*100)-amount*100)>1e-7||!selected||selected.length>20){Alert.alert(t('common.oops'),t('detail.invalidQuantity'));return;}
    const parsedPrice = estimatedPrice.trim() ? Number(estimatedPrice.replace(',', '.')) : null;
    setBusy(true);
    try {const created=await itemsApi.create(listId,{name:name.trim(),quantity:amount,unit:selected,isRecurring,...(isRecurring?{recurrenceDays}:{}),...(parsedPrice!==null&&Number.isFinite(parsedPrice)&&parsedPrice>=0?{estimatedPrice:parsedPrice}:{})});const selectedPhoto=photo;setName('');setEstimatedPrice('');setQuantity('1');setUnit('pza');setCustomUnit('');setPhoto(null);if(selectedPhoto){try{await itemsApi.uploadImage(created.id,await itemImageForm(selectedPhoto));}catch{Alert.alert(t('detail.itemAdded'),t('detail.photoUploadFailed'));}}await load();}
    catch(e){Alert.alert(t('common.oops'),(e as Error).message);}finally{setBusy(false);}
  };

  const submitSmartEntry = async () => {
    if (!smartText.trim() || busy) return;
    await guard(async () => {
      const res = await itemsApi.smartEntry(listId, { text: smartText.trim(), createItems: true });
      setSmartText('');
      Alert.alert(t('advancedList.smartEntryTitle'), t('advancedList.smartEntryDone', { count: res.created.length }));
    });
  };

  const submitReceiptApply = async () => {
    if (!receiptText.trim() || busy) return;
    await guard(async () => {
      const res = await itemsApi.applyReceipt(listId, { receiptText: receiptText.trim() });
      setReceiptText('');
      Alert.alert(t('advancedList.receiptTitle'), t('advancedList.receiptDone', { count: res.purchasedCount }));
    });
  };

  const reorderSectionItems = useCallback(
    async (section: 'pending' | 'purchased', fromId: string, toId: string) => {
      if (!list || fromId === toId) return;
      const sourceItems = isPendingSection(section) ? list.pending : list.purchased;
      const fromIndex = sourceItems.findIndex((item) => item.id === fromId);
      const toIndex = sourceItems.findIndex((item) => item.id === toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

      const reordered = [...sourceItems];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      const nextIds = reordered.map((item) => item.id);

      setList((current) =>
        current
          ? {
              ...current,
              [section]: reordered.map((item, idx) => ({ ...item, sortOrder: idx })),
            }
          : current,
      );

      try {
        await itemsApi.reorder(listId, nextIds);
        await load();
      } catch (error) {
        Alert.alert(t('common.oops'), (error as Error).message);
        await load();
      }
    },
    [list, listId, load, t],
  );

  const moveSectionItemByStep = useCallback(
    (section: 'pending' | 'purchased', itemId: string, direction: -1 | 1) => {
      if (!list) return;
      const sourceItems = isPendingSection(section) ? list.pending : list.purchased;
      const index = sourceItems.findIndex((item) => item.id === itemId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= sourceItems.length) return;
      void reorderSectionItems(section, itemId, sourceItems[targetIndex].id);
    },
    [list, reorderSectionItems],
  );

  if (!list) {
    return (
      <View style={styles.center} testID="detail-loading">
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  const menuTop = insets.top + (MENU_OFFSET ?? 44);

  return (
    <>
      <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl * 2 + insets.bottom }}
      testID="list-detail-screen"
      keyboardShouldPersistTaps="handled"
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
    >
      {/* ── Alta de producto ─────────────────────────────────────────── */}
      <View style={styles.addCard} testID="add-item-form">
        <TextInput
          testID="item-name-input"
          maxLength={140}
          style={styles.addInput}
          placeholder={t('detail.addPlaceholder')}
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />

        <Text style={{color:colors.ink,marginTop:spacing.md}}>{t('detail.quantity')}</Text>
        <TextInput accessibilityLabel={t('detail.quantity')} style={styles.addInput} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" testID="item-quantity-input"/>
        <Text style={{color:colors.ink}}>{t('detail.unit')}</Text>
        <SelectField label={t('detail.unit')} value={unit} onChange={setUnit} testID="item-unit-input" options={[...localizedUnits(i18n.language), {label:t('detail.customUnit'),value:CUSTOM_UNIT}]}/>
        {unit===CUSTOM_UNIT && <TextInput accessibilityLabel={t('detail.unitName')} style={styles.addInput} value={customUnit} onChangeText={setCustomUnit} maxLength={20} placeholder={t('detail.unitName')} testID="item-custom-unit"/>}
        {isAdvancedList(list) && (
          <>
            <Text style={{color:colors.ink,marginTop:spacing.md}}>{t('advancedList.estimatedPriceLabel')}</Text>
            <TextInput
              accessibilityLabel={t('advancedList.estimatedPriceLabel')}
              style={styles.addInput}
              value={estimatedPrice}
              onChangeText={setEstimatedPrice}
              keyboardType="decimal-pad"
              placeholder={t('advancedList.estimatedPriceLabel')}
              testID="item-estimated-price-input"
            />
          </>
        )}
        <Text style={{ color: colors.ink, marginTop: spacing.md }}>{t('detail.photoOptional')}</Text><ItemPhotoPicker uri={photo} onChange={setPhoto} />
        <View style={styles.recurRow}>
          <Text style={styles.recurLabel}>{t('detail.repeat')}</Text>
          <Switch
            testID="item-recurring-switch"
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ true: colors.brand, false: colors.lineStrong }}
          />
        </View>

        {isRecurring && (
          <View style={styles.presetRow} testID="recurrence-options">
            {PRESETS.map((days) => (
              <Pressable
                key={days}
                testID={`recurrence-preset-${days}`}
                onPress={() => setRecurrenceDays(days)}
                style={[styles.preset, recurrenceDays === days && styles.presetActive]}
              >
                <Text
                  style={[styles.presetText, recurrenceDays === days && styles.presetTextActive]}
                >
                  {t('detail.days', { count: days })}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Button
          title={t('detail.add')}
          onPress={addItem}
          disabled={!name.trim() || busy}
          testID="add-item-button"
          style={{ marginTop: spacing.md }}
        />
      </View>

      {/* ── Panel Avanzado (Presupuesto, Voz/Texto y OCR) ────────────── */}
      {isAdvancedList(list) && (
        <View style={styles.shareCard} testID="advanced-list-panel">
          <View style={styles.recurRow}>
            <Badge tone="info" text={t('advancedList.premiumBadge')} />
            {list.hasHouseholdPremium && list.isShared && (
              <Badge tone="success" text={t('advancedList.householdBadge')} />
            )}
            {isOverBudget(list) && (
              <Badge tone="danger" text={t('advancedList.overBudgetWarning')} />
            )}
          </View>
          <Text style={styles.recurLabel}>
            {t('advancedList.pendingTotal', {
              amount: (list.estimatedPendingTotal ?? 0).toFixed(2),
              currency: getListCurrency(list),
            })}
          </Text>
          <Text style={styles.budgetSubText}>
            {t('advancedList.purchasedTotal', {
              amount: (list.purchasedTotal ?? 0).toFixed(2),
              currency: getListCurrency(list),
            })}
          </Text>
          <Text style={styles.budgetSubText}>
            {t('advancedList.projectedTotal', {
              amount: getProjectedTotal(list),
              currency: getListCurrency(list),
            })}
          </Text>
          {hasPositiveBudget(list) && (
            <Text style={styles.budgetSubText}>
              {t('advancedList.budgetLabel')}: {formatMoney(list.budget ?? 0, getListCurrency(list))}
            </Text>
          )}
          <View style={styles.recurRow}>
            <Text style={styles.recurLabel}>{t('advancedList.sortByAisles')}</Text>
            <Switch
              testID="aisle-sort-switch"
              value={Boolean(list.autoSortAisles)}
              onValueChange={(value) => guard(() => listsApi.update(listId, { autoSortAisles: value }))}
              trackColor={{ true: colors.brand, false: colors.lineStrong }}
            />
          </View>
          <SectionLabel>{t('advancedList.smartEntryTitle')}</SectionLabel>
          <TextInput
            testID="smart-entry-input"
            style={styles.addInput}
            placeholder={t('advancedList.smartEntryPlaceholder')}
            placeholderTextColor={colors.muted}
            value={smartText}
            onChangeText={setSmartText}
          />
          <Button
            title={t('advancedList.smartEntrySubmit')}
            onPress={submitSmartEntry}
            disabled={!smartText.trim() || busy}
            testID="smart-entry-submit"
            style={{ marginTop: spacing.sm }}
          />
          <SectionLabel>{t('advancedList.receiptTitle')}</SectionLabel>
          <TextInput
            testID="receipt-ocr-input"
            style={styles.addInput}
            placeholder={t('advancedList.receiptPlaceholder')}
            placeholderTextColor={colors.muted}
            multiline
            value={receiptText}
            onChangeText={setReceiptText}
          />
          <Button
            title={t('advancedList.receiptApply')}
            onPress={submitReceiptApply}
            disabled={!receiptText.trim() || busy}
            testID="receipt-ocr-submit"
            style={{ marginTop: spacing.sm }}
          />
        </View>
      )}

      {/* ── Cabecera de la lista ─────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
          <Badge tone="muted" text={t('lists.pending', { count: list.pending.length })} />
          {list.pending.filter((item) => item.isOverdue).length > 0 && (
            <Badge
              tone="danger"
              testID="overdue-summary"
              text={t('lists.overdue', { count: list.pending.filter((item) => item.isOverdue).length })}
            />
          )}
          {list.isShared && <Badge tone="success" text={t('lists.people', { count: list.memberCount })} />}
        </View>
        <Pressable onPress={() => setShowShare((value) => !value)} testID="share-button">
          <Text style={styles.linkAction}>{t('detail.share')}</Text>
        </Pressable>
      </View>

      {showShare && (
        <View style={styles.shareCard} testID="share-form">
          {list.ownerId === user?.id && <>
          <TextInput
            testID="share-email-input"
            style={styles.addInput}
            placeholder={t('detail.shareEmail')}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={shareEmail}
            onChangeText={setShareEmail}
          />
          <Button
            title={t('detail.shareSubmit')}
            testID="share-submit"
            onPress={() =>
              guard(async () => {
                const result = await listsApi.share(listId, shareEmail.trim().toLowerCase());
                if (result.invitationSent && result.invitationEmail) Alert.alert(t('detail.invitationSent'), t('detail.invitationSentBody', { email: result.invitationEmail }));
                setShareEmail('');
                setPending(await listsApi.invitations(listId));
              })
            }
            style={{ marginTop: spacing.sm }}
          />
          <SectionLabel>{t('detail.pendingInvitations')}</SectionLabel>
          {pending.length === 0 ? <Text style={{color:colors.inkSoft}}>{t('detail.noPendingInvitations')}</Text>
            : pending.map(invite => <View key={invite.id} style={{paddingVertical:spacing.sm, gap:spacing.sm}} testID="pending-invitation">
              <Text style={{color:colors.ink}}>{invite.email}</Text>
              <Text style={{color:colors.inkSoft}}>{t('detail.expires')} {new Date(invite.expiresAt).toLocaleDateString(i18n.language)}</Text>
              <Button title={t('detail.cancelInvitation')} disabled={busy}
                onPress={() => guard(async () => { await listsApi.revokeInvitation(listId, invite.id); setPending(await listsApi.invitations(listId)); })} />
            </View>)}
          </>}
          <View style={styles.notifyRow}>
            <Text style={styles.recurLabel}>{t('detail.notify')}</Text>
            <Switch
              testID="notify-switch"
              value={list.notifyOnChange}
              onValueChange={(value) => guard(() => listsApi.setMyNotifications(listId, value))}
              trackColor={{ true: colors.brand, false: colors.lineStrong }}
            />
          </View>
        </View>
      )}

      <View style={styles.datesRow}>
        <Text style={styles.recurLabel}>{t('detail.showDates')}</Text>
        <Switch
          testID="dates-switch"
          value={showDates}
          onValueChange={toggleDates}
          trackColor={{ true: colors.brand, false: colors.lineStrong }}
        />
      </View>

      {/* ── Pendientes ───────────────────────────────────────────────── */}
      <SectionLabel>{t('detail.pendingHeading', { count: list.pending.length })}</SectionLabel>
      <View testID="pending-list" style={list.pending.length > 0 ? styles.sheet : undefined}>
        {isAdvancedList(list) && list.autoSortAisles
          ? groupItemsByAisle(list.pending).map((group) => (
              <View key={group.aisle} testID="aisle-group">
                <Text style={styles.aisleHeader}>
                  {group.icon} {group.aisle}
                </Text>
                {group.items.map((item, index) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    first={index === 0}
                    disabled={busy}
                    showDates={showDates}
                    showPrice={isAdvancedList(list)}
                    isDragging={draggingItem?.section === SECTION_PENDING && draggingItem.id === item.id}
                    isDragOver={dragOverItem?.section === SECTION_PENDING && dragOverItem.id === item.id}
                    onPurchase={(target: Item) => guard(() => itemsApi.purchase(target.id))}
                    onDelete={(target: Item) => guard(() => itemsApi.remove(target.id))}
                    onEdit={setEditingItem}
                    onDragStartItem={(itemId) => setDraggingItem({ section: SECTION_PENDING, id: itemId })}
                    onDragOverItem={(itemId) => setDragOverItem({ section: SECTION_PENDING, id: itemId })}
                    onDropItem={(targetItemId, draggedItemId) => {
                      const sourceId = draggedItemId ?? (draggingItem?.section === SECTION_PENDING ? draggingItem.id : '');
                      setDraggingItem(null);
                      setDragOverItem(null);
                      if (sourceId) void reorderSectionItems(SECTION_PENDING, sourceId, targetItemId);
                    }}
                    onDragEndItem={() => {
                      setDraggingItem(null);
                      setDragOverItem(null);
                    }}
                    onMoveItem={(itemId, direction) => moveSectionItemByStep(SECTION_PENDING, itemId, direction)}
                  />
                ))}
              </View>
            ))
          : list.pending.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            first={index === 0}
            disabled={busy}
            showDates={showDates}
            showPrice={isAdvancedList(list)}
            isDragging={draggingItem?.section === SECTION_PENDING && draggingItem.id === item.id}
            isDragOver={dragOverItem?.section === SECTION_PENDING && dragOverItem.id === item.id}
            onPurchase={(target: Item) => guard(() => itemsApi.purchase(target.id))}
            onDelete={(target: Item) => guard(() => itemsApi.remove(target.id))}
            onEdit={setEditingItem}
            onDragStartItem={(itemId) => setDraggingItem({ section: SECTION_PENDING, id: itemId })}
            onDragOverItem={(itemId) => setDragOverItem({ section: SECTION_PENDING, id: itemId })}
            onDropItem={(targetItemId, draggedItemId) => {
              const sourceId = draggedItemId ?? (draggingItem?.section === SECTION_PENDING ? draggingItem.id : '');
              setDraggingItem(null);
              setDragOverItem(null);
              if (sourceId) void reorderSectionItems(SECTION_PENDING, sourceId, targetItemId);
            }}
            onDragEndItem={() => {
              setDraggingItem(null);
              setDragOverItem(null);
            }}
            onMoveItem={(itemId, direction) => moveSectionItemByStep(SECTION_PENDING, itemId, direction)}
            onLongPress={(target: Item) =>
              Alert.alert(target.name, t('detail.whatToDo'), [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('detail.delete'),
                  style: 'destructive',
                  onPress: () => guard(() => itemsApi.remove(target.id)),
                },
                ...(target.isRecurring
                  ? [
                      {
                        text: t('detail.advance'),
                        onPress: () => guard(() => itemsApi.advanceClock(target.id, 14)),
                      },
                    ]
                  : []),
              ])
            }
          />
        ))}
        {list.pending.length === 0 && (
          <Text style={styles.emptyText} testID="pending-empty">
            {t('detail.allDone')}
          </Text>
        )}
      </View>

      {/* ── Comprados ────────────────────────────────────────────────── */}
      {list.purchased.length > 0 && (
        <>
          <SectionLabel>{t('detail.purchasedHeading', { count: list.purchased.length })}</SectionLabel>
          <View testID="purchased-list" style={styles.sheet}>
            {list.purchased.map((item, index) => (
              <PurchasedRow
                key={item.id}
                item={item}
                first={index === 0}
                disabled={busy}
                showDates={showDates}
                showPrice={isAdvancedList(list)}
                isDragging={draggingItem?.section === SECTION_PURCHASED && draggingItem.id === item.id}
                isDragOver={dragOverItem?.section === SECTION_PURCHASED && dragOverItem.id === item.id}
                onRestore={(target) => guard(() => itemsApi.restore(target.id))}
                onClose={(target) => guard(() => itemsApi.close(target.id))}
                onEdit={setEditingItem}
                onDragStartItem={(itemId) => setDraggingItem({ section: SECTION_PURCHASED, id: itemId })}
                onDragOverItem={(itemId) => setDragOverItem({ section: SECTION_PURCHASED, id: itemId })}
                onDropItem={(targetItemId, draggedItemId) => {
                  const sourceId = draggedItemId ?? (draggingItem?.section === SECTION_PURCHASED ? draggingItem.id : '');
                  setDraggingItem(null);
                  setDragOverItem(null);
                  if (sourceId) void reorderSectionItems(SECTION_PURCHASED, sourceId, targetItemId);
                }}
                onDragEndItem={() => {
                  setDraggingItem(null);
                  setDragOverItem(null);
                }}
                onMoveItem={(itemId, direction) => moveSectionItemByStep(SECTION_PURCHASED, itemId, direction)}
              />
            ))}
          </View>
        </>
      )}
      {editingItem && <EditItemModal key={editingItem.id} item={editingItem} isAdvanced={isAdvancedList(list)} onClose={() => setEditingItem(null)} onSaved={() => { void load(); }} />}
    </ScrollView>
    {list.ownerId === user?.id && (
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setMenuVisible(false)}
          testID="list-menu-backdrop"
        >
          <View
            style={[styles.menuCard, { top: menuTop, right: spacing.md }]}
            onStartShouldSetResponder={() => true}
          >
            <Pressable
              testID="delete-list-button"
              accessibilityRole="menuitem"
              accessibilityLabel={t('detail.deleteList')}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: colors.dangerSoft },
              ]}
              onPress={() => {
                setMenuVisible(false);
                setTimeout(() => {
                  deleteList();
                }, 100);
              }}
            >
              <Text style={styles.menuItemIcon}>🗑️</Text>
              <Text style={styles.menuItemText}>{t('detail.deleteList')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    )}
  </>
);
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    ...shadow.card,
  },
  addCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    ...shadow.card,
  },
  addInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  recurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  recurLabel: { fontSize: 15, color: colors.ink, fontWeight: '600' },
  budgetSubText: { color: colors.inkSoft, fontSize: 13, marginTop: 2 },
  aisleHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bg,
  },
  presetRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  preset: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  presetActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  presetText: { fontSize: 14, color: colors.ink, fontWeight: '700' },
  presetTextActive: { color: colors.ink },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  linkAction: { color: colors.brand, fontWeight: '700', fontSize: 15, paddingVertical: 8 },
  shareCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadow.card,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  emptyText: {
    color: colors.inkSoft,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  menuButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonPressed: {
    opacity: 0.6,
  },
  menuButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 24,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: '#00000040',
  },
  menuCard: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    minWidth: 190,
    paddingVertical: 4,
    ...shadow.card,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 44,
  },
  menuItemIcon: {
    fontSize: 16,
  },
  menuItemText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
});
