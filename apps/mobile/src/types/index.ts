// Las formas de la API viven en el contrato compartido con el backend y la web
import type { AuthResponse as ContractAuthResponse, MfaChallenge } from '@lista/contracts';

export type {
  AisleCategory,
  AppCompatibility,
  AppNotification,
  AppUpdateRequiredError,
  Item,
  ItemStatus,
  ListDetail,
  ListSummary,
  ListType,
  Member,
  MfaChallenge,
  ReceiptApplyResponse,
  ReceiptLineMatch,
  ReceiptScanResponse,
  SmartEntryResponse,
  SmartParsedItem,
  User,
} from '@lista/contracts';

/** La app móvil no usa cookies: el refresh token siempre llega en el cuerpo */
export type AuthResponse = ContractAuthResponse & { refreshToken: string };

export type LoginResponse = AuthResponse | MfaChallenge;
