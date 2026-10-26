/* سلّم21: الرتبة تختلف عن مستوى الخبرة؛ لا نختلق سجلاً قديماً للأجور. */
const TEAM = { expertDays: 120, cleanDays: 30, minPhase: 2, minAssets: 2, singleAssetStaff: 4, managerRaise: 1.25, scope: 1 };
function workerPayDay(S, w) {
 const p=w.wageProof;
 if(!p){w.wageProof={since:S.day,day:S.day,lastBad:null};return;}
 if(p.day>=S.day)return;
 if(p.day<S.day-1)p.since=S.day;
 const due=(S.paymentDues||[]).find(d=>d.id===w.paymentDue);
 if(due?.amount>1e-6)p.lastBad=p.day;
 p.day=S.day;
}
function workerCleanDays(S,w) {
 const p=w.wageProof;if(!p||p.day<S.day-1||p.day>S.day)return 0;
 return Math.max(0,Math.min(TEAM.cleanDays,p.day-p.since+1,p.lastBad==null?Infinity:S.day-p.lastBad));
}
function teamAssets(S,city) {
 const pr=S.player.props[city];if(!pr)return [];
 return pr.shops.map((s,i)=>({kind:'shop',id:s.id,label:(shKind(s)==='stall'?'بسطة ':'دكان ')+(i+1)}))
 .concat(pr.farm?[{kind:'farm',id:0,label:'المزرعة'}]:[],pr.butcher?[{kind:'butcher',id:0,label:'الملحمة'}]:[],Array.from({length:pr.whs||0},(_,i)=>({kind:'warehouse',id:i,label:'مخزن '+(i+1)})),S.player.factories.filter(f=>f.city===city).map(f=>({kind:'factory',id:f.id,label:RECIPES[f.recipe].name})));
}
function managerWage(m){return m?.rank===2&&Number.isFinite(m.wage)&&m.wage>0?m.wage:MGR[m.lv].wage;}
function managerScope(S,city,m,asset){return !!(m?.rank===2&&m.asset&&teamAssets(S,city).some(a=>a.kind===m.asset.kind&&a.id===m.asset.id)&&(!asset||(m.asset.kind==='factory'&&m.asset.id===asset.id)));}
function promotionQuote(S,city,workerId,kind,id) {
 const pr=S.player.props[city],c=S.cities[city],no=msg=>({ok:false,msg});
 if(!Object.hasOwn(S.cities,city)||!Object.hasOwn(S.player.props,city))return no('لا ممتلكات هنا.');
 const w=(pr.staff||[]).find(w=>w.id===workerId);if(!w)return no('اختر عاملاً يعمل في هذه المنطقة.');
 const assets=teamAssets(S,city),asset=assets.find(a=>a.kind===kind&&a.id===id),clean=workerCleanDays(S,w),reasons=[];
 if(S.phase<TEAM.minPhase)reasons.push('تحتاج الطور '+TEAM.minPhase);
 if(w.days<TEAM.expertDays)reasons.push('يحتاج '+Math.max(0,TEAM.expertDays-w.days)+' يوم خدمة ليصبح خبيراً');
 if(clean<TEAM.cleanDays)reasons.push('يحتاج '+(TEAM.cleanDays-clean)+' يوماً إضافياً من سجل الأجور النظيف');
 if(w.late||(S.paymentDues||[]).some(d=>d.id===w.paymentDue&&d.amount>0))reasons.push('سدّد مستحقات العامل أولاً');
 if(assets.length<TEAM.minAssets&&!(assets.length===1&&(pr.staff||[]).length>=TEAM.singleAssetStaff))reasons.push('تحتاج ممتلكين أو ممتلكاً واحداً مع '+TEAM.singleAssetStaff+' عمال');
 if(pr.mgr)reasons.push('يوجد مدير في المنطقة؛ لا تُستبدل خدمته تلقائياً');
 if(!asset)reasons.push('اختر ممتلكاً تملكه في المنطقة');
 const wage=Math.round(Math.max(MGR[1].wage,wkWage(S,c,w)*TEAM.managerRaise)*100)/100;
 return {ok:!reasons.length,msg:reasons.join(' · '),reasons,city,workerId,asset:asset?{...asset}:null,clean,days:w.days,wage,oldWage:wkWage(S,c,w),fee:0,scope:TEAM.scope};
}
function promoteWorker(S,city,workerId,kind,id) {
 const q=promotionQuote(S,city,workerId,kind,id);if(!q.ok)return NO(q.msg);
 const pr=S.player.props[city],w=pr.staff.find(w=>w.id===workerId);
 pr.mgr={rank:2,lv:1,id:w.id,sourceRole:w.role,sourceDays:w.days,asset:{kind:q.asset.kind,id:q.asset.id},wage:q.wage,days:0,since:S.day,audit:S.day,late:0};
 pr.staff=pr.staff.filter(x=>x!==w);
 return OK('رُقّي العامل إلى مدير '+q.asset.label+' بأجر '+q.wage+' ريال يومياً. اختلفت مهمته؛ راجع حاجة طاقم العمل بعد الترقية.');
}
function teamMigrate(S) {
 for(const pr of Object.values(S.player.props)){const m=pr.mgr;if(m?.rank===2){
   if(!Number.isSafeInteger(m.id)||!Number.isFinite(m.wage)||m.wage<=0||!m.asset||!['shop','farm','butcher','warehouse','factory'].includes(m.asset.kind)||!Number.isSafeInteger(m.asset.id)){pr.mgr=null;continue;}
   m.lv=1;m.days=Number.isSafeInteger(m.days)&&m.days>=0?m.days:0;S.nextId=Math.max(S.nextId||1,m.id+1);
 }}
 for(const pr of Object.values(S.player.props))for(const w of pr.staff||[]){const p=w.wageProof;if(p&&(!Number.isSafeInteger(p.since)||!Number.isSafeInteger(p.day)||p.since<0||p.day<p.since||p.day>S.day||p.lastBad!=null&&(!Number.isSafeInteger(p.lastBad)||p.lastBad<0||p.lastBad>p.day)))delete w.wageProof;}
}
