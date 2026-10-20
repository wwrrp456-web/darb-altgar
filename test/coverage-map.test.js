'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const core = require('./coverage-core.cjs');

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'darb-coverage-check-'));
  const write = (file, value) => { fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true }); fs.writeFileSync(path.join(dir, file), value); };
  const a = ";(function(){\nfunction onlyBoot(){ return 'إقلاع 🐪'; }\nonlyBoot();\n";
  const b = "function invoked(){ return 'اختبار 🐪'; }\nglobalThis.sample={invoked}; if(typeof module!=='undefined')module.exports=sample;\n})();\n";
  const ui = "function uiCalled(){return 'واجهة';}\n";
  write('src/engine/00-head.js', a); write('src/engine/01-actions.js', b);
  write('src/ui/00-ui.js', ui); write('src/engine.js', a + b); write('src/template.html', '<html></html>');
  const startup = "function startupOnlyData(){return 'تحميل فقط';} startupOnlyData();\n";
  write('src/startup.js', startup);
  write('build.js', '// بناء تجريبي'); write('version.json', JSON.stringify({ id: 'abcdefabcd' }));
  const html = '<!doctype html><script>\n' + a + b + '\n</script><script>' + ui + '\n' + startup + '</script>';
  write('index.html', html);
  const data = core.catalog(dir, true);
  const source = '// 🐪\n' + a + b;
  const start = source.indexOf('function invoked'), end = source.indexOf('}', start) + 1;
  const functions = [{ functionName: '', ranges: [{ startOffset: 0, endOffset: source.length, count: 1 }] }, { functionName: 'invoked', ranges: [{ startOffset: start, endOffset: end, count: 1 }] }];
  assert.deepEqual([...core.fromBrowser({ source, functions }, data)], ['src/engine/01-actions.js']);
  functions[1].ranges[0].count = 0;
  assert.equal(core.fromBrowser({ source, functions }, data).size, 0);
  console.log('✓ إزاحات العربية والرموز صحيحة، ولا يُحسب التعريف أو المدى الأعلى.');

  function child(name, code) {
    const file = path.join(dir, name + '.cjs'), output = path.join(dir, name + '.json'); fs.writeFileSync(file, code);
    return new Promise((resolve, reject) => {
      const p = spawn(process.execPath, ['--require', path.join(__dirname, 'coverage-hook.cjs'), file], { env: { ...process.env, DARB_COVERAGE_ROOT: dir, DARB_COVERAGE_TEST: name, DARB_COVERAGE_OUT: output }, stdio: ['ignore', 'pipe', 'pipe'] });
      let text = ''; p.stdout.on('data', x => { text += x; }); p.stderr.on('data', x => { text += x; });
      p.once('error', reject); p.once('close', code => { if (code !== 0) reject(Error('فشل جامع تجريبي: ' + text)); else resolve(JSON.parse(fs.readFileSync(output, 'utf8'))); });
    });
  }
  let server;
  try {
    const node = await child('node', "const E=require('./src/engine.js');E.invoked();process.exit(0);");
    assert.deepEqual(node.nodeFiles, ['src/engine/01-actions.js']); assert.deepEqual(node.errors, []);
    console.log('✓ جامع Node يلتقط الاستدعاء ويستبعد دالة الإقلاع.');
    server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = 'http://127.0.0.1:' + server.address().port;
    const browser = await child('browser', `const {chromium}=require('/opt/node-tools/node_modules/playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext();const p=await c.newPage();await p.goto(${JSON.stringify(url)});await p.evaluate(()=>{sample.invoked();uiCalled();});await c.close();await b.close();process.exit(0);})();`);
    assert.deepEqual(browser.browserFiles, ['src/engine/01-actions.js', 'src/ui/00-ui.js']); assert.deepEqual(browser.errors, []); assert(browser.browserSnapshots > 0);
    console.log('✓ جامع المتصفح يلتقط الاستدعاءات قبل إغلاق السياق، ويستبعد الإقلاع.');
    const boot = await child('boot', `const {chromium}=require('/opt/node-tools/node_modules/playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto(${JSON.stringify(url)});await b.close();process.exit(0);})();`);
    assert.deepEqual(boot.browserFiles, []); assert.deepEqual(boot.errors, []);
    console.log('✓ صفحة تُحمّل فقط لا تربط أجزاء المصدر بكل الاختبارات.');
    const automatic = await child('automatic', `const {chromium}=require('/opt/node-tools/node_modules/playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto(${JSON.stringify(url)});await p.evaluate(()=>sample.invoked());await p.evaluate(()=>{location.href='/?again=1';});await p.waitForURL('**/?again=1');const loaded=p.waitForEvent('load');await p.evaluate(()=>location.reload());await loaded;await p.waitForLoadState('load');await p.evaluate(()=>uiCalled());await b.close();process.exit(0);})();`);
    assert.deepEqual(automatic.browserFiles, ['src/engine/01-actions.js', 'src/ui/00-ui.js']); assert.deepEqual(automatic.errors, []);
    console.log('✓ الانتقال وإعادة التحميل التلقائيان يحفظان التنفيذ السابق ويستبعدان الإقلاع الجديد.');
    // تشغيل الأداة نفسها داخل مستودع تجريبي مستقل للتحقق من الدمج وسلامة النواتج.
    for (const file of ['coverage-map.js', 'coverage-core.cjs', 'coverage-hook.cjs']) write('test/' + file, fs.readFileSync(path.join(__dirname, file)));
    write('test/all.sh', 'for t in alpha beta; do\n true\ndone\n');
    write('test/run.js', 'const SLOW = {};'); write('docs/.keep', '');
    write('src/support.js', "(function(){function extra(){return 'بيانات';} module.exports={extra};})();\n");
    write('index.html', html + '<script>' + fs.readFileSync(path.join(dir, 'src/support.js'), 'utf8') + '</script>');
    write('test/alpha.test.js', "const E=require('../src/engine.js');if(!process.env.DARB_SKIP_DEMO)E.invoked();process.exit(0);");
    write('test/beta.test.js', "require('../src/support.js').extra();process.exit(0);");
    const generate = (args, extra = {}) => new Promise((resolve, reject) => {
      const p = spawn(process.execPath, [path.join(dir, 'test/coverage-map.js'), ...args], { cwd: dir, env: { ...process.env, ...extra }, stdio: ['ignore', 'pipe', 'pipe'] });
      let text = ''; p.stdout.on('data', x => { text += x; }); p.stderr.on('data', x => { text += x; });
      p.once('error', reject); p.once('close', code => resolve({ code, text }));
    });
    const generated = () => JSON.parse(fs.readFileSync(path.join(dir, 'test/map.coverage.json'), 'utf8'));
    let result = await generate(['--jobs', '2']); assert.equal(result.code, 0, result.text);
    assert.deepEqual(generated()['src/engine/01-actions.js'], ['alpha']); assert.deepEqual(generated()['src/support.js'], ['beta']);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'test/map.coverage.meta.json'), 'utf8')).fullRun.names.length, 2);
    result = await generate(['alpha'], { DARB_SKIP_DEMO: '1' }); assert.equal(result.code, 0, result.text);
    assert.deepEqual(generated()['src/engine/01-actions.js'], []); assert.deepEqual(generated()['src/support.js'], ['beta']);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'test/map.coverage.meta.json'), 'utf8')).fullRun.names.length, 2);
    console.log('✓ الجولة الجزئية تزيل الروابط القديمة وتحفظ تغطية بقية الاختبارات.');
    const preserved = fs.readFileSync(path.join(dir, 'test/map.coverage.json'));
    write('test/alpha.test.js', "console.log('FAIL تجربة فشل متعمدة');process.exit(0);");
    result = await generate(['alpha']); assert.notEqual(result.code, 0); assert.match(result.text, /تغيّر المصدر أو الاختبارات/);
    result = await generate([]); assert.notEqual(result.code, 0);
    assert.deepEqual(fs.readFileSync(path.join(dir, 'test/map.coverage.json')), preserved);
    console.log('✓ تُرفض البيانات القديمة، وفشل الاختبار لا يستبدل الخريطة السليمة.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
main().catch(error => { console.error('فشل فحص أداة التغطية: ' + error.message); process.exitCode = 1; });
