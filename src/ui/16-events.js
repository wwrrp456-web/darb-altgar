/* ---------- الأحداث ---------- */
document.addEventListener('pointerdown', ev => { try { Sound.unlock(); if (ev.target.closest && ev.target.closest('button,[data-act],[data-go]')) Sound.play('click'); } catch (e) {} pressing = true; clearTimeout(document.__pt); document.__pt = setTimeout(() => { pressing = false; }, 1500); });
document.addEventListener('pointercancel', () => { pressing = false; if (dirty) renderAll(false); });
document.addEventListener('input', ev => { if (ev.target && ev.target.id === 'hVol') { try { Sound.setVolume(ev.target.value / 100); } catch (e) {} } });
document.addEventListener('change', ev => {
  const t0 = ev.target; if (t0 && t0.id === 'hVol') { try { Sound.setVolume(t0.value / 100); Sound.unlock(); Sound.play('coin'); } catch (e) {} return; }
  if (t0 && (t0.id === 'dhy' || t0.id === 'dhm' || t0.id === 'dhd')) { stSel[t0.id.slice(1)] = +t0.value; return renderAll(true); }
  if (t0 && t0.id === 'mktCity') { sel = t0.value; dg = null; return renderAll(true); }
  if (t0 && t0.id === 'routeTo') { routeTo = t0.value || null; return renderAll(true); }
  if (t0 && t0.dataset && t0.dataset.cmp) { cmpSel[t0.dataset.cmp] = t0.value; return renderAll(true); }
  if (t0 && t0.id === 'mktSort') { msort = t0.value; ui.msort = msort; saveUi(); return renderAll(true); }
  if (t0 && t0.id === 'mktSub') { msub = t0.value; return renderAll(true); }
  if (t0 && t0.dataset && t0.dataset.fset) { const r = A.setFactory(S, +t0.dataset.i, t0.dataset.fset, t0.value); if (r.ok === false) toast(r.msg); return renderAll(true); }
  if (t0 && t0.dataset && t0.dataset.pair) { const r = A.pairSet(S, t0.dataset.where, t0.dataset.where === 'farm' ? t0.dataset.key : +t0.dataset.key, t0.dataset.f, t0.value); if (r.ok === false) toast(r.msg); return renderAll(true); }
  const i = ev.target; if (!i || !i.classList || !i.classList.contains('qin')) return;
  const mx = +i.dataset.max || 1, v = clampQ(i.value, mx), k = i.dataset.k; if (k === 'm') dq = v; else QS[k] = v; renderAll(true);
});
document.addEventListener('click', ev => {
  pressing = false;
  if (typer && ev.target.closest('.typing')) endTyping();
  if (salemOpen && !ev.target.closest('#salemPanel,#hSalem,.modal,#lesson')) { salemOpen = false; renderAll(true); }
  if (ev.target.closest('.home-brand h1, #hName')) { const now = Date.now(); devTaps = devTaps.filter(x => now - x < 4000); devTaps.push(now); if (devTaps.length >= 7) { devTaps = []; devGate(); } }
  if (resourceOpen && !ev.target.closest('#resourceMenu,.resource-trigger')) closeResourceMenu();
  if (miniOpen && !ev.target.closest('#hdrop,#hmini')) closeMini();
  if (hmenuOpen && !ev.target.closest('#hmenuPanel,#hMenu')) setHmenu(false);
  if (alertsOpen && !ev.target.closest('#alertPanel,#hAlert')) setAlerts(false);
  const t = ev.target.closest('[data-go],[data-city],[data-ct],[data-act],[data-mc],[data-mf],[data-ec],[data-ee],[data-estcity],[data-estcity2],[data-gd],[data-dq],[data-lc],[data-lcity]'); if (!t) { if (ev.target.id === 'modal') { dg = null; tp = null; renderAll(true); return; } if (dirty) renderAll(false); return; }
  const d = t.dataset;
  if (/^dev/.test(d.act || '') && !devMode && d.act !== 'devcheck' && d.act !== 'devcancel') return;
  if (d.act === 'mapzoom') { mapView.zoom = Math.max(1, Math.min(4, mapView.zoom * (+d.d > 0 ? 1.5 : 1/1.5))); return renderAll(true); }
  if (d.act === 'mapreset') { mapView = { zoom: 1, center: null }; return renderAll(true); }
  if (d.act === 'maphere') {
    const cr = main(); sel = cr.left > 0 ? cr.dest : cr.city;
    mapC = cr.left > 0 ? 'all' : S.cities[cr.city].country;
    const a = S.cities[cr.from || cr.city], b = S.cities[cr.dest || cr.city], t = cr.left > 0 ? 1 - cr.left / Math.max(1, cr.total) : 0;
    mapView = { zoom: cr.left > 0 ? 2 : 1, center: cr.left > 0 ? [a.x+(b.x-a.x)*t, a.y+(b.y-a.y)*t] : null };
    return renderAll(true);
  }
  if (d.go) return go(d.go, true);
  if (d.city) return selectCity(d.city);
  if (d.ct) { ct = d.ct; if (S.tut && ct === 'fx') S.tut.f.fx = true; renderAll(true); return scrollToTabs(); }
  if (d.mc) { mapC = d.mc; mapView = { zoom: 1, center: null }; if (mapC !== 'all' && S.cities[sel].country !== mapC) sel = citiesOf(mapC)[0] || sel; return renderAll(true); }
  if (d.mf) { mf = d.mf; msub = 'all'; ui.mf = mf; saveUi(); return renderAll(true); }
  if (d.gd) { if (d.rt) cmpSel.a = d.rt; dg = d.gd; const pl = planOn(), mg = missionGoal(); dq = pl && pl.g === d.gd ? pl.q : mg && mg.k === 'good' && mg.g === d.gd && mg.q ? mg.q : 10; return renderAll(true); }
  if (d.dq) { dq = d.dq; return renderAll(true); }
  if (d.ec) { estC = d.ec; estCity = citiesOf(estC)[0]; return renderAll(true); }
  if (d.ee) { empC = d.ee; estCity = citiesOf(empC)[0]; return renderAll(true); }
  if (d.lc) { lordC = d.lc; lordCity = citiesOf(lordC)[0]; return renderAll(true); }
  if (d.lcity) { lordCity = d.lcity; return renderAll(true); }
  if (d.estcity) { estCity = d.estcity; return renderAll(true); }
  if (d.estcity2) { estCity = d.estcity2; return renderAll(true); }
  const a = d.act, cr = car(), g = d.g, q = +d.q, m = main(); curAct = a;
  switch (a) {
    case 'agent': return act(A.agentBuy(S, sel, g, q));
    case 'qin': return;
    case 'qstep': { const mx = +d.max || 1, k = d.k; const cur = k === 'm' ? (dq === 'max' ? mx : +dq || 1) : (QS[k] == null ? (k.startsWith('d:') ? (deals().find(o => 'd:' + o.g + ':' + o.d === k) || { q: 1 }).q : 1) : QS[k]); const nv = clampQ(cur + (+d.d), mx); if (k === 'm') dq = nv; else QS[k] = nv; return renderAll(true); }
    case 'haggle': return act(A.haggleStart(S, g, d.side, q));
    case 'hgchoose': { const r = A.haggleChoose(S, d.c); if (r.ok && r.done) sfx(r.wins ? 'haggleWin' : 'haggleFail'); else if (r.ok) sfx(r.right ? 'tick' : 'fail'); return act(r.ok ? { msg: r.right ? 'أصبتَ' : 'أخطأتَ. ' + (r.trait || '') } : r); }
    case 'hgclose': return act(A.haggleClose(S));
    case 'buysex': { const r = tradeWithReceipt('buy', g, () => A.buy(S, m.id, g, q, undefined, d.sex)); return act(r); }
    case 'buyherd': return act(A.buy(S, m.id, g, q, 'herd', d.sex || undefined));
    case 'sellherd': return act(A.sell(S, m.id, g, q, 'herd'));
    case 'sellyoung': return act(A.sellYoung(S, m.id, g, q));
    case 'hherder': return act(A.hireHerder(S, cr.id));
    case 'fherder': return act(A.fireHerder(S, cr.id));
    case 'buy': case 'sell': { const mg = missionGoal(), r = tradeWithReceipt(a, g, () => a === 'buy' ? A.buy(S, m.id, g, q) : A.sell(S, m.id, g, q)); if (a === 'buy') buyStumble(g, !!r.ok); act(r); if (r.ok && mg && mg.k === 'good' && mg.side === a) { dg = null; renderAll(true); } return; }
    case 'mjnow': return act(A.mjNow(S));
    case 'defret': return act(A.defectReturn(S));
    case 'defarsh': return act(A.defectArsh(S));
    case 'buypack': { const m = main(); return act(A.buyPack(S, m.id, clampQ(QS.pk == null ? 5 : QS.pk, 99))); }
    case 'buypackmax': { const m = main(); return act(A.buyPack(S, m.id, E.PACE.packMax)); }
    case 'pacelv': paceLv = +d.lv; return renderAll(true);
    case 'go': return travelTo(d.to);
    case 'sail': return sailTo(d.to);
    case 'buyship': return act(A.buyShip(S, d.c, d.t));
    case 'upship': return act(A.upgradeShip(S, +d.s, d.k));
    case 'hiresailor': return act(A.hireSailor(S, +d.s));
    case 'dismisssailor': return act(A.dismissSailor(S, +d.s));
    case 'hirecap': return act(A.hireSeaCaptain(S, +d.s, +d.i));
    case 'firecap': return act(A.fireSeaCaptain(S, +d.s));
    case 'sellship': return act(A.sellShip(S, +d.s));
    case 'roadok': roadRes = null; outPick = {}; if (fgSpeed) { const n = fgSpeed; fgSpeed = 0; if (!S.pause) speed = n; } return renderAll(true);
    case 'play': return setSpeed(1);
    case 'guideoff': guideOff = true; try { localStorage.setItem('darb-guide-off', '1'); } catch (e) {} return renderAll(true);
    case 'mrun': { const st = missionStep(); if (st && st.run) { const was = S.fxFree; S.fxFree = true; try { st.run(); } finally { S.fxFree = was; } } return; } // «نفّذ عنّي»: المساعد يتولى الصرف أيضاً
    case 'mfull': ui.full = !ui.full; return saveUi();
    case 'help': help = true; return renderAll(true);
    case 'sellall': return sellAll();
    case 'dealgo': return dealGo(d.g, d.d, +d.q || 999);
    case 'dealgo2': return dealGo(d.g, d.d, +d.q || 999);
    case 'tproute': if (tp) { tp.route = d.r; } return renderAll(true);
    case 'tpgo': return tp && dealGoNow(tp);
    case 'arropen': { const c = arr && arr.city; arr = null; if (c && S.cities[c]) { sel = c; dg = null; } return go('market'); }
    case 'rcptclose': rcpt = null; return renderReceipt();
    case 'arrsell': { const c = arr && arr.city; arr = null; if (c && S.cities[c]) { sel = c; dg = null; } go('market'); setTimeout(() => { const e = $('mycargo'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80); return; }
    case 'rcptcaravan': rcpt = null; renderReceipt(); return go('caravan');
    case 'rcptlords': rcpt = null; renderReceipt(); return go('lords');
    case 'rcptcargo': { rcpt = null; renderReceipt(); dg = null; renderAll(true); setTimeout(() => { const e = $('mycargo'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80); return; }
    case 'ofcargo': { const c = main().city; sel = c; dg = null; go('market'); setTimeout(() => { const e = $('mycargo'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80); return; }
    case 'ofmap': return go('map');
    case 'ofmarket': { const c = main().city; if (main().left === 0) sel = c; dg = null; return go('market'); }
    case 'ofsalem': return salemSet(true, 'mission');
    case 'ofdefect': { const c = E.defectClaim(S); if (c && S.cities[c.d.city]) { sel = c.d.city; dg = null; } return go('market'); }
    case 'ofwatch': { const w = watchOf()[+d.i]; if (w && S.cities[w.c]) { w.seen = true; sel = w.c; dg = null; return go('market'); } return renderAll(true); }
    case 'wadd': { const v = id => ($(id) || {}).value, th = parseFloat(v('wT')), g = v('wG'), c = v('wC'), dir = v('wD'); if (!(th > 0) || !GD[g] || !S.cities[c]) return toast('اكتب سعراً صحيحاً'); if (watchOf().length >= WATCH_MAX) return toast('وصلت لحد المراقبات'); watchOf().push({ g, c, dir, th, on: false, seen: false }); officeTick(); return renderAll(true); }
    case 'wdel': { const a = watchOf(), i = +d.i; if (a[i]) a.splice(i, 1); return renderAll(true); }
    case 'rqans': { if (rcpt && rcpt.quiz && rcpt.quiz.sel == null) { rcpt.quiz.sel = +d.i; renderReceipt(); } return; }
    case 'rqskip': { if (rcpt) { rcpt.quiz = null; renderReceipt(); } return; }
    case 'goalset': { S.learn.goal = d.k || null; return renderAll(true); }
    case 'goestate': return go('estate');
    case 'gocaravan': return go('caravan');
    case 'favadd': { const v = id => ($(id) || {}).value, f = { from: v('fF'), to: v('fT'), g: v('fG') || null, note: (v('fN') || '').trim().slice(0, 60) }; if (!S.cities[f.from] || !S.cities[f.to] || f.from === f.to) return toast('اختر مدينتين مختلفتين'); if (favsOf().length >= FAV_MAX) return toast('وصلت لحد الطرق'); favsOf().push(f); return renderAll(true); }
    case 'favtoggle': { const i = favIdx(d.from, d.to); if (i >= 0) favsOf().splice(i, 1); else if (S.cities[d.from] && S.cities[d.to] && d.from !== d.to && favsOf().length < FAV_MAX) favsOf().push({ from: d.from, to: d.to, g: null, note: '' }); return renderAll(true); }
    case 'favdel': { const a = favsOf(), i = +d.i; if (a[i]) a.splice(i, 1); return renderAll(true); }
    case 'favopen': { const f = favsOf()[+d.i]; if (!f || !S.cities[f.to]) return toast('الطريق لم يعد صالحاً'); sel = f.to; mapC = 'all'; mapView = { zoom: 1, center: null }; return go('map'); }
    case 'rcptmap': rcpt = null; renderReceipt(); return go('map');
    case 'arrclose': arr = null; return renderAll(true);
    case 'tpcancel': tp = null; return renderAll(true);
    case 'gdclose': dg = null; return renderAll(true);
    case 'openfxneed': { const need = d.cur || 'usd', w = S.player.wallet, rate = c => E.CURS[c] ? w[c] * (c === 'sar' ? 1 : c === 'usd' ? S.fx.usd : c === 'au' ? S.fx.gold : (S.fx.silver || 0)) : 0; const src = ['sar', 'usd', 'au', 'ag'].filter(c => c !== need).sort((a, b) => rate(b) - rate(a))[0]; fxFrom = src; fxTo = need; ct = 'fx'; dg = null; tp = null; return go('cities'); }
    case 'fxauto': S.learn.fxAuto = !S.learn.fxAuto; return renderAll(true);
    case 'openfx': ct = 'fx'; return go('cities');
    case 'resource': return toggleResourceMenu(d.resource);
    case 'resourceclose': return closeResourceMenu(true);
    case 'resourcefx': fxFrom = d.f; fxTo = d.f === 'sar' ? 'usd' : 'sar'; ct = 'fx'; return go('cities');
    case 'navtog': ui.nav = !ui.nav; return saveUi();
    case 'hmenu': setAlerts(false); return setHmenu(!hmenuOpen);
    case 'alerts': setHmenu(false); return setAlerts(!alertsOpen);
    case 'alclose': return setAlerts(false);
    case 'alsnooze': { ui.alsn = ui.alsn || {}; ui.alsn[d.k] = S.day + AL_SNOOZE; saveUi(); renderAlerts(); return; }
    case 'alwhy': { setAlerts(false); howtoFocus = d.h; jtab = 'help'; return salemSet(true, 'journal'); }
    case 'algo': { const a = alertList(true).find(x => x.id === d.k); setAlerts(false); if (!a || !a.go) return; if (a.go.city && a.go.s === 'lords') { lordCity=a.go.city; lordC=S.cities[a.go.city].country; } if (a.go.city) { estCity = a.go.city; estC = S.cities[a.go.city].country; } return go(a.go.s); }
    case 'guide': { try { localStorage.setItem('darb-guide-seen', (window.GUIDE || {}).v || ''); } catch (e) {} setHmenu(false); renderGuideLink(); return; }
    case 'install': return doInstall();
    case 'apopen': return apOpen();
    case 'apclose': { const m = $('apmodal'); if (m) m.hidden = true; return; }
    case 'apgo': { const v = id => ($(id) || {}).value; const m = $('apmodal'); apStart({ mode: v('apMode'), start: v('apStart'), target: v('apTarget'), speed: v('apSpeed'), inject: $('apInject').checked }); if (m) m.hidden = true; return; }
    case 'appause': AP.paused = !AP.paused; apBar(); if (!AP.paused) { clearTimeout(AP.tm); AP.tm = setTimeout(apLoop, 50); } return;
    case 'apstep': { const was = AP.paused; AP.paused = false; apOne(); AP.paused = was; apBar(); return; }
    case 'apspeed': AP.speed = g; apBar(); return;
    case 'apstop': apFinish('أوقفتَه يدوياً', false); return;
    case 'apcopy': { const t = apReport(); try { navigator.clipboard.writeText(t).then(() => toast('نُسخ التقرير'), () => toast('تعذّر النسخ: ' + t.slice(0, 40))); } catch (e) { toast('تعذّر النسخ'); } return; }
    case 'apend': location.reload(); return;
    case 'mhelp': mhelp = helpSig(); return renderAll(true);
    case 'restskip': S.learn.rest = null; E.learnCheck(S); return renderAll(true);
    case 'lstart': { const r = A.chooseStart(S, g); toast(r.msg); return lseq(s => { s.i++; }); }
    case 'lname': { const r = A.setName(S, ($('pname') || {}).value); toast(r.msg); if (r.ok) lseq(q => { q.i++; }); return; }
    case 'lchar': { const r = A.learnSetChar(S, g); if (r.ok !== false && S.day === 0 && !(S.cal && S.cal.set)) { S.learn.datePend = true; stSel = { m: 'today', hy: 0, hm: 1, hd: 1 }; } return act(r); }
    case 'dsel': stSel.m = g; return renderAll(true);
    case 'datego': { const j = startJd(), t = todayJd(); if (j < t) { toast('اختر تاريخاً من اليوم فصاعداً'); return; } const r = A.setStart(S, j); toast(r.msg); return act(r); }
    case 'calendar': prof = false; calview = true; return renderAll(true);
    case 'profile': prof = true; return renderAll(true);
    case 'pclose': prof = false; if (d.go) return go(d.go); return renderAll(true);
    case 'pgo': prof = false; return go(g);
    case 'pask': prof = false; return salemSet(true, lvlOf() ? 'mission' : 'ask');
    case 'evch': return eventAction(g);
    case 'wset': return act(A.setWish(S, ($('wishamt') || {}).value));
    case 'dopen': prof = false; dview = true; return renderAll(true);
    case 'debt': dview = true; return renderAll(true);
    case 'dpay': { const r = A.debtPay(S, +d.q); act(r); if (r.msg) showCharacterReply('creditor', r.ok === false ? 'reserved' : 'accepted', r.msg); return; }
    case 'dplan': return act(A.debtPlan(S, d.g === '1'));
    case 'vbreak': return act(A.vaultBreak(S));
    case 'zopen': prof = false; zview = true; return renderAll(true);
    case 'zpay': return act(A.zakatPay(S, +($('zamt') || {}).value));
    case 'zdefer': return act(A.zakatDefer(S));
    case 'zhm': return act(A.zakatHerdMode(S, g));
    case 'zan': return act(A.zakatAn(S, g));
    case 'advisor': prof = false; advTab = d.g || advTab; return salemSet(true, 'ask');
    case 'minidrop': miniOpen = !miniOpen; return renderMini(true);
    case 'mspeed': return setSpeed(+d.g);
    case 'mnext': speed = 0; clearInterval(timer); step(); return renderAll(true);
    case 'msound': try { Sound.setMuted(!Sound.isMuted()); if (!Sound.isMuted()) { Sound.unlock(); Sound.play('click'); } } catch (e) {} syncSound(); return renderMini(true);
    case 'msalem': miniOpen = false; renderMini(true); return salemSet(!salemOpen, salemOpen ? null : (salemTab || 'mission'));
    case 'salem': return salemSet(!salemOpen, salemOpen ? null : (salemTab || 'mission'));
    case 'salemclose': return salemSet(false);
    case 'salemopen': return salemSet(true, 'mission');
    case 'peekclose': { const pk = $('salemPeek'); if (pk) pk.hidden = true; return; }
    case 'salemtab': return salemSet(true, g);
    case 'cqa': { const n = learnNext(); if (n && n.k === 'card' && cardAns) { const q = E.CARDS.CARDS[n.id].quiz; if (+g === q.ok) cardAns.done = true; else { if (!cardAns.bad.includes(+g)) cardAns.bad.push(+g); if (cardAns.bad.length >= 2) cardAns.done = true; } } return renderAll(true); }
    case 'cview': cview = g; cardAns = null; return renderAll(true);
    case 'jtab': jtab = g; return renderAll(true);
    case 'diff': S.diff = d.k === 'normal' ? undefined : d.k; toast('صعوبة: ' + ({ calm: 'هادئ', normal: 'عادي', hard: 'صعب' })[d.k]); return renderAll(true);
    case 'savecode': { const r = SaveCode.encode(E.save(S)); if (r.ok) { scode = r.code; toast('أُنشئ رمز الحفظ'); } else toast(r.msg); return renderAll(true); }
    case 'savecopy': { const done = () => toast('نُسخ الرمز'), fb = () => { const el = $('scOut'); if (el) { el.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('حدّد الرمز وانسخه يدوياً'); } } }; try { navigator.clipboard.writeText(scode).then(done, fb); } catch (e) { fb(); } return; }
    case 'saveno': simp = false; return renderAll(true);
    case 'saveimport': {
      if (!simp) { simp = true; return renderAll(true); }
      const dd = SaveCode.decode(simpText); simp = false; if (!dd.ok) { toast(dd.msg); return renderAll(true); }
      const S2 = E.load(dd.json); if (!S2) { toast('الرمز من نسخة لا تطابق هذه اللعبة'); return renderAll(true); }
      try { localStorage.setItem(KEY, E.save(S2)); savePause = true; } catch (e) { toast('تعذّر الحفظ في هذا الجهاز'); return renderAll(true); }
      simpText = ''; toast('استُعيد تقدّمك'); setTimeout(() => location.reload(), 400); return;
    }
    case 'spot': { const r = A.dlgOpen(S, g); if (r.ok === false) toast(r.msg); else sfx('click'); return renderAll(true); }
    case 'dlgopt': { const r = A.dlgChoose(S, +d.k); if (r.msg) toast(r.msg); if (r.ok === false) sfx('fail'); else sfx(/أتممتَ|قبضتَ/.test(r.msg || '') ? 'success' : 'click'); return renderAll(true); }
    case 'dlgskip': return endTyping();
    case 'dlgclose': endTyping(); A.dlgClose(S); return renderAll(true);
    case 'roadopt': { const r = A.roadChoose(S, d.c); if (r.msg) roadRes = { outcome: r.outcome, msg: r.msg, sea: !!r.sea }; outPick = {}; sfx(r.outcome === 'robbed' ? 'fail' : r.outcome === 'repelled' ? 'success' : 'click'); return renderAll(true); }
    case 'amb': try { Sound.setAmbience(!Sound.isAmbience(), ambFor()); } catch (e) {} return syncSound();
    case 'sound': try { Sound.setMuted(!Sound.isMuted()); if (!Sound.isMuted()) { Sound.unlock(); Sound.play('click'); } } catch (e) {} return syncSound();
    case 'advtab': advTab = g; return renderAll(true);
    case 'advmute': S.learn.advMute = !S.learn.advMute; return renderAll(true);
    case 'advgo': adv = false; return go(g);
    case 'captainauto': { const r = E.setCaptainAuto(S, !S.captainAuto); if (r.ok) setSpeed(S.captainAuto ? 1 : 0); return act(r); }
    case 'climateclose': A.climateClose(S,+d.g);renderAll(true);persist();return;
    case 'climateread': A.climateRead(S,d.k);persist();return renderAlerts();
    case 'lifeack': { const r=A.acknowledgeLife(S);agingView='';renderAll(true);persist();resumeAwayUI();return; }
    case 'lifememory': prof=false;agingView='memory';return renderAll(true);
    case 'lifeclose': agingView='';return renderAll(true);
    case 'salemwaqfopen': prof=false;agingView='waqf';return renderAll(true);
    case 'salemwaqfset': { const value=($('salemWaqfShop')||{}).value||'',sep=value.lastIndexOf(':'),r=A.setSalemWaqf(S,value.slice(0,sep),+value.slice(sep+1));if(r.ok)agingView='';return act(r); }
    case 'waqfarrears': return act(A.payWaqfArrears(S,g));
    case 'liferetire': return submitRetirement();
    case 'bossheirack': return act(A.ackBossHeir(S,d.c));
    case 'algenerationread': { const n=(S.life&&S.life.successionNotices||[]).find(x=>x.id===d.k);if(n)n.read=true;persist();return renderAlerts(); }
    case 'awayclose': delete S.awayReport; if (S.captainAuto) setSpeed(1); return renderAll(true);
    case 'lclose': return learnClose();
    case 'lnext': return lseq(q => { q.i++; });
    case 'lrep': return lseq(q => { q.rep[q.i] = +g; });
    case 'lans': return lseq(q => { const b = beatsOf(learnNext())[q.i].quiz, st = q.ans[q.i] || (q.ans[q.i] = { bad: [], done: false }); if (+g === b.ok) st.done = true; else { st.bad.push(+g); if (st.bad.length >= 2) st.done = true; } });
    case 'lview': salemOpen = false; view = { k: 'view', lvl: +g }; return renderAll(true);
    case 'fxdo': { const amt = parseFloat($('fxAmt').value); return act(A.exchange(S, $('fxFrom').value, $('fxTo').value, amt)); }
    case 'fxall': return act(A.exchange(S, d.f, d.t, S.player.wallet[d.f]));
    case 'fxpct': { const f = $('fxFrom').value; $('fxAmt').value = (S.player.wallet[f] * (+d.q) / 100).toFixed(f === 'au' || f === 'ag' ? 3 : 0); return fxPreview(); }
    case 'selcar': carSel = +d.id; return renderAll(true);
    case 'cart': return act(A.buyCart(S, cr.id));
    case 'crew': return act(A.hireCrew(S, cr.id));
    case 'guard': return act(A.hireGuard(S, cr.id));
    case 'cartc': return act(A.buyCart(S, +d.id));
    case 'guardc': return act(A.hireGuard(S, +d.id));
    case 'work': return act(A.work(S));
    case 'hire': return act(A.hireCaptain(S));
    case 'shopup': return act(A.upgradeShop(S, d.cid, +d.s, d.k));
    case 'tplsave': return act(A.saveTemplate(S, +d.id));
    case 'tplapply': return act(A.applyTemplate(S, +d.id, +$('tp' + d.id).value));
    case 'tpldel': return act(A.delTemplate(S, +$('tp' + d.id).value));
    case 'insure': return act(A.insureCity(S, d.cid, d.on === '1'));
    case 'buymount': return act(A.buyMount(S, +d.id, d.k));
    case 'sellmount': return act(A.sellMount(S, +d.id));
    case 'hirecand': return act(A.hireCaptain(S, +d.i));
    case 'raisecap': return act(A.raiseCaptain(S, +d.id));
    case 'sqhire': return act(A.hireFill(S, estCity));
    case 'sqadd': return act(A.shopQuick(S, estCity, +d.s));
    case 'sqauto': return act(A.shopAutoAll(S, estCity));
    case 'srprice': return act(A.shopSetItem(S, estCity, +d.s, d.g, (+d.to || 105) / 100, (E.shopsOf(S, estCity).find(x => x.id === +d.s).items.find(i => i.g === d.g) || {}).auto));
    case 'srauto': { const it = (E.shopsOf(S, estCity).find(x => x.id === +d.s) || { items: [] }).items.find(i => i.g === d.g); return act(it ? A.shopSetItem(S, estCity, +d.s, d.g, it.price, true) : { ok: false, msg: 'لا سلعة' }); }
    case 'bshop': return act(A.buildShop(S, estCity));
    case 'bwh': return act(A.buildWarehouse(S, estCity));
    case 'isave': { const sid = +d.s; return act(A.shopSetItem(S, estCity, sid, g, (+$('ip' + sid + '_' + g).value || 100) / 100, $('ia' + sid + '_' + g).checked, $('ic' + sid + '_' + g).checked)); }
    case 'irm': return act(A.shopRemoveItem(S, estCity, +d.s, g));
    case 'rentshop': return act(A.rentShop(S, estCity, d.g, landlord));
    case 'landlord': landlord = d.g; return renderAll(true);
    case 'upstall': return act(A.upgradeStall(S, estCity, +d.s));
    case 'buyshop': return act(A.buyShop(S, estCity, +d.s));
    case 'vacate': return act(A.vacateShop(S, estCity, +d.s));
    case 'buildfarm': return act(A.buildFarm(S, estCity));
    case 'buildbutcher': return act(A.buildButcher(S, estCity));
    case 'cutmeat': return act(A.cutMeat(S, estCity, g, q));
    case 'buildstable': return act(A.buildStable(S, estCity));
    case 'buystud': return act(A.buyStud(S, estCity));
    case 'upfarm': return act(A.upgradeFarm(S, estCity));
    case 'farmin': return act(A.farmIn(S, main().id, g, q));
    case 'farmout': return act(A.farmOut(S, main().id, g, q));
    case 'farmsell': return act(A.farmSell(S, estCity, g, q));
    case 'farmsellyoung': return act(A.farmSell(S, estCity, g, q, 'young'));
    case 'slaughter': return act(A.slaughter(S, estCity, g, q));
    case 'hirefill': return act(A.hireFill(S, estCity));
    case 'hirestaff': return act(A.hireStaff(S, estCity, d.g));
    case 'firestaff': return act(A.fireStaff(S, estCity, +d.s));
    case 'iadd': { const sid = +d.s; return act(A.shopSetItem(S, estCity, sid, $('ig' + sid).value, (+$('ipn' + sid).value || 180) / 100, true)); }
    case 'cargo': cdg = g; return renderAll(true);
    case 'cgclose': cdg = null; return renderAll(true);
    case 'cgsell': { cdg = null; dg = g; dq = Math.max(1, Math.floor(m.cargo[g] || 1)); sel = m.city; return go('market'); }
    case 'stow': { const r = A.toStore(S, m.id, g, clampQ(QS['st:' + g] == null ? 1 : QS['st:' + g], 9999)); if (cdg && !Math.floor(m.cargo[g] || 0)) cdg = null; return act(r); }
    case 'unstow': return act(A.fromStore(S, m.id, g, clampQ(QS['st:' + g] == null ? 1 : QS['st:' + g], 9999)));
    case 'fromstore': return act(A.fromStore(S, m.id, g, 999));
    case 'tostore': return act(A.toStore(S, m.id, g, 999));
    case 'estcity': estCity = d.c; estC = S.cities[estCity].country; return go('estate');
    case 'route': { const id = +d.id, a1 = $('ra' + id).value, b1 = $('rb' + id).value; if (a1 === b1) return toast('اختر مدينتين مختلفتين'); return act(A.setRoute(S, id, { a: a1, b: b1, buyA: $('rba' + id).value || null, buyB: $('rbb' + id).value || null })); }
    case 'factory': return act(A.buildFactory(S, d.c, d.r));
    case 'buycraft': return act(A.buyCraft(S, d.c));
    case 'hiremgr': return act(A.hireManager(S, d.c, +d.lv));
    case 'firemgr': return act(A.fireManager(S, d.c));
    case 'auditmgr': return act(A.auditCity(S, d.c));
    case 'rescuefact': return act(A.rescueFactory(S, +d.i));
    case 'invest': return act(A.invest(S, sel, q));
    case 'divest': return act(A.divest(S, sel, q));
    case 'murabaha': return act(A.murabaha(S, mur.g, mur.q, mur.t));
    case 'qard': return act(A.qard(S, q));
    case 'settle': return act(A.settle(S, d.id === '' || d.id == null ? null : +d.id));
    case 'sukuk': return act(A.buySukuk(S));
    case 'upg': return act(A.upgradeMarket(S, sel));
    case 'found': return act(A.foundCity(S, $('fcZone').value, $('fcGood').value));
    case 'viewcity': sel = d.c; mapC = S.cities[sel].country; mapView = { zoom: 1, center: null }; return go('map');
    case 'tolord': lordCity = d.c; lordC = S.cities[lordCity].country; return go('lords');
    case 'lobby': return bossAction(() => A.lobby(S, lordCity, q), 'lobby');
    case 'gift': return bossAction(() => A.gift(S, lordCity), 'gift');
    case 'nego': return bossAction(() => A.negotiate(S, lordCity, d.k), 'nego');
    case 'sign': return bossAction(() => A.signPact(S, lordCity, d.k), 'sign');
    case 'breakp': return bossAction(() => A.breakPact(S, lordCity), 'breakp');
    case 'viewmarket': sel = d.c; leaveTo('market'); return renderAll(true);
    case 'dev1': S.player.gold += 10000; persist(); return renderAll(true);
    case 'dev2': S.player.gold += 50000; persist(); return renderAll(true);
    case 'dev3': for (let i = 0; i < 20; i++) E.tick(S); persist(); return renderAll(true);
    case 'dev100': for (let i = 0; i < 100; i++) { E.tick(S); S.pause = false; } persist(); return renderAll(true);
    case 'devlvl': return devLevel(+($('devLv') || {}).value || 1);
    case 'devunlock': return devUnlock();
    case 'devdebt': { const fd = S.player.famDebt; if (!fd || fd.left <= 0) return toast('لا دَين'); if (S.player.gold < fd.left) S.player.gold = fd.left + 100; return act(A.debtPay(S, Math.ceil(fd.left))); }
    case 'devcheck': return devCheck();
    case 'devcancel': { const g = $('devgate'); if (g) g.hidden = true; return; }
    case 'devoff': return setDev(false);
    case 'storygo': storyGo = true; return renderAll(true);
    case 'newask': newSure = true; return renderAll(true);
    case 'newcancel': newSure = false; return renderAll(true);
    case 'newgo': return newGameNow();
    case 'devnew': { const b = $('devNew'); if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'اضغط للتأكيد (تفقد الحالية)'; return; } delete b.dataset.sure; b.textContent = 'لعبة جديدة'; S = E.newGame(Date.now() % 100000 + 1); sel = 'riyadh'; carSel = 1; mapC = 'all'; mapView = { zoom: 1, center: null }; mapListOpen = {}; persist(); $('dev').hidden = true; setSpeed(0); return go('home'); }
    case 'stress': return runStress(100);
    case 'stress2': return runStress(300);
  }
});
document.addEventListener('change', ev => {
  if (ev.target.dataset && ev.target.dataset.mur) { const k = ev.target.dataset.mur; mur[k] = k === 'q' ? Math.max(1, Math.floor(+ev.target.value) || 1) : k === 't' ? +ev.target.value : ev.target.value; return renderAll(true); }
  if (ev.target.id === 'fxFrom') { fxFrom = ev.target.value; if (fxTo === fxFrom) fxTo = ['sar', 'usd', 'au', 'ag'].find(c => c !== fxFrom); renderAll(true); return; }
  if (ev.target.id === 'fxTo') { fxTo = ev.target.value; fxPreview(); return; }
  if (ev.target.id === 'insBox') { A.insure(S, car().id, ev.target.checked); renderAll(true); }
});
