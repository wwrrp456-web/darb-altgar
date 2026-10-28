// يجرّب تركيبات وسائط Chromium بالترتيب ويطبع أول تركيبة تُقلع وتفتح صفحة، لتُستعمل في PW_ARGS: node scripts/pw-probe.js
// (لا يستعمل pw-env حتى لا تختلط الوسائط). مسار playwright يُكتشف كما في pw-env.
const fs = require('fs'), path = require('path');
const root = [process.env.PW_ROOT, '/opt/node-tools/node_modules/playwright', '/workspace/cloud-tools/node_modules/playwright', path.join(process.cwd(), 'node_modules/playwright')].filter(Boolean).find(p => fs.existsSync(path.join(p, 'package.json')));
if (!root) { console.error('لا playwright'); process.exit(2); }
const { chromium } = require(root);
const SETS = [
  ['--no-sandbox'],
  ['--no-sandbox', '--no-zygote'],
  ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--disable-gpu'],
  ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--disable-gpu', '--disable-features=NetworkServiceSandbox,NetworkServiceInProcess'],
  ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage', '--disable-gpu', '--in-process-gpu', '--disable-software-rasterizer'],
  ['--no-sandbox', '--no-zygote', '--single-process', '--disable-dev-shm-usage', '--disable-gpu'],
];
(async () => {
  for (const args of SETS) {
    let b; try { b = await chromium.launch({ args, timeout: 20000 }); const p = await b.newPage(); await p.setContent('<title>ok</title><p>مرحبا</p>'); const t = await p.title(); await b.close(); if (t === 'ok') { console.log('نجح: PW_ARGS="' + args.join(' ') + '"'); process.exit(0); } }
    catch (e) { console.log('فشل: ' + args.join(' ') + '  ←  ' + String(e.message).split('\n')[0].slice(0, 140)); try { b && await b.close(); } catch (_) {} }
  }
  console.log('لم تنجح أي تركيبة؛ أرسل الناتج كاملاً.'); process.exit(1);
})();
