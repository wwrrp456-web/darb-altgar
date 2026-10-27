'use strict';
const E=require('../src/engine.js'),assert=require('node:assert/strict');
function fresh(){const S=E.newGame(4);S.phase=3;S.player.gold=90000;assert(E.A.buildShop(S,'riyadh').ok);assert(E.A.buildWarehouse(S,'riyadh').ok);delete S.player.famDebt;S.player.bank.loans=[];return S;}
const S=fresh(),pr=S.player.props.riyadh,id=pr.shops[0].id;
const before=E.save(S),shop=E.assetQuote(S,'riyadh','shop',id),warehouse=E.assetQuote(S,'riyadh','warehouse');
assert.equal(shop.price,800);assert.equal(shop.factor,.8);assert.equal(shop.accompanyingWarehouses,1);assert.equal(shop.accompanyingPrice,640);
assert.equal(warehouse.price,640);assert.equal(warehouse.capacityAfter,E.SHELF_CAP);assert.equal(shop.capacityAfter,0);assert.equal(E.save(S),before,'لا تغيير مال أو حالة أو عشوائية في التسعير');
S.player.bank.loans=[{amt:500,late:0}];assert.equal(E.assetQuote(S,'riyadh','shop',id).price,650);S.player.bank.loans=[];
S.player.famDebt={left:500};assert.equal(E.assetQuote(S,'riyadh','warehouse').price,520);delete S.player.famDebt;
pr.store.wheat=12.5;const q=E.assetQuote(S,'riyadh','shop',id);assert.equal(q.sharedStore[0].q,12.5);assert(q.load>0);
q.sharedStore[0].q=0;assert.equal(pr.store.wheat,12.5,'العرض نسخة منفصلة عن المخزون');
pr.shops[0].paymentDue=5;S.paymentDues=[{id:5,kind:'rent',amount:30,unknownPast:true}];pr.shops[0].arrears=2;
assert.equal(E.assetQuote(S,'riyadh','shop',id).knownRentArrears,30);assert(E.assetQuote(S,'riyadh','shop',id).unknownRentArrears);
pr.shops[0].endowed=true;assert.equal(E.assetQuote(S,'riyadh','shop',id).ok,false);delete pr.shops[0].endowed;
S.player.caravans[0].left=1;assert.equal(E.assetQuote(S,'riyadh','shop',id).ok,false);S.player.caravans[0].left=0;
S.orders=[{from:'riyadh',to:'hail'}];assert.equal(E.assetQuote(S,'riyadh','warehouse').ok,false);S.orders=[];
assert.equal(E.assetQuote(S,'riyadh','shop',-1).ok,false);assert.equal(E.assetQuote(S,'riyadh','caravan',1).ok,false);
const L=E.load(E.save(S));assert.equal(E.assetQuote(L,'riyadh','shop',id).ok,false,'المعاينة تحفظ مانع المتأخر المجهول بعد التحميل');assert(E.assetQuote(E.load(E.save(fresh())),'riyadh','warehouse').ok,'الحفظ لا يحتاج حقولاً إضافية');
// لا ربح من البناء ثم إعادة البيع.
for(const city of ['riyadh','cairo','hail']){const T=E.newGame(8);T.phase=3;T.player.gold=1e5;delete T.player.famDebt;const gold=T.player.gold;assert(E.A.buildShop(T,city).ok);const sh=T.player.props[city].shops[0];assert(E.assetQuote(T,city,'shop',sh.id).price<gold-T.player.gold);}
const B=E.newGame(6);B.phase=3;B.player.gold=10000;delete B.player.famDebt;const b0=B.player.gold;assert(E.A.rentShop(B,'riyadh','shop').ok);const bs=B.player.props.riyadh.shops[0];assert(E.A.buyShop(B,'riyadh',bs.id).ok);assert(E.assetQuote(B,'riyadh','shop',bs.id).price<b0-B.player.gold,'رسوم الاستئجار والشراء تتجاوز سعر إعادة البيع');
const D=fresh();D.player.gold=0;const dr=E.assetQuote(D,'riyadh','shop',D.player.props.riyadh.shops[0].id);assert.equal(dr.mode,'distressed');
console.log('PASS read-only valuation, calm/debt factors, capacity, accompanying warehouse, arrears uncertainty, guards, save and build/sell loss');
