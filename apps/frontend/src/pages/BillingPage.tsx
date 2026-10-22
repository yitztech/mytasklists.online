import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { BillingPlans, BillingState, PromotionQuote } from '@lista/contracts';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { billingApi } from '../api/endpoints';
import { currentLanguage, LOCALE_TAGS } from '../i18n';
export function BillingPage(){
 const {user}=useAuth();const {t}=useTranslation();
 const [plans,setPlans]=useState<BillingPlans|null>(null);const [state,setState]=useState<BillingState|null>(null);
 const [code,setCode]=useState('');const [quote,setQuote]=useState<PromotionQuote|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const load=useCallback(async()=>{try{setPlans(await billingApi.plans());if(user)setState(await billingApi.me());}catch(e){setError((e as Error).message);}},[user]);
 useEffect(()=>{sessionStorage.setItem('lc.plan','premium');void load();},[load]);
 useEffect(()=>{if(!user||!location.search.includes('checkout=returned'))return;let count=0;const timer=setInterval(()=>{void load();if(++count>=15)clearInterval(timer);},2000);return ()=>clearInterval(timer);},[user,load]);
 async function apply(){setBusy(true);setError('');try{setQuote(await billingApi.promotion(code.trim()));}catch(e){setQuote(null);setError((e as Error).message);}finally{setBusy(false);}}
 async function pay(){setBusy(true);setError('');try{const r=await billingApi.checkout({...(quote?{code:quote.code}:{}),expectedTotal:quote?.total??500});window.location.assign(r.url);}catch(e){setQuote(null);setError((e as Error).message);setBusy(false);}}
 async function manage(){setBusy(true);setError('');try{window.location.assign((await billingApi.portal()).url);}catch(e){setError((e as Error).message);setBusy(false);}}
 const language=currentLanguage();
 const money=(n:number)=>new Intl.NumberFormat(LOCALE_TAGS[language],{style:'currency',currency:'USD'}).format(n/100);
 const date=(value:string)=>new Date(value).toLocaleDateString(LOCALE_TAGS[language]);
 return <AuthShell><div data-testid="billing-page"><h1>{t('billing.title')}</h1>
  {error&&<p className="alert alert-danger" role="alert">{error}</p>}
  {!plans?<p role="status">{t('billing.loading')}</p>:<>
   <p className="fs-4 fw-bold">{state?.plan==='premium'?'Premium':t('billing.free')}</p>
   {state?.subscription&&<p>{t('billing.subscription')}: {state.subscription.provider} · {state.subscription.status}<br/>{state.subscription.period_end&&t('billing.periodEnds',{date:date(state.subscription.period_end)})}</p>}
   {state?.plan==='premium'?<>
     {state.subscription?.provider==='stripe'?<button className="btn btn-primary" onClick={manage} disabled={busy}>{t('billing.manageCancel')}</button>:<a className="btn btn-primary" href={state.subscription?.provider==='apple'?'https://apps.apple.com/account/subscriptions':'https://play.google.com/store/account/subscriptions'}>{t('billing.manageStore')}</a>}
   </>:<>
    <h2>Premium · 5 USD / {t('billing.month')}</h2><p>{plans.benefits[language]}</p>
    {!user?<p>{t('billing.verifyAccount')} <Link to="/register">{t('billing.createAccount')}</Link> · <Link to="/login">{t('billing.signIn')}</Link></p>:plans.enabled?<>
      <label className="form-label" htmlFor="promo-code">{t('billing.promoOptional')}</label>
      <div className="d-flex gap-2 mb-3"><input id="promo-code" className="form-control" value={code} maxLength={64} onChange={e=>{setCode(e.target.value);setQuote(null);}} data-testid="promo-code"/><button className="btn btn-outline-secondary" disabled={busy||!code.trim()} onClick={apply}>{t('billing.apply')}</button></div>
      {quote&&<p role="status">{t('billing.discount')}: {money(quote.discount)} · {quote.duration==='once'?t('billing.firstInvoice'):quote.duration==='repeating'?t('billing.months',{count:quote.months??0}):t('billing.everyRenewal')} <button className="btn btn-link" onClick={()=>{setQuote(null);setCode('');}}>{t('billing.remove')}</button></p>}
      <p className="fs-5 fw-bold">{t('billing.subtotalToday')}: {money(quote?.total??500)} USD</p>
      <p>{t('billing.taxes')}</p>
      <button className="btn btn-primary w-100" onClick={pay} disabled={busy||!!code.trim()&&!quote} data-testid="billing-checkout">{busy?t('billing.processing'):t('billing.continuePayment')}</button>
    </>:<p role="status" className="alert alert-info">{t('billing.comingSoon')}</p>}
   </>}
   <p className="mt-4"><Link to="/" onClick={()=>sessionStorage.removeItem('lc.plan')}>{t('billing.returnLists')}</Link> · <a href={t('billing.pricingPath')}>{t('billing.comparePlans')}</a></p>
  </>}
 </div></AuthShell>;
}
