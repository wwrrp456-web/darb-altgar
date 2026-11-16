/* ---------- 034 الخريطة الحية: اللوحة المرسومة، أربع طبقات، سحب وتكبير، بطاقتا المدينة والقافلة ----------
   طبقة عرض فقط: كل الأرقام من E.map* (قراءة) والسفر بـ data-act="go" القائم (A.travel). المفتاح E.MAPLIVE.on و?maplive=off ⇒ الخريطة القديمة حرفاً (07-screen-map.js).
   الشيء الوحيد المحفوظ: الطبقة في localStorage['map.layer'] (راحة للمشاهد، بلا أي حقل في حفظ اللعبة). */
const ML = { layer: null, s: 0, tx: 0, ty: 0, W: 0, H: 0, selCity: null, selCar: null, follow: null, sent: null, data: null, cars: [], shown: {}, anim: null, pt: new Map(), moved: 0, pinch: null, focusId: null, pend: null, size: null, guide: null };
const MLAYERS = [['cargo', 'حمولتي', 'icons/cart'], ['own', 'أملاكي', 'icons/ui-shops'], ['risk', 'المخاطر والرياح', 'icons/ui-risks'], ['riv', 'المنافسون', 'icons/ui-feuds']];
const mlOn = () => !!(E.MAPLIVE && E.MAPLIVE.on) && !/[?&]maplive=off/.test(location.search);
const mlCfg = () => E.MAPLIVE;
const mlLayer = () => { if (ML.layer) return ML.layer; let v = null; try { v = localStorage.getItem('map.layer'); } catch (e) {} ML.layer = MLAYERS.some(x => x[0] === v) ? v : 'cargo'; return ML.layer; };
const mlSetLayer = k => { ML.layer = k; try { localStorage.setItem('map.layer', k); } catch (e) {} };
const mlSgn = n => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));
const mlPlural = (n, one, two, many) => n === 1 ? one : n === 2 ? two : many;
const mlHeldTxt = held => { const t = held.slice(0, 3).map(h => fmt(h.q) + ' ' + GD[h.g].name).join('، '); return t + (held.length > 3 ? '، …' : ''); };
const mlCarName = c => '«' + esc(c.name) + '»';
const mlReduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const mlIm = (k, w, extra) => ART[k] ? `<img src="${ART[k]}" alt="" ${w ? `width="${w}" height="${w}" ` : ''}${extra || ''}>` : '';

/* ===== البيانات (تُحسب مرة لكل رسم) ===== */
function mlCompute() {
  const roads = null; // الشبكة البرية من E.mapEdges (WM.roads على إحداثيات المحاكاة)
  const cargo = E.mapCargoView(S), own = E.mapOwnView(S), risk = E.mapRiskView(S, roads), riv = E.mapRivView(S), cars = E.mapCarList(S);
  ML.data = { cargo, own, risk, riv }; ML.cars = cars; return ML.data;
}
/* ===== أجزاء الصفحة ===== */
function mlStateLine(d) {
  const ac = d.cargo.ac;
  if (ac.left > 0) return `قافلتك ${mlCarName(ac)} في الطريق إلى ${esc(cityName(ac.dest))} · تصل اليوم ${S.day + ac.left}`;
  if (d.cargo.held.length) return `قافلتك ${mlCarName(ac)} في ${esc(cityName(ac.city))} بـ${esc(mlHeldTxt(d.cargo.held))}`;
  return `قافلتك ${mlCarName(ac)} في ${esc(cityName(ac.city))} · فارغة`;
}
function mlSummary(d, layer) {
  const cv = d.cargo, ac = cv.ac; let t = '';
  if (layer === 'cargo') {
    if (cv.state === 'moving') t = `طبقة <b>حمولتي</b>: ${cv.held.length ? esc(mlHeldTxt(cv.held)) : 'قافلتك'} في الطريق إلى ${esc(cityName(ac.dest))}`;
    else if (cv.state === 'empty') t = 'طبقة <b>حمولتي</b>: قافلتك فارغة · اشترِ من السوق ثم اختر وجهتك';
    else if (cv.best) t = `طبقة <b>حمولتي</b>: ${esc(mlHeldTxt(cv.held))} · أفضل سوق <b>${esc(cityName(cv.best.city))}</b> ${mlSgn(Math.round(cv.best.profit))} في ${dayAr(cv.best.days)} (${fmt(Math.round(cv.best.perDay))} في اليوم)`;
    else t = `طبقة <b>حمولتي</b>: ${esc(mlHeldTxt(cv.held))} · لا سوق رابح معروف لحمولتك الآن`;
  } else if (layer === 'own') {
    const o = d.own;
    if (!o.N) t = 'طبقة <b>أملاكي</b>: لا أملاك لك بعد';
    else t = `طبقة <b>أملاكي</b>: ${o.N} ${mlPlural(o.N, 'ملك', 'ملكان', 'أملاك')} في ${o.M} ${mlPlural(o.M, 'مدينة', 'مدينتين', 'مدن')} · صافي الشهر <b class="${o.net >= 0 ? 'up' : 'down'}">${mlSgn(Math.round(o.net))}</b>` + (o.worst ? ` · <span class="down">تنبيه: دكان ${esc(cityName(o.worst.city))} متهالك (${Math.round(o.worst.bad.cond)})</span>` : '');
  } else if (layer === 'risk') {
    const sh = d.risk.shocks, n = sh.length, w = d.risk.wind;
    t = n ? `طبقة <b>المخاطر والرياح</b>: ${n} ${mlPlural(n, 'خطر نشط', 'خطران نشطان', 'أخطار نشطة')} (${sh.map(x => esc(x.text)).join('، ')})` : 'طبقة <b>المخاطر والرياح</b>: لا خطر نشط على الطرق';
    if (w) t += ` · <b>الريح الموسمية</b> تسرّع الإبحار ${w.dir} ${w.K}٪ حتى اليوم ${w.dEnd}`;
  } else {
    const r = d.riv;
    if (!r.n) t = 'طبقة <b>المنافسون</b>: لا منافس مؤثر في أسواقك';
    else t = `طبقة <b>المنافسون</b>: ${r.n} ${mlPlural(r.n, 'منافس', 'منافسان', 'منافسين')} في أسواقك · أقواهم في ${esc(cityName(r.top.city))} (${esc(r.top.name)})` + (r.rivalOnRoad ? ' · قافلة منافسة على الطريق' : '');
  }
  if (ML.sent) {
    const sc = S.player.caravans.find(c => c.id === ML.sent.car);
    if (sc && sc.left > 0 && sc.dest === ML.sent.to) t += ` <br>✓ أُرسلت ${mlCarName(sc)} إلى <b>${esc(cityName(ML.sent.to))}</b>: تصل بعد ${dayAr(sc.left)}`;
  }
  return t;
}
function mlLegend(layer) {
  const dot = c => `<i style="background:${c}"></i>`, ln = c => `<i class="ln" style="background:${c}"></i>`;
  return { cargo: `<span>${dot('#b88a2a')}الأفضل</span><span>${dot('#2f7d4f')}ربح</span><span>${dot('#9aa4ae')}لا طلب أو خسارة</span>`,
    own: `<span>${dot('#2c5b86')}لك فيها أملاك</span><span>${dot('#a8402f')}تحتاج انتباهاً</span>`,
    risk: `<span>${ln('#4f9a5f')}آمن</span><span>${ln('#c27a1a')}متوسط</span><span>${ln('#a8402f')}خطر</span><span>${ln('#e0b54a')}خط الشهبندر</span>`,
    riv: `<span>${dot('#7a3e8e')}منافس قوي في السوق</span><span>${dot('#c9a0d6')}قافلة منافس</span>` }[layer];
}
function mlBestHTML(d) {
  const cv = d.cargo, list = cv.list.slice(0, mlCfg().bestN); if (cv.state !== 'loaded' || !list.length) return '';
  return `<div class="card mlbest" id="mlbest"><h2>أفضل وجهات لحمولة ${mlCarName(cv.ac)} (${esc(mlHeldTxt(cv.held))})</h2>${list.map((x, i) => `<button type="button" class="mlrow${ML.selCity === x.city ? ' on' : ''}" data-act="mlrow" data-c="${x.city}" aria-pressed="${ML.selCity === x.city}"><span class="mlrk">${i + 1}</span><span class="mln">${esc(cityName(x.city))}<small>${dayAr(x.days)} · ${fmt(Math.round(x.perDay))} في اليوم${x.mission ? ' · تُكمل مهمتك الأسبوعية' : ''}</small></span><b class="mlp">${mlSgn(Math.round(x.profit))}</b></button>`).join('')}<div class="sub" style="margin:6px 0 0">مرتّبة بالربح في اليوم لا بالربح وحده، بعد المكوس والأجور والخطر المتوقع. الضغط يحدّد المدينة على الخريطة ويفتح بطاقتها.</div></div>`;
}
function screenMapLive() {
  const cr = main(); let h = '';
  if (ML.selCity && !(dsh.domain === 'fold:mapcity')) { ML.selCity = null; ML.selCar = null; } // أُغلقت البطاقة (✕ أو Esc أو الخلفية): يزول التحديد
  const g = guideHTML(); if (g) h += `<div style="margin-bottom:12px">${g}</div>`;
  if (cr.left > 0) h += `<div class="card jcard" style="margin-bottom:12px"><div class="row" style="margin:0"><b>${cr.sea ? '🚢' : '🐪'} ${cr.sea ? 'تُبحر' : 'في الطريق'} إلى ${cityTag(cr.dest)}</b><span class="muted">باقٍ ${cr.left} من ${dayAr(cr.total)}</span><span class="spacer"></span>${speed ? '' : '<button class="pri" data-act="play">▶ شغّل الوقت</button>'}</div>${bar(cr.total - cr.left, cr.total, 'gold')}${cr.pace ? `<div class="small muted" style="margin-top:6px">زمن الرحلة الفعلي نحو ${cr.pace.sec} ثانية${cr.pace.lv ? ' بمؤن السفر (' + E.PACE.lv[cr.pace.lv].name + ')' : ''}</div>` : ''}${ambNow ? `<div class="small ambline" style="margin-top:6px">${ambNow.rumor ? '<b>شائعة السوق:</b> ' : ''}${esc(ambNow.t)}</div>` : ''}</div>`;
  const d = mlCompute(), layer = mlLayer(), half = E.mapHalf(S);
  h += `<div class="mlpage"><h1>الخريطة</h1><div class="sub" id="mlsub">اليوم ${S.day} · ${half ? 'صيف' : 'شتاء'} · ${mlStateLine(d)}</div>`;
  h += `<div class="mlchips" role="group" aria-label="طبقات الخريطة">${MLAYERS.map(([k, t, ic]) => `<button type="button" class="mlchip${k === layer ? ' on' : ''}" aria-pressed="${k === layer}" data-act="mlayer" data-l="${k}">${mlIm(ic, 20)}${t}</button>`).join('')}</div>`;
  h += `<div class="mlsum" id="mlsum" aria-live="polite">${mlSummary(d, layer)}</div>`;
  h += `<div id="vp" class="mlvp" tabindex="0" aria-label="لوحة الخريطة"><div class="mlzb"><button type="button" data-act="mlzin" aria-label="تكبير">+</button><button type="button" data-act="mlzout" aria-label="تصغير">−</button><button type="button" data-act="mlzme" aria-label="إلى قافلتي">${mlIm('map/caravan', 24)}</button><button type="button" data-act="mlzall" aria-label="كل العالم">${mlIm('map/compass', 24)}</button></div><div class="mlscl" id="mlscl"></div><svg id="mlsv" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="خريطة الدروب"></svg></div>`;
  h += `<div class="mlleg" id="mlleg">${mlLegend(layer)}</div>${mlBestHTML(d)}</div>`;
  h += `<div class="mlpanel" id="mlpanel">${cityPanel()}${idEyeHTML()}</div>`;
  return h;
}

/* ===== التحويل ===== */
const mlFit = () => Math.max(ML.W / mlCfg().BW, ML.H / mlCfg().BH) * 0.999, mlMin = () => ML.W / mlCfg().BW;
const mlCl = (v, big, view) => big < view ? (big - view) / 2 : Math.min(big - view, Math.max(0, v));
function mlClamp() { const C = mlCfg(); ML.s = Math.min(C.maxS, Math.max(mlMin(), ML.s)); ML.tx = mlCl(ML.tx, C.BW * ML.s, ML.W); ML.ty = mlCl(ML.ty, C.BH * ML.s, ML.H); }
function mlCenter(x, y, ns) { if (ns) ML.s = ns; ML.tx = x * ML.s - ML.W / 2; ML.ty = y * ML.s - ML.H / 2; mlClamp(); mlDraw(); }
function mlZoomAt(px, py, f) { const bx = (px + ML.tx) / ML.s, by = (py + ML.ty) / ML.s; ML.s *= f; ML.s = Math.min(mlCfg().maxS, Math.max(mlMin(), ML.s)); ML.tx = bx * ML.s - px; ML.ty = by * ML.s - py; mlClamp(); mlDraw(); }
const mlX = x => x * ML.s - ML.tx, mlY = y => y * ML.s - ML.ty;
function mlSmooth(pts) {
  const q = pts.map(([x, y]) => [mlX(x), mlY(y)]), f = v => v.toFixed(1); if (q.length < 3) return 'M' + q.map(p => f(p[0]) + ' ' + f(p[1])).join('L');
  let d = `M${f(q[0][0])} ${f(q[0][1])}`; for (let i = 0; i < q.length - 1; i++) { const p0 = q[i - 1] || q[i], p1 = q[i], p2 = q[i + 1], p3 = q[i + 2] || p2;
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; } return d;
}
/* ===== الرسم ===== */
function mlPinStyle(id, d, layer) {
  if (layer === 'cargo') { const cv = d.cargo, x = cv.per[id]; if (cv.state !== 'loaded' || !x || !(x.profit > 0)) return ['#9aa4ae', '']; return [cv.best && cv.best.city === id ? '#b88a2a' : '#2f7d4f', mlSgn(Math.round(x.profit))]; }
  if (layer === 'own') { const o = d.own.per[id]; return o ? [o.bad ? '#a8402f' : '#2c5b86', String(o.n)] : ['#9aa4ae', '']; }
  if (layer === 'riv') { const r = d.riv.per[id]; return r ? ['#7a3e8e', r.strName] : ['#9aa4ae', '']; }
  return ['#e9dcb4', ''];
}
function mlClusters(sel) { const pin = ML.guide;
  const ids = S.order.slice().sort((a, b) => E.BOARD_XY[b][2] - E.BOARD_XY[a][2]), out = [], clus = mlCfg().clus;
  ids.forEach(id => { const [x, y] = E.BOARD_XY[id].slice(0, 2).map((v, i) => v * (i ? mlCfg().BH : mlCfg().BW)); const g = out.find(c => Math.hypot(mlX(c.x) - mlX(x), mlY(c.y) - mlY(y)) < clus); if (g && id !== sel && id !== pin) g.m.push(id); else out.push({ x, y, m: [id] }); });
  return out;
}
const mlNm = id => esc(cityName(id));
function mlRoadsSVG(d, layer, far) {
  const riskL = layer === 'risk'; let h = '';
  const trips = ML.cars.filter(c => c.mine && c.moving).map(c => c.path);
  const one = (pts, col, w, dash) => { const p = mlSmooth(pts), da = dash ? ` stroke-dasharray="${dash}"` : ''; return `<path d="${p}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="${w + 2}" stroke-linecap="round"${da}/><path d="${p}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${da}/>`; };
  d.risk.land.forEach(e => { h += riskL ? one(e.path, e.color, e.w) : one(e.path, 'rgba(255,246,220,.55)', 1.6); });
  d.risk.sea.forEach(e => { h += riskL ? one(e.path, e.color, e.w, '5 5') : one(e.path, 'rgba(255,246,220,.55)', 1.6, '5 5'); });
  if (riskL) d.risk.pm.forEach(e => { h += one(e.path, '#e0b54a', 2.4); });
  trips.forEach(p => { h += one(p, '#ffd56b', 4); });
  if (riskL && !far) {
    d.risk.shocks.forEach(s => { const x = mlX(s.at[0]), y = mlY(s.at[1]); h += `<circle cx="${x}" cy="${y}" r="17" fill="rgba(168,64,47,.85)" stroke="#fff" stroke-width="1.5"/>${ART[s.icon] ? `<image href="${ART[s.icon]}" x="${x - 15}" y="${y - 15}" width="30" height="30"/>` : ''}`; });
    const w = d.risk.wind; if (w) { const x = mlX(w.at[0]), y = mlY(w.at[1]); h += `<g transform="translate(${x} ${y}) rotate(${w.rot})"><path d="M-60 0 L40 0" stroke="#fff6dc" stroke-width="6" stroke-linecap="round"/><path d="M30 -14 L58 0 L30 14 Z" fill="#fff6dc"/></g><text x="${x}" y="${y + 30}" text-anchor="middle" font-size="12" fill="#fff6dc" stroke="rgba(0,0,0,.5)" stroke-width="3" paint-order="stroke" font-weight="700">${esc(w.text)}</text>`; }
  }
  return h;
}
function mlCitiesSVG(d, layer, far) {
  const W = ML.W, H = ML.H, fs = far ? 0 : 12.5, sel = ML.selCity; let h = '';
  mlClusters(sel).forEach(g => {
    const x = mlX(g.x), y = mlY(g.y); if (x < -40 || y < -40 || x > W + 40 || y > H + 40) return;
    if (g.m.length > 1) {
      const any = g.m.map(id => mlPinStyle(id, d, layer)).find(p => p[1]);
      h += `<g data-z="${g.x},${g.y}" tabindex="0" role="button" aria-label="${esc(g.m.map(id => cityName(id)).join(' و'))}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="22" fill="transparent"/><circle cx="${x}" cy="${y}" r="15" fill="rgba(29,43,58,.82)" stroke="${any ? any[0] : '#e9dcb4'}" stroke-width="2.5"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">${g.m.length}</text>${fs ? `<text x="${x}" y="${y + 30}" text-anchor="middle" font-size="${fs}" fill="#fff8e6" stroke="rgba(20,30,40,.75)" stroke-width="3.5" paint-order="stroke">${g.m.map(id => esc(cityName(id).split(' ')[0])).join(' · ')}</text>` : ''}</g>`; return;
    }
    const id = g.m[0], [col, badge] = mlPinStyle(id, d, layer), r = 6 + E.BOARD_XY[id][2] * 2.5, on = sel === id;
    h += `<g data-c="${id}" tabindex="0" role="button" aria-label="${esc(cityName(id))}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="22" fill="transparent"/>${on ? `<circle cx="${x}" cy="${y}" r="${r + 7}" fill="none" stroke="#ffd56b" stroke-width="3"><animate attributeName="r" values="${r + 5};${r + 10};${r + 5}" dur="1.6s" repeatCount="indefinite"/></circle>` : ''}<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" stroke="#fff8e6" stroke-width="2"/>`;
    if (fs) h += `<text x="${x}" y="${y + r + 15}" text-anchor="middle" font-size="${fs}" font-weight="${on ? 700 : 500}" fill="#fff8e6" stroke="rgba(20,30,40,.75)" stroke-width="3.5" paint-order="stroke">${mlNm(id)}</text>`;
    if (badge) { const bw = badge.length * 7 + 14; h += `<rect x="${x + r - 2}" y="${y - r - 16}" width="${bw}" height="19" rx="9.5" fill="${col}" stroke="#fff" stroke-width="1"/><text x="${x + r - 2 + bw / 2}" y="${y - r - 2.5}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#fff">${esc(badge)}</text>`; }
    const o = d.own.per[id]; if (layer === 'own' && o && o.icon && ART[o.icon]) h += `<image href="${ART[o.icon]}" x="${x - r - 24}" y="${y - 12}" width="24" height="24"/>`;
    h += '</g>';
  });
  return h;
}
function mlCarsSVG() {
  const layer = mlLayer(); let h = '';
  ML.cars.forEach(c => {
    if (c.agent) { const p = ML.shown[c.key] || c.pos; h += `<circle cx="${mlX(p[0])}" cy="${mlY(p[1])}" r="2.6" fill="#6d6757"/>`; return; }
    let x, y, flip = false; const standing = !c.moving;
    if (standing) { const bp = E.BOARD_XY[c.city]; if (!bp) return; x = mlX(bp[0] * mlCfg().BW) + 14 + (c.main ? 0 : 6 * (c.id % 7)); y = mlY(bp[1] * mlCfg().BH) - 12; }
    else { const p = ML.shown[c.key] || c.pos; x = mlX(p[0]); y = mlY(p[1]); flip = !!p[2]; }
    const z = c.mine ? 34 : 26, op = c.mine ? 1 : (layer === 'riv' ? 1 : 0.55), art = c.mine && c.sea ? (ART['map/ship_' + (c.type || 'dhow') + '_map'] || ART['map/ship_dhow_map']) : ART['map/caravan'], on = ML.selCar === c.key;
    h += `<g data-k="${c.key}" tabindex="0" role="button" aria-label="${esc(c.name || '')}" style="cursor:pointer" opacity="${op}"><circle cx="${x}" cy="${y}" r="${Math.max(22, z * 0.7)}" fill="transparent"/><ellipse cx="${x}" cy="${y + z * 0.36}" rx="${z * 0.42}" ry="${z * 0.13}" fill="rgba(0,0,0,.35)"/>${c.mine ? '' : `<circle cx="${x}" cy="${y}" r="${z * 0.55}" fill="none" stroke="#c9a0d6" stroke-width="2"/>`}${on ? `<circle cx="${x}" cy="${y}" r="${z * 0.7}" fill="none" stroke="#ffd56b" stroke-width="2.5"/>` : ''}${art ? `<image href="${art}" x="${-z / 2}" y="${-z / 2}" width="${z}" height="${z}" transform="translate(${x} ${y}) scale(${flip ? -1 : 1} 1)"/>` : ''}${standing && c.main ? `<circle cx="${x}" cy="${y}" r="${z * 0.62}" fill="none" stroke="#ffd56b" stroke-width="2" opacity=".8"><animate attributeName="opacity" values=".9;.15;.9" dur="1.8s" repeatCount="indefinite"/></circle>` : ''}</g>`;
  });
  return h;
}
function mlDraw() {
  const sv = $('mlsv'); if (!sv || !ML.data) return; const d = ML.data, layer = mlLayer(), C = mlCfg(), fit = mlFit(), far = ML.s < fit * 0.8, frameOp = Math.max(0, Math.min(1, 1 - (ML.s / fit - 1) * 1.5));
  const img = (k, op) => ART[k] ? `<image href="${ART[k]}" x="${-ML.tx}" y="${-ML.ty}" width="${C.BW * ML.s}" height="${C.BH * ML.s}" preserveAspectRatio="none"${op != null ? ` opacity="${op.toFixed(2)}" pointer-events="none"` : ' pointer-events="none"'}/>` : '';
  sv.innerHTML = img('map/board') + mlRoadsSVG(d, layer, far) + mlCitiesSVG(d, layer, far) + `<g id="mlcars">${mlCarsSVG()}</g>` + img('map/frame', frameOp);
  if (ML.guide) { const g = sv.querySelector(`[data-c="${ML.guide}"]`); if (g) g.classList.add('tut-hl'); }
  const sc = $('mlscl'); if (sc) sc.textContent = ML.s <= mlMin() * 1.02 ? 'كل العالم' : 'تكبير ×' + (ML.s / mlMin()).toFixed(1);
  if (ML.focusId) { const e = sv.querySelector(`[data-c="${ML.focusId}"],[data-k="${ML.focusId}"]`); if (e && document.activeElement !== e) try { e.focus({ preventScroll: true }); } catch (x) {} }
}
/* دليل المهمة (م1 «سافر إلى X»): يُظهر دبوس الوجهة خارج التجميع وداخل النافذة ويُضيئه */
function mlReach(id) {
  const C = mlCfg(), p = E.BOARD_XY[id]; if (!p || !ML.W) return false; const x = p[0] * C.BW, y = p[1] * C.BH, sx = mlX(x), sy = mlY(y); ML.guide = null;
  const out = sx < 40 || sx > ML.W - 40 || sy < 40 || sy > ML.H - 40, clus = mlClusters(null).some(g => g.m.length > 1 && g.m.includes(id)); ML.guide = id;
  if (!out && !clus) return false;
  ML.s = Math.max(ML.s, mlFit() * 1.5); ML.tx = x * ML.s - ML.W / 2; ML.ty = y * ML.s - ML.H / 2; mlClamp(); return true;
}
function mlDrawCars() { const g = $('mlcars'); if (g) g.innerHTML = mlCarsSVG(); }
/* ===== حركة القوافل بين يومين (تُحترم الحركة المخفَّضة) ===== */
function mlGlide() {
  const cancel = () => { if (ML.anim) { cancelAnimationFrame(ML.anim.raf); ML.anim = null; } };
  cancel(); const tgt = {}, from = {}; let moving = false;
  ML.cars.forEach(c => { if (!c.moving) { delete ML.shown[c.key]; return; } tgt[c.key] = c.pos; const p = ML.shown[c.key]; if (p && Math.hypot(p[0] - c.pos[0], p[1] - c.pos[1]) > 0.5) { from[c.key] = p.slice(); moving = true; } else ML.shown[c.key] = c.pos.slice(); });
  Object.keys(ML.shown).forEach(k => { if (!tgt[k]) delete ML.shown[k]; });
  if (!moving || mlReduce()) { Object.keys(tgt).forEach(k => { ML.shown[k] = tgt[k].slice(); }); return; }
  const ms = (typeof glideMs === 'function' && glideMs()) || 400, t0 = performance.now(), step = now => {
    const p = Math.min(1, (now - t0) / ms); Object.keys(from).forEach(k => { const a = from[k], b = tgt[k]; ML.shown[k] = [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, b[2]]; });
    if (!$('mlcars')) { ML.anim = null; return; } mlDrawCars(); if (p < 1) ML.anim.raf = requestAnimationFrame(step); else ML.anim = null;
  };
  Object.keys(from).forEach(k => { ML.shown[k] = from[k]; }); ML.anim = { raf: requestAnimationFrame(step) };
}
/* ===== الفتح والتركيب بعد كل رسم ===== */
function mlAcPos() {
  const ac = ML.data.cargo.ac, me = ML.cars.find(c => c.id === ac.id && c.mine);
  if (me && me.moving) return (ML.shown[me.key] || me.pos).slice(0, 2); return E.BOARD_XY[ac.city] ? [E.BOARD_XY[ac.city][0] * mlCfg().BW, E.BOARD_XY[ac.city][1] * mlCfg().BH] : [mlCfg().BW / 2, mlCfg().BH / 2];
}
function mlMount() {
  const vp = $('vp'); if (!vp || !ML.data) return; ML.W = vp.clientWidth; ML.H = vp.clientHeight; if (!ML.W || !ML.H) return;
  mlGlide();
  const first = !ML.s, C = mlCfg(), pd = ML.pend;
  if (first) {
    ML.s = mlFit() * 1.5; let cx, cy;
    if (pd && pd.risk) { cx = pd.risk[0]; cy = pd.risk[1]; }
    else if (pd && pd.city && E.BOARD_XY[pd.city]) { cx = E.BOARD_XY[pd.city][0] * C.BW; cy = E.BOARD_XY[pd.city][1] * C.BH; }
    else { const m = mlAcPos(); cx = m[0] + 150; cy = m[1] + 40; }
    ML.tx = cx * ML.s - ML.W / 2; ML.ty = cy * ML.s - ML.H / 2;
  }
  ML.pend = null;
  if (ML.follow) { const c = ML.cars.find(x => x.key === ML.follow && x.moving); if (c) { const p = ML.shown[c.key] || c.pos; ML.tx = p[0] * ML.s - ML.W / 2; ML.ty = p[1] * ML.s - ML.H / 2; } else ML.follow = null; }
  mlClamp(); mlDraw(); mlBind(vp);
  if (first) setTimeout(() => { const n = document.querySelector('.tut-hl'); if (n && screen === 'map') spotScroll(n); }, 60); // go() يعيد التمرير إلى الأعلى بعد الرسم: يُعاد تمرير هدف دليل المهمة إلى الشاشة
}
/* يُستدعى بعد كل renderAll: يركّب الخريطة إن كانت الشاشة خريطة، وإلا يصفّر العرض فيُفتح على القافلة عند العودة */
function mlTick() { if (screen === 'map' && mlOn()) mlMount(); else { ML.s = 0; ML.follow = null; ML.guide = null; if (ML.anim) { cancelAnimationFrame(ML.anim.raf); ML.anim = null; } } }
/* ===== اللمس والعجلة ولوحة المفاتيح ===== */
function mlLoc(vp, e) { const b = vp.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }
function mlBind(vp) {
  const C = mlCfg(); ML.pt = new Map(); ML.pinch = null; ML.moved = 0;
  vp.addEventListener('pointerdown', e => { if (e.target.closest('.mlzb')) return; ML.pt.set(e.pointerId, mlLoc(vp, e)); if (ML.pt.size === 1) ML.moved = 0; if (ML.pt.size === 2) { const [a, b] = [...ML.pt.values()]; ML.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1 }; } });
  vp.addEventListener('pointermove', e => {
    if (!ML.pt.has(e.pointerId)) return; const p = mlLoc(vp, e), o = ML.pt.get(e.pointerId); ML.pt.set(e.pointerId, p);
    if (ML.pt.size === 2 && ML.pinch) { const [a, b] = [...ML.pt.values()], dd = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; mlZoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, dd / ML.pinch.d); ML.pinch.d = dd; ML.moved = 99; return; }
    ML.moved += Math.abs(p[0] - o[0]) + Math.abs(p[1] - o[1]);
    if (ML.moved > C.tap) { try { vp.setPointerCapture(e.pointerId); } catch (x) {} ML.follow = null; ML.tx -= p[0] - o[0]; ML.ty -= p[1] - o[1]; mlClamp(); mlDraw(); }
  });
  const up = e => {
    const was = ML.pt.size; ML.pt.delete(e.pointerId); if (ML.pt.size < 2) ML.pinch = null;
    if (was === 1 && ML.moved <= C.tap && e.type === 'pointerup' && !e.target.closest('.mlzb')) mlTap(e);
  };
  vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
  vp.addEventListener('wheel', e => { e.preventDefault(); const [x, y] = mlLoc(vp, e); mlZoomAt(x, y, e.deltaY < 0 ? C.wheel : 1 / C.wheel); }, { passive: false });
  vp.addEventListener('focusin', e => { const t = e.target.closest && e.target.closest('[data-c],[data-k]'); ML.focusId = t ? (t.dataset.c || t.dataset.k) : null; });
  vp.addEventListener('keydown', e => {
    const k = e.key, st = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] }[k];
    if (st) { e.preventDefault(); ML.tx += st[0]; ML.ty += st[1]; ML.follow = null; mlClamp(); mlDraw(); }
    else if (k === '+' || k === '=') { e.preventDefault(); mlZoomAt(ML.W / 2, ML.H / 2, C.btn); } else if (k === '-' || k === '_') { e.preventDefault(); mlZoomAt(ML.W / 2, ML.H / 2, 1 / C.btn); }
    else if (k === 'Enter') { const t = e.target.closest && e.target.closest('[data-c],[data-k],[data-z]'); if (t) { e.preventDefault(); mlActivate(t); } }
  });
}
function mlTap(e) { const el = document.elementFromPoint(e.clientX, e.clientY), t = el && el.closest && el.closest('[data-c],[data-k],[data-z]'); if (t) mlActivate(t); }
function mlActivate(t) {
  if (t.dataset.c) return mlOpenCity(t.dataset.c);
  if (t.dataset.k) return mlOpenCar(t.dataset.k);
  const [x, y] = t.dataset.z.split(',').map(Number); ML.follow = null; mlCenter(x, y, Math.min(mlCfg().maxS, Math.max(ML.s * 2.4, mlFit() * 3)));
}
/* ===== البطاقات (dsheet عبر النافذة السفلية القائمة من 037/051) ===== */
function mlSheet() {
  dsh.folds.mapcity = { sum: '<b>' + esc(ML.selCar ? 'القافلة' : ML.selCity ? cityName(ML.selCity) : 'الخريطة') + '</b>', body: mlSheetBody, def: false };
  if (dsh.domain !== 'fold:mapcity') dOpen('fold:mapcity'); else dRender();
}
function mlOpenCity(id, opts) {
  if (!S.cities[id]) return; opts = opts || {};
  ML.selCity = id; ML.selCar = null; ML.follow = null; sel = id; if (S.tut && screen === 'map') S.tut.f.picked = sel;
  if (!opts.noDraw && ML.W) { const [x, y] = E.BOARD_XY[id].slice(0, 2).map((v, i) => v * (i ? mlCfg().BH : mlCfg().BW)), sx = mlX(x), sy = mlY(y); if (sx < 30 || sx > ML.W - 30 || sy < 30 || sy > ML.H * 0.55) { ML.tx = x * ML.s - ML.W / 2; ML.ty = (y + 0.15 * ML.H / ML.s) * ML.s - ML.H / 2; mlClamp(); } }
  mlSheet(); if (!opts.noRender) renderAll(true);
}
function mlOpenCar(key) { ML.selCar = key; ML.selCity = null; mlSheet(); renderAll(true); }
function mlCityCard(id) {
  const v = E.mapCityView(S, id), c = S.cities[id], ac = v.ac, cv = ML.data ? ML.data.cargo : E.mapCargoView(S), x = v.cargo, ct = CD[c.country];
  const held = cv.held.length ? mlHeldTxt(cv.held) : 'حمولتك';
  const k4 = [
    `<div>ربح حمولتك (${esc(held)})<b class="${x && x.profit > 0 ? 'up' : x ? 'down' : ''}">${cv.state !== 'loaded' || v.here ? '—' : x ? mlSgn(Math.round(x.profit)) : 'لا طلب'}</b></div>`,
    `<div>المدة من ${esc(cityName(ac.city))}<b>${v.here ? 'أنت هنا' : x ? dayAr(x.days) : ac.left === 0 ? dayAr(E.tripDays(S, ac, ac.city, id)) : '—'}</b></div>`,
    `<div>خطر الطريق<b class="${v.risk === 2 ? 'down' : v.risk === 1 ? 'warn' : ''}">${v.riskName || '—'}</b></div>`,
    `<div>في اليوم<b>${x && x.profit > 0 ? fmt(Math.round(x.perDay)) : '—'}</b></div>`].join('');
  const o = v.own, rv = v.riv;
  let h = `<div class="mlcard"><div class="mlch">${ART['map/forts/' + c.country] ? `<img src="${ART['map/forts/' + c.country]}" alt="" width="34" height="34">` : ''}<b>${esc(c.name)}</b><small class="muted">${esc(ct.name)}</small></div><div class="mlkv">${k4}</div>`;
  h += `<div class="mlln"><b>أملاكك:</b> ${o ? esc(o.desc) + ` · صافي الشهر <span class="${o.net >= 0 ? 'up' : 'down'}">${mlSgn(Math.round(o.net))}</span>` : 'لا شيء بعد'}</div>`;
  h += `<div class="mlln"><b>المنافس الأقوى:</b> ${rv ? `${esc(rv.name)} (${esc(rv.strName)}) · ${esc(rv.effect)}` : 'لا منافس مؤثر'}</div>`;
  h += `<div class="mlln"><b>اشترِ منها للعودة:</b> ${v.back.length ? esc(v.back.map(b => GD[b.g].name).join('، ')) + ` (ربح ≈ ${fmt(Math.round(v.back.reduce((a, b) => a + b.profit, 0)))} في ${esc(cityName(ac.city))})` : '—'}</div>`;
  const sentHere = ML.sent && ML.sent.to === id && ac.left > 0 && ac.dest === id;
  if (ac.left === 0 && !v.here) {
    const lk = lockNote(id);
    if (lk) h += lk; else if (sentHere) h += `<button type="button" class="mlgo" disabled>✓ أُرسلت ${mlCarName(ac)}</button>`;
    else h += `<button type="button" class="mlgo${x && x.profit > 0 ? '' : ' ghost'}" data-act="${ac.main ? 'go' : 'mlgo'}" data-to="${id}">سافر إليها بـ${mlCarName(ac)}</button>`;
  } else if (sentHere) h += `<button type="button" class="mlgo" disabled>✓ أُرسلت ${mlCarName(ac)}</button>`;
  h += `<div class="mltwo">${v.here ? '<button type="button" class="mlgo ghost" data-go="market">افتح السوق</button>' : '<button type="button" class="mlgo ghost" data-act="mlcity">افتح السوق</button>'}${cv.list.length ? '<button type="button" class="mlgo ghost" data-act="mlcmp">قارن بأفضل سوق</button>' : ''}</div></div>`;
  return h;
}
function mlCarCard(key) {
  const c = ML.cars.find(x => x.key === key); if (!c) return '<div class="mlcard">لم تعد القافلة على الخريطة.</div>';
  const art = c.mine && c.sea ? (ART['map/ship_' + (c.type || 'dhow') + '_map'] || ART['map/ship_dhow_map']) : ART['map/caravan'];
  const where = c.moving ? 'على الطريق ' + esc(cityName(c.from)) + ' ← ' + esc(cityName(c.dest)) : 'واقفة في ' + esc(cityName(c.city));
  let h = `<div class="mlcard"><div class="mlch">${art ? `<img src="${art}" alt="" width="34" height="34">` : ''}<b>${mlCarName(c)}</b></div><div class="sub">${c.mine ? 'قافلتك' : 'منافس'} · ${where}</div>`;
  if (c.mine) {
    let ln = c.cargo.length ? mlHeldTxt(c.cargo) : 'فارغة'; if (c.moving) ln += ` · تصل اليوم ${S.day + c.left}`;
    if (c.moving && c.sea) { const m = E.monsoonOf(S, c.from, c.dest); if (m && m.dir !== 'calm') ln += ' · ' + (m.fair ? 'الريح معك' : 'الريح ضدك'); }
    h += `<div class="mlln"><b>الحمولة:</b> ${esc(ln)}</div>${c.moving ? '<button type="button" class="mlgo ghost" data-act="mlfollow">تابعها</button>' : '<button type="button" class="mlgo" data-act="mlcmp">اختر وجهة (أفضل 3 تحت الخريطة)</button>'}`;
  } else h += `<div class="mlln"><b>الحمولة:</b> ${esc(c.name)} · ${fmt(c.cargo.reduce((a, g) => a + g.q, 0))} وحدة</div><button type="button" class="mlgo ghost" data-act="mlrivals">افتح بطاقة المنافس</button>`;
  return h + '</div>';
}
function mlSheetBody() { return ML.selCar ? mlCarCard(ML.selCar) : ML.selCity ? mlCityCard(ML.selCity) : ''; }
/* ===== الأفعال (تُستدعى من 16-events.js) ===== */
function mlAct(d) {
  switch (d.act) {
    case 'mlayer': mlSetLayer(d.l); return renderAll(true);
    case 'mlzin': return mlZoomAt(ML.W / 2, ML.H / 2, mlCfg().btn);
    case 'mlzout': return mlZoomAt(ML.W / 2, ML.H / 2, 1 / mlCfg().btn);
    case 'mlzme': { const p = mlAcPos(); ML.follow = null; return mlCenter(p[0], p[1], Math.max(ML.s, mlFit() * 2.2)); }
    case 'mlzall': ML.s = mlMin(); ML.follow = null; mlClamp(); return mlDraw();
    case 'mlrow': { const v = $('vp'); if (v && v.scrollIntoView) try { v.scrollIntoView({ behavior: mlReduce() ? 'auto' : 'smooth', block: 'start' }); } catch (e) {} return mlOpenCity(d.c); }
    case 'mlcmp': case 'mlcity': { dClose(); const t = $(d.act === 'mlcmp' ? 'mlbest' : 'mlpanel') || $('vp'); if (t && t.scrollIntoView) try { t.scrollIntoView({ behavior: mlReduce() ? 'auto' : 'smooth', block: 'center' }); } catch (e) {} return; }
    case 'mlfollow': { const c = ML.cars.find(x => x.key === ML.selCar); if (!c) return; ML.follow = c.key; const p = ML.shown[c.key] || c.pos; dClose(); return mlCenter(p[0], p[1]); }
    case 'mlrivals': dClose(); return go('office');
    case 'mlroad': { const pts = E.boardPath(d.from, d.to, false), m = E.mapAlong(pts, 0.5); tp = null; dg = null; return mlOpenAt(null, 'risk', [m[0], m[1]]); }
    case 'mlgo': { const ac = ML.data.cargo.ac, r = A.travel(S, ac.id, d.to, paceLv); if (r.ok) { paceLv = 0; toast(r.msg); mlAfterGo(d.to, ac.id); setSpeed(speed || 1); } else act(r); return; }
  }
}
/* بعد «سافر إليها»: يُسجَّل المرسَل (متغير واجهة) ويُرسم المسار مظلَّلاً ويُلحق سطر ✓ بالملخص */
function mlAfterGo(to, carId) {
  const car = S.player.caravans.find(c => c.id === carId); if (!car || !(car.left > 0) || car.dest !== to || screen !== 'map' || !mlOn()) return;
  ML.sent = { to, car: carId, day: S.day }; renderAll(true);
}
/* من الرئيسية/تنبيه الطريق: يفتح الخريطة على مدينة (وبطاقتها) أو على طبقة المخاطر موسّطة على منتصف مسار الرحلة */
function mlOpenAt(city, layer, risk) {
  if (layer) mlSetLayer(layer); ML.pend = { city: risk ? null : city, risk: risk || null }; ML.s = 0;
  if (city && !risk) { ML.selCity = city; ML.selCar = null; sel = city; mlSheet(); }
  go('map');
}
