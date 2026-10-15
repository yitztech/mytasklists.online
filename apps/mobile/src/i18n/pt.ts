import type { es } from './es';
import type { DraftCatalog } from './catalog';

/** In preparation. Not enabled until i18n:check --release=pt passes. */
export const pt: DraftCatalog<typeof es> = {
  google: { unavailable: "O Google não está disponível nesta versão. Entre com seu e-mail." },
};
