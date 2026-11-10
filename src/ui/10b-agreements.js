/* اتفاقيات النفوذ في صفحة الزعماء (036أ): سطر الخانات، صف لكل اتفاقية + «التفا */
let agrSel = {};
// «التفاصيل والتوقيع»: زرّ يبدّل لوحة تحته (ليس قائمة منسدلة)؛ حالته في ui.fold فتبقى بعد إعادة الرسم والتحميل
const agrToggle = (kind, body) => { const open = foldOpen('agrp-' + kind, false); return `<div class="row" style="margin:6px 0 0"><button class="sm" data-act="agrtoggle" data-k="${kind}" aria-expanded="${open}">التفاصيل والتوقيع ${open ? '▾' : '▸'}</button></div>${open ? `<div class="agrp">${body}</div>` : ''}`; };
const agrOn = () => !!(E.INFLU.on && (E.INFLU.fam.lane || E.INFLU.fam.fin) && S.learn && S.learn.char && S.phase >= 2);
const agrKindOn = k => (E.FIN_KINDS[k] ? E.finOn(S, k) : !!E.INFLU.fam.lane);
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
  const body = `<div class="small"><b>ما تلتزم به:</b> ${K.obl}${K.note ? ' ' + K.note : ''}</div>${form}${sign}`;
  return `<div class="card" data-agrrow="${kind}"><div class="row" style="margin:0"><b>${K.icon} ${K.name}</b></div><div class="small">${esc(K.desc)}</div><div class="small"><b>الفائدة:</b> ${benefit}</div><div class="kv"><span>المدة</span><b>${dayAr(t.days)}</b></div><div class="small"><b>الكلفة:</b> بلا رسم؛ ${esc(E.INFLU_TXT.penal)}</div>${why ? `<div class="small"><b>الشرط الناقص:</b> <span class="dear">${esc(why)}</span></div>` : ''}${agrToggle(kind, body)}</div>`;
}
let laneSel = {};
function laneHTML(a) {
  if (!E.lineOn(S)) return ''; const ag = S.player.agr.find(x => x.id === a.id); if (!ag) return ''; const T = E.INFLU_TXT.lane;
  const head = `<div class="small" style="margin-top:6px"><b>${T.name}</b>: ${esc(T.desc)} <span class="muted">${esc(T.obl)}</span></div>`;
  if (ag.lane) {
    const car = S.player.caravans.find(x => x.id === ag.lane.car), st = !car ? '' : ag.lane.paused ? 'متوقف: لا قائد' : car.left > 0 ? 'في الطريق إلى ' + esc(cityName(car.dest || car.city)) + '، باقٍ ' + dayAr(car.left) : car.waiting ? esc(car.waiting) : 'في ' + esc(cityName(car.city));
    return head + `<div class="kv"><span>${ag.lane.mode === 'sea' ? 'السفينة والقافلة' : 'القافلة'}</span><b>${car ? esc(car.name) : ''}</b></div><div class="small muted">${st}</div><div class="row"><button class="sm" data-act="laneclose" data-id="${a.id}">إلغاء الخط</button></div>`;
  }
  const cars = E.laneCars(S).slice(0, 6); if (!cars.length) return head + '<div class="small muted">لا قافلة بقائد مستأجر متفرغة لهذا الخط.</div>';
  let cur = laneSel[a.id]; if (!cars.some(x => x.id === cur)) cur = laneSel[a.id] = cars[0].id;
  const rl = m => E.laneBlock(S, ag, cur, m), rLand = rl('land'), rSea = rl('sea');
  return head + `<div class="chips" style="margin:4px 0">${cars.map(x => `<button class="${x.id === cur ? 'on' : ''}" data-act="lanecar" data-id="${a.id}" data-c="${x.id}">${esc(x.name)}</button>`).join('')}</div><div class="row"><button class="sm pri" data-act="laneopen" data-id="${a.id}" data-m="land" ${rLand ? 'disabled' : ''}>خط بري</button><button class="sm" data-act="laneopen" data-id="${a.id}" data-m="sea" ${rSea ? 'disabled' : ''}>خط بحري</button></div>${rLand ? `<div class="small dear">${esc(rLand)}</div>` : ''}`;
}
function agrLedgerHTML(a, c) {
  if (a.fin) return finLedgerHTML(a, c);
  const nm = a.name, imp = a.kind === 'import', bs = E.bossOf(S, a.city);
  const btn = imp && a.batch ? `<div class="row"><button class="sm pri" data-act="agracc" data-id="${a.id}">اقبل الدفعة (${fmt(a.batch.qty)} ${esc(GD[a.goods].name)} بـ ${lm(Math.round(a.batch.unit * a.batch.qty + a.batch.cust), S.cities[a.home])})</button><button class="sm" data-act="agrrej" data-id="${a.id}">ارفضها بلا غرامة</button></div>` : '';
  return `<div class="card" data-agr="${a.id}"><b>${E.AGR_KINDS[a.kind].icon} ${nm}</b> <span class="pill good">قائمة</span><div class="small muted">${cityTag(a.city)} · ${esc(bs.name)} · طرفك ${cityTag(a.home)} · ${gi(a.goods)} ${esc(GD[a.goods].name)}</div><div class="kv"><span>المتبقي</span><b>${a.left} من ${dayAr(a.total)}</b></div>${bar(a.total - a.left, a.total, 'gold')}<div class="kv"><span>${imp ? 'الدفعة' : 'متوقع / فعلي هذا الشهر'}</span><b class="num">${fmt(a.exp)} / ${fmt(a.act)}</b></div>${a.why ? `<div class="small muted">${esc(a.why)}</div>` : ''}${a.saved ? `<div class="small muted">جمارك وفّرتَها هذا الشهر: ${fmt(a.saved)}</div>` : ''}${btn}${laneHTML(a)}<div class="row"><button class="sm" data-act="agrbreak" data-id="${a.id}">فسخ</button></div></div>`;
}
function agrOffersHTML(bs, c) {
  if (!agrOn()) return ''; const v = E.agrView(S), here = k => v.list.some(a => a.city === lordCity && a.kind === k);
  const mine = v.list.filter(a => a.city === lordCity).map(a => agrLedgerHTML(a, c)).join(''), rows = v.kinds.filter(k => agrKindOn(k) && !here(k)).map(k => E.FIN_KINDS[k] ? finRowHTML(k, bs, c) : agrRowHTML(k, bs, c)).join('');
  return `<h2>اتفاقيات ${esc(bs.name)}</h2><div class="small muted" style="margin-bottom:6px">${esc(E.INFLU_TXT.slots(v.used, v.slots))}</div>${mine}${rows}`;
}
/* ---------- العقود المالية (036ج): السلم والمضاربة مع تجار السوق والوكالة بالعمولة ---------- */
let finSel = {};
function finChoice(kind, city) {
  const k = kind + '|' + city, ruled = S.order.filter(id => E.bossOf(S, id) && E.bossOf(S, id).ruler === 'player' && id !== city), s = finSel[k] || (finSel[k] = {});
  if (!ruled.includes(s.home)) s.home = ruled[0] || null; const gs = kind === 'mud' || kind === 'part' ? [] : kind === 'ist' ? E.istGoods(S, city) : kind === 'raw' ? E.rawGoods(S, s.home, city) : E.finGoods(S, city, kind); if (kind !== 'mud' && kind !== 'part' && !gs.includes(s.g)) s.g = gs[0] || null;
  const qs = kind === 'mud' || kind === 'part' ? [] : s.g ? E.finQtyOptions(S, city, kind === 'wakala' ? 'wakala' : 'salam', s.g) : [], caps = kind === 'mud' ? E.finCapOptions(S, city) : []; if (!(s.qi >= 0 && s.qi < qs.length)) s.qi = kind === 'wakala' ? 1 : 1; if (!(s.ci >= 0 && s.ci < caps.length)) s.ci = 1;
  const days = kind === 'wakala' || E.MFG_KINDS[kind] ? [] : E.INFLU[kind].days; if (days.length && !days.includes(s.days)) s.days = days[0]; const shares = kind === 'mud' ? E.INFLU.mud.shares : kind === 'part' ? E.INFLU.part.shares : []; if (shares.length && !shares.includes(s.share)) s.share = shares[1] || shares[0];
  const recipes = kind === 'part' && s.home ? E.partRecipes(S, s.home) : []; if (kind === 'part' && !recipes.includes(s.recipe)) s.recipe = recipes[0] || null; if (kind === 'ist' && !['full', 'inst', 'part'].includes(s.pay)) s.pay = 'full'; if (kind === 'raw' && !['supply', 'salam'].includes(s.mode)) s.mode = 'supply';
  return { s, ruled, gs, qs, caps, days, shares, recipes };
}
const finOpts = (kind, ch) => ({ home: ch.s.home, g: ch.s.g, qty: ch.qs[ch.s.qi], cap: ch.caps[ch.s.ci], days: ch.s.days, share: ch.s.share, pay: ch.s.pay, mode: ch.s.mode, recipe: ch.s.recipe });
function finRowHTML(kind, bs, c) {
  if (E.MFG_KINDS[kind]) return mfgRowHTML(kind, bs, c);
  const K = E.AGR_KINDS[kind], ch = finChoice(kind, lordCity), { s, ruled, gs, qs, caps, days, shares } = ch, o = finOpts(kind, ch), why = E.finBlock(S, lordCity, kind, o);
  const chips = (arr, cur, act, lab, key) => `<div class="chips" style="margin:4px 0">${arr.map((x, i) => `<button class="${(key === 'i' || key === 'c' ? i : x) === cur ? 'on' : ''}" data-act="${act}" data-k="${kind}" data-${key === 'c' ? 'i' : key}="${key === 'i' || key === 'c' ? i : x}">${lab(x, i)}</button>`).join('')}</div>`;
  let benefit, cost, dur, form = '';
  if (kind === 'salam') { const cut = Math.round(E.salamCut(S, s.days) * 100), price = s.g && qs[s.qi] ? Math.round(qs[s.qi] * E.unitPrice(c, s.g) * (1 - E.salamCut(S, s.days))) : 0; benefit = 'تدفع الآن أقل من سعر اليوم بنحو ' + cut + '٪ وتستلم في مخزنك عند الأجل'; cost = 'تدفع ' + (price ? fmt(price) + ' ريال' : 'الثمن') + ' مقدماً'; dur = dayAr(s.days); }
  else if (kind === 'mud') { benefit = 'نسبة ' + Math.round(s.share * 100) + '٪ لك من ربح التجار، وعائدها من هوامش السوق وقد لا يكون ربحاً'; cost = 'رأس مالك: ' + fmt(caps[s.ci] || 0) + ' (سقفه ' + fmt(E.mudCap(S, lordCity)) + ')'; dur = dayAr(s.days); }
  else { benefit = 'يبيع لك سلعك عنده بعمولة ' + (Math.round(E.wakalaRate(S) * 1000) / 10) + '٪ من الثمن'; cost = 'عمولة معلومة من ثمن ما يبيعه'; dur = dayAr(E.INFLU.wakala.days); }
  if (ruled.length) form = `<div class="small muted">سوقك المحكوم (طرفك):</div>${chips(ruled, s.home, 'finhome', x => esc(cityName(x)), 'h')}`
    + (kind === 'mud' ? `<div class="small muted">رأس المال:</div>${chips(caps, s.ci, 'fincap', x => fmt(x), 'c')}<div class="small muted">المدة:</div>${chips(days, s.days, 'findays', x => dayAr(x), 'd')}<div class="small muted">نسبة ربحك:</div>${chips(shares, s.share, 'finshare', x => Math.round(x * 100) + '٪', 's')}`
      : `<div class="small muted">السلعة:</div>${chips(gs, s.g, 'fingood', x => gi(x) + ' ' + GD[x].name, 'g')}<div class="small muted">${kind === 'salam' ? 'الكمية' : 'أقصى ما تضعه عنده'}:</div>${chips(qs, s.qi, 'finqty', x => fmt(x), 'i')}` + (kind === 'salam' ? `<div class="small muted">المدة:</div>${chips(days, s.days, 'findays', x => dayAr(x), 'd')}` : ''));
  const sign = `<div class="row" style="margin-top:6px"><button class="sm pri" data-act="finsign" data-k="${kind}" ${why ? 'disabled' : ''}>وقّع ${K.name}</button></div>${why ? `<div class="small dear">${esc(why)}</div>` : ''}`;
  return `<div class="card" data-agrrow="${kind}"><div class="row" style="margin:0"><b>${K.icon} ${K.name}</b></div><div class="small">${esc(K.desc)}</div><div class="small"><b>الفائدة:</b> ${benefit}</div><div class="kv"><span>المدة</span><b>${dur}</b></div><div class="small"><b>الكلفة:</b> ${cost}</div>${why ? `<div class="small"><b>الشرط الناقص:</b> <span class="dear">${esc(why)}</span></div>` : ''}${agrToggle(kind, `<div class="small"><b>ما تلتزم به:</b> ${K.obl}</div>${form}${sign}`)}</div>`;
}
let wkSel = {};
function finLedgerHTML(a, c) {
  if (a.mfg) return mfgLedgerHTML(a, c);
  const bs = E.bossOf(S, a.city), K = E.AGR_KINDS[a.kind], head = `<b>${K.icon} ${K.name}</b> <span class="pill good">قائمة</span><div class="small muted">${cityTag(a.city)} · ${esc(bs.name)} · طرفك ${cityTag(a.home)}${a.goods ? ' · ' + gi(a.goods) + ' ' + esc(GD[a.goods].name) : ''}</div><div class="kv"><span>المتبقي</span><b>${a.left > 0 ? a.left : 0} من ${dayAr(a.total)}</b></div>${bar(Math.max(0, a.total - a.left), a.total, 'gold')}`;
  let body = '', btns = '<div class="row"><button class="sm" data-act="agrbreak" data-id="' + a.id + '">فسخ</button></div>';
  if (a.kind === 'salam') { body = `<div class="kv"><span>دفعتَ</span><b class="num">${fmt(a.cap)}</b></div><div class="kv"><span>تستلم</span><b class="num">${fmt(a.qty)} ${esc(GD[a.goods].name)} (استلمتَ ${fmt(a.got)})</b></div>`; btns = ''; }
  else if (a.kind === 'mud') { body = `<div class="kv"><span>رأس المال / قيمته اليوم</span><b class="num">${fmt(a.cap)} / ${fmt(a.val)}</b></div><div class="kv"><span>نسبة ربحك</span><b>${Math.round(a.share * 100)}٪</b></div>`; btns = `<div class="row"><button class="sm" data-act="agrbreak" data-id="${a.id}">سحب مبكر (فسخ وتصفية)</button></div>`; }
  else { const opts = E.INFLU.wakala.qty.filter(x => x <= a.room), cur = opts.includes(wkSel[a.id]) ? wkSel[a.id] : (opts[0] || 0); body = `<div class="kv"><span>عنده / وضعتَ / باع</span><b class="num">${fmt(a.stock)} / ${fmt(a.sent)} / ${fmt(a.sold)}</b></div><div class="kv"><span>عمولته</span><b>${Math.round(a.rate * 1000) / 10}٪ (أخذ ${fmt(a.fee)})</b></div>${opts.length ? `<div class="small muted">سلّمه من مخزنك أو قافلتك في ${esc(cityName(a.city))}:</div><div class="chips" style="margin:4px 0">${opts.map(x => `<button class="${x === cur ? 'on' : ''}" data-act="wkqty" data-id="${a.id}" data-q="${x}">${fmt(x)}</button>`).join('')}</div><div class="row"><button class="sm pri" data-act="wkgo" data-id="${a.id}" data-q="${cur}">سلّمه ${fmt(cur)}</button></div>` : ''}`; }
  return `<div class="card" data-agr="${a.id}">${head}${body}${a.why ? `<div class="small muted">${esc(a.why)}</div>` : ''}${btns}</div>`;
}
/* ---------- العقود الصناعية (036د): الاستصناع وتوريد المواد الخام وشراكة المصنع ---------- */
const PAYWORD = { full: 'كله الآن', inst: 'أربع دفعات', part: 'تعجيل 40٪ والباقي عند التسليم' }, MODEWORD = { supply: 'عقد توريد دوري', salam: 'سلم دوري' };
function mfgRowHTML(kind, bs, c) {
  const K = E.AGR_KINDS[kind], ch = finChoice(kind, lordCity), { s, ruled, gs, qs, shares, recipes } = ch, o = finOpts(kind, ch), why = E.finBlock(S, lordCity, kind, o);
  const chips = (arr, cur, act, lab, key) => `<div class="chips" style="margin:4px 0">${arr.map((x, i) => `<button class="${(key === 'i' ? i : x) === cur ? 'on' : ''}" data-act="${act}" data-k="${kind}" data-${key}="${key === 'i' ? i : x}">${lab(x, i)}</button>`).join('')}</div>`;
  let benefit, cost, dur, form = '';
  if (kind === 'ist') { const T = s.g && qs[s.qi] ? E.istTerms(S, lordCity, s.g, qs[s.qi], s.pay) : null; benefit = T ? 'سلعة مصنّعة بجودة ' + Math.round(T.q * 100) + '٪ تصل مخزنك، وإن تأخر الصانع عُوّضتَ بقدر الضرر الفعلي' : 'سلعة مصنّعة تصل مخزنك'; cost = T ? 'الثمن ' + fmt(Math.round(T.price)) + ' ريال (' + PAYWORD[s.pay] + ')' : 'ثمن معلوم'; dur = T ? dayAr(T.days) : '—'; }
  else if (kind === 'raw') { benefit = 'مواد لمصنعك بأسعار أخف بنحو ' + Math.round(E.rawCut(S, s.mode) * 100) + '٪ لكل دفعة، بلا التزام بدفعات قادمة'; cost = s.mode === 'salam' ? 'تدفع ثمن كل دفعة قبل تسلمها' : 'تقبل كل دفعة أو ترفضها بلا غرامة'; dur = dayAr(E.INFLU.raw.period * E.INFLU.raw.periods); }
  else { const rc = s.recipe ? E.RECIPES[s.recipe] : null, Kc = s.recipe ? E.partCost(S, s.home, s.recipe) : 0; benefit = 'الزعيم يدفع ' + Math.round(s.share * 100) + '٪ نقداً من كلفة المصنع، ويُقسَّم الربح والخسارة بقدر الحصص'; cost = Kc ? 'كلفة المصنع ' + fmt(Kc) + '، وتدفع أنت ' + fmt(Math.round(Kc * (1 - s.share))) : 'كلفة المصنع'; dur = dayAr(E.INFLU.part.days) + ' ثم تشتري حصته'; }
  if (ruled.length) form = `<div class="small muted">سوقك المحكوم (طرفك):</div>${chips(ruled, s.home, 'finhome', x => esc(cityName(x)), 'h')}`
    + (kind === 'part' ? `<div class="small muted">المصنع:</div>${chips(recipes, s.recipe, 'finrecipe', x => esc(E.RECIPES[x].name), 'r')}<div class="small muted">حصة الزعيم النقدية:</div>${chips(shares, s.share, 'finshare', x => Math.round(x * 100) + '٪', 's')}`
      : (kind === 'raw' ? `<div class="small muted">النمط:</div>${chips(['supply', 'salam'], s.mode, 'finmode', x => MODEWORD[x], 'm')}` : `<div class="small muted">الدفع:</div>${chips(['full', 'inst', 'part'], s.pay, 'finpay', x => PAYWORD[x], 'p')}`) + `<div class="small muted">السلعة:</div>${chips(gs, s.g, 'fingood', x => gi(x) + ' ' + GD[x].name, 'g')}<div class="small muted">${kind === 'raw' ? 'كمية الدفعة' : 'الكمية'}:</div>${chips(qs, s.qi, 'finqty', x => fmt(x), 'i')}`);
  const sign = `<div class="row" style="margin-top:6px"><button class="sm pri" data-act="finsign" data-k="${kind}" ${why ? 'disabled' : ''}>وقّع ${K.name}</button></div>${why ? `<div class="small dear">${esc(why)}</div>` : ''}`;
  return `<div class="card" data-agrrow="${kind}"><div class="row" style="margin:0"><b>${K.icon} ${K.name}</b></div><div class="small">${esc(K.desc)}</div><div class="small"><b>الفائدة:</b> ${benefit}</div><div class="kv"><span>المدة</span><b>${dur}</b></div><div class="small"><b>الكلفة:</b> ${cost}</div>${why ? `<div class="small"><b>الشرط الناقص:</b> <span class="dear">${esc(why)}</span></div>` : ''}${agrToggle(kind, `<div class="small"><b>ما تلتزم به:</b> ${K.obl}${K.note ? ' ' + K.note : ''}</div>${form}${sign}`)}</div>`;
}
function mfgLedgerHTML(a, c) {
  const bs = E.bossOf(S, a.city), K = E.AGR_KINDS[a.kind], head = `<b>${K.icon} ${K.name}</b> <span class="pill good">قائمة</span><div class="small muted">${cityTag(a.city)} · ${esc(bs.name)} · طرفك ${cityTag(a.home)}${a.goods ? ' · ' + gi(a.goods) + ' ' + esc(GD[a.goods].name) : ''}${a.recipe ? ' · ' + esc(E.RECIPES[a.recipe].name) : ''}</div><div class="kv"><span>المتبقي</span><b>${a.left > 0 ? a.left : 0} من ${dayAr(a.total)}</b></div>${bar(Math.max(0, a.total - a.left), a.total, 'gold')}`;
  let body = '', btns = '';
  if (a.kind === 'ist') body = `<div class="kv"><span>الثمن / دفعتَ</span><b class="num">${fmt(a.price)} / ${fmt(a.paid)}</b></div><div class="kv"><span>تستلم</span><b class="num">${fmt(a.qty)} ${esc(GD[a.goods].name)} بجودة ${Math.round(a.q * 100)}٪ (استلمتَ ${fmt(a.got)})</b></div>`;
  else if (a.kind === 'raw') { body = `<div class="kv"><span>النمط</span><b>${MODEWORD[a.mode]}</b></div>${a.pend ? `<div class="small muted">دفعات مدفوعة في الطريق: ${a.pend}</div>` : ''}`; if (a.batch) btns = `<div class="row"><button class="sm pri" data-act="rawacc" data-id="${a.id}">اقبل الدفعة (${fmt(a.batch.qty)} ${esc(GD[a.goods].name)} بـ ${lm(Math.round(a.batch.unit * a.batch.qty + a.batch.cust), S.cities[a.home])})</button><button class="sm" data-act="rawrej" data-id="${a.id}">ارفضها بلا غرامة</button></div>`; btns += `<div class="row"><button class="sm" data-act="agrbreak" data-id="${a.id}">فسخ</button></div>`; }
  else { body = `<div class="kv"><span>كلفة المصنع / حصة الزعيم</span><b class="num">${fmt(a.K)} / ${fmt(a.boss)} (${Math.round(a.share * 100)}٪)</b></div><div class="kv"><span>ربح المصنع حتى اليوم</span><b class="num ${a.pnl >= 0 ? 'good' : 'bad'}">${fmt(a.pnl)}</b></div><div class="kv"><span>تدفع لشراء حصته الآن</span><b class="num">${fmt(a.owed)}</b></div>`; btns = `<div class="row"><button class="sm pri" data-act="partbuy" data-id="${a.id}">اشترِ حصة الزعيم الآن</button></div>`; }
  return `<div class="card" data-agr="${a.id}">${head}${body}${a.why ? `<div class="small muted">${esc(a.why)}</div>` : ''}${btns}</div>`;
}
