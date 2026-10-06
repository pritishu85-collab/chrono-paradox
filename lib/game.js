const crypto = require('crypto');

const REALITIES = ['PAST', 'PRESENT', 'FUTURE', 'ECHO'];
const ROOM_TTL_SECONDS = 60 * 60 * 6;

const REALITY_DATA = {
  PAST: {
    title: 'The World Before',
    subtitle: 'You see how the chamber looked before the fracture.',
    secretTitle: 'PAST-ONLY INFORMATION',
    secret: 'The door was once intact. An ancient spiral mark is carved above its handle.',
    clue: 'The spiral mark is the original location of the temporal control.',
    accent: 'amber'
  },
  PRESENT: {
    title: 'The World Now',
    subtitle: 'You see the chamber as it exists at the present moment.',
    secretTitle: 'PRESENT-ONLY INFORMATION',
    secret: 'The door is damaged and its control panel is exposed beneath the broken frame.',
    clue: 'The exposed control panel is powered, but its indicator is unstable.',
    accent: 'cyan'
  },
  FUTURE: {
    title: 'The World That May Be',
    subtitle: 'You glimpse a possible outcome before it happens.',
    secretTitle: 'FUTURE-ONLY INFORMATION',
    secret: 'A warning flashes: the chamber door will collapse after the temporal surge.',
    clue: 'The surge is approaching. The warning gives no exact cause yet.',
    accent: 'violet'
  },
  ECHO: {
    title: 'The World Remembered',
    subtitle: 'You perceive traces left behind by actions across time.',
    secretTitle: 'ECHO-ONLY INFORMATION',
    secret: 'A translucent handprint appears beside the door, followed by a trace of someone turning the handle.',
    clue: 'The echo suggests someone opened the door from the side of the spiral mark.',
    accent: 'rose'
  }
};

const WORLD = {
  name: 'THE FRACTURED CHAMBER',
  description: 'A single room observed from four different points in time.',
  location: 'Central Temporal Chamber',
  sharedObjects: [
    {name: 'Temporal Door', description: 'A sealed doorway at the far end of the chamber.'},
    {name: 'Central Floor', description: 'A circular floor plate surrounds a dormant temporal ring.'},
    {name: 'Observation Wall', description: 'A dark wall marked by faint lines of unknown origin.'}
  ]
};

function makeRoom(code) {
  return {
    code,
    players: [],
    hostId: null,
    started: false,
    version: 1,
    createdAt: Date.now(),
    temporal: {
      originRevealed: false,
      panelActivated: false,
      futureScanned: false,
      echoTraced: false,
      completed: false,
      eventLog: []
    }
  };
}

function makePlayer(number) {
  return { id: crypto.randomUUID(), number, ready: false, reality: null };
}

function nextPlayerNumber(room) {
  const used = new Set(room.players.map(p => p.number));
  for (let n = 1; n <= 4; n++) if (!used.has(n)) return n;
  return null;
}

function addPlayer(room) {
  if (room.started) throw new Error('That game has already started.');
  if (room.players.length >= 4) throw new Error('That room is full.');
  const number = nextPlayerNumber(room);
  const player = makePlayer(number);
  room.players.push(player);
  if (!room.hostId) room.hostId = player.id;
  room.version++;
  return player;
}

function getPlayer(room, playerId) {
  return room.players.find(p => p.id === playerId) || null;
}

function publicState(room) {
  const ready = room.players.filter(p => p.ready).length;
  return {
    roomCode: room.code,
    players: room.players.map(p => ({id:p.id, number:p.number, ready:p.ready, host:p.id === room.hostId})),
    hostId: room.hostId,
    started: room.started,
    canStart: room.players.length >= 2 && ready >= 2,
    version: room.version
  };
}

function gameStateFor(room, player) {
  const reality = player.reality || REALITIES[player.number - 1] || REALITIES[0];
  const privateView = REALITY_DATA[reality];
  const t = room.temporal || {};
  const availableActions = {
    PAST: !t.originRevealed ? ['inspect_origin'] : [],
    PRESENT: t.originRevealed && !t.panelActivated ? ['activate_panel'] : [],
    FUTURE: t.panelActivated && !t.futureScanned ? ['scan_future'] : [],
    ECHO: t.futureScanned && !t.echoTraced ? ['follow_echo'] : []
  }[reality] || [];
  return {
    roomCode: room.code,
    playerNumber: player.number,
    reality,
    realityTitle: privateView.title,
    realitySubtitle: privateView.subtitle,
    secretTitle: privateView.secretTitle,
    secret: privateView.secret,
    clue: privateView.clue,
    accent: privateView.accent,
    world: WORLD,
    temporal: {
      originRevealed: Boolean(t.originRevealed),
      panelActivated: Boolean(t.panelActivated),
      futureScanned: Boolean(t.futureScanned),
      echoTraced: Boolean(t.echoTraced),
      completed: Boolean(t.completed),
      eventLog: Array.isArray(t.eventLog) ? t.eventLog.slice(-6) : []
    },
    availableActions
  };
}

function performTemporalAction(room, playerId, action) {
  const player = getPlayer(room, playerId);
  if (!player) throw new Error('Lobby session not found.');
  if (!room.started) throw new Error('The game has not started.');
  const reality = player.reality || REALITIES[player.number - 1] || REALITIES[0];
  const t = room.temporal || (room.temporal = {originRevealed:false,panelActivated:false,futureScanned:false,echoTraced:false,completed:false,eventLog:[]});
  const addEvent = (label) => {
    t.eventLog.push({ playerNumber: player.number, reality, label, at: Date.now() });
    if (t.eventLog.length > 6) t.eventLog = t.eventLog.slice(-6);
  };

  if (action === 'inspect_origin') {
    if (reality !== 'PAST') throw new Error('Only the PAST player can reveal the original control.');
    if (t.originRevealed) throw new Error('The original control has already been revealed.');
    t.originRevealed = true;
    addEvent('The original temporal control has been revealed.');
  } else if (action === 'activate_panel') {
    if (reality !== 'PRESENT') throw new Error('Only the PRESENT player can activate the damaged panel.');
    if (!t.originRevealed) throw new Error('The PAST player must reveal the original control first.');
    if (t.panelActivated) throw new Error('The control panel is already active.');
    t.panelActivated = true;
    addEvent('The present-day control panel has been activated.');
  } else if (action === 'scan_future') {
    if (reality !== 'FUTURE') throw new Error('Only the FUTURE player can scan the possible outcome.');
    if (!t.panelActivated) throw new Error('The PRESENT player must activate the control panel first.');
    if (t.futureScanned) throw new Error('The future warning has already been scanned.');
    t.futureScanned = true;
    addEvent('A future warning has been synchronized with the chamber.');
  } else if (action === 'follow_echo') {
    if (reality !== 'ECHO') throw new Error('Only the ECHO player can follow the temporal trace.');
    if (!t.futureScanned) throw new Error('The FUTURE player must scan the warning first.');
    if (t.echoTraced) throw new Error('The temporal echo has already been traced.');
    t.echoTraced = true;
    t.completed = true;
    addEvent('The temporal echo has been traced. The door responds.');
  } else {
    throw new Error('Unknown action.');
  }
  room.version++;
}

function startGame(room, playerId) {
  const player = getPlayer(room, playerId);
  if (!player) throw new Error('Lobby session not found.');
  if (room.hostId !== player.id) throw new Error('Only the host can start the game.');
  const ready = room.players.filter(p => p.ready).length;
  if (room.players.length < 2 || ready < 2) throw new Error('At least 2 players must be ready.');
  room.players.forEach(p => { p.reality = REALITIES[p.number - 1]; });
  room.started = true;
  room.version++;
}

function toggleReady(room, playerId) {
  const player = getPlayer(room, playerId);
  if (!player) throw new Error('Lobby session not found.');
  if (room.started) throw new Error('The game has already started.');
  player.ready = !player.ready;
  room.version++;
}

module.exports = { REALITIES, REALITY_DATA, WORLD, ROOM_TTL_SECONDS, makeRoom, addPlayer, getPlayer, publicState, gameStateFor, performTemporalAction, startGame, toggleReady };
