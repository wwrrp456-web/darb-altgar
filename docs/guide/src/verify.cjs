'use strict';
// Public engine data only. Fail when a documented snapshot needs review.
const fs=require('fs'),path=require('path');
module.exports=function(root){
const parts=path.join(root,'src/engine');
const joined=fs.readdirSync(parts).filter(f=>f.endsWith('.js')).sort().map(f=>fs.readFileSync(path.join(parts,f),'utf8')).join('');
if(joined!==fs.readFileSync(path.join(root,'src/engine.js'),'utf8'))throw Error('ملف المحرك المولد لا يطابق الأجزاء؛ يلزم مراجعة بناء اللعبة خارج مهمة الأدلة');
const E=require(path.join(root,'src/engine.js'));
const dir=path.join(root,'docs/guide/src');const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
const ref=read('reference.json'),facts=read('facts.json');
const equal=(a,b,label)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error('تغيّرت بيانات موثقة؛ راجع المحتوى ثم حدّث اللقطة: '+label);};
equal(facts.phases,E.PHASE_AT,'PHASE_AT');equal(facts.version,E.VER,'صيغة الحفظ');
for(const [key,value] of Object.entries(ref.constants))equal(value,E[key],key);
equal(ref.actions,Object.keys(E.A),'إجراءات اللاعب');equal(ref.recipes,E.RECIPES,'وصفات التصنيع');
equal(ref.goods,E.GOODS.map(g=>({id:g.id,name:g.name,w:g.w,pmin:g.pmin,pmax:g.pmax,spoil:g.spoil,lv:g.lv||1,org:g.org})),'السلع');
equal(facts.levels,E.LS.LEVELS.map(x=>({n:x.n,title:x.title,task:x.task,mode:x.mode,reward:x.reward,goalsSource:x.goals.toString()})),'الدروس');
equal(ref.fiqh,E.FIQH.CASES.map(c=>({id:c.id,title:c.title,diff:c.diff,mode:c.mode})),'مجلس السوق');
return {status:'pass',goods:ref.goods.length,levels:facts.levels.length,fiqh:ref.fiqh.length,actions:ref.actions.length};
};
