// 045: حارس الشرط الجزائي (GN-01): الضرر الفعلي وحده؛ عقود الزعماء القديمة بلا غرامة ثابتة؛ PEN.old=true يعيدها حرفاً
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), E = require('../src/engine.js'), A = E.A, ok = m => console.log('OK   ' + m);
E.GRIEF.on = false;
// أ) حارس ثابت: لا خصم 'pactPenalty' إلا في 30h2z-penalty.js، ولا يُقرأ penalty الثابت إلا عبر oldPactFine
const dir = path.join(__dirname, '../src/engine'), files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
for (const f of files) { const s = fs.readFileSync(path.join(dir, f), 'utf8'); if (f === '30h2z-penalty.js') continue; assert.ok(!/['"]pactPenalty['"]/.test(s), f + ': pactPenalty خارج حارس الشرط الجزائي'); if (f !== '04-bosses.js' && f !== '05-haggle.js' && f !== '24-advisor-actions.js') assert.ok(!/\.penalty\b/.test(s) || f === '01-data-world.js', f + ': قراءة penalty ثابت'); }
for (const f of ['05-haggle.js', '24-advisor-actions.js']) { const s = fs.readFileSync(path.join(dir, f), 'utf8'); assert.ok(!/pc\.penalty/.test(s), f + ': pc.penalty يُقرأ خارج oldPactFine'); }
ok('حارس ثابت: pactPenalty في ملف الحارس وحده، ولا pc.penalty في الخصم');
// ب) actualDamage
{ const S = E.newGame(1), d = E.actualDamage(S, { customsGiven: 100, marginLost: 50.4, moneyHeld: 10, priceDrop: 5 }); assert.equal(d.total, 165.4); assert.equal(d.lines.length, 4);
  assert.equal(E.actualDamage(S, { marginLost: 50.4 }, { round: true }).total, 50); assert.equal(E.actualDamage(S, { priceDrop: -5 }).total, 0);
  assert.throws(() => E.actualDamage(S, { fine: 500 }), /غير معتمد/); assert.deepEqual(Object.keys(E.PEN_PARTS).sort(), ['customsGiven', 'marginLost', 'moneyHeld', 'priceDrop']); ok('actualDamage: المكوّنات الأربعة والمجموع والرفض'); }
{ const S = E.newGame(1); S.player.gold = 1000; const g0 = S.player.gold; assert.equal(E.payPenalty(S, null, {}), 0); assert.equal(S.player.gold, g0, 'ضرر صفر لا يخصم');
  assert.equal(E.payPenalty(S, null, { marginLost: 300 }), 300); assert.equal(S.player.gold, 700); assert.equal(E.payPenalty(S, null, { marginLost: 5000 }), 700, 'حتى رصيدك'); ok('payPenalty: صفر لا يخصم، ويخصم بقدر الضرر حتى الرصيد'); }
// ج) العقود القديمة
const mk = () => { const S = E.newGame(3); A.chooseStart(S, 'sa'); A.learnSetChar(S, 'trader'); S.noLock = 1; S.noEvents = true; S.noShocks = true; S.player.famDebt = null; S.phase = 3; S.player.gold = 1e5; S.player.wallet.sar = 1e5; Object.assign(S.learn, { level: 11, stage: 23, abroad: true }); return S; };
for (const old of [false, true]) {
  E.PEN.old = old; try {
    const S = mk(); S.bosses.riyadh.trust = 50; assert.ok(A.signPact(S, 'riyadh', 'guard').ok); const pc = E.pactIn(S, 'riyadh'), pen = pc.penalty, g0 = S.player.gold;
    const r = A.breakPact(S, 'riyadh'); assert.ok(r.ok); const bs = E.bossOf(S, 'riyadh');
    assert.equal(g0 - S.player.gold, old ? pen : 0, 'فسخ: ' + (old ? 'الغرامة الثابتة حرفاً' : 'بلا خصم مالي (GN-01)')); assert.ok(bs.trust <= 20, 'الثقة تهبط'); assert.ok(bs.cd > S.day, 'المهلة'); assert.equal(old, /جزائي/.test(r.msg), 'النص صادق');
    // عجز عن الرسوم
    const T = mk(); T.bosses.riyadh.trust = 50; assert.ok(A.signPact(T, 'riyadh', 'guard').ok); T.player.gold = 10; T.player.wallet.sar = 10; const gT = T.player.gold; E.tick(T, false); assert.ok(!E.pactIn(T, 'riyadh'), 'انفسخ العقد'); assert.ok(T.player.gold <= gT, 'لا زيادة');
  } finally { E.PEN.old = false; } }
ok('العقود القديمة: فسخ وعجز بلا خصم مالي، وPEN.old=true يعيد الثابت حرفاً، والثقة والمهلة باقيتان');
// د) عقود 036: الأرقام عبر payPenalty (يغطيها influence/influence-fin/influence-mfg/influence-road بلا تعديل)
console.log('OK   (د) أرقام 036 تغطيها اختبارات influence*');
