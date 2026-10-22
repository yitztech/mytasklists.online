(async()=>{
 const copy=JSON.parse(document.querySelector('#landing-copy')?.textContent||'{}');
 const t=key=>copy['download.'+key]??key;
 const action=(parent,text,url)=>{const a=document.createElement('a');a.className='btn btn-ghost';a.textContent=text;a.href=url;parent.append(a);};
 try{
  const response=await fetch('/api/distribution');if(!response.ok)throw new Error();const data=await response.json();
  const parent=document.querySelector('#android-actions');const status=document.querySelector('#android-status');
  status.textContent=data.android.apk?t('apkAvailable'):t('apkUnavailable');
  if(data.android.storeUrl)action(parent,t('googlePlay'),data.android.storeUrl);
  if(data.android.apk){action(parent,t('downloadApk'),data.android.apk.url);document.querySelector('#apk-info').textContent=`v${data.android.apk.version} · ${(data.android.apk.size/1048576).toFixed(1)} MB · SHA-256: ${data.android.apk.sha256||''}`;}
  action(parent,t('useWeb'),'/app/');
  if(data.ios.storeUrl)action(document.querySelector('#ios-actions'),t('appStore'),data.ios.storeUrl);
  if(data.ios.testflightUrl)action(document.querySelector('#ios-actions'),t('testflight'),data.ios.testflightUrl);
 }catch{document.querySelector('#android-status').textContent=t('checkFailed');action(document.querySelector('#android-actions'),t('useWeb'),'/app/');}
})();
