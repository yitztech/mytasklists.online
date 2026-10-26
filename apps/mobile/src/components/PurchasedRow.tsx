import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge, CheckGlyph, CrossGlyph } from './ui';
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
        style={styles.dragHandle}
      >
        <Text style={styles.dragGrip}>⋮⋮</Text>
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

      <Pressable onPress={() => onEdit(item)} accessibilityRole="button" accessibilityLabel={`${t('item.edit')}: ${item.name}`} disabled={disabled} style={styles.edit}><Text style={{ color: colors.brand, fontWeight: '700' }}>{t('item.edit')}</Text></Pressable>

      <Pressable
        onPress={() => !disabled && onClose(item)}
        accessibilityLabel={t('item.close', { name: item.name })}
        testID="purchased-close"
        hitSlop={12}
        style={styles.close}
      >
        <CrossGlyph size={14} />
      </Pressable>
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
    opacity: 0.5,
    backgroundColor: colors.brandSoft,
  },
  rowDragOver: {
    borderTopWidth: 2,
    borderTopColor: colors.brand,
    backgroundColor: colors.brandSoft,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragGrip: {
    fontSize: 15,
    color: colors.muted,
    fontWeight: '700',
    letterSpacing: -1,
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
