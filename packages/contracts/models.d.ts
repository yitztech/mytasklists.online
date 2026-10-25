/**
 * Modelos que devuelve la API (servidor → cliente). Las fechas viajan como texto
 * ISO 8601.
 */

export type ItemStatus = 'pending' | 'purchased' | 'archived';
export type MemberRole = 'owner' | 'editor' | 'viewer';
export type AuthProvider = 'local' | 'google' | 'apple';
export type UserRole = 'user' | 'admin';
export type DevicePlatform = 'ios' | 'android' | 'web';
export type ListType = 'normal' | 'advanced';
export type AisleCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'beverages'
  | 'cleaning'
  | 'personal'
  | 'pets'
  | 'general';

export type { Locale as SupportedLocale, EnabledLocale } from './locales';
import type { Locale as SupportedLocale, LegacyLocale } from './locales';
/** Published clients only understand es/en here; the full choice is `preferredLocale`. */
export type Locale = LegacyLocale;

/**
 * Tipos de aviso conocidos. `AppNotification.type` es un texto abierto: el backend
 * puede sumar tipos nuevos y los clientes deben mostrar los que no reconozcan.
 */
export type NotificationType =
  | 'item.added'
  | 'item.purchased'
  | 'item.restored'
  | 'item.removed'
  | 'item.updated'
  | 'item.reactivated'
  | 'item.overdue'
  | 'list.shared'
  | 'list.updated'
  | 'member.left';

export interface User {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string | null;
  avatarUrl: string | null;
  provider: AuthProvider;
  role: UserRole;
  notificationsEnabled: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  isActive: boolean;
  /** Idioma de sus correos y avisos; los clientes lo igualan al de su interfaz */
  locale: Locale;
  /** Saved preference, including catalogs awaiting full delivery. */
  preferredLocale?: SupportedLocale;
  createdAt: string;
  /** Solo en el perfil propio: si la cuenta tiene contraseña definida */
  hasPassword?: boolean;
}

/** Lo mínimo que se puede saber de otra persona (búsqueda al compartir) */
export interface PublicProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

export interface Item {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  note: string | null;
  category: string;
  /** Ruta relativa a la API para una imagen cargada; null cuando no tiene. */
  imageUrl: string | null;
  status: ItemStatus;
  isRecurring: boolean;
  recurrenceDays: number | null;
  activatedAt: string;
  dueAt: string | null;
  nextActivationAt: string | null;
  purchasedAt: string | null;
  purchasedById: string | null;
  purchasedByName: string | null;
  lastPurchasedAt: string | null;
  cycleCount: number;
  createdById: string | null;
  createdByName: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  /** Última edición hecha por una persona; null si no se ha editado desde que se agregó. */
  editedAt: string | null;
  // ── campos calculados que consume la interfaz ──
  isOverdue: boolean;
  daysOverdue: number;
  daysUntilDue: number | null;
  daysUntilReactivation: number | null;
  // ── campos de listas avanzadas (Pilar Financiero) ──
  estimatedPrice?: number | null;
  lastPaidPrice?: number | null;
  storeName?: string | null;
}

export interface Member {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
  notifyOnChange: boolean;
  joinedAt: string;
}

export interface ListSummary {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  ownerId: string;
  isArchived: boolean;
  isShared: boolean;
  myRole: MemberRole;
  notifyOnChange: boolean;
  memberCount: number;
  pendingCount: number;
  purchasedCount: number;
  overdueCount: number;
  recurringCount: number;
  createdAt: string;
  updatedAt: string;
  // ── campos de listas avanzadas (Finanzas, Pasillos y Hogar Premium) ──
  listType?: ListType;
  budget?: number | null;
  currency?: string;
  autoSortAisles?: boolean;
  estimatedPendingTotal?: number;
  purchasedTotal?: number;
  hasHouseholdPremium?: boolean;
}

export interface SmartParsedItem {
  name: string;
  quantity: number;
  unit: string;
  category: AisleCategory | string;
  estimatedPrice: number | null;
  isRecurring: boolean;
  recurrenceDays: number | null;
}

export interface SmartEntryResponse {
  parsed: SmartParsedItem[];
  created: Item[];
}

export interface ReceiptLineMatch {
  rawLine: string;
  detectedName: string;
  price: number | null;
  quantity: number;
  matchedItemId: string | null;
  matchedItemName: string | null;
  previousRecurrenceDays: number | null;
  suggestedRecurrenceDays: number | null;
}

export interface ReceiptScanResponse {
  lines: ReceiptLineMatch[];
  detectedTotal: number;
}

export interface ReceiptApplyResponse {
  purchasedCount: number;
  recurrenceAdjustedCount: number;
  items: Item[];
}

export interface ListDetail extends ListSummary {
  members: Member[];
  /** Productos por comprar (lista de arriba) */
  pending: Item[];
  /** Productos ya comprados (lista de abajo, tachados) */
  purchased: Item[];
}

export interface AppNotification {
  id: string;
  /** Uno de `NotificationType`, o uno nuevo que el cliente todavía no conoce */
  type: string;
  title: string;
  body: string;
  listId: string | null;
  itemId: string | null;
  actorId: string | null;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface AuthProviders {
  local: boolean;
  google: boolean;
  apple: boolean;
}

export interface OkResponse {
  ok: boolean;
}
