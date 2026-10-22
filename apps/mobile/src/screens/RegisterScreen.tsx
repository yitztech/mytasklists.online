import React, { useEffect, useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Field } from '../components/ui';
import { authApi, compatApi } from '../api/endpoints';
import { PrivacyLink, TermsLink } from '../components/PrivacyLink';
import { colors, spacing } from '../theme';
export function RegisterScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [email,setEmail]=useState('');const [sent,setSent]=useState(false);const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');const [seconds,setSeconds]=useState(0);
  useEffect(()=>{if(!seconds)return;const timer=setTimeout(()=>setSeconds(seconds-1),1000);return ()=>clearTimeout(timer);},[seconds]);
  async function submit(){setBusy(true);setError('');try{const compatibility=await compatApi.check();if((compatibility.registrationFlow||0)<2)throw new Error(t('registrationRequest.unavailable'));const r=await authApi.requestRegistration(email.trim().toLowerCase());setSent(true);setSeconds(r.cooldownSeconds);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <ScrollView contentContainerStyle={{padding:spacing.xl,flexGrow:1,justifyContent:'center'}} testID="register-screen">
    <Text style={{fontSize:28,fontWeight:'800',color:colors.ink}}>{t('registrationRequest.title')}</Text>
    <Text style={{color:colors.inkSoft,marginVertical:spacing.lg}}>{t('registrationRequest.intro')}</Text>
    <Field label={t('common.email')} value={email} onChangeText={v=>{setEmail(v);setSent(false);}} keyboardType="email-address" autoCapitalize="none" testID="register-email"/>
    {sent && <Text accessibilityLiveRegion="polite" testID="registration-sent" style={{color:colors.ink,marginBottom:spacing.lg}}>{t('registrationRequest.sent')}</Text>}
    {error && <Text accessibilityRole="alert" style={{color:colors.danger,marginBottom:spacing.md}} testID="register-error">{error}</Text>}
    <Button title={seconds?t('registrationRequest.resendIn',{seconds}):t('registrationRequest.send')} onPress={submit} disabled={seconds>0||!email.trim()} loading={busy} testID="register-submit"/>
    <Pressable onPress={()=>navigation.goBack()} testID="go-login"><Text style={{color:colors.brand,padding:spacing.lg,textAlign:'center'}}>{t('registrationRequest.signIn')}</Text></Pressable>
    <PrivacyLink/><TermsLink/>
  </ScrollView>;
}
