// تقرير الثروة: مجموع البنود = الثروة المعروضة: node test/wealth-report.test.js
const a = require('node:assert/strict'), E = require('../src/engine.js'), A = E.A;
const S = E.newGame(3); A.learnSetChar(S, 'trader'); S.noLock = 1; S.phase = 4; S.player.gold = 400000;
const city = S.player.caravans[0].city; A.buildShop(S, city); A.buildShop(S, city); A.buildWarehouse(S, city); A.buildFarm(S, city);
const near = (x, y, m) => a(Math.abs(x - y) < 1, m + ' (' + x + ' مقابل ' + y + ')');
let R = E.wealthReport(S); near(R.rows.reduce((t, r) => t + r.value, 0), E.netWorth(S), 'المجموع = الثروة');
a(R.rows.some(r => r.k === 'shops') && R.rows.some(r => r.k === 'whs') && R.rows.some(r => r.k === 'farms'), 'الدكاكين والمخازن والمزارع ظاهرة');
A.buy(S, S.player.caravans[0].id, 'wheat', 20); S.player.vault = 1500; S.player.bank.dep[city] = 5000; S.player.bank.loans.push({ amt: 3000, due: S.day + 30 });
S.cities[city].owner === 'player' || (S.bosses[city] && (S.bosses[city].ruler = 'player'));
R = E.wealthReport(S); near(R.rows.reduce((t, r) => t + r.value, 0), E.netWorth(S), 'المجموع = الثروة مع البضاعة والحصّالة والمضاربة والقرض والحكم');
a(R.rows.find(r => r.k === 'loans').value === -3000, 'القرض بالسالب'); a(R.rows.find(r => r.k === 'vault').kind === 'cash', 'الحصّالة سيولة');
a(R.by.asset > 0 && R.assetCash === Math.round(R.by.asset * E.ASSET_SALE_FACTORS.calm), 'ما تقبضه من الأصول بنسبة البيع');
a(R.rows.every(r => r.items.every(i => typeof i.l === 'string')), 'تفاصيل البنود');
console.log('PASS wealth report');
