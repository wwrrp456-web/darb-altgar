/* تقدير قراءة فقط لليوم التالي، بالحالة الحالية ودون افتراض دخل أو شراء جديد. */
function dailyObligations(S) {
  const { FARM_UPKEEP, ownShops, shKind, wkWage, MGR, insPrem, RECIPES, isAbroad, LOCAL_FACTORY_UPKEEP, capRole, WAGE, HERDER_WAGE, capWage, mountOf, shipCrew, SAILOR_WAGE, SHIPS } = E;
  const P = S.player, costs = {}, add = (k, n) => { if (n > 0) costs[k] = (costs[k] || 0) + n; };
  for (const city in P.props) {
    const pr = P.props[city], c = S.cities[city]; if (!c) continue;
    const ns = pr.shops.length;
    if (pr.farm) add('farm', FARM_UPKEEP * pr.farm.level);
    if (ns || pr.whs) {
      add('shops', ownShops(pr) * 10 * (1 + 0.08 * (ns - 1)) + pr.whs * 6);
      for (const sh of pr.shops) if (shKind(sh) !== 'own') add('rent', sh.rent);
      for (const w of pr.staff || []) if (!(w.free > S.day + 1)) add('staff', wkWage(S, c, Object.assign({}, w, { days: w.days + 1 })));
    }
    if (pr.mgr) add('managers', MGR[pr.mgr.lv].wage);
    if (pr.ins) add('insurance', insPrem(S, city));
  }
  for (const f of P.factories) {
    const rc = RECIPES[f.recipe]; if (!S.cities[f.city] || !rc || isAbroad(f) && f.crisis) continue;
    add('factoryWages', rc.wage * f.level);
    add('factories', (isAbroad(f) ? 0.0015 * 2500 : LOCAL_FACTORY_UPKEEP) * f.level);
  }
  const mult = 1 + 0.06 * (P.caravans.length - 1);
  for (const car of P.caravans) {
    const factor = car.left > 0 || car.route || capRole(car) === 'indep' ? 1 : WAGE.idle;
    add('caravans', (car.crew * WAGE.crew + car.guards * WAGE.guard + (car.herders || 0) * HERDER_WAGE + capWage(car)) * mult * factor);
    add('transport', ((mountOf(car) ? mountOf(car).up : 0) + car.carts * 0.7 * mult) * factor);
  }
  for (const sh of P.ships || []) {
    const moving = !sh.city;
    add('sailors', (shipCrew(sh) * SAILOR_WAGE + (sh.captain ? sh.captain.wage : 0)) * (moving ? 1 : 0.5));
    add('ships', SHIPS[sh.type].upkeep * (moving ? 1 : 0.25));
  }
  const daily = Object.values(costs).reduce((a, b) => a + b, 0), balance = P.gold;
  return { costs, daily, monthly: daily * 30, balance, days: daily > 0 ? Math.max(0, balance) / daily : null };
}

/* كل الأصول، لا المدينة المعروضة وحدها. الأرقام تقديرية ولا تخصم أي مبلغ. */
function obligationsHTML() {
  const r = dailyObligations(S), labels = { rent: 'إيجار الدكاكين والبسطات', staff: 'أجور البائعين والأمناء والمزارعين', managers: 'أجور مدراء الأعمال', factoryWages: 'أجور عمّال المصانع', caravans: 'أجور القادة والحراس وطاقم القوافل', sailors: 'أجور القادة والبحارة', shops: 'صيانة الدكاكين والمخازن', factories: 'صيانة المصانع', farm: 'صيانة المزارع', transport: 'صيانة العربات والركائب', ships: 'صيانة السفن', insurance: 'اشتراكات التكافل الحالية' };
  const money = n => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `<section class="card obligations" aria-label="التزاماتي اليومية"><h3>التزاماتي اليومية</h3><p class="small muted">يشمل جميع ممتلكاتك وقوافلك في سائر المدن؛ وهو تقديرٌ لليوم التالي يُخصم من رصيد الريال تلقائياً.</p>${r.daily > 0 ? `<details><summary>تفصيل الالتزامات</summary>${Object.entries(r.costs).map(([k, v]) => `<div class="kv"><span>${labels[k]}</span><b class="num">${money(v)} ريال</b></div>`).join('')}</details><div class="kv"><span>الإجمالي اليومي</span><b class="num" data-obligation="daily">${money(r.daily)} ريال</b></div><div class="kv"><span>تقدير 30 يوماً</span><b class="num">${money(r.monthly)} ريال</b></div><p>رصيدك يكفي <b class="num" data-obligation="days">${Math.floor(r.days)}</b> يوماً بهذه الوتيرة.</p>` : '<p>لا التزامات يومية حالياً.</p>'}<div class="kv"><span>رصيد الريال</span><b class="num">${money(r.balance)}</b></div><p class="small muted">هذا التقدير لا يشمل إيرادك المرتقب، ولا المتأخرات، ولا أثمان البضائع، ولا الرسوم الطارئة. ويتغيّر بحسب السفر والتوظيف وتبدل الأصول.</p>${earlyQardReminder()}${paymentDuesHTML()}${paymentHistoryHTML()}</section>`;
}

function paymentButton(target) {
  const due = (S.paymentDues || []).find(d => d.id === target.paymentDue);
  if (due) return `<button class="sm" data-act="settlepayment" data-id="${due.id}" ${S.player.gold + 1e-9 < due.amount ? 'disabled' : ''}>سدّد المتأخر الآن (${due.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} ريال)</button>`;
  return target.arrears || target.late ? '<span class="small muted">تنبيه: توجد متأخرات سابقة لم تُقيد في السجل.</span>' : '';
}
function paymentDuesHTML() {
  const dues = S.paymentDues || []; if (!dues.length) return '';
  return `<details class="payment-dues"><summary>متأخرات مسجلة (${dues.length})</summary><p class="small muted">المبالغ غير المدفوعة منذ بدء التسجيل؛ تبقى هنا حتى لو غادر العامل أو تركت المكان.</p>${dues.map(d => `<div class="card"><b>${esc(d.label)} · ${esc(S.cities[d.city] ? S.cities[d.city].name : 'في الطريق')}</b><div class="row">${paymentButton({ paymentDue: d.id })}</div>${d.unknownPast ? '<p class="small muted">تنبيه: متأخرات ما قبل التسجيل غير مدرجة؛ وسيقوم هذا الخيار بسداد المقيد فقط.</p>' : ''}</div>`).join('')}</details>`;
}
function paymentHistoryHTML() {
  const rows = E.paymentHistory(S), money = n => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const labels = { rent: 'إيجار', staff: 'أجور العاملين', wages: 'أجور القوافل والمصانع وتشغيل المراكب', upkeep: 'صيانة', wear: 'استهلاك العربات', farm: 'صيانة المزارع' };
  return `<details class="payment-history"><summary>كشف المدفوعات · آخر 30 يوماً</summary><p class="small muted">المبالغ المصروفة فعلياً للإيجار والأجور والتشغيل والصيانة، شاملة السداد المباشر؛ ولا يتضمن الكشف أثمان البضائع ولا المبادلات المالية.</p>${rows.length ? rows.map(r => { const total = Object.values(r.paid).reduce((a,b) => a+b,0); return `<div class="card"><b>${esc(E.dateOf(S,r.day).hs)}</b><p>${Object.entries(r.paid).map(([k,v]) => `${labels[k] || 'مدفوعات'}: ${money(v)}`).join(' · ') || 'لا مدفوعات مسجلة لهذا اليوم.'}</p><b class="num">المجموع: ${money(total)} ريال</b></div>`; }).join('') : '<p>يبدأ الكشف مع أول يوم أو دفعة مسجلة. لا نحسب مبالغ الأيام السابقة بأثر رجعي.</p>'}</details>`;
}
