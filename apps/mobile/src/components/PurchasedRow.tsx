import React, { useRef } from 'react';
import { Animated, GestureResponderHandlers, Image, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge, CheckGlyph, CrossGlyph, GripVerticalGlyph, PencilGlyph } from './ui';
import { colors, radius, shadow, spacing } from '../theme';
import type { Item } from '../types';
import { API_URL } from '../api/client';
import { formatItemTotal } from '../utils/aisles';
import { PLATFORM_WEB } from '../i18n/ui-helpers';
import { itemDates } from '../utils/item-dates';
import { unitLabel } from '../utils/units';

const ACTION_MOVE_UP = 'moveUp';
const ACTION_MOVE_DOWN = 'moveDown';

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
  dragHandleProps?: GestureResponderHandlers | Record<string, unknown>;
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
  dragHandleProps,
  onDragStartItem,
  onDragOverItem,
  onDropItem,
  onDragEndItem,
  onMoveItem,
}: Props) {
  const { t, i18n } = useTranslation();
  const localizedUnit = unitLabel(item.unit, i18n.language);

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
    <Animated.View
      {...webDragProps}
      style={[
        styles.row,
        !first && styles.divided,
        isDragging && styles.rowDragging,
        isDragOver && styles.rowDragOver,
      ]}
      testID="purchased-item"
    >
      <View
        testID="item-drag-handle"
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={item.name}
        accessibilityActions={[
          { name: ACTION_MOVE_UP, label: t('detail.moveUp', 'Mover arriba') },
          { name: ACTION_MOVE_DOWN, label: t('detail.moveDown', 'Mover abajo') },
        ]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === ACTION_MOVE_UP) onMoveItem?.(item.id, -1);
          if (event.nativeEvent.actionName === ACTION_MOVE_DOWN) onMoveItem?.(item.id, 1);
        }}
        {...dragHandleProps}
        style={[styles.dragHandle, isDragging && styles.dragHandleActive]}
      >
        <GripVerticalGlyph active={isDragging} />
      </View>

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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    backgroundColor: '#fafbf9',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    ...shadow.card,
  },
  rowDragging: {
    opacity: 0.85,
    backgroundColor: '#edf7f2',
    borderColor: colors.brand,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 999,
  },
  rowDragOver: {
    borderWidth: 2,
    borderColor: colors.brand,
    backgroundColor: '#edf7f2',
  },
  divided: {},
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    minWidth: 36,
    minHeight: 48,
    paddingHorizontal: 6,
    paddingVertical: 10,
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
