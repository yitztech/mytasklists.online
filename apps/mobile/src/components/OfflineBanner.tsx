import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOffline } from '../context/OfflineContext';
import { colors, radius, spacing } from '../theme';

export function OfflineBanner() {
  const { isOnline, isSyncing, pendingCount } = useOffline();
  const { t } = useTranslation();

  if (isOnline && !isSyncing && pendingCount === 0) {
    return null;
  }

  const isInfo = isOnline && (isSyncing || pendingCount > 0);
  const bannerStyle = isInfo ? styles.bannerInfo : styles.bannerWarning;
  const textStyle = isInfo ? styles.textInfo : styles.textWarning;

  let text: string;
  if (!isOnline) {
    if (pendingCount > 0) {
      text = t('offline.bannerPending', { count: pendingCount });
    } else {
      text = t('offline.banner');
    }
  } else if (isSyncing) {
    text = t('offline.syncing');
  } else {
    text = t('offline.pendingCount', { count: pendingCount });
  }

  return (
    <View
      style={[styles.banner, bannerStyle]}
      testID="offline-banner"
      accessibilityRole="alert"
    >
      <Text style={[styles.text, textStyle]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bannerWarning: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentLine,
  },
  bannerInfo: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brandLine,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  textWarning: {
    color: colors.ink,
  },
  textInfo: {
    color: colors.brand,
  },
});
