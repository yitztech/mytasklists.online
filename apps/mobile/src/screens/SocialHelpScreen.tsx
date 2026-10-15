import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '../components/ui';
import { colors, spacing } from '../theme';

/** Compatibility route for older navigation state; native login never opens a web session. */
export function SocialHelpScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const provider = route?.params?.provider ?? 'Google';

  return (
    <ScrollView contentContainerStyle={styles.container} testID="social-help-screen">
      <Card>
        <Text style={styles.title}>{t('social.title', { provider })}</Text>
        <Text style={styles.body}>{t('google.unavailable')}</Text>
        <Button
          title={t('common.back')}
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.md }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, flexGrow: 1, justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm, letterSpacing: -0.4 },
  body: { color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
});
