/* 035ج لوحة كبير الرعاة فوق ask وdsheet */
const chxUiOn = () => { try { return !!(E.CHIEFX.on && DETAILS.on && dLive() && S && S.learn && S.learn.char && E.chiefXView(S)); } catch (e) { return false; } };
const chxCN = id => (S.cities[id] ? S.cities[id].name : id);
const chxSg = n => (n < 0 ? '−' : '+') + fmt(Math.abs(n));
function chxCardOf(m) {
  const city = chxCN(m.city), nm = E.GD[m.g].name;
  if (m.type === 'buy') {
    const far = m.from && m.from !== m.city;
    return { id: 'chx:' + m.id, icon: 'icons/sprout', title: 'فرصة شراء: ' + nm + (far ? ' من ' + chxCN(m.from) : ''), why: 'أرخص من مزرعتك في ' + city + ' بنحو ' + m.pct + '٪' + (far ? ' بعد السَّوق (' + dayAr(m.days) + ')' : ''), state: 'open', prio: 2, mark: true, opts: [
      { id: 'buy', icon: 'ui-pay', title: 'اشترِ ' + m.qty + (far ? ' وساقها إلى مزرعتك' : ''), effect: 'الكلفة نحو ' + fmt(m.est) + ' ريال شاملة السَّوق · ' + (E.diwanOf(S) ? 'من الخزينة إن سمحت قاعدتها وإلا من محفظتك' : 'من محفظتك') + ' · موصى به', best: true, act: () => A.chiefXAct(S, m.id, 'buy') },
      { id: 'skip', icon: 'ui-postpone', title: 'تجاهل', effect: 'تبقى الفرصة خارج قائمتك', act: () => A.chiefXAct(S, m.id, 'skip') }] };
  }
  const where = m.parts.map(p => p.n + ' في ' + chxCN(p.to)).join(' و'), local = m.parts.every(p => p.to === m.city), half = m.parts.reduce((t, p) => t + Math.floor(p.n / 2), 0), tot = Math.max(1, m.qty);
  const opts = [{ id: 'sell', icon: 'ui-pay', title: 'بِع ' + where + (local ? ' الآن' : ''), effect: 'الصافي المتوقع نحو ' + fmt(m.net) + ' ريال بعد السَّوق والرسوم · في مزرعتك ' + fmt(m.here) + ' · موصى به', best: true, act: () => A.chiefXAct(S, m.id, 'sell') }];
  if (m.butcher && half >= 1) opts.push({ id: 'half', icon: 'ui-shops', title: 'بِع النصف وأبقِ النصف للجزّار', effect: 'بيع ' + half + ' رأساً: الصافي نحو ' + fmt(Math.round(m.net * half / tot)) + ' ريال · يحفظ طلب الجزّار', act: () => A.chiefXAct(S, m.id, 'half') });
  opts.push({ id: 'wait', icon: 'ui-postpone', title: 'انتظر أسبوعاً', effect: 'السعر قد يرتفع أو ينزل؛ لا ضمان', act: () => A.chiefXAct(S, m.id, 'wait') });
  opts.push({ id: 'all', icon: 'ui-pay', title: 'بِع الكل', off: 'يترك المزرعة تحت حد التكاثر (يبقى ' + m.floor + ' رؤوس على الأقل)' });
  return { id: 'chx:' + m.id, icon: 'icons/sprout', title: (local ? 'فرصة بيع: ' : 'فرصة بيع بعيدة: ') + nm, why: local ? 'سعره في ' + city + ' مرتفع الآن' : 'أعلى من مزرعتك في ' + city + ' بنحو ' + m.pct + '٪ بعد السَّوق والرسوم', state: 'open', prio: 1, mark: true, opts };
}
function chxAskCards() { const v = chxUiOn() ? E.chiefXView(S) : null; return v ? [].concat(...v.list.map(c => c.cards.map(chxCardOf))) : []; }
function chxHomeRow() {
  if (!chxUiOn()) return ''; const v = E.chiefXView(S);
  return hsRow('hs:chx', 'icons/sprout', `<b>المواشي</b><small>${v.opps} ${v.opps === 1 ? 'فرصة' : 'فرص'} · ${fmt(v.heads)} رأس في الطريق · صافي الشهر <b class="num ${v.month < 0 ? 'dear' : 'cheap'}">${chxSg(v.month)}</b></small>`, v.opps > 0);
}
const chxBtn = (c, k, v, label, on, extra) => `<button type="button" class="sm${on ? ' on' : ''}"${on ? ' aria-pressed="true"' : ' aria-pressed="false"'} data-act="chxrule" data-c="${esc(c)}" data-k="${k}" data-v="${v}" style="min-height:44px"${extra || ''}>${esc(label)}</button>`;
function chxRuleSum(c) {
  const R = c.rules, f0 = c.table.slice().sort((a, b) => b.heads - a.heads)[0], out = [];
  const modeTxt = k => E.CHIEFX.modeName[R[k]];
  const n = t => c.cards.filter(m => m.type === t).length;
  out.push(`<div class="small chx-sum" data-chx-sum="modes">البيع: <b>${modeTxt('sell')}</b> (${n('sell')} بطاقة) · الشراء: <b>${modeTxt('buy')}</b> (${n('buy')} فرصة)${E.DIWAN.on && S.player.diwan ? ' · يُموَّل من الخزينة بقاعدتها' : ''}</div>`);
  if (f0) { const city = S.cities[f0.city], ref = E.refPrice(city, f0.g);
    out.push(`<div class="small chx-sum" data-chx-sum="minPct">أدنى سعر: <b>${R.minPct}٪</b> من المرجعي = لا يبيع ${esc(f0.name)} تحت <b class="num">${fmt(ref * R.minPct / 100)}</b> ريالاً للرأس (المرجعي ${fmt(ref)})</div>`);
    out.push(`<div class="small chx-sum" data-chx-sum="weekMax">أقصى كمية: <b>${R.weekMax}٪</b> في الأسبوع = حتى <b class="num">${Math.floor(f0.heads * R.weekMax / 100)}</b> من ${f0.heads} ${esc(f0.name)}</div>`);
    out.push(`<div class="small chx-sum" data-chx-sum="butcher">الجزّار: <b>${R.butcher ? 'يُترك له 20٪' : 'لا شيء'}</b>${S.player.props[f0.city].butcher ? '' : ' (لا جزّار عندك: لا أثر)'}</div>`); }
  return out.join('');
}
function chxPanelOne(c) {
  const R = c.rules, ch = c.ch;
  const tbl = c.table.length ? `<table class="chx-t" style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:13px"><thead><tr><th style="text-align:right">النوع</th><th>العدد</th><th>للبيع</th><th style="text-align:right">أفضل سوق</th></tr></thead><tbody>${c.table.map(r => `<tr data-chx-row="${esc(r.g)}"><td style="word-break:break-word">${esc(r.name)}</td><td class="num">${r.heads}</td><td class="num">${r.sellable}</td><td style="word-break:break-word">${r.best ? esc(r.best.name) + ' <b class="${r.best.d >= 0 ? "cheap" : "dear"}">' + (r.best.d >= 0 ? '+' : '−') + Math.abs(Math.round(r.best.d * 100)) + '٪</b>' : 'لا فرق يُذكر'}</td></tr>`).join('')}</tbody></table><div class="small muted">الفرق بعد خصم السَّوق والرسوم وأثر البيع على السعر.</div>` : '<div class="small muted">لا قطيع في مزارعك بعد.</div>';
  const tripBtn = t => { const live = t && t.kind === 'sell' && S.day < t.arrive; return live ? `<button type="button" class="sm" data-act="chxcancel" data-i="${t.id}" style="min-height:44px">ألغِ وأعِد القطيع</button>` : ''; };
  const log = c.log.length ? c.log.map(e => { const t = c.trips.find(y => y.id === e.tid); return `<div class="kv" data-chx-log="${esc(e.k)}"><span>يوم ${e.d} · ${esc(e.t)}${e.done && (e.k === 'sell' || e.k === 'buy') ? ' <span class="pill small">لا يُتراجع عنه</span>' : ''}</span><span class="num ${e.amt < 0 ? 'dear' : e.amt > 0 ? 'cheap' : ''}">${e.amt ? chxSg(e.amt) : ''}</span></div>${e.k === 'drive' ? tripBtn(t) : ''}`; }).join('') : '<div class="small muted">لم يفعل شيئاً بعد.</div>';
  return `<section class="chx-c" data-chx-c="${esc(c.country)}"><div class="row" style="align-items:center"><img src="${art('team/shepherd')}" alt="" width="56" height="56" style="border-radius:50%;object-fit:cover"><div><b>كبير الرعاة · ${c.flag} ${esc(c.name)}</b><div class="small muted">الدرجة: <b>${esc(c.gradeName)}</b> · صافي ما فعله <b class="num ${c.pnl < 0 ? 'dear' : 'cheap'}">${chxSg(c.pnl)}</b> (الشهر ${chxSg(c.month)}) · في الطريق ${fmt(c.trips.reduce((t, y) => t + y.n, 0))} رأساً</div></div></div>`
    + skillCardHTML(ch, 'كبير الرعاة')
    + `<h4 class="dsec">جدول منتجات مزارعك</h4>${tbl}<div class="small" data-chx-undisc>أسواق غير مكتشفة ضمن مداه: <b class="num">${c.undisc}</b></div>`
    + `<h4 class="dsec">صلاحياته (تضعها أنت)</h4>` + [['البيع', 'sell', ['exec', 'ask', 'off'].map(v => [v, E.CHIEFX.modeName[v]])], ['الشراء', 'buy', ['exec', 'ask', 'off'].map(v => [v, E.CHIEFX.modeName[v]])], ['أدنى سعر للبيع (من المرجعي)', 'minPct', E.CHIEFX.minPct.map(v => [v, v + '٪'])], ['أقصى كمية في الأسبوع لكل نوع', 'weekMax', E.CHIEFX.weekMax.map(v => [v, v + '٪'])], ['حصة الجزّار قبل البيع', 'butcher', [[1, 'تُترك 20٪'], [0, 'لا شيء']]]]
      .map(([t, k, os]) => `<div class="small muted">${t}</div><div class="chips" role="group" aria-label="${t}">${os.map(([v, l]) => chxBtn(c.country, k, v, l, k === 'butcher' ? !!R.butcher === !!v : R[k] === v)).join('')}</div>`).join('')
    + chxRuleSum(c) + `<div class="small muted">الحدود نسبة من قطيعك، فتكبر معك. أما حد التكاثر (الأكبر من 4 رؤوس أو 30٪ وذكر) فثابت لا يتغير.</div>`
    + `<h4 class="dsec">سجل أفعاله</h4>${log}`
    + `<button type="button" class="sm${c.freeze ? ' on pri' : ''}"${c.freeze ? ' aria-pressed="true"' : ' aria-pressed="false"'} data-act="chxfreeze" data-c="${esc(c.country)}" data-v="${c.freeze ? 0 : 1}" style="width:100%;min-height:44px;margin-top:8px">${c.freeze ? 'مجمَّد: اضغط لرفع التجميد' : 'تجميد الكل'}</button>`
    + (c.freeze ? '<div class="small muted">التجميد يوقف الاكتشاف والبيع والشراء الجديد، وما في الطريق يكمل.</div>' : '') + `</section>`;
}
function chxPanel() { const v = E.chiefXView(S); return v ? v.list.map(chxPanelOne).join('') : ''; }
dDomains['hs:chx'] = { icon: 'icons/sprout', name: 'كبير الرعاة', gen: chxAskCards, extra: chxPanel, sub: 'فرصك الحالية، ثم جدول منتجاتك وصلاحياته وسجل أفعاله' };
