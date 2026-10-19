// يعمل دون اتصال: من الشبكة أولاً (لتصلك التحديثات) ثم من الذاكرة. لا نخزّن الصفحة الضخمة وقت التثبيت كي لا يفشل على الشبكات الضعيفة.
const V = 'darb-1730aa7f19', FILES = ['./manifest.webmanifest', './icon-192.png?v=14', './icon-512.png?v=14', './icon-maskable-512.png?v=14', './apple-touch-icon.png?v=14'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // الصفحة وإصدارها تُطلَب من الشبكة متجاوزةً ذاكرة المتصفح المؤقتة (استضافة الصفحات تحفظها دقائق)، فيصلك التحديث فور نشره
  const fresh = e.request.mode === 'navigate' || /(\/|index\.html|version\.json)$/.test(u.pathname);
  e.respondWith((fresh ? fetch(e.request.url, { cache: 'no-store' }) : fetch(e.request)).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request).then(m => m || caches.match('./'))));
});
