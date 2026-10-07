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
  $('eventPhase').textContent=ev.phase==='COMPLETE'?`COMPLETE · ${ev.totalSteps} STEPS`:`STEP ${ev.phaseNumber+1} / ${ev.totalSteps}`;
  $('eventActor').textContent=ev.lastActor?`Last action: Player ${ev.lastActor}`:'No action yet';
  $('eventWait').textContent=ev.waitingMessage;
  $('temporalBtn').textContent=ev.actionLabel;
  $('temporalBtn').disabled=!ev.actionAvailable || !ev.waitingForMe;
  $('temporalBtn').classList.toggle('complete',!ev.actionAvailable);
  $('temporalBtn').title=ev.waitingForMe?'Your reality is required for this step.':ev.waitingMessage;

  const choice=g.timelineChoice;
  const choiceCard=$('choiceCard');
  const choiceStatus=$('choiceStatus');
  const choicePrivate=$('choicePrivate');
  const preserveBtn=$('preserveBtn');
  const alterBtn=$('alterBtn');
  choiceCard.classList.toggle('hidden', choice.status==='LOCKED');
  if(choice.status==='OPEN') {
    $('choiceTitle').textContent='TIMELINE CHOICE: WHAT HAPPENS NEXT?';
    $('choiceShared').textContent='Every reality has seen a different consequence. Discuss what you know, then each player chooses the future the team wants.';
    choiceStatus.textContent=`DECISIONS SUBMITTED: ${choice.voteCount} / ${choice.total}`;
    choicePrivate.textContent=choice.myVote ? `You chose ${choice.myVote}. Wait for the other realities.` : choice.choices[g.reality==='PAST'?'PRESERVE':'PRESERVE'].private;
    // Show both consequence descriptions through the two option cards; each player gets their own private consequence text below.
    $('preserveText').textContent=choice.choices.PRESERVE.private;
    $('alterText').textContent=choice.choices.ALTER.private;
    preserveBtn.disabled=!choice.canVote; alterBtn.disabled=!choice.canVote;
    if(choice.myVote){ choiceStatus.textContent=`YOUR DECISION: ${choice.myVote} · ${choice.voteCount} / ${choice.total}`; }
  } else if(choice.status==='RESOLVED') {
    choiceCard.classList.remove('hidden');
    $('choiceTitle').textContent='TIMELINE CHOICE: RESOLVED';
    $('choiceShared').textContent=`The team chose ${choice.result.choice}. The shared timeline now follows that consequence.`;
    choiceStatus.textContent=`FINAL DECISION · ${choice.result.choice}`;
    choicePrivate.textContent=choice.result.private;
    $('preserveText').textContent=choice.choices.PRESERVE.summary;
    $('alterText').textContent=choice.choices.ALTER.summary;
    preserveBtn.disabled=true; alterBtn.disabled=true;
  }

  const outcome=g.timelineOutcome;
  const outcomeCard=$('outcomeCard');
  if(outcome && outcome.status==='RESOLVED') {
    outcomeCard.classList.remove('hidden');
    outcomeCard.dataset.choice=outcome.choice;
    $('outcomeTitle').textContent=outcome.title;
    $('outcomeBadge').textContent=outcome.badge;
    $('outcomeShared').textContent=outcome.shared;
    $('outcomePrivate').textContent=outcome.private;
    $('outcomeDoor').textContent=outcome.objects['Temporal Door'];
    $('outcomeFloor').textContent=outcome.objects['Central Floor'];
    $('outcomeWall').textContent=outcome.objects['Observation Wall'];
    $('outcomeState').textContent=outcome.state;
  } else {
    outcomeCard.classList.add('hidden');
  }

  const memory=g.temporalMemory;
  const memoryCard=$('memoryCard');
  if(memory && memory.status==='RESOLVED') {
    memoryCard.classList.remove('hidden');
    memoryCard.dataset.choice=memory.choice;
    $('memoryTitle').textContent=memory.title;
    $('memoryBadge').textContent=memory.badge;
    $('memoryShared').textContent=memory.shared;
    $('memoryPrivate').textContent=memory.private;
    $('memoryState').textContent=memory.state;
    $('memoryRecord').textContent=memory.record;
    $('memorySequence').textContent=`PERSISTED SEQUENCE · ${memory.persistedSequence}`;
    $('memoryEntries').innerHTML=memory.entries.map(e=>`<div class=\"memory-entry\"><span>${e.order}</span><div><strong>${e.label}</strong><small>${e.text}</small></div></div>`).join('');
  } else {
    memoryCard.classList.add('hidden');
  }

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


async function vote(choice){
  $('preserveBtn').disabled=true; $('alterBtn').disabled=true;
  try{await api('/api/action',{roomCode:session.roomCode,playerId:session.playerId,action:'vote',choice});}
  catch(e){message(e.message);}
}

$('enterBtn').onclick=()=>{screen('lobbyScreen');setConnection('Not connected');};
$('createBtn').onclick=create;$('joinBtn').onclick=join;$('startBtn').onclick=start;$('temporalBtn').onclick=temporal;$('preserveBtn').onclick=()=>vote('PRESERVE');$('alterBtn').onclick=()=>vote('ALTER');
$('roomCode').oninput=e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
$('copyBtn').onclick=async()=>{try{await navigator.clipboard.writeText(session.roomCode);$('copyBtn').textContent='COPIED';setTimeout(()=>$('copyBtn').textContent='COPY CODE',1200);}catch{message('Share room code: '+session.roomCode);}};
window.toggleReady=toggleReady;
