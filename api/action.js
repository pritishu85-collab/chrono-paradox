const game = require('../lib/game');
const { store, withRoomLock } = require('../lib/store');
const { jsonResponse, optionsResponse, readJson } = require('../lib/vercel-api');

module.exports = async function handler(req,res){
  if(req.method==='OPTIONS') return optionsResponse(res);
  if(req.method!=='POST') return jsonResponse(res,{error:'Method not allowed.'},405);
  let body;
  try{ body=await readJson(req); }catch(e){ return jsonResponse(res,{error:e.message},400); }

  const code=String(body.roomCode||'').trim().toUpperCase();
  const playerId=String(body.playerId||'');
  if(!code||!playerId) return jsonResponse(res,{error:'Missing room or player session.'},400);

  try{
    await withRoomLock(code,async()=>{
      const room=await store.getRoom(code);
      if(!room||!game.getPlayer(room,playerId)) throw new Error('Lobby session not found.');
      if(body.action==='ready') game.toggleReady(room,playerId);
      else if(body.action==='start') game.startGame(room,playerId);
      else if(body.action==='temporal') game.advanceTemporalEvent(room,playerId);
      else if(body.action==='vote') game.castTimelineVote(room,playerId,String(body.choice||''));
       else if(body.action==='replay') game.acknowledgeTemporalReplay(room,playerId);
      else throw new Error('Unknown action.');
      await store.setRoom(room);
    });
    return jsonResponse(res,{ok:true});
  }catch(e){
    const msg=e.message;
    const status=msg==='Lobby session not found.'?404:
      (msg.includes('Only the host')?403:
      (msg.includes('At least 2')||msg.includes('already started')||msg.includes('already complete')?409:
      (msg.includes('not started')||msg.includes('already voted')||msg.includes('before choosing')||msg.includes('already resolved')||msg.includes('before replaying')||msg.includes('already entered')?409:400)));
    return jsonResponse(res,{error:msg},status);
  }
};
