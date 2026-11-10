// 040أ: رسم الثروة ملغى: الافتراضي لا يُخصم شيء، وLEVY.on=true يعيد المعادلة القديمة حرفياً: node test/levy.test.js
const fs = require('node:fs'), path = require('node:path');
const { E, load, run } = require('./lib/skill-sim.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const idle = (on, gold, days) => { E.LEVY.on = on; const S = load('autopilot-23'); S.player.gold += gold - E.netWorth(S); const w0 = E.netWorth(S), l0 = S.player.led.exp.wealthLevy || 0; run(S, days); return { S, w0, w1: E.netWorth(S), levy: (S.player.led.exp.wealthLevy || 0) - l0 }; };
const L0 = { ...E.LEVY };
ok(L0.on === false && L0.base === 40000 && L0.old === 0.0006, 'LEVY = { on:false, base:40000, old:0.0006 }');
// ثروة 1 مليون خاملة 60 يوماً: لا wealthLevy افتراضياً
const a = idle(false, 1e6, 60); ok(a.levy === 0, 'الافتراضي: لا wealthLevy بعد 60 يوماً (' + a.levy + ')');
ok(a.w1 / a.w0 > 0.99, 'الثروة الخاملة لا تتآكل بالرسم: ' + ((a.w1 / a.w0 - 1) * 100).toFixed(2) + '٪ في 60 يوماً');
// on=true: المعادلة القديمة حرفياً (يوم واحد)
{ E.LEVY.on = true; const S = load('autopilot-23'); S.player.gold += 1e6 - E.netWorth(S); const l0 = S.player.led.exp.wealthLevy || 0; run(S, 1); const nw = E.netWorth(S), d = (S.player.led.exp.wealthLevy || 0) - l0;
  ok(d > 0 && Math.abs(d - (nw - 40000) * 0.0006) / d < 0.02, 'LEVY.on=true: (الثروة − 40000) × 0.0006 كما كان (' + Math.round(d) + ')'); }
const c = idle(true, 1e6, 60); ok(c.levy > 20000 && c.w1 / c.w0 < 0.97, 'LEVY.on=true: السحق القديم يعود (' + Math.round(c.levy) + ' في 60 يوماً)');
E.LEVY.on = false;
// تحت الحد لا رسم حتى مع on=true
{ E.LEVY.on = true; const S = load('autopilot-18'); S.player.gold = 1000; const l0 = S.player.led.exp.wealthLevy || 0; run(S, 5); ok((S.player.led.exp.wealthLevy || 0) === l0, 'تحت 40000 لا رسم'); E.LEVY.on = false; }
// الحفظ القديم: صف wealthLevy الموجود يعمل (يُحمَّل ويبقى رقمه) ويُخفى في الواجهة حين يساوي صفراً
{ const S = load('autopilot-18'); S.player.led.exp.wealthLevy = 5000; const R = E.loadChecked(E.save(S)); ok(R.ok && R.S.player.led.exp.wealthLevy === 5000, 'الحفظ القديم يحمل رقم wealthLevy ويعمل'); }
const ui = fs.readFileSync(path.join(__dirname, '../src/ui/12-screen-cities.js'), 'utf8') + fs.readFileSync(path.join(__dirname, '../src/ui/14b-life.js'), 'utf8');
ok((ui.match(/k !== 'wealthLevy' \|\| (?:o\[k\]|v) > 0/g) || []).length === 2, 'الواجهة تُخفي صف wealthLevy حين يساوي صفراً (الدفتر وملخص الغياب)');
ok(/wealthLevy: 'زكاة وأعطيات'/.test(ui) && /wealthLevy: 'رسم الثروة'/.test(ui), 'الاسمان القديمان باقيان في الجداول للحفظ القديم');
ok(!/رسم الثروة والحماية|LEVY_NOTE/.test(ui), 'لا بند جديد ولا شرح');
if (fails) { console.log(fails + ' FAIL'); process.exit(1); } console.log('PASS levy');
