import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { Item } from '../types';
import { API_URL } from '../api/client';
import { itemDates } from '../utils/item-dates';
import { unitLabel } from '../utils/units';
import {
  getDragHandleClass,
  getPurchasedItemClass,
  KEY_ARROW_DOWN,
  KEY_ARROW_UP,
} from '../i18n/ui-helpers';

interface Props {
  item: Item;
  disabled?: boolean;
  /** Muestra cuándo se agregó y, si aplica, cuándo se editó */
  showDates?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onRestore: (item: Item) => void;
  onClose: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDragStartItem?: (itemId: string) => void;
  onDragOverItem?: (itemId: string) => void;
  onDropItem?: (targetItemId: string, draggedItemId?: string) => void;
  onDragEndItem?: () => void;
  onMoveItem?: (itemId: string, direction: -1 | 1) => void;
}

const relativeDate = (iso: string | null, t: TFunction): string => {
  if (!iso) return '';
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays <= 0) return t('item.today');
  if (diffDays === 1) return t('item.yesterday');
  return t('item.daysAgo', { count: diffDays });
};

/**
 * Fila de la lista de abajo (productos ya comprados).
 * Se muestran tachados y se quitan manualmente con la "x".
 */
export function PurchasedItem({
  item,
  disabled,
  showDates,
  isDragging,
  isDragOver,
  onRestore,
  onClose,
  onEdit,
  onDragStartItem,
  onDragOverItem,
  onDropItem,
  onDragEndItem,
  onMoveItem,
}: Props) {
  const { t, i18n } = useTranslation();
  const localizedUnit = unitLabel(item.unit, i18n.language);
  return (
    <li
      className={getPurchasedItemClass(isDragging, isDragOver)}
      data-testid="purchased-item"
      data-item-id={item.id}
      data-item-name={item.name}
      data-recurring={item.isRecurring ? 'true' : 'false'}
      draggable={!disabled}
      onDragStart={(event) => {
        if (disabled) return;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', item.id);
        onDragStartItem?.(item.id);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        onDragOverItem?.(item.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        const fromId = event.dataTransfer.getData('text/plain') || undefined;
        onDropItem?.(item.id, fromId);
      }}
      onDragEnd={() => onDragEndItem?.()}
    >
      <button
        type="button"
        className={getDragHandleClass(isDragging)}
        disabled={disabled}
        aria-label={item.name}
        data-testid="item-drag-handle"
        onKeyDown={(event) => {
          if (event.key === KEY_ARROW_UP) {
            event.preventDefault();
            onMoveItem?.(item.id, -1);
          } else if (event.key === KEY_ARROW_DOWN) {
            event.preventDefault();
            onMoveItem?.(item.id, 1);
          }
        }}
      >
        <i className="bi bi-grip-vertical" aria-hidden="true" />
      </button>

      <input
        type="checkbox"
        className="lc-check"
        checked
        onChange={() => onRestore(item)}
        disabled={disabled}
        aria-label={t('item.restore', { name: item.name })}
        data-testid="purchased-checkbox"
      />

      <div className="flex-grow-1 min-w-0">
        {item.imageUrl && <img src={`${API_URL}${item.imageUrl}`} alt="" loading="lazy" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />}
        <div className="lc-item-name" data-testid="purchased-name">
          {item.name}
        </div>
        <div className="lc-item-meta">
          {(Number(item.quantity)!==1||item.unit!=='pza')&&<span className="lc-hint" data-testid="purchased-quantity">{Number(item.quantity)} {localizedUnit}</span>}
          <span className="lc-hint" data-testid="purchased-meta">
            {item.purchasedByName ? `${item.purchasedByName} · ` : ''}
            {relativeDate(item.purchasedAt, t)}
          </span>
          {item.isRecurring && item.daysUntilReactivation !== null && (
            <span className="lc-chip lc-chip--tag" data-testid="purchased-return-badge">
              <i className="bi bi-arrow-repeat me-1" aria-hidden="true" />
              {t('item.returnsIn', { count: item.daysUntilReactivation })}
            </span>
          )}
        </div>
        {showDates && <div className="lc-hint mt-1" data-testid="item-dates">{itemDates(item, t, i18n.language)}</div>}
      </div>

      <div className="d-flex align-items-center gap-1 flex-shrink-0">
        <button className="lc-icon-btn" type="button" onClick={() => onEdit(item)} disabled={disabled} aria-label={`${t('item.edit')}: ${item.name}`} data-testid="item-edit"><i className="bi bi-pencil" aria-hidden="true" /></button>
        <button
          className="lc-icon-btn"
          type="button"
          onClick={() => onClose(item)}
          disabled={disabled}
          aria-label={t('item.closeLabel', { name: item.name })}
          title={t('item.closeTitle')}
          data-testid="purchased-close"
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
