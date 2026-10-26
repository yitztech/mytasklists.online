import { LOCALE_CONFIG, type Locale } from '@lista/contracts/locales';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, LANGUAGE_FLAGS, currentLanguage, setLanguage } from '../i18n';
import { shadow } from '../theme';
import { getLanguageOptionTestId, PLATFORM_WEB } from '../i18n/ui-helpers';
import { SelectField } from './SelectField';

function FlagBadge({ locale }: { locale: Locale }) {
  const isEs = locale === LANGUAGES[0];
  const isEn = locale === LANGUAGES[1];
  const isPt = locale === LANGUAGES[2];
  const isDe = locale === LANGUAGES[3];
  return (
    <View style={styles.flagFrame}>
      {isEs ? (
        <View style={styles.flagCanvas}>
          <View style={styles.flagEsStripe} />
          <View style={styles.flagEsMiddle}>
            <View style={styles.flagEsCoat} />
          </View>
          <View style={styles.flagEsStripe} />
        </View>
      ) : isEn ? (
        <View style={styles.flagEnCanvas}>
          {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
            <View
              key={idx}
              style={idx % 2 === 0 ? styles.flagEnStripeRed : styles.flagEnStripeWhite}
            />
          ))}
          <View style={styles.flagEnCanton} />
        </View>
      ) : isPt ? (
        <View style={styles.flagPtCanvas}>
          <View style={styles.flagPtDiamond}>
            <View style={styles.flagPtCircle} />
          </View>
        </View>
      ) : isDe ? (
        <View style={styles.flagCanvas}>
          <View style={styles.flagDeTop} />
          <View style={styles.flagDeMid} />
          <View style={styles.flagDeBot} />
        </View>
      ) : (
        <View style={styles.flagFrCanvas}>
          <View style={styles.flagFrLeft} />
          <View style={styles.flagFrMid} />
          <View style={styles.flagFrRight} />
        </View>
      )}
    </View>
  );
}

/** Selector común de idioma. La elección se guarda y se sincroniza con la cuenta. */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const active = currentLanguage();
  const activeUpper = active.toUpperCase();
  const isWeb = Platform.OS === PLATFORM_WEB;

  return (
    <View style={styles.root} testID="language-switcher">
      {isWeb && (
        <View style={styles.hiddenSelect}>
          <SelectField
            label={t('language.label')}
            value={active}
            onChange={(language) => setLanguage(language as (typeof LANGUAGES)[number])}
            options={LANGUAGES.map((language) => ({
              label: LANGUAGE_FLAGS[language] + ' ' + LOCALE_CONFIG[language].name,
              value: language,
            }))}
            style={styles.compact}
          />
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        testID="language-switcher-trigger"
        accessibilityRole="button"
        accessibilityLabel={t('language.label')}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.triggerCode}>{activeUpper}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={styles.menuCard}
            testID="language-switcher-menu"
            onStartShouldSetResponder={() => true}
          >
            {LANGUAGES.map((language, index) => {
              const selected = language === active;
              const isLast = index === LANGUAGES.length - 1;
              return (
                <Pressable
                  key={language}
                  testID={getLanguageOptionTestId(language)}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    !isLast && styles.optionDivider,
                    selected && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => {
                    setOpen(false);
                    setLanguage(language);
                  }}
                >
                  <View style={styles.optionLeft}>
                    <FlagBadge locale={language} />
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {LOCALE_CONFIG[language].name}
                    </Text>
                  </View>
                  {selected && <Text style={styles.checkHidden}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  hiddenSelect: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  compact: { borderWidth: 0, borderRadius: 0 },
  trigger: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#dce3ec',
    backgroundColor: '#ffffff',
  },
  triggerPressed: {
    opacity: 0.8,
  },
  triggerCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f1f38',
    letterSpacing: 0.2,
  },
  chevron: {
    fontSize: 12,
    color: '#0f1f38',
    marginTop: -1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#00000038',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    minWidth: 216,
    ...shadow.pop,
    elevation: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 18,
    backgroundColor: '#ffffff',
  },
  optionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf1',
  },
  optionSelected: {
    backgroundColor: '#f8f9fb',
  },
  optionPressed: {
    backgroundColor: '#f8f9fb',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flagFrame: {
    width: 34,
    height: 24,
    padding: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d5dce4',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  flagCanvas: {
    flex: 1,
    borderRadius: 2,
    overflow: 'hidden',
  },
  flagEsStripe: {
    flex: 1,
    backgroundColor: '#c60b1e',
  },
  flagEsMiddle: {
    flex: 2,
    backgroundColor: '#ffc400',
    justifyContent: 'center',
    paddingLeft: 5,
  },
  flagEsCoat: {
    width: 4,
    height: 5,
    borderRadius: 1,
    backgroundColor: '#c60b1e',
  },
  flagEnCanvas: {
    flex: 1,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  flagEnStripeRed: {
    flex: 1,
    backgroundColor: '#b22234',
  },
  flagEnStripeWhite: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  flagEnCanton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '45%',
    height: '55%',
    backgroundColor: '#3c3b6e',
  },
  flagPtCanvas: {
    flex: 1,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#009b3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagPtDiamond: {
    width: 14,
    height: 10,
    backgroundColor: '#fedf00',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagPtCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#002776',
  },
  flagDeTop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  flagDeMid: {
    flex: 1,
    backgroundColor: '#dd0000',
  },
  flagDeBot: {
    flex: 1,
    backgroundColor: '#ffce00',
  },
  flagFrCanvas: {
    flex: 1,
    borderRadius: 2,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  flagFrLeft: {
    flex: 1,
    backgroundColor: '#002395',
  },
  flagFrMid: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  flagFrRight: {
    flex: 1,
    backgroundColor: '#ed2939',
  },
  optionText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#0f1f38',
  },
  optionTextSelected: {
    fontWeight: '700',
    color: '#6b3410',
  },
  checkHidden: {
    width: 0,
    height: 0,
    opacity: 0,
  },
});
