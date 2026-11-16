/* ---------- 054 «سجل عقودك»: كل عقد انتهى بربحه أو خسارته وما جرى فيه ----------
   مجال clog في dDomains (نمط 037: dsheet وdchip)، بلا <select> ولا <details> ولا طيّ ولا أيقونة جديدة. المفتاح CLOG.on؛ المطفأ = لا صف ولا زرّ ولا مجال.
   الوصول: «حال أعمالي» (نقرة) أو زرّ الاتفاقيات (نقرتان). حالة الواجهة clsh لا تُحفظ. */
const clUiOn = () => { try { return !!(E.CLOG.on && DETAILS.on && dLive() && S && S.player && S.learn && S.learn.char); } catch (e) { return false; } };
const clsh = { y: 'all', g: 'all', n: 10, i: null, on: false };
const clReset = () => { let y = 'all'; try { y = E.dateOf(S).year; } catch (e) {} Object.assign(clsh, { y, g: 'all', n: E.CLOG.page, i: null, on: true }); };
const clSg = n => (n < 0 ? '−' : n > 0 ? '+' : '') + fmt(Math.abs(Math.round(n)));
const clCap = { export: 'التزمتَ', import: 'التزمتَ', raw: 'التزمتَ', salam: 'ثمن السلم', mud: 'رأس المال', rmud: 'رأس المال', wakala: 'أقصى ما تضعه', ist: 'الثمن', part: 'رأس مال المصنع', rpart: 'رأس مال المصنع', pass: 'رحلات في الشهر', safe: 'لكل رحلة', fran: 'حد التعبئة', book: 'رأس المال', loan: 'أقرضتَ' };
function clTr(r) { // ما جرى للتجارة (§3-ب)
  const t = r.tr || {}, g = r.g && GD[r.g] ? GD[r.g].name : '', k = r.k;
  if (k === 'export') return 'التزمتَ ' + fmt(t.q || 0) + ' وحدة من ' + g + '، بعتَ ' + fmt(t.a || 0) + '، والناقص ' + fmt(t.s || 0);
  if (k === 'import') return 'عُرض عليك ' + fmt(t.q || 0) + ' وحدة، قبلتَ ' + fmt(t.a || 0);
  if (k === 'salam' || k === 'book' || k === 'ist') return 'طلبتَ ' + fmt(t.q || 0) + ' وحدة من ' + g + '، استلمتَ ' + fmt(t.a || 0) + (t.s > 0 ? '، ولم يُسلَّم ' + fmt(t.s) + ' فرُدّ ثمنه' : '');
  if (k === 'wakala') return 'سلّمتَ وكيلك ' + fmt(t.q || 0) + ' وحدة، باع ' + fmt(t.a || 0) + '، ورُدّ إلى مخزنك ' + fmt(t.s || 0);
  if (k === 'mud' || k === 'rmud') return fmt(t.q || 0) + ' يوماً: صعدت الأسعار ' + fmt(t.a || 0) + ' يوماً وهبطت ' + fmt(t.s || 0);
  if (k === 'part' || k === 'rpart') return 'ربح المصنع ' + fmt(t.a || 0) + ' (خسارته إن سالباً)، وحصة الشريك ' + fmt(t.s || 0) + '٪';
  if (k === 'safe') return fmt(t.q || 0) + ' رحلة مشمولة، صدّ الحرّاس ' + fmt(t.a || 0) + ' مرة، وعوّضك الصندوق ' + fmt(t.s || 0) + ' مرة';
  if (k === 'loan') return 'أقرضتَ ' + fmt(t.q || 0) + '، ورُدّ إليك ' + fmt(t.a || 0);
  return '';
}
const clRowN = r => r.why === 'forg' ? `<span class="muted">سامحتَ ${fmt(r.out)}</span>` : r.u ? `<span class="muted">كلفة ${fmt(r.out)}</span>` : `<b class="num ${r.n < 0 ? 'dear' : 'cheap'}">${clSg(r.n)}</b>`;
function clChips(attr, items, cur, label) { return `<div class="clog-fs" role="group" aria-label="${label}">${items.map(([v, t]) => `<button type="button" class="dchip clog-f${String(v) === String(cur) ? ' on' : ''}" aria-pressed="${String(v) === String(cur)}" data-clog-${attr}="${v}"><span class="dnm">${esc(t)}</span></button>`).join('')}</div>`; }
function clDetail(v, view) {
  const r = v.rec, pos = view.findIndex(x => x.i === v.i), det = [];
  det.push(['الطرف', esc(v.party) + (v.city ? ' · ' + esc(v.city) + (v.home ? '، من سوقك ' + esc(v.home) : '') : '')]);
  det.push(['المدة', fmt(v.days) + ' يوماً: ' + esc(v.from) + ' ← ' + esc(v.to)]);
  det.push([clCap[r.k] || 'الرسوم المتفق عليها', fmt(r.cap)]); det.push(['ما دفعتَ', fmt(r.out)]);
  det.push([r.k === 'export' ? 'وفّرتَ من الجمارك' : 'ما قبضتَ', r.u ? 'غير مقيس بالريال' : fmt(r.in)]);
  det.push(['النتيجة', r.why === 'forg' ? '<span class="muted">سامحتَ صديقك بـ' + fmt(r.out) + '</span>' : r.u ? '<span class="muted">كلفة ' + fmt(r.out) + '</span>' : `<b class="num ${r.n < 0 ? 'dear' : 'cheap'}">${clSg(r.n)}</b>`]);
  const tr = clTr(r); if (tr || r.r) det.push(['ما جرى للتجارة', esc(tr) + (r.r ? `<div class="small muted">${esc(r.r)}</div>` : '')]);
  det.push(['سبب الانتهاء', esc(v.why)]);
  return `<div class="clog-det" data-clog-det><h3 style="margin:6px 0">${esc(v.name)} مع ${esc(v.party)}</h3>${det.map(([a, b]) => `<div class="kv"><span>${esc(a)}</span><span>${b}</span></div>`).join('')}${r.o ? '<div class="small muted">بدأ قبل تفعيل السجل: الأرقام منذ التفعيل</div>' : ''}
    <div class="clog-fs" style="margin-top:8px"><button type="button" class="dchip clog-f" data-clog-nav="-1" ${pos >= view.length - 1 ? 'disabled aria-disabled="true"' : ''}><span class="dnm">السابق</span></button><button type="button" class="dchip clog-f" data-clog-nav="1" ${pos <= 0 ? 'disabled aria-disabled="true"' : ''}><span class="dnm">التالي</span></button><button type="button" class="dchip clog-f" data-clog-back><span class="dnm">القائمة</span></button></div></div>`;
}
function clogBody() {
  if (!clUiOn()) return ''; if (!clsh.on) clReset();
  const years = E.clogYears(S); if (clsh.y !== 'all' && !years.includes(clsh.y) && !clsh.touched) { /* سنة اليوم قد لا تحمل أسطراً بعد */ }
  const view = E.clogView(S, clsh.y, clsh.g);
  if (clsh.i != null) { const v = view.find(x => x.i === clsh.i); if (v) return clDetail(v, view); clsh.i = null; }
  const t = E.clogTot(S, clsh.y, clsh.g), net = t.p - t.l, yn = clsh.y === 'all' ? 'كل السنوات' : E.yearName(clsh.y), gn = clsh.g === 'all' ? 'كل الأنواع' : E.CL_GRP[clsh.g][0];
  const card = `<div class="card clog-tot"><div class="kv"><span>الربح</span><b class="num cheap">${fmt(t.p)}</b></div><div class="kv"><span>الخسارة</span><b class="num dear">${fmt(t.l)}</b></div><div class="kv"><span>الصافي</span><b class="num ${net < 0 ? 'dear' : 'cheap'}">${clSg(net)}</b></div><div class="kv"><span>عدد العقود</span><b class="num">${fmt(t.c)}</b></div>${t.u > 0 ? `<div class="small muted">كلفة عقود أثرها لا يُقاس بالريال: ${fmt(t.u)}</div>` : ''}${t.f > 0 ? `<div class="small muted">ما سامحتَ به: ${fmt(t.f)}</div>` : ''}</div>`;
  const yc = clChips('y', [['all', 'الكل']].concat(years.map(y => [y, E.yearName(y)])), clsh.y, 'السنة'), gc = clChips('g', [['all', 'الكل']].concat(E.clogGroups(S, clsh.y).map(g => [g, E.CL_GRP[g][0]])), clsh.g, 'النوع');
  const sum = `<div class="small clog-sum" data-clog-sum>${esc(yn)} · ${esc(gn)}: ${fmt(t.c)} عقداً، صافي ${clSg(net)} ريال</div>`;
  const rows = view.slice(0, clsh.n).map(v => `<button type="button" class="clog-row" data-clog-row="${v.i}"><span class="cl-k">${esc(v.name)}</span><span class="cl-p">${esc(v.party)}</span><span class="cl-d small muted">${esc(v.date)}</span>${clRowN(v.rec)}</button>`).join('');
  const more = view.length > clsh.n ? `<button type="button" class="dchip clog-f" data-clog-more><span class="dnm">المزيد (${view.length - clsh.n})</span></button>` : '';
  const lost = t.c > view.length ? `<div class="small muted">تفاصيل هذه السنة لم تعد محفوظة؛ السجل يحفظ آخر ${E.CLOG.max} عقد، وبقيت مجاميعها أعلاه</div>` : '';
  return `<div class="clog" data-clog>${card}${yc}${gc}${sum}<div class="clog-rows">${rows || '<div class="dempty">لا عقود منتهية في هذا الاختيار</div>'}</div>${more}${lost}</div>`;
}
dDomains.clog = { icon: 'icons/ledger', name: 'سجل عقودك', sub: 'كل عقد انتهى: ربحه أو خسارته وما جرى فيه', gen: () => [], extra: clogBody, noEmpty: true };
function clogHomeRow() {
  if (!clUiOn()) return ''; const L = S.player.clog; if (!L || !L.length) return ''; if (dsh.domain !== 'clog') clsh.on = false;
  const y = E.dateOf(S).year, t = E.clogTot(S, y, 'all');
  return hsRow('clog', 'icons/ledger', `<b>سجل عقودك</b> <b class="num ${t.p - t.l < 0 ? 'dear' : 'cheap'}">${clSg(t.p - t.l)}</b><small>${fmt(t.c)} عقداً هذه السنة · صافي</small>`);
}
function clogBtnHTML() { if (!clUiOn()) return ''; const n = (S.player.clog || []).length; return n ? `<button type="button" class="sm" data-act="clogopen" style="min-height:44px;margin:6px 0">سجل عقودك المنتهية (${n})</button>` : ''; }
document.addEventListener('click', ev => {
  const t = ev.target.closest && ev.target.closest('[data-clog-y],[data-clog-g],[data-clog-row],[data-clog-nav],[data-clog-more],[data-clog-back],[data-dchip="clog"],[data-act="clogopen"]'); if (!t) return;
  if (t.dataset.dchip === 'clog' || t.dataset.act === 'clogopen') { if (dsh.domain !== 'clog') clsh.on = false; return; }
  if (dsh.domain !== 'clog') return; ev.stopImmediatePropagation();
  const d = t.dataset;
  if (d.clogY != null) { clsh.y = d.clogY === 'all' ? 'all' : +d.clogY; clsh.g = 'all'; clsh.n = E.CLOG.page; }
  else if (d.clogG != null) { clsh.g = d.clogG; clsh.n = E.CLOG.page; }
  else if (d.clogRow != null) clsh.i = +d.clogRow;
  else if (d.clogMore != null) clsh.n += E.CLOG.page;
  else if (d.clogBack != null) clsh.i = null;
  else if (d.clogNav != null) { if (t.disabled) return; const view = E.clogView(S, clsh.y, clsh.g), pos = view.findIndex(x => x.i === clsh.i), np = pos - +d.clogNav; if (view[np]) clsh.i = view[np].i; }
  dsh.keep = d.clogMore != null; dRender(); if (d.clogMore == null) { const sh = document.getElementById('dsheet'); if (sh) sh.scrollTop = 0; }
}, true);
