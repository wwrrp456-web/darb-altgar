// أصول فرص عمّ سالم: تُملك ثم تُشغَّل أو تُباع بالذهب أو الفضة: node test/opp-assets.test.js
const a = require('node:assert/strict'), E = require('../src/engine.js');
const base = E.newGame(8); E.A.learnSetChar(base, 'trader'); base.noLock = 1; Object.assign(base.learn, { intro: 11, level: 11, stage: 23, stageDone: E.STAGES.map(x => x.n), tab: Object.keys(E.BAB.TABLETS) }); base.phase = 4; base.player.wallet.sar = 10000; E.A.buildShop(base, 'riyadh'); base.bosses.riyadh.trust = 50; base.player.led.inc.realized = 50000; base.player.wallet.sar = 400; base.player.vault = 5000;
const fresh = () => E.load(E.save(base));
function offer(S, kind) { const o = E.vaultOpportunityCandidate(S, kind); a(o, 'candidate ' + kind); o.status = 'pending'; S.nextId++; S.learn.ex = { broker: 0, friend: 0, luck: S.day, vaultOffer: o }; S.learn.eq = [{ id: 'luck', offerId: o.id, day: S.day }]; return o; }
for (const kind of ['shop', 'warehouse', 'partnership']) {
  const S = fresh(), o = offer(S, kind); a(['au', 'ag'].includes(o.payIn), kind + ': المشتري يدفع ذهباً أو فضة');
  const r = E.A.vaultOpportunityBuy(S, o.id, true); a(r.ok, r.msg);
  const entry = (S.player.oppAssets || [])[0]; a(entry && entry.kind === kind && entry.payIn === o.payIn, kind + ': سُجّل أصل الفرصة');
  a(S.learn.rq.includes('oppAsset'), kind + ': عمّ سالم يوجّه إلى التشغيل أو البيع');
  const cur = o.payIn, w0 = S.player.wallet[cur] || 0, sar0 = S.player.wallet.sar, liq0 = E.liquid(S);
  const k = E.A.oppKeep(S, o.id); a(k.ok && S.player.oppAssets[0].kept, kind + ': الإبقاء يحفظ الأصل');
  const s = E.A.oppSell(S, o.id); a(s.ok, kind + ': ' + s.msg);
  a(S.player.wallet[cur] > w0, kind + ': قبض غرامات ' + (cur === 'au' ? 'ذهب' : 'فضة') + ': ' + (S.player.wallet[cur] - w0).toFixed(3));
  a(!(S.player.oppAssets || []).some(x => x.id === o.id), kind + ': زال من قائمة الفرص');
  if (kind === 'shop') a(!S.player.props[o.city].shops.some(sh => entry.shopIds.includes(sh.id)), 'الدكان بيع فعلاً');
  if (kind === 'partnership') a((S.player.bank.dep[o.city] || 0) < o.stake + 1e-6, 'سُحبت الحصة');
  a(E.liquid(S) > liq0 - 1, kind + ': السيولة (بالمعادل) لم تتبخر بعد القبض');
}
for (const kind of ['warehouse', 'partnership', 'shop']) { // العقد بعد الإبقاء يدرّ عائداً دورياً
  const S = fresh(), o = offer(S, kind); a(E.A.vaultOpportunityBuy(S, o.id, true).ok);
  a(E.A.oppKeep(S, o.id).ok); const ent = S.player.oppAssets[0], t = E.oppTerms(S, ent); a(t.next === E.OPP_TERMS.every, kind + ': موعد أول عائد');
  if (kind === 'warehouse') { a(t.per > 0 && t.fixed, 'أجرة ثابتة'); const g0 = S.player.gold; S.day += 31; E.oppAssetsDay(S); a(S.player.gold - g0 === t.per && ent.paid === t.per, 'قبض الأجرة'); const g1 = S.player.gold; E.oppAssetsDay(S); a(S.player.gold === g1, 'لا يُدفع مرتين في اليوم نفسه'); }
  if (kind === 'partnership') { S.player.bank.dep[o.city] *= 1.05; const g0 = S.player.gold; S.day += 31; E.oppAssetsDay(S); a(S.player.gold > g0 && ent.paid > 0, 'قبض ربح الشراكة المتحقق'); const g1 = S.player.gold; S.day += 31; E.oppAssetsDay(S); a(S.player.gold === g1, 'لا ربح جديد فلا قبض'); }
  if (kind === 'shop') { a(t.type === 'ops', 'الدكان يعمل بإيراده الفعلي'); const g0 = S.player.gold; S.day += 31; E.oppAssetsDay(S); a(S.player.gold === g0, 'لا دفع إضافي فوق إيراد الدكان الفعلي'); }
}
console.log('PASS opp assets: shop/warehouse/partnership offers tracked, keep or sell for gold/silver grams');
