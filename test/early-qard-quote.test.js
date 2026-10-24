'use strict';
const E=require('../src/engine.js'),a=require('node:assert/strict');
function fresh(level=3){const S=E.newGame(8);E.A.learnSetChar(S,'trader');S.learn.level=level;S.player.wallet.sar=5000;S.player.famDebt.left=0;return S;}
let S=fresh(),raw=E.save(S),q=E.earlyQardQuote(S);a(q.ok);a.equal(q.limit,2000);a.equal(q.days,90);a.equal(q.grace,30);a.equal(q.markup,0);a.equal(q.src,'salem');a.equal(E.save(S),raw,'المعاينة لا تمنح أو تعدل أو تقرض');
S=fresh(5);a.equal(E.earlyQardQuote(S).limit,3000);S=fresh();S.player.salemQard={onTime:1};a.equal(E.earlyQardQuote(S).limit,3000);
for(const n of [0,-1,1999,2000.5,Infinity,NaN,'2000',3001])a.equal(E.earlyQardQuote(fresh(),n).ok,false);
for(const kind of ['level','active','late','family','travel','capacity','debtCap']){S=fresh();if(kind==='level')S.learn.level=2;if(kind==='active')S.player.bank.loans=[{src:'salem',type:'qard',amt:1}];if(kind==='late')S.player.bank.loans=[{type:'mur',amt:10,due:0}];if(kind==='family'){S.player.famDebt.left=100;S.player.famDebt.due=0;S.player.famDebt.mPaid=0;}if(kind==='travel')S.player.caravans[0].left=1;if(kind==='capacity')S.player.wallet.sar=100;if(kind==='debtCap')S.player.famDebt.left=1100;raw=E.save(S);a.equal(E.earlyQardQuote(S).ok,false,kind);a.equal(E.save(S),raw,kind);}
S=fresh(5);S.player.famDebt.left=700;S.player.bank.loans=[{type:'qard',city:'hail',amt:200,due:100}];q=E.earlyQardQuote(S);a(q.ok);a.equal(q.limit,2100);a.equal(q.limit+q.existingDebt,3000);a(q.limit<=.5*(E.netWorth(S)+2000));
S=fresh();S.player.wallet.sar=1700;q=E.earlyQardQuote(S);a.equal(q.limit,2000,'العربة300 جزء منالثروة');a(q.ok);S.player.wallet.sar=1698;q=E.earlyQardQuote(S);a.equal(q.limit,1999);a.equal(q.code,'capacity');
S=fresh();delete S.player.salemQard;const old=E.load(E.save(S));a(E.earlyQardQuote(old).ok);a.equal(old.player.salemQard,undefined);a.equal(E.FIN.qard.max,4000);a.equal(E.FIN.qard.days,60);
console.log('PASS early loan quote: readonly, levels, caps, existing debt, travel, due payments, integer amounts, old saves, unchanged phase4 policy');
