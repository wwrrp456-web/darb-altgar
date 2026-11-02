#!/usr/bin/env node
'use strict';
// قياس محدود: بذرة واحدة وسنتان، وتُحفظ النتيجة لكل بصمة مصدر دون تكرار.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'specs/013-storage-flow/measure.json');
function measure(label){
 const baseline='9b992cd',control=label.startsWith('control-'),isBefore=label.endsWith('before'),dispatchEvery=control?1:30;
 const src=isBefore?require('node:child_process').execFileSync('git',['show',baseline+':src/engine.js'],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,'src/engine.js'),'utf8'),hash=crypto.createHash('sha256').update(src).digest('hex');
 const report=fs.existsSync(dest)?JSON.parse(fs.readFileSync(dest,'utf8')):{};
 if(report[label]?.sourceHash===hash&&report[label]?.dispatchEvery===dispatchEvery){console.log(JSON.stringify(report[label]));return report[label];}
 const stopped=new Set();let instrumented=src.replace('if (!ok || storeRoom(S, f.city) < GD[rc.out].w * output) break;',"if (!ok || storeRoom(S, f.city) < GD[rc.out].w * output) { if (storeRoom(S,f.city)<GD[rc.out].w*output) __stop(S,f); break; }")
 .replace('if (storeRoom(S, f.city) < GD[rc.out].w * output) break;',"if (storeRoom(S, f.city) < GD[rc.out].w * output) { __stop(S,f); break; }");
 assert.notEqual(src,instrumented,'موضعا قياس توقف المساحة موجودان');
 const box={module:{exports:{}},require:require('node:module').createRequire(path.join(root,'src/engine.js')),console,__stop:(S,f)=>stopped.add(S.day+':'+f.id)};
 vm.runInNewContext(instrumented,box);const E=box.module.exports,S=E.newGame(5),A=E.A;
 A.chooseStart(S,'eg');A.learnSetChar(S,'trader');S.noLock=1;S.learn.level=11;S.learn.stage=23;S.phase=3;S.player.gold=50000;S.noEvents=true;S.noShocks=true;
 assert(A.buildShop(S,'cairo').ok);assert(A.buildWarehouse(S,'cairo').ok);
 for(const recipe of ['textile','sugar'])assert(A.buildFactory(S,'cairo',recipe).ok);
 if(E.STORAGE?.export)for(const f of S.player.factories)assert(A.setFactoryExport(S,f.id,true).ok);
 const before=E.netWorth(S),car=S.player.caravans[0];
 for(let d=0;d<708;d++){
  // نقل وبيع حقيقيان، بالمقدار الذي تتسع له القافلة العادية؛ الضبط اليومي يفصل الربحية عن التعطل.
  if(d%dispatchEvery===0)for(const g of ['textile','sugar']){A.fromStore(S,car.id,g,10000);if(car.cargo[g]>=1)A.sell(S,car.id,g,Math.floor(car.cargo[g]));}
  E.tick(S,false);S.pause=false;
 }
 const row={sourceHash:hash,seed:5,days:708,city:'cairo',recipes:['textile','sugar'],startingCash:50000,dispatchEvery,baseline:isBefore?baseline:null,initialWealth:before,wealth:E.netWorth(S),blockedFactoryDays:stopped.size,blockedDays:new Set([...stopped].map(x=>x.split(':')[0])).size,capacity:E.storeCap(S,'cairo'),exported:S.player.factories.reduce((n,f)=>n+(f.exported||0),0)};
 report[label]=row;fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(row));return row;
}
if(require.main===module){const label=process.argv[2];if(!['before','after','control-before','control-after'].includes(label)||process.argv.length!==3)throw Error('استعمل before أو after أو control-before أو control-after فقط.');measure(label);}
module.exports=measure;
