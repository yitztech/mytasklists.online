import React, { useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';

const extra = Constants.expoConfig?.extra ?? {};
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || extra.googleWebClientId;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || extra.googleIosClientId;
const validClientId = (value: unknown): value is string =>
  typeof value === 'string' && /^[\w-]+\.apps\.googleusercontent\.com$/.test(value);

// Credential Manager issues tokens for the WEB client ID. Android OAuth clients
// bind package/certificate in Google Cloud; their IDs are not SDK server IDs.
export const googleConfigured = Constants.executionEnvironment !== 'storeClient' &&
  validClientId(webClientId) && (Platform.OS !== 'ios' || validClientId(iosClientId));

interface Props {
  onIdToken: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function GoogleSignInButton({ onIdToken, onError, disabled }: Props) {
  const { t } = useTranslation();
  const pending = useRef(false);
  const [loading, setLoading] = useState(false);
  const signIn = async () => {
    if (pending.current || disabled || !googleConfigured) return;
    pending.current = true;
    setLoading(true);
    onError('');
    try {
      // Lazy loading also lets older binaries show a retryable error instead
      // of crashing at startup if their native module has not been rebuilt.
      const { GoogleOneTapSignIn, isSuccessResponse } = await import('react-native-nitro-google-signin');
      GoogleOneTapSignIn.configure({ webClientId, iosClientId, offlineAccess: false });
      if (Platform.OS === 'android') await GoogleOneTapSignIn.checkPlayServices(true);
      const result = await GoogleOneTapSignIn.presentExplicitSignIn();
      if (result.type === 'cancelled') return;
      if (!isSuccessResponse(result) || !result.data.idToken) {
        onError(t('google.noToken'));
        return;
      }
      await onIdToken(result.data.idToken);
    } catch (error) {
      if ((error as { code?: string })?.code !== 'SIGN_IN_CANCELLED') onError(t('google.failed'));
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };
  return <Button title={t('login.google')} variant="ghost" loading={loading}
    disabled={disabled || !googleConfigured} onPress={() => void signIn()}
    testID="google-login" style={{ marginBottom: 16 }} />;
}
