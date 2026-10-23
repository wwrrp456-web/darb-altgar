/* ---------- مشاهد SVG ---------- */
function hash(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function heroScene() {
  return `<svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><circle cx="610" cy="120" r="64" fill="#fff4cf" opacity=".92"/><circle cx="610" cy="120" r="92" fill="#fff4cf" opacity=".28"/><path d="M0 215 Q150 150 310 205 T620 195 T800 180 V300 H0Z" fill="var(--dune1)"/><path d="M0 262 Q200 205 400 250 T800 236 V300 H0Z" fill="var(--dune2)"/><g font-size="34" text-anchor="middle"><text x="330" y="244">🐪</text><text x="388" y="248">🐪</text><text x="446" y="244">🐪</text></g><g font-size="26"><text x="90" y="236">🌴</text><text x="700" y="226">🌴</text></g></svg>`;
}
const WALL = { sa: ['#e7d3a6', '#dcc592', '#efdcb5'], eg: ['#e9d9a9', '#d9c07e', '#f0e2b8'], ir: ['#9fc7d8', '#7fb0c8', '#c3dde8'], in: ['#f2b98a', '#e8a070', '#f7cfae'], cn: ['#d98c7a', '#c9705e', '#e8b0a2'] };
function cityScene(c) {
  const k = c.ev ? c.ev.k : '';
  const img = ART['city/' + c.id] || ART['scene/' + c.country];
  if (img) {
    const tint = { boom: '#e9b94955', festival: '#f3b6d255', plague: '#2f4a2a66', war: '#7a1f1466', bust: '#6b727a55' }[k] || '';
    return `<div class="cityimg"><img src="${img}" alt="${esc(c.name)}">${tint ? `<span class="tint" style="background:${tint}"></span>` : ''}<span class="cf">${CD[c.country].flag}</span><span class="cb">${k ? `<b class="evc">${EVN[k]}</b>` : ''}${c.owner ? '🏛️' : ''}${E.shopsOf(S, c.id).length ? '🏪' : ''}</span></div>`;
  }
  const sky = { boom: '#f6c667', festival: '#f3b6d2', plague: '#b9c4a2', war: '#d9867a', bust: '#c8cdd2' }[k] || 'var(--sky1)';
  let rn = hash(c.id); const rand = () => { rn = (Math.imul(rn, 1103515245) + 12345) >>> 0; return rn / 4294967296; };
  const cols = CD[c.country].mapPalette || WALL[c.country] || WALL.sa, pag = c.country === 'cn';
  let s = `<svg class="scene" viewBox="0 0 320 130" role="img" aria-label="${esc(c.name)}"><rect width="320" height="130" fill="${sky}"/><circle cx="${40 + (hash(c.id) % 200)}" cy="30" r="14" fill="#fff4cf" opacity=".9"/>`;
  if (COAST.has(c.id)) s += `<path d="M0 100 Q40 92 80 100 T160 100 T240 100 T320 100 V130 H0Z" fill="var(--sea)"/>`;
  s += `<rect y="96" width="320" height="34" fill="var(--dune2)"/>`;
  const n = Math.round(5 + c.size * 3 + (c.tier - 1) * 2);
  for (let i = 0; i < n; i++) {
    const w = 22 + rand() * 18, h = 26 + rand() * 40 * Math.min(1.4, c.size), x = 8 + i * (300 / n) + rand() * 6, col = cols[i % 3];
    s += `<rect x="${x.toFixed(1)}" y="${(96 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${col}" stroke="#6b5a3a" stroke-width="1.2"/>`;
    if (i % 3 === 0) s += pag ? `<path d="M${(x - 5).toFixed(1)} ${(96 - h + 4).toFixed(1)} L${(x + w / 2).toFixed(1)} ${(96 - h - 12).toFixed(1)} L${(x + w + 5).toFixed(1)} ${(96 - h + 4).toFixed(1)}z" fill="#8a2a1c" stroke="#5b1a10" stroke-width="1"/>` : `<path d="M${x.toFixed(1)} ${(96 - h).toFixed(1)} q${(w / 2).toFixed(1)} -${(w * 0.8).toFixed(1)} ${w.toFixed(1)} 0z" fill="#c9a96a" stroke="#6b5a3a" stroke-width="1.2"/>`;
    s += `<rect x="${(x + w / 2 - 2).toFixed(1)}" y="${(96 - h * 0.55).toFixed(1)}" width="4" height="8" rx="2" fill="#6b5a3a" opacity=".7"/>`;
  }
  if (k === 'festival') s += [30, 80, 130, 180, 230, 280].map((x, i) => `<path d="M${x} ${16 + i} l8 0 l-4 12z" fill="${['#d19a2a', '#b8402f', '#1f6f6b'][i % 3]}"/>`).join('');
  if (k === 'war') s += `<circle cx="250" cy="50" r="16" fill="#555" opacity=".55"/><circle cx="270" cy="36" r="12" fill="#555" opacity=".45"/>`;
  if (k === 'plague') s += `<rect width="320" height="130" fill="#2f4a2a" opacity=".18"/>`;
  s += `<text x="12" y="124" font-size="16">${CD[c.country].flag}</text><text x="300" y="124" font-size="16" text-anchor="end">${c.owner ? '🏛️' : ''}${E.shopsOf(S, c.id).length ? '🏪' : ''}</text></svg>`;
  return s;
}
function journeyScene(cr) {
  const t = (cr.total - cr.left) / Math.max(1, cr.total);
  const sea = !!cr.sea, land = sea ? '<path d="M0 150 Q160 140 320 150 T640 148 T800 146 V220 H0Z" fill="#7fb0c4"/><path d="M0 190 Q200 175 400 190 T800 186 V220 H0Z" fill="#5a93ad"/>' : '<path d="M0 150 Q160 100 320 145 T640 140 T800 130 V220 H0Z" fill="var(--dune1)"/><path d="M0 190 Q200 150 400 185 T800 175 V220 H0Z" fill="var(--dune2)"/>';
  return `<div class="journey" aria-label="رحلة القافلة"><svg viewBox="0 0 800 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><circle cx="150" cy="70" r="40" fill="#fff4cf" opacity=".9"/>${land}</svg><span class="jl" style="right:3%">${cityTag(cr.from)}</span><span class="jl" style="left:3%">${cityTag(cr.dest)}</span><div class="camelMove" style="right:${(7 + 86 * t).toFixed(1)}%"><span class="camel">${sea ? (ART['map/ship_dhow_map'] ? '<img class="shipj" src="' + ART['map/ship_dhow_map'] + '" alt="">' : '🚢') : '🐪'}</span></div></div>`;
}

/* ---------- المعلومات والصفقات ---------- */
const hasShop = cid => E.hasPresence(S, cid);
function liveView(cid) { const c = main(); return (c.city === cid && c.left === 0) || hasShop(cid); }
function marketView(cid) {
  const c = S.cities[cid];
  if (liveView(cid)) { const p = {}, st = {}; GIDS.forEach(g => { p[g] = E.unitPrice(c, g); st[g] = c.stock[g]; }); return { p, st, age: 0 }; }
  const k = S.player.known[cid]; return { p: k.p, st: k.st, age: S.day - k.day };
}
const live0 = id => liveView(id);
function deals() {
  const cr = main(), here = cr.city, hv = marketView(here), out = [], hc = S.cities[here], P = S.player;
  const wheat = E.unitPrice(hc, 'wheat');
  GIDS.forEach(g => S.order.forEach(d => {
    if (d === here || !E.sells(hc, g) || GD[g].sp || E.travelBlock(S, cr, d)) return;
    const dv = marketView(d), dc = S.cities[d], cus = dc.country === hc.country ? 0 : CD[dc.country].customs;
    const net = dv.p[g] * (1 - dc.tax - cus) - hv.p[g] * 1.02, days = E.tripDays(S, cr, here, d);
    if (net <= 0) return;
    const prov = E.supplyNeed(cr, days) * wheat, reserve = prov * 1.25 + 10, bb = E.buyBudget(S, here), gb = Math.min(P.gold - reserve, bb);
    const fu = (GD[g].fod || 0) * days * wheat * 1.25, room = Math.floor((E.capOfCar(cr) - E.loadOf(cr)) / GD[g].w), afford = Math.floor(Math.max(0, gb) / (hv.p[g] * (1 + cus * 1.1) + fu));
    const ql = E.quotaOn(S, hc, g) ? Math.floor(E.quotaLeft(S, hc)) : Infinity, stk = Math.floor(hv.st[g] * 0.6), q0 = Math.min(room, afford, stk, ql), lim = q0 === ql ? 'quota' : q0 === afford ? (bb < P.gold - reserve ? 'wallet' : 'gold') : q0 === room ? 'room' : 'stock';
    if (q0 < 1) return;
    // أنسب كمية: الربح الفعلي يشمل انزلاق الشراء والبيع، فالأكبر ليس دائماً الأربح
    let best = null;
    [1, 0.7, 0.5, 0.35, 0.2, 0.1].forEach(f => {
      const q = Math.max(1, Math.floor(q0 * f)), qb = live0(here) ? E.quoteBuy(S, here, g, q, Math.min(P.gold - reserve, bb) - q * fu) : { n: q, avg: hv.p[g] * 1.01 };
      if (qb.n < 1) return;
      const so = E.sellOptions(S, here, g, qb.n, qb.avg, cr).find(o => o.city === d);
      if (so && (!best || so.profit > best.profit)) best = { q: qb.n, profit: so.profit };
    });
    if (best && best.profit > 0) out.push({ g, d, net, days, q: best.q, max: q0, lim, profit: best.profit, pd: best.profit / days, pct: best.profit / (best.q * hv.p[g]), cus, buy: hv.p[g], sell: dv.p[g] * (1 - dc.tax - cus), upct: net / (hv.p[g] * 1.02) });
  }));
  return out.sort((a, b) => b.pd - a.pd);
}
const QS = {};
/* سبب المنع ومعه الحل المناسب الذي يعالج السبب نفسه (يفتح موضع الحل ولا ينفّذ نيابةً عن اللاعب) */
const limNote = (lim, cur) => { // الصرف يدوي من المستوى 4: نقص محفظة عملة السوق حلّه الصرافة؛ وامتلاء القافلة حلّه القافلة
  const cn = cur && E.CURS[cur] ? E.CURS[cur].name : 'عملة هذا السوق';
  const fix = lim === 'room' ? '<button class="sm" data-go="caravan">افتح القافلة (زيادة السعة)</button>' : lim === 'wallet' ? '<button class="sm" data-act="openfxneed" data-cur="' + (cur || '') + '">افتح الصرافة</button>' : '';
  const txt = lim === 'wallet' ? 'محفظتك من ' + cn + ' لا تكفي لهذه الكمية، وعندك عملات أخرى: حوّل من الصرافة ثم اشترِ.' : LIMNOTE[lim] || 'لا تستطيع الشراء الآن';
  return `<div class="qnote">${txt}${lim === 'gold' ? ' · خفّض الكمية.' : ''}${fix ? ' ' + fix : ''}</div>`;
};
const LIMNOTE = { wallet: 'محفظة هذا السوق لا تكفي: حوّل من الصرافة', gold: 'لا يكفي مبلغك لشراء كمية إضافية', room: 'قافلتك امتلأت: لا مكان لكمية إضافية', stock: 'نفد المتوفر في السوق: لا كمية إضافية', quota: 'بلغتَ حصتك اليوم من منتج المدينة الخاص: ثقة الزعيم ترفعها' };
const clampQ = (v, mx) => Math.max(1, Math.min(Math.max(1, mx), Math.floor(+v) || 1));
function stepper(key, val, mx, extra) {
  return `<div class="qs"><button class="sm qb" data-act="qstep" data-k="${key}" data-d="-10" data-max="${mx}" ${val <= 1 ? 'disabled' : ''} aria-label="أنقص 10">−10</button><button class="sm qb" data-act="qstep" data-k="${key}" data-d="-1" data-max="${mx}" ${val <= 1 ? 'disabled' : ''} aria-label="أنقص">▼</button><input class="qin" type="number" inputmode="numeric" min="1" max="${mx}" value="${val}" data-act="qin" data-k="${key}" data-max="${mx}" aria-label="الكمية"><button class="sm qb" data-act="qstep" data-k="${key}" data-d="1" data-max="${mx}" ${val >= mx ? 'disabled' : ''} aria-label="زد">▲</button><button class="sm qb" data-act="qstep" data-k="${key}" data-d="10" data-max="${mx}" ${val >= mx ? 'disabled' : ''} aria-label="زد 10">+10</button><button class="sm qb" data-act="qstep" data-k="${key}" data-d="999999" data-max="${mx}" ${val >= mx ? 'disabled' : ''}>أقصى</button>${extra || ''}</div>`;
}
function dealCard(o, can) {
  const key = 'd:' + o.g + ':' + o.d, q = clampQ(QS[key] == null ? o.q : QS[key], o.max), m = main(), here = m.city;
  let est = '', warn = '';
  if (can) {
    const qb = live0(here) ? E.quoteBuy(S, here, o.g, q, E.buyBudget(S, here)) : null, so = qb && qb.n ? E.sellOptions(S, here, o.g, qb.n, qb.avg, m).find(x => x.city === o.d) : null;
    if (qb && qb.n) est = `تدفع ≈ <b class="num">${fmt(qb.cost)}</b> ر.س${so ? ` · ربح متوقع <b class="${so.profit >= 0 ? 'cheap' : 'dear'} num">${so.profit >= 0 ? '+' : ''}${fmt(so.profit)}</b>` : ''}`;
    if (q >= o.max) warn = limNote(o.lim, E.curOf(S.cities[main().city].country));
    else if (q !== o.q && so && so.profit < o.profit * 0.9) warn = `<div class="qnote soft">الكمية الأنسب ${o.q} (ربح ${fmt(o.profit)})</div>`;
  }
  const unit = `<div class="unitbox"><div class="small muted">الوحدة الواحدة من ${GD[o.g].name}</div><div class="kv"><span>تشتريها هنا بـ</span><b class="num">${f1(o.buy)}</b></div><div class="kv"><span>تبيعها في ${esc(cityName(o.d))} بـ (بعد الضريبة${o.cus ? ' والجمارك' : ''})</span><b class="num">${f1(o.sell)}</b></div><div class="kv"><span>ربح الوحدة ≈</span><b class="cheap num">+${f1(o.net)} ر.س</b> <span class="small muted">(هامش ${mpct(o.upct)}٪)</span></div></div>`;
  const think = `<div class="small think">كم وحدة تأخذ؟ <b>كمية كبيرة</b> = ربح أكبر من رحلة واحدة ووقت أقل · <b>كمية قليلة</b> = أمان أكثر لكن ربحها أصغر وتحتاج رحلات أكثر. (الأقصى <b class="num">${o.max}</b>، ونراها لك <b class="num">${o.q}</b>)</div><div class="small think why">لماذا ينقص الربح مع الكمية الكبيرة؟ لأن شراءك يرفع سعر الشراء وبيعك يخفض سعر البيع، فيضيق الفارق وحدةً بعد وحدة. الكمية الأنسب هي قمة الربح؛ وما فوقها تدفع أكثر لتربح أقل.</div>`;
  return `<div class="card deal"><div class="row" style="margin:0"><span style="font-size:30px">${gi(o.g)}</span><div><b>${GD[o.g].name}</b> ← ${cityTag(o.d)}<div class="small muted">${o.days} أيام${o.cus ? ' · جمارك ' + Math.round(o.cus * 100) + '٪' : ''}</div></div></div>${unit}${can ? `${think}${stepper(key, q, o.max)}<div class="small">${est}</div>${warn}<button class="pri" data-act="dealgo" data-g="${o.g}" data-d="${o.d}" data-q="${q}" title="يشتري الكمية المختارة ثم يسافر">اشترِ ${q} وسافر</button>` : `<div class="small">تشتري <b class="num">${o.q}</b> وحدة (الأنسب) · ربح متوقع <b class="cheap num">+${fmt(o.profit)}</b></div>`}</div>`;
}
/* بطاقة تجهيز الرحلة: الطريق (بر/بحر) ثم مؤن السفر ثم ما ستشتريه ثم «انطلق» */
function tripPrepHTML() {
  const m = main(), t = tp, G = GD[t.g], from = m.city, to = t.d;
  const land = tripPlan({ ...t, route: 'land' });
  const portOk = S.phase >= E.SEA.phase && E.isPort(from) && E.isPort(to), seaP = portOk ? tripPlan({ ...t, route: 'sea' }) : null;
  const cur = t.route === 'sea' && seaP && seaP.ok ? seaP : land, sea = cur === seaP;
  const routeBtn = (r, label, p) => `<button data-act="tproute" data-r="${r}" class="${(sea ? 'sea' : 'land') === r ? 'on' : ''}" aria-pressed="${(sea ? 'sea' : 'land') === r}" ${p && p.ok ? '' : 'disabled'}>${label}</button>`;
  let h = `<div class="mbox tprep" role="dialog" aria-label="تجهيز الرحلة"><div class="row" style="margin-top:0"><h2 style="margin:0">تجهيز الرحلة: ${cityTag(from)} ← ${cityTag(to)}</h2><span class="spacer"></span><button class="sm" data-act="tpcancel" aria-label="إلغاء">✕</button></div>`;
  h += `<div class="card"><b>أولاً: الطريق</b><div class="chips" style="margin:6px 0" role="group" aria-label="الطريق">${routeBtn('land', '🐪 براً', land)}${portOk ? routeBtn('sea', (ti('travel_sea') || '🚢') + ' بحراً', seaP) : ''}</div>`;
  h += `<div class="kv"><span>${sea ? 'بحراً' : 'براً'}: المدة</span><b class="num">${cur.days} أيام</b></div>`;
  if (sea) h += `<div class="kv"><span>رسم الميناء</span><b class="num">${fmt(Math.round(cur.sp.fee))}</b></div><div class="kv"><span>خطر العواصف والقراصنة</span><b class="num ${cur.sp.risk > 0.15 ? 'dear' : ''}">${Math.round(cur.sp.risk * 100)}٪</b></div>`;
  else { const rk = S.risk[E.riskKey(from, to)] || 0; h += `<div class="kv"><span>خطر اللصوص</span><b class="num ${rk > 0.1 ? 'dear' : ''}">${Math.round(rk * 100)}٪</b></div>`; }
  if (portOk && seaP && !seaP.ok) h += `<div class="qnote">البحر غير متاح: ${esc(seaP.msg)}</div>`;
  h += `</div>`;
  h += `<div class="card"><b>ثانياً: مؤن السفر</b> <span class="small muted">(اختيارية)</span>${paceBlock(to, sea)}</div>`;
  const cost = Math.round(cur.cost);
  h += `<div class="card"><b>ثالثاً: ما ستشتريه</b><div class="kv"><span>${gi(t.g)} ${G.name}</span><b class="num">${cur.k} وحدة ≈ ${fmt(cost)} ريال</b></div>${cur.k < Math.min(t.q, 999) ? `<div class="qnote">${cur.room < Math.min(cur.afford, t.q) ? 'الكمية محدودة بمساحة القافلة' : 'الكمية محدودة برصيدك بعد حجز نفقة الطريق'}.</div>` : ''}${cur.cus ? `<div class="small muted">جمارك ${Math.round(cur.cus * 100)}٪ تُدفع عند البيع في ${esc(cityName(to))}.</div>` : ''}</div>`;
  if (cur.k < 1 && cur.walletShort) h += limNote('wallet', E.curOf(S.cities[from].country)); else if (cur.k < 1) h += `<div class="qnote">${cur.room < 1 ? 'لا مكان في القافلة لهذه السلعة: ' : cur.afford < 1 ? 'رصيدك لا يكفي بعد حجز نفقة الطريق. ' : ''}${cur.room < 1 ? 'بِع شيئاً من حمولتك أو اختر سلعة أخرى.' : 'اختر سلعة أرخص أو انتظر حتى يزيد رصيدك.'}</div>`;
  h += `<div class="row"><button class="pri big" data-act="tpgo" ${cur.k < 1 ? 'disabled' : ''}>اشترِ ${cur.k} وانطلق ${sea ? 'بحراً' : 'براً'}</button><button data-act="tpcancel">إلغاء</button></div></div>`;
  return h;
}
function guideHTML() {
  if (guideOff || S.tut) return '';
  const P = S.player, cr = main(), ld = E.loadOf(cr);
  let step, msg, btn = '';
  if (cr.left > 0) { step = 3; msg = `القافلة في الطريق إلى <b>${cityTag(cr.dest)}</b> (باقٍ ${dayAr(cr.left)}). ${speed ? 'الوقت يمضي، انتظر الوصول.' : 'الوقت متوقف: اضغط ▶ ليمضي.'}`; btn = speed ? '' : '<button class="pri" data-act="play">▶ شغّل الوقت</button>'; }
  else if (ld >= 1 && P.trips >= 1) { step = 4; msg = `وصلت إلى <b>${cityTag(cr.city)}</b>! بِع بضاعتك هنا.`; btn = '<button class="pri" data-act="sellall">💰 بِع كل البضاعة</button>'; }
  else if (ld >= 1) { step = 2; msg = `معك بضاعة. الآن <b>سافر</b> إلى مدينة أغلى: من الخريطة أو بزر «اشترِ وسافر» في السوق.`; btn = '<button class="pri" data-go="map">🗺️ افتح الخريطة</button>'; }
  else if (P.trips === 0) { step = 1; msg = `أنت في <b>${cityTag(cr.city)}</b> بـ ${fmt(P.gold)} ريال. <b>اشترِ</b> سلعة سعرها أخضر (رخيص) من السوق. ابدأ بمدن بلدك فهي أقرب وبلا جمارك.`; btn = screen === 'market' ? '' : '<button class="pri" data-go="market">🏪 اذهب إلى السوق</button>'; }
  else { step = 5; msg = `ثروتك الآن ${fmt(E.netWorth(S))}. كرّر: <b>اشترِ رخيصاً ← سافر ← بِع</b>. عند ثروة ${fmt(E.PHASE_AT[1])} يُفتح الطور 2 (دكاكين ومخازن وقادة).`; }
  return `<div class="guide"><div class="row" style="margin:0">${av('official')}<b>الخطوة ${step} من 5</b><span class="spacer"></span><button class="sm" data-act="guideoff" title="إخفاء الإرشاد">إخفاء</button></div><div style="margin:4px 0">${msg}</div>${btn}</div>`;
}

