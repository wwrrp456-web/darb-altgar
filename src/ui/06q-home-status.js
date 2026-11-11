/* ---------- 042 «حال أعمالي» في الرئيسية: خمسة أسطر، كل سطر يفتح نافذة سفلية بمكوّن 037 (dsheet) ----------
   لا مكوّن جديد ولا قوائم منسدلة ولا أيقونات جديدة. تظهر البطاقة بقاعدة 037 نفسها (dLive: اللاعب الحقيقي أو ?player=1)،
   وE.HOMEST.on=false يعيد الرئيسية القديمة حرفياً. الأرقام من E.hsView (قراءة فقط) وتُحسب عند الرسم فقط. */
const hsUiOn = () => { try { return !!(E.HOMEST.on && DETAILS.on && dLive() && S && S.learn && S.learn.char); } catch (e) { return false; } };
const hsSgn = n => (n < 0 ? '−' : '+') + fmt(Math.abs(n));
const hsKv = (k, v, cls) => `<div class="kv"><span>${k}</span><b class="num ${cls || ''}">${v}</b></div>`;
const hsGoBtn = (w, label, c, ghost) => `<button type="button" class="sm ${ghost ? '' : 'pri'}" data-act="hsgo" data-w="${w}"${c ? ` data-c="${esc(c)}"` : ''} style="width:100%;min-height:44px;margin-top:8px">${esc(label)}</button>`;
function hsLedgerBody() {
  const v = E.hsLedger(S), lab = v.since === 'start' ? 'منذ البداية حتى الآن' : 'آخر ' + v.days + ' يوماً';
  const rows = v.rows.map(r => hsKv(esc(LN[r.k] || r.k), hsSgn(r.v), r.v < 0 ? 'dear' : 'cheap')).join('') + (Math.abs(v.other) >= 1 ? hsKv('غيرها', hsSgn(v.other), v.other < 0 ? 'dear' : 'cheap') : '');
  return `<p class="small muted">${lab}${v.since === 'start' ? ' (يُعرض آخر 30 يوماً بعد أربعة أسابيع من اللقطات)' : ''}</p>${hsKv('الدخل', fmt(v.inc))}${hsKv('المصروف', fmt(v.exp))}${hsKv('الصافي', hsSgn(v.net), v.net < 0 ? 'dear' : 'cheap')}<h4 class="dsec">أكبر البنود</h4>${rows || '<p class="small muted">لا حركة بعد.</p>'}${hsGoBtn('ledger', 'افتح الدفتر كاملاً')}`;
}
function hsFundBody() {
  const f = E.hsFund(S); if (!f) return ''; const v = f.view, inc = v.inc || {}, last = v.last;
  return `${hsKv('الرصيد', fmt(f.bal) + ' ريال')}<div class="small">${f.mine ? 'أنت حاكم السوق' : 'الزعيم ' + esc(f.boss)}</div><div class="small muted" data-hs-inc>هذا الشهر حتى الآن: أنت ${fmt(inc.you || 0)} · المنافسون ${fmt(inc.rivals || 0)} · آخرون ${fmt(inc.others || 0)}</div>`
    + (last ? `<div class="small muted">${last.spent >= 1 ? 'أنفق الزعيم آخر مرة ' + fmt(last.spent) + ' وأضاف ' + last.add.toFixed(2) + ' نقطة رعاية' : 'لم يُنفق شيئاً آخر مرة (الرصيد دون الاحتياطي)'}.</div>` : '')
    + `<p class="small muted" data-hs-next>الإنفاق التلقائي القادم بعد ${dayAr(f.spendDays)}: نحو ${fmt(f.spend)} ريال على المدينة كلها.</p>`
    + (typeof fundSpendHTML === 'function' && E.A && E.A.fundSpend ? fundSpendHTML(f.city, E.fundView(S, f.city)) : hsGoBtn('fund', 'افتح بطاقة الصندوق', f.city));
}
function hsShopsBody() {
  const v = E.hsShops(S); if (!v) return ''; const gold = S.player.gold;
  const rows = v.list.map(x => `<div class="kv"><span>${esc(x.cityName)}${x.g ? ' · ' + esc(GD[x.g].name) : ''}</span><span class="${x.bad ? 'dear' : x.good ? 'cheap' : ''}">${esc(x.name)} ${Math.round(x.cond)} · ${esc(x.eff)}${x.can ? ` <button type="button" class="sm" data-act="shoprepair" data-cid="${esc(x.city)}" data-s="${x.id}" style="min-height:44px"${gold + 1e-9 < x.cost ? ' disabled' : ''}>رمِّم (${fmt(x.cost)})</button>` : ''}</span></div>`).join('');
  const bad = v.list.find(x => x.bad);
  return rows + hsGoBtn('shops', 'افتح العقارات', (bad || v.list[0]).city, true);
}
function hsLiqBody() { const v = E.liqView(S); return (v ? liqBodyHTML() : '') + hsGoBtn('liq', 'اضبط السياسة', '', true); }
function hsRivBody() {
  const v = E.hsRivals(S); if (!v) return '';
  return v.list.map(r => `<div class="kv"><span>${esc(r.name)} · ${esc(r.hereNames.join('، '))}</span><span>${esc(r.strName)} · ${esc(r.kind)} ${r.pct > 0 ? '+' : ''}${r.pct}٪</span></div>`).join('') + `<p class="small muted">يدفعون رسوماً في صندوق السوق فيزدهر.</p>` + hsGoBtn('riv', 'افتح بطاقة المنافسين', '', true);
}
dDomains['hs:liq'] = { icon: 'ui-expenses', name: 'السيولة', gen: () => dLiqCards(), extra: hsLiqBody };
function hsReg(v) { // تسجيل نوافذ الأسطر في سجل 037 (يُستدعى عند الرسم، وعند فتحها من تنبيه)
  v = v || E.hsView(S); if (!v) return;
  const F = (k, sum, body) => { dsh.folds[k] = { sum, body, def: false }; };
  F('hs-ledger', '<b>الدفتر</b>', hsLedgerBody); if (v.fund) F('hs-fund', '<b>صندوق السوق</b>', hsFundBody); if (v.shops) F('hs-shops', '<b>دكاكينك</b>', hsShopsBody); if (v.rivals) F('hs-riv', '<b>المنافسون في أسواقك</b>', hsRivBody);
}
function hsRow(dom, icon, sum, warn) { const name = dPlain(sum); return `<button type="button" class="dchip dchip-row hs-row${warn ? ' warn' : ''}" data-dchip="${dom}" aria-expanded="${dsh.domain === dom}" aria-label="${esc(name)}">${dIc(icon)}<span class="dnm">${sum}</span><span class="dgo" aria-hidden="true">›</span></button>`; }
function hsHomeHTML() {
  if (!hsUiOn()) return ''; const v = E.hsView(S); if (!v) return ''; hsReg(v); const rows = [], L = v.ledger;
  rows.push(hsRow('fold:hs-ledger', 'icons/ledger', `<b>${L.since === 'start' ? 'منذ البداية' : 'آخر ' + L.days + ' يوماً'}</b> <b class="num ${L.net < 0 ? 'dear' : 'cheap'}">${hsSgn(L.net)}</b><small>دخل ${fmt(L.inc)} ← مصروف ${fmt(L.exp)}</small>`));
  if (v.fund) rows.push(hsRow('fold:hs-fund', 'ui-expenses', `<b>صندوق سوق ${esc(v.fund.name)}</b> <b class="num">${fmt(v.fund.bal)}</b><small>${v.fund.mine ? 'أنت حاكم السوق' : 'الزعيم ' + esc(v.fund.boss)}</small>`));
  if (v.shops) rows.push(hsRow('fold:hs-shops', 'ui-shops', `<b>دكاكينك</b><small>${v.shops.good} بحالة جيدة${v.shops.mid ? ' · ' + v.shops.mid + ' مقبولة' : ''}${v.shops.bad ? ` · <b class="dear">${v.shops.bad} متهالك</b>` : ''}</small>`, v.shops.bad > 0));
  if (v.liq) rows.push(hsRow('hs:liq', 'ui-expenses', `<b>السيولة</b> <b class="num ${v.liq.low ? 'dear' : ''}">${v.liq.days === Infinity ? 'لا التزامات' : 'تغطي ' + Math.floor(v.liq.days) + ' يوماً'}</b><small>نقد ${fmt(v.liq.cash)} · ودائع ${fmt(v.liq.dep)}</small>`, v.liq.low));
  if (v.rivals) rows.push(hsRow('fold:hs-riv', 'icons/target', `<b>المنافسون في أسواقك</b><small>${v.rivals.list.length} ${v.rivals.list.length === 1 ? 'نشط' : 'نشطون'} · الأقوى ${esc(v.rivals.top.name)} في ${esc(v.rivals.top.hereNames[0])}</small>`));
  return `<section class="card hs" aria-label="حال أعمالي" style="margin-top:12px"><h2 style="margin-top:0">حال أعمالي</h2>${rows.slice(0, E.HOMEST.rows).join('')}</section>`;
}
/* تنبيهات تأتي اللاعب (بطاقات ask في «اليوم»): رمِّم دكاناً تهالك، سيولة منخفضة، منافس جديد في سوق فيه دكانك. الأفعال قائمة كلها. */
function hsAskCards() {
  if (!hsUiOn()) return []; const v = E.hsView(S); if (!v) return []; const out = [];
  if (v.shops) v.shops.list.filter(x => x.bad).sort((a, b) => a.cond - b.cond).slice(0, 3).forEach(x => {
    const id = 'hs:shop:' + x.city + ':' + x.id, gold = S.player.gold;
    out.push({ id, w: 92, icon: 'ui-shops', title: 'دكانك في ' + x.cityName + ' بدأ يتهالك', why: 'حالته ' + Math.round(x.cond) + ' من 100 · ' + x.eff, state: 'open', prio: 2, opts: [
      gold + 1e-9 >= x.cost ? { id: 'repair', icon: 'ui-pay', title: 'رمِّمه الآن (' + fmt(x.cost) + ' ريال)', effect: 'يعود إلى ' + E.SHOPCOND.repairTo + ' · موصى به', best: true, act: () => A.shopRepair(S, x.city, x.id) } : { id: 'repair', icon: 'ui-pay', title: 'رمِّمه الآن (' + fmt(x.cost) + ' ريال)', off: 'رصيدك لا يكفي' },
      dPostpone(id, 7), { id: 'steward', icon: 'ui-delegate', title: 'اتركه للأمين', off: 'غير متاح: الأمين لا يتولى الترميم' }] });
  });
  if (v.liq && v.liq.low) dLiqCards().forEach(c => out.push({ ...c, w: 97 }));
  if (v.rivals) v.rivals.list.filter(r => r.fresh).slice(0, 2).forEach(r => {
    const id = 'hs:riv:' + r.id;
    out.push({ id, w: 80, icon: 'icons/target', title: r.name + ' دخل سوق ' + r.hereNames[0] + ' وفيه دكانك', why: r.kind + ' ' + (r.pct > 0 ? '+' : '') + r.pct + '٪ · ' + r.strName, state: 'open', prio: 3, opts: [
      { id: 'more', icon: 'icons/target', title: 'اعرف أكثر', effect: 'يفتح نافذة المنافسين', best: true, act: () => { ui.dsnooze = ui.dsnooze || {}; ui.dsnooze[id] = S.day + 30; saveUi(); setTimeout(() => { hsReg(); dOpen('fold:hs-riv'); }, 0); return { ok: true, msg: '' }; } },
      dPostpone(id, 30)] });
  });
  return out.filter(c => !dSnoozed(c.id));
}
function hsGo(w, c) {
  if (dsh.domain) { dsh.domain = null; dsh.open = null; dsh.keep = false; dRender(); }
  ui.tab = ui.tab || {}; ui.fold = ui.fold || {};
  if (w === 'ledger') { ct = 'ledger'; return go('cities'); }
  if (w === 'fund') { ct = 'cities'; if (c && S.cities[c]) { ui.fold['fund-' + c] = true; saveUi(); } go('cities'); setTimeout(() => { const e = c && document.querySelector(`[data-cid="${c}"]`); if (e) e.scrollIntoView({ block: 'start' }); }, 80); return; }
  if (w === 'shops') { if (c && S.cities[c]) { estCity = c; estC = S.cities[c].country; } return go('estate'); }
  if (w === 'liq') { ui.tab.office = 'money'; saveUi(); return go('office'); }
  if (w === 'riv') { ui.tab.office = 'goals'; saveUi(); go('office'); setTimeout(() => { if (dDomain('fold:of-rivals')) dOpen('fold:of-rivals'); }, 0); }
}
