/* مناخ القطاعات: مستقل عن مولّد أحداث العالم، ولا يغيّر أسعار الشراء أو تكاليف التشغيل. */
const CLIMATE_AMPLITUDE=.005, CLIMATE_MIN=1-CLIMATE_AMPLITUDE, CLIMATE_MAX=1+CLIMATE_AMPLITUDE, CLIMATE_BLEND_DAYS=30, CLIMATE_YEAR=354;
const CLIMATE_SECTORS=['shops','trade','auto','farm','factory'];
const CLIMATE_NAMES={shops:'الدكاكين والبسطات',trade:'التجارة المباشرة',auto:'قوافل القادة',farm:'المزارع والمسالخ',factory:'المصانع'};
const climateOn=S=>!!(S.learn&&S.learn.char&&!S.noShocks&&!S.noClimate);
const climateEmpty=()=>Object.fromEntries(CLIMATE_SECTORS.map(k=>[k,0]));
function climateHash(seed,year,key) {let h=(seed>>>0)^Math.imul(year+1,0x9e3779b1);for(let i=0;i<key.length;i++){h=Math.imul(h^key.charCodeAt(i),16777619);h^=h>>>13;}h=Math.imul(h^(h>>>16),0x85ebca6b);return ((h^(h>>>13))>>>0)/4294967296;}
function climateNormalize(raw,lo,hi) {
  const keys=Object.keys(raw),avg=keys.reduce((a,k)=>a+raw[k],0)/keys.length,r=Object.fromEntries(keys.map(k=>[k,clamp(raw[k]/avg,lo,hi)]));
  // إعادة توزيع أثر القص على العناصر غير المقيدة، حتى يبقى المتوسط واحداً فعلاً.
  for(let n=0;n<10;n++){const d=keys.length-keys.reduce((a,k)=>a+r[k],0);if(Math.abs(d)<1e-12)break;const free=keys.filter(k=>d>0?r[k]<hi-1e-12:r[k]>lo+1e-12);if(!free.length)break;for(const k of free)r[k]=clamp(r[k]+d/free.length,lo,hi);}return r;
}
function climateRoll(S,year) {
  const seed=S.climateSeed==null?S.seed:S.climateSeed;year=S.noShocks||S.noClimate?0:year;
  // كل دورة خماسية تعادل حظوظ القطاعات والأقاليم عبر الزمن أيضاً؛ تمنع توالي الضعف لقطاع طوال مسيرة قصيرة.
  const block=Math.floor(Math.max(0,year-1)/5),offset=Math.max(0,year-1)%5;
  function layer(keys,lo,hi,prefix){const order=keys.slice().sort((a,b)=>climateHash(seed,block,prefix+'order:'+a)-climateHash(seed,block,prefix+'order:'+b)),base=climateNormalize(Object.fromEntries(keys.map(k=>[k,lo+(hi-lo)*climateHash(seed,block,prefix+'value:'+k)])),lo,hi);return Object.fromEntries(order.map((k,i)=>[k,year>0?base[order[(i+offset)%keys.length]]:1]));}
  return {cur:layer(CLIMATE_SECTORS,CLIMATE_MIN,CLIMATE_MAX,'sector:'),reg:layer(['sa','eg','ir','in','cn'],1-CLIMATE_AMPLITUDE/4,1+CLIMATE_AMPLITUDE/4,'region:')};
}
function climateInit(S) {
  if(S.climateSeed==null)S.climateSeed=S.seed>>>0;
  if(!S.climate){const year=Math.floor(S.day/CLIMATE_YEAR),r=climateRoll(S,year),p=climateRoll(S,Math.max(0,year-1));S.climate={year,cur:r.cur,prev:p.cur,reg:r.reg,prevReg:p.reg,balance:3,hist:[],income:climateEmpty(),notices:[],hint:[],pending:[]};}
  if(S.climate.balance!==3){const C=S.climate,r=climateRoll(S,C.year),p=climateRoll(S,Math.max(0,C.year-1));Object.assign(C,{balance:3,cur:r.cur,prev:p.cur,reg:r.reg,prevReg:p.reg});}
  return S.climate;
}
function climateFactor(S,sector,city) {
  if(!climateOn(S)||!CLIMATE_SECTORS.includes(sector))return 1;
  const year=Math.floor(S.day/CLIMATE_YEAR),C=S.climate&&S.climate.year===year?S.climate:null,r=C||climateRoll(S,year),p=C?{cur:C.prev,reg:C.prevReg}:climateRoll(S,Math.max(0,year-1)),b=clamp((S.day%CLIMATE_YEAR)/CLIMATE_BLEND_DAYS,0,1),country=S.cities[city]?.country||city||S.home;
  const cur=clamp((r.cur[sector]||1)*(r.reg[country]||1),.7,1.5),prev=clamp((p.cur[sector]||1)*(p.reg[country]||1),.7,1.5);return prev+(cur-prev)*b;
}
const climateSaleMul=(S,source,city)=>source==='trade'||source==='auto'?climateFactor(S,source,city):1;
const climateBasisCost=(basis,n)=>basis&&typeof basis==='object'?(basis.q>0?(basis.c||0)*Math.min(n,basis.q)/basis.q:0):Math.max(0,Number(basis)||0)*n;
function climateSaleGross(S,source,city,gross,tr,cost) {
  const factor=climateSaleMul(S,source,city);if(factor===1||!(tr<1))return gross;
  // على ربح الصفقة الكلي بعد الشراء ورسوم البيع، لا على رأس المال ولا على ربح كل وحدة منفردة.
  // لذلك لا يصنع المناخ ربحاً من دورة شراء وبيع خاسرة في السوق نفسه.
  const profit=Math.max(0,gross*(1-tr)-Math.max(0,Number(cost)||0));return gross+profit*(factor-1)/(1-tr);
}
const climateRisk=(S,sector,city)=>{if(!climateOn(S))return 1;const year=Math.floor(S.day/CLIMATE_YEAR),cur=S.climate&&S.climate.year===year?S.climate.cur:climateRoll(S,year).cur;return cur[sector]<.9?.7:1;};
function climateShockRisk(S,key) {const map={closure:['trade','auto'],banditwave:['trade','auto'],pirates:['trade','auto'],sickness:['trade','auto'],drought:['farm'],flood:['farm'],famine:['farm'],fire:['shops','factory'],taxraid:['shops'],dump:['trade','shops','factory'],monopoly:['trade','shops']};return (map[key]||[]).some(k=>climateRisk(S,k)<1)?.7:1;}
function climateIncome(S,sector,amount) {if(!S.learn||!S.learn.char||!CLIMATE_SECTORS.includes(sector)||!Number.isFinite(amount)||amount<=0)return;const C=climateInit(S);C.income[sector]=(C.income[sector]||0)+amount;}
function climateYearEnd(S,C) {
  const ranked=CLIMATE_SECTORS.slice().sort((a,b)=>C.cur[b]-C.cur[a]),prior=C.hist[0];
  const row={year:C.year+1,income:Object.assign(climateEmpty(),C.income),previous:prior?Object.assign({},prior.income):null,strong:ranked[0],weak:ranked.at(-1),factors:Object.assign({},C.cur)};
  C.hist.unshift(row);C.hist=C.hist.slice(0,5);if(climateOn(S))C.pending.push(row.year);C.pending=C.pending.filter(y=>C.hist.some(x=>x.year===y));
  if(!C.lesson&&C.cur[row.strong]-C.cur[row.weak]>(CLIMATE_MAX-CLIMATE_MIN)/3){C.lesson=true;row.wisdom=[LIFE_TEXTS.wisdom[4],LIFE_TEXTS.wisdom[9]];}
}
const CLIMATE_STRONG=['تشهد حركة {sector} نشاطاً ملحوظاً وإقبالاً وافراً هذا العام.','يتوقع أهل السوق رواجاً طيباً في قطاع {sector} طوال الموسم.','تبدو أرباح {sector} واعدة ومبشرة بمزيد من النماء هذه السنة.'],CLIMATE_WEAK=['يميل نشاط {sector} إلى الهدوء والركود الحذر هذا العام.','يتحدث التجار عن تراجع الطلب على {sector} في هذه الفترة.','تتسم حركة {sector} بالفتور مقارنةً ببقية أسواق الحاضرة.'];
function climateDay(S) {
  const C=climateInit(S),year=Math.floor(S.day/CLIMATE_YEAR);
  if(year!==C.year){if(year===C.year+1&&S.learn&&S.learn.char)climateYearEnd(S,C);const p=climateRoll(S,Math.max(0,year-1)),r=climateRoll(S,year);C.year=year;C.prev=p.cur;C.cur=r.cur;C.prevReg=p.reg;C.reg=r.reg;C.income=climateEmpty();C.hint=[];}
  if(!climateOn(S)||year===0)return;
  const d=S.day%CLIMATE_YEAR,ranked=CLIMATE_SECTORS.slice().sort((a,b)=>C.cur[b]-C.cur[a]);
  for(const [i,at] of [45,90].entries())if(d>=at&&!C.hint.includes(i)&&d<120){C.hint.push(i);const sector=i?ranked.at(-1):ranked[0];
    // نصوص معتمدة من المراجع: docs/review/APPROVED_CLIMATE_TEXTS.md
    const forms=i?CLIMATE_WEAK:CLIMATE_STRONG,text=forms[(year+CLIMATE_SECTORS.indexOf(sector))%forms.length].replace('{sector}',CLIMATE_NAMES[sector]);
    const n={id:'climate:'+year+':'+i,year:year+1,day:S.day,text,read:false,sector};C.notices.push(n);C.notices=C.notices.slice(-10);news(S,text,i?'':'good');}
}
Object.assign(A,{climateClose(S,year){const C=climateInit(S);C.pending=C.pending.filter(y=>y!==+year);return OK('حُفظ تقرير السنة في ملف التاجر');},climateRead(S,id){const n=climateInit(S).notices.find(n=>n.id===id);if(n)n.read=true;return OK('تمت القراءة');}});
