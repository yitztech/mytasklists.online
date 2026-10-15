import React, { useEffect } from 'react';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';

// Cierra la ventana del navegador al volver del flujo (necesario en web)
WebBrowser.maybeCompleteAuthSession();

const extra = (Constants.expoConfig?.extra ?? {}) as {
  googleIosClientId?: string;
  googleAndroidClientId?: string;
  googleWebClientId?: string;
};

const clientIds = {
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || extra.googleIosClientId || undefined,
  androidClientId:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || extra.googleAndroidClientId || undefined,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || extra.googleWebClientId || undefined,
};

/** Browser client configuration; native platforms use the separate SDK module. */
export const googleConfigured = Boolean(clientIds.webClientId);

interface Props {
  onIdToken: (idToken: string) => Promise<void>;
  disabled?: boolean;
  onError: (message: string) => void;
}

/** Browser-only implementation; Metro selects .native.tsx in Android/iOS. */
export function GoogleSignInButton({ onIdToken, onError, disabled }: Props) {
  const { t } = useTranslation();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(clientIds);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token ?? response.authentication?.idToken;
      if (idToken) void onIdToken(idToken);
      else onError(t('google.noToken'));
    } else if (response?.type === 'error') {
      onError(t('google.failed'));
    }
  }, [response, onIdToken, onError, t]);

  return (
    <Button
      title={t('login.google')}
      variant="ghost"
      disabled={!request || disabled}
      onPress={() => void promptAsync()}
      testID="google-login"
      style={{ marginBottom: 16 }}
    />
  );
}
