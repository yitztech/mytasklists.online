/**
 * Los correos pedidos desde la app nativa llevan `app=android|ios` en el
 * fragmento del enlace. Se guarda en la pestaña (el fragmento se borra de la
 * barra de direcciones) para devolver a la persona a la app al terminar.
 */
export type NativeApp = 'android' | 'ios';

const KEY = 'lc.nativeApp';
const ANDROID_PACKAGE = 'online.mytasklists.app';
const SCHEME = 'mytasklists';

const isNativeApp = (value: unknown): value is NativeApp => value === 'android' || value === 'ios';

/** Lee `app` del fragmento actual y lo recuerda; si no viene, devuelve el recordado */
export function rememberNativeApp(): NativeApp | null {
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('app');
  try {
    if (isNativeApp(fromHash)) sessionStorage.setItem(KEY, fromHash);
    const stored = sessionStorage.getItem(KEY);
    return isNativeApp(stored) ? stored : null;
  } catch {
    return isNativeApp(fromHash) ? fromHash : null;
  }
}

export function forgetNativeApp(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

/**
 * Enlace que abre la pantalla de login de la app con el correo ya escrito.
 * En Android se usa un intent: Chrome abre la app aunque el enlace venga de
 * una página y, si no está instalada, vuelve al login web.
 */
export function nativeLoginUrl(app: NativeApp, email?: string | null): string {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  if (app === 'ios') return `${SCHEME}://login${query}`;
  const fallback = encodeURIComponent(`${window.location.origin}/app/login`);
  return `intent://login${query}#Intent;scheme=${SCHEME};package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
}
