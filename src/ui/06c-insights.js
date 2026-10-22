/* ---------- عمّ سالم يفسّر نتيجتك، وسؤال سريع من صفقتك، وهدفك الشخصي ----------
   كلها قواعد محلية من أرقام الصفقة الفعلية (لا ذكاء خارجي)، وتُعرض داخل إيصال الصفقة نفسه لا في بطاقة منبثقة أخرى. */
const xnOf = () => { const L = S.learn; return L.xn || (L.xn = { sales: 0, quizzes: 0, notes: 0 }); };
const f0 = n => fmt(Math.round(n));
/* ثلاث قواعد قابلة للإثبات: خسارة بيع، ربح بيع، وشراء ترك احتياطياً قليلاً (أقل من نفقة رحلة ثمانية أيام) */
function salemTradeNote(kind, r, rc) {
  const L = S && S.learn; if (!L || !L.char || NOLEARN || !r || !r.ok || !r.n) return;
  const xn = xnOf();
  if (kind === 'sell') {
    xn.sales++; const cost = r.net - r.pl, unitCost = cost / r.n, unitSale = r.net / r.n;
    if (xn.sales % 4 === 0) { const q = makeQuiz(r, xn.quizzes); if (q) { xn.quizzes++; rc.quiz = q; return; } }
    if (xn.sales % 2 === 1 && cost > 0) {
      xn.notes++;
      rc.say = r.pl < 0
        ? `خسرتَ ${f0(-r.pl)} ريالاً في هذا البيع: كلفتك ${f1(unitCost)} للوحدة وبعتها بـ ${f1(unitSale)}. قبل الشراء القادم قارن السعر بالمرجعي، وقبل البيع قارن سوقاً آخر.`
        : `ربحتَ ${f0(r.pl)} ريالاً على تكلفة ${f0(cost)} (هامش ${Math.round(r.pl / cost * 100)}٪). قبل أن تكرر الرحلة راجع نفقة الطريق: هي ما يفصل ربح البيع عن الربح الحقيقي.`;
    }
  } else if (kind === 'buy') {
    try { const m = main(), need = Math.ceil(E.supplyNeed(m, 8) * E.unitPrice(S.cities[m.city], 'wheat')); if (S.player.gold < need) { xn.notes++; rc.say = `بقي معك ${f0(S.player.gold)} ريالاً فقط، ونفقة رحلة من ثمانية أيام نحو ${f0(need)}. لا تُفرغ كيسك كله في الشراء.`; } } catch (e) {}
  }
}
/* أسئلة مالية من إيصال البيع: المدخلات تُحفظ في السؤال نفسه فلا تتبدل بمرور يوم، وبلا عشوائية */
function makeQuiz(r, seq) {
  const n = r.n, net = r.net, pl = r.pl, cost = net - pl, uc = cost / n, us = net / n, up = pl / n;
  const sg = v => (v < 0 ? '-' : '+') + f0(Math.abs(v)), u1 = v => f1(Math.abs(v));
  const apart = a => { const v = a.map(x => Math.round(Math.abs(x) * 10) / 10); return new Set(v).size === v.length && Math.min(...v) > 0 && a.every(x => a.every(y => x === y || Math.abs(Math.abs(x) - Math.abs(y)) / Math.max(Math.abs(x), Math.abs(y)) > 0.05)); };
  const T = [
    () => apart([uc, us, up]) && cost > 0 ? { q: 'كم كلفتك الوحدة الواحدة في المتوسط؟', o: [[u1(uc) + ' ريال', true], [u1(us) + ' ريال', false], [u1(up) + ' ريال', false]], why: `الكلفة المسجلة ${f0(cost)} ÷ ${n} وحدة = ${u1(uc)} للوحدة. أما ${u1(us)} فهو سعر بيع الوحدة.` } : null,
    () => apart([pl, net, cost]) && cost > 0 ? { q: 'ما نتيجتك الصافية من هذا البيع كله؟', o: [[sg(pl) + ' ريال', true], ['+' + f0(net) + ' ريال', false], ['+' + f0(cost) + ' ريال', false]], why: `ما قبضتَه ${f0(net)} مطروحاً منه كلفتك ${f0(cost)} = ${sg(pl)}.` } : null,
    () => Math.abs(pl) / Math.max(1, cost) > 0.02 && cost > 0 ? { q: 'بعتَ بسعر أعلى أم أقل من متوسط تكلفتك؟', o: [['أعلى', pl > 0], ['أقل', pl < 0]], why: `كلفتك ${u1(uc)} للوحدة وبعتها بـ ${u1(us)}، فالبيع ${pl > 0 ? 'أعلى من التكلفة' : 'أقل من التكلفة'}.` } : null
  ];
  for (let i = 0; i < T.length; i++) { const q = T[(seq + i) % T.length](); if (q) return Object.assign(q, { sel: null }); }
  return null;
}
function quizHTML(q) {
  if (q.sel == null) return `<div class="rquiz"><div class="small"><b>سؤال سريع:</b> ${esc(q.q)}</div><div class="chips" style="margin-top:6px">${q.o.map((o, i) => `<button class="sm" data-act="rqans" data-i="${i}">${esc(o[0])}</button>`).join('')}<button class="sm" data-act="rqskip">تخطّ</button></div></div>`;
  const good = q.o[q.sel][1];
  return `<div class="rquiz"><div class="small"><b>${good ? 'أحسنت ✓' : 'ليست هذه'}</b> ${esc(q.why)}</div></div>`;
}
/* الهدف الشخصي الاختياري: فوق مسار الدروس لا بدله، ولا يمنح مالاً ولا يفتح مستوى */
const GOALS = {
  debt: { n: 'سداد دَين الجد', f: () => { const d = S.player.famDebt; return d ? { v: d.amt0 - d.left, max: d.amt0, done: d.left <= 0, step: d.left > 0 ? ['الدَّين والخطة', 'debt'] : null, why: 'اتبع خطة داباسير: جزء من كل ربح يسدّد الدَّين.' } : null; } },
  shop: { n: 'امتلاك أول دكان', f: () => { const has = S.order.some(id => E.shopsOf(S, id).length); const ph = E.PHASE_AT[1]; if (has) return { v: 1, max: 1, done: true }; return S.phase >= 2 ? { v: 0, max: 1, done: false, step: ['العقارات', 'goestate'], why: 'ابنِ دكاناً في مدينة تعرف سوقها.' } : { v: Math.round(E.netWorth(S)), max: ph, done: false, why: 'الدكاكين تُفتح عند ثروة ' + fmt(ph) + ' ريال، فاتجر لتصل إليها.' }; } },
  ship: { n: 'امتلاك أول سفينة', f: () => { if (E.shipsOf(S).length) return { v: 1, max: 1, done: true }; const ph = E.SEA.phase; return S.phase >= ph ? { v: 0, max: 1, done: false, step: ['القافلة', 'gocaravan'], why: 'السفن تُشترى من ميناء، من قسم الأسطول في «القافلة».' } : { v: S.phase, max: ph, done: false, why: 'السفن تُفتح في الطور ' + ph + '، وأنت في الطور ' + S.phase + '.' }; } }
};
function goalCard() {
  const L = S.learn; if (!L || !L.char) return '';
  const pick = `<div class="chips" style="margin-top:6px">${Object.keys(GOALS).map(k => `<button class="sm ${L.goal === k ? 'on' : ''}" data-act="goalset" data-k="${k}">${GOALS[k].n}</button>`).join('')}${L.goal ? '<button class="sm" data-act="goalset" data-k="">إخفاء</button>' : ''}</div>`;
  const g = L.goal && GOALS[L.goal], st = g && g.f();
  if (!g || !st) return `<div class="ofgoal"><b>هدفي الآن</b> <span class="small muted">(اختياري)</span>${pick}</div>`;
  return `<div class="ofgoal"><b>هدفي الآن: ${g.n}</b>${st.done ? ' <span class="pill good">تحقق ✓</span>' : ''}${bar(Math.min(st.v, st.max), st.max)}${st.done ? '' : `<div class="small muted">${esc(st.why || '')}</div>${st.step ? `<button class="sm pri" data-act="${st.step[1]}">${esc(st.step[0])}</button>` : ''}`}${pick}</div>`;
}
/* ما يحدث في هذا السوق: عوامل موثقة متزامنة فقط (موسم نشط، حدث محلي، صدمة معلنة) بلا نسب تأثير مخترعة ولا بيانات مخفية */
function marketWhyHTML(c, v, live) {
  const out = [];
  if (E.seasonsOn(S)) E.seasonsAt(S, S.day).forEach(k => {
    const X = E.SEASONS[k]; if (!X.goods || !X.where || !X.where(c)) return;
    const gs = X.goods.filter(g => GD[g] && E.sells(c, g)).map(g => GD[g].name);
    if (gs.length) out.push(`<b>${esc(X.name)}:</b> قد يزيد الطلب على ${esc(gs.slice(0, 5).join('، '))}${gs.length > 5 ? ' وغيرها' : ''} في ${esc(c.name)} <span class="muted">(عامل محتمل، ولا يفسّر السعر كله)</span>`);
  });
  if (c.ev) out.push(`<b>${EVN[c.ev.k]}</b> في ${esc(c.name)} · باقٍ ${c.ev.left} يوم`);
  (S.shocks || []).filter(sh => (sh.city === c.id || (sh.country && sh.country === c.country)) && E.SHOCKS[sh.k]).forEach(sh => out.push(`<b>${sh.st === 'rumor' ? 'إشاعة' : 'جارٍ'}:</b> ${esc(E.SHOCKS[sh.k].name)}`));
  if (!out.length) return '';
  return `<div class="small">${out.map(t => `<div style="margin:3px 0">${t}</div>`).join('')}<div class="muted" style="margin-top:4px">${live ? 'معلومات اليوم' : 'معلومات قبل ' + v.age + ' يوم'} · هذه عوامل متزامنة، وليست حساب السعر.</div></div>`;
}
/* الاستعداد للموسم القادم: أقرب موسم يؤثر في السلع من تقويم المواسم (بالأيام، والهجري تقريبي) */
function seasonPrepCard() {
  if (!E.seasonsOn(S)) return null;
  const nx = E.seasonCalendar(S).find(x => !x.now && !x.info && x.goods && x.in <= 20); if (!nx) return null;
  const gs = nx.goods.filter(g => GD[g]).slice(0, 4).map(g => GD[g].name), cs = S.order.filter(id => nx.where(S.cities[id])).slice(0, 3).map(cityName);
  return { id: 'season', ic: '📒', w: 50, t: `<b>${esc(nx.name)}</b> بعد ${nx.in} يوماً${nx.h ? ' (بالتقويم الهجري، وقد يختلف يوماً)' : ''}: يرتفع الطلب غالباً على ${esc(gs.join('، '))}${cs.length ? ' في ' + esc(cs.join('، ')) + (nx.where === undefined ? '' : ' وغيرها') : ''}. لا يعني ذلك ربحاً مضموناً: احسب الطريق والتلف.`, b: ['راجع السوق', 'ofmarket'] };
}
