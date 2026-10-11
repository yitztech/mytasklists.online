import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthShell } from './AuthShell';
import { forgetNativeApp, nativeLoginUrl, type NativeApp } from '../utils/native-app';

/**
 * Cierre de un flujo que empezó en la app nativa (registro o contraseña nueva):
 * intenta abrir la app y deja el botón por si el navegador bloquea el salto.
 */
export function ReturnToApp({ app, email, message }: { app: NativeApp; email?: string | null; message: string }) {
  const { t } = useTranslation();
  const url = nativeLoginUrl(app, email);

  useEffect(() => {
    window.location.href = url;
  }, [url]);

  return (
    <AuthShell>
      <div data-testid="return-to-app">
        <div className="lc-auth-head">
          <h1>{t('returnToApp.title')}</h1>
          <p>{message}</p>
        </div>
        <a className="btn btn-primary btn-lg w-100" href={url} data-testid="open-native-app">
          {t('returnToApp.open')}
        </a>
        <p className="text-center text-muted mt-4 mb-0">
          <Link to="/" className="fw-semibold" onClick={forgetNativeApp} data-testid="stay-on-web">
            {t('returnToApp.stayOnWeb')}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
