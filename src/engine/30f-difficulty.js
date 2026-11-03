/* ---------- صعوبة السيطرة المتدرّجة (021؛ ملاحظة بن محمود 11): docs/goals/WORLD.md القسم 3 فقط ----------
   k = Σ لكل دولة (نسبة أسواقها التي يقودها اللاعب)، D = 1 + 0.12 × k بسقف 1.6، ويخفضه كل عقد تحالف نشط 0.05 بحد أقصى 0.2 (D ≥ 1).
   الأدوات اقتصادية فقط، بلا حروب: (1) نفوذ الزعيم الابتدائي bossB0 ×D في الأسواق غير المقادة (بسقف مطلق DF.bCap، انظر الملاحظة)؛
   (2) ردّ فعل الزعيم: يرفع b يومياً بنسبة 0.15٪ × (D − 1) ما دام نفوذك فيه فوق 40٪؛ (3) حدّ الثقة في العقود minTrust +4 لكل 0.2 من D − 1 (بحد +12، فيبلغه عند D = 1.6؛ تصحيح بن محمود 2026-11-04).
   لا حقل جديد في الحفظ (D مشتق من الحالة). DIFFICULTY.on=false يعيد القديم حرفياً. القسم 5 (الهيمنة والاحتكار) غير منفَّذ هنا (مؤجل للمختص).
   ملاحظة صمّام الأمان: نفوذ اللاعب p سقفه 100، فلا يُخلَع زعيم نفوذه b فوق 81.8 (حصة 0.55). لذلك يُقصّ هدف نفوذ الزعيم الأصلي بـ DF.bCap=72
   (b المستقر = الهدف + 8 + ردّ الفعل ≤ 81.6)، فتبقى كل سوق قابلة للخلع مهما بلغ D. */
const DIFFICULTY = { on: true };
const DF = { per: 0.12, cap: 1.6, ally: 0.05, allyMax: 0.2, react: 0.0015, reactFloor: 0.40, trustPer: 4, trustStep: 0.2, trustMax: 12, bCap: 72 };
const dfOn = S => !!(DIFFICULTY.on && S && S.learn && S.learn.char);
const dfLed = (S, id) => { const c = S.cities[id], bs = S.bosses && S.bosses[id]; return !!(c && (c.owner === 'player' || (bs && bs.ruler === 'player'))); };
function diffK(S) { let k = 0; for (const co of COUNTRIES) { const ids = S.order.filter(id => S.cities[id].country === co.id); if (ids.length) k += ids.filter(id => dfLed(S, id)).length / ids.length; } return k; }
const diffAllies = S => (S.player.pacts || []).filter(x => x.type === 'alliance').length;
function diffD(S) { if (!dfOn(S)) return 1; const raw = Math.min(DF.cap, 1 + DF.per * diffK(S)), ally = Math.min(DF.allyMax, DF.ally * diffAllies(S)); return Math.max(1, raw - ally); }
// نفوذ الزعيم الأصلي في السوق: ×D بسقف مطلق (والأسواق التي يقودها اللاعب بلا D)
function bossB0D(S, c, led) { const base = 35 + 15 * c.size; if (!dfOn(S) || led) return base; return Math.max(base, Math.min(base * diffD(S), DF.bCap)); }
// ردّ فعل الزعيم اليومي: b ×(1 + 0.0015 × (D−1)) ما دام نفوذك فيه > 40٪
function diffReact(S, bs, share0) { if (!dfOn(S) || bs.ruler === 'player' || share0 <= DF.reactFloor) return bs.b; const D = diffD(S); return bs.b * (1 + DF.react * (D - 1)); }
// إضافة حدّ الثقة في العقود
const diffTrustExtra = S => (dfOn(S) ? Math.max(0, Math.min(DF.trustMax, Math.ceil(DF.trustPer * (diffD(S) - 1) / DF.trustStep - 1e-9))) : 0);
function difficultyView(S) {
  if (!dfOn(S)) return null; const k = diffK(S), raw = Math.min(DF.cap, 1 + DF.per * k), allies = diffAllies(S), cut = Math.min(DF.allyMax, DF.ally * allies), D = Math.max(1, raw - cut);
  return { on: true, k, raw, D, allies, cut, trustExtra: diffTrustExtra(S), capped: raw >= DF.cap - 1e-9, led: COUNTRIES.map(co => { const ids = S.order.filter(id => S.cities[id].country === co.id); return { id: co.id, name: co.name, led: ids.filter(id => dfLed(S, id)).length, total: ids.length }; }) };
}
