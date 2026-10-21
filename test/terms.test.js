// المصطلحات والنصوص المعتمدة من المختص (الفدية بدل الجزية، المساهمة بدل النفوذ، الهدية والرشوة، العُشور، الجاموس): node test/terms.test.js
const fs = require('fs'), path = require('path'); const E = require('../src/engine.js'), A = E.A, LS = require('../src/lessons.js'), F = E.FIQH;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const files = ['src/cards.js', 'src/lessons.js', 'src/dialogs.js', 'src/lore.js', 'src/babylon.js'].concat(fs.readdirSync(path.join(__dirname, '../src/ui')).map(f => 'src/ui/' + f), fs.readdirSync(path.join(__dirname, '../src/engine')).map(f => 'src/engine/' + f));
const txt = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
ok(!files.some(f => /(^|[^م])الجزية|(^|[^م])جزية/.test(txt(f).replace(/مجزية/g, ''))), 'لا «جزية» في أي نص: ما يُدفع لقطّاع الطرق «فدية الطريق»');
ok(/ادفع فدية الطريق/.test(txt('src/ui/08-screen-market.js')) && /دفعتَ فدية الطريق/.test(txt('src/engine/17-shocks.js')), 'زرّ ورسالة دفع الفدية');
ok(!/اكسب نفوذاً/.test(files.map(txt).join('\n')) && /ساهم في خدمات السوق/.test(txt('src/ui/10-screen-lords.js')), 'زرّ «ساهم في خدمات السوق» بدل «اكسب نفوذاً»');
ok(/الهدية تكون محبةً وإكراماً بلا مقابل مشروط/.test(LS.REACT.giftLesson.t) && /الرشوة فهي دفع المال لإبطال حق/.test(LS.REACT.giftLesson.t) && /الكبائر/.test(LS.REACT.giftLesson.t), 'نص عمّ سالم: الفرق بين الهدية والرشوة');
ok(/فالنفس أعظم حرمةً من المال/.test(LS.REACT.roadPaid.t) && /الإثم على الظالم المعتدي/.test(LS.REACT.roadPaid.t), 'نص عمّ سالم عند دفع الفدية');
ok(LS.REACT.ushur.t.startsWith('العُشور: رسوم تجارية نظّمها المسلمون قديماً') && /المعاملة بالمثل/.test(LS.REACT.ushur.t), 'نص العُشور المعتمد');
ok(F.HEAD === 'دفتر أحكام التجارة: هذا المحتوى لغرض التدريب والتعليم المالي والتاريخي الميسّر، وفي الفتوى والوقائع الحقيقية يُرجع للعلماء الثقات.', 'عبارة الإخلاء في ترويسة دفتر الأحكام بصيغة المختص');
// الهدية والمساهمة تُظهران التعليق مرة واحدة
const mk = seed => { const S = E.newGame(seed); A.learnSetChar(S, 'trader'); S.learn.level = 6; S.learn.intro = 6; S.learn.abroad = true; S.phase = 2; S.player.gold = 99999; return S; };
{ const S = mk(3), city = S.player.caravans[0].city; const r = A.gift(S, city); ok(r.ok !== false && (S.learn.rq.includes('giftLesson') || S.learn.rseen.giftLesson === 1), 'أول هدية: يظهر تعليق الفرق بين الهدية والرشوة'); S.learn.rq = []; S.day += 20; A.gift(S, city); ok(S.learn.rseen.giftLesson === 1, 'مرة واحدة'); }
{ const S = mk(4), city = S.player.caravans[0].city; const r = A.lobby(S, city, 5); ok(r.ok !== false && S.learn.rseen.giftLesson === 1, 'أول مساهمة في خدمات السوق تُظهر التعليق نفسه'); }
// العُشور عند أول جمارك
{ const S = mk(5); const car = S.player.caravans[0]; car.city = 'riyadh'; car.left = 0; car.cargo = { coffee: 50 }; car.basis = { coffee: { q: 50, c: 2000 } }; const r = A.travel(S, car.id, 'cairo', 0); for (let i = 0; i < 30 && car.left > 0; i++) E.tick(S); ok(r.ok !== false && (S.learn.rseen.ushur === 1), 'أول جمارك عند عبور دولة: تعليق العُشور'); }
// الجاموس مع البقر
{ const g = E.GD; ok(E.SEASONS.adha.goods.includes('buffalo') && E.SEASONS.adha.goods.includes('cow'), 'الجاموس مع البقر في موسم الأضاحي'); }
{ const S = mk(6), car = S.player.caravans[0]; car.herd = { cow: 20, buffalo: 14 }; S.zakat.herdMode = 'sawm'; const a = E.anAssess(S); const row = a.rows.find(r => r.kind === 'cow'); ok(a.any && row && row.n === 34 && row.due.some(d => d.k === 'tabi'), 'الجاموس يُضم إلى البقر في نصاب الأنعام (٢٠ بقرة + ١٤ جاموساً = ٣٤)'); }
console.log(fails ? 'فشل ' + fails : 'نجحت كل الاختبارات'); process.exit(fails ? 1 : 0);
