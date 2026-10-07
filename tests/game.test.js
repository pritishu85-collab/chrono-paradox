const assert = require('assert');
const {
  makeRoom, addPlayer, publicState, toggleReady, startGame, gameStateFor,
  REALITIES, PROTOCOL_STEPS, advanceTemporalEvent, protocolState, castTimelineVote, timelineChoiceState
} = require('../lib/game');

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
  assert.ok(views.every(v=>v.world && v.secret && v.clue && v.temporalEvent));
  assert.strictEqual(room.temporalEvent.phase,0);
  assert.strictEqual(protocolState(room).requiredPlayerNumber,1);
  assert.throws(()=>castTimelineVote(room,players[0].id,'PRESERVE'),/before choosing/);

  for(let step=0;step<count;step++){
    const required=players[step];
    assert.strictEqual(protocolState(room).requiredPlayerNumber,required.number);
    assert.strictEqual(gameStateFor(room,required).temporalEvent.waitingForMe,true);
    const other=players.find(p=>p.id!==required.id);
    if(other) assert.throws(()=>advanceTemporalEvent(room,other.id),/Waiting for Player/);
    advanceTemporalEvent(room,required.id);
    assert.strictEqual(room.temporalEvent.phase,step+1);
    assert.strictEqual(room.temporalEvent.lastActor,required.number);
  }
  const complete=protocolState(room);
  assert.strictEqual(complete.phase,'COMPLETE');
  assert.strictEqual(complete.requiredPlayerNumber,null);
  assert.strictEqual(complete.history.length,count);
  assert.throws(()=>advanceTemporalEvent(room,players[0].id),/already complete/);
  assert.strictEqual(timelineChoiceState(room,players[0]).canVote,true);
  assert.throws(()=>castTimelineVote(room,players[0].id,'BAD'),/Invalid timeline choice/);
  for(let i=0;i<count;i++){
    const choice=i===count-1 ? 'ALTER' : 'PRESERVE';
    castTimelineVote(room,players[i].id,choice);
  }
  const choiceState=timelineChoiceState(room,players[0]);
  assert.strictEqual(choiceState.status,'RESOLVED');
  assert.strictEqual(choiceState.result.choice, count===2 ? 'PRESERVE' : (count===3 ? 'PRESERVE' : 'PRESERVE'));
  assert.throws(()=>castTimelineVote(room,players[0].id,'ALTER'),/already resolved/);
}

const full=makeRoom('FULL01');
for(let i=0;i<4;i++) addPlayer(full);
assert.throws(()=>addPlayer(full),/full/);

const noReady=makeRoom('READY01');
const a=addPlayer(noReady); addPlayer(noReady);
assert.throws(()=>startGame(noReady,a.id),/At least 2/);

console.log('CHRONO PARADOX Step 5 tests: PASS');
