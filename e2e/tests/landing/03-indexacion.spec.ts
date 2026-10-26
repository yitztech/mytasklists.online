import {expect,test} from '@playwright/test';

// AGENTS.md §9.2 (WEB-06 a WEB-09): cada URL es pública, privada (X-Robots-Tag), inexistente (404) o movida (301).
test('WEB-07 · robots.txt sin Disallow; API y panel con noindex en la cabecera',async({request})=>{
 const r=await request.get('/robots.txt');expect(r.headers()['content-type']).toMatch(/^text\/plain/);expect(await r.text()).not.toMatch(/^Disallow:\s*\S/m);
 for(const path of ['/api/health','/dashboard/','/app/'])expect((await request.get(path)).headers()['x-robots-tag'],path).toMatch(/noindex/);
});
for(const [from,to] of [['/precios','/precios/'],['/en','/en/'],['/precios/index.html','/precios/'],['/privacidad.html','/privacidad'],['/index.html','/']])test(`WEB-09 · ${from} redirige con 301 relativo a ${to}`,async({request})=>{
 const r=await request.get(from,{maxRedirects:0});expect(r.status()).toBe(301);const location=r.headers().location??'';expect(location.startsWith('http://')).toBe(false);expect(new URL(location,'https://x').pathname).toBe(to);
});
test('WEB-08 · cada URL del sitemap responde 200 sin noindex y con su canonical',async({request})=>{
 const locs=[...(await (await request.get('/sitemap.xml')).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);expect(locs.length).toBeGreaterThan(0);
 for(const loc of locs){const {pathname}=new URL(loc);const r=await request.get(pathname,{maxRedirects:0});expect(r.status(),loc).toBe(200);expect(r.headers()['x-robots-tag']??'',loc).not.toMatch(/noindex/);const html=await r.text();expect(html,loc).not.toMatch(/name="robots" content="noindex/);expect(new URL(html.match(/rel="canonical" href="([^"]*)"/)?.[1]??'').pathname,loc).toBe(pathname);}
});
