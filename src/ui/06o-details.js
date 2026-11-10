/* ---------- 037ب مكوّنات التفاصيل: dchip (شارة) · dsheet (نافذة سفلية) · ask (بطاقة «المطلوب») · askFrom (مولّد البطاقات من إجراءات المحرك القائمة) ----------
   لا تُطبَّق على الشاشات الحية (037ج): تُعرض في صفحة الاختبار الداخلية خلف ?details=1 فقط.
   DETAILS.on=false: لا تُرسم المكوّنات ولا صفحة الاختبار، وتبقى القوائم القديمة حرفياً.
   اكتمال البطاقة يُشتق من حالة اللعبة (لا زرّ يدوي) فلا يلزم حفظه؛ الوحيد المحفوظ اختيارياً: ui.dsnooze (تأجيل مؤقت). */
const DETAILS = { on: true, page: /[?&]details=1/.test(location.search), delay: 1200, max: 3 };
const dsh = { domain: null, open: null, chosen: {}, timers: {} };
const dIc = n => (window.GameIcons ? GameIcons.iconHTML(n) : '');
const dLabel = n => (window.GameIcons && GameIcons.named[n] ? GameIcons.named[n].label : '');

/* شارة: أيقونة + اسم ظاهر دائماً + رقم اختياري (>=44px، وaria-label بالاسم وما ينتظر) */
function dchip(c) {
  if (!DETAILS.on) return '';
  const n = c.count == null ? null : c.count, name = c.name || dLabel(c.icon);
  const aria = name + (n == null ? '' : n ? ': ' + n + ' مطلوب' : ': لا شيء ينتظرك');
  return `<button type="button" class="dchip" data-dchip="${esc(c.id)}" aria-expanded="${dsh.domain === c.id}" aria-label="${esc(aria)}">${n == null ? '' : `<span class="dbadge${n ? '' : ' zero'}">${n || '✓'}</span>`}${dIc(c.icon)}<span class="dnm">${esc(name)}</span></button>`;
}

/* بطاقة «المطلوب»: {id, icon, title, why, opts:[{id,icon,title,effect,act,best?,off?}], state, prio, res?} */
function ask(card, openId) {
  if (!DETAILS.on) return '';
  const done = card.state === 'done', open = !done && openId === card.id;
  const opts = (card.opts || []).map(o => {
    const off = !!o.off, why = off ? (typeof o.off === 'string' ? o.off : '') : (o.effect || '');
    return `<button type="button" class="dopt${o.best ? ' best' : ''}" data-dopt="${esc(card.id)}" data-oid="${esc(o.id)}" ${off ? 'disabled aria-disabled="true"' : ''}>${dIc(o.icon)}<span class="dot">${esc(o.title || dLabel(o.icon))}</span>${o.best ? '<span class="drec">مقترح</span>' : ''}<span class="dos">${esc(why)}</span></button>`;
  }).join('');
  return `<div class="dask${done ? ' done' : ''}${open ? ' open' : ''}${card.gone ? ' gone' : ''}" data-dask="${esc(card.id)}" data-state="${done ? 'done' : 'open'}"><button type="button" class="dhd" data-dhd="${esc(card.id)}" aria-expanded="${open}" ${done ? 'disabled' : ''}>${dIc(card.icon)}<span class="dt">${esc(card.title)}</span><span class="dcaret" aria-hidden="true">▾</span><span class="dw">${esc(card.why || '')}</span></button><div class="dopts">${opts}</div>${card.res ? `<div class="dres">${esc(card.res)}</div>` : ''}</div>`;
}

/* ---- مولّد البطاقات: إجراءات المحرك القائمة فقط؛ كل بطاقة تُحسب من الحالة الحالية ---- */
const dSnoozed = id => !!(ui.dsnooze && ui.dsnooze[id] != null && S.day < ui.dsnooze[id]);
const dNoSteward = 'وظّف أمين المنطقة أولاً';
function dDelegate(city, flag, title) {
  const m = E.stewardOf(S, city), o = { id: 'delegate', icon: 'ui-delegate', title: title || dLabel('ui-delegate') };
  if (!m) return { ...o, off: dNoSteward };
  if (m.policy && m.policy[flag]) return null; // مفوَّض فعلاً
  if (!m.policy || !(m.policy.limit > 0)) return { ...o, off: 'حدّد تفويض الأمين وحدّه اليومي من بطاقته أولاً' };
  return { ...o, effect: 'يتولاه الأمين ضمن حدّه اليومي', act: () => A.setStewardPolicy(S, city, { ...m.policy, [flag]: true }) };
}
function dPostpone(id, days) { return { id: 'postpone', icon: 'ui-postpone', title: dLabel('ui-postpone'), effect: 'يختفي من المطلوب ' + dayAr(days) + ' ويبقى كما هو', act: () => { ui.dsnooze = ui.dsnooze || {}; ui.dsnooze[id] = S.day + days; saveUi(); return { ok: true, msg: 'أُجّل ' + dayAr(days) }; } }; }
const dShopCities = () => (S.order || Object.keys(S.cities || {})).filter(id => S.player.props[id] && E.shopsOf(S, id).length);
function dShopCards() {
  const out = [], P = S.player;
  for (const city of dShopCities()) {
    const pr = P.props[city], cn = S.cities[city].name, shops = E.shopsOf(S, city);
    const low = []; shops.forEach(sh => sh.items.forEach(it => { if ((pr.store[it.g] || 0) < it.target * 0.5 && low.indexOf(it.g) < 0) low.push(it.g); }));
    if (low.length && S.phase >= 2) {
      const id = 'restock:' + city, car = S.caravans && S.caravans.find(c => c.city === city && !(c.left > 0) && low.some(g => (c.cargo[g] || 0) >= 1)), opts = [];
      opts.push({ id: 'buy', icon: 'ui-restock', title: 'اشترِ من السوق وعبّئ', effect: 'من أسواق مدنك دون المساس بالاحتياطي التشغيلي', best: true, act: () => A.officeRestock(S, city) });
      if (car) { const g = low.find(x => (car.cargo[x] || 0) >= 1); opts.push({ id: 'tostore', icon: 'icons/cart', title: 'أودع حمولة القافلة في المخزن', effect: GD[g].name + ' من القافلة الواقفة هنا', act: () => A.toStore(S, car.id, g, Math.floor(car.cargo[g])) }); }
      const dl = dDelegate(city, 'restock', 'كلّف الأمين بالتعبئة'); if (dl) opts.push(dl);
      out.push({ id, icon: 'ui-shops', title: 'دكاكين ' + cn + ' تنقصها بضاعة', why: low.slice(0, 3).map(g => GD[g].name).join('، '), opts, state: 'open', prio: 3 });
    }
    if (S.phase >= 2 && E.sellerPts(S, city) + 1e-9 < E.sellerNeed(S, city)) {
      const id = 'seller:' + city, pool = E.hirePool(S, city), opts = [{ id: 'hire', icon: 'ui-hire', title: 'وظّف بائعاً', effect: pool < 1 ? 'قد يستبدل عاملاً متأخر الأجر' : 'يتوفر ' + pool + ' عامل في المدينة', best: true, act: () => A.hireStaff(S, city, 'seller') }];
      out.push({ id, icon: 'ui-workers', title: 'دكاكين ' + cn + ' تحتاج بائعاً', why: 'الطاقم أقل من حاجة الدكاكين', opts, state: 'open', prio: 2 });
    }
    shops.forEach(sh => {
      if (sh.items.length) return;
      const id = 'empty:' + city + ':' + sh.id, g = A.shopQuickPick(S, city, sh.id), opts = [];
      if (g) opts.push({ id: 'quick', icon: 'ui-swap', title: 'اختر سلعة مناسبة', effect: 'الأنسب الآن: ' + GD[g].name, best: true, act: () => A.shopQuick(S, city, sh.id) });
      else opts.push({ id: 'quick', icon: 'ui-swap', title: 'اختر سلعة مناسبة', off: 'لا سلعة مناسبة الآن' });
      out.push({ id, icon: 'ui-shops', title: 'دكان في ' + cn + ' بلا سلعة', why: 'لا شيء يُباع فيه', opts, state: 'open', prio: 4 });
    });
  }
  return out;
}
function dMoneyCards() {
  const out = [];
  (S.paymentDues || []).filter(d => d && d.amount > 0).forEach(d => {
    const id = 'pay:' + d.id, gold = S.player.gold, opts = [];
    opts.push(gold + 1e-9 >= d.amount ? { id: 'pay', icon: 'ui-pay', title: 'ادفع الآن', effect: 'من رصيدك · يبقى ' + fmt(gold - d.amount) + ' ريال', best: true, act: () => A.settlePayment(S, d.id) } : { id: 'pay', icon: 'ui-pay', title: 'ادفع الآن', off: 'رصيدك لا يكفي' });
    if (d.city && S.player.props[d.city]) { const dl = dDelegate(d.city, 'pay', 'كلّف الأمين بالسداد'); if (dl) opts.push(dl); }
    opts.push(dPostpone(id, 7));
    out.push({ id, icon: 'ui-expenses', title: d.label || 'مستحق', why: fmt(d.amount) + ' ريال · منذ ' + dayAr(Math.max(0, S.day - (d.since || S.day))), opts, state: 'open', prio: 1 });
  });
  return out;
}
const dDomains = {
  shops: { icon: 'ui-shops', name: 'الدكاكين', gen: dShopCards },
  money: { icon: 'ui-expenses', name: 'المصاريف', gen: dMoneyCards }
};
function askFrom(domain) {
  const d = dDomains[domain]; if (!DETAILS.on || !d || !S || !S.player) return [];
  let cards = []; try { cards = d.gen(); } catch (e) { cards = []; }
  return cards.filter(c => !dSnoozed(c.id)).sort((a, b) => a.prio - b.prio);
}

/* ---- النافذة السفلية: واحدة فقط في كل مرة؛ تُغلق بـ✕ والخلفية والسحب لأسفل وEsc ---- */
function dsheet() {
  if (!DETAILS.on || !dsh.domain) return '';
  const d = dDomains[dsh.domain], live = askFrom(dsh.domain), liveIds = new Set(live.map(c => c.id));
  const doneCards = Object.keys(dsh.chosen).filter(id => !liveIds.has(id)).map(id => ({ ...dsh.chosen[id].card, state: 'done', res: dsh.chosen[id].res, gone: dsh.chosen[id].gone }));
  const shown = live.slice(0, DETAILS.max), more = live.length - shown.length;
  const body = (!live.length && !doneCards.length) ? '<div class="dempty">لا شيء ينتظرك، تجارتك تسير ✓</div>' : doneCards.map(c => ask(c)).join('') + shown.map(c => ask(dsh.chosen[c.id] ? { ...c, res: dsh.chosen[c.id].res } : c, dsh.open)).join('') + (more > 0 ? `<div class="dmore">+ ${more} أخرى</div>` : '');
  return `<div class="dscrim on" data-dscrim></div><div class="dsheet on" id="dsheet" role="dialog" aria-modal="true" aria-label="${esc(d.name)}"><div class="dgrab"></div><div class="dshead">${dIc(d.icon)}<div><h3>${esc(d.name)}</h3><p>المطلوب منك الآن</p></div><button type="button" class="dx" data-dclose aria-label="إغلاق">✕</button></div><div id="dbody">${body}</div></div>`;
}
function dLab() { // صفحة الاختبار الداخلية
  if (!DETAILS.on || !DETAILS.page) return '';
  const chips = Object.keys(dDomains).map(k => dchip({ id: k, icon: dDomains[k].icon, count: askFrom(k).length })).join('');
  return `<div class="dlab" id="dlab"><h1>تفاصيل عقاراتك (تجربة)</h1><div class="dchips" role="group" aria-label="تفاصيل عقاراتك">${chips}</div></div><div id="dsheetHost">${dsheet()}</div>`;
}
function dRender() {
  let host = document.getElementById('dlabRoot');
  if (!DETAILS.on || !DETAILS.page) { if (host) host.innerHTML = ''; return; }
  if (!S || !S.player) return;
  if (!host) { host = document.createElement('div'); host.id = 'dlabRoot'; document.body.appendChild(host); }
  host.innerHTML = dLab(); try { GameIcons.paint(host); } catch (e) {}
}
function dClose() { dsh.domain = null; dsh.open = null; dRender(); }
function dOpen(domain) {
  if (!DETAILS.on || !dDomains[domain]) return;
  if (dsh.domain === domain) return dClose();
  dsh.domain = domain; dsh.chosen = {}; Object.values(dsh.timers).forEach(clearTimeout); dsh.timers = {};
  const first = askFrom(domain)[0]; dsh.open = first ? first.id : null; dRender();
  const sh = document.getElementById('dsheet'); if (sh) sh.scrollTop = 0;
}
function dToggle(id) { dsh.open = dsh.open === id ? null : id; dRender(); }
function dChoose(id, oid) {
  const card = askFrom(dsh.domain).find(c => c.id === id), o = card && card.opts.find(x => x.id === oid);
  if (!o || o.off || !o.act) return null;
  const r = o.act(); act(r);
  if (!r || r.ok === false) { dRender(); return r; }
  const was = dsh.chosen[id]; dsh.chosen[id] = { card, res: (r && r.msg) || o.title, gone: false };
  dsh.open = null; dRender();
  clearTimeout(dsh.timers[id]);
  dsh.timers[id] = setTimeout(() => { if (!dsh.chosen[id]) return; dsh.chosen[id].gone = true; dRender(); dsh.timers[id] = setTimeout(() => { delete dsh.chosen[id]; const nx = dsh.domain && askFrom(dsh.domain).find(c => !dsh.chosen[c.id]); if (dsh.open == null && nx) dsh.open = nx.id; dRender(); }, DETAILS.delay ? 320 : 0); }, DETAILS.delay);
  return r;
}
document.addEventListener('click', ev => {
  if (!DETAILS.on || !DETAILS.page) return; const t = ev.target.closest && ev.target.closest('[data-dchip],[data-dhd],[data-dopt],[data-dclose],[data-dscrim]'); if (!t) return;
  if (t.dataset.dchip) dOpen(t.dataset.dchip); else if (t.dataset.dhd) dToggle(t.dataset.dhd); else if (t.dataset.dopt) dChoose(t.dataset.dopt, t.dataset.oid); else dClose();
});
document.addEventListener('keydown', ev => { if (DETAILS.on && DETAILS.page && ev.key === 'Escape' && dsh.domain) dClose(); });
(function () { let y0 = null; document.addEventListener('touchstart', ev => { y0 = ev.target.closest && ev.target.closest('#dsheet') ? ev.touches[0].clientY : null; }, { passive: true });
  document.addEventListener('touchend', ev => { const sh = document.getElementById('dsheet'); if (y0 != null && sh && ev.changedTouches[0].clientY - y0 > 70 && sh.scrollTop <= 0) dClose(); y0 = null; }, { passive: true }); })();
