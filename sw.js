// يعمل دون اتصال: من الشبكة أولاً (لتصلك التحديثات) ثم من الذاكرة. لا نخزّن الصفحة الضخمة وقت التثبيت كي لا يفشل على الشبكات الضعيفة.
const V = 'darb-a2c662b03f', IMG = 'darb-img', FILES = ['./manifest.webmanifest', './icon-192.png?v=14', './icon-512.png?v=14', './icon-maskable-512.png?v=14', './apple-touch-icon.png?v=14'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).catch(() => {}).then(() => self.skipWaiting())); });
// أول زيارة دون اتصال: بعد التفعيل تُجلب الصفحة (./) وتُخزَّن في ذاكرة هذا الإصدار، فتعمل اللعبة دون اتصال من الفتحة الأولى. فشل الجلب لا يمنع التفعيل.
const PAGE = () => new Request(new URL('./', self.registration.scope).href);
const cachePage = () => caches.open(V).then(c => c.match(PAGE()).then(m => m || fetch(PAGE().url, { cache: 'no-store' }).then(r => { if (r.ok) return c.put(PAGE(), r); }))).catch(() => {});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== IMG).map(k => caches.delete(k)))).then(() => self.clients.claim()).then(cachePage)); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // إصدار النسخة يُطلَب دائماً من الشبكة بلا ذاكرة مؤقتة ليظهر زر التحديث
  if (/version\.json$/.test(u.pathname)) return e.respondWith(fetch(e.request.url, { cache: 'no-store' }).catch(() => new Response('{}', { headers: { 'content-type': 'application/json' } })));
  // الرسومات المفصولة (brand/img وimg، وروابطها تحمل ?v=بصمة المحتوى): ذاكرة دائمة لا تُمسح مع كل تحديث للعبة، فلا يُعاد تنزيل ما لم يتغيّر
  if (/\/(brand\/img|img)\//.test(u.pathname) && u.search.indexOf('v=') >= 0) return e.respondWith(caches.open(IMG).then(c => c.match(e.request).then(m => m || fetch(e.request).then(r => { if (r.ok) return c.put(e.request, r.clone()).then(() => r, () => r); return r; }))));
  // الصفحة الضخمة (نحو ١٤ ميغابايت): من الذاكرة فوراً عند الفتح، وتُجلب من الشبكة مرة واحدة فقط (أول مرة أو بعد التحديث)، فلا تُنزَّل في كل فتحة
  const page = e.request.mode === 'navigate' || /(\/|index\.html)$/.test(u.pathname), key = page ? new Request(new URL('./', self.registration.scope).href) : e.request;
  e.respondWith(caches.match(key).then(m => m || fetch(page ? key.url : e.request, page ? { cache: 'no-store' } : undefined).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(key, cp)); } return r; })).catch(() => caches.match(key).then(m => m || Response.error())));
});
