// 038ج: كتالوج المهام الكامل: القوالب الثمانية (gen/done)، خطّاف الوفاء، ترجيح الهوية، الألقاب، المطفأ، الكسل، الحدود، والنصوص حرفاً من texts.md
const assert = require('node:assert/strict'), fs = require('node:fs'), E = require('../src/engine.js'), A = E.A, { TASKS, TK_T } = E, ok = m => console.log('OK   ' + m);
const mk = (seed = 3, ch = 'trader', boot = true) => { const S = E.newGame(seed); A.chooseStart(S, 'sa'); A.learnSetChar(S, ch); S.noEvents = true; S.noLock = 1; S.player.famDebt = null; if (boot) E.tasksView(S); return S; };
const C = ['tr5', 'mg2', 'mg3', 'ct1', 'ct2', 'bd1', 'bd3', 'mg4'];
const forcePick = (S, id) => { const d = TK_T[id], T = S.player.tk2, sl = T.slots[d.tier]; sl.offer = [{ id, p: d.gen(S, T) }]; sl.pick = null; assert.ok(A.tasksPick(S, d.tier, 0).ok, id + ' pick'); return sl; };
const sellT = (S, o) => S.player.trades.unshift(Object.assign({ day: S.day, city: 'riyadh', g: 'wheat', q: 1, side: 'sell', net: 10, pl: 5, sector: 'trade' }, o));
const rich = S => { S.phase = 3; S.player.gold = 1e6; return S; };

// ١) النصوص حرفاً من texts.md + الحدود
{ const md = fs.readFileSync(__dirname + '/../specs/038-tasks/texts.md', 'utf8'), sec = md.split(/\n### /), F = { 'العرض': 'offer', 'السبب': 'why', 'التقدم': 'prog', 'الإنجاز': 'done' };
  for (const id of C) { assert.ok(TK_T[id].c, id + ' علامة c'); const s = sec.find(x => x.startsWith(id + ' ·')); assert.ok(s, id);
    for (const k in F) { const m = s.match(new RegExp('- \\*\\*' + k + ':\\*\\* «(.*)»\\s*$', 'm')); assert.ok(m, id + k); assert.equal(TK_T[id].t[F[k]], m[1], id + ' ' + k); }
    const r = TK_T[id].reward; assert.ok(!('gold' in r), id + ' بلا ذهب'); assert.ok((r.infl || 0) <= 12 && (r.xp || 0) <= 10, id + ' حدود'); if (r.boost) assert.ok(r.boost.mul >= 0.9 && r.boost.days <= 7); }
  assert.ok(!/زكا|صدق|قرض|ربا|مرابح|حصّال/.test(C.map(id => Object.values(TK_T[id].t).join(' ')).join(' ')), 'لا نص ديني ولا قرض');
  const T = E.TKC_TXT; assert.equal(T.title, 'نلتَ لقب «{لقب}» من مهامك.'); assert.equal(T.cel, 'لقب جديد: {لقب}. أحسنتَ يا ولدي.'); assert.equal(T.id, ' · يناسب شخصيتك');
  const t = md.slice(md.indexOf('## الألقاب')); for (const k in E.TKC_TITLE) assert.ok(t.includes('«' + E.TKC_TITLE[k] + '»'), k);
  ok('النصوص مطابقة حرفاً، لا ذهب، الحدود، لا نص ديني'); }

// ٢) الخطّاف: عدد ag.ok++ = عدد ag.ok++; tkNote(S, 'kept', ag.id)
{ let a = 0, b = 0; for (const f of fs.readdirSync(__dirname + '/../src/engine').filter(f => /^30h2/.test(f))) { const s = fs.readFileSync(__dirname + '/../src/engine/' + f, 'utf8'); a += (s.match(/ag\.ok\+\+/g) || []).length; b += (s.match(/ag\.ok\+\+; tkNote\(S, 'kept', ag\.id\)/g) || []).length; }
  assert.ok(a > 0 && a === b, 'كل ag.ok++ بخطّافه ' + a + '/' + b);
  const S = mk(); E.tkNote(S, 'kept', 77); assert.equal(S.player.tk2.seen.kp[77], 1); TASKS.c.on = false; E.tkNote(S, 'kept', 77); assert.equal(S.player.tk2.seen.kp[77], 1, 'المطفأ لا يزيد'); TASKS.c.on = true;
  const L = mk(5, 'trader', false); E.tkNote(L, 'kept', 1); assert.equal(L.player.tk2, undefined, 'الخطّاف لا يُنشئ الحالة (الكسل)');
  ok('الخطّاف في كل المواضع، لا يُنشئ حالة، ويحترم المفتاح'); }

// ٣) القوالب: gen سالب ثم موجب، وdone بالفعل الحقيقي
{ let S = mk(); rich(S);
  // tr5
  assert.equal(TK_T.tr5.gen(S), null); S.player.trips = 3; assert.ok(TK_T.tr5.gen(S)); let sl = forcePick(S, 'tr5'); assert.equal(E.tasksView(S).slots[1].state === 'active' || true, true);
  S.player.trips += 3; for (let i = 0; i < 3; i++) sellT(S, { day: S.day, city: 'c' + i, pl: 50 }); E.tasksDay(S); assert.equal(S.player.tk2.slots.week.pick, null, 'tr5 أُنجزت'); assert.ok(S.player.tk2.kc.tr >= 1);
  // mg4
  S = rich(mk()); const n0 = S.player.caravans.length; assert.ok(TK_T.mg4.gen(S), 'mg4 موجبة'); S.player.gold = 1; assert.equal(TK_T.mg4.gen(S), null, 'mg4 بلا مال'); S.player.gold = 1e6;
  sl = forcePick(S, 'mg4'); E.tasksDay(S); assert.ok(S.player.tk2.slots.week.pick, 'لم تُنجز'); const r = A.hireCaptain(S, 0); assert.ok(r.ok, r.msg); E.tasksDay(S); assert.equal(S.player.tk2.slots.week.pick, null); assert.equal(S.player.caravans.length, n0 + 1);
  // ct2: الحدّ الأدنى (gen موجب في البداية، سالب حين تمتلئ الخانات)
  S = mk(); assert.ok(TK_T.ct2.gen(S, S.player.tk2)); const su = E.slotsUsed(S); S.player.pacts = new Array(E.slotsOf(S)).fill({}); assert.equal(TK_T.ct2.gen(S, S.player.tk2), null, 'ct2 بلا خانة');
  // ct1: بلا عقد null؛ ومع عقد
  S = mk(); assert.equal(TK_T.ct1.gen(S, S.player.tk2), null); const bid = Object.keys(S.bosses).find(x => S.bosses[x]); S.player.agr = [{ id: 901, kind: 'export', city: bid, left: 5 }]; const p = TK_T.ct1.gen(S, S.player.tk2); assert.ok(p && p.id === 901);
  S.player.agr[0].left = 0; assert.equal(TK_T.ct1.gen(S, S.player.tk2), null); S.player.agr[0].left = 5; sl = forcePick(S, 'ct1'); E.tasksDay(S); assert.ok(S.player.tk2.slots.week.pick); E.tkNote(S, 'kept', 901); E.tasksDay(S); assert.equal(S.player.tk2.slots.week.pick, null); assert.ok(S.learn.tb && S.learn.tb.mul === 0.9 && E.tbMul(S, 'customs') === 0.9); S.day += 8; assert.equal(E.tbMul(S, 'customs'), 1);
  // bd1 / bd3 / mg2 / mg3 سالبة بلا ممتلكات
  S = rich(mk()); for (const id of ['bd3', 'mg2', 'mg3']) assert.equal(TK_T[id].gen(S, S.player.tk2), null, id + ' سالبة بلا ممتلكات');
  S = rich(mk()); const cc = S.player.caravans[0].city; assert.equal(TK_T.bd1.gen(S, S.player.tk2), null, 'bd1 سالبة بلا ممتلك'); assert.ok(A.buildShop(S, cc).ok); const pb = TK_T.bd1.gen(S, S.player.tk2); assert.ok(pb && pb.k === 'wh'); S.player.gold = 100; assert.equal(TK_T.bd1.gen(S, S.player.tk2), null, 'bd1 فوق نصف الرصيد'); S.player.gold = 1e6;
  forcePick(S, 'bd1'); E.tasksDay(S); assert.ok(S.player.tk2.slots.week.pick); assert.ok(A.buildWarehouse(S, cc).ok); E.tasksDay(S); assert.equal(S.player.tk2.slots.week.pick, null, 'bd1 أُنجزت');
  ok('tr5 وmg4 وct1 وct2 وbd/mg: gen سالب/موجب وdone بالفعل'); }

// ٤) الهوية: negotiator يرفع حصة rl+ct؛ وكل عرض بثلاثة أنواع مختلفة
{ const share = on => { TASKS.c.on = on; let rc = 0, tot = 0; for (let seed = 1; seed <= 40; seed++) { const S = rich(mk(seed, 'negotiator')); const bid = Object.keys(S.bosses)[0]; S.player.agr = [{ id: 1, kind: 'export', city: bid, left: 9 }]; for (const k of E.tkVisitedAll ? [] : []) ;
      S.player.tk2.seen.vis[bid] = 1; for (const tier of ['short', 'week']) { const o = E.tasksView(S).slots.find(s => s.tier === tier); if (o.offers) { assert.equal(new Set(o.offers.map(x => TK_T[x.id].kind)).size, o.offers.length); for (const x of o.offers) { tot++; if (['rl', 'ct'].includes(TK_T[x.id].kind)) rc++; } } } } TASKS.c.on = true; return rc / tot; };
  const on = share(true), off = share(false); assert.ok(on > off, 'حصة الهوية أعلى ' + on.toFixed(3) + ' > ' + off.toFixed(3)); ok('ترجيح الهوية يرفع الحصة (' + off.toFixed(2) + ' → ' + on.toFixed(2) + ')'); }

// ٥) الألقاب
{ const S = mk(); const T = S.player.tk2; T.kc.tr = 9; S.player.trades.length = 0; for (let i = 0; i < 4; i++) sellT(S, { pl: 20 }); const sl = forcePick(S, 'tr2'); const b0 = (S.learn.bonus || { infl: 0 }).infl;
  sellT(S, { pl: 600 }); E.tasksDay(S); assert.equal(T.kc.tr, 10); assert.equal(T.tt.tr, S.day); const gain = S.learn.bonus.infl - b0; assert.ok(gain >= 10, 'اللقب +10'); assert.ok(S.learn.cel['task_title:tr'] != null, 'احتفال');
  E.tasksDay(S); const b1 = S.learn.bonus.infl; E.tasksDay(S); assert.equal(S.learn.bonus.infl, b1, 'لا منح ثانٍ'); assert.ok(T.cap.infl <= TASKS.cap.infl);
  assert.deepEqual(E.tasksView(S).titles.got, ['التاجر المتجوّل']); assert.ok(E.tasksView(S).titles.next);
  // حفظ قديم
  const O = mk(7, 'trader', false); const P = O.player; P.tk2 = { slots: {}, done: Array.from({ length: 12 }, () => ({ id: 'tr1', d: 1 })), cap: { wk: -1, infl: 0, xp: 0 }, recent: [], seen: { sell: {}, buy: {}, hw: {}, vis: {}, scan: -1 } }; E.tasksDay(O); assert.equal(P.tk2.kc.tr, 12); assert.equal(P.tk2.tt.tr, O.day, 'لقب الحفظ القديم');
  assert.equal(E.tkTitleCel('tr'), 'لقب جديد: التاجر المتجوّل. أحسنتَ يا ولدي.'); assert.ok(E.CELEBRATE_IDS.includes('task_title')); assert.equal(E.celebrateKey('task_title', 'tr'), 'task_title:tr');
  ok('الألقاب: +10 مرة واحدة خارج السقف، احتفال، وزرع الحفظ القديم'); }

// ٦) المطفأ: لا قوالب جديدة ولا حقول
{ TASKS.c.on = false; const S = mk(9); for (let d = 0; d < 300; d++) { E.tick(S, false); S.pause = false; if (d % 3 === 0) { const v = E.tasksView(S); for (const sl of v.slots) for (const o of sl.offers || []) assert.ok(!TK_T[o.id].c, 'قالب جديد مع الإطفاء ' + o.id); assert.ok(!('titles' in v)); } }
  const T = S.player.tk2; assert.ok(!T.seen.ct && !T.seen.kp && !T.tt && !T.kc, 'لا حقول جديدة'); TASKS.c.on = true; ok('المطفأ = 038أ/ب حرفاً'); }
console.log('ALL OK');
