/* المنافسون المولَّدون (028أ): بطاقة «المنافسون» في المكتب. ذاكرة عدم التكرار على الجهاز darb-rival-memory (خارج حفظ اللعبة)؛ المحرك لا يلمس التخزين (D3). */
function rivalMemLoad() { try { const m = JSON.parse(localStorage.getItem('darb-rival-memory') || 'null'); if (m && Array.isArray(m.recent) && m.counts && typeof m.counts === 'object') E.rivalMemorySet(m); else E.rivalMemorySet(E.rivalMemoryNew()); } catch (e) { E.rivalMemorySet(E.rivalMemoryNew()); } }
function rivalMemSave() { if (!E.RIVALGEN.memDirty) return; E.RIVALGEN.memDirty = false; try { const m = E.rivalMemoryNow && E.rivalMemoryNow(); if (m) localStorage.setItem('darb-rival-memory', JSON.stringify(m)); } catch (e) {} }
rivalMemLoad();
function rivalRowHTML(r) {
  return `<div class="card rival-row" data-rival="${r.id}"><b>${esc(r.name)}</b> <span class="pill">${esc(r.dom)}</span> <span class="pill">${esc(r.kind)}</span><div class="small muted">${esc(r.city)} · ${esc(r.pers)} · ${esc(r.bg)}</div><div class="small"><b>${esc(r.idea)}:</b> ${esc(r.text)}${r.active ? ` <span class="muted">(يبقى أثره ${r.left} يوماً)</span>` : ' <span class="muted">(انتهى أثره)</span>'}</div><div class="small rival-reply">الردّ: ${esc(r.reply)}</div></div>`;
}
function rivalsHTML() {
  if (!E.RIVALGEN.on || !S.learn || !S.learn.char) return '';
  const v = E.rivalGenView(S); if (!v.on || !v.list.length) return '';
  return `<section class="card rivals" aria-label="المنافسون"><h3 style="margin-top:0">المنافسون <span class="pill">${v.list.length} من ${v.max}</span></h3><p class="small muted">تجّار جدد يظهرون في الأسواق، لكلٍّ فكرة تحرّك سلعة أو عمالة أياماً ثم تعود الأسواق. لا حروب: أدواتهم الأسعار والعرض والطلب والتوظيف.</p>${v.list.map(rivalRowHTML).join('')}</section>`;
}
