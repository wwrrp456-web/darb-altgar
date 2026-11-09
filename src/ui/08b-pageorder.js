/* تنظيم الصفحات (033ب؛ ملاحظة بن محمود 27): القرار والحالة أولاً، والتفاصيل في القوائم المنسدلة، ولا حذف لبيانات ولا تقليل لعمق.
   مفتاح رجوع لكل شاشة في PAGEORD: false = السلوك القديم حرفياً. المتصفح الآلي بلا ?player=1 ولا ?fold=1 يرى التخطيط القديم (كما في foldAuto)، فاختبارات الوظائف القديمة لا تتأثر. */
const PAGEORD = { market: true, caravan: true, lords: true, academy: true, home: true };
const pgOn = k => !!(PAGEORD[k] && S && S.learn && S.learn.char && !foldAuto());
/* ---------- السوق ---------- */
// «كيف حُسب الربح؟» مفتوحة لأول صفقة للمبتدئ فقط (مستوى ≤ 2 ولم يربح بيعاً بعد)
const profitWhyOpen = () => { const L = S.learn; return !!(L && L.char && L.level <= 2 && !S.player.trades.some(t => t.side === 'sell' && t.pl > 0)); };
// بطاقة الصفقة المختصرة: السلعة، الوجهة، صافي الربح، المدة، زر التنفيذ؛ والكمية والتفاصيل في قائمة منسدلة
function dealRowHTML(o) {
  const key = 'd:' + o.g + ':' + o.d, q = clampQ(QS[key] == null ? o.q : QS[key], o.max), m = main(), here = m.city; let est = '', warn = '', profit = o.profit;
  const qb = live0(here) ? E.quoteBuy(S, here, o.g, q, E.buyBudget(S, here)) : null, so = qb && qb.n ? sellOptionsC(S, here, o.g, qb.n, qb.avg, m).find(x => x.city === o.d) : null;
  if (qb && qb.n) { est = `تدفع ≈ <b class="num">${fmt(qb.cost)}</b> ر.س`; if (so) profit = so.profit; }
  if (q >= o.max) warn = limNote(o.lim, E.curOf(S.cities[main().city].country));
  else if (q !== o.q && so && so.profit < o.profit * 0.9) warn = `<div class="qnote soft">الكمية الأنسب ${o.q} (ربح ${fmt(o.profit)})</div>`;
  const dk = 'dq_' + o.g + '_' + o.d, open = detOpen[dk] ? 'open' : '';
  return `<div class="card deal dealc" data-dealc="${o.g}:${o.d}"><div class="row" style="margin:0"><span style="font-size:30px">${gi(o.g)}</span><div style="flex:1;min-width:0"><b>${GD[o.g].name}</b> ← ${cityTag(o.d)}<div class="small muted">${dayAr(o.days)}${o.cus ? ' · جمارك ' + Math.round(o.cus * 100) + '٪' : ''}</div></div><div class="dealnet"><div class="small muted">صافي الربح</div><b class="${profit >= 0 ? 'cheap' : 'dear'} num">${profit >= 0 ? '+' : ''}${fmt(profit)}</b></div></div><button class="pri" data-act="dealgo" data-g="${o.g}" data-d="${o.d}" data-q="${q}" title="يشتري الكمية المختارة ثم يسافر">اشترِ ${q} وسافر</button><details class="mdet" data-dk="${dk}" ${open}><summary class="small">الكمية والتفاصيل</summary>${dealUnit(o)}${stepper(key, q, o.max)}<div class="small">${est}</div>${warn}</details></div>`;
}
let whyAuto = null;
function dealsNewHTML(dl) {
  const wd = 'whyprofit', auto = profitWhyOpen(), user = detOpen[wd] != null && detOpen[wd] !== whyAuto, open = user ? detOpen[wd] : auto; whyAuto = auto; // الفتح التلقائي لا يُحسب اختياراً للاعب
  return `<div class="grid g3" style="margin:8px 0 8px">${dl.slice(0, 3).map(dealRowHTML).join('')}</div><details class="mdet" data-dk="${wd}" ${open ? 'open' : ''}><summary><b>كيف حُسب الربح؟</b></summary><div class="card" style="margin:8px 0"><div class="small">ربح الوحدة = سعر بيعها هناك بعد الضريبة والجمارك − سعر شرائها هنا. صافي الربح = ربح الوحدة × الكمية − نفقة الطريق. افتح «الكمية والتفاصيل» في أي بطاقة لترى أرقام وحدتها.</div>${dl.length ? dealThink(dl[0]) : ''}</div></details>`;
}
// ملخص السوق بلا ما في الشريط العلوي (قافلتي ورصيدي): الناقص ومخزني فقط
function capStripNew(mi, c) {
  const m = mi.all;
  return `<div class="sumbar"><div class="m"><div class="small muted">📦 مخزني في ${esc(c.name)}</div>${mi.store.has ? `<b class="num">${fmt(mi.store.load)} / ${fmt(mi.store.cap)}</b>${bar(mi.store.load, Math.max(1, mi.store.cap), mi.store.free < mi.store.cap * 0.1 ? 'red' : '')}<div class="small muted">فارغ ${fmt(mi.store.free)} وزن</div>` : '<b>لا مخزن هنا</b><div class="small muted">ابنِ دكاناً ثم مخزناً من «العقارات»</div>'}</div><div class="m"><div class="small muted">🏬 كل مخازني</div><b class="num">${fmt(m.load)} / ${fmt(m.cap)}</b>${bar(m.load, Math.max(1, m.cap))}<div class="small muted">${m.rows.length} مدينة · فارغ ${fmt(m.free)}</div></div></div>`;
}
// «مراقبتي» و«طرقي المفضلة» في شاشة السوق (كانتا في المكتب؛ إزالتهما من المكتب في 033أ)
function marketToolsHTML() {
  const wl = watchOf();
  return favsHTML() + `<details class="mdet" data-dk="mkt_watch" ${(detOpen.mkt_watch != null ? detOpen.mkt_watch : wl.length) ? 'open' : ''}><summary><b>مراقبتي</b> <span class="small muted">(${wl.length}/${WATCH_MAX})</span></summary>${watchRows()}${watchForm()}</details>`;
}
/* ---------- الزعماء والعقود ---------- */
// العقد سطر (الفائدة، المدة، الكلفة) + «التفاصيل والتوقيع»؛ غير المتاحة مجموعة في سطر واحد بأسبابها
function pactOffersNewHTML(bs, c) {
  const rows = [], locked = [];
  for (const k of Object.keys(E.PACTS)) {
    const d = E.PACTS[k], tm = E.pactTerms(S, lordCity, k), why = E.pactBlock(S, lordCity, k);
    if (why) { locked.push({ k, d, why }); continue; }
    const cost = [tm.daily ? 'رسم يومي ' + lm(tm.daily, c) : '', tm.upfront ? 'دفعة مقدّمة ' + lm(tm.upfront, c) : '', tm.share ? 'حصة الزعيم ' + Math.round(tm.share * 100) + '٪ من إيراد الدكاكين' : ''].filter(Boolean).join(' · ') || 'بلا رسم',
      benefit = String(d.desc).split(/(?<=[.؟!])\s/)[0], dk = 'pact_' + k;
    rows.push(`<div class="card pactrow" data-pactrow="${k}"><div class="row" style="margin:0"><b>${pactIc(k)} ${d.name}</b>${tm.negotiated ? ' <span class="pill good">مخفَّض 20٪</span>' : ''}</div><div class="small">${benefit}</div><div class="kv"><span>المدة</span><b>${dayAr(tm.days)}</b></div><div class="kv"><span>الكلفة</span><b>${cost}</b></div><details class="mdet" data-dk="${dk}" ${detOpen[dk] ? 'open' : ''}><summary class="small"><b>التفاصيل والتوقيع</b></summary>${pactCardHTML(k, c)}</details></div>`);
  }
  const lk = locked.length ? `<details class="mdet" data-dk="pacts_locked" ${detOpen.pacts_locked ? 'open' : ''}><summary><b>${locked.length} ${locked.length === 1 ? 'عقد غير متاح' : 'عقود غير متاحة'} الآن: لماذا؟</b> <span class="small muted">${locked.map(x => esc(x.d.name)).join('، ')}</span></summary>${locked.map(x => `<div class="kv"><span>${pactIc(x.k)} ${esc(x.d.name)}</span><span class="small dear">${esc(x.why)}</span></div>`).join('')}</details>` : '';
  return `<h2>عروض ${esc(bs.name)}</h2><div class="grid g2">${rows.join('')}</div>${lk}`;
}
/* ---------- الأكاديمية: تبويبات الدروس | البطاقات | القاموس | المجلس ---------- */
const ACA_TABS = [['lessons', '🎓', 'الدروس'], ['cards', '🏺', 'البطاقات'], ['glossary', '📖', 'القاموس'], ['council', '📜', 'المجلس']];
function glossaryTabHTML() {
  const G = window.Glossary; if (!G) return '';
  const q = (ui.acaQ || '').trim(), terms = G.visible().filter(t => !q || t.name.includes(q) || t.term.includes(q));
  return `<h3 style="margin-top:12px">📖 قاموس التاجر <span class="pill">${terms.length}</span></h3><p class="small muted">اضغط مصطلحاً لتقرأ شرحه ومثاله.</p><div class="row mtools"><input id="acaQ" class="msearch" type="search" placeholder="ابحث عن مصطلح" value="${esc(q)}" aria-label="ابحث في القاموس"></div><div class="grid g2">${terms.map(t => `<div class="card"><span class="gl" data-act="gloss" data-gl="${t.id}" role="button" tabindex="0"><b>${esc(t.term)}</b></span><div class="small muted">${esc(t.name)}</div></div>`).join('')}</div>`;
}
function councilTabHTML() {
  const L = S.learn; let h = '';
  try { const mj = E.mjReady(S); if (mj && !L.eq.length) h += `<div class="card"><b>📜 مسألة جاهزة في مجلس السوق</b><div class="small muted">«${esc(mj.title)}»: افتحها متى شئت؛ فيها نفوذ وخبرة.</div><div class="row"><button class="btn pri" data-act="mjnow">افتح المسألة</button></div></div>`; } catch (e) {}
  h += fiqhBook();
  return h || '<div class="card small muted">يُفتح المجلس مع المستوى 4: مسائل من أسواق التجّار تقرأها وتختار فيها.</div>';
}
function academyTabs(h) {
  const parts = h.split('\u0001'), seg = { head: '', lessons: '', cards: '' }; let cur = 'head';
  parts.forEach((x, i) => { if (i % 2) cur = x; else seg[cur] += x; });
  if (!pgOn('academy')) return parts.filter((x, i) => i % 2 === 0).join('');
  const t = ACA_TABS.some(x => x[0] === ui.acaTab) ? ui.acaTab : 'lessons', body = t === 'lessons' ? seg.lessons : t === 'cards' ? seg.cards : t === 'glossary' ? glossaryTabHTML() : councilTabHTML();
  return seg.head + `<div class="chips acatabs" role="tablist" aria-label="أقسام الأكاديمية">${ACA_TABS.map(([id, ic, n]) => `<button role="tab" data-act="acatab" data-t="${id}" class="${t === id ? 'on' : ''}" aria-selected="${t === id}">${ic} ${n}</button>`).join('')}</div>` + body;
}
