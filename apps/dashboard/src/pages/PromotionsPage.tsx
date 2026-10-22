import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
export function PromotionsPage(){
 const {t}=useTranslation();
 const [rows,setRows]=useState<{code:string;active:boolean}[]>([]);const [code,setCode]=useState('');const [kind,setKind]=useState('percent');
 const [value,setValue]=useState('20');const [months,setMonths]=useState('1');const [uses,setUses]=useState('100');const [expires,setExpires]=useState('');
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const load=async()=>{try{setRows(await api.get('/billing/admin/promotions'));}catch(e){setError((e as Error).message);}};
 useEffect(()=>{void load();},[]);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{await api.post('/billing/admin/promotions',{code,months:Number(months),maxUses:Number(uses),...(kind==='percent'?{percent:Number(value)}:{amount:Math.round(Number(value)*100)}),...(expires?{expiresAt:new Date(expires).toISOString()}:{})});setCode('');await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div><h1>{t('promotionsPage.title')}</h1><p>{t('promotionsPage.intro')}</p>
  {error&&<p className="alert alert-danger" role="alert">{error}</p>}
  <form onSubmit={submit} className="row g-3 mb-4">
   <div className="col-md-4"><label htmlFor="campaign-code" className="form-label">{t('promotionsPage.code')}</label><input id="campaign-code" className="form-control" value={code} onChange={e=>setCode(e.target.value)} required pattern="[A-Za-z0-9_-]{1,64}"/></div>
   <div className="col-md-4"><label htmlFor="campaign-type" className="form-label">{t('promotionsPage.type')}</label><select id="campaign-type" className="form-select" value={kind} onChange={e=>setKind(e.target.value)}><option value="percent">%</option><option value="amount">USD</option></select></div>
   <div className="col-md-4"><label htmlFor="campaign-value" className="form-label">{t('promotionsPage.discount')}</label><input id="campaign-value" className="form-control" type="number" min="0.01" max={kind==='percent'?100:5} step={kind==='percent'?1:0.01} value={value} onChange={e=>setValue(e.target.value)} required/></div>
   <div className="col-md-4"><label htmlFor="campaign-months" className="form-label">{t('promotionsPage.months')}</label><input id="campaign-months" className="form-control" type="number" min="1" max="36" value={months} onChange={e=>setMonths(e.target.value)} required/></div>
   <div className="col-md-4"><label htmlFor="campaign-uses" className="form-label">{t('promotionsPage.uses')}</label><input id="campaign-uses" className="form-control" type="number" min="1" max="100000" value={uses} onChange={e=>setUses(e.target.value)} required/></div>
   <div className="col-md-4"><label htmlFor="campaign-expiry" className="form-label">{t('promotionsPage.expiry')}</label><input id="campaign-expiry" className="form-control" type="datetime-local" value={expires} onChange={e=>setExpires(e.target.value)}/></div>
   <div><button className="btn btn-primary" disabled={busy}>{t('promotionsPage.create')}</button></div>
  </form><p>{t('promotionsPage.note')}</p>
  <table className="table"><thead><tr><th>{t('promotionsPage.code')}</th><th>{t('promotionsPage.status')}</th><th>{t('promotionsPage.action')}</th></tr></thead><tbody>{rows.map(r=><tr key={r.code}><td>{r.code}</td><td>{r.active?t('promotionsPage.active'):t('promotionsPage.inactive')}</td><td>{r.active&&<button className="btn btn-outline-danger" disabled={busy} onClick={async()=>{setBusy(true);try{await api.patch(`/billing/admin/promotions/${encodeURIComponent(r.code)}/disable`,{});await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>{t('promotionsPage.disable')}</button>}</td></tr>)}</tbody></table>
 </div>;
}
