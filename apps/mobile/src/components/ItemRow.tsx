import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, GestureResponderHandlers, Image, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge, CheckGlyph, GripVerticalGlyph, PencilGlyph, TrashGlyph } from './ui';
import { colors, radius, shadow, spacing } from '../theme';
import type { Item } from '../types';
import { API_URL } from '../api/client';
import { formatItemTotal } from '../utils/aisles';
import { PLATFORM_WEB } from '../i18n/ui-helpers';
import { itemDates } from '../utils/item-dates';
import { unitLabel } from '../utils/units';

export const COMPLETION_ANIMATION_MS = 600;
const ACTION_MOVE_UP = 'moveUp';
const ACTION_MOVE_DOWN = 'moveDown';

interface Props {
  item: Item;
  onPurchase: (item: Item) => void;
  onDelete?: (item: Item) => void;
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
  dragHandleProps?: GestureResponderHandlers | Record<string, unknown>;
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
  onDelete,
  onLongPress,
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
        {
          opacity: rowOpacity,
          transform: [{ translateX: rowSlide }],
        },
      ]}
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

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('item.edit')}: ${item.name}`}
          onPress={() => onEdit(item)}
          disabled={disabled || completing}
          testID="item-edit"
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          hitSlop={4}
        >
          <PencilGlyph size={15} color={colors.ink} />
        </Pressable>

        {onDelete && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('detail.delete')}: ${item.name}`}
            onPress={() => onDelete(item)}
            disabled={disabled || completing}
            testID="item-delete"
            style={({ pressed }) => [styles.iconBtn, styles.iconBtnDanger, pressed && styles.iconBtnDangerPressed]}
            hitSlop={4}
          >
            <TrashGlyph size={15} color={colors.danger} />
          </Pressable>
        )}
      </View>
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
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    ...shadow.card,
  },
  rowCompleting: {
    backgroundColor: colors.brandSoft,
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
  iconBtnDanger: {
    backgroundColor: '#fef2f2',
  },
  iconBtnDangerPressed: {
    backgroundColor: '#fee2e2',
  },
  name: { fontSize: 16, fontWeight: '600', color: colors.ink, letterSpacing: -0.15 },
  nameCompleting: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4, flexWrap: 'wrap' },
  meta: { fontSize: 13, color: colors.inkSoft },
});
