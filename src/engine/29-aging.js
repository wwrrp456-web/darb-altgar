/* النصوص المعتمدة: docs/review/APPROVED_AGING_TEXTS.md، بلا إعادة صياغة. */
const LIFE_TEXTS = {
  "retirement": "يا بني، قطعتُ في دروب التجارة عمراً طويلاً، وخضتُ غمار الأسواق بين ربحٍ وعثار؛ فعلّمتني الأيامُ أن أثمن ما يجنيه التاجر ليس كثرة الدراهم، بل طيب السمعة وبركة الحلال.\nواليوم، أسلمك راية القافلة ومفاتيح الدكاكين، راجياً أن تواصل المسير بعزمٍ أشد وخلقٍ أرسخ؛ فاحفظ وصايا آبائك، واجعل تقوى الله بضاعتك الأولى في كل بيعٍ وشراء.",
  "waqf": "الوقف هو تحبيسُ أصلِ المال (كدكانٍ أو بستانٍ أو دار) والتبرّعُ بريعه ومنافعه لوجوه الخير والبر. وهو صدقةٌ جارية لا تباع ولا توهب ولا تورث، بل يستمر ثوابها لصاحبها بعد موته ما دامت العين قائمة. وقد قال النبي ﷺ: إذا مات الإنسان انقطع عنه عمله إلا من ثلاثة: إلا من صدقة جارية، أو علم ينتفع به، أو ولد صالح يدعو له (رواه مسلم).",
  "will": "الوصية هي تبرّع الإنسان بجزء من ماله لجهات الخير أو لغير الورثة، ويكون تنفيذها بعد وفاته. وقد حددها الشرع بما لا يزيد عن ثلث المال؛ لقول النبي ﷺ لسعد بن أبي وقاص رضي الله عنه: الثلث، والثلث كثير، إنك أن تذر ورثتك أغنياء خير من أن تذرهم عالة يتكففون الناس (متفق عليه). كما لا تجوز الوصية لأحد الورثة؛ لقوله ﷺ: إن الله قد أعطى كل ذي حق حقه فلا وصية لوارث (رواه أصحاب السنن وحسنه الترمذي).",
  "inheritance": "الميراث هو قسمة أموال التاجر وأملاكه بعد وفاته وتجهيزه وسداد ديونه وتنفيذ وصيته المعتبرة. وهو توزيعٌ رباني حكيم تولى الله تعالى بيانه في كتابه الكريم، ليعطي كل قريب نصيبه العادل دون زيادة أو حرمان.",
  "waqfConfirmed": "تم حبس الأصل وتسبيل المنفعة لوجه الله تعالى صدقةً جارية دائمة الأجر.",
  "willConfirmed": "تم قيد الوصية وحفظها في حدود الثلث الشرعي لتُنَفَّذ في وجوه البر.",
  "fatherFarewell": "استودعتُ الله تجارتك ومسيرتك يا بني، فكن أميناً في الكيل، سمحاً في البيع، باراً بالفقراء.",
  "fatigue": [
    "ثقلت خطاي يا بني وخبت قوة بدني، وما عدتُ أطيق وعثاء السفر وغبار القوافل كما عهدتني.",
    "شارفتُ على ختام شوطي في هذه الأسواق، وحسب الشيخ من دنياه أن يسلّم الأمانة لمن يحفظها.",
    "أستودعك اليوم حكمة السنين، فقد حان لراحلة عمك أن تحط رحالها وتستريح."
  ],
  "salemFarewell": "يا صاحب السوق ورفيق الدروب،\nما تركتك لقلة ود، وإنما هو أجلٌ أتى وأوان استراحة قد حان. صحبتك من أول درهم جنيته وأول قافلة أطلقتها، فرأيت فيك عزيمة التاجر النبيل وأمانة المسلم الصدوق.\nلا تغرنك كثرة الأرباح إن خالطتها شائبة، ولا يحزنك كساد يوم فإن الرزق مقسوم والبركة مع الصدق. تركت لك ابني ليكون عوناً وناصحاً على دربي، وأبقيت لكم وقفاً ينشر العلم ويغيث المحتاجين في هذه الحاضرة.\nاستودعكم الله الذي لا تضيع ودائعه، واذكروا عمكم بدعوة صالحة في مظان الإجابة.",
  "salemPassing": "انتقل إلى رحمة الله عمنا ومستشارنا الحكيم (سالم). إنا لله وإنا إليه راجعون؛ نسأل الله أن يغفر له، ويرفع درجاته في الصالحين، ويجعل ما بذله من علمٍ ونصحٍ ونفعٍ في موازين حسناته.",
  "salemLastWish": "وصيتي لكم حفظ الأمانة في المعاملات، والتسامح عند العثرات، والمسارعة إلى أداء حق الفقراء طيبةً بها نفوسكم.",
  "salemWaqf": "وقف عمّ سالم: مساهمةٌ خيرية جارية تستقطع (10%) من صافي أرباح دكانك الذي تخصصه، يُصرف ريعها دورياً لكفالة طلاب العلم والأيتام من أبناء التجار المتعثرين.",
  "salemWaqfAnnual": "أثمر وقف عمّ سالم هذا الحول مبلغ {amount} ريال من أرباح متجرك، جرى توزيعها بالكامل في وجوه البر.",
  "loyalBadge": "شارة وفيّ: وفاءً لذكرى الشيخ سالم، وعملاً بعهده في إعمار الوقف ونشر البركة.",
  "sonIntroduction": [
    "أنا عبد الله بن سالم، نشأت على موائد نصحه وتشربت أصول تجارته منذ صباي.",
    "جئتكم حاملاً وصية والدي وعهده في صحبة قوافلكم والوقوف إلى جواركم في الأسواق.",
    "لن تجدوا مني إلا الصدق والنصح الأمين الذي عهدتموه من أبي رحمه الله."
  ],
  "wisdom": [
    "أصل الربح يُبنى عند حسن الشراء، لا عند التعجل في البيع.",
    "التاجر السمح يربح القلوب قبل أن يربح الدراهم.",
    "درهمٌ حلال فيه بركة خيرٌ من ملء كيسٍ تعلوه الشبهات.",
    "احسب نفقات الدرب ومؤن الطريق قبل أن تفرح بفارق السعر.",
    "لا تضع بضاعتك كلها في مركب واحد، فالتنويع درع الأمان.",
    "لا تؤخر قضاء حقٍّ وأنت قادرٌ على وفائه؛ فالتسويف مع القدرة جورٌ يذهب بالمروءة وينزع الثقة.",
    "إخراج الزكاة نماءٌ للمال وحصنٌ له، وما طاب كسبُ تاجرٍ بمثل بذل الحقوق لأهلها.",
    "اذكر للمشتري ما في المتاع من نقصٍ دون مواربة؛ فوضوح المعاملة أرسخُ للبركة وأبقى للذكر الطيب.",
    "السيولة الراكدة كحملٍ ثقيل بلا مسير؛ اجعل مالك عاملاً بحكمة.",
    "السوق يتقلب بين رخاء وشدة، والحصيف من ادخر في زمن السعة."
  ],
  "heirWelcome": "أهلاً بك يا وريث الهمة والأمانة؛ يسعدني أن أسير معك على خطى آبائنا لنكمل قصة النجاح معاً.",
  "bossElder": [
    "أثقلت السنون كاهل كبير التجار، فبات يعتمد على ساعد ابنه الفتي في تصريف شؤون السوق.",
    "يقف الابن إلى جوار والده في الساحة، يتعلم منه خفايا الأسعار وحسن التدبير.",
    "أوكل القائد إلى نجله الإشراف على واردات القوافل ودفاتر الحسابات ليتمرس في القيادة.",
    "حين يمتزج حزم الشيوخ بنشاط الشباب، تزدهر المتاجر وتستقر المعاملات.",
    "يسلّم الجيل الراحل خبرة العقود لجيل المستقبل، لتبقى راية التجارة خفاقة في هذه الديار."
  ],
  "succession": "تولى الشاب {heirName} قيادة متجر والده في سوق {marketName}، معلناً بداية عهدٍ جديدٍ من النماء والنشاط.",
  "bossHeirMeeting": "مرحباً بكم في متجرنا؛ أسير على نهج والدي في الصدق ورعاية حقوق الشركاء والزبائن، ويدي ممدودة لكم بكل صفقةٍ طيبة."
};
/* انتقال الأمانة: النصوص في LIFE_TEXTS من المراجع حرفياً. لا وفاة للتاجر ولا قسمة ميراث عند تقاعده. */
const SALEM_PASSES_AGE = 62, HEIR_TRUST = 0.6, SALEM_WAQF_PCT = 0.10;
const BOSS_HEIRS = { riyadh: ['سعيد','ماجد الراجح'], jeddah: ['أحمد','أبي سالم البحّار'], hail: ['ناصر','شمّر الجمّال'], jazan: ['عامر','عيسى المهري'], mecca: ['محمد','عبدالعزيز المكّي'], medina: ['عبد الرحمن','إبراهيم المدني'], cairo: ['ظافر','منصور الأنصاري'], alex: ['عمر','سيد درويش الريّس'], aswan: ['حمود','صابر النوبي'], isfahan: ['آرش','بهرام التاجر'], shiraz: ['بهرام','كاوه'], tabriz: ['كاوه','آرش'], delhi: ['راجيش','ماهيش لال'], mumbai: ['ديباك','راجيش شاه'], kolkata: ['ماهيش','ديباك داس'], xian: ['تشن هاو','وانغ لي'], guangzhou: ['لين فاي','تشن هاو'], shanghai: ['وانغ لي','لين فاي'] };
const lifeOf = S => S.life || (S.life = {});
function agingMigrate(S) {
  if (!S.learn || !S.learn.char) return;
  const L = lifeOf(S);
  if ((S.legacy && S.legacy.retired) || ageOf(S) >= SALEM_PASSES_AGE) { if (!L.mentorSon) { L.mentorSon = true; L.passedAt = S.day; L.farewellSeen = true; } }
  checkLifeEvents(S);
}
function checkLifeEvents(S) {
  if (!S.learn || !S.learn.char) return;
  const L = lifeOf(S), age = ageOf(S); if (S.legacy && S.legacy.retired) return;
  if (age >= SALEM_PASSES_AGE && !L.mentorSon) { L.mentorSon = true; L.passedAt = S.day; L.pending = 'salem'; news(S, LIFE_TEXTS.salemPassing); interrupt(S, 'lifeSalem'); }
  if (!L.mentorSon && age >= 58) {
    L.fatigue = L.fatigue || [];
    for (const [i, at] of [58,60,61].entries()) if (age >= at && !L.fatigue.includes(i)) { L.fatigue.push(i); news(S, LIFE_TEXTS.fatigue[i]); }
  }
  if (age >= BOSS_ELDER_AGE && !L.bossElders) { L.bossElders = true; news(S, LIFE_TEXTS.bossElder[0]); }
  if (age >= RETIRE_AGE && !L.pending) { L.pending = 'retire'; interrupt(S, 'lifeRetire'); }
}
function lifeBooks(S) {
  return [S.life && S.life.salemWaqf, S.legacy && S.legacy.waqf].filter(w => w && w.type === 'shop');
}
function reserveWaqf(S, w) {
  const target = Math.max(0,w.net) * w.pct, delta = target - w.balance;
  if (delta > 0) { const n = Math.min(Math.max(0,S.player.gold),delta); S.player.gold -= n; w.balance += n; }
  else if (delta < 0) { S.player.gold -= delta; w.balance = target; }
}
function recordShopNet(S, city, shop, net) {
  for (const w of lifeBooks(S)) if (w.city === city && w.shop === shop.id) { w.net += net; reserveWaqf(S,w); }
}
function annualWaqf(S,w) {
  if (S.day - w.start < hawlLen(S,w.start)) return;
  const amount = Math.max(0,w.net) * w.pct, paid = Math.min(w.balance,amount);
  w.arrears += amount - paid; w.balance -= paid;
  if (paid > 0) { sink(S,'charity',paid); S.player.led.exp.charity = (S.player.led.exp.charity || 0) + paid; }
  w.hist.unshift({day:S.day,net:w.net,assessed:amount,paid,arrears:w.arrears});w.hist=w.hist.slice(0,20);
  if (w.salem && paid > 0) { news(S,LIFE_TEXTS.salemWaqfAnnual.replace('{amount}',fmtN(paid)),'good'); S.news[0].waqfPaid = paid; }
  w.start=S.day;w.net=0; // الرصيد غير المصروف يبقى حقيقياً في سجل الوقف.
}
function capitalWaqfDay(S,w) {
  const c=S.cities[w.city]; if(!c || !(w.capital > 0)) return;
  const prosperity=clamp(((c.pop[2]+c.pop[3])/popTotal(c))*2*.5+c.sat.food*.5,0,1);
  const gross=w.capital*(.0004+.0008*prosperity)*(c.ev&&c.ev.k==='war'?1.8:1)*(.5+rndB(S))*(S.awaySim?AWAY_YIELD:1);
  if(rndB(S)<FIN.mud.setback*(S.awaySim?AWAY_RISK:1)) { const loss=w.capital*FIN.mud.loss;w.capital-=loss;sink(S,'waqfInvestmentLoss',loss); }
  else {w.capital+=gross;fauc(S,'waqfInvestment',gross);}
  if(S.day-w.start<hawlLen(S,w.start))return;
  const paid=Math.max(0,w.capital-w.principal);w.capital-=paid;if(paid>0)sink(S,'charity',paid);
  w.hist.unshift({day:S.day,net:w.capital+paid-w.principal,assessed:paid,paid,arrears:0});w.hist=w.hist.slice(0,20);w.start=S.day;
}
function agingDay(S) {
  if(!S.learn||!S.learn.char)return;
  checkLifeEvents(S);
  for(const w of lifeBooks(S)) annualWaqf(S,w);
  const w=S.legacy&&S.legacy.waqf;if(w&&w.type==='capital')capitalWaqfDay(S,w);
}
function newShopWaqf(S,city,shop,pct,salem) {return {type:'shop',city,shop,pct,salem:!!salem,start:S.day,net:0,balance:0,arrears:0,hist:[]};}
function setSalemWaqf(S,city,shopId) {
  const L=lifeOf(S),sh=shopsOf(S,city).find(x=>x.id===+shopId);
  if(!L.mentorSon)return NO('لم يُفتح هذا الخيار بعد');
  if(L.salemWaqf)return NO('الدكان المخصص محفوظ في سجل الوقف');
  if(!sh||shKind(sh)!=='own'||sh.endowed)return NO('اختر دكاناً تملكه وغير موقوف');
  L.salemWaqf=newShopWaqf(S,city,sh.id,SALEM_WAQF_PCT,true);L.loyal=true;return OK(LIFE_TEXTS.loyalBadge);
}
function payWaqfArrears(S,which) {
  const w=which==='salem'?S.life&&S.life.salemWaqf:S.legacy&&S.legacy.waqf;
  if(!w||!(w.arrears>0))return NO('لا مبلغ متأخر');
  const paid=pPay(S,'charity',w.arrears,true);w.arrears-=paid;return paid>0?OK('صُرف '+fmtN(paid)+' ريال'):NO('لا رصيد كافٍ');
}
function acknowledgeLife(S) {
  const L=lifeOf(S);if(L.pending!=='salem')return NO('لا رسالة معلّقة');
  L.farewellSeen=true;delete L.pending;checkLifeEvents(S);return OK(LIFE_TEXTS.sonIntroduction[0]);
}
function retirementSummary(S) {
  const P=S.player;
  return {name:P.name||LS.CHARS.find(x=>x.id===S.learn.char)?.name||'التاجر',age:Math.floor(ageOf(S)),wealth:netWorth(S),shops:Object.values(P.props).reduce((a,p)=>a+p.shops.length,0),trips:P.trips||0,achievements:Object.keys(S.ach&&S.ach.got||{}),zakat:S.zakat&&S.zakat.paid||0,day:S.day};
}
function succession(S) {
  for(const id of S.order){const bs=bossOf(S,id);if(!bs||bs.father)continue;
    const spec=BOSS_HEIRS[id];if(!spec)continue;
    bs.father={name:bs.name,trust:bs.trust,lore:(S.learn.lore||{})[id]||0};bs.name=spec[0]+' بن '+spec[1];bs.trust*=HEIR_TRUST;bs.temper=.9;bs.heirGreetingRead=false;
    const text=LIFE_TEXTS.succession.replace('{heirName}',bs.name).replace('{marketName}',S.cities[id].name); news(S,text,'good'); (lifeOf(S).successionNotices||(lifeOf(S).successionNotices=[])).push({id:'generation:'+S.day+':'+id,city:id,text,day:S.day,read:false});
  }
}
function retirementDraft(S,plan) {
  if(!S.learn||!S.learn.char||S.legacy&&S.legacy.retired)return NO('انتقال الأمانة مرة واحدة');
  if(ageOf(S)<RETIRE_AGE)return NO('لم يبلغ التاجر عمر التقاعد');
  const name=String(plan.name||'سهيل').trim(),will=String(plan.will||'').trim(),willPct=Number(plan.willPct||0),pct=Number(plan.pct||0);
  if(!name||name.length>32||will.length>400||!Number.isFinite(pct)||pct<0||pct>100||!Number.isFinite(willPct)||willPct<0||willPct>100/3)return NO('راجع الاسم والوصية والنسبة');
  const before=retirementSummary(S),goods=plan.sellGoods||[],soldShops=plan.sellShops||[];if(!Array.isArray(goods)||!Array.isArray(soldShops))return NO('اختيار البيع غير صحيح');
  if(new Set(goods.map(x=>x.car+':'+x.g+':'+(x.mode||''))).size!==goods.length||new Set(soldShops.map(x=>x.city+':'+x.shop)).size!==soldShops.length)return NO('لا تكرر الأصل نفسه');
  for(const x of goods){const c=S.player.caravans.find(y=>y.id===+x.car),q=c&&Math.floor((x.mode==='herd'?c.herd:c.cargo)?.[x.g]||0);if(!c||c.left>0||q<1||!GD[x.g])return NO('تعذّر بيع بضاعة مختارة');const r=A.sell(S,c.id,x.g,q,x.mode);if(!r.ok)return r;}
  for(const x of soldShops){const p=S.player.props[x.city],sh=p&&p.shops.find(y=>y.id===+x.shop),sw=S.life&&S.life.salemWaqf;
    if(!sh||shKind(sh)!=='own'||sh.endowed||sw&&sw.city===x.city&&sw.shop===sh.id)return NO('لا يُباع الدكان المخصص للوقف');
    p.shops=p.shops.filter(y=>y!==sh);S.player.gold+=1000;fauc(S,'retirementAssetSale',1000);
  }
  let waqf=null;
  if(plan.shop){if(pct>0)return NO('اختر نسبة نقدية أو دكاناً');const {city,shop}=plan.shop,sh=shopsOf(S,city).find(x=>x.id===+shop),sw=S.life&&S.life.salemWaqf;
    if(!sh||shKind(sh)!=='own'||sh.endowed||sw&&sw.city===city&&sw.shop===sh.id)return NO('الدكان غير متاح للوقف');
    sh.endowed=true;waqf=newShopWaqf(S,city,sh.id,1,false);
  }else if(pct>0){const principal=before.wealth*pct/100;if(!(principal>0)||S.player.gold+1e-6<principal)return NO('النقد لا يكفي للنسبة المختارة؛ عدّل النسبة أو ما تبيعه');S.player.gold-=principal;waqf={type:'capital',principal,capital:principal,city:mainCar(S).city,start:S.day,hist:[]};}
  S.legacy={retired:true,heirAge:25,father:Object.assign({alive:true,char:S.learn.char},before),heirName:name,will:{text:will,pct:willPct,beneficiary:'charity',executed:false},waqf,decisions:{pct,shop:plan.shop||null,sellGoods:goods,sellShops:soldShops},at:S.day};
  S.player.name=name;S.learn.level=11;S.learn.stage=STAGES.length+1;S.learn.stageIntro=STAGES.length;S.learn.rest=null;for(const k of ['stageUp','up','sq','tq','bq','csq','cq','fq','eq','rq','schedHold'])S.learn[k]=[];
  const L=lifeOf(S);L.mentorSon=true;delete L.pending;succession(S);news(S,LIFE_TEXTS.fatherFarewell,'good');interrupt(S,'lifeFarewell');
  return OK(LIFE_TEXTS.heirWelcome);
}
function retirePlayer(S,plan) {
  // المسودة مستقلة: أي رفض يترك المحفظة والأصول والعقود وحالة المولد كما كانت.
  const T=load(save(S));const result=retirementDraft(T,plan||{});if(!result.ok)return result;
  Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,T);attachWallet(S);return result;
}
function elderBossText(S,id) {
  const bs=bossOf(S,id);if(!bs)return '';
  if(bs.father)return bs.heirGreetingRead?'':LIFE_TEXTS.bossHeirMeeting;
  return ageOf(S)>=BOSS_ELDER_AGE&&(S.day+S.order.indexOf(id))%3===0?LIFE_TEXTS.bossElder[Math.floor(S.day/30)%LIFE_TEXTS.bossElder.length]:'';
}
function mentorWisdom(S,key) {
  if(mentorOf(S).id!=='mentor2')return null;
  const map={loss:9,broke:9,noSeller:8,profit:1,bigProfit:0,customs:3,crossed:3,arrive:3,zakatDue:6,mdLate:5,instLate:5,debtfree:5,mudLoss:4,defect:7,defectFound:7,brokerNo:2,opp:0,idle:8,concentrated:4,opportunity:0,wageLate:5};
  return key in map?'كما كان يقول أبي: '+LIFE_TEXTS.wisdom[map[key]]:null;
}
Object.assign(A,{setSalemWaqf,payWaqfArrears,acknowledgeLife,retire:retirePlayer,ackBossHeir(S,id){const b=bossOf(S,id);if(!b||!b.father)return NO('لا رسالة');b.heirGreetingRead=true;return OK('حُفظ اللقاء في دفتر السوق');}});

function retirementQuote(S,plan) { const T=load(save(S)),r=retirementDraft(T,plan||{});return r.ok?Object.assign(r,{wealth:netWorth(T),cash:liquid(T)}):r; }
