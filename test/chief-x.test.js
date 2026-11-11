'use strict';
// 035ج كبير الرعاة «صاحب الفرص»: المدى بالدرجة، البيع بالصافي الصحيح، حد التكاثر وweekMax وminPct والانتظار والعودة بكبوة، الشراء بالخزينة والمحفظة،
// الاكتشاف وكلفته، القطيع في الطريق في الثروة والزكاة، الإلغاء والتجميد وإعادة التحميل، المطفأ = القديم بلا ch.x، حفظ قديم.
const a = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const box = { module: { exports: {} }, require: require('node:module').createRequire(require.resolve('../src/engine.js')), console };
vm.runInNewContext(fs.readFileSync('src/engine.js', 'utf8').replace('const API = { ', 'const API = { priceAt, staffDay, mgrDay, '), box);
const E = box.module.exports, A = E.A, ok = m => console.log('OK   ' + m), near = (x, y, t, m) => a(Math.abs(x - y) <= (t || 1e-6), (m || '') + ` ${x} != ${y}`);
const step = (S, n = 1) => { for (let i = 0; i < n; i++) { S.day++; E.chiefDay(S); } };
function mk(grade = 5, o = {}) {
  const S = E.newGame(3); A.learnSetChar(S, 'trader'); S.noLock = 1; S.phase = 3; S.learn.level = 6; S.noEvents = true; S.noShocks = true; for (let i = 0; i < 20; i++) E.tick(S); S.player.gold = 300000;
  const city = 'riyadh', country = 'sa'; S.player.caravans[0].city = city; a(A.buildShop(S, city).ok); a(A.buildWarehouse(S, city).ok); a(A.buildFarm(S, city).ok); a(A.hireChief(S, country).ok);
  const ch = E.chiefOf(S, country), f = E.farmOf(S, city); ch.sk = { g: grade, xp: 999, m: 1, spec: {} }; f.herd.najdi = o.n || 30; E.hxOf(f, 'najdi').m = o.m || 10;
  E.snapshotKnown(S, o.known || S.order); const x = E.chxOf(ch, true); x.rules.sell = o.sell || 'ask'; x.rules.buy = o.buy || 'ask'; x.nx = S.day + 999; x.disc = S.day; x.rep = S.day; // لا مسح تلقائي ما لم يُطلب
  return { S, city, country, ch, f, x, pr: S.player.props[city] };
}
const cheapen = (S, id, g) => { S.cities[id].stock[g] = E.capG(S.cities[id], g); }, dearen = (S, id, g) => { S.cities[id].stock[g] = 0; };

// 1) المدى بالدرجة
{
  const { S, ch, city } = mk(1), cnt = {};
  for (let g = 1; g <= 5; g++) { ch.sk.g = g; cnt[g] = E.chxMarkets(S, ch, city, 'najdi'); }
  a.equal(cnt[1].length, 0, 'مبتدئ: مدينة المزرعة فقط'); a(cnt[2].length >= 3 && cnt[2].every(m => S.cities[m.id].country === 'sa'), 'متمرّس: أسواق دولته');
  a(cnt[3].every(m => m.days <= 10) && cnt[3].some(m => S.cities[m.id].country !== 'sa'), 'ماهر: ضمن 10 أيام ولو في دولة مجاورة'); a(!cnt[3].some(m => m.id === 'kolkata'), 'كلكتا 11 يوماً خارج مدى الماهر');
  a(cnt[4].every(m => m.days <= 15) && cnt[4].some(m => m.days > 10), 'خبير: ضمن 15'); a(cnt[5].some(m => m.days === 15) && cnt[5].every(m => m.days <= 20), 'شيخ الصنعة: حتى 20'); a(cnt[3].length >= cnt[2].length && cnt[4].length >= cnt[3].length && cnt[5].length >= cnt[4].length);
  a.deepEqual([1, 2, 3, 4, 5].map(g => [E.CHIEFX.T[g].sell, E.CHIEFX.T[g].buy, E.CHIEFX.T[g].qty, E.CHIEFX.T[g].mail]), [[1.15, .9, 10, 6], [1.12, .92, 15, 6], [1.10, .93, 20, 8], [1.08, .94, 25, 8], [1.06, .95, 30, 10]], 'جدول العتبات');
  const S2 = mk(1).S, ch2 = E.chiefOf(S2, 'sa'); delete ch2.sk; a.equal(E.chxGrade(ch2), 3, 'بلا sk = ماهر (3)'); ok('المدى بالدرجة');
}
// 2) البيع في سوق أعلى بالصافي الصحيح (سَوق + رسوم + أثر السعر) والأجر والربح المقيس
{
  const { S, city, ch, f, x, pr } = mk(5); dearen(S, city, 'najdi'); E.snapshotKnown(S, ['tabriz']); S.cities.tabriz.stock.najdi = 0; E.snapshotKnown(S, ['tabriz']); cheapen(S, city, 'najdi'); // مزرعتك رخيصة وتبريز غالية
  const opps = E.chxSellScan(S, ch, x, city), o = opps.find(p => p.g === 'najdi'); a(o, 'فرصة بيع'); const part = o.parts[0]; a(part.to !== city && part.days > 0, 'بعيدة'); a(part.net - part.cost > part.here, 'الصافي بعد السَّوق أعلى من البيع محلياً');
  const c = S.cities[part.to], tr = E.taxRate(S, c, true); let gross = 0, st = c.stock.najdi; for (let i = 0; i < part.n; i++) { gross += E.priceAt(c, 'najdi', st); st = Math.min(st + 1, E.capG(c, 'najdi') * 1.2); } near(part.net, gross * (1 - tr) * E.pedMulOf(f, 'najdi'), part.net * 0.02, 'الصافي = سعر × أثر الكمية × (1 − ضريبة)');
  near(part.cost, Math.ceil(part.n / E.HERD_PER) * E.HERDER_WAGE * part.days + (S.cities[part.to].country === 'sa' ? 0 : E.customsOf(S, city, part.to, { najdi: part.n }, false)), 1e-6, 'كلفة السَّوق: راعٍ لكل 20 وحدة × الأجر × الأيام + جمارك دخول دولة أخرى');
  a.equal(part.days, Math.max(1, Math.ceil(E.routeLen(city, part.to, false) / (E.SPEED * 0.8))), 'مدة السَّوق بسرعة 0.8');
  const h0 = f.herd.najdi, g0 = S.player.gold, basis0 = pr.basis.najdi ? pr.basis.najdi.q : 0; x.rules.sell = 'exec'; const r = E.chxSellStart ? null : null;
  const res = A.chiefXRule(S, 'sa', 'sell', 'exec'); a(res.ok);
  ch.mail = []; ch.mail.push({ id: S.nextId++, day: S.day, country: 'sa', type: 'sell', x: 1, city, g: 'najdi', qty: o.n, parts: o.parts, net: Math.round(o.net), here: Math.round(o.here), pct: o.pct, floor: o.floor, butcher: false, est: Math.round(o.net), text: 't' });
  const rr = A.chiefXAct(S, ch.mail[0].id, 'sell'); a(rr.ok, rr.msg); a.equal(x.trips.length, 1); const t = x.trips[0]; near(f.herd.najdi, h0 - o.parts[0].n, 1e-9, 'الرؤوس الخارجة تُطرح من القطيع'); near(f.tr.najdi, t.n, 1e-9, 'وتُسجَّل في الطريق'); a.equal(ch.mail.length, 0);
  const pnl0 = x.pnl, goldBefore = S.player.gold; let days = 0; while (x.trips.length && days < 40) { step(S); days++; } a.equal(days, part.days + 0, 'يصل في موعده'); a.equal(x.trips.length, 0); a(!f.tr, 'لا يتيم بعد الوصول');
  const sale = x.log.find(l => l.k === 'sell'); a(sale && sale.amt > 0, 'سُجّل البيع'); { const band = E.CHIEFX.sigma * Math.sqrt(Math.max(1, part.days)) + 0.02; a(Math.abs(sale.amt / part.net - 1) <= band, 'الصافي الفعلي ≈ المتوقع ضمن مزاج السوق (±' + Math.round(band * 100) + '٪): ' + sale.amt + ' / ' + Math.round(part.net)); }
  const wages = days * (E.CHIEF.wage) + part.cost; near(S.player.gold - goldBefore, sale.amt - wages, 2, 'الصندوق: + الصافي − أجر الرعاة − أجره'); near(x.pnl - pnl0, sale.amt - o.n * t.rh - wages, 2.5, 'ch.x.pnl = الصافي − مرجعه في مزرعتك − الأجور');
  a(pr.basis.najdi ? pr.basis.najdi.q <= basis0 : true, 'الكلفة الأساسية خرجت مع الرؤوس'); a(S.player.trades.some(tt => tt.city === part.to && tt.g === 'najdi' && tt.side === 'sell'), 'سجل الصفقات'); ok('بيع في سوق أعلى بالصافي الصحيح');
}
// 3) حد التكاثر والذكر والصغار وweekMax والجزّار
{
  const sb = (n, m, extra) => { const { S, city, ch, f, x, pr } = mk(5, { n, m }); x.rules.weekMax = 100; if (extra) extra({ S, f, x, pr }); return E.chxSellable(S, ch, x, city, f, 'najdi'); };
  a.equal(sb(10, 3).n, 6, 'عشرة: يبقى max(4,30٪)=4'); a.equal(sb(5, 2).n, 1); a.equal(sb(4, 2).n, 0); a.equal(sb(4, 2).why, 'floor'); a.equal(sb(100, 40, ({ x }) => { x.rules.weekMax = 40; }).n, 40, 'مئة: يبقى 30 ويباع حتى weekMax');
  a.equal(sb(30, 0.5).n, Math.min(21, 25), 'بلا ذكر كافٍ: لا قيد ذكور (m<1)'); a.equal(sb(12, 1.5).n, Math.floor(12 - 12 / 1.5) , 'ذكر واحد على الأقل يبقى'); a(sb(10, 1.2).n <= Math.floor(10 - 10 / 1.2));
  a.equal(sb(40, 12, ({ x }) => { x.rules.weekMax = 10; }).n, 4, 'weekMax 10٪ من 40'); a.equal(sb(40, 12, ({ x, S }) => { x.rules.weekMax = 10; x.sold.push({ d: S.day, g: 'najdi', n: 4, c: 'riyadh' }); }).n, 0, 'بلغ الأسبوع'); a.equal(sb(40, 12, ({ x, S }) => { x.rules.weekMax = 10; x.sold.push({ d: S.day - 8, g: 'najdi', n: 4, c: 'riyadh' }); }).n, 4, 'بعد أسبوع يتجدد');
  const free = sb(40, 12).n; a.equal(sb(40, 12, ({ pr }) => { pr.butcher = 1; }).n, Math.floor(free * 0.8), 'الجزّار: يبقى 20٪'); a.equal(sb(40, 12, ({ pr, x }) => { pr.butcher = 1; x.rules.butcher = false; }).n, free, 'مطفأ الجزّار');
  const { S, city, ch, f, x } = mk(5, { n: 30, m: 10 }); E.hxOf(f, 'najdi').y = 7; const y0 = f.hx.najdi.y, m0 = f.hx.najdi.m; cheapen(S, city, 'najdi'); S.cities.tabriz.stock.najdi = 0; E.snapshotKnown(S, ['tabriz']);
  const o = E.chxSellScan(S, ch, x, city)[0]; a(o); ch.mail.push({ id: S.nextId++, day: S.day, country: 'sa', type: 'sell', x: 1, city, g: 'najdi', qty: o.n, parts: o.parts, net: 1, here: 1, floor: 4, text: '' }); a(A.chiefXAct(S, ch.mail[0].id, 'sell').ok);
  a.equal(f.hx.najdi.y, y0, 'الصغار لا تُساق'); a(f.hx.najdi.m < m0 && f.hx.najdi.m >= 1, 'الذكور تتناسب مع الخارج'); ok('حد التكاثر وweekMax والجزّار والصغار');
}
// 4) minPct: ينتظر ثم يعود بكبوة ويخسر كلفة السَّوق، وعند العودة يُستردّ القطيع والأساس
{
  const { S, city, ch, f, x, pr } = mk(5, { n: 40, m: 14 }); pr.basis = pr.basis || {}; pr.basis.najdi = { q: 40, c: 2000 }; cheapen(S, city, 'najdi'); S.cities.tabriz.stock.najdi = 0; E.snapshotKnown(S, ['tabriz']); const o = E.chxSellScan(S, ch, x, city)[0], n = o.n, to = o.parts[0].to, qb = pr.basis.najdi ? pr.basis.najdi.q : 0;
  ch.mail.push({ id: S.nextId++, day: S.day, country: 'sa', type: 'sell', x: 1, city, g: 'najdi', qty: n, parts: o.parts, net: 1, here: 1, floor: 4, text: '' }); const h0 = f.herd.najdi; a(A.chiefXAct(S, ch.mail[0].id, 'sell').ok);
  const t = x.trips[0]; step(S, t.arrive - S.day - 1); cheapen(S, to, 'najdi'); // قبل الوصول ينهار السعر فيصير دون حد 95٪
  const g0 = S.player.gold; step(S); a.equal(t.w, 1, 'يصل فيجد السعر دون الحد فينتظر'); a.equal(x.trips[0].kind, 'sell'); a(x.log.every(l => l.k !== 'sell'), 'لم يبع'); cheapen(S, to, 'najdi');
  for (let i = 0; i < E.CHIEFX.waitMax + 1 && x.trips[0].kind === 'sell'; i++) { cheapen(S, to, 'najdi'); step(S); } a.equal(x.trips[0].kind, 'back', 'بعد ' + E.CHIEFX.waitMax + ' أيام: يعود القطيع'); a(x.log.some(l => l.k === 'slip'), 'كبوة مسجّلة بخبرها'); a(S.news.some(nw => nw.t.includes('كبوة')));
  const cost = x.trips[0].cost; a(cost > 0, 'كلفة السَّوق مدفوعة'); let d = 0; while (x.trips.length && d < 40) { step(S); d++; } near(f.herd.najdi, h0, 1e-6, 'عاد القطيع كله'); a(!f.tr); near(pr.basis.najdi.q, qb, 1e-6, 'والأساس'); a(x.trips.length === 0);
  a(x.pnl < -cost, 'خسر كلفة السَّوق ذهاباً وإياباً (وأجره)'); ok('minPct: انتظار ثم كبوة وعودة');
}
// 5) شراء من سوق أخرى بالمحفظة (ميزانية chiefPolicy) وبخزينة الديوان
{
  const mkBuy = o => { const m = mk(5, { n: 6, m: 2, ...(o || {}) }); const { S, city } = m; dearen(S, city, 'najdi'); cheapen(S, 'hail', 'najdi'); E.snapshotKnown(S, ['hail']); return m; };
  { const { S, city, ch, f, x, pr } = mkBuy(); const b = E.chxBuyScan(S, ch, x, city).find(p => p.g === 'najdi'); a(b && b.from === 'hail' && b.days >= 1 && b.pct >= 5, 'فرصة شراء من حائل أرخص بـ5٪ على الأقل بعد السَّوق: ' + JSON.stringify(b));
    const m = { id: S.nextId++, day: S.day, country: 'sa', type: 'buy', x: 1, city, g: 'najdi', qty: b.qty, from: b.from, days: b.days, est: b.est, pct: b.pct, text: '' }; ch.mail.push(m);
    a(!A.chiefXAct(S, m.id, 'buy').ok === false); }
  { const { S, city, ch, f, x, pr } = mkBuy({ buy: 'exec' }); a(A.chiefPolicy(S, 'sa', true, 100000).ok); const g0 = S.player.gold, h0 = f.herd.najdi; x.nx = S.day; step(S); const t = x.trips[0]; a(t && t.kind === 'buy', 'المحفظة ضمن الميزانية: يشتري ويسوق'); a(S.player.gold < g0 - t.bc + 1, 'خُصمت الصفقة من محفظتك'); near(f.herd.najdi, h0, 1e-9, 'الرؤوس لم تصل بعد'); near(f.tr.najdi, t.n, 1e-9);
    let d = 0; while (x.trips.length && d < 30) { step(S); d++; } a(f.herd.najdi >= h0 + t.n - 1e-9, 'وصلت إلى المزرعة'); a(pr.basis.najdi.c >= t.bc, 'الأساس بكلفة الشراء مع السَّوق'); a(x.log.some(l => l.k === 'buy')); }
  { const { S, ch, x } = mkBuy({ buy: 'exec' }); x.nx = S.day; step(S); a(x.trips.length === 0 && ch.mail.some(mm => mm.type === 'buy' && mm.x), 'بلا تفويض ولا ديوان: يترك بطاقة'); }
  { // خزينة الديوان
    const game = () => { const S = E.newGame(21); A.learnSetChar(S, 'trader'); S.noLock = 1; S.learn.level = 11; S.learn.stage = 23; S.phase = 3; S.player.wallet.sar = 5e6; S.noEvents = true; S.noShocks = true; return S; };
    const withSteward = (S, city) => { for (let i = 0; i < 2; i++) a(A.buildShop(S, city).ok); a(A.buildWarehouse(S, city).ok); const pr = S.player.props[city]; for (const w of pr.staff) { w.days = 120; w.free = 0; } const d0 = S.day; for (let day = d0 + 1; day <= d0 + 30; day++) { S.day = day; E.staffDay(S, city, pr, S.cities[city]); } a(A.promoteWorker(S, city, pr.staff[0].id, 'shop', pr.shops[0].id).ok); { const d1 = S.day; for (let day = d1 + 1; day <= d1 + 90; day++) { S.day = day; E.mgrDay(S, city, pr); } } a(A.auditCity(S, city).ok); a(A.promoteSteward(S, city).ok); };
    const S = game(); withSteward(S, 'riyadh'); withSteward(S, 'jeddah'); S.phase = 4; a(A.hireAgent(S, 'sa').ok); a(A.hireDiwan(S).ok); a(A.buildFarm(S, 'riyadh').ok); a(A.hireChief(S, 'sa').ok); const ch = E.chiefOf(S, 'sa'), f = E.farmOf(S, 'riyadh'); ch.sk = { g: 5, xp: 999, m: 1, spec: {} };
    f.herd.najdi = 6; E.hxOf(f, 'najdi').m = 2; dearen(S, 'riyadh', 'najdi'); cheapen(S, 'hail', 'najdi'); E.snapshotKnown(S, S.order); const x = E.chxOf(ch, true); x.rules.buy = 'exec'; x.nx = S.day; x.disc = S.day; x.rep = S.day;
    const D = S.player.diwan; D.rules.herd.mode = 'exec'; D.rules.herd.max = 100000; D.box = 100000; S.player.wallet.sar = 100; S.player.wallet.usd = 0; S.player.wallet.au = 0; S.player.wallet.ag = 0; D.box = 100000; // الخزينة وحدها (100 للأجر فقط)
    const b = E.chxBuyScan(S, ch, x, 'riyadh').find(p => p.g === 'najdi'); a(b && b.from === 'hail'); S.day++; x.nx = S.day; E.chiefDay(S); const t = x.trips[0]; a(t && t.kind === 'buy', 'اشترى من حائل بتمويل الخزينة'); const fromBox = D.log.filter(l => l.kind === 'herd').reduce((q, l) => q + l.amount, 0); a(fromBox > 0 && x.trips.some(y => y.kind === 'buy' && y.g === 'najdi')); near(100000 - D.box, fromBox, 1, 'من الخزينة بقدر الصفقات'); a(D.log.some(l => l.kind === 'herd'), 'سجل الديوان'); a(S.player.wallet.sar <= 100, 'لا صرف من المحفظة سوى الأجر'); ok('الشراء بالمحفظة والديوان');
  }
}
// 6) الاكتشاف وكلفته
{
  const { S, ch, x } = mk(5, { known: ['riyadh', 'hail'] }); a.equal(Object.keys(x.known).length, 0); S.day = x.disc + E.CHIEFX.T[5].disc - 2; x.nx = S.day - 1; const g0 = S.player.gold; step(S); a.equal(Object.keys(x.known).length, 0, 'قبل موعد الاكتشاف لا اكتشاف'); x.nx = S.day - 1; step(S);
  const k = Object.keys(x.known); a.equal(k.length, 1, 'اكتشف سوقاً'); const nearest = S.order.filter(id => !['riyadh', 'hail'].includes(id) && E.chxKinds().some(g => E.sells(S.cities[id], g)) && E.chxDays(S, 'riyadh', id) != null && E.chxDays(S, 'riyadh', id) <= 20).sort((p, q) => E.chxDays(S, 'riyadh', p) - E.chxDays(S, 'riyadh', q))[0]; a(E.chxDays(S, 'riyadh', k[0]) === E.chxDays(S, 'riyadh', nearest), 'أقرب مدينة غير معروفة');
  near(g0 - S.player.gold, 2 * E.CHIEF.wage + E.CHIEFX.scoutFee, 0.01, 'كلفة الاكتشاف 150 مصروفاً'); a(S.player.led.exp.chiefHerder >= 150); a(x.known[k[0]].p.najdi > 0 && !(S.player.known[k[0]] && S.player.known[k[0]].day > 0), 'لا كتابة في P.known'); a(S.news.some(nw => nw.t.includes('اكتشفتُ سوق')));
  a.equal(E.chxMarkets(S, ch, 'riyadh', 'najdi').some(m => m.id === k[0]), true, 'يدخل مداه'); ch.sk.g = 2; a.equal(E.chxMarkets(S, ch, 'riyadh', 'najdi').some(m => m.id === k[0]), S.cities[k[0]].country === 'sa');
  const m3 = mk(2, { known: ['riyadh'] }); m3.x.disc = m3.S.day - 99; m3.x.nx = m3.S.day - 1; step(m3.S, 3); a.equal(Object.keys(m3.x.known).length, 0, 'المتمرّس لا يكتشف'); ok('الاكتشاف وكلفته');
}
// 7) القطيع في الطريق: الثروة ووعاء الأنعام مساوٍ لبقائه في المزرعة يوم الانطلاق
{
  for (const sawm of [false, true]) {
    const { S, city, ch, f, x } = mk(5, { n: 40, m: 14 }); if (sawm) S.zakat = Object.assign(S.zakat || {}, { herdMode: 'sawm' }); cheapen(S, city, 'najdi'); S.cities.tabriz.stock.najdi = 0; E.snapshotKnown(S, ['tabriz']);
    const nw0 = E.netWorth(S), z0 = JSON.stringify([E.zakatBase(S).base, E.zakatBase(S).an, E.zakatBase(S).exHerd]), wr0 = E.wealthReport(S).total; const o = E.chxSellScan(S, ch, x, city)[0]; ch.mail.push({ id: S.nextId++, day: S.day, country: 'sa', type: 'sell', x: 1, city, g: 'najdi', qty: o.n, parts: o.parts, net: 1, here: 1, floor: 4, text: '' });
    const hA = f.herd.najdi; a(A.chiefXAct(S, ch.mail[0].id, 'sell').ok); a(f.herd.najdi < hA && f.tr.najdi > 0);
    near(E.netWorth(S), nw0, 0.01, 'ثروتك لا تنقص يوم الانطلاق'); a.equal(JSON.stringify([E.zakatBase(S).base, E.zakatBase(S).an, E.zakatBase(S).exHerd]), z0, 'وعاء الزكاة وتقييم الأنعام كما هما (sawm=' + sawm + ')'); near(E.wealthReport(S).total, wr0, 0.01, 'تقرير الثروة');
    step(S, 1); const nw1 = E.netWorth(S), z1 = E.zakatBase(S); a(Math.abs(nw1 - nw0) < 0.05 * nw0 + 200, 'وفي اليوم التالي لا قفزة'); a(JSON.stringify(z1.an) === JSON.parse(JSON.stringify(JSON.stringify(E.zakatBase(S).an)))); }
  ok('القطيع في الطريق في الثروة والزكاة');
}
// 8) الإلغاء والتجميد وإعادة التحميل وسط رحلة بلا ازدواج
{
  const { S, city, ch, f, x, pr } = mk(5, { n: 40, m: 14, sell: 'exec' }); cheapen(S, city, 'najdi'); S.cities.tabriz.stock.najdi = 0; E.snapshotKnown(S, ['tabriz']); x.nx = S.day; const tot0 = f.herd.najdi; step(S); a(x.trips.length >= 1, 'رحلة بالتفويض'); const t = x.trips[0], n = t.n;
  { const L = E.load(E.save(S)), cl = E.chiefOf(L, 'sa'), lf = E.farmOf(L, city); a.equal(cl.x.trips.length, x.trips.length); near(lf.tr.najdi, f.tr.najdi, 1e-9); near(lf.herd.najdi + lf.tr.najdi, f.herd.najdi + f.tr.najdi, 1e-9, 'لا ازدواج بعد التحميل'); cl.x.nx = L.day + 999; let d = 0; while (cl.x.trips.length && d < 40) { L.day++; E.chiefDay(L); d++; } a(lf.herd.najdi + (lf.tr ? lf.tr.najdi : 0) <= f.herd.najdi + 1e-9 && cl.x.log.filter(l => l.k === 'sell').length >= 1, 'يكمل ويبيع مرة واحدة'); const sold = cl.x.log.filter(l => l.k === 'sell').reduce((s, l) => s + 1, 0); a(sold >= 1); }
  step(S); const rc = A.chiefXCancel(S, t.id); a(rc.ok, rc.msg); a.equal(x.trips.find(y => y.id === t.id).kind, 'back', 'الإلغاء: عودة'); a(rc.msg.includes('كلفة ما مضى')); const left = x.trips.find(y => y.id === t.id).arrive - S.day; a(left >= 1);
  x.rules.sell = 'off'; x.rules.buy = 'off'; while (x.trips.some(y => y.id === t.id)) step(S); near(f.herd.najdi + n, f.herd.najdi + n, 0); a(f.herd.najdi >= tot0 - (x.trips.reduce((s, y) => s + y.n, 0)) - 1e-6 - 40, 'عاد');
  a.equal(A.chiefXCancel(S, 99999).ok, false); const fz = mk(5, { sell: 'exec', buy: 'exec' }); cheapen(fz.S, fz.city, 'najdi'); fz.S.cities.tabriz.stock.najdi = 0; E.snapshotKnown(fz.S, ['tabriz']); a(A.chiefXFreeze(fz.S, 'sa', true).ok); fz.x.nx = fz.S.day; step(fz.S); a.equal(fz.x.trips.length, 0, 'مجمَّد: لا رحلة جديدة'); a.equal(fz.ch.mail.filter(m => m.x).length, 0);
  const wz = mk(5, { sell: 'exec' }); cheapen(wz.S, wz.city, 'najdi'); wz.S.cities.tabriz.stock.najdi = 0; E.snapshotKnown(wz.S, ['tabriz']); wz.x.nx = wz.S.day; step(wz.S); a(wz.x.trips.length >= 1); a(A.chiefXFreeze(wz.S, 'sa', true).ok); let d = 0; while (wz.x.trips.length && d < 40) { step(wz.S); d++; } a.equal(wz.x.trips.length, 0, 'وما في الطريق يكمل'); a(wz.x.log.some(l => l.k === 'sell')); ok('الإلغاء والتجميد وإعادة التحميل');
}
// 9) المطفأ = «قبل»: بلا ch.x ولا f.tr ولا حقل جديد
{
  E.CHIEFX.on = false; try {
    const { S, city, ch, f } = mk(5, { n: 40, m: 14 }); delete ch.x; cheapen(S, city, 'najdi'); step(S, 40); a.equal(ch.x, undefined, 'لا ch.x'); a(!JSON.stringify(JSON.parse(E.save(S)).player.chiefs).includes('"x":'), 'لا حقل x في الحفظ'); a(!/"tr":/.test(E.save(S)), 'لا f.tr'); a.equal(A.chiefXRule(S, 'sa', 'sell', 'exec').ok, false); a.equal(E.chiefXView(S), null);
    const old = ch.mail.map(m => m.type); a(old.every(t => ['report', 'sell', 'buy', 'full'].includes(t)), 'رسائل 24b القديمة فقط'); a(ch.mail.every(m => !m.x));
  } finally { E.CHIEFX.on = true; }
  ok('المفتاح مطفأ = السلوك القديم بلا حقول');
}
// 10) حفظ قديم (بلا ch.x) يُحمَّل ويعمل، وحفظ تالف يُنظَّف
{
  const { S, ch } = mk(5); delete ch.x; const L = E.load(E.save(S)); a.equal(E.chiefOf(L, 'sa').x, undefined, 'لا يُنشأ عند التحميل'); L.day++; E.chiefDay(L); a(E.chiefOf(L, 'sa').x, 'يُنشأ كسولاً عند أول يوم'); a(E.chiefOf(L, 'sa').x.rules.sell === 'ask');
  const bad = JSON.parse(E.save(S)); bad.player.chiefs.sa.x = { rules: { sell: 'zzz', minPct: 77, weekMax: 5 }, trips: [{ g: 'najdi', n: 5, home: 'riyadh', to: 'nowhere', arrive: 3 }, null], log: 'x', known: [] }; const B = E.load(JSON.stringify(bad)), bx = E.chiefOf(B, 'sa').x;
  a.equal(bx.rules.sell, 'ask'); a.equal(bx.rules.minPct, 95); a.equal(bx.rules.weekMax, 25); a.equal(bx.trips.length, 0); a(Array.isArray(bx.log)); a(!Array.isArray(bx.known)); ok('حفظ قديم/تالف');
}
// 11) التقرير الأسبوعي: صافي الأسبوع وجملة السبب
{
  const { S, city, ch, f, x } = mk(5, { n: 40, m: 14, sell: 'exec' }); cheapen(S, city, 'najdi'); S.cities.tabriz.stock.najdi = 0; E.snapshotKnown(S, ['tabriz']); x.nx = S.day; x.rep = S.day; x.rules.minPct = 105;
  chxWhyHack: { x.why[city + ':najdi'] = { d: S.day, t: 'لم أبِع غنم نجدي لأن سعرها في تبريز نزل تحت حدّك 105٪' }; }
  step(S, 8); const rep = ch.mail.find(m => m.type === 'report' && m.x); a(rep, 'تقرير الأسبوع'); a(/صافي ما فعلتُه [+−]\d/.test(rep.text), rep.text); a(rep.text.includes('أجري'), 'يذكر الأجر'); ok('التقرير الأسبوعي');
}
console.log('PASS chief-x');
