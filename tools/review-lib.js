'use strict';
// WP-20: أدوات مشتركة لتصدير الدفعات واستيرادها بالأرقام (السجل docs/review/registry.json)
const fs = require('node:fs'), path = require('node:path');
const REPO = path.join(__dirname, '..');
const argv = a => { const o = { _: [] }; for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) { const k = a[i].slice(2); if (['dry', 'no-verify'].includes(k)) o[k] = true; else o[k] = a[++i]; } else o._.push(a[i]); } return o; };
const paths = root => ({ root, registry: path.join(root, 'docs/review/registry.json'), batches: path.join(root, 'docs/review/batches'), flags: path.join(root, 'src/review-flags.js') });
const loadRegistry = root => JSON.parse(fs.readFileSync(paths(root).registry, 'utf8'));
const saveRegistry = (root, reg) => fs.writeFileSync(paths(root).registry, JSON.stringify(reg, null, 1) + '\n');
const ID = /^\[([A-Z]-\d+)\][ \t]*/;
const ST = { approved: 'معتمد', pending: 'ظاهر بلا اعتماد موثّق', hidden: 'مخفي بقرار BM' };
module.exports = { REPO, argv, paths, loadRegistry, saveRegistry, ID, ST };
