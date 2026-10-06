const assert = require('assert');
const { makeRoom, addPlayer, publicState, toggleReady, startGame, gameStateFor, REALITIES } = require('../lib/game');

for (const count of [2,3,4]) {
  const room=makeRoom('ABC123');
  const players=[];
  for(let i=0;i<count;i++) players.push(addPlayer(room));
  assert.strictEqual(room.players.length,count);
  assert.strictEqual(room.hostId,players[0].id);
  assert.deepStrictEqual(players.map(p=>p.number),Array.from({length:count},(_,i)=>i+1));
  players.slice(0,2).forEach(p=>toggleReady(room,p.id));
  assert.strictEqual(publicState(room).canStart,true);
  startGame(room,players[0].id);
  assert.strictEqual(room.started,true);
  assert.deepStrictEqual(players.map(p=>p.reality),REALITIES.slice(0,count));
  const views=players.map(p=>gameStateFor(room,p));
  assert.strictEqual(new Set(views.map(v=>v.reality)).size,count);
  assert.ok(views.every(v=>v.world && v.secret && v.clue));
}

const full=makeRoom('FULL01');
for(let i=0;i<4;i++) addPlayer(full);
assert.throws(()=>addPlayer(full),/full/);

const noReady=makeRoom('READY01');
const a=addPlayer(noReady); addPlayer(noReady);
assert.throws(()=>startGame(noReady,a.id),/At least 2/);

console.log('CHRONO PARADOX tests: PASS');
