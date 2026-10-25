// Las formas de la API viven en el contrato compartido con el backend y la app móvil
import type { LoginResponse, MfaChallenge } from '@lista/contracts';

export type {
  AisleCategory,
  AppNotification,
  AuthProviders,
  AuthResponse,
  Item,
  ItemStatus,
  ListDetail,
  ListSummary,
  ListType,
  LoginResponse,
  Member,
  MemberRole,
  MfaChallenge,
  ReceiptApplyResponse,
  ReceiptLineMatch,
  ReceiptScanResponse,
  SmartEntryResponse,
  SmartParsedItem,
  User,
} from '@lista/contracts';

export const isMfaChallenge = (value: LoginResponse): value is MfaChallenge =>
  'mfaRequired' in value && value.mfaRequired === true;
