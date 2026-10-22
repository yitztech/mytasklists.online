import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { colors, spacing } from '../theme';

export function ItemPhotoPicker({ uri, onChange }: { uri: string | null; onChange: (uri: string | null) => void }) {
  const { t } = useTranslation();
  const pick = async (camera: boolean) => {
    try {
    if (camera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { Alert.alert(t('photo.cameraPermission')); return; }
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { Alert.alert(t('photo.libraryPermission')); return; }
    }
    const result = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.82, allowsEditing: true, exif: false, cameraType: ImagePicker.CameraType.back })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.82, allowsEditing: true, exif: false });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const context = ImageManipulator.manipulate(asset.uri);
      if (Math.max(asset.width, asset.height) > 1600) {
        context.resize(asset.width >= asset.height ? { width: 1600 } : { height: 1600 });
      }
      const rendered = await context.renderAsync();
      const image = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 });
      onChange(image.uri);
    }
    } catch { Alert.alert(t('photo.openFailed'), t('photo.tryAnother')); }
  };
  return <View style={{ gap: spacing.sm }}>
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <Pressable accessibilityRole="button" onPress={() => pick(true)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 8 }}><Text style={{ color: colors.brand, fontWeight: '600' }}>{t('photo.take')}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => pick(false)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 8 }}><Text style={{ color: colors.brand, fontWeight: '600' }}>{t('photo.choose')}</Text></Pressable>
    </View>
    {uri && <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}><Image source={{ uri }} style={{ width: 76, height: 76, borderRadius: 8 }} /><Pressable onPress={() => onChange(null)} accessibilityRole="button"><Text style={{ color: colors.danger, fontWeight: '600' }}>{t('photo.remove')}</Text></Pressable></View>}
  </View>;
}
