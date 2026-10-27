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
  const offer=E.vaultOpportunityQuote(S);if(offer.ok)out.push({id:'vault-opportunity',ic:'💰',t:'فرصة تجارية · '+fmt(offer.cost)+' ريال · مهلة '+offer.days+' أيام',w:80,btn:['راجع الفرصة','vault-offer-open']});
  const vc=E.inCrisis(S);if(vc&&P.vault>0)out.push({id:'vault-crisis',ic:'💰',t:esc(vc.label)+' · احتياطي '+fmt(P.vault)+' ريال',w:95,btn:['اسحب من الحصّالة','vault-crisis']});
  const obligations = dailyObligations(S);
  if (obligations.daily > 0 && obligations.balance < obligations.daily * 7) out.push({ id: 'obligations', ic: '📋', t: `رصيد الريال يكفي <b>${Math.floor(obligations.days)}</b> يوماً من نفقاتك الدورية؛ فاحرص على إبقاء سيولة للأجور والإيجار والصيانة.`, w: 70, label: 'راجع التزاماتي', go: S.phase >= 2 ? { s: 'estate' } : { profile: true }, how: 'payments' });
  try { officeCards(true).forEach(c => { if (['trip', 'cargo', 'mission'].includes(c.id)) return; out.push({ id: 'of:' + c.id, ic: c.ic, t: c.t, w: OFFICE_W[c.id] || (/^watch/.test(c.id) ? 40 : 35), btn: c.b, how: c.id === 'zakat' ? null : null }); }); } catch (e) {}
  for (const n of (S.life && S.life.successionNotices || [])) if (!n.read) out.push({id:n.id,ic:'📜',t:esc(n.text),w:20,label:'زُر السوق',generation:true,go:{s:'lords',city:n.city}});
  for(const n of S.climate&&S.climate.notices||[])if(!n.read)out.push({id:n.id,ic:'📜',t:esc('سنة المسيرة '+n.year+' · '+n.text),w:20,btn:['تمت القراءة','climateread'],climate:true});
  Object.keys(P.props).forEach(cid => {
    const pr = P.props[cid], c = S.cities[cid], nm = esc(c.name); if (!pr || !pr.shops.length) return;
    pr.shops.forEach(sh => { if (E.shKind(sh) !== 'own' && sh.arrears) out.push({ id: 'rent:' + cid + ':' + sh.id, ic: '🏪', t: `إيجار ${E.shKind(sh) === 'stall' ? 'بسطتك' : 'دكانك'} في <b>${nm}</b> متأخر ${dayAr(sh.arrears)}. يُخلى المكان عند ${dayAr(E.EVICT_DAYS)}.`, w: sh.arrears >= 3 ? 98 : 80, go: { s: 'estate', city: cid }, how: 'stall' }); });
    const steward=E.stewardOf(S,cid);if(steward?.work?.day===S.day&&steward.work.blocked)out.push({id:'steward-blocked:'+cid,ic:'📋',t:'أمين '+nm+' يحتاج مراجعة السيولة أو الحد اليومي أو نطاق الإشراف.',w:85,label:'راجع الأمين',go:{s:'estate',city:cid}});
    const asset=E.teamAssets(S,cid)[0];if(!pr.mgr&&asset&&(pr.staff||[]).some(w=>w.days>=E.TEAM.expertDays&&E.promotionQuote(S,cid,w.id,asset.kind,asset.id).ok))out.push({id:'team-ready:'+cid,ic:'👤',t:'عامل خبير في '+nm+' مستوفٍ لشروط الترقية إلى مدير ممتلك.',w:45,label:'راجع هرم فريقي',go:{s:'estate',city:cid}});
    const late = (pr.staff || []).filter(w => w.late > 0); if (late.length) out.push({ id: 'wage:' + cid, ic: '👤', t: `أجر ${late.length} عامل في <b>${nm}</b> متأخر: ينخفض أداؤهم ويتركون العمل بعد 5 أيام.`, w: 72, go: { s: 'estate', city: cid }, how: 'staff' });
    if (pr.whs && E.keeperHave(S, cid) < E.keeperNeed(S, cid)) out.push({ id: 'keeper:' + cid, ic: '📦', t: `مخزنك في <b>${nm}</b> بلا أمين: يتناقص مخزونه كل يوم.`, w: 66, go: { s: 'estate', city: cid }, how: 'warehouse' });
    const probs = []; pr.shops.forEach(sh => E.shopReport(S, cid, sh.id).forEach(r => { if (['nobody', 'empty', 'high', 'loss', 'wait'].includes(r.st)) probs.push(r); }));
    if (probs.length) { const f = probs.find(r => r.st === 'nobody') || probs[0]; out.push({ id: 'shop:' + cid, ic: '🏪', t: `دكانك في <b>${nm}</b>: ${f.st === 'nobody' ? esc(f.msg) : esc(GD[f.g].name) + ': ' + esc(f.msg)}${probs.length > 1 ? ' <span class="small muted">(+' + (probs.length - 1) + ' أخرى)</span>' : ''}`, w: f.st === 'nobody' ? 78 : 70, go: { s: 'estate', city: cid }, how: f.st === 'nobody' ? 'staff' : 'shop' }); }
  });
  try { E.fleetReport(S).forEach(r => { if (r.ok) return; const bad = r.lines.find(l => !l.ok), quit = r.lines.find(l => /يترك العمل/.test(l.t)), first = quit || bad || { t: r.status };
    out.push({ id: 'car:' + r.id, ic: '🐪', t: `<b>${esc(r.name)}</b>: ${esc(first.t)}`, w: quit ? 97 : 70, go: { s: 'empire' }, how: 'fleet' }); }); } catch (e) {}
  facilityReports().filter(r => r.issue).forEach(r => out.push({ id: 'facility:' + r.id, ic: '⚠️', t: esc(r.label + ': ' + r.issue + '. ' + r.next), w: 65, go: r.go, how: r.key }));
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
  const fresh = list.filter(a => !alSeen[a.id]); if (alSeen.__init && fresh.length) { sfx(fresh.some(a => a.w >= 96) ? 'alertHi' : 'alert'); if(fresh.some(a=>a.w>=96))hapticPulse('critical'); } alSeen.__init = 1; fresh.forEach(a => { alSeen[a.id] = 1; if (a.w >= 96) toast('تنبيه: ' + alStrip(a.t)); });
  Object.keys(alSeen).forEach(k => { if (k !== '__init' && !list.some(a => a.id === k)) delete alSeen[k]; });
  const key = JSON.stringify(list.map(a => [a.id, a.t])) + alertsOpen;
  if (pn.dataset.k === key) return; pn.dataset.k = key;
  pn.innerHTML = `<div class="alhead"><b>🔔 تنبيهاتك</b><span class="spacer"></span><button class="sm" data-act="alclose" aria-label="إغلاق">✕</button></div>` + (list.length ? list.map(a => `<div class="alrt ${alSev(a)}"><span class="ic">${a.ic}</span><div class="at">${a.t}</div><div class="ab">${a.go ? `<button class="sm pri" data-act="algo" data-k="${a.id}">${esc(a.label || 'اذهب وأصلح')}</button>` : a.btn ? `<button class="sm pri" data-act="${a.btn[1]}" data-k="${a.id}">${a.btn[0]}</button>` : ''}${a.generation ? `<button class="sm ghost" data-act="algenerationread" data-k="${a.id}">تمت القراءة</button>` : ''}${a.how ? `<button class="sm" data-act="alwhy" data-h="${a.how}">لماذا؟</button>` : ''}<button class="sm ghost" data-act="alsnooze" data-k="${a.id}">لاحقاً</button></div></div>`).join('') : '<div class="small muted" style="padding:10px">لا شيء يحتاج تدخلك الآن. تتابع اللعبة قوافلك ودكاكينك وتخبرك هنا إن تعطّل شيء.</div>');
}
function setAlerts(on) {
  const pn = $('alertPanel'), b = $('hAlert'); if (!pn || !b) return; alertsOpen = !!on; pn.dataset.k = '';
  if (on) { renderAlerts(); const r = anchorRect(b), w = Math.min(innerWidth * 0.94, 380); pn.style.top = Math.round(r.bottom + 6) + 'px'; pn.style.left = Math.max(8, Math.min(innerWidth - w - 8, Math.round(r.left + r.width / 2 - w / 2))) + 'px'; }
  pn.hidden = !on; pn.classList.toggle('show', !!on); b.setAttribute('aria-expanded', String(!!on));
}
