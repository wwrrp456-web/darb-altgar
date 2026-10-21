/* ---------- 4 القافلة ---------- */
function screenCaravan() {
  const P = S.player, cr = car(); let h = `${pic('scene/caravan', 'banner', 'القافلة')}`;
  if (P.caravans.length > 1) h += `<div class="chips" style="margin-bottom:12px">${P.caravans.map(c => `<button data-act="selcar" data-id="${c.id}" class="${c.id === cr.id ? 'on' : ''}">${esc(c.name)}</button>`).join('')}</div>`;
  const cap = E.capOfCar(cr), ld = E.loadOf(cr), idle = cr.left === 0;
  h += `<div class="grid g3"><div class="card"><h3>📍 الموقع</h3><b>${idle ? cityTag(cr.city) : 'في الطريق إلى ' + cityTag(cr.dest)}</b>${idle ? '' : `<div class="small muted">باقٍ ${cr.left} يوم</div>${bar(cr.total - cr.left, cr.total, 'gold')}`}</div><div class="card"><h3>💪 المعنويات</h3><b class="num">${Math.round(cr.morale)} / 100</b>${bar(cr.morale, 100, cr.morale < 50 ? 'red' : '')}<div class="small muted">تنخفض بالسفر وتعود بالراحة في المدن.</div></div><div class="card"><h3>${av('leader')} الطاقم</h3><div class="kv"><span>عربات</span><b>${cr.carts}</b></div><div class="kv"><span>رجال</span><b>${cr.crew}</b></div><div class="kv"><span>حرّاس</span><b>${cr.guards}</b></div>${cr.captain ? `<div class="small muted">القائد ${esc(cr.captain.name)}: تجارة ${cr.captain.trade} · ملاحة ${cr.captain.nav} · قتال ${cr.captain.combat}</div>` : ''}</div></div>`;
  const icons = []; GIDS.forEach(g => { const n = Math.ceil((cr.cargo[g] || 0) * GD[g].w / 10 - 0.001); for (let i = 0; i < n; i++) icons.push(gi(g)); });
  const slots = Math.max(cap / 10, icons.length);
  h += `<h2 style="margin-top:16px">📦 الحمولة <span class="muted small num">${fmt(ld)} / ${cap}</span></h2><div class="card"><div class="crates">${Array.from({ length: slots }, (_, i) => `<div class="crate ${icons[i] ? 'f' : ''}">${icons[i] || ''}</div>`).join('')}</div>${GIDS.filter(g => (cr.cargo[g] || 0) >= 1).length ? `<div class="row small">${GIDS.filter(g => (cr.cargo[g] || 0) >= 1).map(g => `<button class="pill pbtn" data-act="cargo" data-g="${g}" aria-label="تفاصيل ${GD[g].name}">${gi(g)} ${GD[g].name}: ${Math.floor(cr.cargo[g])}${E.avgCost(cr.basis, g) != null ? ' · تكلفة ' + f1(E.avgCost(cr.basis, g)) : ''}</button>`).join('')}</div>` : '<p class="small muted">القافلة فارغة. اشترِ من السوق.</p>'}</div>`;
  { const hu = E.herdUnits(cr), hc = E.herdCap(cr), hl = GIDS.filter(g => ((cr.herd || {})[g] || 0) >= 1 || E.youngOf(cr, g) >= 1);
    h += `<h2 style="margin-top:16px">🐑 القطيع الماشي <span class="muted small num">${fmt(hu)} / ${hc}</span></h2><div class="card herd"><div class="small">رعاة: <b class="num">${cr.herders || 0}</b> من ${E.MAX_HERDERS} · كل راعٍ يسوق ${E.HERD_PER} وحدة قطيع (الغنمة وحدة والبقرة والجمل والفرس وحدتان) · أجره ${E.HERDER_WAGE} يومياً</div>${bar(hu, Math.max(1, hc), hu > hc * 0.9 && hc ? 'red' : '')}${hl.length ? `<div class="row small">${hl.map(g => `<span class="pill">${herdLine(cr, g)}</span>`).join('')}</div>${idle ? hl.filter(g => Math.floor(E.youngOf(cr, g)) >= 1).map(g => `<div class="row small"><button class="sm" data-act="sellyoung" data-g="${g}" data-q="${Math.floor(E.youngOf(cr, g))}">بِع صغار ${GD[g].name} (${Math.floor(E.youngOf(cr, g))}) بنصف السعر</button></div>`).join('') : ''}` : '<div class="small muted">لا قطيع بعد. وظّف راعياً ثم اشترِ مواشي «للقطيع» من السوق.</div>'}${hu > 0 ? '<div class="small muted">القطيع يُبطئ القافلة (15٪ فأكثر) ويأكل علفاً من مؤنها، لكنه ينفق أقل من الحمولة.</div>' : ''}${idle ? pairBox('car', cr.id, cr) : ''}<div class="row"><button class="sm pri" data-act="hherder" ${idle && (cr.herders || 0) < E.MAX_HERDERS ? '' : 'disabled'}>وظّف راعياً (${E.HERDER_WAGE}/يوم · ${E.HERDER_FEE})</button><button class="sm" data-act="fherder" ${idle && cr.herders ? '' : 'disabled'}>سرّح راعياً</button></div></div>`; }
  if (S.phase >= E.SEA.phase) h += fleetHTML(cr, idle);
  h += `<h2 style="margin-top:16px">🔧 تجهيز القافلة</h2><div class="grid g4">`;
  [[uic('crate') || '🛒', 'عربة', 'تزيد الحمولة 100', '600', 'cart'], [av('porter') || '🧑‍🌾', 'رجل طاقم', 'يسرّع الدفاع قليلاً', '50', 'crew'], [av('guard') || '🛡️', 'حارس', 'يصدّ اللصوص', '300', 'guard']].forEach(([ic, t, d, p, a]) => { h += `<div class="card up"><span class="ic">${ic}</span><b>${t}</b><div class="small muted">${d}</div><button data-act="${a}" ${idle ? '' : 'disabled'}>+ ${t} (${p})</button></div>`; });
  h += `<div class="card up"><span class="ic">📜</span>${ti('ins_goods')}<b>التكافل عن الرحلة</b><div class="small muted">تتبرع بـ2.5٪ من قيمة الحمولة لصندوق التكافل المشترك مع تجار السوق، فيعوّضك عن نحو 70٪ من خسارة اللصوص بحدّ نصف رصيد الصندوق (${fmt(Math.round((P.tk && P.tk.pool) || 0))} ريال الآن).</div><label><input type="checkbox" id="insBox" ${cr.insured ? 'checked' : ''}> مشترك</label></div></div>`;
  if (idle && cr.main && P.gold <= 150 && ld < 1) h += `<div class="card" style="margin-top:12px"><b>أفلست؟</b> <button data-act="work">اعمل حمّالاً في السوق (+40)</button></div>`;
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
  const cr = main(), G = GD[g], have = Math.floor(cr.cargo[g] || 0), idle = cr.left === 0, c = S.cities[cr.city];
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
  ${best.length ? `<div class="card"><b>أفضل أماكن البيع</b>${best.map(x => `<div class="kv"><span>${cityTag(x.city)} · ${x.days} أيام</span><b class="num ${x.profit >= 0 ? 'cheap' : 'dear'}">${pls(x)}</b></div>`).join('')}</div>` : ''}
  <div class="row">${idle && have ? `<button class="sm pri" data-act="cgsell" data-g="${g}">بِع من هذه السلعة في السوق</button>` : ''}</div>
  ${pr0 && store ? `<div class="card"><b>إيداع في المخزن</b><div class="small muted">المخزن يتسع لـ${fmt(room)} وحدة منها</div>${stepper('st:' + g, q, mx)}<div class="row"><button class="sm pri" data-act="stow" data-g="${g}" ${have < 1 || room < 1 ? 'disabled' : ''}>أودع ${q} في المخزن</button><button class="sm" data-act="tostore" data-g="${g}" ${have < 1 || room < 1 ? 'disabled' : ''}>أودع الكل</button></div></div>` : ''}</div>`;
}

/* الأسطول: سفن تُشترى في الموانئ وتُبحر بها قافلتك بين الموانئ */
function fleetHTML(cr, idle) {
  const ships = E.shipsOf(S), T = E.SHIPS.dhow, here = cr.city, c = S.cities[here], canBuy = idle && E.isPort(here) && !E.shipAt(S, here);
  const cost = Math.round(T.cost * (c.country === S.home ? 1 : 1.4));
  return `<h2 style="margin-top:16px">${ti('ship_dhow') || '🚢'} الأسطول <span class="muted small">${ships.length ? ships.length + ' سفينة' : ''}</span></h2><div class="card fleet">
    ${pic('scene/sea_fleet', 'banner', 'الأسطول') || ''}
    ${ships.length ? ships.map(sh => `<div class="kv"><span>${ti('ship_dhow')} <b>${esc(sh.name)}</b> · ${sh.city ? 'راسية في ' + cityTag(sh.city) : 'تُبحر نحو ' + cityTag(sh.dest)} · سعة ${E.SHIPS[sh.type].cap}</span>${sh.city ? `<button class="sm" data-act="sellship" data-s="${sh.id}">بِع بـ${fmt(Math.round(E.SHIPS[sh.type].cost * E.SEA.sellBack))}</button>` : ''}</div>`).join('') : '<p class="small muted" style="margin:0 0 8px">لا سفن لك بعد. تُشترى السفينة في ميناء، وتبحر بها قافلتك إلى ميناء آخر.</p>'}
    ${canBuy ? `<div class="row"><button class="sm pri" data-act="buyship" data-c="${here}">${ti('ship_buy')} اشترِ سنبوقاً في ${esc(c.name)} · ${fmt(cost)}</button></div>` : idle && E.isPort(here) ? '<p class="small muted">لك سفينة راسية في هذا الميناء. افتح الخريطة واختر ميناءً آخر لتُبحر.</p>' : '<p class="small muted">تُشترى السفينة وأنت في أحد الموانئ: جدة، جازان، الإسكندرية، مومباي، كلكتا، كانتون، شنغهاي.</p>'}
    <p class="small muted" style="margin:8px 0 0">${ti('travel_sea')} البحر يحمل أكثر ويسرع في المسافات الطويلة، لكن له رسم ميناء ورياح موسمية (تُبحر شرقاً في النصف الأول من السنة وغرباً في الثاني) وعواصف وقراصنة. إن لم تُحسن الموسم أبطأت ورفعتَ الخطر.</p></div>`;
}
