/* ---------- 052 «ملفي»: مجال me في dDomains بأربعة تبويبات (أنا، ثروتي، كشوفي، إنجازاتي) + كشوف الأداء وتنبيهات الخسارة ----------
   لا مكوّن جديد ولا أيقونة جديدة: dsheet بتبويباته القائمة، وdchip، وask. MFILE.on=false (أو وضع الاختبار الآلي بلا ?player=1) = profile/wealth القديمان حرفاً.
   نقاط الوصول: صورة الرأس (نقرة) ← أنا؛ رقم الثروة (نقرة) ← ثروتي؛ سطر «الدفتر» في «حال أعمالي» (نقرة) ← كشوفي؛ بطاقة التنبيه ← كشوفي مصفّى (نقرة). */
const MF_TABS = [['me', 'أنا'], ['wealth', 'ثروتي'], ['kashf', 'كشوفي'], ['ach', 'إنجازاتي']];
const mfOn = () => { try { return !!(E.MFILE.on && DETAILS.on && dLive() && S && S.player && S.learn && S.learn.char); } catch (e) { return false; } };
const mxSt = { per: 'cur', city: null };
const mfSgn = n => (n < 0 ? '−' : '+') + fmt(Math.abs(Math.round(n)));
const mfStored = () => { try { const t = localStorage.getItem('mfile.tab'); return MF_TABS.some(x => x[0] === t) ? t : null; } catch (e) { return null; } };
const mfStore = t => { try { localStorage.setItem('mfile.tab', t); } catch (e) {} };
function mfOpen(tab, st) {
  if (!mfOn()) return; if (st) Object.assign(mxSt, st);
  if (dsh.domain !== 'me') dOpen('me');
  dsh.tab = tab || mfStored() || 'me'; mfStore(dsh.tab); dsh.keep = true; dRender();
}
/* ===== الرأس الحيّ §2-ب ===== */
function mfHead() {
  const L = S.learn, ch = LSN.CHARS.find(c => c.id === L.char), nw = E.netWorth(S), age = Math.floor(E.ageOf(S)), ret = S.legacy && S.legacy.retired;
  const stage = ret ? 'الوريث' : age >= 70 ? 'شيخ الدرب' : age >= 40 ? 'في أوج تجارته' : 'في أول الدرب';
  let chn = 1; try { chn = E.progView(S, window.ContentMap ? ContentMap.PIECES : []).ch; } catch (e) {}
  const nA = Object.keys((S.ach && S.ach.got) || {}).length, rk = E.traderRank(S), name = S.player.name ? esc(S.player.name) : ch ? charTitle(ch) : 'التاجر';
  return `<button type="button" class="pf-head mf-head" data-mxopen="ach" aria-label="إنجازاتي" style="width:100%;text-align:start;min-height:44px">${charImg() ? `<img class="pimg" src="${charImg()}" alt="">` : ''}<div style="flex:1;min-width:0"><h2 style="margin:0">${name}</h2><div class="small" data-mf-l2>${esc(E.titleOf(nw))} · ${esc(RANK_NAMES[rk] || '')} · ${age} سنة، ${stage}</div><div class="small muted" data-mf-l3>الفصل ${chn} من 7 · سمعتك ${E.repT(S)}٪ · ${nA} إنجازاً من ${E.ACHD.LIST.length}</div></div></button>`;
}
/* ===== بطاقة السمعة بأثرها §4-ج ===== */
function mfRepCard() {
  const R = E.reputation(S), t = E.repT(S), pm = E.repPactMul(S) - 1, fm = E.repFinMul(S) - 1, on = E.REPX.on;
  const pc = x => !Math.round(Math.abs(x) * 100) ? 'بلا تغيير' : (x < 0 ? 'أرخص ' : 'أغلى ') + Math.round(Math.abs(x) * 100) + '٪', lm = x => (x >= 0 ? '+' : '−') + Math.round(Math.abs(x) * 100) + '٪';
  return `<div class="card"><h3>🌟 سمعة التاجر <span class="pill">${R.total}٪</span></h3>${R.parts.map(x => `<div class="kv"><span>${x.name}${on && x.id === 'zakat' ? ' <small class="muted">لا يدخل في الشروط</small>' : ''}</span><b class="num">${x.score}</b></div>${bar(x.score, 100, x.score < 40 ? 'red' : x.score < 70 ? 'gold' : '')}`).join('')}<div class="small muted" style="margin-top:6px">أضعف أشرطتك: <b>${R.weakest.name}</b>. ${R.weakest.tip}.</div>${on ? `<div class="small" data-mf-rep style="margin-top:6px"><b>سمعة التعامل ${t}٪:</b> عقود الزعماء ${pc(pm)} · حد القرض الحسن والمرابحة ${lm(fm)} · جودة مصانعك ${R.quality}٪</div>` : `<div class="small muted">السمعة تحدد جودة مصانعك (من 35٪ إلى 80٪): ${R.quality}٪ الآن.</div>`}</div>`;
}
const mfPactLine = () => { try { if (!(E.REPX.on && S.learn && S.learn.char)) return ''; const x = E.repPactMul(S) - 1; if (!Math.round(x * 100)) return ''; return `<div class="small muted" data-mf-pact>بسمعتك: ${x <= 0 ? 'أرخص ' : 'أغلى '}${Math.round(Math.abs(x) * 100)}٪</div>`; } catch (e) { return ''; } };
/* ===== تبويب أنا ===== */
function mfMeTab() {
  const p = profileParts(); let pg = ''; try { pg = `<div class="card"><h3>مسار التاجر</h3>${progBody()}</div>`; } catch (e) {}
  return mfHead() + mfRepCard() + pg + p.life + p.points + p.stats + p.secrets + p.rival
    + '<h4 class="dsec">المعهد</h4>' + p.task + p.next + `<div class="row"><button class="btn" data-go="academy">🎓 المعهد (الأكاديمية)</button><button class="btn ghost" data-act="pask">💬 اسأل ${esc(MEN.name)}</button></div>`
    + '<h4 class="dsec">حسابك</h4>' + p.bab + p.famDebt + p.zakat + p.year + p.restart
    + '<h4 class="dsec">الإعدادات</h4>' + p.diff + p.save + newGameCard(true);
}
const mfWealthTab = () => wealthHTML().replace(/<button class="btn ghost" data-act="wclose" data-was="wealthclose">[^<]*<\/button>/, '');
/* ===== تبويب كشوفي §3-هـ ===== */
function mfRows(v) {
  const rows = []; for (const c in v.t) rows.push({ k: 'city', c, t: 'تجارة في ' + S.cities[c].name + ': ' + mfSgn(v.t[c].pl) + ' (' + v.t[c].n + ' صفقة، ' + v.t[c].nl + ' خاسرة)', v: v.t[c].pl });
  const per = {}; for (const id in v.s) { const c = v.s[id].c; per[c] = per[c] || 0; const pr = S.player.props[c], i = pr ? pr.shops.findIndex(x => String(x.id) === String(id)) + 1 : 0; rows.push({ k: 'shop', c, t: 'دكان ' + (i || '') + ' في ' + (S.cities[c] || {}).name + ': ' + mfSgn(v.s[id].net), v: v.s[id].net }); }
  if (v.road > 0) rows.push({ k: 'road', t: 'نفقات الطريق: −' + fmt(v.road), v: -v.road });
  return rows.sort((a, b) => b.v - a.v);
}
function mfKashfTab() {
  if (!S.player.mx) { let lg = ''; try { lg = hsLedgerBody(); } catch (e) {} return '<p class="small muted">يبدأ كشف الشهر مع أول يوم يمضي؛ وهذا دفترك الآن:</p>' + lg; }
  const per = mxSt.per === 'last' && S.player.mx.last ? 'last' : 'cur', v = E.mxView(S, per);
  const chips = `<div class="chips" role="group" aria-label="الفترة">${[['cur', 'هذا الشهر'], ['last', 'الشهر الماضي']].map(([k, n]) => `<button type="button" data-mxper="${k}" class="${k === per ? 'on' : ''}" aria-pressed="${k === per}" style="min-height:44px">${n}</button>`).join('')}</div>`;
  const sum = `<p class="small" data-mx-sum><b>صافي ${per === 'cur' ? 'هذا الشهر' : 'الشهر الماضي'} ${mfSgn(v.net)}:</b> دخلت ${fmt(Object.values(v.inc).reduce((a, b) => a + b, 0))} وخرجت ${fmt(Object.values(v.exp).reduce((a, b) => a + b, 0))}${per === 'cur' ? ' (منذ يوم ' + v.d0 + ')' : ''}.</p>`;
  const rows = mfRows(v), rh = rows.map(r => r.k === 'city' ? `<button type="button" class="dchip dchip-row${mxSt.city === r.c ? ' on' : ''}" data-mxcity="${r.c}" aria-pressed="${mxSt.city === r.c}" style="min-height:44px"><span class="dnm ${r.v < 0 ? 'dear' : 'cheap'}">${esc(r.t)}</span></button>` : `<div class="kv"><span class="${r.v < 0 ? 'dear' : 'cheap'}">${esc(r.t)}</span></div>`).join('') || '<p class="small muted">لا حركة تجارة بعد.</p>';
  let fil = ''; if (mxSt.city && v.t[mxSt.city]) { const ls = S.player.trades.filter(t => t.city === mxSt.city && t.side === 'sell' && t.sector === 'trade' && t.pl < 0).slice(0, 10); fil = `<h4 class="dsec">صفقاتك الخاسرة في ${esc(S.cities[mxSt.city].name)}</h4>` + (ls.length ? ls.map(t => `<div class="small">${GD[t.g].name} × ${t.q}: <b class="dear">${mfSgn(t.pl)}</b> — ${esc(E.lossWhy(S, t))}</div>`).join('') : '<p class="small muted">لا صفقات خاسرة محفوظة (يُحفظ آخر 50 صفقة).</p>'); }
  const rest = Object.entries(v.inc).map(([k, x]) => `<div class="kv"><span>${esc(LN[k] || k)}</span><b class="cheap">+${fmt(x)}</b></div>`).join('') + Object.entries(v.exp).map(([k, x]) => `<div class="kv"><span>${esc(LN[k] || k)}${E.FX_COST_KEYS[k] ? ' <small class="muted">طريق</small>' : ''}</span><b class="dear">−${fmt(x)}</b></div>`).join('');
  const hist = S.player.mx.hist, mx = Math.max(1, ...hist.map(h => Math.abs(h.net))), bars = hist.length ? `<h4 class="dsec">اتجاه ${hist.length} أشهر</h4>${hist.map(h => `<div class="kv small"><span>شهر ${h.k + 1}</span><b class="num ${h.net < 0 ? 'dear down' : 'cheap'}">${mfSgn(h.net)}</b></div><div class="mf-bar ${h.net < 0 ? 'down' : ''}" style="height:6px;border-radius:3px;width:${Math.max(3, Math.round(Math.abs(h.net) / mx * 100))}%;background:${h.net < 0 ? 'var(--bad,#b3402e)' : 'var(--good,#2f7d5b)'}"></div>`).join('')}` : '';
  const dw = E.mxCards(S).length, diw = E.mxCardsDiwan ? '' : '', nz = S.player.diwan ? `<p class="small" data-mx-diwan>الناظر يراقب: ${dw} تنبيهات هذا الشهر</p>` : '<p class="small muted">عيّن ناظر الديوان ليُنبّهك إلى الأسواق والدكاكين الخاسرة وأسبابها</p>';
  let mg = ''; try { mg = '<h4 class="dsec">من يدير ماذا</h4>' + mfCityNets() + mgmtHTML(); } catch (e) {}
  return chips + sum + '<h4 class="dsec">أين ربحتَ وأين خسرتَ</h4>' + rh + fil + '<h4 class="dsec">بنود الدفتر</h4>' + rest + bars + nz + mg;
}
function mfCityNets() {
  const per = mxSt.per === 'last' && S.player.mx && S.player.mx.last ? 'last' : 'cur', by = {};
  for (const c of dShopCities()) { const n = E.mxCityNet(S, c, per); if (n == null) continue; const k = S.cities[c].country; (by[k] = by[k] || []).push([c, n]); }
  return Object.keys(by).map(k => { const ct = E.COUNTRIES.find(x => x.id === k), tot = by[k].reduce((a, b) => a + b[1], 0); return `<div class="kv small"><b>${ct ? esc(ct.name) : esc(k)}</b><b class="num ${tot < 0 ? 'dear' : 'cheap'}">${mfSgn(tot)}</b></div>` + by[k].map(([c, n]) => `<div class="kv small"><span>صافي دكاكين ${esc(S.cities[c].name)} هذا الشهر</span><b class="num ${n < 0 ? 'dear' : 'cheap'}">${mfSgn(n)}</b></div>`).join(''); }).join('');
}
/* ===== تبويب إنجازاتي §5 ===== */
function mfAchTab() {
  const X = S.ach || { got: {} }, got = Object.keys(X.got || {}), A = E.ACHX; let sum = 0; for (const id of got) { const d = E.ACHD.LIST.find(a => a.id === id); if (d && !A.none.includes(id)) sum += A.infl[d.tier] || 0; }
  const ti = E.titleIdx(E.netWorth(S)), nw = E.netWorth(S);
  const lad = E.WEALTH_TITLES.map(([at, nm], i) => `<div class="kv small"><span>${i <= ti ? '✓ ' : ''}${esc(nm)}</span><b class="num">${i === 0 ? '' : i <= ti ? '+' + A.title[i] + ' نفوذ' : 'عند ' + fmt(at)}</b></div>`).join('');
  return `<div class="card"><h3>${got.length} من ${E.ACHD.LIST.length} · كسبتَ منها ${sum} نفوذاً</h3>${A.on ? '' : '<p class="small muted">المكافآت مطفأة.</p>'}</div>` + achCard() + `<h4 class="dsec">ألقاب الثروة</h4>${lad}<p class="small muted">الأول كل شهر في لوحة الأسواق: +${A.board} نفوذ إن كان سوقاً تحكمه أو تملكه.</p>`;
}
const mfAchTag = (a, on) => { try { if (!(mfOn() && E.ACHX.on)) return ''; if (E.ACHX.none.includes(a.id)) return ' · <b>تجميلي</b>'; const n = E.ACHX.infl[a.tier]; return on ? ` · <b class="cheap">+${n} نفوذ</b>` : ` · يمنح ${n} نفوذ`; } catch (e) { return ''; } };
/* ===== المجال me ===== */
const MF_BODY = { me: mfMeTab, wealth: mfWealthTab, kashf: mfKashfTab, ach: mfAchTab };
dDomains.me = { icon: 'icons/ledger', name: 'ملفي', gen: () => [], get fold() {
  if (!dsh.tab || !MF_TABS.some(x => x[0] === dsh.tab)) dsh.tab = mfStored() || 'me'; else mfStore(dsh.tab);
  return { sum: '<b>ملفي</b>', def: false, tabs: MF_TABS.map(([id, label]) => ({ id, label, get html() { return MF_BODY[id](); } })) };
} };
/* ===== كشف الدكان في نافذة الدكاكين وبطاقة المدير §3-د ===== */
function mxShopLine(city, sh, idx) {
  if (!E.KASHF.on || !S.player.mx) return ''; const r = E.mxShop(S, city, sh.id); if (!r) return ''; const c = r.cur, top = c.top.map(([g, x]) => GD[g].name + ' ' + fmt(x)).join(' · ');
  return `<div class="card mx-shop" data-mx-shop="${esc(String(sh.id))}"><b>كشف الشهر · دكان ${idx} في ${esc(S.cities[city].name)}</b><div class="small">هذا الشهر (منذ يوم ${r.d0}): الدخل ${fmt(c.rev)} · البضاعة ${fmt(c.cogs)} · الأجور والصيانة والإيجار ${fmt(c.fix)} · الصافي <b class="${c.net < 0 ? 'dear' : 'cheap'}">${mfSgn(c.net)}</b></div><div class="small">الشهر الماضي: ${r.last ? 'الصافي ' + mfSgn(r.last.net) : 'لا شهر منتهٍ بعد'}</div>${top ? `<div class="small">أكثر السلع دخلاً: ${top}</div>` : ''}</div>`;
}
const mxShopsExtra = () => { if (!E.KASHF.on || !S.player.mx) return ''; let h = ''; for (const city of dShopCities()) E.shopsOf(S, city).forEach((sh, i) => { h += mxShopLine(city, sh, i + 1); }); return h; };
dDomains.shops.extra = mxShopsExtra;
function mxMgrLine(city) {
  if (!E.KASHF.on || !S.player.mx) return ''; const pr = S.player.props[city]; if (!pr || !pr.mgr) return ''; const cur = E.mxCityNet(S, city, 'cur'), last = E.mxCityNet(S, city, 'last'); if (cur == null) return '';
  return `<div class="small" data-mx-mgr>صافي دكاكين ${esc(S.cities[city].name)} هذا الشهر <b class="${cur < 0 ? 'dear' : 'cheap'}">${mfSgn(cur)}</b> (الماضي ${last == null ? '—' : mfSgn(last)})</div>` + pr.shops.map((sh, i) => mxShopLine(city, sh, i + 1)).join('');
}
const mfMgmtLine = () => `<section class="card"><h4 class="dsec" style="margin-top:0">من يدير ماذا</h4><p class="small muted">الهيكل بأرقامه في ملفي ← كشوفي.</p><button type="button" class="sm pri" data-mxopen="kashf" style="min-height:44px;width:100%">افتح ملفي ← كشوفي</button></section>`;
/* ===== بطاقات التنبيه §3-و ===== */
function mxAskCards() {
  if (!mfOn() && !(E.KASHF.on && S && S.player && S.learn && S.learn.char && dLive())) return [];
  const done = id => { ui.dsnooze = ui.dsnooze || {}; ui.dsnooze[id] = S.day + 31; saveUi(); }, go = (id, tab, st) => () => { done(id); mfOpen(tab, st); return { ok: true, msg: '' }; };
  return E.mxCards(S).filter(c => !dSnoozed(c.id)).map(c => {
    const opts = [], see = { id: 'see', icon: 'icons/ledger', title: c.kind === 'road' ? 'افتح كشف الطريق' : c.kind === 'mkt' ? 'اعرض صفقاتها' : c.kind === 'month' ? 'افتح الكشف' : 'افتح الدكان', effect: 'تنقّل وقراءة فقط، لا مال' };
    if (c.kind === 'shop') opts.push({ ...see, best: true, act: () => { done(c.id); if (dsh.domain !== 'shops') dOpen('shops'); return { ok: true, msg: '' }; } });
    else opts.push({ ...see, best: true, act: go(c.id, 'kashf', { per: 'last', city: c.kind === 'mkt' ? c.city : null }) });
    if (c.kind === 'mkt' && E.BESTM.on) { const car = main(); const ls = S.player.trades.filter(t => t.city === c.city && t.pl < 0), tot = {}; ls.forEach(t => { tot[t.g] = (tot[t.g] || 0) + t.pl; }); const g = Object.keys(tot).sort((a, b) => tot[a] - tot[b])[0];
      if (g && car && !(car.left > 0) && (car.cargo[g] || 0) >= 1 && typeof bmOpen === 'function') opts.push({ id: 'bm', icon: 'icons/target', title: 'بِع في أفضل سوق', effect: 'يفتح ورقة «بِع في أفضل سوق» لـ' + GD[g].name, act: () => { done(c.id); bmOpen(g, false); return { ok: true, msg: '' }; } }); }
    opts.push(dPostpone(c.id, 30));
    return { id: c.id, icon: 'icons/ledger', title: c.title, why: c.why, w: c.w, opts, state: 'open', prio: 3 };
  });
}
ASK_SRC.mx = mxAskCards;
/* ===== مستمع الفتح والاختيار (مستقل عن dLive) ===== */
document.addEventListener('click', ev => {
  const t = ev.target.closest && ev.target.closest('[data-mxopen],[data-mxper],[data-mxcity],[data-dstab],[data-dchip="me:kashf"]'); if (!t) return;
  if (t.dataset.dchip === 'me:kashf') { ev.stopImmediatePropagation(); mfOpen('kashf', { per: 'cur', city: null }); return; }
  if (t.dataset.mxopen) { ev.stopImmediatePropagation(); mfOpen(t.dataset.mxopen === 'last' ? 'kashf' : t.dataset.mxopen, t.dataset.mxopen === 'last' ? { per: 'last', city: null } : null); return; }
  if (dsh.domain !== 'me') return;
  if (t.dataset.dstab) { dsh.tab = t.dataset.dstab; mfStore(dsh.tab); dsh.keep = true; dRender(); return; }
  if (t.dataset.mxper) { mxSt.per = t.dataset.mxper; dsh.keep = true; dRender(); return; }
  if (t.dataset.mxcity) { mxSt.city = mxSt.city === t.dataset.mxcity ? null : t.dataset.mxcity; dsh.keep = true; dRender(); }
}, true);
