/* ---------- 037ب مكوّنات التفاصيل: dchip (شارة) · dsheet (نافذة سفلية) · ask (بطاقة «المطلوب») · askFrom (مولّد البطاقات من إجراءات المحرك القائمة) ----------
   لا تُطبَّق على الشاشات الحية (037ج): تُعرض في صفحة الاختبار الداخلية خلف ?details=1 فقط.
   DETAILS.on=false: لا تُرسم المكوّنات ولا صفحة الاختبار، وتبقى القوائم القديمة حرفياً.
   اكتمال البطاقة يُشتق من حالة اللعبة (لا زرّ يدوي) فلا يلزم حفظه؛ الوحيد المحفوظ اختيارياً: ui.dsnooze (تأجيل مؤقت). */
/* 037ج: التطبيق على الشاشات. DETAILS.apply مفاتيح فرعية لكل مجال؛ DETAILS.on=false يعيد القوائم القديمة حرفياً.
   اتفاقية وضع الاختبار (كـfoldAuto): المتصفح الآلي بلا ?player=1 ولا ?details=1 يرى القوائم القديمة فتبقى اختبارات الوظائف كما هي؛ اللاعب الحقيقي و?player=1 و?details=1 يرون المكوّنات. ?details=lab صفحة التجربة الداخلية. */
const DETAILS = { on: !/[?&]details=off/.test(location.search), page: /[?&]details=lab/.test(location.search), delay: 1200, max: 3, apply: { fold: true, money: true, team: true, shops: true, market: true, mine: true, raw: true } };
const dLive = () => { try { return DETAILS.on && (PLAYER || !navigator.webdriver || /[?&]details=(1|lab)/.test(location.search)); } catch (e) { return DETAILS.on; } };
const dApply = a => dLive() && DETAILS.apply[a] !== false;
const dsh = { domain: null, open: null, chosen: {}, timers: {}, inSheet: false, folds: {} };
const dPlain = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
/* أيقونة المجال لكل قسم قابل للطيّ بحسب مفتاحه (أسماء السجل فقط) */
const DETAIL_MAP = [[/^hs-ledger/, 'icons/ledger'], [/^hs-shops/, 'ui-shops'], [/^hs-riv/, 'icons/target'], [/^hs-tasks/, 'ui-tasks'], [/^hs-council/, 'ui-delegate'], [/^hs-fund/, 'ui-expenses'], [/^(of-|est-office|mgmt-)/, 'ui-expenses'], [/^(est-team|est-staff|sk-)/, 'ui-workers'], [/^est-obl/, 'icons/ledger'], [/^est-(farm|farmbuild)/, 'icons/sprout'], [/^(est-xfer|est-shop|est-store)/, 'ui-shops'], [/^raw:.*(chj|academy|learn)/, 'icons/academy'], [/^raw:.*pact/, 'icons/pact'], [/^mine/, 'icons/target'], [/^assets-/, 'ui-sell'], [/^deal-/, 'icons/cart'], [/^mk-/, 'nav/market'], [/^car-/, 'nav/caravan'], [/^cities-/, 'icons/ship'], [/^academy-/, 'icons/academy'], [/^lord-/, 'nav/lords'], [/^home-story/, 'icons/book']];
const dFoldIcon = key => { for (const m of DETAIL_MAP) if (m[0].test(key)) return m[1]; return 'icons/book'; };
function dMainChips() { /* صف شارات المطلوب في العقارات: الدكاكين والعمّال والمصاريف (عدد ما ينتظرك من الحالة) */
  const ks = ['shops', 'workers', 'money', 'liq'].filter(k => k !== 'liq' || (E.liqView(S) && E.liqView(S).dep > 0)).filter(k => k !== 'shops' || dApply('shops')).filter(k => k !== 'workers' || dApply('team')).filter(k => k !== 'money' || dApply('money'));
  return ks.length ? `<div class="dchips-main" role="group" aria-label="المطلوب منك">${ks.map(k => dchip({ id: k, icon: dDomains[k].icon, count: askFrom(k).length })).join('')}</div>` : '';
}
/* قسم طيّ يتحول إلى صف شارة يفتح نافذة بمحتواه نفسه (لا حذف بيانات)؛ داخل النافذة تبقى الأقسام المتداخلة قوائم عادية فلا قائمة داخل قائمة بصرياً */
function dchipRow(key, def, sum, icon) {
  const name = dPlain(sum), label = String(sum).replace(/^\s*(<b>)?\s*\p{Extended_Pictographic}\uFE0F?\s*/u, '$1');
  return `<button type="button" class="dchip dchip-row${def ? ' attn' : ''}" data-dchip="fold:${esc(key)}" aria-expanded="${dsh.domain === 'fold:' + key}" aria-label="${esc(name)}">${dIc(icon || dFoldIcon(key))}<span class="dnm">${label}</span><span class="dgo" aria-hidden="true">›</span></button>`;
}
function dfold(key, def, sum, body) {
  if (dsh.inSheet || !dApply('fold')) return null;
  dsh.folds[key] = { sum, body, def: !!def };
  const pre = key === 'est-office' ? dMainChips() : '';
  return pre + dchipRow(key, def, sum);
}
/* شارة بنافذة ذات تبويبات: tabs=[{id,label,html}] (قوائمي، اقرأ…) */
function dfoldTabs(key, sum, tabs, def, icon) {
  if (dsh.inSheet || !tabs.length) return null;
  dsh.folds[key] = { sum, tabs, def: !!def, tab: null };
  return dchipRow(key, def, sum, icon);
}
/* «قوائمي»: طرقي المفضلة ومراقبتي ومسيرتي بالتواريخ في شارة واحدة بدل ثلاث قوائم (لا فقد لوظيفة) */
function dMine() {
  if (!dApply('mine')) return '';
  const f = favsHTML(true), wl = watchOf(), tl = timelineHTML(true), tabs = [{ id: 'favs', label: `طرقي المفضلة (${f.n}/${f.max})`, html: f.body }, { id: 'watch', label: `مراقبتي (${wl.length}/${WATCH_MAX})`, html: watchRows() + watchForm() }];
  if (tl) tabs.push({ id: 'tl', label: `مسيرتي بالتواريخ (${tl.n})`, html: tl.body });
  return dfoldTabs('mine', '<b>قوائمي</b>', tabs, false, 'icons/target') || '';
}
/* بقية القوائم الخام في الشاشة (قراءة وتعليم وتعليمات…) تتحول بعد الرسم إلى شارة بنافذة؛ ما بين أشقاء متتالين يصير شارة واحدة بتبويبات. السجلات الطويلة تبقى قوائم. المحتوى يُنقل كما هو حرفاً. */
const D_KEEP = /سجل أفعال|كشف المدفوعات|لقطات|مدن العالم|مدن الدولة|سنوات|مراحل المسيرة|متأخرات|تقارير رئيس/;
let dRawN = 0;
function dRaw(root, tag) {
  if (!root || !dApply('raw') || dsh.inSheet || (typeof screen !== 'undefined' && screen === 'lords' && root.id === 'screen')) return;
  const sumOf = d => d.querySelector(':scope > summary'), skip = d => d.classList.contains('ixd') || d.classList.contains('chj-node') /* عقد رحلة المراحل شجرة واحدة بحالات (الحالي مميز) فتبقى */ || d.dataset.dk === 'deals' /* أفضل الصفقات: المحتوى الرئيسي يبقى قائمة */ || d.classList.contains('more') || d.parentElement.closest('details,#dsheet,[data-keep-details]') || (sumOf(d) && D_KEEP.test(sumOf(d).textContent)) || !sumOf(d);
  const list = [...root.querySelectorAll('details')].filter(d => !skip(d)), done = new Set(); let n = 0;
  for (const d of list) {
    if (done.has(d) || !d.isConnected) continue;
    const run = [d]; let nx = d.nextElementSibling; while (nx && list.includes(nx)) { run.push(nx); done.add(nx); nx = nx.nextElementSibling; }
    const key = 'raw:' + (tag || root.id || 'x') + ':' + (n++), bodyOf = x => { const c = x.cloneNode(true); const sm = c.querySelector(':scope > summary'); if (sm) sm.remove(); return c.innerHTML; }, attn = run.some(x => x.open);
    let chip;
    if (run.length === 1) { dsh.folds[key] = { sum: sumOf(d).innerHTML, body: bodyOf(d), def: attn }; chip = dchipRow(key, attn, sumOf(d).innerHTML, dFoldIcon(key + ' ' + (d.dataset.fold || d.dataset.dk || ''))); }
    else {
      let hd = run[0].previousElementSibling; while (hd && !/^H[1-6]$/.test(hd.tagName)) hd = hd.previousElementSibling; const on = !hd && run[0].parentElement.querySelector('.chips button.on'), name = hd ? dPlain(hd.textContent) : on ? dPlain(on.textContent) : 'التفاصيل';
      const tabs = run.map((x, i) => { const sm = sumOf(x); return { id: 't' + i, label: (sm.getAttribute('aria-label') || dPlain(sm.innerHTML)).slice(0, 34), html: bodyOf(x) }; });
      dsh.folds[key] = { sum: '<b>' + esc(name) + '</b>', tabs, def: attn }; chip = dchipRow(key, attn, '<b>' + esc(name) + '</b>', dFoldIcon(key + ' ' + (d.dataset.fold || d.dataset.dk || '')));
    }
    const holder = document.createElement('div'); holder.className = 'dchip-hold'; holder.innerHTML = chip; d.replaceWith(holder); run.slice(1).forEach(x => x.remove());
  }
}
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
    return `<button type="button" class="dopt${o.best ? ' best' : ''}${o.on ? ' on' : ''}"${o.on ? ' aria-pressed="true"' : ''} data-dopt="${esc(card.id)}" data-oid="${esc(o.id)}" ${off ? 'disabled aria-disabled="true"' : ''}>${dIc(o.icon)}<span class="dot">${esc(o.title || dLabel(o.icon))}</span>${o.best ? '<span class="drec">مقترح</span>' : ''}<span class="dos">${esc(why)}</span></button>`;
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
const dDueTitle = d => { const l = String(d.label || 'مستحق'), cn = S.cities[d.city] ? S.cities[d.city].name : 'في الطريق'; return (/^(أجر|أجور|إيجار|صيانة)/.test(l) ? l : d.kind === 'staff' ? 'أجر ' + l : l) + ' · ' + cn; };
function dMoneyCards() {
  const out = [];
  (S.paymentDues || []).filter(d => d && d.amount > 0).forEach(d => {
    const id = 'pay:' + d.id, gold = S.player.gold, opts = [];
    opts.push(gold + 1e-9 >= d.amount ? { id: 'pay', icon: 'ui-pay', title: 'ادفع الآن', effect: 'من رصيدك · يبقى ' + fmt(gold - d.amount) + ' ريال', best: true, act: () => A.settlePayment(S, d.id) } : { id: 'pay', icon: 'ui-pay', title: 'ادفع الآن', off: 'رصيدك لا يكفي' });
    if (d.city && S.player.props[d.city]) { const dl = dDelegate(d.city, 'pay', 'كلّف الأمين بالسداد'); if (dl) opts.push(dl); }
    opts.push(dPostpone(id, 7));
    out.push({ id, icon: 'ui-expenses', title: dDueTitle(d), why: fmt(d.amount) + ' ريال · منذ ' + dayAr(Math.max(0, S.day - (d.since || S.day))), opts, state: 'open', prio: 1 });
  });
  return out;
}
function dWorkerCards() {
  const out = [];
  if (!(E.TEAM && S.phase >= E.TEAM.minPhase)) return out;
  for (const city of Object.keys(S.player.props)) {
    const pr = S.player.props[city]; if (!pr || (pr.mgr && pr.mgr.rank)) continue;
    const assets = E.teamAssets(S, city); let hit = null;
    for (const w of (pr.staff || [])) { for (const a of assets) { const q = E.promotionQuote(S, city, w.id, a.kind, a.id); if (q.ok) { hit = { w, a, q }; break; } } if (hit) break; }
    if (!hit) continue;
    const id = 'promote:' + city + ':' + hit.w.id, cn = S.cities[city].name, wn = E.WK[hit.w.role].name;
    out.push({ id, icon: 'ui-workers', title: wn + ' في ' + cn + ' يستحق الترقية', why: 'خدم ' + dayAr(hit.w.days) + ' ويصلح مديراً لـ' + hit.a.label, state: 'open', prio: 2,
      opts: [{ id: 'promote', icon: 'ui-promote', title: 'رقِّه إلى مدير ' + hit.a.label, effect: 'أجره ' + hit.q.wage + ' ريال يومياً · يترك وظيفته الحالية', best: true, act: () => { if (!confirm('ترقية العامل إلى مدير ' + hit.q.asset.label + ' بأجر ' + hit.q.wage + ' ريال يومياً؟ سيترك وظيفته الحالية؛ راجع حاجة الطاقم.')) return { ok: false, msg: 'لم تتم الترقية' }; return A.hireManager(S, city, 1, hit.w.id, hit.a.kind, hit.a.id); } }, dPostpone(id, 7)] });
  }
  return out;
}
function dSkillExtra() { /* بطاقات الكفاءة (035أ) لكل عمّالك ومدرائك في شارة واحدة بدل قائمة لكل عامل */
  if (!E.SKILL.on) return '';
  const rows = [];
  for (const city of Object.keys(S.player.props)) { const pr = S.player.props[city]; if (!pr) continue;
    (pr.staff || []).filter(w => w.sk).forEach(w => rows.push(`<div class="dskill"><div class="small muted">${esc(S.cities[city].name)}</div>${skillCardHTML(w, E.WK[w.role].name)}</div>`));
    if (pr.mgr && pr.mgr.sk) rows.push(`<div class="dskill"><div class="small muted">${esc(S.cities[city].name)}</div>${skillCardHTML(pr.mgr, 'مدير')}</div>`); }
  return rows.length ? `<h4 class="dsec">الكفاءة</h4>${rows.join('')}` : '';
}
function dLiqCards() {
  const v = E.liqView(S), out = []; if (!v || v.dep <= 0) return out;
  if (v.low) {
    const d0 = v.deposits[0], miss = Math.max(0, v.need - v.cash), amt = d0 ? Math.min(d0.amt, Math.ceil(miss)) : 0, opts = [];
    opts.push(d0 && amt > 0 ? { id: 'draw', icon: 'ui-pay', title: 'اسحب ' + fmt(amt) + ' من وديعة ' + cityName(d0.city) + ' الآن', effect: 'رسم ' + Math.round(E.LIQ.fee * 100) + '٪ · يصلك ' + fmt(amt * (1 - E.LIQ.fee)) + ' ريال', best: true, act: () => A.liqDraw(S, d0.city, amt) } : { id: 'draw', icon: 'ui-pay', title: 'اسحب من الوديعة', off: 'لا وديعة تُسحب' });
    opts.push({ id: 'stale', icon: 'ui-shops', title: 'بِع بضاعة راكدة', off: 'افتح الدكان واختر بيع الراكد، أو وظّف ناظر الديوان ليبيعه' });
    if (!v.pol.cover) opts.push({ id: 'policy', icon: 'ui-delegate', title: 'اتركه للسياسة', effect: 'يفعّل السحب التلقائي لسداد التزاماتك', act: () => A.liqSet(S, 'cover', true) });
    else if (S.player.diwan) opts.push({ id: 'dw', icon: 'ui-delegate', title: 'اتركه للناظر', effect: 'ينفّذ ناظر الديوان السحب ويُخبرك', act: () => A.diwanRule(S, 'draw', 'exec') });
    else opts.push({ id: 'policy', icon: 'ui-delegate', title: 'اتركه للسياسة', off: 'السحب التلقائي مفعّل أصلاً؛ يسحب عند العجز بحدّ ' + Math.round(v.pol.monthMax * 100) + '٪ شهرياً' });
    out.push({ id: 'liq:low', icon: 'ui-expenses', title: 'سيولتك تكفي ' + liqDaysTxt(v) + ' فقط', why: 'النقد ' + fmt(v.cash) + ' والتزامات ' + E.LIQ.horizon + ' يوماً ' + fmt(v.need) + ' ريال', opts, state: 'open', prio: 1 });
  }
  return out;
}
const dDomains = {
  liq: { icon: 'ui-expenses', name: 'السيولة', gen: dLiqCards, extra: () => liqBodyHTML() },
  shops: { icon: 'ui-shops', name: 'الدكاكين', gen: dShopCards },
  money: { icon: 'ui-expenses', name: 'المصاريف', gen: dMoneyCards, sub: 'تبقى المتأخرات هنا حتى لو غادر العامل أو تركت المكان' },
  workers: { icon: 'ui-workers', name: 'العمّال', gen: dWorkerCards, extra: dSkillExtra }
};
const dDomain = k => { if (dDomains[k]) return dDomains[k]; const f = typeof k === 'string' && k.startsWith('fold:') && dsh.folds[k.slice(5)]; return f ? { icon: dFoldIcon(k.slice(5)), name: dPlain(f.sum), fold: f, gen: () => [] } : null; };
function askFrom(domain) {
  const d = dDomains[domain]; if (!DETAILS.on || !d || !S || !S.player) return [];
  let cards = []; try { cards = d.gen(); } catch (e) { cards = []; }
  return cards.filter(c => !dSnoozed(c.id)).sort((a, b) => a.prio - b.prio);
}

/* ---- النافذة السفلية: واحدة فقط في كل مرة؛ تُغلق بـ✕ والخلفية والسحب لأسفل وEsc ---- */
function dsheet() {
  if (!DETAILS.on || !dsh.domain) return '';
  const d = dDomain(dsh.domain); if (!d) return ''; const live = d.fold ? [] : askFrom(dsh.domain), liveIds = new Set(live.map(c => c.id));
  const doneCards = Object.keys(dsh.chosen).filter(id => !liveIds.has(id)).map(id => ({ ...dsh.chosen[id].card, state: 'done', res: dsh.chosen[id].res, gone: dsh.chosen[id].gone }));
  const shown = live.slice(0, DETAILS.max), more = live.length - shown.length;
  const foldBody = d.fold ? (() => { dsh.inSheet = true; try { const f = d.fold; if (f.tabs) { const cur = f.tabs.find(t => t.id === dsh.tab) || f.tabs[0]; return (f.tabs.length > 1 ? `<div class="dtabs" role="tablist">${f.tabs.map(t => `<button type="button" role="tab" class="dtab" data-dstab="${esc(t.id)}" aria-selected="${t.id === cur.id}">${esc(t.label)}</button>`).join('')}</div>` : '') + `<div role="tabpanel">${cur.html}</div>`; } return typeof f.body === 'function' ? f.body() : f.body; } finally { dsh.inSheet = false; } })() : null;
  const cardsHTML = (!live.length && !doneCards.length) ? '<div class="dempty">لا شيء ينتظرك، تجارتك تسير ✓</div>' : doneCards.map(c => ask(c)).join('') + shown.map(c => ask(dsh.chosen[c.id] ? { ...c, res: dsh.chosen[c.id].res } : c, dsh.open)).join('') + (more > 0 ? `<div class="dmore">+ ${more} أخرى</div>` : '');
  const body = d.fold ? foldBody : cardsHTML + (d.extra ? d.extra() : '');
  return `<div class="dscrim on" data-dscrim></div><div class="dsheet on" id="dsheet" role="dialog" aria-modal="true" aria-label="${esc(d.name)}"><div class="dgrab"></div><div class="dshead">${dIc(d.icon)}<div><h3>${esc(d.name)}</h3>${d.fold ? '' : `<p>${esc(d.sub || 'المطلوب منك الآن')}</p>`}</div><button type="button" class="dx" data-dclose aria-label="إغلاق">✕</button></div><div id="dbody">${body}</div></div>`;
}
function dLab() { // صفحة الاختبار الداخلية + النافذة (للشاشات المطبَّقة أيضاً)
  if (!DETAILS.on) return '';
  const chips = !DETAILS.page ? '' : Object.keys(dDomains).filter(k => k !== 'liq' && !/^hs:/.test(k)).map(k => dchip({ id: k, icon: dDomains[k].icon, count: askFrom(k).length })).join('');
  return `${DETAILS.page ? `<div class="dlab" id="dlab"><h1>تفاصيل عقاراتك (تجربة)</h1><div class="dchips" role="group" aria-label="تفاصيل عقاراتك">${chips}</div></div>` : ''}<div id="dsheetHost">${dsheet()}</div>`;
}
function dRender() {
  let host = document.getElementById('dlabRoot');
  if (!DETAILS.on || (!DETAILS.page && !dsh.domain)) { if (host) host.innerHTML = ''; return; }
  if (!S || !S.player) return;
  if (!host) { host = document.createElement('div'); host.id = 'dlabRoot'; document.body.appendChild(host); }
  const old = document.getElementById('dsheet'), top = old ? old.scrollTop : 0;
  host.innerHTML = dLab(); try { GameIcons.paint(host); } catch (e) {}
  const nu = document.getElementById('dsheet'); if (nu && old && dsh.keep) nu.scrollTop = top;
}
function dClose() { dsh.domain = null; dsh.open = null; dsh.keep = false; dRender(); try { renderAll(true); } catch (e) {} }
function dOpen(domain) {
  if (!DETAILS.on || !dDomain(domain)) return;
  if (dsh.domain === domain) return dClose();
  dsh.domain = domain; dsh.keep = false; dsh.tab = null; dsh.chosen = {}; Object.values(dsh.timers).forEach(clearTimeout); dsh.timers = {};
  const first = askFrom(domain)[0]; dsh.open = first ? first.id : null; dRender(); dsh.keep = true;
  const sh = document.getElementById('dsheet'); if (sh) sh.scrollTop = 0;
}
function dToggle(id) { dsh.open = dsh.open === id ? null : id; dsh.keep = true; dRender(); }
function dChoose(id, oid) {
  const card = askFrom(dsh.domain).find(c => c.id === id) || (typeof hsAskCards === 'function' ? hsAskCards().find(c => c.id === id) : null) || (typeof tkAskCards === 'function' ? tkAskCards().find(c => c.id === id) : null) || (typeof dlAskCards === 'function' ? dlAskCards().find(c => c.id === id) : null) || (typeof chxAskCards === 'function' ? chxAskCards().find(c => c.id === id) : null) || (typeof fmxAskCards === 'function' ? fmxAskCards().find(c => c.id === id) : null), o = card && card.opts.find(x => x.id === oid);
  if (!o || o.off || !o.act) return null;
  const r = o.act(); act(r);
  if (!r || r.ok === false) { dRender(); return r; }
  if (card.keep) { dsh.open = id; dsh.keep = true; dRender(); return r; } // 043أ: بطاقات «أضف مهمة» تبقى مفتوحة ومظلَّلة بعد الاختيار
  const was = dsh.chosen[id]; dsh.chosen[id] = { card: card.mark ? { ...card, opts: card.opts.map(x => ({ ...x, on: x.id === oid })) } : card /* ظهور الاختيار: الخيار المختار يبقى مظلَّلاً (035ج) */, res: (r && r.msg) || o.title, gone: false };
  dsh.open = null; dRender();
  clearTimeout(dsh.timers[id]);
  dsh.timers[id] = setTimeout(() => { if (!dsh.chosen[id]) return; dsh.chosen[id].gone = true; dRender(); dsh.timers[id] = setTimeout(() => { delete dsh.chosen[id]; const nx = dsh.domain && askFrom(dsh.domain).find(c => !dsh.chosen[c.id]); if (dsh.open == null && nx) dsh.open = nx.id; dRender(); }, DETAILS.delay ? 320 : 0); }, DETAILS.delay);
  return r;
}
document.addEventListener('click', ev => {
  if (!DETAILS.on || !(DETAILS.page || dLive())) return; const t = ev.target.closest && ev.target.closest('[data-dchip],[data-dhd],[data-dopt],[data-dclose],[data-dscrim],[data-dtab],[data-dstab]'); if (!t) return;
  if (t.dataset.dstab) { dsh.tab = t.dataset.dstab; dsh.keep = true; dRender(); return; }
  if (t.dataset.dtab) { ui.mtab = t.dataset.dtab; saveUi(); renderAll(true); return; }
  if (t.dataset.dchip) dOpen(t.dataset.dchip); else if (t.dataset.dhd) dToggle(t.dataset.dhd); else if (t.dataset.dopt) dChoose(t.dataset.dopt, t.dataset.oid); else dClose();
});
document.addEventListener('keydown', ev => { if (DETAILS.on && ev.key === 'Escape' && dsh.domain) dClose(); });
(function () { let y0 = null; document.addEventListener('touchstart', ev => { y0 = ev.target.closest && ev.target.closest('#dsheet') ? ev.touches[0].clientY : null; }, { passive: true });
  document.addEventListener('touchend', ev => { const sh = document.getElementById('dsheet'); if (y0 != null && sh && ev.changedTouches[0].clientY - y0 > 70 && sh.scrollTop <= 0) dClose(); y0 = null; }, { passive: true }); })();
