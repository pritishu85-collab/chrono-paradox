const crypto = require('node:crypto');
const game = require('../lib/game');
const { store } = require('../lib/store');
const { jsonResponse, optionsResponse } = require('../lib/vercel-api');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return optionsResponse(res);
  if (req.method !== 'POST') return jsonResponse(res, { error: 'Method not allowed.' }, 405);
  let code;
  for (let i=0;i<20;i++) {
    const candidate = crypto.randomBytes(3).toString('hex').toUpperCase();
    if (!(await store.getRoom(candidate))) { code=candidate; break; }
  }
  if (!code) return jsonResponse(res, {error:'Could not create a room. Please try again.'},503);
  const room = game.makeRoom(code);
  const player = game.addPlayer(room);
  await store.setRoom(room);
  return jsonResponse(res,{roomCode:room.code,playerId:player.id,playerNumber:player.number});
};
