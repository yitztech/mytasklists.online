import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CATALOGS } from './translations.mjs';
const SRC = new URL('./src/', import.meta.url).pathname;
const OUT = new URL('./dist/', import.meta.url).pathname;
const origin = (process.env.LANDING_PUBLIC_URL || 'https://mytasklists.online').replace(/\/$/,'');
if (!/^https?:\/\//.test(origin)) throw new Error('LANDING_PUBLIC_URL must be absolute');
const app = (process.env.LANDING_APP_URL || '/app/').replace(/\/?$/,'/');
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** Rutas públicas de cada idioma. Las páginas legales solo existen en es/en; el resto enlaza la inglesa. */
const ROUTES = {
  es: { home: '/', pricing: '/precios/', download: '/descargar/', privacy: '/privacidad', terms: '/terminos', og: 'es_MX' },
  en: { home: '/en/', pricing: '/en/pricing/', download: '/en/download/', privacy: '/privacy', terms: '/terms', og: 'en_US' },
  pt: { home: '/pt/', pricing: '/pt/precos/', download: '/pt/baixar/', privacy: '/privacy', terms: '/terms', og: 'pt_BR' },
  de: { home: '/de/', pricing: '/de/preise/', download: '/de/download/', privacy: '/privacy', terms: '/terms', og: 'de_DE' },
  fr: { home: '/fr/', pricing: '/fr/tarifs/', download: '/fr/telecharger/', privacy: '/privacy', terms: '/terms', og: 'fr_FR' },
};
// Mismo orden que SUPPORTED_LOCALES en packages/contracts; la imagen Docker no incluye ese paquete.
const LOCALES = Object.keys(ROUTES);

const replace = (s,locale='es') => {
  const route = ROUTES[locale];
  const values = {__APP_URL__:app,__LOGIN_URL__:app+'login',__DOWNLOAD_URL__:route.download,__PRICING_URL__:route.pricing,__PRIVACY_URL__:route.privacy,__TERMS_URL__:route.terms,__YEAR__:String(new Date().getFullYear()),__LEGAL_NAME__:process.env.LANDING_LEGAL_NAME||'MyTaskListsOnline',__LEGAL_ADDRESS__:process.env.LANDING_LEGAL_ADDRESS||'',__PRIVACY_EMAIL__:process.env.LANDING_PRIVACY_EMAIL||'privacidad@mytasklists.online'};
  for(const [key,value] of Object.entries(values)) s=s.replaceAll(key,escape(value));
  return s.replace(/(href|src)="\.\//g,'$1="/');
};

/** Selector con un enlace por idioma hacia la misma página */
const languageLinks = (locale,page) => LOCALES.map(code=>{
  const current = code===locale&&'aria-current="page"';
  return `<a href="${ROUTES[code][page]}" data-lang="${code}" data-testid="language-${code}" lang="${code}" hreflang="${code}" ${current||''}>${code.toUpperCase()}</a>`;
}).join('');

/** alternates: idioma → ruta de la misma página en ese idioma */
const seo = (html,locale,alternates,title,description) => {
  const t = CATALOGS[locale];
  const path = alternates[locale];
  html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${escape(title)}</title>`).replace(/<meta\s+name="description"[\s\S]*?\/>/,`<meta name="description" content="${escape(description)}" />`);
  html=html.replace(/<meta\s+property="og:[\s\S]*?\/>/g,'').replace(/<html lang="[a-z]+">/,`<html lang="${locale}">`);
  if(process.env.LANDING_NOINDEX==='true')html=html.replace('</head>','<meta name="robots" content="noindex, nofollow"/></head>');
  const canonical=origin+path;
  const schema={'@context':'https://schema.org','@type':'SoftwareApplication',name:'MyTaskLists',applicationCategory:'ProductivityApplication',operatingSystem:'Web, Android, iOS',url:canonical,description};
  const links=Object.entries(alternates).map(([code,href])=>`<link rel="alternate" hreflang="${code}" href="${origin+href}" />`).join('\n');
  return html.replace('</head>',`<link rel="canonical" href="${canonical}" />
${links}
<link rel="alternate" hreflang="x-default" href="${origin+alternates.es}" />
<meta property="og:title" content="${escape(title)}"/><meta property="og:description" content="${escape(description)}"/>
<meta property="og:type" content="website"/><meta property="og:url" content="${canonical}"/><meta property="og:locale" content="${ROUTES[locale].og}"/>
<meta property="og:image" content="${origin}/social.png"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="${escape(t['seo.socialAlt'])}"/>
<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${escape(title)}"/><meta name="twitter:description" content="${escape(description)}"/><meta name="twitter:image" content="${origin}/social.png"/>
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>
</head>`);
};

/** Textos del catálogo en elementos con data-i18n (contenido) y data-i18n-aria (aria-label) */
const translate = (html,locale) => {
  const t = CATALOGS[locale];
  html=html.replace(/(<([a-z0-9]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/gi,(_,start,tag,key,content,end)=>start+(t[key]??content)+end);
  return html.replace(/aria-label="[^"]*"(?=\s+data-i18n-aria="([^"]+)")/g,(_,key)=>'aria-label="'+escape(t[key])+'"');
};

const shell=(locale,page,title,body,script='')=>{
  const t = CATALOGS[locale];
  const route = ROUTES[locale];
  // Bloque de datos, no ejecutable: la CSP solo permite scripts propios.
  const copy = script ? `<script type="application/json" id="landing-copy">${JSON.stringify(Object.fromEntries(Object.entries(t).filter(([key])=>key.startsWith('download.')))).replace(/</g,'\\u003c')}</script>` : '';
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title><meta name="description" content="${title}"/><link rel="icon" href="/favicon.svg"/><link rel="stylesheet" href="/styles.css"/></head><body>
<header class="nav commerce-nav"><div class="wrap"><a class="brand" href="${route.home}">MyTaskLists</a><nav class="nav-links" aria-label="${escape(t['nav.main'])}"><a href="${route.pricing}">${t['nav.pricing']}</a><a href="${route.download}">${t['nav.download']}</a><a class="btn btn-ghost" href="__LOGIN_URL__">${t['commerce.signIn']}</a><div class="lang" role="group" aria-label="${escape(t['language.label'])}" data-testid="language-switcher">${languageLinks(locale,page)}</div></nav></div></header>
<main class="wrap commerce"><h1>${title}</h1>${body}</main><footer><div class="wrap"><span>© __YEAR__ MyTaskLists</span><a href="${route.privacy}">${t['footer.privacy']}</a><a href="${route.terms}">${t['footer.terms']}</a></div></footer>${copy}${script?`<script src="/${script}"></script>`:''}<script src="/i18n.js"></script></body></html>`;
};

const alternatesOf = page => Object.fromEntries(LOCALES.map(code=>[code,ROUTES[code][page]]));
const write = async (path,html) => {
  const dir = join(OUT,path);
  await mkdir(dir,{recursive:true});
  await writeFile(join(dir,'index.html'),html);
};

await rm(OUT,{recursive:true,force:true});await mkdir(OUT,{recursive:true});await cp(SRC,OUT,{recursive:true});
for(const entry of await readdir(OUT,{withFileTypes:true})) if(entry.isFile()&&/\.(html|css|js)$/.test(entry.name)) await writeFile(join(OUT,entry.name),replace(await readFile(join(OUT,entry.name),'utf8')));
const landing=await readFile(join(SRC,'index.html'),'utf8');
for(const locale of LOCALES) {
  const t = CATALOGS[locale];
  const home=translate(landing.replace('__LANGUAGE_LINKS__',languageLinks(locale,'home')),locale);
  await write(ROUTES[locale].home,seo(replace(home,locale),locale,alternatesOf('home'),t['seo.homeTitle'],t['seo.homeDescription']));
  const pricing=shell(locale,'pricing',t['pricing.title'],`<p class="lede">${t['pricing.lede']}</p><div class="price-grid"><section><h2>${t['pricing.free']}</h2><p class="price">0 <span>USD</span></p><p>${t['pricing.freeText']}</p><a class="btn btn-ghost" href="${app}register">${t['pricing.createFree']}</a></section><section><h2>Premium</h2><p class="price">5 <span>USD / ${t['pricing.month']}</span></p><p>${t['pricing.premiumText']}</p><p id="premium-benefits"></p><a class="btn btn-primary" href="${app}billing" data-testid="choose-premium">${t['pricing.viewSubscription']}</a></section></div><h2>${t['pricing.beforeTitle']}</h2><p>${t['pricing.beforeText']}</p>`,'pricing.js');
  await write(ROUTES[locale].pricing,seo(replace(pricing,locale),locale,alternatesOf('pricing'),t['pricing.seoTitle'],t['pricing.seoDescription']));
  const download=shell(locale,'download',t['download.title'],`<p class="lede">${t['download.lede']}</p><section id="android" class="download-section"><h2>Android</h2><p id="android-status" role="status">${t['download.checking']}</p><div id="android-actions"></div><p id="apk-info"></p><details><summary>${t['download.apkHowTitle']}</summary><p>${t['download.apkHowText']}</p></details></section><section id="ios" class="download-section"><h2>iPhone / iPad</h2><p>${t['download.iosText']}</p><a class="btn btn-primary" href="__APP_URL__">${t['download.openWeb']}</a><div id="ios-actions"></div><p>${t['download.iosBeta']}</p></section><section class="download-section"><h2>${t['download.browserTitle']}</h2><a class="btn btn-ghost" href="__LOGIN_URL__">${t['commerce.signIn']}</a></section>`,'downloads.js');
  await write(ROUTES[locale].download,seo(replace(download,locale),locale,alternatesOf('download'),t['download.seoTitle'],t['download.seoDescription']));
}
const legal=[['privacidad','privacy'],['terminos','terms']];
for(const [es,en] of legal) for(const name of [es,en]) {
  const locale=name===en?'en':'es';const path=join(OUT,name+'.html');const html=await readFile(path,'utf8');const title=html.match(/<title>(.*?)<\/title>/)?.[1]||'MyTaskLists';
  await writeFile(path,seo(html,locale,{es:'/'+es,en:'/'+en},title,CATALOGS[locale]['seo.legalDescription']));
}
const urls=[...new Set(LOCALES.flatMap(code=>[ROUTES[code].home,ROUTES[code].pricing,ROUTES[code].download])),'/privacidad','/privacy','/terminos','/terms'];
await writeFile(join(OUT,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(path=>`<url><loc>${escape(origin+path)}</loc></url>`).join('')}</urlset>`);
await writeFile(join(OUT,'robots.txt'),process.env.LANDING_NOINDEX==='true'?'User-agent: *\nDisallow: /\n':`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`[landing] ${LOCALES.join('/').toUpperCase()}, pricing, downloads and SEO generated`);
