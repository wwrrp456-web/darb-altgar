// مقارنة دخل القطاعات بعد سنة من رأس مال متساوٍ (محرك): node test/sectors.test.js
// المقياس: التغيّر في صافي الثروة (يشمل الأصول بقيمتها الدفترية) بعد 354 يوماً من 20000 ريال في الطور 3 دون صدمات
const E = require('../src/engine.js'), A = E.A;
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const START = 20000, YEARS = Number(process.env.SECTOR_YEARS || 1), CLIMATE = process.env.SECTOR_CLIMATE;
if(!Number.isInteger(YEARS)||YEARS<1||YEARS>12)throw Error('years must be 1..12');
function game() { const S = E.newGame(5); A.learnSetChar(S, 'trader'); S.phase = 3; S.player.gold = START; S.noShocks = !CLIMATE; S.noClimate = CLIMATE === 'off'; S.noEvents = true; if(CLIMATE){S.learn.level=11;S.learn.stage=23;S.learn.stageIntro=22;} S.player.caravans[0].city = 'riyadh'; return S; }
function year(S, step) { const w0 = E.netWorth(S); for (let d = 0; d < 354 * YEARS; d++) { if (step) step(S, d); E.tick(S); S.pause = false; } return (E.netWorth(S) - w0) / YEARS; }
const R = {};
R.idle = year(game());
R.direct = year(game(), S => { E.botMain(S); });
{ const S = game(); for (let i = 0; i < 3; i++) { A.hireCaptain(S); const car = S.player.caravans[S.player.caravans.length - 1]; car.captain.role = 'indep'; car.captain.home = 'sa'; } R.auto = year(S); }
{ const S=game();A.hireCaptain(S);const car=S.player.caravans.at(-1);car.captain.role='indep';car.captain.home='sa';R.captain1=year(S); }
{ const S = game(), c = S.cities.riyadh, goods = E.GIDS.filter(g => E.sells(c, g) && !E.GD[g].sp && !E.GD[g].live).sort((a, b) => c.dem[b] * E.unitPrice(c, b) - c.dem[a] * E.unitPrice(c, a)).slice(0, 4);
  for (let i = 0; i < 3; i++) A.buildShop(S, 'riyadh'); E.shopsOf(S, 'riyadh').forEach(sh => goods.forEach(g => A.shopSetItem(S, 'riyadh', sh.id, g, E.SHOP_PRICE0, true))); A.hireFill(S, 'riyadh'); R.shops3 = year(S); }
// المصنع مستقل: الدكان المطلوب للبناء بلا سلع تجزئة حتى لا يُنسب دخله إلى المصنع.
{ const S=game(),car=S.player.caravans[0];A.buildShop(S,'riyadh');A.buildWarehouse(S,'riyadh');R.factoryOk=A.buildFactory(S,'riyadh','perfume').ok;
 R.factory=year(S,S=>{A.fromStore(S,car.id,'perfume',1000);if(car.cargo.perfume>=1)A.sell(S,car.id,'perfume',car.cargo.perfume);}); }
// شراء حقيقي للقطيع، ثم بيع الصغار وبيع الصوف كل أسبوع دون إعادة حقن رأس المال.
{ const S=game(),car=S.player.caravans[0];A.buildShop(S,'riyadh');A.buildFarm(S,'riyadh');for(const w of [...E.staffOf(S,'riyadh')])if(w.role==='seller')A.fireStaff(S,'riyadh',w.id);A.hireHerder(S,car.id);
 const buy=A.buy(S,car.id,'sheep',20,'herd');ok(buy.ok&&buy.n===20,'شراء القطيع من السوق');ok(A.farmIn(S,car.id,'sheep',20).ok,'إيداع القطيع في المزرعة');A.fireHerder(S,car.id);
 let births=0,sold=0;R.farm=year(S,(S,d)=>{if(d%7)return;const f=E.farmOf(S,'riyadh'),n=Math.floor(E.youngOf(f,'sheep'));if(n){births+=n;const r=A.farmSell(S,'riyadh','sheep',n,'young');if(r.ok)sold+=r.n;}A.fromStore(S,car.id,'wool',1000);if(car.cargo.wool>=1)A.sell(S,car.id,'wool',car.cargo.wool);});ok(births>0&&sold>0,'تربية وبيع نسل فعلي'); }
console.log('\nمتوسط التغيّر السنوي في صافي الثروة من 20000 ريال؛ السنوات '+YEARS+'؛ المناخ '+(CLIMATE||'noShocks')+':');
console.log(JSON.stringify({years:YEARS,climate:CLIMATE||'noShocks',results:R}));
Object.keys(R).filter(k => k !== 'factoryOk').forEach(k => console.log('  ' + k.padEnd(8) + String(Math.round(R[k])).padStart(10) + '   ×' + (R[k] / Math.max(1, Math.abs(R.direct))).toFixed(1) + ' من التجارة المباشرة'));
Object.keys(R).forEach(k => ok(k === 'factoryOk' || Number.isFinite(R[k]), k + ': قيمة سليمة'));
ok(R.shops3 > R.idle && R.factory > R.idle && R.auto > R.idle, 'الدكاكين والمصنع والقادة المستقلون يتفوقون على الخمول');
if(YEARS===1)ok(R.shops3 < 8 * R.auto, 'التوازن: ثلاثة دكاكين لا تتجاوز ثمانية أضعاف أسطول ثلاثة قادة مستقلين (' + (R.shops3 / R.auto).toFixed(1) + '×)');
ok(R.factoryOk, 'بناء المصنع فعلياً');
if(YEARS===1)ok(R.factory>R.captain1&&R.factory<2*R.captain1&&R.factory<R.shops3, 'المصنع المستقل أعلى من قائد واحد وأقل من ضعفه ومن ثلاثة دكاكين');
if(YEARS===1)ok(R.factory<=4*R.auto, 'المصنع لا يتجاوز أربعة أضعاف الأسطول');
if(YEARS===1)ok(Math.abs(R.farm)<=4*R.auto, 'نتيجة المزرعة ضمن أربعة أضعاف الأسطول؛ الخسارة لا تُسمى دخلاً');
console.log('\nتنبيه: لاعب آلي ساذج يخسر معظم رأسماله في التجارة المباشرة والتلقائية عند رأس مال كبير نسبياً، فلا يُقرأ الجدول كمقياس للاعب ماهر؛ يُفصل المصنع عن إيراد الدكان، وتظهر خسارة المزرعة إن حدثت بلا إخفاء.');
console.log(fails ? fails + ' FAIL' : 'ALL OK'); process.exit(fails ? 1 : 0);
