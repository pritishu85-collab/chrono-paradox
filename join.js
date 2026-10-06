const game = require('../lib/game');
const { store, withRoomLock } = require('../lib/store');
const { jsonResponse, optionsResponse, readJson } = require('../lib/vercel-api');
module.exports = async function handler(req,res){
  if(req.method==='OPTIONS') return optionsResponse(res);
  if(req.method!=='POST') return jsonResponse(res,{error:'Method not allowed.'},405);
  let body; try{body=await readJson(req);}catch(e){return jsonResponse(res,{error:e.message},400);}
  const code=String(body.roomCode||'').trim().toUpperCase();
  if(!/^[A-Z0-9]{6}$/.test(code)) return jsonResponse(res,{error:'Enter the 6-character room code.'},400);
  try{
    const result=await withRoomLock(code,async()=>{
      const room=await store.getRoom(code);
      if(!room) throw new Error('Room not found. Check the code and try again.');
      const player=game.addPlayer(room); await store.setRoom(room);
      return {roomCode:room.code,playerId:player.id,playerNumber:player.number};
    });
    return jsonResponse(res,result);
  }catch(e){const msg=e.message;const status=msg==='Room not found. Check the code and try again.'?404:(msg.includes('already started')||msg.includes('full')?409:503);return jsonResponse(res,{error:msg},status);}
};
