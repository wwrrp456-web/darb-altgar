/* ---------- 036و الخصومات: قائمة في صفحة الزعماء + سطر في بطاقة السوق المتضرر + سطر «حال أعمالي» (مكوّنات 037 وحدها) ---------- */
const fdGoodsTxt = f => f.goods.slice(0, 3).map(g => GD[g].name).join('، ') + (f.goods.length > 3 ? ' وغيرها' : '');
const fdRowOrd = f => `<div class="kv" data-feud="${f.a}-${f.b}"><span>${cityTag(f.a)} ← ${cityTag(f.b)}<br><small class="muted">${esc(E.FEUD_TXT.line(f.ba, f.bb, fdGoodsTxt(f), f.left))}</small></span><b class="num">${f.pct > 0 ? '+' + f.pct + '٪ · ' : ''}${f.left} يوماً</b></div>`;
const fdRow = f => (f.big ? fdBigRow(f) : fdRowOrd(f));
/* 036ز: الخصومة الكبرى: قصتها، أثرها الرقمي، كيف تُحل، وشروط الوساطة بأرقامها (✓/✗)؛ وعهود الصلح المفتوحة بأرقامها */
function fdBigRow(f) {
  const T = E.MED_TXT, g = T.GF[f.k] || {}, mv = E.medView(S), m = mv.list.find(x => x.k === f.k);
  return `<div class="kv" data-feud="${f.a}-${f.b}" data-feud-big="${f.k}"><span><b>${esc(g.title || '')}</b> · ${cityTag(f.a)} ⇄ ${cityTag(f.b)}<br><small class="muted">${esc(g.story || '')}</small><br><small class="muted" data-feud-eff>${esc(T.eff(f.pct, f.aName, f.bName))} السلع: ${esc(fdGoodsTxt(f))}.</small><br><small class="muted">${esc(T.perm)} ${esc(T.how)}</small>${m ? `<br><small data-med-need>${esc(T.need(m.ph, m.ru, m.ta, m.tb, m.na, m.nb, m.gate))}${m.mine ? ' · وساطتك جارية' : ''}</small>` : ''}</span><b class="num">${f.pct > 0 ? '+' + f.pct + '٪' : ''}</b></div>`;
}
const fdPeaceRow = p => { const T = E.MED_TXT; return `<div class="kv" data-peace="${p.k}"><span>${cityTag(p.a)} ⇄ ${cityTag(p.b)}<br><small class="muted">${esc(T.peaceRow(E.bossOf(S, p.a).name + ' و' + E.bossOf(S, p.b).name, p.cust, p.quota))}</small></span><b class="num">−${p.cust}٪ جمارك</b></div>`; };
function feudListHTML() {
  if (!E.GRIEF.on) return ''; const l = E.feudView(S), pc = E.medView(S).peace, big = l.filter(f => f.big), ord = l.filter(f => !f.big);
  return `<section class="card" data-feuds aria-label="الخصومات" style="margin-top:12px"><h2 style="margin-top:0">الخصومات</h2>${E.GRIEF.major.on ? `<p class="small muted" style="margin:0 0 6px">${esc(E.MED_TXT.list)}</p>` : ''}${big.map(fdRow).join('')}${ord.map(fdRow).join('')}${pc.length ? `<h3 class="dsec">عهد الصلح</h3>${pc.map(fdPeaceRow).join('')}` : ''}${l.length ? '' : `<p class="small muted" style="margin:0">${E.FEUD_TXT.none}</p>`}<p class="small muted" style="margin:8px 0 0">${E.FEUD_TXT.help}</p></section>`;
}
function feudPeaceLine(c) { const p = E.medView(S).peace.find(x => x.a === c.id || x.b === c.id); return p ? `<div class="card small" data-peace-line style="margin:10px 0">${dIc("icons/target")} ${esc(E.MED_TXT.peaceRow(E.bossOf(S, p.a === c.id ? p.b : p.a).name, p.cust, p.quota))}</div>` : ''; }
function feudMarketLine(c) {
  const f = E.GRIEF.on ? E.feudAt(S, c.id) : null; if (!f) return feudPeaceLine(c);
  if (f.big) { const T = E.MED_TXT; return `<div class="card small" data-feud-line data-feud-big="${f.k}" style="margin:10px 0">${dIc("icons/target")} <b>${esc((T.GF[f.k] || {}).title || '')}</b>${f.pct > 0 ? ` <b class="num dear">+${f.pct}٪</b>` : ''}<br>${esc(T.eff(f.pct, f.aName, f.bName))} السلع: ${esc(fdGoodsTxt(f))}.<br><span class="muted">${esc(T.perm)} ${esc(T.how)}</span></div>`; }
  return `<div class="card small" data-feud-line style="margin:10px 0">${dIc("icons/target")} ${esc(E.FEUD_TXT.line(f.ba, f.bb, fdGoodsTxt(f), f.left))}${f.pct > 0 ? ` <b class="num dear">+${f.pct}٪</b>` : ''}</div>`;
}
const feudHomeBody = () => E.feudsMine(S).map(fdRow).join('') + hsGoBtn('shops', 'افتح العقارات', E.feudsMine(S)[0].b, true);

/* ---------- 036ز: الوساطة (بطاقات «المطلوب» ونافذة مراحلها) والتزكية، فوق ask وdsheet وdchip وkv ---------- */
const tzUiOn = () => { try { return !!(E.tzOn(S) && DETAILS.on && dLive()); } catch (e) { return false; } };
const medUiOn = () => { try { return !!(E.medOn(S) && DETAILS.on && dLive()); } catch (e) { return false; } };
function medStartCards() {
  if (!medUiOn()) return []; const T = E.MED_TXT;
  return E.medView(S).list.filter(m => m.can).map(m => { const id = 'med:start:' + m.k;
    return { id, w: 84, icon: 'icons/target', title: T.offer(m.na, m.nb), why: T.offerWhy(m.chance, m.ta + ' و' + m.tb), state: 'open', prio: 3, opts: [
      { id: 'go', icon: 'icons/target', title: T.start, effect: T.startEff + ' · فرصة النجاح ' + m.chance + '٪', best: true, act: () => A.medStart(S, m.k) }, dPostpone(id, 30)] }; });
}
function medCancelCard() { const T = E.MED_TXT; return { id: 'med:cancel', icon: 'icons/target', title: T.cancel, why: T.cancelEff, state: 'open', prio: 5, opts: [{ id: 'cancel', icon: 'ui-decline', title: T.cancel, effect: T.cancelEff, act: () => A.medCancel(S) }] }; }
function tzCards(onlyCity) {
  if (!tzUiOn()) return []; const T = E.MED_TXT;
  return E.tzView(S).filter(z => z.can && (!onlyCity || z.city === onlyCity)).map(z => { const id = 'tz:' + z.city;
    return { id, w: 66, icon: 'nav/lords', title: T.tzTitle(z.name), why: T.tzDesc + ' ' + T.tzObl, state: 'open', prio: 4, opts: [
      { id: 'ask', icon: 'nav/lords', title: T.tzAsk, effect: T.tzEff(z.targets), best: true, act: () => A.tazkiya(S, z.city) }, dPostpone(id, 30)] }; });
}
const medAskCards = () => medStartCards().concat(tzCards()).concat(medUiOn() && E.medView(S).active ? [medCancelCard()] : []);
function medBody() {
  const a = E.medView(S).active; if (!a) return ''; const T = E.MED_TXT;
  return `<p class="small muted">${esc(a.title)} · ${esc(a.na)} ⇄ ${esc(a.nb)}</p>` + a.stages.map(s => `<div class="kv" data-med-stage="${s.n}"${s.cur ? ' data-cur="1"' : ''}><span>المرحلة ${s.n} من 4: ${esc(s.t)}<br><small class="muted">${esc(s.x)}</small></span><b class="num">${s.done ? 'تمّت' : s.cur ? 'الآن' : ''}</b></div>`).join('')
    + `<div class="kv" data-med-dest><span>${a.wait ? esc(T.wait(a.wait)) : esc(T.go(a.dest))}${a.st === 2 ? (a.lg ? ' (جواب ' + esc(a.na) + ')' : ' (شروط ' + esc(a.nb) + ')') : ''}</span><b class="num">${a.st + 1}/4</b></div>`
    + `<div class="kv"><span>ثقة ${esc(a.na)} · ثقة ${esc(a.nb)} (يلزم ${a.gate})</span><b class="num">${a.ta} · ${a.tb}</b></div><div class="kv"><span>فرصة النجاح عند الجمع</span><b class="num">${a.chance}٪</b></div>`
    + ask(medCancelCard(), 'med:cancel') + hsGoBtn('map', 'افتح الخريطة', '', true);
}
function tzLordHTML(bs, c) {
  if (!tzUiOn()) return ''; const z = E.tzView(S).find(x => x.city === c.id), T = E.MED_TXT, mn = E.INFLU.tazkiya.min;
  if (!z) return `<div class="small muted" data-tz-line style="margin-bottom:10px"><b>التزكية</b>: ${esc(T.tzDesc)} تُفتح بثقة ${mn} (عندك ${Math.round(bs.trust)}). ${esc(T.tzObl)}</div>`;
  if (z.can) return `<div data-tz-card style="margin-bottom:10px">${ask(tzCards(c.id)[0], 'tz:' + c.id)}</div>`;
  return `<div class="small muted" data-tz-line style="margin-bottom:10px">${esc(z.why)}</div>`;
}
