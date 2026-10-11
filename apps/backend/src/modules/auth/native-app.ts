import type { FastifyRequest } from 'fastify';

export type NativeApp = 'android' | 'ios';

/**
 * Plataforma de la app nativa que hizo la petición (`X-App-Platform`), o null
 * para la web. Los enlaces de los correos la llevan en el fragmento para que la
 * web, al terminar, devuelva a la persona a la app de la que salió.
 */
export const nativeAppOf = (request: FastifyRequest): NativeApp | null => {
  const platform = request.headers['x-app-platform'];
  return platform === 'android' || platform === 'ios' ? platform : null;
};

/** Sufijo del fragmento del enlace: `&app=android` o nada */
export const appFragment = (app: NativeApp | null | undefined): string => (app ? `&app=${app}` : '');
