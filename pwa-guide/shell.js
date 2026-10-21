/* غلاف دليل اللاعب (يُحقن في الصفحة عند البناء): تسجيل خدمة التخزين، وشارة التحديث، وفحص النسخة الجديدة عند العودة للتطبيق */
(function () {
  var meta = document.querySelector('meta[name="guide-version"]'), cur = meta ? meta.content : '', KEY = 'darb-guide-seen';
  function bar(txt, btn, fn) {
    var old = document.getElementById('guideBar'); if (old) old.remove();
    var b = document.createElement('div'); b.id = 'guideBar'; b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;inset-inline:10px;top:10px;z-index:9999;background:#304f60;color:#fffdf7;border-radius:14px;padding:10px 14px;display:flex;gap:10px;align-items:center;font:700 14px/1.5 system-ui,Tahoma,sans-serif;box-shadow:0 6px 18px #0004';
    var t = document.createElement('span'); t.textContent = txt; t.style.flex = '1'; b.appendChild(t);
    if (btn) { var x = document.createElement('button'); x.textContent = btn; x.style.cssText = 'background:#b98a43;color:#fff;border:0;border-radius:10px;padding:6px 12px;font:inherit;cursor:pointer'; x.onclick = function () { b.remove(); if (fn) fn(); }; b.appendChild(x); }
    var c = document.createElement('button'); c.textContent = '✕'; c.setAttribute('aria-label', 'إغلاق'); c.style.cssText = 'background:none;color:#fffdf7;border:0;font:inherit;cursor:pointer'; c.onclick = function () { b.remove(); }; b.appendChild(c);
    document.body.appendChild(b);
  }
  try {
    var seen = localStorage.getItem(KEY);
    if (cur) { if (seen && seen !== cur) bar('تم تحديث الدليل. اطّلع على ما الجديد', 'ما الجديد', function () { var w = document.getElementById('whatsnew'); if (w) w.scrollIntoView({ behavior: 'smooth' }); }); localStorage.setItem(KEY, cur); }
  } catch (e) {}
  function check() {
    if (!navigator.onLine) return;
    fetch('version.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && cur && j.v && j.v !== cur) bar('نسخة جديدة من الدليل متاحة', 'حدّث الآن', function () { location.reload(); }); }).catch(function () {});
  }
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').then(function (reg) { try { reg.update(); } catch (e) {} }).catch(function () {}); check(); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  }
})();
