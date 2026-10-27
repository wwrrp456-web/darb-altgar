/* ---------- قياس محلي مجهول وبإذن اللاعب (WP-05) ----------
   دفتر داخل الجهاز فقط: لا شبكة ولا اسم ولا معرّف. مطفأ افتراضياً، ويُفعَّل من قائمة ⋯ بموافقة اللاعب.
   الأوقات نسبية من بداية الدفتر، والتقرير نص يقرأه اللاعب وينسخه بنفسه. يُدمج قبل boot() فلا يصطدم بمنطقة TDZ. */
const TL_ON = 'darb-tlog-on', TL_KEY = 'darb-tlog', TL_MAX = 500, TL_IDLE_MS = 60000;
let tlLastAct = 0, tlSeen = {}, tlMsg = '';
function tlOn() { try { return localStorage.getItem(TL_ON) === '1'; } catch (e) { return false; } }
function tlRead() { try { const j = JSON.parse(localStorage.getItem(TL_KEY) || 'null'); return j && Array.isArray(j.ev) ? j : null; } catch (e) { return null; } }
function tlog(type, data) {
  if (!tlOn()) return;
  try {
    const now = Date.now(), j = tlRead() || { t0: now, ev: [] };
    j.ev.push([now - j.t0, type, data || {}]); if (j.ev.length > TL_MAX) j.ev.splice(0, j.ev.length - TL_MAX);
    localStorage.setItem(TL_KEY, JSON.stringify(j));
  } catch (e) { /* الامتلاء أو المنع: القياس لا يعطّل اللعب */ }
}
/* بعد كل نتيجة فعل (act): أول شراء وأول ربح، من نتيجة الفعل وسجل الصفقات لا من تقدير */
function tlTrade(r) {
  if (!tlOn()) return;
  try {
    if (r && r.ok !== false && r.n > 0 && r.cost > 0 && r.pl === undefined && !tlSeen.buy) { tlSeen.buy = 1; if (!tlHas('first_buy')) tlog('first_buy', { n: r.n }); }
    if (!tlSeen.profit && S && S.player && S.player.trades.some(t => t.side === 'sell' && t.pl > 0)) { tlSeen.profit = 1; if (!tlHas('first_profit')) tlog('first_profit', { day: S.day }); }
  } catch (e) {}
}
function tlHas(type) { const j = tlRead(); return !!j && j.ev.some(e => e[1] === type); }
/* أكثر من 60 ثانية بلا فعل: يُسجَّل عند أول لمسة بعدها */
function tlTouch() { const n = Date.now(); if (tlLastAct && n - tlLastAct > TL_IDLE_MS && tlOn()) tlog('idle_gap', { sec: Math.round((n - tlLastAct) / 1000) }); tlLastAct = n; }
document.addEventListener('pointerdown', tlTouch, true); document.addEventListener('keydown', tlTouch, true);
tlLastAct = Date.now();
function tlReport() {
  const j = tlRead(); if (!j || !j.ev.length) return 'لا أحداث مسجلة بعد.';
  const mins = ms => (ms / 60000).toFixed(1), last = j.ev[j.ev.length - 1][0];
  return 'تقرير تجربة (يبقى على الجهاز حتى تنسخه) · الأحداث: ' + j.ev.length + ' · المدة: ' + mins(last) + ' دقيقة\n' + j.ev.map(e => mins(e[0]) + 'د · ' + e[1] + (Object.keys(e[2] || {}).length ? ' ' + JSON.stringify(e[2]) : '')).join('\n');
}
function tlRender() {
  let p = $('tlPanel'); if (!p) { p = document.createElement('section'); p.id = 'tlPanel'; p.className = 'backup-panel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-labelledby', 'tlTitle'); document.body.append(p); }
  p.hidden = false; const on = tlOn();
  p.innerHTML = `<div class="backup-box"><div class="row"><h2 id="tlTitle">سجل التجربة</h2><span class="spacer"></span><button data-act="tl-close" aria-label="إغلاق">✕</button></div>
    <p>${on ? 'السجل يعمل الآن: يدوّن متى اشتريت وربحت وأي نوافذ ظهرت وأين توقفت طويلاً. لا اسم فيه ولا يُرسَل لأحد.' : 'شارك سجل تجربتك مع المطوّر؟ يدوّن متى اشتريت وربحت وأي نوافذ ظهرت وأين توقفت طويلاً. يبقى في جهازك حتى تنسخه وترسله بنفسك، ولا يُرسَل شيء عبر الشبكة.'}</p>
    <div class="backup-message" role="status">${esc(tlMsg)}</div>
    ${on ? `<label>التقرير<textarea id="tlText" readonly dir="rtl">${esc(tlReport())}</textarea></label><div class="row"><button class="pri" data-act="tl-copy">انسخ التقرير</button><button data-act="tl-off">أوقف التسجيل</button><button data-act="tl-clear">امسح السجل</button></div>` : `<div class="row"><button class="pri" data-act="tl-on">فعّل السجل</button><button data-act="tl-close">لا شكراً</button></div>`}</div>`;
}
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act^="tl-"]'); if (!b) return; ev.stopImmediatePropagation(); const a = b.dataset.act;
  if (a === 'tl-open') { setHmenu(false); tlMsg = ''; return tlRender(); }
  if (a === 'tl-close') { const p = $('tlPanel'); if (p) p.hidden = true; return; }
  if (a === 'tl-on') { try { localStorage.setItem(TL_ON, '1'); tlMsg = 'بدأ التسجيل في جهازك.'; tlSeen = {}; tlog('open', {}); } catch (e) { tlMsg = 'تعذّر التفعيل على هذا الجهاز.'; } return tlRender(); }
  if (a === 'tl-off') { try { localStorage.removeItem(TL_ON); tlMsg = 'أُوقف التسجيل. السجل ما زال محفوظاً حتى تمسحه.'; } catch (e) {} return tlRender(); }
  if (a === 'tl-clear') { try { localStorage.removeItem(TL_KEY); tlSeen = {}; tlMsg = 'مُسح السجل.'; } catch (e) {} return tlRender(); }
  if (a === 'tl-copy') { const t = tlReport(); try { navigator.clipboard.writeText(t).then(() => { tlMsg = 'نُسخ التقرير.'; tlRender(); }, () => { tlMsg = 'انسخ النص الظاهر يدوياً.'; tlRender(); }); } catch (e) { tlMsg = 'انسخ النص الظاهر يدوياً.'; tlRender(); } }
}, true);
document.addEventListener('keydown', ev => { const p = $('tlPanel'); if (ev.key === 'Escape' && p && !p.hidden) { ev.preventDefault(); ev.stopImmediatePropagation(); p.hidden = true; } }, true);
if (tlOn()) tlog('open', {});
