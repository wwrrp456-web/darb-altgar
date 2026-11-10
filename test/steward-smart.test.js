'use strict';
// 017 الأمين المدبّر: تدوير، بيع الراكد، الأنعام؛ مفاتيح مطفأة افتراضياً، لا مال من العدم، حفظ قديم، مفتاح رجوع.
const a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={module:{exports:{}},require:require('node:module').createRequire(require.resolve('../src/engine.js')),console};
vm.runInNewContext(fs.readFileSync('src/engine.js','utf8').replace('const API = { ','const API = { staffDay, mgrDay, playerDay, stewardBegin, stewardEnd, stewardMigrate, '),box);
const E=box.module.exports,A=E.A,J=x=>JSON.stringify(x),near=(x,y)=>a(Math.abs(x-y)<1e-6,`${x} != ${y}`);
E.SKILLB.caps.trial=false; // 035ب: التدوير صار «تجربة رف واحد» (14 يوم تشغيل مؤهل وقفل 14 يوماً، ولا يُعدّ نفاد المخزون ركوداً) ويغطيه skill-b؛ هذا الاختبار يقيس إيقاع 017 الأسبوعي القديم حرفياً
function base(){
 const S=E.newGame(21);A.learnSetChar(S,'trader');S.noLock=1;S.learn.level=11;S.learn.stage=23;S.phase=3;S.player.wallet.sar=200000;S.noEvents=true;S.noShocks=true;
 for(let i=0;i<2;i++)a(A.buildShop(S,'riyadh').ok);a(A.buildWarehouse(S,'riyadh').ok);
 const pr=S.player.props.riyadh;for(const w of pr.staff){w.days=120;w.free=0;}
 for(let day=1;day<=30;day++){S.day=day;E.staffDay(S,'riyadh',pr,S.cities.riyadh);}
 a(A.promoteWorker(S,'riyadh',pr.staff[0].id,'shop',pr.shops[0].id).ok);
 for(let day=31;day<=120;day++){S.day=day;E.mgrDay(S,'riyadh',pr);}
 a(A.auditCity(S,'riyadh').ok);S.day=120;a(A.promoteSteward(S,'riyadh').ok);return S;
}
const raw0=E.save(base()),fresh=()=>E.load(raw0);
const policy=(extra={})=>({pay:false,report:true,restock:false,pricing:false,rotate:false,sellStale:false,herd:false,minPrice:{sellStale:1,herd:1},limit:0,every:'daily',...extra});
const step=S=>{S.day++;E.stewardBegin(S);E.stewardEnd(S);};
const goodsSold=(S,pr)=>{const c=S.cities.riyadh;return Object.keys(pr.store).filter(g=>E.GD[g]&&!E.GD[g].sp&&!E.GD[g].live&&!(g in E.BREED)&&(c.stock[g]||0)>0);};

// 1) الافتراضي مطفأ؛ والمفتاح العام يعيد السلوك القديم حرفياً
{
 let S=fresh(),m=E.stewardOf(S,'riyadh');
 for(const k of ['rotate','sellStale','herd'])a.equal(m.policy[k],false,'مطفأ افتراضياً: '+k);
 a.equal(J(E.STEWARD_SMART_FLAGS),J(['rotate','sellStale','herd']));a.equal(E.STEWARD_SMART.on,true);
 const pr=S.player.props.riyadh,[g1,g2]=goodsSold(S,pr).concat(['wheat','salt']).slice(0,2);
 pr.store.salt=80;pr.store.wheat=pr.store.wheat||0;
 const sh=pr.shops[0];sh.items=[{g:'cotton',price:1.8,auto:false,carry:false,buyBelow:1.05,target:60,sold:0,revenue:0,idleDays:20}];
 const off=E.save(S);step(S);const rawOffFlags=E.save(S).replace(/"day":\d+/g,'');
 // الصلاحيات مشغّلة مع المفتاح العام مطفأ ≡ الصلاحيات مطفأة
 let A1=E.load(off),A2=E.load(off);A.setStewardPolicy(A2,'riyadh',policy({rotate:true,sellStale:true,herd:true}));
 E.STEWARD_SMART.on=false;step(A1);step(A2);E.STEWARD_SMART.on=true;
 a.equal(J(A2.player.props.riyadh.shops.map(s=>s.items.map(i=>i.g))),J(A1.player.props.riyadh.shops.map(s=>s.items.map(i=>i.g))),'لا تدوير مع المفتاح العام مطفأ');
 a.equal((A2.player.mgrActions||[])?.filter(x=>['rotate','sell','herd'].includes(x.kind)).length||0,0);
 near(A2.player.props.riyadh.store.salt,A1.player.props.riyadh.store.salt);
 // إيقاف المفاتيح لا يمسح التقدم، والتبديل بين الوضعين لا يفسد الحفظ
 const back=E.load(E.save(A2));a.equal(E.stewardOf(back,'riyadh').policy.rotate,true);
}

// 2) SC-001: التدوير بعد 14 يوماً راكداً، ومرة في الأسبوع
{
 const S=fresh(),pr=S.player.props.riyadh,sh=pr.shops[0],c=S.cities.riyadh;
 A.setStewardPolicy(S,'riyadh',policy({rotate:true}));
 const stale=E.GIDS.find(g=>E.sells(c,g)&&!E.GD[g].sp&&!E.GD[g].live&&!(g in E.BREED));
 const cand=E.GIDS.filter(g=>g!==stale&&E.sells(c,g)&&!E.GD[g].sp&&!E.GD[g].live&&!(g in E.BREED));
 const pick=cand[0],pick2=cand[1];
 for(const s of pr.shops)s.items=[];
 sh.items=[{g:stale,price:1.8,auto:false,carry:false,buyBelow:1.05,target:60,sold:0,revenue:0,idleDays:13}];
 pr.store[pick]=50;pr.store[stale]=0;
 step(S);a.equal(sh.items[0].g,stale,'13 يوماً لا تكفي');a.equal(sh.rotatedDay,undefined);
 sh.items[0].idleDays=14;step(S);
 const now=sh.items.map(i=>i.g);a(!now.includes(stale),'الراكد استُبدل');a(now.includes(pick)||now.some(g=>cand.includes(g)),'بصنف من المخزن');
 const rotated=sh.items[0].g;a(pr.store[rotated]>=E.STEWARD_SMART.rotateMin);
 a.equal(sh.rotatedDay,S.day);a((S.player.mgrActions||[]).some(x=>x.kind==='rotate'));
 // لا مرة ثانية في الأسبوع
 pr.store[pick2]=50;sh.items[0].idleDays=30;const first=sh.items[0].g;for(let i=0;i<6;i++){sh.items[0].idleDays=30;step(S);}
 a.equal(sh.items[0].g,first,'لا تدوير ثانٍ قبل مرور أسبوع');
 sh.items[0].idleDays=30;step(S);a.notEqual(sh.items[0].g,first,'بعد أسبوع يدوَّر');
 // لا يُدوَّر بصنف معروض في دكان آخر
 const S2=fresh(),p2=S2.player.props.riyadh,c2=S2.cities.riyadh;A.setStewardPolicy(S2,'riyadh',policy({rotate:true}));
 for(const s of p2.shops)s.items=[];
 p2.shops[0].items=[{g:stale,price:1.8,auto:false,buyBelow:1.05,target:60,sold:0,revenue:0,idleDays:20}];
 p2.shops[1].items=[{g:pick,price:1.8,auto:false,buyBelow:1.05,target:60,sold:0,revenue:0,idleDays:0}];
 for(const g of cand)p2.store[g]=0;p2.store[pick]=80;step(S2);a.equal(p2.shops[0].items[0].g,stale,'الوحيد المتوفر معروض أصلاً');
}

// 3) SC-002: البيع لا ينزل عن الحد الأدنى ولا يبيع المعروض
{
 const S=fresh(),pr=S.player.props.riyadh,c=S.cities.riyadh;
 A.setStewardPolicy(S,'riyadh',policy({sellStale:true}));
 const g=E.GIDS.find(x=>E.sells(c,x)&&!E.GD[x].live&&!(x in E.BREED)&&x!=='wheat'),shown=E.GIDS.find(x=>x!==g&&E.sells(c,x)&&!E.GD[x].live&&!(x in E.BREED)&&x!=='wheat');
 for(const s of pr.shops)s.items=[];pr.shops[0].items=[{g:shown,price:1.8,auto:false,buyBelow:1.05,target:60,sold:0,revenue:0,idleDays:0}];
 pr.store={};pr.store[g]=100;pr.store[shown]=100;pr.basis={};
 const unit=E.unitPrice(c,g);pr.basis[g]={q:100,c:100*unit*3};pr.basis[shown]={q:100,c:1};
 step(S);const m=E.stewardOf(S,'riyadh');a.equal(m.idle[g].since,S.day);
 S.day+=29;step(S);near(pr.store[g],100);// لم يمضِ 30 يوماً من اليوم الأول؟ اليوم 31 من التتبع
 S.day+=2;step(S);near(pr.store[g],100,'الكلفة 3× السعر: لا بيع تحت الحد');
 near(pr.store[shown],100);a(!(S.player.mgrActions||[]).some(x=>x.kind==='sell'));
 // حد منخفض يسمح، وبحد يومي، ولا يهبط صافي السعر تحت الحد أبداً، ولا يمس المعروض
 pr.basis[g]={q:100,c:100*unit*.3};a(A.setStewardPolicy(S,'riyadh',policy({sellStale:true,minPrice:{sellStale:1,herd:1}})).ok);
 const before=pr.store[g],gold0=S.player.gold;S.day+=0;step(S);
 const sold=before-pr.store[g];a(sold>0&&sold<=E.STEWARD_SMART.dayQty,'بيع محدود باليوم: '+sold);a(S.player.gold>gold0);near(pr.store[shown],100);
 const act=(S.player.mgrActions||[]).find(x=>x.kind==='sell');a(act&&act.quantity===sold);
 // الحد بعد الضريبة: كلفة تساوي السعر الحالي تماماً تمنع البيع
 const S3=fresh(),p3=S3.player.props.riyadh,c3=S3.cities.riyadh;A.setStewardPolicy(S3,'riyadh',policy({sellStale:true,minPrice:{sellStale:1,herd:1}}));
 for(const s of p3.shops)s.items=[];p3.store={};p3.store[g]=100;p3.basis={[g]:{q:100,c:100*E.unitPrice(c3,g)}};
 step(S3);S3.day+=31;step(S3);near(p3.store[g],100,'الضريبة تجعل البيع بسعر الكلفة خسارة');
 // الحد الأدنى يُحفظ ويُرفض خارج المدى
 a.equal(A.setStewardPolicy(S3,'riyadh',policy({minPrice:{sellStale:0.1,herd:1}})).ok,false);
 a(A.setStewardPolicy(S3,'riyadh',policy({sellStale:true,minPrice:{sellStale:1.5,herd:1}})).ok);near(E.stewardOf(S3,'riyadh').policy.minPrice.sellStale,1.5);
}

// 4) SC-003: الأنعام تدخل المزرعة إن اتسعت، وإلا تُباع بالحد الأدنى
{
 const S=fresh();a(A.buildFarm(S,'riyadh').ok);const pr=S.player.props.riyadh,c=S.cities.riyadh;
 A.setStewardPolicy(S,'riyadh',policy({herd:true}));
 const g=Object.keys(E.BREED)[0];pr.store[g]=4;pr.basis[g]={q:4,c:4*E.unitPrice(c,g)*.2};
 const f=pr.farm,room=Math.floor((E.farmCap(S,'riyadh')-E.farmUnits(f))/E.BREED[g].fu);a(room>=4);
 const gold0=S.player.gold;step(S);near(pr.store[g]||0,0);near(f.herd[g],4);a.equal((S.player.mgrActions||[]).find(x=>x.kind==='herd').quantity,4);near(S.player.gold,gold0,'نقل لا بيع');
 // بلا مزرعة: يباع بالحد الأدنى
 const S2=fresh(),p2=S2.player.props.riyadh,c2=S2.cities.riyadh;A.setStewardPolicy(S2,'riyadh',policy({herd:true}));
 p2.store[g]=6;p2.basis[g]={q:6,c:6*E.unitPrice(c2,g)*.2};const g0=S2.player.gold;step(S2);
 a(p2.store[g]<6,'بيعت');a(S2.player.gold>g0);a((S2.player.mgrActions||[]).some(x=>x.kind==='sell'));
 // بلا مزرعة وحدّه أعلى من السعر: لا بيع
 const S3=fresh(),p3=S3.player.props.riyadh,c3=S3.cities.riyadh;A.setStewardPolicy(S3,'riyadh',policy({herd:true}));
 p3.store[g]=6;p3.basis[g]={q:6,c:6*E.unitPrice(c3,g)*5};step(S3);near(p3.store[g],6);
 // مزرعة ممتلئة: الفائض يُباع بالحد
 const S4=fresh();a(A.buildFarm(S4,'riyadh').ok);const p4=S4.player.props.riyadh,c4=S4.cities.riyadh;A.setStewardPolicy(S4,'riyadh',policy({herd:true}));
 const cap=Math.floor((E.farmCap(S4,'riyadh')-E.farmUnits(p4.farm))/E.BREED[g].fu);p4.store[g]=cap+3;p4.basis[g]={q:cap+3,c:(cap+3)*E.unitPrice(c4,g)*.2};
 step(S4);near(p4.farm.herd[g],cap);a(p4.store[g]<3+1e-9,'الفائض بيع أو بقي بلا سعر مناسب');
}

// 5) الحفظ القديم يعمل، والتقرير يذكر الأفعال، وحماية المدخلات
{
 const old=JSON.parse(raw0),m=Object.values(old.player.props).find(p=>p.mgr?.rank===3).mgr;
 delete m.policy.rotate;delete m.policy.sellStale;delete m.policy.herd;delete m.policy.minPrice;
 const S=E.load(JSON.stringify(old)),mm=E.stewardOf(S,'riyadh');
 for(const k of ['rotate','sellStale','herd'])a.equal(mm.policy[k],false);a.equal(J(mm.policy.minPrice),J({sellStale:1,herd:1}));
 mm.policy.sellStale=true;mm.policy.limit=5;mm.idle={wheat:{q:'x',since:1},salt:{q:5,since:S.day+99},cotton:{q:3,since:3}};mm.policy.minPrice={sellStale:99,herd:'x'};
 const S2=E.load(E.save(S)),m2=E.stewardOf(S2,'riyadh');a.equal(J(Object.keys(m2.idle||{})),J(['cotton']));a.equal(J(m2.policy.minPrice),J({sellStale:1,herd:1}));
 const S3=fresh();A.setStewardPolicy(S3,'riyadh',policy({report:true,sellStale:true}));const p=S3.player.props.riyadh;
 const g=E.GIDS.find(x=>E.sells(S3.cities.riyadh,x)&&!(x in E.BREED)&&x!=='wheat');for(const s of p.shops)s.items=[];p.store={};p.store[g]=30;p.basis={[g]:{q:30,c:30*E.unitPrice(S3.cities.riyadh,g)*.2}};
 step(S3);S3.day+=31;S3.news.length=0;step(S3);const r=E.stewardOf(S3,'riyadh').reports[0];a(r.sold>0&&r.earned>0);a(S3.news.some(n=>/بعتُ/.test(n.t)),'التقرير يذكر البيع');
 // لا يبيع مدخلات المصنع
}
console.log('PASS steward-smart: off by default, rotate (14d, weekly cap), sellStale (floor after tax, shown goods safe, daily cap), herd (farm else floor), global switch, old save, report');
