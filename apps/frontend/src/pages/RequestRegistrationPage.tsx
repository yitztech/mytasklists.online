import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthShell } from '../components/AuthShell';
import { SocialButtons } from '../components/SocialButtons';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/endpoints';
export function RequestRegistrationPage() {
  const { t } = useTranslation();
  const {user,loading} = useAuth();
  const invitedEmail = new URLSearchParams(window.location.search).get('email')?.trim().toLowerCase() || '';
  const [email,setEmail] = useState(invitedEmail); const [sent,setSent] = useState(false);
  const [error,setError] = useState(''); const [busy,setBusy] = useState(false); const [seconds,setSeconds] = useState(0);
  useEffect(() => { if (!seconds) return; const timer = setTimeout(()=>setSeconds(seconds-1),1000); return ()=>clearTimeout(timer); },[seconds]);
  if (user && !loading) return <Navigate to="/" replace />;
  async function submit(e: FormEvent) {
    e.preventDefault();setError('');setBusy(true);
    try { const r = await authApi.requestRegistration(email.trim().toLowerCase());setSent(true);setSeconds(r.cooldownSeconds); }
    catch(e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <AuthShell><div data-testid="register-card"><h1>{t('registrationRequest.title')}</h1>
    <p>{invitedEmail ? t('registrationRequest.invited') : t('registrationRequest.intro')}</p>
    <form onSubmit={submit} data-testid="register-form">
      <label className="form-label" htmlFor="register-email">{t('common.email')}</label>
      <input id="register-email" className="form-control mb-3" type="email" required maxLength={180} autoComplete="email" value={email} readOnly={Boolean(invitedEmail)}
        onChange={e=>{setEmail(e.target.value);setSent(false);}} data-testid="register-email" />
      {sent && <p className="alert alert-success" role="status" data-testid="registration-sent">{t('registrationRequest.sent')}</p>}
      {error && <p className="alert alert-danger" role="alert" data-testid="register-error">{error}</p>}
      <button className="btn btn-primary w-100" disabled={busy||seconds>0} data-testid="register-submit">{busy?t('common.sending'):seconds?t('registrationRequest.resendIn',{seconds}):sent?t('registrationRequest.resend'):t('registrationRequest.send')}</button>
    </form>
    <p className="mt-3"><Link to="/login" data-testid="go-login">{t('registrationRequest.signIn')}</Link> · <Link to="/forgot-password">{t('registrationRequest.resetPassword')}</Link></p>
    <div className="lc-divider">{t('common.or')}</div><SocialButtons disabled={busy}/>
  </div></AuthShell>;
}
