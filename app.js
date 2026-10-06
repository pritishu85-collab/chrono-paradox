const $=id=>document.getElementById(id);
let session={roomCode:null,playerId:null,playerNumber:null,host:false}, socket, reconnectTimer, reconnectDelay=1000;

async function api(path,data){
  const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data||{})});
  const text=await r.text();
  let j;
  try{j=JSON.parse(text);}catch{throw Error(`Server route ${path} did not return JSON (HTTP ${r.status}). Please redeploy the latest version.`);}
  if(!r.ok)throw Error(j.error||'Request failed');
  return j;
}
function message(t){$('message').textContent=t||'';}
function screen(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$(id).classList.add('active');}

function setConnection(text,online=false){
  $('connection').classList.toggle('online',online);
  $('connection').innerHTML=`<i></i> ${text}`;
}

function connectEvents(){
  if(socket){try{socket.close(1000,'reconnect')}catch{}}
  clearTimeout(reconnectTimer);
  if(!session.roomCode||!session.playerId)return;
  const proto=location.protocol==='https:'?'wss':'ws';
  const url=`${proto}://${location.host}/api/ws?room=${encodeURIComponent(session.roomCode)}&player=${encodeURIComponent(session.playerId)}`;
  setConnection('Connecting…');
  socket=new WebSocket(url);
  socket.onopen=()=>{reconnectDelay=1000;setConnection('Connected',true);};
  socket.onmessage=e=>{try{handle(JSON.parse(e.data));}catch(error){console.error('Realtime message error',error);}};
  socket.onerror=()=>setConnection('Reconnecting…');
  socket.onclose=()=>{
    setConnection('Reconnecting…');
    clearTimeout(reconnectTimer);
    reconnectTimer=setTimeout(connectEvents,reconnectDelay);
    reconnectDelay=Math.min(reconnectDelay*2,8000);
  };
}

function render(s){
  session.host=s.hostId===session.playerId;
  $('roomCodeDisplay').textContent=s.roomCode;
  $('playerCount').textContent=s.players.length+'/4';
  let ready=s.players.filter(p=>p.ready).length;
  $('readyCount').textContent=ready+'/2';
  $('players').innerHTML=s.players.map(p=>`<div class="player ${p.id===session.playerId?'me':''}">
    <div class="player-top"><span>PLAYER ${p.number}</span><span>${p.host?'HOST':''}</span></div>
    <div class="player-number">P${p.number}</div>
    <div class="status ${p.ready?'ready':''}">${p.ready?'● READY':'○ NOT READY'}</div>
    ${p.id===session.playerId?`<button class="ghost" style="margin-top:10px" onclick="toggleReady()">${p.ready?'UNREADY':'READY UP'}</button>`:''}
  </div>`).join('');
  $('startBtn').disabled=!(session.host&&s.players.length>=2&&ready>=2);
  $('roomHint').textContent=session.host?(ready>=2?'Enough players are ready. You can begin.':'At least 2 players must be ready to begin.'):'Waiting for the host to start the game.';
}

function handle(m){
  if(m.type==='room_state')render(m);
  if(m.type==='game_started')message('');
  if(m.type==='game_state')renderReality(m);
  if(m.type==='server_error')message(m.error);
}

function renderReality(g){
  const labels={PAST:'R-01',PRESENT:'R-02',FUTURE:'R-03',ECHO:'R-04'};
  $('realityName').textContent=g.reality;
  $('realityName').dataset.reality=g.reality;
  $('realitySubtitle').textContent=g.realitySubtitle;
  $('realityBadge').textContent=labels[g.reality]||'R-?';
  $('realityPlayer').textContent=g.playerNumber;
  $('worldName').textContent=g.world.name;
  $('worldDescription').textContent=g.world.description;
  $('objects').innerHTML=g.world.sharedObjects.map(o=>`<div class="object"><span>◇</span><div><strong>${o.name}</strong><small>${o.description}</small></div></div>`).join('');
  $('secretTitle').textContent=g.secretTitle;
  $('secretText').textContent=g.secret;
  $('clueText').textContent=g.clue;

  const ev=g.temporalEvent;
  $('eventTitle').textContent=ev.title;
  $('eventShared').textContent=ev.shared;
  $('eventPrivate').textContent=ev.private;
  $('eventPhase').textContent=`PHASE ${ev.phaseNumber+1} / 4`;
  $('eventActor').textContent=ev.lastActor?`Last action: Player ${ev.lastActor}`:'No action yet';
  $('temporalBtn').textContent=ev.actionLabel;
  $('temporalBtn').disabled=!ev.actionAvailable;
  $('temporalBtn').classList.toggle('complete',!ev.actionAvailable);

  document.body.dataset.reality=g.reality.toLowerCase();
  screen('realityScreen');
}

async function create(){try{let j=await api('/api/create');session={...session,...j};$('menu').classList.add('hidden');$('room').classList.remove('hidden');connectEvents();}catch(e){message(e.message);}}
async function join(){let code=$('roomCode').value.trim();if(code.length!==6)return message('Enter the 6-character room code.');try{let j=await api('/api/join',{roomCode:code});session={...session,...j};$('menu').classList.add('hidden');$('room').classList.remove('hidden');connectEvents();}catch(e){message(e.message);}}
async function toggleReady(){try{await api('/api/action',{roomCode:session.roomCode,playerId:session.playerId,action:'ready'});}catch(e){message(e.message);}}
async function start(){try{await api('/api/action',{roomCode:session.roomCode,playerId:session.playerId,action:'start'});}catch(e){message(e.message);}}
async function temporal(){
  $('temporalBtn').disabled=true;
  try{await api('/api/action',{roomCode:session.roomCode,playerId:session.playerId,action:'temporal'});}
  catch(e){message(e.message);}
}

$('enterBtn').onclick=()=>{screen('lobbyScreen');setConnection('Not connected');};
$('createBtn').onclick=create;$('joinBtn').onclick=join;$('startBtn').onclick=start;$('temporalBtn').onclick=temporal;
$('roomCode').oninput=e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
$('copyBtn').onclick=async()=>{try{await navigator.clipboard.writeText(session.roomCode);$('copyBtn').textContent='COPIED';setTimeout(()=>$('copyBtn').textContent='COPY CODE',1200);}catch{message('Share room code: '+session.roomCode);}};
window.toggleReady=toggleReady;
