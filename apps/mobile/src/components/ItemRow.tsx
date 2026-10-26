import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge, CheckGlyph } from './ui';
import { colors, spacing } from '../theme';
import type { Item } from '../types';
import { API_URL } from '../api/client';
import { formatItemTotal } from '../utils/aisles';
import { PLATFORM_WEB } from '../i18n/ui-helpers';
import { itemDates } from '../utils/item-dates';
import { unitLabel } from '../utils/units';

export const COMPLETION_ANIMATION_MS = 600;

interface Props {
  item: Item;
  onPurchase: (item: Item) => void;
  onLongPress?: (item: Item) => void;
  disabled?: boolean;
  /** Primera fila de la hoja: sin filete arriba */
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

/**
 * Producto pendiente. El estado se lee en el aro del check y en la etiqueta:
 * gris (una sola vez), etiqueta amarilla (recurrente al día) y rojo (vencido).
 */
export function ItemRow({
  item,
  onPurchase,
  onLongPress,
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
  const [completing, setCompleting] = useState(false);
  const checkScale = useRef(new Animated.Value(1)).current;
  const rowOpacity = useRef(new Animated.Value(1)).current;
  const rowSlide = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerPurchase = () => {
    if (disabled || completing) return;
    setCompleting(true);
    checkScale.setValue(0.82);
    rowOpacity.setValue(1);
    rowSlide.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(checkScale, {
          toValue: 1.22,
          duration: 240,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(checkScale, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rowOpacity, {
        toValue: 0.35,
        duration: COMPLETION_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rowSlide, {
        toValue: 10,
        duration: COMPLETION_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onPurchase(item);
      setCompleting(false);
      rowOpacity.setValue(1);
      rowSlide.setValue(0);
    }, COMPLETION_ANIMATION_MS);
  };

  const webDragProps =
    Platform.OS === PLATFORM_WEB
      ? ({
          draggable: !disabled && !completing,
          onDragStart: (event: any) => {
            if (disabled || completing) return;
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
      testID="pending-item"
      {...webDragProps}
      style={[
        styles.row,
        !first && styles.divided,
        item.isOverdue && { backgroundColor: colors.dangerSoft },
        completing && styles.rowCompleting,
        isDragging && styles.rowDragging,
        isDragOver && styles.rowDragOver,
        { opacity: rowOpacity, transform: [{ translateX: rowSlide }] },
      ]}
    >
      <Pressable
        testID="item-drag-handle"
        accessibilityRole="button"
        accessibilityLabel={item.name}
        disabled={disabled || completing}
        onPress={() => onMoveItem?.(item.id, -1)}
        onLongPress={() => onMoveItem?.(item.id, 1)}
        style={styles.dragHandle}
      >
        <Text style={styles.dragGrip}>⋮⋮</Text>
      </Pressable>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={t('item.markPurchased', { name: item.name })}
        accessibilityState={{ checked: completing }}
        onPress={triggerPurchase}
        onLongPress={() => onLongPress?.(item)}
        disabled={disabled || completing}
        style={({ pressed }) => [styles.checkboxWrap, pressed && { opacity: 0.65 }]}
      >
        <Animated.View
          style={[
            styles.checkbox,
            item.isOverdue && { borderColor: colors.danger },
            completing && styles.checkboxCompleting,
            { transform: [{ scale: checkScale }] },
          ]}
          testID="item-checkbox"
        >
          {completing && <CheckGlyph size={15} />}
        </Animated.View>
      </Pressable>

      <Pressable
        style={{ flex: 1 }}
        onPress={triggerPurchase}
        onLongPress={() => onLongPress?.(item)}
        disabled={disabled || completing}
        accessibilityLabel={t('item.markPurchased', { name: item.name })}
      >
        {item.imageUrl && <Image source={{ uri: item.imageUrl.startsWith('http') ? item.imageUrl : `${API_URL}${item.imageUrl}` }} style={{ width: 56, height: 56, borderRadius: 8, marginBottom: 5 }} />}
        <Text
          style={[
            styles.name,
            item.isOverdue && { color: colors.dangerInk },
            completing && styles.nameCompleting,
          ]}
          testID="item-name"
        >
          {item.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {item.quantity} {unitLabel(item.unit, i18n.language)}
          </Text>
          {showPrice && (item.estimatedPrice !== null && item.estimatedPrice !== undefined || item.lastPaidPrice !== null && item.lastPaidPrice !== undefined) && (
            <Badge tone="success" text={formatItemTotal(item)} />
          )}
          {item.isRecurring && (
            <Badge
              testID="item-recurrence-badge"
              tone={item.isOverdue ? 'muted' : 'info'}
              text={t('item.every', { count: item.recurrenceDays ?? 0 })}
            />
          )}
          {item.isOverdue ? (
            <Badge testID="item-overdue-badge" tone="danger" text={t('item.overdue', { count: item.daysOverdue })} />
          ) : item.isRecurring && item.daysUntilDue !== null ? (
            <Text style={styles.meta}>{t('item.dueIn', { count: item.daysUntilDue })}</Text>
          ) : null}
        </View>
        {item.note ? <Text style={styles.meta} numberOfLines={2}>{item.note}</Text> : null}
        {showDates ? <Text style={styles.meta} testID="item-dates">{itemDates(item, t, i18n.language)}</Text> : null}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${t('item.edit')}: ${item.name}`} onPress={() => onEdit(item)} disabled={disabled || completing} style={styles.edit}><Text style={{ color: colors.brand, fontWeight: '700' }}>{t('item.edit')}</Text></Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  rowCompleting: {
    backgroundColor: colors.brandSoft,
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
    borderWidth: 2,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleting: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  checkboxWrap: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
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
  edit: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: colors.ink, letterSpacing: -0.15 },
  nameCompleting: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4, flexWrap: 'wrap' },
  meta: { fontSize: 13, color: colors.inkSoft },
});
