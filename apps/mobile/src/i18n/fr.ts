import type { es } from './es';
import type { DraftCatalog } from './catalog';

/** In preparation. Not enabled until i18n:check --release=fr passes. */
export const fr: DraftCatalog<typeof es> = {
  google: { unavailable: "Google est indisponible dans cette version. Connectez-vous avec votre adresse e-mail." },
};
