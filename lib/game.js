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

const EVENT_PHASES = ['DORMANT', 'SURGE', 'AFTERMATH', 'STABLE'];

const EVENT_DATA = {
  DORMANT: {
    title: 'TEMPORAL EVENT: DORMANT',
    shared: 'The temporal ring is quiet. Something is waiting to happen.',
    actionLabel: 'TRIGGER TEMPORAL SURGE',
    actionAvailable: true,
    views: {
      PAST: 'The spiral mark briefly glows, as if the chamber is remembering its origin.',
      PRESENT: 'The exposed control panel flickers once. The system is ready to respond.',
      FUTURE: 'The warning has not happened yet, but a faint countdown is visible.',
      ECHO: 'A weak handprint appears and fades beside the temporal ring.'
    }
  },
  SURGE: {
    title: 'TEMPORAL EVENT: SURGE',
    shared: 'A pulse moves through the chamber. The four timelines are briefly synchronized.',
    actionLabel: 'OBSERVE THE AFTERMATH',
    actionAvailable: true,
    views: {
      PAST: 'For an instant, you see the spiral mark before the first fracture forms.',
      PRESENT: 'The control panel activates and records a new temporal pulse.',
      FUTURE: 'The predicted collapse shifts forward. The outcome is changing.',
      ECHO: 'A stronger trace shows someone interacting with the temporal ring.'
    }
  },
  AFTERMATH: {
    title: 'TEMPORAL EVENT: AFTERMATH',
    shared: 'The pulse has passed. Evidence of the event remains across every reality.',
    actionLabel: 'STABILIZE THE TIMELINE',
    actionAvailable: true,
    views: {
      PAST: 'The ancient mark now contains a faint line that did not exist before.',
      PRESENT: 'The control panel reports: TEMPORAL PATH RECORDED.',
      FUTURE: 'The collapse warning disappears. A safer outcome is now possible.',
      ECHO: 'The handprint becomes clear enough to reveal a circular symbol.'
    }
  },
  STABLE: {
    title: 'TEMPORAL EVENT: STABLE',
    shared: 'The timelines settle into alignment. The chamber remembers what the players changed.',
    actionLabel: 'EVENT COMPLETE',
    actionAvailable: false,
    views: {
      PAST: 'The chamber holds the new mark as though it has always been there.',
      PRESENT: 'The panel is stable. The recorded temporal path is complete.',
      FUTURE: 'The dangerous outcome has been replaced by a stable possibility.',
      ECHO: 'The final echo shows the completed action from every timeline.'
    }
  }
};

function makeTemporalEvent() {
  return { phase: 0, lastActor: null, sequence: 0 };
}

function makeRoom(code) {
  return { code, players: [], hostId: null, started: false, version: 1, createdAt: Date.now(), temporalEvent: makeTemporalEvent() };
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

function temporalEventState(room) {
  const event = room.temporalEvent || makeTemporalEvent();
  const phase = EVENT_PHASES[event.phase] || EVENT_PHASES[0];
  const data = EVENT_DATA[phase];
  return {
    phase,
    phaseNumber: event.phase,
    sequence: event.sequence || 0,
    lastActor: event.lastActor || null,
    title: data.title,
    shared: data.shared,
    actionLabel: data.actionLabel,
    actionAvailable: data.actionAvailable
  };
}

function gameStateFor(room, player) {
  const reality = player.reality || REALITIES[player.number - 1] || REALITIES[0];
  const privateView = REALITY_DATA[reality];
  const event = room.temporalEvent || makeTemporalEvent();
  const phase = EVENT_PHASES[event.phase] || EVENT_PHASES[0];
  const eventData = EVENT_DATA[phase];
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
    temporalEvent: {
      ...temporalEventState(room),
      private: eventData.views[reality]
    }
  };
}

function startGame(room, playerId) {
  const player = getPlayer(room, playerId);
  if (!player) throw new Error('Lobby session not found.');
  if (room.hostId !== player.id) throw new Error('Only the host can start the game.');
  const ready = room.players.filter(p => p.ready).length;
  if (room.players.length < 2 || ready < 2) throw new Error('At least 2 players must be ready.');
  room.players.forEach(p => { p.reality = REALITIES[p.number - 1]; });
  room.started = true;
  room.temporalEvent = makeTemporalEvent();
  room.version++;
}

function toggleReady(room, playerId) {
  const player = getPlayer(room, playerId);
  if (!player) throw new Error('Lobby session not found.');
  if (room.started) throw new Error('The game has already started.');
  player.ready = !player.ready;
  room.version++;
}

function advanceTemporalEvent(room, playerId) {
  const player = getPlayer(room, playerId);
  if (!player) throw new Error('Lobby session not found.');
  if (!room.started) throw new Error('The game has not started yet.');
  const event = room.temporalEvent || makeTemporalEvent();
  if (event.phase >= EVENT_PHASES.length - 1) throw new Error('The temporal event is already complete.');
  event.phase += 1;
  event.sequence = (event.sequence || 0) + 1;
  event.lastActor = player.number;
  room.temporalEvent = event;
  room.version++;
}

module.exports = {
  REALITIES, REALITY_DATA, WORLD, ROOM_TTL_SECONDS, EVENT_PHASES, EVENT_DATA,
  makeRoom, addPlayer, getPlayer, publicState, gameStateFor, temporalEventState,
  startGame, toggleReady, advanceTemporalEvent
};
