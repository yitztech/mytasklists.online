import UNITS from '../../../../packages/ui-data/units.json';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Button } from './ui';
import { ItemPhotoPicker } from './ItemPhotoPicker';
import { SelectField } from './SelectField';
import { itemsApi } from '../api/endpoints';
import { API_URL } from '../api/client';
import { colors, radius, spacing } from '../theme';
import type { Item } from '../types';
import { itemImageForm } from '../utils/item-image';
import { localizedUnits } from '../utils/units';

export function EditItemModal({ item, onClose, onSaved }: { item: Item | null; onClose: () => void; onSaved: () => void }) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState(item?.name ?? ''); const [note, setNote] = useState(item?.note ?? ''); const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const known = UNITS.some((u) => u.value === item?.unit); const [unit, setUnit] = useState(known ? item?.unit ?? 'pza' : 'custom');
  const [customUnit, setCustomUnit] = useState(known ? '' : item?.unit ?? ''); const [recurring, setRecurring] = useState(item?.isRecurring ?? false);
  const [days, setDays] = useState(String(item?.recurrenceDays ?? 14)); const [photo, setPhoto] = useState<string | null>(null); const [clearPhoto, setClearPhoto] = useState(false); const [saving, setSaving] = useState(false);
  const closePhoto = (uri: string | null) => { setPhoto(uri); setClearPhoto(uri === null); };
  const save = async () => {
    if (!item || saving) return; const amount = Number(quantity.replace(',', '.')); const selected = unit === 'custom' ? customUnit.trim() : unit;
    if (!name.trim() || !Number.isFinite(amount) || amount < 0.01 || amount > 99999 || Math.abs(Math.round(amount * 100) - amount * 100) > 1e-7 || (recurring && (!Number.isInteger(Number(days)) || Number(days) < 1 || Number(days) > 365)) || !selected || selected.length > 20) { Alert.alert(t('editItem.invalid')); return; }
    setSaving(true);
    try {
      await itemsApi.update(item.id, { name: name.trim(), note: note.trim() || null, quantity: amount, unit: selected, isRecurring: recurring, ...(recurring ? { recurrenceDays: Number(days) || 14 } : {}) });
      if (photo) await itemsApi.uploadImage(item.id, await itemImageForm(photo));
      else if (clearPhoto && item.imageUrl) await itemsApi.removeImage(item.id);
      onSaved(); onClose();
    } catch (error) { Alert.alert(t('editItem.saveFailed'), (error as Error).message); } finally { setSaving(false); }
  };
  return <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}><View style={styles.scrim}><View style={styles.card}><ScrollView keyboardShouldPersistTaps="handled"><Text style={styles.title}>{t('editItem.title')}</Text>
    <Text style={styles.label}>{t('editItem.name')}</Text><TextInput style={styles.input} accessibilityLabel={t('editItem.name')} testID="edit-item-name" value={name} onChangeText={setName} maxLength={140} />
    <Text style={styles.label}>{t('editItem.note')}</Text><TextInput style={[styles.input, { minHeight: 76 }]} accessibilityLabel={t('editItem.note')} value={note} onChangeText={setNote} multiline maxLength={300} />
    <Text style={styles.label}>{t('editItem.quantity')}</Text><TextInput style={styles.input} accessibilityLabel={t('editItem.quantity')} testID="edit-item-quantity" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
    <Text style={styles.label}>{t('editItem.unit')}</Text><SelectField label={t('editItem.unit')} testID="edit-item-unit" value={unit} onChange={setUnit} options={[...localizedUnits(i18n.language), { label: t('editItem.custom'), value: 'custom' }]} />
    {unit === 'custom' && <TextInput accessibilityLabel={t('editItem.unitName')} style={styles.input} testID="edit-custom-unit" value={customUnit} onChangeText={setCustomUnit} maxLength={20} />}
    <View style={styles.switchRow}><Text style={styles.label}>{t('editItem.repeat')}</Text><Switch value={recurring} onValueChange={setRecurring} trackColor={{ true: colors.brand }} /></View>
    {recurring && <><Text style={styles.label}>{t('editItem.repeatEvery')}</Text><TextInput style={styles.input} accessibilityLabel={t('editItem.repeatEvery')} value={days} onChangeText={setDays} keyboardType="number-pad" /></>}
    <Text style={styles.label}>{t('editItem.image')}</Text><ItemPhotoPicker uri={photo ?? (!clearPhoto && item?.imageUrl ? `${API_URL}${item.imageUrl}` : null)} onChange={closePhoto} />
    <View style={styles.actions}><Button title={t('common.cancel')} variant="ghost" onPress={onClose} disabled={saving} /><Button title={saving ? t('editItem.saving') : t('editItem.save')} onPress={save} disabled={saving} /></View>
  </ScrollView></View></View></Modal>;
}
const styles = StyleSheet.create({ scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0006' }, card: { maxHeight: '92%', backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg }, title: { fontSize: 21, fontWeight: '700', color: colors.ink, marginBottom: spacing.md }, label: { color: colors.ink, fontWeight: '600', marginTop: spacing.sm }, input: { minHeight: 48, borderColor: colors.lineStrong, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.ink }, switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.lg } });
