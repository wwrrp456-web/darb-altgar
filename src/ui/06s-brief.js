/* ---------- 050 «يومك في 30 ثانية» + «بِع في أفضل سوق» + مسار التاجر + سباق الرئاسة (الواجهة) ----------
   فوق مكوّنات 037 (ask وdsheet وdchip) ولا قوائم منسدلة ولا أيقونات جديدة. تظهر بقاعدة 037 نفسها (dLive: اللاعب الحقيقي أو ?player=1 أو ?details=1)،
   والتلقائي عند الفتح لا يعمل في المتصفح الآلي إلا بـ?brief=1. E.BRIEF/BESTM/RACE.on=false تعيد الواجهة القديمة حرفياً.
   كل رقم من المحرك (E.briefView وE.bestStep وE.bestMarkets وE.progView وE.raceView)، وكل فعل بالأفعال القائمة (A.buy وA.sell وA.travel عبر A.bestRun). */
const briefUiOn = () => { try { return !!(E.BRIEF.on && DETAILS.on && dLive() && S && S.learn && S.learn.char); } catch (e) { return false; } };
const bestUiOn = () => { try { return !!(E.BESTM.on && DETAILS.on && dLive() && S && S.learn && S.learn.char); } catch (e) { return false; } };
const raceUiOn = () => { try { return !!(E.RACE.on && DETAILS.on && dLive() && S && S.learn && S.learn.char); } catch (e) { return false; } };
const bfN = n => fmt(n).replace(/,/g, '٬');
const bfSg = n => (n < 0 ? '−' : '+') + bfN(Math.abs(n));
const bfLs = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
let briefOpen = false;
const bp = { chosen: {}, ids: null, step: null, screen: null };
const bfName = () => (S.player && S.player.name) || 'التاجر';
const bfCity = () => { const c = main(); return cityName(c.left > 0 ? c.dest : c.city); };
const bfClip = (t, n) => { t = String(t); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };

/* ---- 1) اللوحة ---- */
function briefCards() { let L = []; try { L = officeCards(true).filter(c => !dSnoozed(c.ask ? c.ask.id : c.id)); } catch (e) {} return L; }
function briefEvIcon(e) {
  if (/صندوق/.test(e.t)) return dIc('ui-expenses');
  if ((S.rivals || []).some(r => r.out == null && e.t.includes(r.name)) || e.race) return dIc('icons/target');
  return dIc('icons/book');
}
function briefEventsHTML(v) {
  const rows = [];
  if (v.first || !v.any) rows.push(`<div class="ev" data-ev="ledger"><span class="ic">${dIc('icons/ledger')}</span><span>${E_BRIEF_TXT.noMove}</span></div>`);
  else {
    const ti = v.topInc, te = v.topExp, nm = k => esc(LN[k] || k);
    rows.push(`<div class="ev" data-ev="ledger"><span class="ic">${dIc('icons/ledger')}</span><span>صافي ${dayAr(v.days)} <b class="${v.net >= 0 ? 'up' : 'down'}">${bfSg(v.net)}</b>: ${ti ? nm(ti.k) + ' ' + bfN(ti.v) : 'لا دخل'}${te ? ' ودفعت ' + nm(te.k) + ' ' + bfN(te.v) : ''}.</span></div>`);
  }
  if (!v.events.length) rows.push(`<div class="ev" data-ev="none"><span class="ic">${dIc('icons/book')}</span><span>${E_BRIEF_TXT.noNews}</span></div>`);
  else for (const e of v.events) rows.push(`<div class="ev" data-ev="news"><span class="ic">${briefEvIcon(e)}</span><span>${esc(bfClip(e.t, 110))}</span></div>`);
  return rows.join('');
}
const E_BRIEF_TXT = new Proxy({}, { get: (_, k) => E.BRIEF_TXT[k] });
function briefAsksHTML() {
  const L = briefCards(), liveIds = new Set(L.map(c => c.ask ? c.ask.id : c.id));
  if (!bp.ids) bp.ids = L.slice(0, E.BRIEF.asks).map(c => c.ask ? c.ask.id : c.id);
  const body = [];
  for (const id of bp.ids) {
    if (bp.chosen[id]) { body.push(ask({ ...bp.chosen[id].card, state: 'done', res: bp.chosen[id].res }, id)); continue; }
    const c = L.find(x => (x.ask ? x.ask.id : x.id) === id); if (c) body.push(c.ask ? ask(c.ask, c.ask.id) : officeRow(c));
  }
  const n = L.length, shownLive = bp.ids.filter(id => liveIds.has(id)).length, more = n - shownLive;
  return { n, html: (body.join('') || `<div class="small muted" data-noask>${E_BRIEF_TXT.noAsk}</div>`) + (more > 0 ? `<div class="small muted bp-more">و${more} أخرى في «اليوم» <button type="button" class="sm" data-bp="today" style="min-height:44px">افتح مكتب التاجر</button></div>` : '') };
}
/* الخطوة المقترحة: 1) حمولة 2) حمّل وسافر 3) أعلى بطاقة ask لها خيار موصى 4) لا خطوة */
function briefStepHTML() {
  const st = E.bestStep(S); bp.step = st && bestUiOn() ? st : null;
  if (bp.step) {
    const s = bp.step, car = main(), t = `بِع ${s.q} ${esc(GD[s.g].name)} في ${esc(cityName(s.dest))}`;
    return `<div class="card step" data-sec="step" data-step="${s.kind}"><h2>خطوتك المقترحة اليوم</h2><b class="t">${t}</b><div class="why">${esc(E.bestWhy(S, s).replace(/(\d),(?=\d)/g, '$1٬'))}</div><button type="button" class="go" data-bp="run">${dIc(s.kind === 'load' ? 'icons/cart' : 'nav/caravan')} نفّذها: ${s.kind === 'load' ? 'حمّل وسافر' : 'سافر'}</button><button type="button" class="go ghost" data-bp="alts">اعرض بدائل (${s.alts.length})</button></div>`;
  }
  const c = briefCards().find(x => x.ask && (x.ask.opts || []).some(o => o.best && !o.off));
  if (c) { const o = c.ask.opts.find(x => x.best && !x.off); bp.step = { ask: c.ask.id, oid: o.id }; return `<div class="card step" data-sec="step" data-step="ask"><h2>خطوتك المقترحة اليوم</h2><b class="t">${esc(c.ask.title)}</b><div class="why">${esc(c.ask.why || '')}</div><button type="button" class="go" data-bp="stepask">${esc(o.title)}</button></div>`; }
  return `<div class="card step" data-sec="step" data-step="none"><h2>خطوتك المقترحة اليوم</h2><div class="small muted">${E_BRIEF_TXT.noStep}</div></div>`;
}
function progCardHTML(v) {
  const sub = `<small class="sub">الفصل ${v.ch} من 7 · درجة المشاريع ${v.pj}</small>`;
  const head = v.last ? `<b>${esc(v.title)}</b> · ${E_BRIEF_TXT.top}` : `<b>${esc(v.title)}</b> ← <span class="sub" style="display:inline">${esc(v.next)} عند ${bfN(v.nextAt)} (بقي ${bfN(v.left)})</span>`;
  return `${head}<div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v.pct * 100)}"><i style="width:${Math.round(v.pct * 100)}%"></i></div>${sub}`;
}
function briefHTML() {
  const v = E.briefView(S), asks = briefAsksHTML(), step = briefStepHTML(), pv = E.progView(S, window.ContentMap ? ContentMap.PIECES : []);
  const sub = `اليوم ${S.day}${!v.first && v.days > 0 ? ` · غبتَ ${dayAr(v.days)} مرّت في اللعبة` : ''} · ${esc(bfCity())}`;
  return `<div class="bp" role="dialog" aria-modal="true" aria-label="يومك في 30 ثانية"><h1 tabindex="-1" data-bp-h>صباح الخير يا ${esc(bfName())}</h1><div class="sub">${sub}</div>
<div class="card" data-sec="events"><h2>ماذا حدث في غيابك</h2>${briefEventsHTML(v)}${v.hasAway ? `<button type="button" class="sm" data-bp="away" style="min-height:44px">تقرير الغياب كاملاً</button>` : ''}</div>
<div class="card" data-sec="asks"><h2>ما ينتظرك (${asks.n})</h2>${asks.html}</div>
${step}
<button type="button" class="card prog-card" data-sec="prog" data-bp="prog" aria-label="مسار التاجر: افتح المسارات الأربعة"><h2>مسار التاجر</h2>${pv ? progCardHTML(pv) : ''}</button>
</div><div class="bp-bar"><button type="button" class="go" data-bp="start">ابدأ يومي</button><button type="button" class="go ghost" data-bp="home">افتح الرئيسية</button></div>`;
}
function renderBriefUI() {
  const el = $('briefPanel'); if (!el) return; if (!briefOpen) { if (!el.hidden) { el.hidden = true; el.innerHTML = ''; } return; }
  const top = el.scrollTop; el.hidden = false; el.innerHTML = briefHTML(); try { GameIcons.paint(el); } catch (e) {} el.scrollTop = top;
}
function briefTryOpen(manual) {
  try {
    if (briefOpen) return 'opened'; if (!briefUiOn()) return 'off';
    if (!manual && (navigator.webdriver && !/[?&]brief=1/.test(location.search))) return 'off';
    if (!S || S.day <= 0 && !manual) return 'throttled';
    if (coverOn || storyFirst() || learnNext() || S.awayJob || (S.life && S.life.pending) || (S.tut && S.tut.on) || salemOpen || fgOpen() || document.hidden || (typeof dg !== 'undefined' && dg)) return 'wait';
    if (!manual) { const t = +bfLs.get('brief.t'); if (t && Date.now() - t < E.BRIEF.reMin * 60000) return 'throttled'; }
    bp.chosen = {}; bp.ids = null; bp.screen = screen; briefOpen = true; renderBriefUI(); renderAll(true); const h = document.querySelector('#briefPanel [data-bp-h]'); if (h) try { h.focus({ preventScroll: true }); } catch (e) {} return 'opened';
  } catch (e) { return 'off'; }
}
function briefClose(where) {
  if (!briefOpen) return; briefOpen = false;
  try { E.briefSeen(S); } catch (e) {} if (S.awayReport) { delete S.awayReport; if (S.captainAuto) setSpeed(1); }
  bfLs.set('brief.t', String(Date.now())); bp.chosen = {}; bp.ids = null; bp.step = null;
  const el = $('briefPanel'); if (el) { el.hidden = true; el.innerHTML = ''; } try { persist(); } catch (e) {}
  const idle = main().left === 0;
  if (where === 'start') go(idle ? 'market' : 'map'); else if (where === 'home') go('home'); else if (where === 'map') go('map'); else if (where === 'office') { go('office'); } else renderAll(true);
  try { schedule(); } catch (e) {}
}
function briefBoot() { let n = 0; const t = setInterval(() => { n++; if (briefOpen || n > 40) { clearInterval(t); return; } const r = briefTryOpen(); if (r === 'opened' || r === 'throttled' || r === 'off') clearInterval(t); }, 1500); }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(() => { if (!S || briefOpen) return; if (S.awayJob) return; briefTryOpen(); }, 600); });
/* خيار داخل بطاقة «ما ينتظرك»: بالفعل القائم نفسه ثم إعادة رسم (قاعدة ظهور الاختيار) */
function briefChoose(id, oid) {
  const c = briefCards().find(x => x.ask && x.ask.id === id), o = c && c.ask.opts.find(x => x.id === oid); if (!o || o.off || !o.act) return;
  const r = o.act(); act(r); if (r && r.ok === false) { renderBriefUI(); return; }
  bp.chosen[id] = { card: { ...c.ask, opts: c.ask.opts.map(x => ({ ...x, on: x.id === oid })) }, res: (r && r.msg) || o.title };
  renderBriefUI(); setTimeout(() => { if (briefOpen && screen !== bp.screen) briefClose('stay'); else renderBriefUI(); }, 120);
}
(function () {
  const wire = () => { const p = $('briefPanel'); if (!p) return;
    p.addEventListener('click', ev => {
      const o = ev.target.closest('[data-dopt]'); if (o) { ev.stopPropagation(); briefChoose(o.dataset.dopt, o.dataset.oid); return; }
      if (ev.target.closest('[data-dhd],[data-dchip]') && !ev.target.closest('[data-bp]')) { ev.stopPropagation(); return; }
      const b = ev.target.closest('[data-bp]'); if (b) { ev.stopPropagation(); briefAct(b.dataset.bp); return; }
      if (ev.target.closest('[data-act],[data-go]')) setTimeout(() => { if (!briefOpen) return; if (screen !== bp.screen) briefClose('stay'); else renderBriefUI(); }, 140);
    }); };
  wire();
})();
function briefAct(w) {
  if (w === 'start' || w === 'home') return briefClose(w);
  if (w === 'today') return briefClose('office');
  if (w === 'away') { briefClose('stay'); if (S.lastAway) { S.awayReport = JSON.parse(JSON.stringify(S.lastAway)); } return renderAll(true); }
  if (w === 'run') { const s = bp.step; if (!s || s.ask) return; const r = A.bestRun(S, main().id, s.g, s.qBuy, s.dest); act(r); if (r && r.ok) return briefClose('map'); return renderBriefUI(); }
  if (w === 'alts') { const s = bp.step; if (!s || s.ask) return; bmOpen(s.g, s.kind === 'load', s.q); return; }
  if (w === 'stepask') { const s = bp.step; if (!s || !s.ask) return; return briefChoose(s.ask, s.oid); }
  if (w === 'prog') return progOpen();
}

/* ---- 1-و) مسار التاجر: بطاقة اللوحة وسطر الرئيسية ونافذة المسارات الأربعة ---- */
function progBody() {
  const v = E.progView(S, window.ContentMap ? ContentMap.PIECES : []); if (!v) return '';
  const kv = (k, val) => `<div class="kv"><span>${k}</span><b>${val}</b></div>`, nm = window.ContentMap && ContentMap.CHAPTERS[v.ch - 1] ? ContentMap.CHAPTERS[v.ch - 1].title : '';
  const slots = v.slotNext && (v.slotNext.shops || v.slotNext.fleet) ? `<div class="small muted">تفتح: ${v.slotNext.shops ? 'دكاكين حتى ' + v.slotNext.shops + ' في المدينة' : ''}${v.slotNext.shops && v.slotNext.fleet ? '، ' : ''}${v.slotNext.fleet ? 'أسطول حتى ' + v.slotNext.fleet + ' قوافل' : ''}</div>` : '';
  return `<h4 class="dsec">اللقب</h4>${kv(esc(v.title), v.last ? E_BRIEF_TXT.top : `التالي ${esc(v.next)} عند ${bfN(v.nextAt)} (بقي ${bfN(v.left)})`)}
<h4 class="dsec">الرتبة</h4>${kv(`الرتبة ${v.rk} من ${E.RANK_MAX}`, v.rk >= (E.RANK_MAX) ? 'الأعلى' : `بقي ${bfN(v.xpLeft)} خبرة`)}${slots}
<h4 class="dsec">الفصل</h4>${kv(`الفصل ${v.ch}: ${esc(nm)}`, '')}<button type="button" class="sm pri" data-bp="journey" style="width:100%;min-height:44px">افتح الرحلة</button>
<h4 class="dsec">المشاريع</h4>${kv(`درجة ${v.pj}`, v.pjNext == null ? 'الأعلى' : `تُفتح الدرجة ${v.pj + 1} عند ذروة ثروة ${bfN(v.pjNext)}`)}`;
}
function progOpen() { dsh.folds['bp-prog'] = { sum: '<b>مسار التاجر</b>', body: progBody, def: false }; dOpen('fold:bp-prog'); }
function pgLineHTML(solo) {
  if (!briefUiOn()) return ''; const v = E.progView(S, window.ContentMap ? ContentMap.PIECES : []); if (!v) return '';
  const txt = v.last ? `<b>${esc(v.title)}</b><small>${E_BRIEF_TXT.top}</small>` : `<b>${esc(v.title)}</b> ← ${esc(v.next)} · بقي <b class="num">${bfN(v.left)}</b><small>الفصل ${v.ch} من 7 · درجة المشاريع ${v.pj}</small>`;
  const row = `<button type="button" class="dchip dchip-row pg-row" data-bp="prog" aria-label="مسار التاجر: ${esc(dPlain(txt))}">${dIc('icons/target')}<span class="dnm">${txt}</span><span class="dgo" aria-hidden="true">›</span></button><div class="prog thin" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v.pct * 100)}"><i style="width:${Math.round(v.pct * 100)}%"></i></div>`;
  return solo ? `<section class="card pgline" aria-label="مسار التاجر" style="margin-top:12px">${row}</section>` : row;
}

/* ---- 2) بِع في أفضل سوق ---- */
const bm = { g: null, q: 0, unit: 0, buy: false, list: [], pick: 0 };
function bmOpen(g, buy, qArg) {
  const car = main(); if (!bestUiOn() || car.left > 0) return; let q, unit;
  if (buy) { const c = S.cities[car.city], up = E.unitPrice(c, g) * 1.04, room = Math.floor((E.capOfCar(car) - E.loadOf(car)) / GD[g].w);
    q = qArg > 0 ? Math.floor(qArg) : Math.max(0, Math.min(30, room, Math.floor(S.player.gold * E.BRIEF.budget / up), Math.floor((c.stock[g] || 0) * 0.5))); unit = up; }
  else { q = Math.floor(car.cargo[g] || 0); unit = E.avgCost(car.basis, g) || E.mid(g); }
  Object.assign(bm, { g, q, unit, buy: !!buy, pick: 0, list: q >= 1 ? E.bestMarkets(S, car, g, q, unit) : [] });
  dsh.folds.bm = { sum: '<b>بِع في أفضل سوق</b>', body: bmBody, def: false };
  if (dsh.domain === 'fold:bm') dsh.domain = null; dOpen('fold:bm');
}
function bmBody() {
  if (!bm.list.length) return `<p class="small muted" data-bm-none>${E_BRIEF_TXT.noMarket}</p>`;
  const chips = bm.list.map((o, i) => `<button type="button" class="dopt bm-chip${i === bm.pick ? ' on best' : ''}" data-bm="pick" data-i="${i}" aria-pressed="${i === bm.pick}"><span class="dot">${esc(cityName(o.city))} · ربح ≈ ${bfN(Math.round(o.profit))} · ${dayAr(o.days)} · خطر ${Math.round(o.risk * 100)}٪</span>${o.age > 0 ? `<span class="dos">عمر السعر ${dayAr(o.age)}</span>` : ''}</button>`).join('');
  const o = bm.list[bm.pick], gn = GD[bm.g].name;
  const sum = bm.buy ? `ستشتري ${bm.q} ${gn} بـ${bfN(Math.round(bm.unit * bm.q))} وتسافر إلى ${cityName(o.city)} ${dayAr(o.days)}، ربح متوقع ≈ ${bfN(Math.round(o.profit))} ريال (تقدير قد يتغير قبل وصولك).` : `تسافر بحمولتك إلى ${cityName(o.city)} ${dayAr(o.days)}، ربح متوقع ≈ ${bfN(Math.round(o.profit))} ريال (تقدير قد يتغير قبل وصولك).`;
  return `<p class="small muted">${dIc(bm.buy ? 'icons/cart' : 'nav/caravan')} ${esc(gn)} × ${bm.q}</p><div class="bm-list" role="group" aria-label="الأسواق الرابحة">${chips}</div><p class="small" data-bm-sum aria-live="polite">${esc(sum)}</p><button type="button" class="sm pri" data-bm="run" style="width:100%;min-height:48px">${bm.buy ? 'حمّل وسافر' : 'سافر'}</button>`;
}
function bmAct(w, i) {
  if (w === 'pick') { bm.pick = +i || 0; dsh.keep = true; return dRender(); }
  if (w === 'run') { const o = bm.list[bm.pick]; if (!o) return; const r = A.bestRun(S, main().id, bm.g, bm.buy ? bm.q : 0, o.city); act(r); if (r && r.ok) { dClose(); return go('map'); } dsh.keep = true; return dRender(); }
}
/* أزرار السوق: data-bm="buy|cargo" data-g data-q */
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('[data-bm],[data-bp]'); if (!b || ev.target.closest('#briefPanel')) return;
  if (b.dataset.bm === 'pick' || b.dataset.bm === 'run') { ev.stopPropagation(); return bmAct(b.dataset.bm, b.dataset.i); }
  if (b.dataset.bm === 'buy') { ev.stopPropagation(); return bmOpen(b.dataset.g, true, +b.dataset.q); }
  if (b.dataset.bm === 'cargo') { ev.stopPropagation(); return bmOpen(b.dataset.g, false); }
  if (b.dataset.bp === 'prog') { ev.stopPropagation(); return progOpen(); }
  if (b.dataset.bp === 'journey') { ev.stopPropagation(); dClose(); return go('academy'); }
  if (b.dataset.bp === 'brief') { ev.stopPropagation(); return briefTryOpen(true); }
}, true);
const bmBtn = (g, mode, q, cls) => bestUiOn() ? `<button type="button" class="sm ${cls || ''}" data-bm="${mode}" data-g="${g}"${q ? ` data-q="${q}"` : ''} style="min-height:44px">بِع في أفضل سوق</button>` : '';
/* بطاقة الوصول: «المطلوب» في مكتب التاجر واللوحة (id=bm:<car>) */
function bmAskCards() {
  if (!bestUiOn()) return []; const pa = E.planArrived(S); if (!pa) return [];
  const id = 'bm:' + pa.car.id, gn = GD[pa.g].name;
  return [{ id, w: 99, icon: 'ui-sell', title: `وصلتَ ${cityName(pa.city)}: بِع ${pa.q} ${gn}`, why: `التقدير عند الانطلاق ≈ ${bfN(pa.est)} · الآن ≈ ${bfN(pa.now)}`, state: 'open', prio: 0, opts: [
    { id: 'sell', icon: 'ui-sell', title: 'بِع الآن', effect: `تبيع ${pa.q} ${gn} في ${cityName(pa.city)}`, best: true, act: () => A.sell(S, pa.car.id, pa.g, pa.q) },
    { id: 'keep', icon: 'ui-postpone', title: 'احتفظ بها', effect: 'تبقى في القافلة ويُحذف تذكير الرحلة', act: () => { E.planDrop(S, pa.car.id); return { ok: true, msg: 'احتفظتَ بها' }; } }] }];
}

/* ---- 4) سباق رئاسة التجار: بطاقة السوق وورقة المنافسين ---- */
function raceCardHTML(inMarket) {
  if (!raceUiOn()) return ''; const v = E.raceView(S); if (!v) return '';
  if (inMarket) { const cr = main(); if (!(cr.left === 0 && cr.city === v.cid)) return ''; }
  const rows = v.rows.map(r => `<div class="race-row" data-rr="${r.id}"><div class="kv"><span>${r.chief ? '<b class="cheap">★</b> ' : ''}<b>${esc(r.name)}</b></span><span class="num">${esc(rvMoney(r.view))}</span></div><div class="bar race-bar"><i style="width:${Math.round(r.bar * 100)}%"></i></div></div>`).join('');
  const hold = E.RACE.hold;
  const st = v.chiefMe ? `أنت رئيس التجار · +${E.RACE.inflMonth} نفوذ كل شهر · تبقى ما دمت تسبق الثاني بـ15٪`
    : v.cand ? `تسبق الثاني بـ${v.leadPct}٪ · تصير رئيساً بعد ${dayAr(v.left)} إن بقيت`
    : v.rk === 1 ? `أنت الأول؛ تحتاج أن تسبق الثاني بـ15٪ (الآن ${v.leadPct}٪)`
    : `${v.gapExact ? `ينقصك ${bfN(v.gapUp)} لتسبق ${esc(v.above)}` : `بينك وبين ${esc(v.above)} ≈ ${bfN(v.gapLo)}–${bfN(v.gapHi)}`}`;
  return `<section class="card race" data-race aria-label="سباق رئاسة التجار"><h3 style="margin:0 0 6px">سباق رئاسة التجار في سوق ${esc(v.city)}</h3>${rows}<div class="small race-st" data-race-st style="margin-top:6px">${st}</div>${v.chiefMe ? '' : `<div class="small muted">الرئاسة: أن تكون الأول بفارق 15٪ ${dayAr(hold)} · +${E.RACE.inflWin} نفوذ أول مرة و+${E.RACE.inflMonth} كل شهر</div>`}</section>`;
}
const raceRankTxt = () => { if (!raceUiOn()) return ''; const v = E.raceView(S); return v ? ` · ترتيبك ${v.rk} من ${v.n}` : ''; };
