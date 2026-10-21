// دليل اللاعب يعمل دون اتصال: الصفحة وأيقونتها تُخزَّن وقت التثبيت، ويُطلب الجديد من الشبكة أولاً فتصل التحديثات تلقائياً ثم يُرجَع للذاكرة عند انقطاع الاتصال
const V = 'guide-29c26a3ea4', FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png?v=1', './icon-512.png?v=1', './icon-maskable-512.png?v=1', './apple-touch-icon.png?v=1'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('guide-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const fresh = e.request.mode === 'navigate' || /(\/|index\.html|version\.json)$/.test(u.pathname);
  e.respondWith((fresh ? fetch(e.request.url, { cache: 'no-store' }) : fetch(e.request)).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html'))));
});
