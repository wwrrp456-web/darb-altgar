'use strict';
// اختيار الدفعة يُختبر في مستودع Git فعلي وبعمليات المشغّل نفسها.
const a=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'darb-batch-')),dir=path.join(root,'test');
const names=['numerals','icons','save','learn','tutorial','feature','modified','unrelated'],core=names.slice(0,5),run=(args)=>spawnSync(process.execPath,[path.join(dir,'run.js'),...args],{cwd:root,encoding:'utf8'});
const write=(file,text)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),text);};
const git=(...args)=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8'});a.equal(r.status,0,r.stderr);};
try {
 fs.mkdirSync(dir);fs.copyFileSync(path.join(__dirname,'run.js'),path.join(dir,'run.js'));
 write('test/all.sh','for t in '+names.join(' ')+'; do\n true\ndone\n');
 for(const n of names)write('test/'+n+'.test.js',"console.log('OK');");
 const map={'src/shared.js':'*','src/local.js':['feature'],'docs/*':[],'docs/player.html':['unrelated'],'test/modified.test.js':['modified'],'test/fixtures/known.json':['unrelated']};
 const profiles={sample:{files:['src/shared.js','src/local.js','test/modified.test.js','test/fixtures/known.json'],tests:['feature']}};
 write('test/map.json',JSON.stringify(map));write('test/batches.json',JSON.stringify(profiles));write('src/shared.js','// base\n');write('src/local.js','// base\n');write('docs/note.md','base');write('test/fixtures/known.json','{}');
 git('init','-q');git('add','.');git('-c','user.name=Probe','-c','user.email=probe@example.invalid','commit','-qm','base');
 const selected=(args)=>{const r=run(args);a.equal(r.status,0,r.stdout+r.stderr);return r.stdout.trim().split('\n').at(-1).split(' ');};
 const args=['--changed','--batch','sample','--list'];
 write('src/shared.js','// changed\n');a.deepEqual(selected(args),[...core,'feature'],'الاختبار المتأثر والنواة دون غير المرتبط');
 a.deepEqual(selected(['--changed','--list']),names,'التغيير المشترك بلا اختيار صريح يظل شاملاً');
 write('test/modified.test.js',"console.log('OK changed');");a.deepEqual(selected(args),[...core,'feature','modified'],'لا يسقط الاختبار المعدل من الدفعة');
 write('test/fixtures/known.json','{"captured":true}');a.deepEqual(selected(args),[...core,'feature','modified'],'بيانات الالتقاط المسجلة ضمن الدفعة لا تفرض إعادة لعب طويل تلقائياً');
 write('src/new.js','// unknown\n');a.deepEqual(selected(args),names,'ملف غير مغطى يعيد الحزمة كاملة');fs.unlinkSync(path.join(root,'src/new.js'));
 write('docs/player.html','<html></html>');a.deepEqual(selected(args),names,'HTML منشور داخلdocsليس مجرد توثيق آمن');fs.unlinkSync(path.join(root,'docs/player.html'));
 a.notEqual(run(['--changed','--batch','missing','--list']).status,0);a.notEqual(run(['--batch','sample','--list']).status,0);a.notEqual(run(['--changed','--batch','sample','feature','--list']).status,0,'لا مرشح يسقط النواة بعد اختيار الدفعة');
 git('restore','src/shared.js','test/modified.test.js','test/fixtures/known.json');write('docs/note.md','changed');const doc=run(['--changed','--list']);a.equal(doc.status,0);a.match(doc.stdout,/لا تغييرات تستدعي الاختبارات/,'توثيق فقط لا يكرر اختبارات اللعبة');
 write('src/local.js','// changed\n');a.deepEqual(selected(['--changed','--list']),[...core,'feature'],'الاختيار العادي يضيف النواة تلقائياً');
 profiles.sample.tests=['missing-test'];write('test/batches.json',JSON.stringify(profiles));a.notEqual(run(args).status,0,'اسم اختبار خاطئ يفشل بوضوح');
 console.log('PASS batch selection: exact impact, permanent core, modified tests, unknown-file fallback, runnable docs, invalid configuration and docs-only changes');
}finally {fs.rmSync(root,{recursive:true,force:true});}
