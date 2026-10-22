import React from 'react';
import { ActionSheetIOS, Platform, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing } from '../theme';

export interface SelectOption {
  label: string;
  value: string;
}

/**
 * Selector de una opción. En iOS el Picker es una rueda fija que ocupa media pantalla:
 * ahí se muestra un campo compacto que abre la hoja de acciones nativa. En Android y web,
 * el Picker ya es un desplegable.
 */
export function SelectField({
  options,
  value,
  onChange,
  label,
  testID,
  style,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Título de la hoja de acciones y etiqueta de accesibilidad */
  label: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();

  if (Platform.OS === 'ios') {
    const open = () =>
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: label,
          options: [...options.map((option) => option.label), t('common.cancel')],
          cancelButtonIndex: options.length,
        },
        (index) => {
          if (index < options.length) onChange(options[index].value);
        },
      );
    return (
      <Pressable
        style={[styles.field, style]}
        testID={testID}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.value}>{options.find((option) => option.value === value)?.label ?? ''}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
    );
  }

  return (
    <Picker
      selectedValue={value}
      onValueChange={(next) => onChange(String(next))}
      accessibilityLabel={label}
      testID={testID}
      style={{ color: colors.ink }}
      dropdownIconColor={colors.ink}
    >
      {options.map((option) => (
        <Picker.Item key={option.value} label={option.label} value={option.value} />
      ))}
    </Picker>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  value: { fontSize: 16, color: colors.ink },
  chevron: { fontSize: 14, color: colors.ink },
});
