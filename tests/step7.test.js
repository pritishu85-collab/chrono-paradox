const assert = require('assert');
const {
  makeRoom, addPlayer, startGame, toggleReady, advanceTemporalEvent,
  castTimelineVote, temporalMemoryState
} = require('../lib/game');

function setup(choice) {
  const room = makeRoom('MEMORY1');
  const players = [addPlayer(room), addPlayer(room), addPlayer(room), addPlayer(room)];
  players.slice(0,2).forEach(p => toggleReady(room,p.id));
  startGame(room, players[0].id);
  for (const p of players) advanceTemporalEvent(room,p.id);
  for (const p of players) castTimelineVote(room,p.id,choice);
  return {room,players};
}

const lockedRoom = makeRoom('LOCKED1');
const lockedPlayer = addPlayer(lockedRoom);
lockedPlayer.reality='PAST';
assert.strictEqual(temporalMemoryState(lockedRoom,lockedPlayer).status,'LOCKED');

const preserve = setup('PRESERVE');
const preserveMemory = temporalMemoryState(preserve.room,preserve.players[0]);
assert.strictEqual(preserveMemory.status,'RESOLVED');
assert.strictEqual(preserveMemory.choice,'PRESERVE');
assert.strictEqual(preserveMemory.state,'ONE CONTINUOUS MEMORY');
assert.strictEqual(preserveMemory.entries.length,5);
assert.ok(preserveMemory.private.includes('spiral mark'));

const alter = setup('ALTER');
const alterMemory = temporalMemoryState(alter.room,alter.players[3]);
assert.strictEqual(alterMemory.status,'RESOLVED');
assert.strictEqual(alterMemory.choice,'ALTER');
assert.strictEqual(alterMemory.state,'TWO HISTORIES REMEMBERED');
assert.strictEqual(alterMemory.entries.length,5);
assert.ok(alterMemory.private.includes('two traces'));

console.log('CHRONO PARADOX Step 7 Temporal Memory tests: PASS');
