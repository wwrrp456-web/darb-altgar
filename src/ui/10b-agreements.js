/* ---------- اتفاقيات النفوذ في صفحة الزعماء (036أ): سطر الخانات، صف لكل اتفاقية + «التفاصيل والتوقيع»، ودفتر القائمة ----------
   النصوص من specs/036-influence-contracts/texts.md حرفياً. INFLU.on=false يخفي القسم كله. لا أكثر من قائمتين منسدلتين (تصدير + استيراد المخفي). */
let agrSel = {};
const agrOn = () => !!(E.INFLU.on && E.INFLU.fam.lane && S.learn && S.learn.char && S.phase >= 2);
function agrChoice(kind, city) {
  const k = kind + '|' + city, ruled = S.order.filter(id => E.bossOf(S, id) && E.bossOf(S, id).ruler === 'player' && id !== city), s = agrSel[k] || (agrSel[k] = {});
  if (!ruled.includes(s.home)) s.home = ruled[0] || null;
  const gs = s.home ? E.agrGoodsOptions(S, city, kind, s.home) : []; if (!gs.includes(s.g)) s.g = gs[0] || null;
  const qs = s.g ? E.agrQtyOptions(S, city, s.g) : []; if (!(s.qi >= 0 && s.qi < qs.length)) s.qi = 1;
  return { s, ruled, gs, qs };
}
function agrRowHTML(kind, bs, c) {
  const K = E.AGR_KINDS[kind], { s, ruled, gs, qs } = agrChoice(kind, lordCity), t = E.agrTerms(S, lordCity, kind), why = E.agrBlock(S, lordCity, kind, s.home, s.g, qs[s.qi]);
  const cut = Math.round((kind === 'export' ? t.cut : t.impCut) * 100), benefit = kind === 'export' ? 'جمارك أقل بنحو ' + cut + '٪ على السلعة المتفق عليها وبلا زيادة 2٪ على الغريب' : 'سلع سوقه بأسعار أخف بنحو ' + cut + '٪ وجمارك أخف';
  const chips = (arr, cur, act, lab, key) => `<div class="chips" style="margin:4px 0">${arr.map((x, i) => `<button class="${(key === 'i' ? i : x) === cur ? 'on' : ''}" data-act="${act}" data-k="${kind}" data-${key}="${key === 'i' ? i : x}">${lab(x, i)}</button>`).join('')}</div>`;
  const form = ruled.length ? `<div class="small muted">سوقك المحكوم (طرفك):</div>${chips(ruled, s.home, 'agrhome', x => esc(cityName(x)), 'h')}<div class="small muted">السلعة:</div>${chips(gs, s.g, 'agrgood', x => gi(x) + ' ' + GD[x].name, 'g')}<div class="small muted">${kind === 'export' ? 'الكمية الشهرية' : 'كمية الدفعة'}:</div>${chips(qs, s.qi, 'agrqty', (x, i) => fmt(x), 'i')}` : '';
  const sign = `<div class="row" style="margin-top:6px"><button class="sm pri" data-act="agrsign" data-k="${kind}" ${why ? 'disabled' : ''}>وقّع ${K.name}</button></div>${why ? `<div class="small dear">${esc(why)}</div>` : ''}`;
  const body = `<div class="small"><b>ما تلتزم به:</b> ${K.obl}</div>${form}${sign}`;
  return `<div class="card pactrow" data-agrrow="${kind}"><div class="row" style="margin:0"><b>${K.icon} ${K.name}</b></div><div class="small">${esc(K.desc)}</div><div class="small"><b>الفائدة:</b> ${benefit}</div><div class="kv"><span>المدة</span><b>${dayAr(t.days)}</b></div><div class="small"><b>الكلفة:</b> بلا رسم؛ ${esc(E.INFLU_TXT.penal)}</div>${why ? `<div class="small"><b>الشرط الناقص:</b> <span class="dear">${esc(why)}</span></div>` : ''}${foldDet('agr-' + kind, false, '<b>التفاصيل والتوقيع</b>', body)}</div>`;
}
function agrLedgerHTML(a, c) {
  const nm = a.name, imp = a.kind === 'import', bs = E.bossOf(S, a.city);
  const btn = imp && a.batch ? `<div class="row"><button class="sm pri" data-act="agracc" data-id="${a.id}">اقبل الدفعة (${fmt(a.batch.qty)} ${esc(GD[a.goods].name)} بـ ${lm(Math.round(a.batch.unit * a.batch.qty + a.batch.cust), S.cities[a.home])})</button><button class="sm" data-act="agrrej" data-id="${a.id}">ارفضها بلا غرامة</button></div>` : '';
  return `<div class="card" data-agr="${a.id}"><b>${E.AGR_KINDS[a.kind].icon} ${nm}</b> <span class="pill good">قائمة</span><div class="small muted">${cityTag(a.city)} · ${esc(bs.name)} · طرفك ${cityTag(a.home)} · ${gi(a.goods)} ${esc(GD[a.goods].name)}</div><div class="kv"><span>المتبقي</span><b>${a.left} من ${dayAr(a.total)}</b></div>${bar(a.total - a.left, a.total, 'gold')}<div class="kv"><span>${imp ? 'الدفعة' : 'متوقع / فعلي هذا الشهر'}</span><b class="num">${fmt(a.exp)} / ${fmt(a.act)}</b></div>${a.why ? `<div class="small muted">${esc(a.why)}</div>` : ''}${a.saved ? `<div class="small muted">جمارك وفّرتَها هذا الشهر: ${fmt(a.saved)}</div>` : ''}${btn}<div class="row"><button class="sm" data-act="agrbreak" data-id="${a.id}">فسخ</button></div></div>`;
}
function agrOffersHTML(bs, c) {
  if (!agrOn()) return ''; const v = E.agrView(S);
  const mine = v.list.filter(a => a.city === lordCity).map(a => agrLedgerHTML(a, c)).join('');
  return `<h2>اتفاقيات ${esc(bs.name)}</h2><div class="small muted" style="margin-bottom:6px">${esc(E.INFLU_TXT.slots(v.used, v.slots))}</div>${mine}${v.list.some(a => a.city === lordCity && a.kind === 'export') ? '' : (v.kinds.includes('export') ? agrRowHTML('export', bs, c) : '')}${v.kinds.includes('import') && !v.list.some(a => a.city === lordCity && a.kind === 'import') ? agrRowHTML('import', bs, c) : ''}`;
}
