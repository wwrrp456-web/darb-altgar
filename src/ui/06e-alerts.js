/* ---------- مركز التنبيهات: 🔔 في الشريط العلوي ----------
   كل ما يحتاج تدخلاً (زكاة، دَين، إيجار متأخر، قافلة معطّلة، دكان لا يبيع…) في قائمة واحدة مرتبة بالأهمية، لكل تنبيه زر «اذهب وأصلح» و«لماذا؟» (يفتح التعليمات) و«لاحقاً».
   مصدره التقارير نفسها (مكتب التاجر وتقرير البائع وتقرير الأسطول)، فلا نكرر منطقاً ولا نخترع أسباباً. قراءة فقط. */
const AL_SNOOZE = 3, AL_MIN_LEVEL = 3;
let alertsOpen = false, alSeen = {}, howtoFocus = null;
const alStrip = t => String(t).replace(/<[^>]+>/g, '');
const OFFICE_W = { zakat: 100, debt: 99, defect: 96 };
function alertList(all) {
  if (!S || !S.player || !S.learn || !S.learn.char || NOLEARN || S.learn.level < AL_MIN_LEVEL) return [];
  const out = [], P = S.player, sn = (ui.alsn = ui.alsn || {});
  try { officeCards(true).forEach(c => { if (['trip', 'cargo', 'mission'].includes(c.id)) return; out.push({ id: 'of:' + c.id, ic: c.ic, t: c.t, w: OFFICE_W[c.id] || (/^watch/.test(c.id) ? 40 : 35), btn: c.b, how: c.id === 'zakat' ? null : null }); }); } catch (e) {}
  for (const n of (S.life && S.life.successionNotices || [])) if (!n.read) out.push({id:n.id,ic:'📜',t:esc(n.text),w:20,label:'زُر السوق',generation:true,go:{s:'lords',city:n.city}});
  for(const n of S.climate&&S.climate.notices||[])if(!n.read)out.push({id:n.id,ic:'📜',t:esc('سنة المسيرة '+n.year+' · '+n.text),w:20,btn:['تمت القراءة','climateread'],climate:true});
  Object.keys(P.props).forEach(cid => {
    const pr = P.props[cid], c = S.cities[cid], nm = esc(c.name); if (!pr || !pr.shops.length) return;
    pr.shops.forEach(sh => { if (E.shKind(sh) !== 'own' && sh.arrears) out.push({ id: 'rent:' + cid + ':' + sh.id, ic: '🏪', t: `إيجار ${E.shKind(sh) === 'stall' ? 'بسطتك' : 'دكانك'} في <b>${nm}</b> متأخر ${dayAr(sh.arrears)}. يُخلى المكان عند ${E.EVICT_DAYS} أيام.`, w: sh.arrears >= 3 ? 98 : 80, go: { s: 'estate', city: cid }, how: 'stall' }); });
    const late = (pr.staff || []).filter(w => w.late > 0); if (late.length) out.push({ id: 'wage:' + cid, ic: '👤', t: `أجر ${late.length} عامل في <b>${nm}</b> متأخر: ينخفض أداؤهم ويتركون العمل بعد 5 أيام.`, w: 72, go: { s: 'estate', city: cid }, how: 'staff' });
    if (pr.whs && E.keeperHave(S, cid) < E.keeperNeed(S, cid)) out.push({ id: 'keeper:' + cid, ic: '📦', t: `مخزنك في <b>${nm}</b> بلا أمين: يتناقص مخزونه كل يوم.`, w: 66, go: { s: 'estate', city: cid }, how: 'warehouse' });
    const probs = []; pr.shops.forEach(sh => E.shopReport(S, cid, sh.id).forEach(r => { if (['nobody', 'empty', 'high', 'loss', 'wait'].includes(r.st)) probs.push(r); }));
    if (probs.length) { const f = probs.find(r => r.st === 'nobody') || probs[0]; out.push({ id: 'shop:' + cid, ic: '🏪', t: `دكانك في <b>${nm}</b>: ${f.st === 'nobody' ? esc(f.msg) : esc(GD[f.g].name) + ': ' + esc(f.msg)}${probs.length > 1 ? ' <span class="small muted">(+' + (probs.length - 1) + ' أخرى)</span>' : ''}`, w: f.st === 'nobody' ? 78 : 70, go: { s: 'estate', city: cid }, how: f.st === 'nobody' ? 'staff' : 'shop' }); }
  });
  try { E.fleetReport(S).forEach(r => { if (r.ok) return; const bad = r.lines.find(l => !l.ok), quit = r.lines.find(l => /يترك العمل/.test(l.t)), first = quit || bad || { t: r.status };
    out.push({ id: 'car:' + r.id, ic: '🐪', t: `<b>${esc(r.name)}</b>: ${esc(first.t)}`, w: quit ? 97 : 70, go: { s: 'empire' }, how: 'fleet' }); }); } catch (e) {}
  const now = S.day; const list = out.filter(a => all || !(sn[a.id] != null && sn[a.id] > now));
  return list.sort((a, b) => b.w - a.w);
}
const alSev = a => (a.w >= 96 ? 'crit' : a.w >= 60 ? 'warn' : 'info');
function renderAlerts() {
  const b = $('hAlert'), pn = $('alertPanel'); if (!b || !pn) return;
  const on = !!(S && S.learn && S.learn.char && !NOLEARN && S.learn.level >= AL_MIN_LEVEL);
  b.hidden = !on; if (!on) { pn.hidden = true; return; }
  const list = alertList(false), crit = list.filter(a => alSev(a) === 'crit').length, bd = b.querySelector('.abadge');
  bd.hidden = !list.length; bd.textContent = list.length > 9 ? '9+' : String(list.length); bd.classList.toggle('crit', crit > 0);
  b.setAttribute('aria-label', list.length ? 'التنبيهات: ' + list.length : 'التنبيهات');
  const fresh = list.filter(a => !alSeen[a.id]); if (alSeen.__init && fresh.length) sfx(fresh.some(a => a.w >= 96) ? 'alertHi' : 'alert'); alSeen.__init = 1; fresh.forEach(a => { alSeen[a.id] = 1; if (a.w >= 96) toast('تنبيه: ' + alStrip(a.t)); });
  Object.keys(alSeen).forEach(k => { if (k !== '__init' && !list.some(a => a.id === k)) delete alSeen[k]; });
  const key = JSON.stringify(list.map(a => [a.id, a.t])) + alertsOpen;
  if (pn.dataset.k === key) return; pn.dataset.k = key;
  pn.innerHTML = `<div class="alhead"><b>🔔 تنبيهاتك</b><span class="spacer"></span><button class="sm" data-act="alclose" aria-label="إغلاق">✕</button></div>` + (list.length ? list.map(a => `<div class="alrt ${alSev(a)}"><span class="ic">${a.ic}</span><div class="at">${a.t}</div><div class="ab">${a.go ? `<button class="sm pri" data-act="algo" data-k="${a.id}">${esc(a.label || 'اذهب وأصلح')}</button>` : a.btn ? `<button class="sm pri" data-act="${a.btn[1]}" data-k="${a.id}">${a.btn[0]}</button>` : ''}${a.generation ? `<button class="sm ghost" data-act="algenerationread" data-k="${a.id}">تمت القراءة</button>` : ''}${a.how ? `<button class="sm" data-act="alwhy" data-h="${a.how}">لماذا؟</button>` : ''}<button class="sm ghost" data-act="alsnooze" data-k="${a.id}">لاحقاً</button></div></div>`).join('') : '<div class="small muted" style="padding:10px">لا شيء يحتاج تدخلك الآن. تتابع اللعبة قوافلك ودكاكينك وتخبرك هنا إن تعطّل شيء.</div>');
}
function setAlerts(on) {
  const pn = $('alertPanel'), b = $('hAlert'); if (!pn || !b) return; alertsOpen = !!on; pn.dataset.k = '';
  if (on) { renderAlerts(); const r = b.getBoundingClientRect(), w = Math.min(innerWidth * 0.94, 380); pn.style.top = Math.round(r.bottom + 6) + 'px'; pn.style.left = Math.max(8, Math.min(innerWidth - w - 8, Math.round(r.left + r.width / 2 - w / 2))) + 'px'; }
  pn.hidden = !on; pn.classList.toggle('show', !!on); b.setAttribute('aria-expanded', String(!!on));
}
