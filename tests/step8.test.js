const assert = require('assert');
const {
  makeRoom, addPlayer, startGame, toggleReady, advanceTemporalEvent,
  castTimelineVote, acknowledgeTemporalReplay, temporalReplayState
} = require('../lib/game');

function setup(choice) {
  const room = makeRoom('REPLAY1');
  const players = [addPlayer(room), addPlayer(room), addPlayer(room), addPlayer(room)];
  players.slice(0,2).forEach(p => toggleReady(room,p.id));
  startGame(room, players[0].id);
  for (const p of players) advanceTemporalEvent(room,p.id);
  for (const p of players) castTimelineVote(room,p.id,choice);
  return {room,players};
}

const locked = makeRoom('LOCKR1');
const lp = addPlayer(locked);
lp.reality = 'PAST';
assert.strictEqual(temporalReplayState(locked, lp).status, 'LOCKED');

const preserve = setup('PRESERVE');
assert.strictEqual(temporalReplayState(preserve.room,preserve.players[0]).status,'OPEN');
assert.strictEqual(temporalReplayState(preserve.room,preserve.players[0]).canReplay,true);

acknowledgeTemporalReplay(preserve.room,preserve.players[0].id);
let state = temporalReplayState(preserve.room,preserve.players[0]);
assert.strictEqual(state.myReplay,true);
assert.strictEqual(state.acknowledged,1);
assert.strictEqual(state.canReplay,false);

for (const p of preserve.players.slice(1)) acknowledgeTemporalReplay(preserve.room,p.id);
state = temporalReplayState(preserve.room,preserve.players[0]);
assert.strictEqual(state.status,'COMPLETE');
assert.strictEqual(state.acknowledged,4);
assert.strictEqual(state.replayCount,1);
assert.ok(state.private.includes('spiral mark'));

const alter = setup('ALTER');
for (const p of alter.players) acknowledgeTemporalReplay(alter.room,p.id);
state = temporalReplayState(alter.room,alter.players[3]);
assert.strictEqual(state.status,'COMPLETE');
assert.strictEqual(state.replayCount,1);
assert.ok(state.private.includes('second trace'));

assert.throws(() => acknowledgeTemporalReplay(alter.room,alter.players[3].id), /already entered/);

console.log('CHRONO PARADOX Step 8 Temporal Replay tests: PASS');
