// 040أ: رسم الثروة والحماية: LEVY مفتاح مستقل، معدل جديد معتدل، و on=false = القديم حرفياً: node test/levy.test.js
const fs = require('node:fs'), path = require('node:path');
const { E, load, run } = require('./lib/skill-sim.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const idle = (on, gold) => { E.LEVY.on = on; const S = load('autopilot-23'); S.player.gold += gold - E.netWorth(S); const w0 = E.netWorth(S), l0 = S.player.led.exp.wealthLevy || 0; run(S, 360); return { S, w0, w1: E.netWorth(S), levy: (S.player.led.exp.wealthLevy || 0) - l0 }; };
const L0 = { ...E.LEVY };
ok(L0.on === true && L0.base === 40000 && L0.old === 0.0006 && L0.rate < 0.0003 && L0.rate > 0, 'LEVY: on وbase=40000 ومعدل جديد معتدل');
// ثروة 1 مليون خاملة: التغير السنوي بين −4٪ و0 تقريباً، والرسم نسبي
const a = idle(true, 1e6), pa = a.w1 / a.w0 - 1;
ok(pa > -0.045 && pa < 0, 'مليون خاملة: ' + (pa * 100).toFixed(2) + '٪ سنوياً (بين −4.5 و0)');
const b = idle(true, 1e7), pb = b.w1 / b.w0 - 1;
ok(pb > -0.045 && pb < 0, '10 ملايين خاملة: ' + (pb * 100).toFixed(2) + '٪');
ok(b.levy > a.levy * 8, 'الرسم نسبي: يكبر مع الثروة بلا سقف (' + Math.round(a.levy) + ' ثم ' + Math.round(b.levy) + ')');
// رسم اليوم الواحد = (الثروة − القاعدة) × المعدل
{ E.LEVY.on = true; const S = load('autopilot-23'); S.player.gold += 1e6 - E.netWorth(S); const l0 = S.player.led.exp.wealthLevy || 0; run(S, 1); const nw = E.netWorth(S), d = (S.player.led.exp.wealthLevy || 0) - l0;
  ok(Math.abs(d - (nw - 40000) * L0.rate) / d < 0.02, 'رسم اليوم ≈ (الثروة − 40000) × المعدل'); }
// on=false: المعدل القديم حرفياً
{ E.LEVY.on = false; const S = load('autopilot-23'); S.player.gold += 1e6 - E.netWorth(S); const l0 = S.player.led.exp.wealthLevy || 0; run(S, 1); const nw = E.netWorth(S), d = (S.player.led.exp.wealthLevy || 0) - l0;
  ok(Math.abs(d - (nw - 40000) * 0.0006) / d < 0.02, 'LEVY.on=false: 0.0006 كما كان'); }
const c = idle(false, 1e6); ok(c.w1 / c.w0 - 1 < -0.15, 'LEVY.on=false: السحق القديم (' + ((c.w1 / c.w0 - 1) * 100).toFixed(1) + '٪)');
Object.assign(E.LEVY, L0);
// حفظ قديم يعمل بالمعادلة الجديدة (لا ترحيل) وتحت الحد لا رسم
{ const S = load('autopilot-18'); S.player.gold = 1000; const l0 = S.player.led.exp.wealthLevy || 0; run(S, 5); ok((S.player.led.exp.wealthLevy || 0) === l0, 'تحت 40000 لا رسم'); }
// الاسم الجديد في الدفتر وملخص الغياب (مصدر الواجهة المبنيّ)
const src = fs.readFileSync(path.join(__dirname, '../src/ui/12-screen-cities.js'), 'utf8') + fs.readFileSync(path.join(__dirname, '../src/ui/14b-life.js'), 'utf8');
ok((src.match(/wealthLevy: 'رسم الثروة والحماية'/g) || []).length === 2, 'الاسم «رسم الثروة والحماية» في LN وAWAY_EXP');
ok(/حراسة وتأمين ووكلاء/.test(src) && /كلما أدرتَ ما تملك/.test(src) && !/wealthLevy: 'زكاة وأعطيات'/.test(src), 'سطر الشرح موجود ولا «ضريبة»/«زكاة» في البند');
if (fails) { console.log(fails + ' FAIL'); process.exit(1); } console.log('PASS levy');
