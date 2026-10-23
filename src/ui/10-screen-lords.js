/* ---------- الزعماء والعقود ---------- */
const av = k => pic('hero/' + k, 'av', '');
const pactIc = t => (t === 'guard' && ART['hero/guard'] ? av('guard') : t === 'supply' && ART['ui/crate'] ? uic('crate') : E.PACTS[t].icon);
let bossReaction = null;
function bossMood(id) {
  if (bossReaction && bossReaction.game === S && bossReaction.id === id && bossReaction.day === S.day) return bossReaction.mood;
  const trust = S.bosses[id] ? S.bosses[id].trust : 0;
  return trust >= 20 ? 'accepted' : trust <= -10 ? 'reserved' : trust > 0 ? 'thinking' : 'neutral';
}
function bossPortrait(id, cls = 'boss', mood = bossMood(id), historical = false) {
  const stage = historical && S.legacy && S.legacy.retired ? '_old' : E.bossArtStage(S);
  if (stage && art('boss/' + id + stage)) return pic('boss/' + id + stage, cls, S.bosses[id] ? S.bosses[id].name : '');

  const key = 'expressions/boss/' + id + '_' + mood;
  return ART[key] ? pic(key, cls + ' dialogue-portrait', S.bosses[id] ? S.bosses[id].name : '') : pic('boss/' + id, cls, '');
}
function bossAction(run, kind) {
  const r = run();
  bossReaction = { game: S, id: lordCity, day: S.day, mood: r && r.ok === false || kind === 'lobby' || kind === 'breakp' ? 'reserved' : 'accepted' };
  return act(r);
}
const bossPic = (c, mine) => mine ? pic('hero/c_' + (S.learn.char || 'trader') + E.charArtStage(S), 'boss', 'أنت') : bossPortrait(c.id);
const trustWord = v => v >= 50 ? 'صديق' : v >= 20 ? 'موثوق' : v > -10 ? 'محايد' : v > -40 ? 'متوتر' : 'عدائي';
function bossStrip(c) {
  const bs = E.bossOf(S, c.id); if (!bs) return '';
  const sh = Math.round(E.bossShare(bs) * 100), mine = bs.ruler === 'player', pc = E.pactIn(S, c.id);
  return `<div class="card" style="margin:10px 0;display:flex;flex-wrap:wrap;gap:12px;align-items:center"><span style="position:relative">${bossPic(c, mine) || '🧔'}${mine ? '<span style="position:absolute;top:-6px;inset-inline-end:-4px;font-size:22px">👑</span>' : ''}</span><div style="flex:1;min-width:200px"><b>${mine ? 'أنت حاكم سوق ' + esc(c.name) : 'كبير تجّار ' + esc(c.name) + ': ' + esc(bs.name)}</b><div class="small muted">نفوذك ${sh}٪ (تحكم عند ${Math.round(E.BOSS_TAKE * 100)}٪) · ثقته بك: ${trustWord(bs.trust)}${pc ? ' · بينكما ' + E.PACTS[pc.type].name : ''}</div>${bossAgeNote(c.id)}${bar(sh, 100, mine ? '' : 'gold')}</div><button class="sm ${S.phase >= 2 ? 'pri' : ''}" data-act="tolord" data-c="${c.id}">${S.phase >= 2 ? '🤝 العقود والنفوذ' : 'تعرّف على الزعيم'}</button></div>`;
}
let lordC = 'sa', lordCity = 'riyadh';
const LORE_HINT = ['تُفتح حين تزور هذه المدينة (بعد المستوى 3)', 'تُفتح حين يرتاح لك: ثقة 10 أو هدية منك', 'تُفتح حين يصادقك: ثقة 35 أو عقد معه'];
function loreCard(id) {
  const L = S.learn, lo = E.LORE.BOSS_LORE[id], bs = S.bosses[id]; if (!L || !L.char || !lo || !bs) return '';
  const n = (L.lore || {})[id] || 0, sty = E.LORE.STYLES[lo.style];
  let h = `<div class="card lore" style="margin-bottom:12px"><h3 style="margin-top:0">📜 حكاية ${esc(bs.father ? bs.father.name : bs.name)} <span class="pill">${n} من 3</span></h3>`;
  for (let i = 0; i < 3; i++) h += i < n ? `<div class="chap"><b>${i + 1}. ${lo.ch[i].t}</b><p class="small" style="margin:4px 0 10px">${lo.ch[i].x}</p></div>` : `<div class="chap small muted">🔒 الفصل ${i + 1}: ${LORE_HINT[i]}</div>`;
  if (n >= 2) h += `<div class="small">👤 <b>${lo.trait}</b> · يحبّ: ${lo.likes} · يكره: ${lo.dislikes}</div>`;
  if (n >= 3) h += `<div class="small" style="margin-top:6px">💡 <b>${lo.tip}</b> <span class="muted">(${sty.name}: ${sty.effect})</span></div>`;
  return h + `</div>`;
}
function screenLords() {
  const c = S.cities[lordCity], bs = E.bossOf(S, lordCity), P = S.player, on = S.phase >= 2;
  let h = `<span class="title" style="margin:0">🤝 الزعماء والعقود</span><p class="small muted" style="margin:6px 0 10px">في كل سوق كبير تجّار يحكمه. كلما بنيت وبعت أكثر زاد نفوذك. عندما تتجاوز حصتك ${Math.round(E.BOSS_TAKE * 100)}٪ تخلعه وتصير حاكماً (ضريبة 20٪ لك، وشراء أرخص). وإن هبط نفوذك دون ${Math.round(E.BOSS_LOSE * 100)}٪ عاد إليه الحكم. وفي المقابل، يمكنك عقد شراكات معه.${on ? '' : ' <b>الأفعال تُفتح في الطور 2.</b>'}</p>`;
  h += countryChips(lordC, 'data-lc') + `<div class="chips" style="margin-bottom:10px">${citiesOf(lordC).map(id => { const b = E.bossOf(S, id); return `<button data-lcity="${id}" class="${id === lordCity ? 'on' : ''}">${b && b.ruler === 'player' ? '👑 ' : ''}${esc(cityName(id))}</button>`; }).join('')}</div>`;
  if (!bs) return h + '<div class="card">لا زعيم في هذه المدينة (مدينة أسستَها بنفسك).</div>';
  const sh = Math.round(E.bossShare(bs) * 100), mine = bs.ruler === 'player', ct = CD[c.country], pc = E.pactIn(S, lordCity);
  h += `<div class="card" style="margin-bottom:12px"><div class="row" style="margin:0"><span style="position:relative">${bossPic(c, mine) || '🧔'}${mine ? '<span style="position:absolute;top:-8px;inset-inline-end:-6px;font-size:28px">👑</span>' : ''}</span><div style="flex:1;min-width:200px"><h2 style="margin:0">${esc(bs.name)}</h2><div class="small muted">كبير تجّار ${esc(c.name)} · ${ct.flag} ${ct.name} · ${mine ? '<b>أنت الحاكم الآن</b>' : 'يحكم السوق'}</div></div></div>`;
  h += `<div class="grid g3" style="margin-top:10px"><div><div class="small muted">نفوذك في السوق</div><b class="num">${sh}٪</b>${bar(sh, 100, mine ? '' : 'gold')}<div class="small muted">نفوذك ${f1(bs.p)} مقابل نفوذه ${f1(bs.b)}</div></div><div><div class="small muted">ثقته بك</div><b>${trustWord(bs.trust)} <span class="num">(${Math.round(bs.trust)})</span></b>${bar(bs.trust + 100, 200, bs.trust < 0 ? 'red' : '')}</div><div><div class="small muted">ما يدخل نفوذك يومياً</div><div class="small">دكاكينك ${E.shopsOf(S, lordCity).length} · مخازنك ${E.whsOf(S, lordCity)} · مبيعاتك في السوق</div></div></div>`;
  if (c.sig && E.keyOn(S) && !mine) h += `<div class="kv" style="margin-top:8px"><span>${gi(c.sig)} حصتك اليومية من ${GD[c.sig].name} عنده</span><b class="num">${fmt(Math.floor(E.quotaPerDay(S, c)))} وحدة</b></div><div class="small muted">ثقته بك ترفعها. عقد التوريد يضربها ×1.6 والعقد الحصري ×2.</div>`;
  if (!mine) { const k = Math.round(150 * c.size * (c.country === S.home ? 1 : 1.4)); h += `<div class="row" style="margin-top:10px"><button class="sm pri" data-act="lobby" data-q="5" ${on ? '' : 'disabled'}>📣 ساهم في خدمات السوق +5 (${fmt(5 * k)})</button><button class="sm" data-act="lobby" data-q="20" ${on ? '' : 'disabled'}>+20 (${fmt(20 * k)})</button><button class="sm" data-act="gift" ${on ? '' : 'disabled'}>🎁 هدية (${fmt(Math.round(500 * c.size * (c.country === S.home ? 1 : 1.4)))})</button></div><div class="small muted">المساهمة في خدمات السوق ومرافقه تزيد نفوذك لكنها تُغضب الزعيم قليلاً. الهدية ترفع ثقته (مرة كل 10 أيام).</div>`; }
  else h += `<div class="small" style="margin-top:8px">فوائد الحكم: 20٪ من ضريبة مبيعاتك هنا تعود إليك، وشراؤك أرخص 3٪، وتُحسب لثروتك. حافظ على نفوذك فوق ${Math.round(E.BOSS_LOSE * 100)}٪.</div>`;
  h += `</div>`;
  h += bossAgeNote(lordCity) + loreCard(lordCity);
  if (!mine) {
    if (pc) {
      const d = E.PACTS[pc.type];
      h += `<div class="card" style="margin-bottom:12px"><h2 style="margin-top:0">${pactIc(pc.type)} ${d.name} <span class="pill good">قائم</span></h2><div class="small">${d.desc}</div><div class="kv"><span>المتبقي</span><b>${pc.left} من ${dayAr(pc.total)}</b></div>${bar(pc.total - pc.left, pc.total, 'gold')}<div class="kv"><span>الرسم اليومي</span><b>${fmt(pc.daily)} ريال</b></div>${pc.share ? `<div class="kv"><span>حصته من إيراد الدكاكين</span><b>${Math.round(pc.share * 100)}٪</b></div>` : ''}<div class="kv"><span>البند الجزائي عند الفسخ</span><b>${fmt(pc.penalty)} ريال</b></div><div class="row"><button class="sm" data-act="breakp">فسخ العقد</button></div></div>`;
    } else {
      h += `<h2>عروض ${esc(bs.name)}</h2><div class="grid g2">` + Object.keys(E.PACTS).map(k => {
        const d = E.PACTS[k], tm = E.pactTerms(S, lordCity, k), why = E.pactBlock(S, lordCity, k);
        return `<div class="card ${why ? 'locked' : ''}"><h3 style="margin-top:0">${pactIc(k)} ${d.name}${tm.negotiated ? ' <span class="pill good">مخفَّض 20٪</span>' : ''}</h3><div class="small">${d.desc}</div><div class="kv"><span>المدة</span><b>${dayAr(tm.days)}</b></div>${tm.daily ? `<div class="kv"><span>رسم يومي</span><b>${fmt(tm.daily)} ريال</b></div>` : ''}${tm.share ? `<div class="kv"><span>حصة الزعيم</span><b>${Math.round(tm.share * 100)}٪ من إيراد الدكاكين</b></div>` : ''}${tm.upfront ? `<div class="kv"><span>دفعة مقدّمة</span><b>${fmt(tm.upfront)} ريال</b></div>` : ''}<div class="kv"><span>بند جزائي</span><b>${fmt(tm.penalty)} ريال</b></div>${why ? `<div class="small dear" style="margin-top:6px">${esc(why)}</div>` : ''}<div class="row"><button class="sm pri" data-act="sign" data-k="${k}" ${why ? 'disabled' : ''}>✍️ وقّع العقد</button><button class="sm" data-act="nego" data-k="${k}" ${why || tm.negotiated ? 'disabled' : ''}>🗣️ فاوض</button></div></div>`;
      }).join('') + `</div>`;
    }
  }
  const all = P.pacts || [];
  h += `<h2>${uic('seal')}عقودي (${all.length} من ${E.MAX_PACTS})</h2>` + (all.length ? `<div class="grid g3">${all.map(x => `<div class="card"><b>${pactIc(x.type)} ${E.PACTS[x.type].name}</b><div class="small muted">${cityTag(x.city)} · ${esc(E.bossOf(S, x.city).name)}</div><div class="small">متبقٍ ${dayAr(x.left)}${x.daily ? ' · ' + fmt(x.daily) + '/يوم' : ''}</div></div>`).join('')}</div>` : '<div class="card small muted">لا عقود قائمة.</div>');
  const ruled = S.order.filter(id => E.bossOf(S, id) && E.bossOf(S, id).ruler === 'player');
  h += `<div class="small muted" style="margin-top:10px">أسواق تحكمها: ${ruled.length ? ruled.map(cityTag).join('، ') : 'لا شيء بعد'}.</div>`;
  return h;
}
function rentBox(c, full) {
  const bs = E.bossOf(S, c.id), canBoss = bs && bs.ruler !== 'player', n = E.shopsOf(S, c.id).length, ld = canBoss ? landlord : 'private';
  const rs = E.rentOf(S, c, 'stall', ld, n), rh = E.rentOf(S, c, 'shop', ld, n);
  return `<div class="rentbox"><div class="small muted" style="margin-top:8px">أو استأجر أولاً ثم اشترِ (40٪ مما دفعتَه من إيجار يُخصم من الثمن):</div>${canBoss ? `<div class="chips" style="margin:6px 0"><button data-act="landlord" data-g="private" class="${ld === 'private' ? 'on' : ''}">مؤجِّر عادي</button><button data-act="landlord" data-g="boss" class="${ld === 'boss' ? 'on' : ''}">من الزعيم ${esc(bs.name)}</button></div>` : ''}<div class="row"><button class="sm" data-act="rentshop" data-g="stall" ${full ? 'disabled' : ''}>بسطة (${fmt(rs)}/يوم)</button><button class="sm" data-act="rentshop" data-g="shop" ${full ? 'disabled' : ''}>دكان مؤجَّر (${fmt(rh)}/يوم)</button></div>${ld === 'boss' ? '<div class="small muted">إيجار الزعيم أرخص كلما زادت ثقته بك، وتأخّرك عنه يُغضبه.</div>' : ''}</div>`;
}
function shopHead(sh, i, c, pr) {
  const k = E.shKind(sh); if (k === 'own') return `<b>🏪 الدكان ${i + 1}</b> <span class="pill good">ملكك</span>`;
  const n = pr.shops.length, price = Math.round(1500 * Math.pow(1.5, n - 1) * (c.country === S.home ? 1 : 1.4)), disc = Math.min(E.RENT_CREDIT * (sh.rentPaid || 0), 0.6 * price);
  return `<b>${k === 'stall' ? '🧺 البسطة' : '🏪 الدكان'} ${i + 1}</b> <span class="pill">${k === 'stall' ? 'مؤجَّرة' : 'مؤجَّر'} · ${fmt(sh.rent)}/يوم${sh.landlord === 'boss' ? ' · من الزعيم' : ''}</span>${sh.arrears ? ' <span class="pill bad">إيجار متأخر ' + dayAr(sh.arrears) + '</span>' : ''}<div class="small muted">دفعتَ إيجاراً ${fmt(sh.rentPaid || 0)} ← خصم الشراء ${fmt(disc)}</div><div class="row" style="margin:4px 0">${k === 'stall' ? '<button class="sm" data-act="upstall" data-s="' + sh.id + '">ارتقِ لدكان</button>' : ''}<button class="sm pri" data-act="buyshop" data-s="${sh.id}">اشترِ (${fmt(price - Math.round(disc))})</button><button class="sm" data-act="vacate" data-s="${sh.id}">اترك المكان</button></div>`;
}
// بطاقة مدير أعمال المدينة
function insCard(c) {
  const pr = S.player.props[c.id]; if (!pr || !(pr.shops.length || S.player.factories.some(f => f.city === c.id))) return '';
  const on = E.insOn(S, c.id), prem = E.insPrem(S, c.id), T = S.player.tk || { pool: 0, paid: 0, got: 0, back: 0, claims: 0 };
  return `<div class="card insc"><h3 style="margin:0 0 4px">${ti('ins_factory')} صندوق التكافل · ${esc(c.name)} ${on ? '<span class="pill good">مشترك</span>' : '<span class="pill">غير مشترك</span>'}</h3><div class="small muted">تتبرع ${fmt(prem)} ريال يومياً لصندوق تعاوني مع تجار السوق (يقتطع المشغّل ${Math.round(E.TK.wakeel * 100)}٪ أجراً معلوماً). يعوّضك الصندوق عن نحو ${Math.round(E.TK.cover * 100)}٪ من خسارة الحريق، ويسندك عند انهيار مصنعك فيرتفع ثمنه الإجباري، لكن بحدّ نصف رصيده فالتعويض غير مضمون كله. ويردّ فائضه على المشاركين كل ${dayAr(E.TK.cycle)}.</div><div class="small">رصيد الصندوق <b class="num">${fmt(Math.round(T.pool))}</b> · تبرعاتك ${fmt(Math.round(T.paid))} · تعويضاتك ${fmt(Math.round(T.got))} · فوائض عادت إليك ${fmt(Math.round(T.back))}</div><div class="row"><button class="sm ${on ? '' : 'pri'}" data-act="insure" data-cid="${c.id}" data-on="${on ? 0 : 1}">${on ? 'اخرج من الصندوق' : 'اشترك في الصندوق'}</button></div></div>`;
}
function mgrCard(c) {
  const pr = S.player.props[c.id]; if (!pr || !pr.shops.length) return '';
  const m = pr.mgr, as = E.assetsIn(S, c.id);
  if (!m) return `<div class="card mgr"><h3 style="margin:0 0 4px">${ti('manager')} مدير أعمال ${esc(c.name)}</h3><div class="small muted">يدير إعدادات المصانع (بيع فوري، حدّ الرصيد، أعلى سعر مواد). المبتدئ يهدر 10٪ من المواد، والخبير يرفع الجودة 3٪، وإن لم تراجع حساباته ${dayAr(E.MGR_AUDIT)} قد يختلس.</div><div class="row">${[1, 2, 3].map(lv => `<button class="sm" data-act="hiremgr" data-c="${c.id}" data-lv="${lv}" ${S.player.gold < E.MGR[lv].wage * 3 ? 'disabled' : ''}>${E.MGR[lv].name} (${E.MGR[lv].wage}/يوم · يدير ${E.MGR[lv].cap} أصول)</button>`).join('')}</div></div>`;
  const info = E.MGR[m.lv], over = as > info.cap, ad = S.day - (m.audit == null ? m.since : m.audit);
  return `<div class="card mgr"><h3 style="margin:0 0 4px">${ti('manager')} ${info.name} <span class="pill ${over ? 'bad' : 'good'}">${as} من ${info.cap} أصول</span></h3>${over ? '<div class="qnote">الأصول أكثر من طاقته: أوقف مزاياه وزاد هدره. رقِّه أو قلّل الأصول.</div>' : ''}<div class="small muted">أجره ${info.wage} يومياً · آخر مراجعة قبل ${dayAr(ad)}${ad >= E.MGR_AUDIT ? ' <b class="dear">(تأخرت المراجعة)</b>' : ''}</div><div class="row"><button class="sm pri" data-act="auditmgr" data-c="${c.id}">راجع حساباته</button>${m.lv < 3 ? `<button class="sm" data-act="hiremgr" data-c="${c.id}" data-lv="${m.lv + 1}">رقِّه إلى ${E.MGR[m.lv + 1].name}</button>` : ''}<button class="sm" data-act="firemgr" data-c="${c.id}">سرّحه</button></div></div>`;
}
// بطاقة مصنع من مصانعك: الجودة والصحة والإعدادات
function factoryRow(f) {
  const rc = E.RECIPES[f.recipe], c = S.cities[f.city], ab = E.isAbroad(f), pr = S.player.props[f.city];
  if (!ab) return `<div class="itemrow"><span>${gi(rc.out)} ${rc.name} — ${cityTag(f.city)}</span><span class="spacer"></span><span class="pill good">محلي · أصلي</span><b>المستوى ${f.level}</b></div>`;
  const q = Math.round(E.factoryQual(S, f) * 100), hp = f.hp == null ? 100 : Math.round(f.hp), mg = pr && E.mgrOk(S, f.city, pr), set = f.set || { minBal: 0, maxBuy: 1.3, sell: 'hold' };
  let h = `<div class="card fact"><div class="row" style="margin:0"><b>${gi(rc.out)} ${rc.name} — ${cityTag(f.city)}</b><span class="pill">المستوى ${f.level}</span><span class="pill">صنعة محلية ${q}٪</span></div>`;
  h += `<div class="small">${ti(hp < 50 ? 'factory_worn' : 'factory_ok')} الصحة <b class="num">${hp}</b> من 100${S.day - (f.since || 0) < E.FACT_HP.grace ? ' · <span class="muted">مهلة الشهر الأول</span>' : ''}</div>${bar(hp, 100, hp < 40 ? 'red' : hp < 70 ? 'gold' : '')}`;
  if (f.crisis) { const fine = Math.round(E.factoryValue(f) * E.FACT_HP.rescue), left = Math.max(0, E.FACT_HP.crisis - (S.day - f.crisis.day)); h += `<div class="qnote">انهار! الإنتاج متوقف. أنقذه خلال ${dayAr(left)} بغرامة ${fmt(fine)} وإلا بِيع بنحو ${Math.round(E.FACT_HP.forced * 100)}٪ من قيمته.</div><div class="row"><button class="sm pri" data-act="rescuefact" data-i="${f.id}" ${S.player.gold < fine ? 'disabled' : ''}>أنقذه (${fmt(fine)})</button></div></div>`; return h; }
  h += `<div class="small muted">أنتج ${fmt(Math.floor(f.made || 0))} وحدة${f.sold ? ' · باع ' + fmt(Math.floor(f.sold)) + ' بصافي ' + fmt(Math.round(f.rev || 0)) : ''}${f.late ? ' · <b class="dear">أجور متأخرة ' + dayAr(f.late) + '</b>' : ''}</div>`;
  if (mg) h += `<div class="row small" style="align-items:center"><span>بيع المنتج:</span><select class="msel" data-fset="sell" data-i="${f.id}"><option value="hold" ${set.sell === 'hold' ? 'selected' : ''}>احتفظ به</option><option value="now" ${set.sell === 'now' ? 'selected' : ''}>بِع فوراً</option></select><span>أدنى رصيد:</span><select class="msel" data-fset="minBal" data-i="${f.id}">${[0, 2000, 5000, 20000, 100000].map(v => `<option value="${v}" ${set.minBal === v ? 'selected' : ''}>${fmt(v)}</option>`).join('')}</select><span>أعلى سعر مواد:</span><select class="msel" data-fset="maxBuy" data-i="${f.id}">${[0.8, 1, 1.3, 1.6, 2].map(v => `<option value="${v}" ${Math.abs(set.maxBuy - v) < 0.01 ? 'selected' : ''}>${Math.round(v * 100)}٪ من المرجعي</option>`).join('')}</select></div>`;
  else h += `<div class="small muted">عيّن مديراً للمدينة ليشغّل البيع الفوري وحدّ الرصيد وأعلى سعر للمواد.</div>`;
  return h + '</div>';
}
function farmCard(c) {
  const pr = S.player.props[c.id], f = E.farmOf(S, c.id);
  if (S.phase < E.FARM_PHASE) return `<div class="card locked" style="margin-top:10px"><h3>🌾 المزرعة <span class="pill">🔒 الطور ${E.FARM_PHASE}</span></h3><div class="small muted">تربية المواشي وتكاثرها، وصوف وأجبان وبيض، ولحم مجفف. تُفتح في الطور ${E.FARM_PHASE} (صاحب مصانع).</div></div>`;
  if (!pr || !pr.shops.length) return '';
  const fc = Math.round(E.FARM_COST * (c.country === S.home ? 1 : 1.4));
  if (!f) return `<div class="card" style="margin-top:10px"><h3>🌾 المزرعة</h3><div class="small muted">ترعى فيها مواشيك وتتكاثر، وتُنتج صوفاً وجبناً وبيضاً تذهب إلى مخزنك. المرعى حسب البلد (مصر والهند أخصب من الجزيرة).</div><div class="row"><button class="sm pri" data-act="buildfarm" ${S.player.gold < fc ? 'disabled' : ''}>ابنِ مزرعة (${fmt(fc)})</button></div></div>`;
  const cap = E.farmCap(S, c.id), u = E.farmUnits(f), cover = E.farmCover(S, c.id), need = E.farmerNeed(S, c.id), cr = main(), here = cr.city === c.id && cr.left === 0;
  const gl = Object.keys(E.BREED).filter(g => (f.herd[g] || 0) >= 1 || E.youngOf(f, g) >= 1), upc = Math.round(E.FARM_UP * f.level * (c.country === S.home ? 1 : 1.4));
  let perDay = {}; gl.forEach(g => { const pd = E.PRODUCT[g]; if (pd) { const a = f.herd[g] || 0, x = E.hxOf(f, g), h = pd[2] ? Math.max(0, a - Math.min(x.m, a)) : a; perDay[pd[0]] = (perDay[pd[0]] || 0) + h * pd[1] * Math.min(1, cover); } });
  let h = `<div class="card farm" style="margin-top:10px"><h3>🌾 المزرعة <span class="pill">مستوى ${f.level}</span></h3><div class="small">السعة: <b class="num">${f1(u)}</b> من <b class="num">${cap}</b> وحدة · مزارعون: <b class="num">${f1(Math.min(need, E.staffOf(S, c.id).filter(w => w.role === 'farmer').length))}</b> من <b class="num">${need}</b> · إيجار الأرض والصيانة ${E.FARM_UPKEEP * f.level}/يوم</div>${bar(u, Math.max(1, cap), u > cap * 0.95 ? 'red' : '')}${cover < 1 ? '<div class="qnote">نقص المزارعين: التكاثر والإنتاج أقل والنفوق أعلى</div>' : ''}`;
  h += Object.keys(perDay).length ? `<div class="small muted">إنتاج اليوم المتوقع إلى مخزنك: ${Object.keys(perDay).map(g => gi(g) + ' ' + GD[g].name + ' ' + f1(perDay[g])).join(' · ')}</div>` : '';
  if (f.lost > 0) h += `<div class="qnote">ضاع ${Math.floor(f.lost)} من المنتجات لأن مخزنك ممتلئ</div>`;
  gl.forEach(g => { const a = Math.floor(f.herd[g] || 0), m = Math.min(a, Math.floor(E.malesOf(f, g))), y = Math.floor(E.youngOf(f, g));
    h += `<div class="itemrow" style="flex-wrap:wrap"><span>${gi(g)} <b>${GD[g].name}</b>: ${a} (ذكور ${m} · إناث ${a - m})${y ? ` + ${y} صغيراً` : ''}${pedTag(f, g)}</span><span class="spacer"></span>${here && a >= 1 ? `<button class="sm" data-act="farmout" data-g="${g}" data-q="${a}">أخرج للقافلة</button>` : ''}${a >= 1 ? `<button class="sm" data-act="farmsell" data-g="${g}" data-q="${a}">بِع البالغة</button>` : ''}${y >= 1 ? `<button class="sm" data-act="farmsellyoung" data-g="${g}" data-q="${y}">بِع الصغار (نصف السعر)</button>` : ''}${E.MEAT[g] && a >= 1 ? `<button class="sm" data-act="slaughter" data-g="${g}" data-q="${Math.min(a, 5)}">اذبح ${Math.min(a, 5)} (لحم مجفف)</button>` : ''}</div>`; });
  if (!gl.length) h += '<div class="small muted">المزرعة فارغة. اشترِ مواشي للقطيع أو الحمولة، ثم «ضعها في المزرعة» وقافلتك هنا.</div>';
  h += pairBox('farm', c.id, f);
  if (here) { const mine = Object.keys(E.BREED).filter(g => Math.floor((GD[g].hu ? (cr.herd || {})[g] : cr.cargo[g]) || 0) >= 1); h += mine.length ? `<div class="row small" style="margin-top:6px"><b>من قافلتك:</b>${mine.map(g => { const n = Math.floor(GD[g].hu ? cr.herd[g] : cr.cargo[g]); return `<button class="sm pri" data-act="farmin" data-g="${g}" data-q="${n}">ضع ${n} ${GD[g].name} في المزرعة</button>`; }).join('')}</div>` : ''; }
  h += `<div class="row" style="margin-top:8px">${E.staffOf(S, c.id).length || true ? '<button class="sm" data-act="hirestaff" data-g="farmer">+ مزارع</button>' : ''}${f.stable ? '' : `<button class="sm" data-act="buildstable" ${S.player.gold < Math.round(2500 * (c.country === S.home ? 1 : 1.4)) ? 'disabled' : ''}>إسطبل (${fmt(Math.round(2500 * (c.country === S.home ? 1 : 1.4)))})</button>`}${c.makes.includes('horse') ? `<button class="sm" data-act="buystud" ${S.day - (f.studDay == null ? -999 : f.studDay) < 60 ? 'disabled' : ''}>فحل أصيل (${fmt(Math.round(E.unitPrice(c, 'horse') * 5))})</button>` : ''}<button class="sm" data-act="upfarm" ${f.level >= E.FARM_MAXLV || S.player.gold < upc ? 'disabled' : ''}>${f.level >= E.FARM_MAXLV ? 'أعلى مستوى' : 'وسّع المزرعة (' + fmt(upc) + ')'}</button></div></div>`;
  h += butcherCard(c, pr, f);
  return h;
}
// الملحمة: تذبح من المزرعة وتبيع اللحم الطازج يومياً بعلاوة، وما لم يُبَع يفسد
function butcherCard(c, pr, f) {
  const bc = Math.round(E.BUTCHER_COST * (c.country === S.home ? 1 : 1.4)), b = pr.butcher;
  if (!b) return `<div class="card butcher" style="margin-top:10px"><h3>${ti('butcher')} الملحمة</h3><div class="small muted">تذبح من مزرعتك وتبيع <b>لحماً طازجاً</b> في السوق بسعر أعلى من المجفف، لكنه يفسد ${Math.round(GD.meat.spoil * 100)}٪ كل يوم فاذبح بقدر ما تبيع.</div><div class="row"><button class="sm pri" data-act="buildbutcher" ${S.player.gold < bc ? 'disabled' : ''}>افتح ملحمة (${fmt(bc)})</button></div></div>`;
  const meat = Math.floor(pr.store.meat || 0), gl = Object.keys(E.MEAT).filter(g => Math.floor(f.herd[g] || 0) >= 1 && !(E.spOf(g) === 'horse'));
  const ym = g => E.MEAT[g] * E.hyMul(f, g, 'meat') * E.FRESH_X;
  let h = `<div class="card butcher" style="margin-top:10px"><h3>${ti('butcher')} الملحمة <span class="pill good">تبيع حتى ${E.BUTCHER_DAY * b.lv} يومياً</span></h3><div class="small">${gi('meat')} لحم طازج في مخزنك: <b class="num">${fmt(meat)}</b> · سعره اليوم ${f1(E.unitPrice(c, 'meat') * E.BUTCHER_PREM)} · بعتَ إجمالاً <b class="num">${fmt(Math.floor(b.sold || 0))}</b> بصافي <b class="num">${fmt(Math.round(b.rev || 0))}</b></div>`;
  if (meat > E.BUTCHER_DAY * b.lv * 2) h += `<div class="qnote">عندك أكثر مما تبيع الملحمة في يومين: سيفسد الفائض.</div>`;
  h += gl.length ? gl.map(g => { const a = Math.floor(f.herd[g] || 0), n = Math.max(1, Math.min(a, 5)); return `<div class="itemrow" style="flex-wrap:wrap"><span>${gi(g)} ${GD[g].name} (${a}) ← <b>${f1(ym(g))}</b> لحم للرأس</span><span class="spacer"></span><button class="sm" data-act="cutmeat" data-g="${g}" data-q="${n}">اذبح ${n} للملحمة</button></div>`; }).join('') : '<div class="small muted">لا مواشٍ بالغة في المزرعة لتذبحها.</div>';
  return h + '</div>';
}
function staffCard(c) {
  const sh = E.shopsOf(S, c.id).length, wh = E.whsOf(S, c.id); if (!sh && !wh) return '';
  const st = E.staffOf(S, c.id), nS = E.sellerNeed(S, c.id), pts = E.sellerPts(S, c.id), sf = E.sellFactor(S, c.id), kH = E.keeperHave(S, c.id), kN = E.keeperNeed(S, c.id), pool = E.hirePool(S, c.id), full = pts + 1e-9 >= nS && st.filter(w => w.role === 'keeper').length >= kN;
  const row = w => `<div class="kv"><span>${E.WK[w.role].name} · ${E.WK_LV[E.wkLv(w)]}${w.late ? ' <span class="pill bad">أجره متأخر</span>' : ''}</span><span>${w.free > S.day ? `<span class="pill good">مجاناً ${dayAr(w.free - S.day)}</span>` : fmt(E.wkWage(S, c, w)) + ' ر.س/يوم'} <button class="sm" data-act="firestaff" data-s="${w.id}">سرّح</button></span></div>`;
  return `<div class="card staff" style="margin-top:10px"><h3>👤 طاقم ${esc(c.name)}</h3><div class="small">بائعون: <b class="num">${f1(pts)}</b> من <b class="num">${nS}</b> مطلوبة · أمناء مخازن: <b class="num">${kH}</b> من <b class="num">${kN}</b> · عمّال متاحون في المدينة: <b class="num">${pool}</b></div>${bar(Math.min(pts, nS), Math.max(1, nS), sf < 1 ? 'red' : '')}${sh && sf < 1 ? `<div class="qnote">${sf <= 0 ? 'دكاكينك مغلقة بلا بائع' : 'دكاكينك تبيع ' + Math.round(sf * 100) + '٪ فقط لنقص البائعين'}</div>` : ''}${kN > kH ? `<div class="qnote">مخزن بلا أمين يتناقص مخزونه كل يوم. الأمين يُوظَّف من هنا: <button class="sm pri" data-act="hirestaff" data-g="keeper" ${pool < 1 ? 'disabled' : ''}>+ وظّف أمين مخزن</button></div>` : ''}${st.map(row).join('') || '<div class="small muted">لا عمّال بعد.</div>'}<div class="row" style="margin-top:8px"><button class="sm pri" data-act="hirefill" ${full || pool < 1 ? 'disabled' : ''}>وظّف حتى اكتمال الحاجة</button>${sh ? '<button class="sm" data-act="hirestaff" data-g="seller" ' + (pool < 1 ? 'disabled' : '') + '>+ بائع</button>' : ''}${wh ? '<button class="sm" data-act="hirestaff" data-g="keeper" ' + (pool < 1 ? 'disabled' : '') + '>+ أمين مخزن</button>' : ''}</div><div class="small muted">العامل الجديد مبتدئ، ويرتقي إلى ماهر بعد 40 يوماً وإلى خبير بعد 120 يوماً (أجره يزيد وبيعه أفضل). الأجر المتأخر يُبطئه ثم يُغادر.</div></div>`;
}
/* «جهّز دكانك»: أربع خطوات بلغة بسيطة، الأولى غير المنجزة عليها زرها. تختفي إلى سطر صغير حين تكتمل */
function shopSetupCard(c, shops, pr) {
  const nS = E.sellerNeed(S, c.id), pts = E.sellerPts(S, c.id), first = shops[0];
  const hasItems = shops.some(sh => sh.items.length), stocked = shops.some(sh => sh.items.some(it => (pr && pr.store[it.g] >= 1) || it.auto));
  const steps = [
    [shops.length >= 1, 'ابنِ دكاناً', 'مكان تبيع منه لأهل المدينة.', `<button class="sm pri" data-act="bshop" ${S.player.gold < E.shopCost(S, c) ? 'disabled' : ''}>ابنِ دكاناً (${fmt(E.shopCost(S, c))})</button>`],
    [shops.length >= 1 && pts + 1e-9 >= nS, 'وظّف بائعاً', 'هو الذي يبيع عنك كل يوم، وأنت لا تبيع بيدك. ويبيع حتى وأنت مسافر.', `<button class="sm pri" data-act="hirestaff" data-g="seller">+ وظّف بائعاً واحداً</button> <span class="small muted">بائعون: ${f1(pts)} من ${nS} مطلوبة</span>`],
    [hasItems, 'اختر سلعة وسعرها', 'السعر نسبة من السعر المرجعي. سعر السوق هو سعر الجملة، وسعر الدكان أعلى لأن الناس تشتري منه: ابدأ بـ 180٪. إن لم تبع شيئاً فاخفضه، وإن نفد المخزن كل يوم فارفعه.', first ? `<button class="sm pri" data-act="sqadd" data-s="${first.id}">أضف سلعة مناسبة</button>` : ''],
    [stocked, 'غذِّ المخزن', 'الدكان يبيع مما في المخزن فقط. فعّل «التعبئة الآلية» ليشتري لك البائع عند الرخص، أو أودع بضاعة من قافلتك.', '<button class="sm pri" data-act="sqauto">فعّل التعبئة الآلية</button>'],
  ];
  const nextI = steps.findIndex(x => !x[0]);
  if (nextI < 0) return `<div class="small muted" style="margin:6px 0">✅ دكانك جاهز. اقرأ «تقرير البائع» تحت كل سلعة ليخبرك ماذا حدث وما تغيّره.</div>`;
  return `<div class="card setup" style="margin:10px 0"><h3 style="margin:0 0 6px">جهّز دكانك في 4 خطوات</h3>${steps.map((x, i) => `<div class="stp ${x[0] ? 'done' : i === nextI ? 'now' : ''}"><span class="sn">${x[0] ? '✅' : i + 1}</span><div style="flex:1"><b>${x[1]}</b><div class="small muted">${x[2]}</div>${i === nextI ? `<div style="margin-top:4px">${x[3]}</div>` : ''}</div></div>`).join('')}</div>`;
}
/* تقرير البائع: سطر لكل سلعة بسبب الحالة اليوم ومعه إصلاح بنقرة */
function shopReportLine(sh, r) {
  const ico = r.st === 'ok' || r.st === 'new' || r.st === 'soon' ? '✅' : '⚠️';
  const btn = r.fix === 'price' ? `<button class="sm pri" data-act="srprice" data-s="${sh.id}" data-g="${r.g}" data-to="${r.to}">اجعله ${r.to}٪</button>` : r.fix === 'auto' ? `<button class="sm pri" data-act="srauto" data-s="${sh.id}" data-g="${r.g}">فعّل التعبئة الآلية</button>` : r.fix === 'hire' ? '<button class="sm pri" data-act="hirefill">وظّف بائعاً</button>' : '';
  return `<div class="srep ${r.st}"><span>${ico}</span><span style="flex:1">${r.msg}</span>${btn}</div>`;
}
function screenEstate() {
  if (S.phase < 2) return teaser(2, '🏬', 'الدكاكين والمخازن', ['ابنِ دكاكين في مدن أي دولة وبِع فيها سلعك بسعرك', 'السكان يشترون منها يومياً بحسب طبقاتهم وسعرك', 'كل دكان جديد يفتح لك مخزناً إضافياً']);
  const P = S.player, cities = citiesOf(estC), c = S.cities[estCity] || S.cities[cities[0]], ct = CD[c.country];
  const shops = E.shopsOf(S, c.id), whs = E.whsOf(S, c.id), pr = P.props[c.id], cap = E.storeCap(S, c.id), ld = E.storeLoad(S, c.id), lim = E.shopLimit(c);
  let h = `${pic('scene/shop', 'banner', 'الدكان')}<p class="sub">ابنِ دكاكين في مدن العالم. كل دكان جديد يتيح لك مخزناً إضافياً، والبيع آلي من المخزن بالسعر الذي تحدده.</p>${countryChips(estC, 'data-ec')}<div class="chips" style="margin-bottom:12px">${cities.slice().sort((a, b) => (b === main().city && main().left === 0) - (a === main().city && main().left === 0)).map(id => `<button data-estcity="${id}" class="${id === c.id ? 'on' : ''}">${id === main().city && main().left === 0 ? '🐪 ' : ''}${esc(cityName(id))}${E.shopsOf(S, id).length ? ' 🏪' + E.shopsOf(S, id).length : ''}</button>`).join('')}</div>`;
  h += `<div class="card"><div class="row" style="margin:0"><span class="title" style="margin:0">${esc(c.name)}</span><span class="cbadge" style="background:${ct.color}">${ct.flag} ${ct.name}</span><span class="pill">سكان ${fmt(E.popTotal(c))}</span><span class="pill">ضريبة ${Math.round(c.tax * 100)}٪</span>${c.country !== S.home ? '<span class="pill bad">البناء هنا أغلى ×1.4</span>' : ''}</div>
  <div class="grid g3" style="margin-top:10px"><div class="card"><h3>🏪 الدكاكين ${shops.length} / ${lim}</h3>${bar(shops.length, lim)}<div class="row"><button class="pri" data-act="bshop" ${shops.length >= lim ? 'disabled' : ''}>ابنِ دكاناً (${fmt(E.shopCost(S, c))})</button></div>${rentBox(c, shops.length >= lim)}</div>
  <div class="card"><h3>📦 المخازن ${whs} / ${shops.length}</h3>${bar(whs, Math.max(1, shops.length))}<div class="small muted">كل دكان يفتح مخزناً واحداً.</div><div class="row"><button class="pri" data-act="bwh" ${whs >= shops.length ? 'disabled' : ''}>ابنِ مخزناً (${fmt(E.whCost(S, c))})</button></div></div>
  <div class="card"><h3>🧺 التخزين ${fmt(ld)} / ${fmt(cap)}</h3>${bar(ld, Math.max(1, cap), ld > cap * 0.9 ? 'red' : '')}<div class="small muted">دخل اليوم: <b class="num">${fmt(pr ? pr.today || 0 : 0)}</b></div></div></div>`;
  { const pn = shops.length ? E.shopPnl(S, c.id, 7) : null; if (pn) h += `<div class="card pnl" style="margin:8px 0"><b>ربح الدكان</b> <span class="small muted">آخر ${dayAr(pn.days)}</span><div class="kv"><span>الدخل اليومي (بعد الضريبة)</span><b class="num">${fmt(Math.round(pn.rev))}</b></div><div class="kv"><span>صافي الربح اليومي (بعد تكلفة البضاعة والأجور والصيانة)</span><b class="num ${pn.net >= 0 ? 'cheap' : 'dear'}">${pn.net >= 0 ? '+' : ''}${fmt(Math.round(pn.net))}</b></div><div class="small muted">≈ ${pn.net >= 0 ? '+' : ''}${fmt(Math.round(pn.net * 30))} ريال في الشهر</div></div>`; }
  h += shopSetupCard(c, shops, pr);
  { const lowSell = shops.length && E.sellerPts(S, c.id) + 1e-9 < E.sellerNeed(S, c.id), lowKeep = whs && E.keeperHave(S, c.id) < E.keeperNeed(S, c.id), setupOpen = !shops.length || lowSell || !shops.some(sh => sh.items.length);
    h += `<div class="howtos">${howto('shop', setupOpen)}${shops.some(sh => E.shKind(sh) !== 'own') || !shops.length ? howto('stall', false) : ''}${howto('warehouse', !!lowKeep)}${howto('staff', !!lowSell)}</div>`; }
  h += staffCard(c);
  h += (S.phase >= E.FARM_PHASE ? howto('farm', !E.farmOf(S, c.id)) + facilityReportHTML('farm', c.id) : '') + farmCard(c);
  if (!shops.length) h += `<p class="muted">لا عقارات لك في ${esc(c.name)} بعد. الدكان الأول يعطيك أيضاً أسعاراً حيّة في هذه المدينة.</p>`;
  shops.forEach((sh, i) => {
    h += `<div class="shopbox"><div class="row" style="margin:0;align-items:flex-start;flex-wrap:wrap">${shopHead(sh, i, c, pr)}<span class="small muted">يتسع لـ ${E.shItemsMax(sh)} سلع</span></div>`;
    const rep = E.shopReport(S, c.id, sh.id);
    if (sh.items.length) h += '<div class="small" style="margin:6px 0 2px"><b>تقرير البائع</b></div>';
    sh.items.forEach(it => {
      const G = GD[it.g], mp = E.unitPrice(c, it.g), ref = E.refPrice(c, it.g), have = Math.floor(pr.store[it.g] || 0);
      h += `<div class="itemrow"><span style="font-size:22px">${gi(G.id)}</span><b>${G.name}</b><span class="small muted">سوق ${f1(mp)} · مخزن ${have}</span><span class="spacer"></span><label class="small">السعر ٪ <input type="number" id="ip${sh.id}_${it.g}" value="${Math.round(it.price * 100)}" min="50" max="300" step="5"></label><label class="small"><input type="checkbox" id="ia${sh.id}_${it.g}" ${it.auto ? 'checked' : ''}> تعبئة آلية</label><label class="small"><input type="checkbox" id="ic${sh.id}_${it.g}" ${it.carry ? 'checked' : ''}> يستلم من قافلتي</label><button class="sm pri" data-act="isave" data-s="${sh.id}" data-g="${it.g}">حفظ</button><button class="sm" data-act="irm" data-s="${sh.id}" data-g="${it.g}">إزالة</button><span class="small ${it.lastSold > 0.05 ? 'cheap' : 'muted'}">بيع اليوم ${f1(it.lastSold || 0)} · إجمالي ${fmt(it.revenue || 0)}</span></div>`;
      const rp = rep.find(r => r.g === it.g); if (rp) h += shopReportLine(sh, rp);
    });
    if (sh.items.length < E.shItemsMax(sh)) h += `<div class="itemrow"><b class="small">أضف سلعة:</b><select id="ig${sh.id}">${GIDS.map(g => `<option value="${g}">${GD[g].icon} ${GD[g].name}</option>`).join('')}</select><label class="small">السعر ٪ <input type="number" id="ipn${sh.id}" value="180" min="50" max="300" step="5"></label><button class="sm pri" data-act="iadd" data-s="${sh.id}">أضف</button></div>`;
    if (E.shKind(sh) === 'own') h += `<div class="shup small"><b>تحسين الدكان:</b> ${Object.keys(E.SHOP_UP).map(k => { const lv = E.shUp(sh, k), cost = Math.round(E.SHOP_UP_COST[Math.min(lv, 1)] * (c.country === S.home ? 1 : 1.4)); return `<span class="chip2">${ti('shop_up_' + k)}${E.SHOP_UP[k].name} ${lv}/2 ${lv >= 2 ? '' : `<button class="sm" data-act="shopup" data-cid="${c.id}" data-s="${sh.id}" data-k="${k}" ${S.player.gold < cost ? 'disabled' : ''} title="${E.SHOP_UP[k].desc}">+ (${fmt(cost)})</button>`}</span>`; }).join(' ')}</div>`;
    h += `</div>`;
  });
  if (pr && (Object.keys(pr.store).some(g => pr.store[g] >= 1) || shops.length)) {
    const cr = main(), here = cr.city === c.id && cr.left === 0;
    h += `<h3 style="margin-top:12px">📦 محتوى المخزن</h3><div class="row small">${GIDS.filter(g => pr.store[g] >= 1).map(g => `<span class="pill">${gi(g)} ${GD[g].name}: ${Math.floor(pr.store[g])}</span>`).join('') || '<span class="muted">فارغ. أحضر بضاعة بالقافلة أو فعّل التعبئة الآلية.</span>'}</div>`;
    if (here) {
      const gs = GIDS.filter(g => pr.store[g] >= 1 || (cr.cargo[g] || 0) >= 1), roomS = g => Math.floor(E.storeRoom(S, c.id) / GD[g].w), roomC = g => Math.floor((E.capOfCar(cr) - E.loadOf(cr)) / GD[g].w);
      h += gs.map(g => { const inS = Math.floor(pr.store[g] || 0), inC = Math.floor(cr.cargo[g] || 0), mx = Math.max(1, inS, inC), q = clampQ(QS['st:' + g] == null ? 1 : QS['st:' + g], mx), upS = inC >= 1 && roomS(g) >= 1, upC = inS >= 1 && roomC(g) >= 1;
        return `<div class="card strow"><div class="row" style="margin:0"><span class="ic">${gi(g)}</span><b>${GD[g].name}</b><span class="small muted">في القافلة <b class="num">${inC}</b> · في المخزن <b class="num">${inS}</b></span></div>${stepper('st:' + g, q, mx)}<div class="row"><button class="sm pri" data-act="stow" data-g="${g}" ${upS ? '' : 'disabled'}>أودع ${q} في المخزن</button><button class="sm" data-act="unstow" data-g="${g}" ${upC ? '' : 'disabled'}>حمّل ${q} في القافلة</button><button class="sm" data-act="tostore" data-g="${g}" ${upS ? '' : 'disabled'}>أودع الكل</button><button class="sm" data-act="fromstore" data-g="${g}" ${upC ? '' : 'disabled'}>حمّل الكل</button></div>${!upS && inC >= 1 ? '<div class="qnote">المخزن ممتلئ</div>' : ''}${!upC && inS >= 1 ? '<div class="qnote">قافلتك ممتلئة</div>' : ''}</div>`; }).join('');
    } else h += `<p class="small muted">لتحميل المخزن أو إيداع البضاعة، يجب أن تكون قافلتك في ${esc(c.name)}.</p>`;
  }
  return h + `</div>`;
}

