'use strict';
// 023 هيكل الإدارة: عرض وروابط فقط؛ كل ممتلك مرة واحدة، و«ما ينقصك» يطابق رسائل الشروط القائمة، والزر عند تحققها فقط، ومفتاح الرجوع.
const a = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const box = { module: { exports: {} }, require: require('node:module').createRequire(require.resolve('../src/engine.js')), console };
vm.runInNewContext(fs.readFileSync('src/engine.js', 'utf8').replace('const API = { ', 'const API = { staffDay, mgrDay, '), box);
const E = box.module.exports, A = E.A, near = (x, y) => a(Math.abs(x - y) < 1e-6, `${x} != ${y}`);
const same = (x, y) => a.equal(JSON.stringify(x), JSON.stringify(y));
function game() { const S = E.newGame(21); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.stage = 23; S.phase = 3; S.player.wallet.sar = 400000; S.noEvents = true; S.noShocks = true; return S; }
// أمين فعلي بالمسار الحقيقي: عامل خدم 120 يوماً ← مدير ← أمين (كما في اختبار الأمين)
function withSteward(S, city) {
  for (let i = 0; i < 2; i++) a(A.buildShop(S, city).ok); a(A.buildWarehouse(S, city).ok);
  const pr = S.player.props[city]; for (const w of pr.staff) { w.days = 120; w.free = 0; }
  const d0 = S.day; for (let day = d0 + 1; day <= d0 + 30; day++) { S.day = day; E.staffDay(S, city, pr, S.cities[city]); }
  a(A.promoteWorker(S, city, pr.staff[0].id, 'shop', pr.shops[0].id).ok);
  { const d1 = S.day; for (let day = d1 + 1; day <= d1 + 90; day++) { S.day = day; E.mgrDay(S, city, pr); } }
  a(A.auditCity(S, city).ok); a(A.promoteSteward(S, city).ok); return pr;
}
const total = (S, v) => v.countries.reduce((n, c) => n + c.cities.reduce((m, x) => m + x.assets.length, 0), 0);

// 1) منظومة صغيرة: ممتلك واحد بلا مدير
{
  const S = game(); a(A.buildShop(S, 'riyadh').ok); const raw = E.save(S), v = E.mgmtView(S);
  a.equal(E.save(S), raw, 'العرض لا يغيّر الحفظ'); a.equal(v.countries.length, 1); const c = v.countries[0].cities[0];
  a.equal(c.id, 'riyadh'); a.equal(c.rank, 0); a.equal(c.rankName, 'بلا مدير'); a.equal(c.assets.length, E.teamAssets(S, 'riyadh').length); a(c.assets.every(x => x.by === null)); a.equal(c.covered, 0);
  const pr = S.player.props.riyadh, w = pr.staff.slice().sort((x, y) => y.days - x.days || x.id - y.id)[0], q = E.promotionQuote(S, 'riyadh', w.id, c.assets[0].kind, c.assets[0].id);
  same(c.next.reasons, q.reasons); a.equal(c.next.ok, false); a.equal(c.next.action, null, 'لا زر ترقية قبل تحقق الشروط'); a.equal(c.next.name, 'مدير ممتلك');
  a.equal(c.alerts.filter(x => x.k === 'uncovered').length, c.assets.length); a(c.alerts.every(x => x.action === null));
  near(c.workerWages, pr.staff.reduce((n, x) => n + E.wkWage(S, S.cities.riyadh, x), 0)); near(c.wages, c.workerWages);
  a.equal(v.assets, c.assets.length); a.equal(v.covered, 0); a.equal(v.alerts, c.alerts.length);
  // لا عمال ولا ممتلكات: لا مدينة في العرض
  const S0 = game(); a.equal(E.mgmtView(S0).countries.length, 0);
}

// 2) أمين فعلي: التغطية، ما ينقصك للأمين، النطاق
{
  const S = game(), pr = withSteward(S, 'riyadh'); const v = E.mgmtView(S), c = v.countries[0].cities[0], m = pr.mgr;
  a.equal(c.rank, 3); a.equal(c.rankName, 'أمين المنطقة'); a.equal(c.assets.length, E.teamAssets(S, 'riyadh').length); a.equal(c.covered, c.assets.length); a(c.assets.every(x => x.by === 'steward'));
  a.equal(c.alerts.length, 0); a.equal(c.next, null, 'الرتبة التالية على مستوى الدولة'); near(c.mgrWage, E.managerWage(m)); a.equal(c.manager.span, E.stewardSpan(m));
  // أمين فوق نطاقه: ممتلكات أكثر من النطاق
  pr.whs = 8; const c2 = E.mgmtView(S).countries[0].cities[0]; a.equal(c2.assets.length, E.teamAssets(S, 'riyadh').length); a(c2.covered < c2.assets.length, 'ما فوق النطاق بلا مدير');
  const span = c2.alerts.find(x => x.k === 'span'); a(span, 'تنبيه أمين فوق نطاقه'); a(span.text.includes('أمين فوق نطاقه'));
  const up = E.stewardSpanQuote(S, 'riyadh', 1); a.equal(!!span.action, up.ok); if (up.ok) a.equal(span.action.act, 'steward-span');
  a.equal(c2.alerts.filter(x => x.k === 'uncovered').length, c2.assets.length - c2.covered);
}

// 3) مدير ممتلك ← «ما ينقصك للأمين» يطابق stewardQuote؛ والزر عند تحققها فقط
{
  const S = game(); for (let i = 0; i < 2; i++) a(A.buildShop(S, 'riyadh').ok); a(A.buildWarehouse(S, 'riyadh').ok);
  const pr = S.player.props.riyadh; for (const w of pr.staff) { w.days = 120; w.free = 0; } for (let day = 1; day <= 30; day++) { S.day = day; E.staffDay(S, 'riyadh', pr, S.cities.riyadh); }
  const w0 = pr.staff[0]; a(A.promoteWorker(S, 'riyadh', w0.id, 'shop', pr.shops[0].id).ok);
  let c = E.mgmtView(S).countries[0].cities[0]; a.equal(c.rank, 2); a.equal(c.rankName, 'مدير ممتلك'); a.equal(c.assets.filter(x => x.by === 'manager').length, 1, 'ممتلك واحد مغطّى'); a.equal(c.covered, 1);
  const q = E.stewardQuote(S, 'riyadh'); same(c.next.reasons, q.reasons); a.equal(c.next.ok, false); a.equal(c.next.action, null); a.equal(c.next.name, 'أمين المنطقة');
  { const d1 = S.day; for (let day = d1 + 1; day <= d1 + 90; day++) { S.day = day; E.mgrDay(S, 'riyadh', pr); } } a(A.auditCity(S, 'riyadh').ok);
  c = E.mgmtView(S).countries[0].cities[0]; a.equal(E.stewardQuote(S, 'riyadh').ok, true); a.equal(c.next.ok, true); a.equal(c.next.action.act, 'steward-promote'); a.equal(c.next.action.c, 'riyadh'); same(c.next.reasons, E.stewardQuote(S, 'riyadh').reasons);
}

// 4) وكيل الإقليم: شروطه عبر agentHireQuote؛ hireAgent بالرسائل نفسها
{
  const S = game(); const P1 = withSteward(S, 'riyadh');
  let co = E.mgmtView(S).countries[0]; a.equal(co.next.name, 'وكيل الإقليم'); a.equal(co.next.ok, false); a.equal(co.next.action, null); same(co.next.reasons, E.agentHireQuote(S, 'sa').reasons);
  a.equal(A.hireAgent(S, 'sa').msg, 'يُفتح في الطور 4'); a.equal(A.hireAgent(S, 'zz').msg, 'يُفتح في الطور 4', 'الترتيب الأصلي: الطور قبل الدولة');
  S.phase = 4; a.equal(A.hireAgent(S, 'zz').msg, 'دولة غير معروفة'); a.equal(A.hireAgent(S, 'sa').msg, 'يلزمك 2 أمناء على الأقل في السعودية (عندك 1)');
  withSteward(S, 'jeddah'); S.player.wallet.sar = 100; S.player.wallet.usd = 0; S.player.wallet.au = 0;
  co = E.mgmtView(S).countries[0]; a.equal(co.cities.length, 2); a.equal(co.next.ok, false); same(co.next.reasons, ['تحتاج 3000 ريال']); a.equal(A.hireAgent(S, 'sa').msg, 'تحتاج 3000 ريال');
  S.player.wallet.sar = 100000; co = E.mgmtView(S).countries[0]; a.equal(co.next.ok, true); a.equal(co.next.action.act, 'agenthire'); a.equal(co.next.action.i, 'sa'); same(co.next.reasons, []);
  const r = A.hireAgent(S, 'sa'); a(r.ok); co = E.mgmtView(S).countries[0]; a(co.agent); near(co.agent.wage, E.agentWage(S, 'sa')); a.equal(co.next, null, 'لا وكيل ثانٍ'); a.equal(A.hireAgent(S, 'sa').ok, false);
  near(co.wages, co.cities.reduce((n, x) => n + x.wages, 0) + co.agent.wage);
}

// 5) تنبيه المزرعة ينقصها مزارعون، وكل ممتلك مرة واحدة عبر الدول
{
  const S = game(); a(A.buildShop(S, 'riyadh').ok); a(A.buildFarm(S, 'riyadh').ok); a(A.buildShop(S, 'cairo').ok); a(A.buildWarehouse(S, 'cairo').ok);
  const pr = S.player.props.riyadh; pr.staff = pr.staff.filter(w => w.role !== 'farmer'); pr.farm.herd = { sheep: 60 };
  const v = E.mgmtView(S), c = v.countries.find(x => x.country === 'sa').cities[0], fa = c.alerts.find(x => x.k === 'farmers');
  a(fa); a(c.workers.farmer.missing > 0); a.equal(fa.text, 'مزرعة ينقصها ' + c.workers.farmer.missing + ' مزارع.');
  a.equal(!!fa.action, E.hirePool(S, 'riyadh') > 0); if (fa.action) { a.equal(fa.action.act, 'mg-hire'); a.equal(fa.action.g, 'farmer'); }
  a.equal(v.countries.length, 2); let n = 0; for (const id of ['riyadh', 'cairo']) n += E.teamAssets(S, id).length; a.equal(total(S, v), n, 'كل ممتلك يظهر مرة واحدة'); a.equal(v.assets, n);
  const keys = v.countries.flatMap(x => x.cities.flatMap(y => y.assets.map(z => y.id + ':' + z.kind + ':' + z.id))); a.equal(new Set(keys).size, keys.length);
}

// 6) مفتاح الرجوع والحفظ القديم
{
  const S = game(); a(A.buildShop(S, 'riyadh').ok); E.MGMT.on = false; a.equal(E.mgmtView(S), null); E.MGMT.on = true; a(E.mgmtView(S));
  const raw = E.save(S), L = E.load(raw); a(E.mgmtView(L)); a.equal(E.save(L).length > 0, true); a.equal(E.mgmtView(L).countries[0].cities[0].id, 'riyadh');
}
console.log('PASS management: small/large view, each asset once, next-rank reasons match existing quotes, buttons only when conditions met, agent quote, alerts, off switch, old save');
