/* ---------- 033أ تنظيم الصفحات: المكتب والأعمال (تبويبات) والعقارات (ⓘ ودليل) ----------
   القاعدة: القرار والحالة أولاً، والتفاصيل في القوائم، ولا حذف لبيانات. لكل جزء مفتاح رجوع يعيد العرض السابق حرفياً. حالة التبويب في ui.tab فقط (darb-ui). */
const OFFICETABS = { on: true }, BIZTABS = { on: true }, ESTATEINFO = { on: true };
/* «مراقبتي» و«طرقي المفضلة»: انتقلتا إلى شاشة السوق (marketToolsHTML في 08b-pageorder) حين يعمل PAGEORD.market؛ وإلا بقيتا في «اليوم». MARKETMINE.on=false يعيدهما للمكتب */
const MARKETMINE = { on: true };
let askSink = false; // أسئلة المساعدين تُعرض في تبويب «اليوم» فلا تتكرر في بطاقاتهم
const ptabIcon = k => ({ today: 'office/desk', goals: 'office/rank_badge', mgmt: 'ui/manager', money: 'ui/hud_wealth', fleet: 'nav/caravan', factory: 'nav/empire', bank: 'ui/hud_goldbar' }[k]);
const ptabCur = (page, tabs) => { const t = ui.tab && ui.tab[page]; return tabs.some(x => x.id === t) ? t : tabs[0].id; };
/* في الاختبارات الآلية (foldAuto) تُرسم كل التبويبات متتابعة كالقديم؛ وفي وضع اللاعب تبويب واحد */
function tabsView(page, tabs) {
  const cur = ptabCur(page, tabs), all = foldAuto();
  const bar = `<div class="ptabs" role="tablist" aria-label="${page === 'office' ? 'أقسام المكتب' : 'أقسام الأعمال'}">${tabs.map(t => { const ic = t.icon && ART[t.icon] ? `<img class="pti" src="${ART[t.icon]}" alt="">` : `<span class="pti" aria-hidden="true">${t.ic || ''}</span>`; return `<button role="tab" class="ptab${t.id === cur ? ' on' : ''}" aria-selected="${t.id === cur}" data-act="ptab" data-p="${page}" data-t="${t.id}">${ic}<b>${t.name}</b>${t.n ? `<i class="pn" aria-label="${t.n} تنتظر">${t.n}</i>` : ''}</button>`; }).join('')}</div>`;
  return bar + tabs.filter(t => all || t.id === cur).map(t => `<section class="ptab-body" data-ptab="${t.id}" role="tabpanel" aria-label="${t.name}">${t.body()}</section>`).join('');
}
/* ---- المكتب ---- */
function officeAsks() { // أسئلة المساعدين وتذكيراتهم بأزرارها القائمة
  const out = { html: '', n: 0 }; if (!E.DIWAN.on || !S.learn || !S.learn.char) return out;
  const D = S.player.diwan, C = E.CHIEFC.on && S.player.cchief, P = E.PORTM.on && S.player.portm; const parts = [];
  if (D) { const v = E.diwanView(S); v.ask.forEach(a => parts.push(diwanAskHTML(a))); v.reminders.forEach(r => parts.push(`<div class="small ${r.bad ? 'dear' : ''} diwan-rem"><b>موعد:</b> ${esc(r.text)}</div>`)); out.n += v.ask.length + v.reminders.length; }
  if (C) { const v = E.cchiefView(S); v.ask.forEach(a => parts.push(cchiefAskHTML(a))); out.n += v.ask.length; }
  if (P) { const v = E.portmView(S); v.ask.forEach(a => parts.push(portmAskHTML(a))); out.n += v.ask.length; }
  out.html = parts.join(''); return out;
}
function officeToday() {
  const cards = officeCards(true), asks = askSink ? officeAsks() : { html: '', n: 0 }, any = cards.length || asks.n;
  return `<section class="card office" aria-label="ما ينتظرك"><h2 style="margin-top:0">${ART['office/desk'] ? `<img class="oic" src="${ART['office/desk']}" alt="" width="34" height="34" style="vertical-align:middle;margin-inline-end:6px">` : ''}ما ينتظرك</h2>${any ? cards.map(officeRow).join('') + asks.html : '<div class="small">لا شيء ينتظرك، تجارتك تسير.</div>'}${goalCard()}${MARKETMINE.on && pgOn('market') ? '' : mineBlockHTML()}</section>`;
}
function officeGoals() {
  let h = projectsHTML(); h += seasonGoalCardHTML();
  h += `<section class="card"><h3 style="margin-top:0">درجات الثروة وتطوير الأسواق</h3><p class="small muted">درجات الثروة في «المشاريع الكبرى» أعلاه. وترتيب الدول والأسواق في «الدول والدفتر».</p><div class="row"><button class="sm" data-act="ctopen" data-t="cities">الدول والمدن</button>${boardTabs().map(([id, n]) => `<button class="sm" data-act="ctopen" data-t="${id}">${n}</button>`).join('')}</div></section>`;
  h += officeAdminParts().hire + officeAdminParts().rivals;
  return h;
}
function officeMgmt() {
  const P = S.player; let h = mgmtHTML(); h += officeAdminParts().hired; h += assetsHTML(); h += agentHTML(); h += chiefHTML();
  if (E.FARM_BOSS.on) h += Object.keys(P.props).filter(id => E.farmBossOf(S, id)).map(id => `<section class="card farm-boss-office">${farmBossReportsHTML(id)}</section>`).join('');
  return h;
}
function officeMoney() {
  const nw = E.netWorth(S);
  let h = `<section class="card"><h3 style="margin-top:0">مالي</h3><div class="kv"><span>الثروة الصافية</span><b class="num">${fmt(Math.round(nw))} ريال</b></div><div class="row" style="flex-wrap:wrap;margin-top:6px"><button class="sm" data-act="wealth">تقرير الثروة</button>${typeof vaultEntryHTML === 'function' ? vaultEntryHTML() : ''}<button class="sm" data-go="empire">التمويل والقروض</button>${typeof tradeRestartButton === 'function' ? tradeRestartButton() : ''}</div></section>`;
  h += liqCardHTML() + officeDuesHTML() + obligationsHTML() + officeWagesHTML() + paymentHistoryHTML();
  return h;
}
/* بطاقات الإداريين والمنافسين مقسومة: العاملون ← الإدارة، وقبل التوظيف والمنافسون ← الأهداف */
let oapCache = { k: -1, v: null };
function officeAdminParts() {
  const key = S.day + ':' + (S.player.diwan ? 1 : 0) + (S.player.cchief ? 1 : 0) + (S.player.portm ? 1 : 0) + ':' + askSink; if (oapCache.k === key && oapCache.t === S) return oapCache.v;
  const wrap = (k, label, extra, asks, body) => foldLazy('of-' + k, false, `<b>${label}</b> · ${extra}${asks ? ` · <span class="pill dear">${asks} ${asks === 1 ? 'سؤال ينتظرك' : 'أسئلة تنتظرك'}</span>` : ''}`, body, asks > 0 && !askSink, 'ofold');
  const out = { hired: '', hire: '', rivals: '' };
  const D = E.DIWAN.on && S.learn && S.learn.char && S.player.diwan, C = E.CHIEFC.on && S.player.cchief, P = E.PORTM.on && S.player.portm;
  if (!D) out.hire += diwanHTML(); else { const v = E.diwanView(S), n = v.ask.length + (C ? E.cchiefView(S).ask.length : 0) + (P ? E.portmView(S).ask.length : 0); out.hired += wrap('diwan', 'ناظر الديوان', 'الخزينة ' + lm(v.box), askSink ? 0 : n, diwanHTML); }
  if (!C) out.hire += cchiefHTML(); else { const v = E.cchiefView(S); out.hired += wrap('cchief', 'شيخ القوافل', esc(cchiefSummary(v)), D || askSink ? 0 : v.ask.length, cchiefHTML); }
  if (!P) out.hire += portmHTML(); else { const v = E.portmView(S); out.hired += wrap('portm', 'الشهبندر', esc(portmSummary(v)), D || askSink ? 0 : v.ask.length, portmHTML); }
  const rv = E.RIVALGEN.on && S.learn && S.learn.char ? E.rivalGenView(S) : null;
  if (rv && rv.on && rv.list.length) out.rivals += wrap('rivals', 'المنافسون', rv.list.length + ' من ' + rv.max, 0, rivalsHTML);
  oapCache = { k: key, t: S, v: out }; return out;
}
function screenOffice() {
  if (!OFFICETABS.on || !S.learn || !S.learn.char || NOLEARN) return screenOfficeOld();
  const all = foldAuto(); askSink = !all; oapCache = { k: -1, v: null };
  try {
    const cardsN = officeCards(true).length, asks = officeAsks().n, dues = (S.paymentDues || []).filter(d => d.amount > 0).length;
    let mgN = 0; try { const mv = E.mgmtView(S); mgN = mv ? mv.alerts : 0; } catch (e) {}
    let gN = 0; try { const v = E.projectView(S); gN = v.on ? v.open.filter(p => !p.done && !p.need && !p.building && S.player.gold >= p.nextCost).length : 0; } catch (e) {}
    const tabs = [
      { id: 'today', name: 'اليوم', icon: ptabIcon('today'), n: cardsN + asks, body: officeToday },
      { id: 'goals', name: 'الأهداف', icon: ptabIcon('goals'), n: gN, body: officeGoals },
      { id: 'mgmt', name: 'الإدارة', icon: ptabIcon('mgmt'), n: mgN, body: officeMgmt },
      { id: 'money', name: 'المال', icon: ptabIcon('money'), n: dues, body: officeMoney }];
    return tabsView('office', tabs);
  } finally { askSink = false; oapCache = { k: -1, v: null }; }
}
/* ---- السوق: «متابعاتي» (مراقبتي وطرقي المفضلة) ---- */
const mineBlockHTML = () => (typeof dMine === 'function' && dMine()) || `${favsHTML()}<details class="mdet" ${watchOf().length ? 'open' : ''}><summary><b>مراقبتي</b> <span class="small muted">(${watchOf().length}/${WATCH_MAX})</span></summary>${watchRows()}${watchForm()}</details>`;
function marketMineHTML() {
  if (!OFFICETABS.on || !MARKETMINE.on || !S.learn || !S.learn.char || NOLEARN) return '';
  return `<section class="card" aria-label="متابعاتي"><h3 style="margin-top:0">متابعاتي</h3>${mineBlockHTML()}</section>`;
}

/* ---- الأعمال: القوافل | الصناعة | المصرف ---- */
function bizCompose(h) {
  const parts = h.split(/\u0001(fleet|factory|bank)\u0001/), head = parts[0], sec = {};
  for (let i = 1; i < parts.length; i += 2) sec[parts[i]] = parts[i + 1];
  if (!BIZTABS.on) return head + (sec.fleet || '') + (sec.factory || '') + (sec.bank || '');
  const P = S.player, fN = P.factories.filter(f => f.crisis).length;
  const tabs = [{ id: 'fleet', name: 'القوافل', icon: ptabIcon('fleet'), n: 0, body: () => sec.fleet || '' }, { id: 'factory', name: 'الصناعة', icon: ptabIcon('factory'), n: fN, body: () => sec.factory || '' }, { id: 'bank', name: 'المصرف', icon: ptabIcon('bank'), n: 0, body: () => sec.bank || '' }];
  return head + tabsView('empire', tabs);
}
/* ---- العقارات: علامة ⓘ لكل عقار + «دليل العقارات» ---- */
const IX_KEYS = ['shop', 'warehouse', 'storage', 'farm', 'butcher'];
const IX_MAP = { storage: 'warehouse' }; // التخزين = مجموع المخازن، ويشرحه المخزن
let ixNew = [];
const ixBody = k => { const H = HOWTO[IX_MAP[k] || k]; if (!H) return ''; return `<p><b>${esc(H.title)}:</b> ${H.what}</p><ol>${H.steps.map(t => `<li>${t}</li>`).join('')}</ol>`; };
function infoMark(k) {
  if (!ESTATEINFO.on || !HOWTO[IX_MAP[k] || k]) return '';
  const st = ui.ix && ui.ix[k], open = st == null || st === 2; if (st == null && !ixNew.includes(k)) ixNew.push(k);
  return `<details class="ixd" data-ixd="${k}" ${open ? 'open' : ''}><summary class="ixs" data-ixk="${k}" aria-label="شرح ${esc(HOWTO[IX_MAP[k] || k].title)}">ⓘ</summary><div class="ixb small">${ixBody(k)}</div></details>`;
}
/* بعد رسم الشاشة تُعلَّم العلامات التي ظهرت مفتوحة أول مرة بأنها شوهدت، فتُطوى في الرسم التالي */
function ixFlush() { if (!ixNew.length) return; const ks = ixNew.slice(); ixNew = []; setTimeout(() => { ui.ix = ui.ix || {}; let ch = false; ks.forEach(k => { if (ui.ix[k] == null) { ui.ix[k] = 1; ch = true; } }); if (ch) saveUi(); }, 600); }
document.addEventListener('click', ev => { const s = ev.target.closest && ev.target.closest('summary[data-ixk]'); if (!s) return; const d = s.parentElement, k = s.dataset.ixk; setTimeout(() => { ui.ix = ui.ix || {}; ui.ix[k] = d.open ? 2 : 1; saveUi(); }, 0); });
function estateGuideHTML() {
  if (!ESTATEINFO.on) return '';
  const keys = ['shop', 'stall', 'warehouse', 'staff', 'farm', 'butcher', 'payments', 'assets'].filter(k => HOWTO[k]);
  return foldDet('est-guide', false, '<b>📖 دليل العقارات</b> <span class="small muted">(شرح كل العقارات في مكان واحد)</span>', `<div class="ixguide">${keys.map(k => { const H = HOWTO[k]; return `<div class="card ixg" data-ixg="${k}"><b>${esc(H.title)}</b><p class="small"><b>ما هذا؟</b> ${H.what}</p><ol class="small">${H.steps.map(t => `<li>${t}</li>`).join('')}</ol><div class="small"><b>أين المشكلة غالباً؟</b><ul>${H.why.map(t => `<li>${t}</li>`).join('')}</ul></div><div class="small muted">${H.away}</div></div>`; }).join('')}</div>`);
}
