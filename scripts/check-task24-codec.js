'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),a=require('node:assert/strict'),{createRequire}=require('node:module'),{execFileSync}=require('node:child_process');
// تشخيص خاص بدفعة24/أ-1: يتطلب وجود commitالمرجع محلياً، ولا يدخل الحزمة الدائمة.
const root=path.resolve(__dirname,'..'),req=createRequire(path.join(root,'src/engine.js')),baseline={exports:{}};
const old=execFileSync('git',['show','b6dbe54:src/engine.js'],{cwd:root,encoding:'utf8'});
vm.runInNewContext(old,{module:baseline,require:req,console},{timeout:30000});
const E=require(path.join(root,'src/engine.js'));
function payload(engine){const S=engine.newGame(5);for(let i=0;i<60;i++)engine.tick(S);return engine.save(S);}
const before=payload(baseline.exports),after=payload(E),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const previousCodec=execFileSync('git',['show','b6dbe54:src/savecode.js'],{cwd:root,encoding:'utf8'}),currentCodec=fs.readFileSync(path.join(root,'src/savecode.js'),'utf8');
a.equal(before,after,'نفس حمولة اختبار السرعة قبل وبعد دفعة الحصّالة');a.equal(previousCodec,currentCodec,'لم تتغير خوارزمية الترميز');
const report={baseline:'b6dbe54',payloadBytes:Buffer.byteLength(after),payloadHash:hash(after),identicalPayload:true,unchangedCodec:true,codecHash:hash(currentCodec)};
fs.writeFileSync(path.join(root,'docs/review/CODEC_TASK24_PROBE.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
