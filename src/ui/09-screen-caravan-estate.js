/* ---------- 4 القافلة ---------- */
function screenCaravan() {
  const P = S.player, cr = car(); let h = `${pic('scene/caravan', 'banner', 'القافلة')}`;
  if (P.caravans.length > 1) h += `<div class="chips" style="margin-bottom:12px">${P.caravans.map(c => `<button data-act="selcar" data-id="${c.id}" class="${c.id === cr.id ? 'on' : ''}">${esc(c.name)}</button>`).join('')}</div>`;
  const cap = E.capOfCar(cr), ld = E.loadOf(cr), idle = cr.left === 0;
  h += `<div class="grid g3"><div class="card"><h3>📍 الموقع</h3><b>${idle ? cityTag(cr.city) : 'في الطريق إلى ' + cityTag(cr.dest)}</b>${idle ? '' : `<div class="small muted">باقٍ ${dayAr(cr.left)}</div>${bar(cr.total - cr.left, cr.total, 'gold')}`}</div><div class="card"><h3>💪 المعنويات</h3><b class="num">${Math.round(cr.morale)} / 100</b>${bar(cr.morale, 100, cr.morale < 50 ? 'red' : '')}<div class="small muted">تنخفض بالسفر وتعود بالراحة في المدن.</div></div><div class="card"><h3>${av('leader')} الطاقم</h3><div class="kv"><span>عربات</span><b>${cr.carts}</b></div><div class="kv"><span>رجال</span><b>${cr.crew}</b></div><div class="kv"><span>حرّاس</span><b>${cr.guards}</b></div>${cr.captain ? `<div class="small muted">القائد ${esc(cr.captain.name)}: تجارة ${cr.captain.trade} · ملاحة ${cr.captain.nav} · قتال ${cr.captain.combat}</div>` : ''}</div></div>`;
  const goods=GIDS.filter(g=>(cr.cargo[g]||0)>=1);
  h += `<h2 style="margin-top:16px">📦 الحمولة <span class="muted small num">${fmt(ld)} / ${cap}</span></h2><section class="card cargo-card" aria-label="بضائع القافلة">${goods.length?`<p class="small muted cargo-hint">اضغط على المنتج لعرض بياناته وتكلفته.</p><div class="cargo-products" role="group" aria-label="المنتجات المحملة">${goods.map(g=>`<button type="button" class="cargo-product" data-act="cargo" data-g="${g}" aria-label="تفاصيل ${GD[g].name}، الكمية ${fmt(Math.floor(cr.cargo[g]))}"><span class="cargo-product-icon" aria-hidden="true">${gi(g)}</span><span class="cargo-product-name">${esc(GD[g].name)}</span><b class="cargo-product-qty num" dir="ltr" aria-hidden="true">× ${fmt(Math.floor(cr.cargo[g]))}</b></button>`).join('')}</div>`:'<p class="muted">القافلة فارغة. اشترِ من السوق.</p><button data-go="market">اذهب إلى السوق</button>'}</section>`;
  { const hu = E.herdUnits(cr), hc = E.herdCap(cr), hl = GIDS.filter(g => ((cr.herd || {})[g] || 0) >= 1 || E.youngOf(cr, g) >= 1);
    h += `<h2 style="margin-top:16px">🐑 القطيع الماشي <span class="muted small num">${fmt(hu)} / ${hc}</span></h2><div class="card herd"><div class="small">رعاة: <b class="num">${cr.herders || 0}</b> من ${E.MAX_HERDERS} · كل راعٍ يسوق ${E.HERD_PER} وحدة قطيع (الغنمة وحدة والبقرة والجمل والفرس وحدتان) · أجره ${E.HERDER_WAGE} يومياً</div>${bar(hu, Math.max(1, hc), hu > hc * 0.9 && hc ? 'red' : '')}${hl.length ? `<div class="row small">${hl.map(g => `<span class="pill">${herdLine(cr, g)}</span>`).join('')}</div>${idle ? hl.filter(g => Math.floor(E.youngOf(cr, g)) >= 1).map(g => `<div class="row small"><button class="sm" data-act="sellyoung" data-g="${g}" data-q="${Math.floor(E.youngOf(cr, g))}">بِع صغار ${GD[g].name} (${Math.floor(E.youngOf(cr, g))}) بنصف السعر</button></div>`).join('') : ''}` : '<div class="small muted">لا قطيع بعد. وظّف راعياً ثم اشترِ مواشي «للقطيع» من السوق.</div>'}${hu > 0 ? '<div class="small muted">القطيع يُبطئ القافلة (15٪ فأكثر) ويأكل علفاً من مؤنها، لكنه ينفق أقل من الحمولة.</div>' : ''}${idle ? pairBox('car', cr.id, cr) : ''}<div class="row"><button class="sm pri" data-act="hherder" ${idle && (cr.herders || 0) < E.MAX_HERDERS ? '' : 'disabled'}>وظّف راعياً (${E.HERDER_WAGE}/يوم · ${E.HERDER_FEE})</button><button class="sm" data-act="fherder" ${idle && cr.herders ? '' : 'disabled'}>سرّح راعياً</button></div></div>`; }
  if (S.phase >= E.SEA.phase) h += fleetHTML(cr, idle);
  h += `<h2 style="margin-top:16px">🔧 تجهيز القافلة</h2><div class="grid g4">`;
  h += upgradeCompareHTML(cr);
  [[uic('crate') || '🛒', 'عربة', 'تزيد الحمولة 100 (' + cr.carts + ' من ' + E.CART_MAX + ')', String(E.cartCost(cr)), 'cart'], [av('porter') || '🧑‍🌾', 'رجل طاقم', 'يسرّع الدفاع قليلاً', '50', 'crew'], [av('guard') || '🛡️', 'حارس', 'يصدّ اللصوص', '300', 'guard']].forEach(([ic, t, d, p, a]) => { const wg = a === 'guard' || a === 'crew' ? E.staffWage(S, a) : null; h += `<div class="card up"><span class="ic">${ic}</span><b>${t}</b><div class="small muted">${d}</div>${wg ? `<div class="small wage">أجر معلوم: ${wg.once} مرة + <b>${wg.day}</b> يومياً أثناء السفر${a === 'guard' ? ' (' + wg.idle + ' حين تقف)' : ''}</div>` : ''}<button data-act="${a}" ${idle ? '' : 'disabled'}>+ ${t} (${p})</button></div>`; });
  h += `<div class="card up"><span class="ic">📜</span>${ti('ins_goods')}<b>التكافل عن الرحلة</b><div class="small muted">تتبرع بـ2.5٪ من قيمة الحمولة لصندوق التكافل المشترك مع تجار السوق، فيعوّضك عن نحو 70٪ من خسارة اللصوص بحدّ نصف رصيد الصندوق (${fmt(Math.round((P.tk && P.tk.pool) || 0))} ريال الآن).</div><label><input type="checkbox" id="insBox" ${cr.insured ? 'checked' : ''}> مشترك</label></div></div>`;
  if(cr.main)h+=distressCardHTML();
  return h;
}

/* ---------- 5 العقارات: دكاكين ومخازن ---------- */
function teaser(ph, icon, title, items) {
  const nw = E.netWorth(S), need = E.PHASE_AT[ph - 1];
  return `<div class="card locked"><h2>${icon} ${title} <span class="pill">🔒 الطور ${ph}</span></h2><ul class="small" style="margin:0 0 6px;padding-inline-start:18px">${items.map(i => `<li>${i}</li>`).join('')}</ul><div class="small muted">يُفتح عند ثروة ${fmt(need)} (ثروتك ${fmt(nw)})</div><div class="lockbar">${bar(nw, need, 'gold')}</div></div>`;
}

/* تفاصيل بضاعة القافلة: نافذة تُفتح بالضغط على أي نوع في الحمولة */
let cdg = null;
function cargoModalHTML(g) {
  const cr = car(), G = GD[g], have = Math.floor(cr.cargo[g] || 0), idle = cr.left === 0, c = S.cities[cr.city];
  const cap = E.capOfCar(cr), w = have * G.w, avg = E.avgCost(cr.basis, g);
  const pr = idle ? E.unitPrice(c, g) : null, ref = idle ? E.refPrice(c, g) : null;
  const best = have && idle ? E.sellOptions(S, cr.city, g, have, avg != null ? avg : pr || 0).slice(0, 2) : [];
  const pls = x => `${x.profit >= 0 ? '+' : '−'}${fmt(Math.abs(Math.round(x.profit)))}`;
  const kv = (a, b) => `<div class="kv"><span>${a}</span><b class="num">${b}</b></div>`;
  const pr0 = E.hasPresence(S, cr.city) && idle, store = S.player.props[cr.city];
  const room = pr0 ? Math.floor(E.storeRoom(S, cr.city) / G.w) : 0, mx = Math.max(1, Math.min(have, room || have)), q = clampQ(QS['st:' + g] == null ? 1 : QS['st:' + g], mx);
  return `<div class="mbox" role="dialog" aria-label="${esc(G.name)}"><div class="row" style="margin-top:0"><span style="font-size:40px">${gi(g)}</span><div><h2 style="margin:0">${esc(G.name)} <span class="pill">${tierName(G.tier)}</span></h2>${qLabel(cr, g)}</div><span class="spacer"></span><button class="sm" data-act="cgclose">إغلاق</button></div>
  <div class="card">${kv('الكمية معك', fmt(have))}${kv('الوزن الذي تشغله', fmt(Math.round(w)) + ' من ' + fmt(cap) + ' (' + Math.round(w / Math.max(1, cap) * 100) + '٪)')}${avg != null ? kv('متوسط تكلفتك للوحدة', f1(avg)) : ''}${G.spoil > 0 ? kv('يفسد يومياً', (G.spoil * 100).toFixed(1) + '٪') : ''}</div>
  ${idle ? `<div class="card"><b>في ${esc(c.name)} الآن</b>${kv('سعر الوحدة', f1(pr))}${kv('السعر المعتاد', f1(ref))}<div class="small muted">${Math.round(pr / ref * 100)}٪ من المعتاد</div></div>` : `<div class="small muted" style="margin:8px 0">القافلة في الطريق، فلا سعر حيّ الآن.</div>`}
  ${best.length ? `<div class="card"><b>أفضل أماكن البيع</b>${best.map(x => `<div class="kv"><span>${cityTag(x.city)} · ${dayAr(x.days)}</span><b class="num ${x.profit >= 0 ? 'cheap' : 'dear'}">${pls(x)}</b></div>`).join('')}</div>` : ''}
  <div class="row">${idle && have && cr.id===main().id ? `<button class="sm pri" data-act="cgsell" data-g="${g}">بِع من هذه السلعة في السوق</button>` : ''}</div>
  ${pr0 && store ? `<div class="card"><b>إيداع في المخزن</b><div class="small muted">المخزن يتسع لـ${fmt(room)} وحدة منها</div>${stepper('st:' + g, q, mx)}<div class="row"><button class="sm pri" data-act="stow" data-g="${g}" ${have < 1 || room < 1 ? 'disabled' : ''}>أودع ${q} في المخزن</button><button class="sm" data-act="tostore" data-g="${g}" ${have < 1 || room < 1 ? 'disabled' : ''}>أودع الكل</button></div></div>` : ''}</div>`;
}

/* الأسطول: سفن بأنواع تُشترى في الموانئ وتُرقّى ويُوظَّف لها بحّارة وقائد، وتُبحر بها قافلتك بين الموانئ */
const SEA_CAP_IMG = { navigator: 'hero/sea_captain_nav', bold: 'hero/sea_captain_bold', sage: 'hero/sea_captain_old' };
function shipCard(sh) {
  const T = E.SHIPS[sh.type], dock = !!sh.city, hull = E.shipUp(sh, 'hull'), sail = E.shipUp(sh, 'sail'), crew = E.shipCrew(sh), cp = sh.captain, fm = dock && S.cities[sh.city].country !== S.home ? 1.4 : 1;
  const upBtn = k => { const U = E.SHIP_UP[k], lv = E.shipUp(sh, k); return lv >= 2 ? `<span class="pill">${U.name} ✓ مكتمل</span>` : `<button class="sm" data-act="upship" data-s="${sh.id}" data-k="${k}" title="${U.desc}">${ti(k === 'hull' ? 'ship_hull' : 'ship_sail')} ${U.name} ${lv + 1} · ${fmt(Math.round(T.cost * U.cost[lv] * fm))}</button>`; };
  const pool = dock && !cp ? E.seaCaptainPool(S) : [];
  return `<div class="card shipc"><div class="row" style="margin:0">${ti('ship_' + sh.type)}<b>${esc(sh.name)}</b> <span class="pill">${T.name}</span><span class="small muted">${dock ? 'راسية في ' + cityTag(sh.city) : 'تُبحر نحو ' + cityTag(sh.dest)}</span></div>
    <div class="kv small"><span>السعة · السرعة</span><b class="num">${T.cap} · ×${T.speed}</b></div>
    <div class="kv small"><span>الهيكل · الأشرعة</span><b class="num">${hull}/2 · ${sail}/2</b></div>
    <div class="kv small"><span>${ti('ship_crew')} البحّارة</span><b class="num">${crew}/${T.slots}</b></div>
    <div class="kv small"><span>القائد</span>${cp ? `<span class="row" style="margin:0;gap:6px">${pic(SEA_CAP_IMG[cp.role], 'seacap', cp.name)}<b>${esc(cp.name)}</b> <span class="small muted">${E.SEA_ROLES[cp.role].name} · ملاحة ${cp.nav} · قتال ${cp.combat} · ${cp.wage} ر/يوم</span></span>` : '<span class="muted">بلا قائد</span>'}</div>
    ${dock ? `<div class="row small">${upBtn('hull')}${upBtn('sail')}<button class="sm" data-act="hiresailor" data-s="${sh.id}" ${crew >= T.slots ? 'disabled' : ''}>+ بحّار · ${E.SAILOR_FEE}</button><button class="sm" data-act="dismisssailor" data-s="${sh.id}" ${crew ? '' : 'disabled'}>− بحّار</button>${cp ? `<button class="sm" data-act="firecap" data-s="${sh.id}">سرّح ${esc(cp.name)}</button>` : ''}<button class="sm" data-act="sellship" data-s="${sh.id}">بِع بـ${fmt(Math.round(T.cost * E.SEA.sellBack))}</button></div>
    ${pool.length ? `<details class="mdet"><summary>${ti('captain_rank')} وظّف قائداً بحرياً</summary><div class="grid g3">${pool.map(c => `<div class="card">${pic(SEA_CAP_IMG[c.role], 'seacap', c.name)}<b>${esc(c.name)}</b><div class="small muted">${E.SEA_ROLES[c.role].name}: ${E.SEA_ROLES[c.role].desc}</div><div class="small">ملاحة ${c.nav} · قتال ${c.combat}</div><div class="small">${fmt(c.fee)} + ${c.wage} ر/يوم</div><button class="sm pri" data-act="hirecap" data-s="${sh.id}" data-i="${c.i}">وظّفه</button></div>`).join('')}</div></details>` : ''}` : ''}</div>`;
}
function fleetHTML(cr, idle) {
  const ships = E.shipsOf(S), here = cr.city, c = S.cities[here], port = idle && E.isPort(here), fm = c.country === S.home ? 1 : 1.4, trips = S.player.seaTrips || 0;
  const buy = port && !E.shipAt(S, here) ? `<div class="row small">${Object.keys(E.SHIPS).map(t => { const T = E.SHIPS[t], lock = trips < T.need; return `<button class="sm ${lock ? '' : 'pri'}" data-act="buyship" data-c="${here}" data-t="${t}" ${lock ? 'disabled' : ''}>${ti('ship_' + t)} ${T.name} · ${fmt(Math.round(T.cost * fm))} · سعة ${T.cap}${lock ? ' · بعد ' + T.need + ' رحلات' : ''}</button>`; }).join('')}</div>` : '';
  return `<h2 style="margin-top:16px">${ti('ship_dhow') || '🚢'} الأسطول <span class="muted small">${ships.length ? ships.length + ' سفينة' : ''} · رحلات بحرية ${trips}</span></h2>${pic('scene/sea_fleet', 'banner', 'الأسطول') || ''}
    ${ships.length ? ships.map(shipCard).join('') : '<div class="card"><p class="small muted" style="margin:0">لا سفن لك بعد. تُشترى السفينة في ميناء، وتبحر بها قافلتك إلى ميناء آخر.</p></div>'}
    <div class="card fleet">${buy || (port ? '<p class="small muted" style="margin:0">لك سفينة راسية في هذا الميناء. افتح الخريطة واختر ميناءً آخر لتُبحر.</p>' : '<p class="small muted" style="margin:0">تُشترى السفينة وأنت في أحد الموانئ: جدة، جازان، الإسكندرية، مومباي، كلكتا، كانتون، شنغهاي.</p>')}
    <p class="small muted" style="margin:8px 0 0">${ti('travel_sea')} البحر يحمل أكثر ويسرع في المسافات الطويلة، لكن له رسم ميناء ورياح موسمية (تُبحر شرقاً من أبريل إلى سبتمبر وغرباً من أكتوبر إلى مارس) وعواصف وقراصنة. السفن الأكبر (بغلة ثم بوم) تُفتح بعدد رحلاتك البحرية، والقائد والبحّارة والهيكل تُخفّف خسائر البحر.</p></div>`;
}
