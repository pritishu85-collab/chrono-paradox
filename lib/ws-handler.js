const { store } = require('./store');
const { getPlayer, publicState, gameStateFor } = require('./game');

function attachRealtimeConnection(ws, req) {
  const url = new URL(req.url, 'http://localhost');
  const code = String(url.searchParams.get('room')||'').trim().toUpperCase();
  const playerId = String(url.searchParams.get('player')||'');
  if(!code || !playerId){ ws.close(1008,'Missing room or player.'); return; }

  let poll, heartbeat;
  (async()=>{
    try {
      const room = await store.getRoom(code);
      const player = room && getPlayer(room,playerId);
      if(!room || !player){ ws.close(1008,'Lobby session not found.'); return; }

      let lastVersion=0;
      let alive=true;
      const send=payload=>{ if(ws.readyState===1) ws.send(JSON.stringify(payload)); };
      const push=async()=>{
        try{
          const latest=await store.getRoom(code);
          const p=latest && getPlayer(latest,playerId);
          if(!latest || !p){ ws.close(1008,'Room session ended.'); return; }
          if(latest.version!==lastVersion){
            lastVersion=latest.version;
            send({type:'room_state',...publicState(latest)});
            if(latest.started){
              send({type:'game_started'});
              send({type:'game_state',...gameStateFor(latest,p)});
            }
          }
        }catch{ send({type:'server_error',error:'Realtime state temporarily unavailable.'}); }
      };
      ws.on('pong',()=>{alive=true;});
      ws.on('close',()=>{clearInterval(poll);clearInterval(heartbeat);});
      ws.on('error',()=>{});
      poll=setInterval(push,750);
      heartbeat=setInterval(()=>{if(!alive){ws.terminate();return;} alive=false;ws.ping();},20000);
      await push();
    } catch { try{ws.close(1011,'Realtime server error.')}catch{} }
  })();
}
module.exports = { attachRealtimeConnection };
