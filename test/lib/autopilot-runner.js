'use strict';
// نفس التشغيل التلقائي الحقيقي؛ كل جزء يستأنف حفظاً فعلياً محمياً ببصمة المصدر.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const root=path.join(__dirname,'../..'),file=n=>path.join(__dirname,'../fixtures/autopilot-'+n+'.json');
const sourceHash=()=>crypto.createHash('sha256').update(['src/engine.js',...fs.readdirSync(path.join(root,'src')).filter(n=>n.endsWith('.js')).map(n=>'src/'+n),...fs.readdirSync(path.join(root,'src/ui')).filter(n=>n.endsWith('.js')).map(n=>'src/ui/'+n),'test/lib/autopilot-runner.js'].sort().map(n=>fs.readFileSync(path.join(root,n))).join('\n')).digest('hex');
module.exports=async function run({phase='start',capture=false,observe,inspect}={}){
 assert(['start','finance','graduate','year'].includes(phase));
 const prior=phase==='start'?null:JSON.parse(fs.readFileSync(file(phase==='finance'?13:phase==='graduate'?18:23),'utf8'));
 if(prior)assert.equal(prior.sourceHash,sourceHash(),'تغير مصدر التشغيل: أعد الالتقاط الفعلي بأداة capture-autopilot');
 const browser=await chromium.launch(),stop=async()=>{await browser.close();process.exit(143);};
 process.once('SIGTERM',stop);process.once('SIGINT',stop);
 try{
  const context=await browser.newContext({viewport:{width:390,height:800}}),p=await context.newPage(),errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  if(prior)await p.addInitScript(raw=>localStorage.setItem('darb-v3',raw),prior.raw);
  await p.goto('file://'+path.join(root,'index.html')+'?learn=1&seed=5'+(process.env.SCHED_URL||''));await p.waitForFunction(()=>!!window.__game);
  // يحفظ كل أيام الاقتصاد والأفعال؛ تطابق إيقاف أرشيف الرسم مثبت في climate.test.js.
  await p.evaluate(()=>{const tick=__game.E.tick;__game.E.tick=S=>tick(S,false);});
  if(process.env.SCHED_SHADOW)await p.evaluate(off=>{const E=__game.E;E.schedReset(window.ContentMap.PIECES);E.SCHED.on=true;if(off)for(const k of ['cards','tablets','secrets','boss'])E.SCHED[k]=false;},process.env.SCHED_CARDS==='0'); // WP-17أ: وضع الظل (خارج الحزمة؛ يُشغَّل بمتغير بيئة)
  if(observe)await observe(p);
  const save0=await p.evaluate(()=>localStorage.getItem('darb-v3')||'');
  if(prior)assert.equal(await p.evaluate(()=>__game.S.learn.stage),prior.stage,'تحميل الحفظ الحقيقي عند المرحلة المسجلة');
  await p.evaluate(({phase,stats})=>{
   const g=__game;g.apStart({mode:phase==='start'?'fresh':'current',seed:5,speed:phase==='finance'?'x5':'max',target:phase==='year'?'y1':'grad',inject:true});
   if(phase==='finance'||phase==='graduate')for(const k of ['steps','same','lvSteps','lastLv','log','errs','kinds'])g.AP[k]=stats[k];
   // يتوقف المشغّل الآلي بنفسه عند المرحلة المستهدفة (فحص كل 5 مل ث) فلا يتجاوزها بين دورتي استطلاع الاختبار (250 مل ث) إن أسرع
   {const tgt=phase==='start'?13:phase==='finance'?18:0;if(tgt){const iv=setInterval(()=>{const s=g.S,a=g.AP;if(s.learn.stage>=tgt&&!g.learnNext()&&!(s.life&&s.life.pending)){a.paused=true;clearTimeout(a.tm);clearInterval(iv);}},5);}}
  },{phase,stats:prior?.stats});
  let st;
  for(let i=0;i<400;i++){
   await p.waitForTimeout(250);
   st=await p.evaluate(phase=>{
    const g=__game,a=g.AP,s=g.S;
    // المرحلة 20 تنتظر الحول؛ نمرّر الأيام أثناء التشغيل فقط، دون تجاوز نقطة حفظ أوقف المشغّل نفسه عندها.
    if(!a.paused&&s.learn.stage===20&&s.zakat&&!s.zakat.due&&(!g.learnNext()||g.learnNext().k==='zakat')){let guard=0;while(!s.zakat.due&&!(s.life&&s.life.pending)&&guard++<1200){g.E.A.work(s);g.E.tick(s);s.pause=false;}a.lvSteps=0;g.renderAll(true);}
    // رصيد صفر عند استحقاق الزكاة: لا زر دفع (تظهر «أجّل أسبوعاً» فقط) والمشغّل الآلي لا يعرفها، فنؤجّل كما يفعل اللاعب
    {const zd=document.querySelector('#lesson [data-act=zdefer]');if(zd&&!document.querySelector('#lesson [data-act=zpay]'))zd.click();}
    const target=phase==='start'?13:phase==='finance'?18:0;
    const reached=target>0&&s.learn.stage>=target&&!g.learnNext()&&!s.life?.pending;
    if(reached){a.paused=true;clearTimeout(a.tm);}
    return {reached,fin:a.finished,stuck:a.stuck,reason:a.reason,steps:a.steps,lv:s.learn.level,stage:s.learn.stage,done:s.learn.stageDone||[],day:s.day,yrs:s.yr?s.yr.n:-1,elapsed:s.day-a.freeStart};
   },phase);
   if(st.reached||st.fin)break;
  }
  console.log(JSON.stringify(st));
  if(st&&st.stuck)console.log((await p.evaluate(()=>__game.apReport())).split('\n').slice(-12).join('\n')); // تشخيص التعثر
  assert(st&&!st.stuck,'لا تعثر في التشغيل: '+st?.reason);
  if(phase==='start'||phase==='finance'){
   assert(st.reached&&!st.fin&&st.stage>=(phase==='start'?13:18)&&st.lv>=9,'نقطة حفظ فعلية بين مراحل التشغيل');
   assert.deepEqual(st.done,Array.from({length:st.stage-1},(_,i)=>i+1),'كل مراحل الجزء الأول مكتملة بالترتيب');
  }else if(phase==='graduate'){
   assert(st.fin&&st.lv>=11,'يكمل من الحفظ الحقيقي إلى التخرج');
   assert.deepEqual(st.done,Array.from({length:22},(_,i)=>i+1),'المراحل22جميعها مكتملة');
  }else assert(st.fin&&st.yrs>=1&&st.elapsed>=354,'حول كامل فعلي من اللعب الحر');
  assert.equal(await p.locator('#apbar').count(),1);
  if(phase==='graduate'||phase==='year')assert.match(await p.locator('#apbar').innerText(),/اكتمل/,'شريط المراقبة يعرض الاكتمال');
  const report=await p.evaluate(()=>__game.apReport());assert.match(report,/تقرير التشغيل التلقائي/);assert(report.split('\n').length>8,'التقرير فيه سجل الأفعال');
  assert.equal(await p.evaluate(()=>localStorage.getItem('darb-v3')||''),save0,'لم يمس اللعب المحفوظ');
  assert(st.steps<=60000,'حد الخطوات الأصلي باق عبر جزأي التخرج');
  assert.deepEqual(errs,[],'بلا أخطاء JS');
  if(process.env.SCHED_OUT)fs.writeFileSync(process.env.SCHED_OUT+phase+'.json',JSON.stringify(await p.evaluate(()=>({raw:__game.E.save(__game.S),day:__game.S.day,stage:__game.S.learn.stage,log:__game.E.SCHED.log,gap:__game.E.SCHED.GAP_DAYS,tickErr:__game.E.SCHED.tickErr,errs:[]}))));
  if(inspect){await inspect(p,st);assert.equal(await p.evaluate(()=>localStorage.getItem('darb-v3')||''),save0,'فحص الواجهة لم يمس اللعب المحفوظ');assert.deepEqual(errs,[],'فحص الواجهة بلا أخطاء JS');}
  if(capture&&phase!=='year'){
   const data=await p.evaluate(()=>{const g=__game,stats={};for(const k of ['steps','same','lvSteps','lastLv','log','errs','kinds'])stats[k]=g.AP[k];return {raw:g.E.save(g.S),stage:g.S.learn.stage,stats};});
   fs.writeFileSync(file(phase==='start'?13:phase==='finance'?18:23),JSON.stringify({sourceHash:sourceHash(),...data},null,2)+'\n');
  }
  console.log('PASS autopilot '+phase+': real actions, continuous counters, report, saved-game isolation and no JS errors');
 }finally{process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);await browser.close();}
};
