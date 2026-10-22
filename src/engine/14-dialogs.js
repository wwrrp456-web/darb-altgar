/* ---------- الحوارات والمهام الصغيرة (بيانات src/dialogs.js) ---------- */
const stOf = S => S.story || (S.story = { flags: {}, cool: {}, quests: {}, cur: null });
const cmp = (a, op, b) => (op === '>=' ? a >= b : op === '<=' ? a <= b : op === '>' ? a > b : op === '<' ? a < b : a === b);
const questState = (S, id) => { const q = stOf(S).quests[id]; return q ? q.state : 'none'; };
const hasGood = (S, g) => { const car = mainCar(S); return Math.floor(car.cargo[g] || 0); };
function dlgOk(S, conds) {
  const st = stOf(S);
  return (conds || []).every(c => {
    switch (c[0]) {
      case 'flag': return !!st.flags[c[1]];
      case 'not': return !st.flags[c[1]];
      case 'gold': return cmp(S.player.gold, c[1], c[2]);
      case 'trust': { const b = bossOf(S, c[1]); return !!b && cmp(b.trust, c[2], c[3]); }
      case 'level': return cmp(S.learn && S.learn.char ? S.learn.level : 11, c[1], c[2]);
      case 'ready': return (st.cool[c[1]] || 0) <= S.day;
      case 'quest': return questState(S, c[1]) === c[2];
      case 'has': return hasGood(S, c[1]) >= c[2];
      case 'shop': return S.order.some(id => shopsOf(S, id).length > 0); // امتلك دكاناً (حالة قائمة لا حدثاً مختلقاً)
      case 'debtfree': return !!(S.player.famDebt && S.player.famDebt.left <= 0);
      default: return true;
    }
  });
}
function dlgDo(S, effects, city) {
  const st = stOf(S), msgs = [];
  (effects || []).forEach(e => {
    switch (e[0]) {
      case 'flag': st.flags[e[1]] = true; break;
      case 'trust': { const b = bossOf(S, e[1] || city); if (b) { b.trust = clamp(b.trust + e[2], -100, 100); msgs.push((e[2] > 0 ? 'زادت ثقة ' : 'نقصت ثقة ') + b.name + ' بك'); } break; }
      case 'pay': ctxFor(S, city); pPay(S, 'gift', e[1], true); msgs.push('دفعتَ ' + e[1] + ' ريال'); break;
      case 'gain': S.player.gold += e[1]; msgs.push('قبضتَ ' + e[1] + ' ريال'); break;
      case 'cool': st.cool[e[1]] = S.day + e[2]; break;
      case 'quest': if (e[1] === 'start') { st.quests[e[2]] = { state: 'active', day: S.day }; msgs.push('مهمة جديدة: ' + DLG.QUESTS[e[2]].title); } else { st.quests[e[2]] = Object.assign(st.quests[e[2]] || {}, { state: 'done', end: S.day }); msgs.push('أتممتَ المهمة: ' + DLG.QUESTS[e[2]].title); } break;
      case 'sellTo': { const car = mainCar(S), g = e[1], n = Math.min(e[2], Math.floor(car.cargo[g] || 0)), c = S.cities[city]; ctxFor(S, city); const total = n * refPrice(c, g) * e[3]; takeBasis(car.basis, g, n); car.cargo[g] -= n; S.player.gold += total; S.player.led.inc.sales = (S.player.led.inc.sales || 0) + total; msgs.push('قبضتَ ' + Math.round(total) + ' ريال'); break; }
      case 'craft': { const r = A.buyCraft(S, e[1]); msgs.push(r.msg); break; }
      case 'react': learnReact(S, e[1]); break;
    }
  });
  return msgs;
}
function dlgView(S) {
  const st = stOf(S), cur = st.cur; if (!cur) return null;
  const D = DLG.DIALOGS[cur.id], N = D.nodes[cur.node], c = S.cities[D.city], bs = bossOf(S, D.city);
  const sub = t => String(t).replace(/\{boss\}/g, bs ? bs.name : '');
  const mood = N.mood === 'auto' ? (bs && bs.trust >= 15 ? 'warm' : bs && bs.trust <= -10 ? 'displeased' : 'stern') : N.mood;
  const opts = [], all = N.opts || [];
  all.forEach((o, k) => { if (dlgOk(S, o.if)) opts.push({ i: k, t: sub(o.t) }); });
  return { id: cur.id, node: cur.node, who: D.who, mood, name: D.who === 'salem' ? 'عمّ سالم' : D.who === 'trader' ? 'تاجر الساحة' : (bs ? bs.name : ''), city: D.city, say: sub(N.say), opts };
}
/* صندوق التكافل التعاوني (بدل التأمين التجاري): تتبرع بمبلغ يومي (للممتلكات 0.04٪ من قيمتها) أو عن كل رحلة (2.5٪ من الحمولة) إلى صندوق مشترك مع تجار السوق.
   التبرع لا يُسترد، ويقتطع المشغّل 10٪ منه أجراً معلوماً على الإدارة. يعوّض الصندوق المتضرر بنسبة من خسارته وبحدّ نصف رصيده، ويُرَدّ فائضه على المشاركين كل 90 يوماً. التعويض ليس مضموناً بالكامل. */
const TK = { seed: 1500, others: 8, wakeel: 0.1, cover: 0.7, coverFactory: 0.5, cap: 0.5, reserve: 3000, cycle: 90, share: 0.25, rate: 0.0004, tripRate: 0.025 };
const tkOf = S => S.player.tk || (S.player.tk = { pool: 0, paid: 0, got: 0, claims: 0, back: 0, last: S.day, joined: false });
function tkContribute(S, amt) {
  if (!(amt > 0)) return; const T = tkOf(S); if (!T.joined) { T.joined = true; T.pool += TK.seed; T.last = S.day; }
  const fee = amt * TK.wakeel; sink(S, 'takafulFee', fee); T.pool += amt - fee; T.paid += amt;
}
function tkClaim(S, lost, cover) {
  const T = S.player.tk; if (!T || !T.joined || !(lost > 0)) return 0; const pay = Math.min(lost * cover, T.pool * TK.cap); if (pay < 1) return 0;
  T.pool -= pay; T.got += pay; T.claims++; S.player.gold += pay; S.player.led.inc.takaful = (S.player.led.inc.takaful || 0) + pay; return pay;
}
function tkDay(S) {
  const T = S.player.tk; if (!T || !T.joined) return; T.pool += TK.others;
  if (S.day - T.last >= TK.cycle) { T.last = S.day; if (T.pool > TK.reserve) { const D = (T.pool - TK.reserve) * 0.4, mine = D * TK.share; T.pool -= D; S.player.gold += mine; T.back += mine; S.player.led.inc.takaful = (S.player.led.inc.takaful || 0) + mine; news(S, 'وزّع صندوق التكافل فائضه على المشاركين: نصيبك ' + fmtN(mine) + ' ريال.', 'good'); learnReact(S, 'tkSurplus', 30); } }
}
const insValue = (S, city) => { const pr = S.player.props[city]; return (pr ? valueOf(pr.store) : 0) + S.player.factories.filter(f => f.city === city).reduce((a, f) => a + factoryValue(f), 0); };
const insPrem = (S, city) => Math.max(3, Math.round(insValue(S, city) * TK.rate * 10) / 10);
const insOn = (S, city) => !!(S.player.props[city] && S.player.props[city].ins);
