const assert = require('node:assert/strict');
const M = require('../src/world-map.js');
const E = require('../src/engine.js');
const cities = E.CITY_DEFS;
const base = M.extent(cities, null, 1.6);
const contains = (box, c) => c.x >= box[0] && c.x <= box[0]+box[2] && c.y >= box[1] && c.y <= box[1]+box[3];
assert(cities.every(c => contains(base, c)));
const extra = {id:'new-port',country:'new-country',x:-550,y:-280};
const expanded = M.extent([...cities, extra], null, 1.6);
assert(contains(expanded, extra) && cities.every(c => contains(expanded, c)), 'New countries beyond the old image fit automatically');
assert(contains(M.extent([...cities, extra], extra.country, 1), extra));
for (const center of [[-1e6,-1e6],[1e6,1e6]]) {
 const v=M.viewport(expanded,4,center);
 assert(v[0]>=expanded[0] && v[1]>=expanded[1]);
 assert(v[0]+v[2]<=expanded[0]+expanded[2]+1e-8 && v[1]+v[3]<=expanded[1]+expanded[3]+1e-8);
}
const roads = M.roads(cities,E.ADJ);
assert.equal(roads.filter(r=>!r.border).length,cities.length-E.COUNTRIES.length);
const edges=new Set(roads.map(r=>[r.a.id,r.b.id].sort().join(':')));
assert.equal(edges.size,roads.length,'Routes are not duplicated');
const reached=new Set([cities[0].id]);
for(let i=0;i<cities.length;i++) for(const {a,b}of roads) if(reached.has(a.id)||reached.has(b.id)){reached.add(a.id);reached.add(b.id);}
assert.equal(reached.size,cities.length,'All current cities remain connected');
assert(M.extent([],null,1).every(Number.isFinite));
console.log('OK   dynamic bounds, new country, pan limits and connected route network');
