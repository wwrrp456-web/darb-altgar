/* المنافسون المولَّدون (028أ): بطاقة «المنافسون» في المكتب. ذاكرة عدم التكرار على الجهاز darb-rival-memory (خارج حفظ اللعبة)؛ المحرك لا يلمس التخزين (D3). */
function rivalMemLoad() { try { const m = JSON.parse(localStorage.getItem('darb-rival-memory') || 'null'); if (m && Array.isArray(m.recent) && m.counts && typeof m.counts === 'object') E.rivalMemorySet(m); else E.rivalMemorySet(E.rivalMemoryNew()); } catch (e) { E.rivalMemorySet(E.rivalMemoryNew()); } }
function rivalMemSave() { if (!E.RIVALGEN.memDirty) return; E.RIVALGEN.memDirty = false; try { const m = E.rivalMemoryNow && E.rivalMemoryNow(); if (m) localStorage.setItem('darb-rival-memory', JSON.stringify(m)); } catch (e) {} }
rivalMemLoad();
/* 040ح: الثروة رقمٌ دقيق للحاكم (معرفة كاملة) أو نطاق يضيق بالمعرفة؛ القوة مقيسة من ترتيب الثروة في السوق */
const rvMoney = w => (w.exact ? fmt(w.v) : '≈ ' + fmt(w.lo) + ' – ' + fmt(w.hi)) + ' ريال';
const rvDetailsOn = () => { try { return !!(DETAILS.on && dLive()); } catch (e) { return false; } };
function rivalWealthHTML(r) {
  if (!r.wealth) return '';
  return `<div class="small rival-wealth" data-rival-wealth>الثروة: <b class="num">${rvMoney(r.wealth)}</b> <span class="muted">· معرفتك به: ${esc(r.wealth.knName)}</span></div><div class="small muted rival-share">القوة المقيسة: ${r.str100}٪ (المرتبة ${r.wrank} في ثروة تجار السوق) · حصته ${r.share}٪ من ثروتهم</div>`;
}
function rivalChiefLine(id) { // سطر «رئيس التجار» في صفحة المدينة
  const c = E.rivalChiefOf ? E.rivalChiefOf(S, id) : null; if (!c) return '';
  return `<div class="small" data-chief><b>رئيس التجار:</b> ${esc(c.name)}${c.wealth ? ` <span class="muted">· ثروته ${rvMoney(c.wealth)} (معرفتك به: ${esc(c.wealth.knName)})</span>` : ''}</div>`;
}
function rivalRowHTML(r) {
  const reply = `<div class="small rival-reply">الردّ: ${esc(r.reply)}${rvDetailsOn() ? ` <button type="button" class="sm" data-dchip="hs:rivreply" style="min-height:44px">اختر ردّك</button>` : ''}</div>`;
  return `<div class="card rival-row" data-rival="${r.id}"><b>${esc(r.name)}</b>${r.chief ? ' <span class="pill good" data-chief-pill>رئيس التجار</span>' : ''} <span class="pill">${esc(r.dom)}</span> <span class="pill">${esc(r.kind)}</span><div class="small muted">${esc(r.city)} · ${esc(r.pers)} · ${esc(r.bg)}</div>${rivalWealthHTML(r)}<div class="small"><b>${esc(r.idea)}:</b> ${esc(r.text)}${r.cont ? ` <span class="muted">(أثره الآن ${r.pct > 0 ? '+' : ''}${r.pct}٪)</span>` : r.active ? ` <span class="muted">(يبقى أثره ${r.left} يوماً)</span>` : ' <span class="muted">(انتهى أثره)</span>'}</div>${r.cont && !r.wealth ? `<div class="small muted rival-life">القوة: ${esc(r.strName)} · في السوق منذ ${r.days} يوماً</div>` : ''}${reply}</div>`;
}
function rivalsHTML() {
  if (!E.RIVALGEN.on || !S.learn || !S.learn.char) return '';
  const v = E.rivalGenView(S); if (!v.on || !v.list.length) return '';
  return `<section class="card rivals" aria-label="المنافسون"><h3 style="margin-top:0">المنافسون <span class="pill">${v.list.length} من ${v.max}</span></h3><p class="small muted">تجّار جدد يظهرون في الأسواق، لكلٍّ فكرة تحرّك سلعة أو عمالة أياماً ثم تعود الأسواق. لا حروب: أدواتهم الأسعار والعرض والطلب والتوظيف.</p>${(v.list.some(x => x.wealth) ? v.list.slice().sort((x, y) => (y.chief ? 1 : 0) - (x.chief ? 1 : 0) || (y.str || 0) - (x.str || 0)) : v.list).map(rivalRowHTML).join('')}</section>`;
}
