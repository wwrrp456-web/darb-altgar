// يستخرج نصوص الفقه ومعاملات التمويل والتكافل من اللعبة نفسها: node docs/review/export_data.js > /tmp/review_data.json
const C = require('../../src/cards.js'), E = require('../../src/engine.js');
process.stdout.write(JSON.stringify({ cards: C.LIST.filter(i => C.CARDS[i].track === 'f').map(i => Object.assign({ id: i }, C.CARDS[i])), FIN: E.FIN, TK: E.TK, ZAKAT: E.ZAKAT, note: C.NOTE }));
