/* ---------- حفظ / بدء ---------- */
let saveWarned = false, saveT = null;
let savePause = false, apNoSave = false;
function persist() { try { if (!savePause && !apNoSave && S && S.player) { localStorage.setItem(KEY, E.save(S)); try { localStorage.removeItem(PRE_MIG); } catch (e2) {} backupSnapshot(); } } catch (e) { if (!saveWarned) { saveWarned = true; try { toast('تعذّر حفظ تقدّمك على هذا الجهاز'); } catch (e2) {} } } }
/* حفظ تعذّر قراءته: لا نكتب فوقه. النص الأصلي يُنسخ إلى darb-lost-* (آخر نسختين)، والحفظ موقوف، وتبدأ لعبة مؤقتة في الذاكرة خلف بطاقة تعرض الاستعادة */
const PRE_MIG = 'darb-save-pre-migrate', LOST_PRE = 'darb-lost-';
let lostOn = false, lostKept = false, lostAsk = false, lostNote = '';
function saveBeforeMigrate(raw) { try { localStorage.setItem(PRE_MIG, raw); } catch (e) {} } /* يُمسح بنجاح أول حفظ تالٍ في persist */
function lostSave(raw, why) {
  lostOn = true; savePause = true; lostKept = false; lostAsk = false; lostNote = '';
  try {
    const d = new Date(), z = n => String(n).padStart(2, '0'), k = LOST_PRE + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes()) + z(d.getSeconds());
    localStorage.setItem(k, raw); lostKept = true;
    const all = []; for (let i = 0; i < localStorage.length; i++) { const n = localStorage.key(i); if (n && n.startsWith(LOST_PRE)) all.push(n); }
    all.sort().slice(0, -2).forEach(n => { try { localStorage.removeItem(n); } catch (e) {} });
  } catch (e) {}
  lostRender(raw);
}
function lostCardEl() {
  let el = $('lostSave'); if (el) return el;
  el = document.createElement('div'); el.id = 'lostSave'; el.className = 'lostsave'; el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'lostTitle');
  document.body.appendChild(el); return el;
}
function lostRender(raw) {
  const el = lostCardEl(), n = (typeof backupList === 'function' ? backupList() : []).length;
  el.innerHTML = '<div class="lostbox"><h2 id="lostTitle">تعذّر قراءة تقدّمك المحفوظ</h2>'
    + '<p>لم نمسح شيئاً، والحفظ موقوف حتى تختار. ' + (lostKept ? 'حفظنا نسخة من الملف الأصلي على جهازك.' : '<b>تنبيه: لم نستطع حفظ نسخة من الملف الأصلي (المساحة ممتلئة).</b>') + '</p>'
    + (n ? '<button class="pri" type="button" data-lost="restore">استعد آخر نسخة احتياطية</button>' : '<p class="small">لا توجد نسخ احتياطية على هذا الجهاز.</p>' + (raw && typeof SaveCode !== 'undefined' ? '<button type="button" data-lost="code">انسخ رمز النقل</button>' : ''))
    + '<p class="small">إن كنت فتحت نسخة أقدم من اللعبة فحدّث الصفحة.</p>'
    + '<div class="lostnote small" role="status">' + esc(lostNote) + '</div>'
    + '<button type="button" data-lost="new">' + (lostAsk ? 'نعم، ابدأ لعبة جديدة الآن' : 'ابدأ لعبة جديدة') + '</button>'
    + (lostAsk ? '<p class="small bad">' + (lostKept ? 'ستُكتب لعبة جديدة مكان الحفظ الحالي، ونسختك الأصلية تبقى في darb-lost.' : 'نسختك الأصلية لم تُحفظ؛ ستضيع نهائياً.') + '</p>' : '')
    + '</div>';
  el.onclick = ev => {
    const b = ev.target.closest('[data-lost]'); if (!b) return; const a = b.dataset.lost;
    if (a === 'restore') backupOpen();
    else if (a === 'code') { try { const r = SaveCode.encode(raw); if (r.ok) { lostNote = r.code; try { navigator.clipboard.writeText(r.code); } catch (e) {} } else lostNote = 'تعذّر إنشاء الرمز: ' + r.msg; } catch (e) { lostNote = 'تعذّر إنشاء الرمز من هذا الملف.'; } lostRender(raw); }
    else if (a === 'new') { if (!lostAsk) { lostAsk = true; return lostRender(raw); } lostClear(); persist(); toast('بدأت لعبة جديدة'); }
  };
  const f = el.querySelector('.pri') || el.querySelector('button'); try { f.focus({ preventScroll: true }); } catch (e) {}
}
function lostClear() { lostOn = false; savePause = false; const el = $('lostSave'); if (el) el.remove(); }
/* حفظ بعد كل فعل بتأخير قصير: على الجوال لا يُطلَق beforeunload عند قتل التطبيق */
function persistSoon() { clearTimeout(saveT); saveT = setTimeout(persist, 300); }
function splash() {
  const el = $('splash'); if (!el) return;
  const header = $('hName'); if (header && ART['brand/wordmark']) header.innerHTML = `<img class="brand-wordmark" src="${ART['brand/wordmark']}" alt="درب التجّار">`;
  if (navigator.webdriver && !PLAYER && !/[?&]cover=1/.test(location.search)) { el.remove(); return; }
  coverOn = true; el.removeAttribute('aria-hidden');
  const port = innerHeight > innerWidth, bg = (port ? ART['brand/splash'] : ART['brand/cover']) || ART['brand/cover'] || ART['brand/splash'] || ART['scene/caravan'];
  if (bg) { el.style.backgroundImage = `url(${bg})`; el.classList.add(port && ART['brand/splash'] ? 'p' : 'l'); }
  el.classList.add('cover');
  el.innerHTML = `<div class="brand-loading">${ART['brand/wordmark'] ? `<img class="brand-wordmark" src="${ART['brand/wordmark']}" alt="درب التجّار">` : '<h1>درب التجّار</h1>'}<div class="bism" lang="ar">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div></div><button id="coverGo" class="pri big" type="button">ابدأ الرحلة</button>`;
  const go = $('coverGo'); go.onclick = () => { coverOn = false; try { if (S && S.learn && S.learn.char && (S.day > 0 || S.player.trips > 0) && S.learn.rq) S.learn.rq.push('back'); } catch (e) {} el.classList.add('out'); setTimeout(() => el.remove(), 700); if (S) renderAll(true); };
  setTimeout(() => { try { go.focus({ preventScroll: true }); } catch (e) {} }, 300);
}
const storyGate = () => !(!navigator.webdriver || PLAYER || /[?&]cover=1/.test(location.search));
let coverOn = false, storyGo = storyGate(); // الحكاية أولاً: لا عمّ سالم قبل الضغط على «ابدأ الرحلة» في مربع الحكاية
const coverLabel = () => { const b = $('coverGo'); if (b && S && S.learn) b.textContent = S.learn.char ? 'تابع الرحلة' : 'ادخل اللعبة'; };
/* التحديث: يقارن معرّف النسخة المحفوظ في الصفحة بـversion.json على الخادم (بلا ذاكرة مؤقتة) ويعرض زر تحديث */
const BUILD_ID = '__BUILD__'; let updShown = false;
function showUpdate() {
  if (updShown) return; updShown = true;
  const reload = () => { persist(); const done = () => location.reload(); try { navigator.serviceWorker.getRegistration().then(r => { if (!r) return; // ننتظر تفعيل ملف العمل الجديد (ذاكرته فارغة فيجلب الصفحة الجديدة) قبل إعادة التحميل
    return r.update().then(() => new Promise(res => { const w = r.installing || r.waiting; if (!w || w.state === 'activated') return res(); w.addEventListener('statechange', () => { if (w.state === 'activated') res(); }); setTimeout(res, 5000); })); }).then(done, done); } catch (e) { done(); } };
  if (coverOn) return reload(); // لم يبدأ اللاعب بعد: نحدّث دون سؤال
  const el = document.createElement('div'); el.id = 'upd'; el.setAttribute('role', 'status');
  el.innerHTML = '<span>توجد نسخة جديدة من اللعبة</span><button class="pri sm" type="button">حدّث الآن</button><button class="sm" type="button" aria-label="لاحقاً">لاحقاً</button>';
  el.querySelector('.pri').onclick = reload; el.querySelectorAll('button')[1].onclick = () => { el.remove(); setTimeout(() => { updShown = false; }, 600000); };
  document.body.appendChild(el);
}
async function checkUpdate() {
  if (updShown || !/^https?:$/.test(location.protocol)) return;
  try { const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); const j = await r.json(); if (j && j.id && j.id !== BUILD_ID) showUpdate(); } catch (e) {}
}
setTimeout(checkUpdate, 1500); setInterval(checkUpdate, 300000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate(); });
/* الرسومات الجديدة تحت img/ لا تُسخَّن: تُطلب عند ظهورها فقط. تسخين الرسومات الأساسية القديمة في الخلفية (بعد أن يعمل ملف العمل) ليكتمل العمل دون اتصال: تُجلب بهدوء ثلاثاً ثلاثاً فيحفظها الجهاز، ولا تُجلب إن طلب المستخدم توفير البيانات */
function warmArt() {
  try {
    if (!/^https?:$/.test(location.protocol) || !navigator.serviceWorker || (navigator.connection && navigator.connection.saveData)) return;
    const urls = Object.values(ART).filter(u => typeof u === 'string' && u.startsWith('brand/img/')); let i = 0;
    const next = () => { if (i >= urls.length) return; const u = urls[i++]; fetch(u).catch(() => {}).then(() => setTimeout(next, 40)); };
    for (let k = 0; k < 3; k++) next();
  } catch (e) {}
}
setTimeout(() => { try { navigator.serviceWorker.ready.then(() => setTimeout(warmArt, 3000)); } catch (e) {} }, 6000);
let instEvt = null, installed = false, instNote = '';
try { window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); instEvt = e; if (S) renderAll(true); }); window.addEventListener('appinstalled', () => { installed = true; instEvt = null; if (S) renderAll(true); }); } catch (e) {}
const standalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
function installDiag() {
  const ua = navigator.userAgent, inApp = /FBAN|FBAV|Instagram|Line\/|Snapchat|TikTok|Twitter|WhatsApp|Telegram|MiuiBrowser|; wv\)|GSA\//i.test(ua);
  const ios = /iPhone|iPad|iPod/i.test(ua), chrome = /Chrome\//.test(ua) && !/EdgA|OPR|SamsungBrowser|Firefox/.test(ua);
  const out = [];
  if (inApp) out.push('تفتح اللعبة داخل متصفح تطبيق آخر (واتساب أو غيره). انسخ الرابط وافتحه في كروم مباشرة.');
  if (!window.isSecureContext) out.push('الصفحة غير آمنة (يلزم https).');
  if (!('serviceWorker' in navigator)) out.push('المتصفح لا يدعم ملفات العمل.');
  if (ios) out.push('على الآيفون: افتح الرابط في سفاري، اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».');
  else if (!chrome && !inApp) out.push('يُفضَّل كروم للتثبيت. في المتصفحات الأخرى: القائمة ← «إضافة إلى الشاشة الرئيسية».');
  else if (!inApp) out.push('في كروم: اضغط ⋮ ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». إن لم يظهر الخيار فجرّب إعادة تحميل الصفحة بعد دقيقة من اللعب.');
  return out;
}
function installCard() {
  if (installed || standalone() || !/^https?:$/.test(location.protocol)) return '';
  return `<div class="card" style="margin-top:12px"><div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center"><span>📲 <b>ثبّت اللعبة على جهازك</b> لتفتح كتطبيق بملء الشاشة</span><button class="btn" data-act="install">${instEvt ? 'ثبّت التطبيق' : 'كيف أثبّتها؟'}</button></div>${instNote ? `<div class="guide" style="margin-top:8px">${instNote}</div>` : ''}</div>`;
}
async function doInstall() {
  if (instEvt) { try { instEvt.prompt(); const r = await instEvt.userChoice; instEvt = null; instNote = r && r.outcome === 'accepted' ? 'تم! ستجد اللعبة على شاشتك الرئيسية.' : 'ألغيت التثبيت. يمكنك المحاولة لاحقاً.'; } catch (e) { instNote = installDiag().join('<br>'); } }
  else instNote = installDiag().join('<br>');
  renderAll(true);
}

// لا تسجّل علامة جديدة قبل استهلاك القديمة عند العودة.
function pauseForAway() { if (!S || !S.captainAuto || idleEnabled() && manualTimePause) return; clearTimeout(timer); speed = 0; E.awayStart(S); persist(); }
window.addEventListener('pagehide', pauseForAway);
document.addEventListener('visibilitychange', () => {
  if (!S) return;
  if (document.visibilityState === 'hidden') { pauseForAway(); }
  else if (S.away || S.awayJob) { resumeAwayUI(); }
});
