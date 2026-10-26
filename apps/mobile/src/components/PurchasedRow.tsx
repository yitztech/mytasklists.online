import React, { useRef } from 'react';
import { Image, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge, CheckGlyph, CrossGlyph, GripVerticalGlyph, PencilGlyph } from './ui';
import { colors, spacing } from '../theme';
import type { Item } from '../types';
import { API_URL } from '../api/client';
import { formatItemTotal } from '../utils/aisles';
import { PLATFORM_WEB } from '../i18n/ui-helpers';
import { itemDates } from '../utils/item-dates';
import { unitLabel } from '../utils/units';

interface Props {
  item: Item;
  onRestore: (item: Item) => void;
  onClose: (item: Item) => void;
  disabled?: boolean;
  first?: boolean;
  onEdit: (item: Item) => void;
  /** Muestra cuándo se agregó y, si aplica, cuándo se editó */
  showDates?: boolean;
  showPrice?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStartItem?: (itemId: string) => void;
  onDragOverItem?: (itemId: string) => void;
  onDropItem?: (targetItemId: string, draggedItemId?: string) => void;
  onDragEndItem?: () => void;
  onMoveItem?: (itemId: string, direction: -1 | 1) => void;
}

/** Producto comprado: se muestra tachado y se quita con la "x" */
export function PurchasedRow({
  item,
  onRestore,
  onClose,
  disabled,
  first,
  onEdit,
  showDates,
  showPrice,
  isDragging,
  isDragOver,
  onDragStartItem,
  onDragOverItem,
  onDropItem,
  onDragEndItem,
  onMoveItem,
}: Props) {
  const { t, i18n } = useTranslation();
  const localizedUnit = unitLabel(item.unit, i18n.language);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
      onPanResponderGrant: () => {
        if (disabled) return;
        onDragStartItem?.(item.id);
      },
      onPanResponderMove: (_, gesture) => {
        if (disabled) return;
        if (gesture.dy < -35) {
          onMoveItem?.(item.id, -1);
          gesture.dy = 0;
        } else if (gesture.dy > 35) {
          onMoveItem?.(item.id, 1);
          gesture.dy = 0;
        }
      },
      onPanResponderRelease: () => {
        onDragEndItem?.();
      },
      onPanResponderTerminate: () => {
        onDragEndItem?.();
      },
    }),
  ).current;

  const webDragProps =
    Platform.OS === PLATFORM_WEB
      ? ({
          draggable: !disabled,
          onDragStart: (event: any) => {
            if (disabled) return;
            event.dataTransfer?.setData('text/plain', item.id);
            onDragStartItem?.(item.id);
          },
          onDragOver: (event: any) => {
            event.preventDefault?.();
            onDragOverItem?.(item.id);
          },
          onDrop: (event: any) => {
            event.preventDefault?.();
            const fromId = event.dataTransfer?.getData('text/plain') || undefined;
            onDropItem?.(item.id, fromId);
          },
          onDragEnd: () => onDragEndItem?.(),
        } as Record<string, unknown>)
      : {};

  return (
    <View
      {...webDragProps}
      style={[
        styles.row,
        !first && styles.divided,
        isDragging && styles.rowDragging,
        isDragOver && styles.rowDragOver,
      ]}
      testID="purchased-item"
    >
      <Pressable
        testID="item-drag-handle"
        accessibilityRole="button"
        accessibilityLabel={item.name}
        disabled={disabled}
        onPress={() => onMoveItem?.(item.id, -1)}
        onLongPress={() => onMoveItem?.(item.id, 1)}
        {...panResponder.panHandlers}
        style={({ pressed }) => [
          styles.dragHandle,
          (pressed || isDragging) && styles.dragHandleActive,
        ]}
      >
        <GripVerticalGlyph active={isDragging} />
      </Pressable>

      <Pressable
        style={styles.checkbox}
        onPress={() => !disabled && onRestore(item)}
        accessibilityLabel={t('item.restore', { name: item.name })}
        testID="purchased-checkbox"
        hitSlop={8}
      >
        <CheckGlyph size={15} />
      </Pressable>

      <View style={{ flex: 1 }}>
        {item.imageUrl && <Image source={{ uri: item.imageUrl.startsWith('http') ? item.imageUrl : `${API_URL}${item.imageUrl}` }} style={{ width: 56, height: 56, borderRadius: 8, marginBottom: 5 }} />}
        <Text style={styles.name} testID="purchased-name">
          {item.name}
        </Text>
        <View style={styles.metaRow}>
          {(Number(item.quantity)!==1||item.unit!=='pza')&&<Text style={styles.meta} testID="purchased-quantity">{Number(item.quantity)} {localizedUnit}</Text>}
          {showPrice && (item.lastPaidPrice !== null && item.lastPaidPrice !== undefined || item.estimatedPrice !== null && item.estimatedPrice !== undefined) && (
            <Badge tone="muted" text={formatItemTotal(item)} />
          )}
          {item.purchasedByName ? <Text style={styles.meta}>{item.purchasedByName}</Text> : null}
          {item.isRecurring && item.daysUntilReactivation !== null && (
            <Badge
              testID="purchased-return-badge"
              tone="info"
              text={t('item.returnsIn', { count: item.daysUntilReactivation })}
            />
          )}
        </View>
        {showDates ? <Text style={styles.meta} testID="item-dates">{itemDates(item, t, i18n.language)}</Text> : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => onEdit(item)}
          accessibilityRole="button"
          accessibilityLabel={`${t('item.edit')}: ${item.name}`}
          disabled={disabled}
          testID="item-edit"
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          hitSlop={4}
        >
          <PencilGlyph size={15} color={colors.ink} />
        </Pressable>

        <Pressable
          onPress={() => !disabled && onClose(item)}
          accessibilityLabel={t('item.close', { name: item.name })}
          testID="purchased-close"
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, styles.iconBtnClose, pressed && styles.iconBtnClosePressed]}
        >
          <CrossGlyph size={14} color={colors.inkSoft} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    backgroundColor: '#fafbf9',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
  },
  rowDragging: {
    opacity: 0.6,
    backgroundColor: '#edf7f2',
    borderColor: colors.brand,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 10,
  },
  rowDragOver: {
    borderTopWidth: 3,
    borderTopColor: colors.brand,
    backgroundColor: '#edf7f2',
  },
  divided: { borderTopWidth: 1, borderTopColor: colors.line },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    minWidth: 28,
    minHeight: 40,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandleActive: {
    backgroundColor: '#e2efe7',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  iconBtnPressed: {
    backgroundColor: '#e2e8f0',
  },
  iconBtnClose: {
    backgroundColor: '#f8fafc',
  },
  iconBtnClosePressed: {
    backgroundColor: '#f1f5f9',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 3, flexWrap: 'wrap' },
  meta: { fontSize: 13, color: colors.muted },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  edit: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
