import assert from 'node:assert/strict';
import * as create from '../api/create.mjs';
import * as join from '../api/join.mjs';
import * as action from '../api/action.mjs';
import * as health from '../api/health.mjs';
import storeModule from '../lib/store.js';

const post = (body) => new Request('http://localhost/api/test', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify(body),
});

const createdResponse = await create.POST(post({}));
assert.equal(createdResponse.status, 200);
const created = await createdResponse.json();
assert.match(created.roomCode, /^[A-Z0-9]{6}$/);
assert.equal(created.playerNumber, 1);

const players = [created];
for (let i = 0; i < 3; i++) {
  const response = await join.POST(post({roomCode: created.roomCode}));
  assert.equal(response.status, 200);
  players.push(await response.json());
}
assert.deepEqual(players.map(p => p.playerNumber), [1,2,3,4]);

for (const player of players.slice(0, 2)) {
  const response = await action.POST(post({roomCode: created.roomCode, playerId: player.playerId, action:'ready'}));
  assert.equal(response.status, 200);
}

const startResponse = await action.POST(post({roomCode: created.roomCode, playerId: created.playerId, action:'start'}));
assert.equal(startResponse.status, 200);

const room = await storeModule.store.getRoom(created.roomCode);
assert.equal(room.started, true);
assert.deepEqual(room.players.map(p => p.reality), ['PAST','PRESENT','FUTURE','ECHO']);

const healthResponse = await health.GET();
assert.equal(healthResponse.status, 200);
const healthData = await healthResponse.json();
assert.equal(healthData.ok, true);

console.log('CHRONO PARADOX Vercel API tests: PASS');
