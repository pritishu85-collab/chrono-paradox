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

// Step 4: the first cooperative protocol. The required player changes with
// the players actually in the room, so 2-, 3-, and 4-player games remain valid.
const PROTOCOL_STEPS = [
  {
    reality: 'PAST',
    title: 'PARADOX PROTOCOL: REVEAL ORIGIN',
    actionLabel: 'REVEAL THE ORIGIN',
    shared: 'The protocol is dormant. The historical origin must be revealed before the present can act.',
    views: {
      PAST: 'Your memory of the intact chamber identifies the spiral mark as the original temporal control. Tell the team what you see, then reveal the origin.',
      PRESENT: 'The control panel is waiting for an origin signal. You cannot align it until the past is revealed.',
      FUTURE: 'A warning predicts instability if the present acts without the correct origin. Wait for the past.',
      ECHO: 'The handprint is incomplete. The echo needs the historical origin before it can become a reliable trace.'
    }
  },
  {
    reality: 'PRESENT',
    title: 'PARADOX PROTOCOL: ALIGN CONTROL',
    actionLabel: 'ALIGN THE CONTROL',
    shared: 'The origin is known. The exposed control panel can now be aligned with the historical mark.',
    views: {
      PAST: 'The new alignment matches the spiral mark you remember. Watch the present player act on your information.',
      PRESENT: 'The powered panel now accepts the origin signal. Align it with the spiral mark described by the past.',
      FUTURE: 'The collapse warning narrows to one outcome: correct alignment keeps the door from failing.',
      ECHO: 'A second handprint appears where the control panel was touched. The echo confirms the alignment is taking shape.'
    }
  },
  {
    reality: 'FUTURE',
    title: 'PARADOX PROTOCOL: VERIFY OUTCOME',
    actionLabel: 'VERIFY THE OUTCOME',
    shared: 'The control is aligned. The future can now verify whether the timeline is moving toward a stable outcome.',
    views: {
      PAST: 'The chamber looks briefly more complete. Your mark is now reflected in the altered timeline.',
      PRESENT: 'The panel reports a stable path, but the final outcome has not yet been confirmed.',
      FUTURE: 'The dangerous collapse disappears from the prediction. Verify the stable outcome before the echo seals it.',
      ECHO: 'The trace becomes clearer, but it still needs confirmation from the future before it can be sealed.'
    }
  },
  {
    reality: 'ECHO',
    title: 'PARADOX PROTOCOL: SEAL PARADOX',
    actionLabel: 'SEAL THE PARADOX',
    shared: 'The future has confirmed a stable path. The final echo can now lock the cooperative change into the chamber.',
    views: {
      PAST: 'The new mark feels as though it has always belonged to the chamber.',
      PRESENT: 'The control panel is steady. The recorded path is waiting for its final confirmation.',
      FUTURE: 'The stable outcome is now persistent. The final echo is the last step.',
      ECHO: 'The complete trace shows all three earlier actions. Seal the paradox to preserve the new timeline.'
    }
  }
];


// Step 6: final consequence data is derived server-side from the resolved team choice.

const TIMELINE_CHOICES = {
  PRESERVE: {
    label: 'PRESERVE THE TIMELINE',
    summary: 'Keep the altered timeline stable and preserve the chamber’s current history.',
    views: {
      PAST: 'Preserving keeps the spiral mark consistent with the history you remember. The chamber stays anchored to its known origin.',
      PRESENT: 'Preserving stabilizes the exposed control panel and keeps the current chamber state coherent.',
      FUTURE: 'Preserving produces the clearest stable future. The collapse warning remains gone.',
      ECHO: 'Preserving leaves one continuous trace. No contradictory echo is created.'
    }
  },
  ALTER: {
    label: 'ALTER THE TIMELINE',
    summary: 'Create a new branch of history and accept an uncertain future.',
    views: {
      PAST: 'Altering rewrites the meaning of the original mark. Some details of the chamber’s history begin to disappear.',
      PRESENT: 'Altering forces the control panel into an untested branch. The present becomes less predictable.',
      FUTURE: 'Altering creates multiple possible futures. Some are promising, but the outcome cannot be guaranteed.',
      ECHO: 'Altering leaves a second echo beside the first. The chamber now remembers two possible histories.'
    }
  }
};



const TIMELINE_OUTCOMES = {
  PRESERVE: {
    badge: 'PRESERVED TIMELINE',
    title: 'THE TIMELINE HOLDS',
    shared: 'The team preserved the stabilized consequence. The chamber keeps one coherent history.',
    status: 'STABLE PATH',
    private: {
      PAST: 'The spiral mark remains consistent with the history you remember. Nothing in the chamber contradicts its origin.',
      PRESENT: 'The exposed control panel settles into a stable state. The chamber remains coherent around the repaired path.',
      FUTURE: 'The collapse warning stays absent. The future now converges on one stable consequence.',
      ECHO: 'Only one continuous handprint trace remains. The chamber remembers a single cooperative history.'
    },
    objects: {
      'Temporal Door': 'The door remains sealed, but its temporal lock is now stable.',
      'Central Floor': 'The temporal ring glows steadily without another surge.',
      'Observation Wall': 'The wall records one uninterrupted sequence of events.'
    }
  },
  ALTER: {
    badge: 'ALTERED BRANCH',
    title: 'THE TIMELINE SPLITS',
    shared: 'The team accepted a new branch of history. The chamber now carries evidence of two possible timelines.',
    status: 'BRANCHED PATH',
    private: {
      PAST: 'The spiral mark has shifted in meaning. Your memory and the chamber no longer match perfectly.',
      PRESENT: 'The control panel settles into a new configuration. The present now contains evidence of a branch.',
      FUTURE: 'Several outcomes remain possible. The collapse warning is gone, but the future is no longer singular.',
      ECHO: 'A second trace appears beside the original handprint. The chamber remembers two possible histories.'
    },
    objects: {
      'Temporal Door': 'The door remains sealed, but a second temporal signature is embedded in its frame.',
      'Central Floor': 'The temporal ring pulses between two synchronized states.',
      'Observation Wall': 'The wall records overlapping traces from two possible histories.'
    }
  }
};

function timelineOutcomeState(room, player) {
  const choice = room.temporalEvent?.timelineChoice;
  const reality = player.reality || REALITIES[player.number - 1] || REALITIES[0];
  if (!choice || choice.status !== 'RESOLVED' || !choice.result) {
    return { status: 'LOCKED', title: 'AWAITING TIMELINE DECISION' };
  }
  const outcome = TIMELINE_OUTCOMES[choice.result];
  return {
    status: 'RESOLVED',
    choice: choice.result,
    badge: outcome.badge,
    title: outcome.title,
    shared: outcome.shared,
    state: outcome.status,
    private: outcome.private[reality],
    objects: outcome.objects
  };
}


// Step 7: Temporal Memory is a server-derived, persistent record of the
// completed cooperative sequence and the team's final timeline decision.
const TEMPORAL_MEMORY = {
  PRESERVE: {
    badge: 'MEMORY ANCHORED',
    title: 'THE CHAMBER REMEMBERS',
    shared: 'The chamber stores one continuous memory of the team’s actions. The preserved timeline becomes the canonical record.',
    private: {
      PAST: 'Your memory anchors the chamber to its original spiral mark. The history you remember is now the history the chamber records.',
      PRESENT: 'Your memory records a stable control path. The exposed panel is remembered as part of one coherent sequence.',
      FUTURE: 'Your memory contains one converged outcome. The future records a single stable consequence rather than competing possibilities.',
      ECHO: 'Your memory contains one continuous trace. The chamber remembers the cooperative sequence without a contradictory echo.'
    },
    state: 'ONE CONTINUOUS MEMORY',
    record: 'The chamber preserves one canonical history.'
  },
  ALTER: {
    badge: 'MEMORY FORKED',
    title: 'THE CHAMBER REMEMBERS TWO HISTORIES',
    shared: 'The chamber stores the original sequence and the altered branch as a forked memory. Both histories remain part of the record.',
    private: {
      PAST: 'Your memory now contains a contradiction: the spiral mark you remember and the altered meaning recorded by the chamber coexist.',
      PRESENT: 'Your memory records the original control path and the new branch. The present can no longer be described by one history alone.',
      FUTURE: 'Your memory records competing outcomes. The future remembers possibilities instead of one guaranteed path.',
      ECHO: 'Your memory records two traces side by side. The chamber now remembers both the original and altered histories.'
    },
    state: 'TWO HISTORIES REMEMBERED',
    record: 'The chamber preserves the original sequence and the altered branch.'
  }
};

function temporalMemoryState(room, player) {
  const choice = room.temporalEvent?.timelineChoice;
  const reality = player.reality || REALITIES[player.number - 1] || REALITIES[0];
  if (!choice || choice.status !== 'RESOLVED' || !choice.result) {
    return { status: 'LOCKED', badge: 'LOCKED', title: 'AWAITING TEMPORAL MEMORY' };
  }
  const memory = TEMPORAL_MEMORY[choice.result];
  const history = Array.isArray(room.temporalEvent?.history) ? room.temporalEvent.history : [];
  const records = history.map((item, index) => ({
    order: index + 1,
    playerNumber: item.playerNumber,
    reality: item.reality,
    label: `Player ${item.playerNumber} · ${item.reality}`,
    text: PROTOCOL_STEPS[item.playerNumber - 1]?.title || `Temporal action ${index + 1}`
  }));
  records.push({
    order: records.length + 1,
    playerNumber: null,
    reality: 'DECISION',
    label: 'TEAM DECISION',
    text: choice.result === 'PRESERVE' ? 'PRESERVE — canonical history anchored' : 'ALTER — new history branch recorded'
  });
  return {
    status: 'RESOLVED',
    choice: choice.result,
    badge: memory.badge,
    title: memory.title,
    shared: memory.shared,
    private: memory.private[reality],
    state: memory.state,
    record: memory.record,
    entries: records,
    persistedSequence: room.temporalEvent.sequence || 0,
    resolvedAt: choice.resolvedAt || null
  };
}

function makeTimelineChoice() {
  return { status: 'OPEN', votes: {}, result: null, resolvedAt: null };
}

function makeTemporalEvent() {
  return { phase: 0, lastActor: null, sequence: 0, history: [], timelineChoice: makeTimelineChoice(), temporalReplay: makeTemporalReplay() };
}



// Step 8: Temporal Replay lets every participating reality revisit the
// resolved timeline. The replay is server-authoritative and persisted with
// the room so reconnects do not lose replay progress.
const TEMPORAL_REPLAY = {
  PRESERVE: {
    badge: 'REPLAY READY',
    title: 'THE TIMELINE REPLAYS',
    shared: 'The team can now revisit the canonical sequence. Each reality remembers the same history through a different temporal lens.',
    views: {
      PAST: 'Replay shows the spiral mark exactly where your memory expects it. The preserved history remains anchored to its origin.',
      PRESENT: 'Replay reconstructs the stable control path. The present remembers how the team kept the chamber coherent.',
      FUTURE: 'Replay converges on the preserved outcome. The warning remains absent because the timeline stayed on one stable path.',
      ECHO: 'Replay follows one continuous trace from origin to resolution. No contradictory echo is introduced.'
    }
  },
  ALTER: {
    badge: 'REPLAY FORKED',
    title: 'THE BRANCHED TIMELINE REPLAYS',
    shared: 'The team can now revisit the original sequence and the altered branch. Each reality sees the fork through its own temporal lens.',
    views: {
      PAST: 'Replay shows your remembered spiral mark alongside the altered meaning. Both histories remain visible in the record.',
      PRESENT: 'Replay reconstructs the original control path and the branch that replaced it. The present remembers both states.',
      FUTURE: 'Replay exposes the competing outcomes created by the branch. The future remembers uncertainty rather than one guaranteed path.',
      ECHO: 'Replay reveals the original handprint and the second trace together. The echo preserves both possible histories.'
    }
  }
};
function makeTemporalReplay() {
  return { status: 'OPEN', acknowledgements: {}, replayCount: 0, sequence: 0, completedAt: null };
}
function temporalReplayState(room, player) {
  const choice = room.temporalEvent?.timelineChoice;
  const replay = room.temporalEvent?.temporalReplay || makeTemporalReplay();
  const reality = player.reality || REALITIES[player.number - 1] || REALITIES[0];
  const players = activeProtocolPlayers(room);
  const total = players.length;
  const acknowledged = Object.keys(replay.acknowledgements || {}).length;
  const resolved = Boolean(choice && choice.status === 'RESOLVED' && choice.result);
  const myReplay = Boolean(replay.acknowledgements && replay.acknowledgements[player.id]);
  const replayData = resolved ? TEMPORAL_REPLAY[choice.result] : null;
  const entries = Array.isArray(room.temporalEvent?.history) ? room.temporalEvent.history.map((item, index) => ({
    order: index + 1,
    label: `Player ${item.playerNumber} · ${item.reality}`,
    text: PROTOCOL_STEPS[item.playerNumber - 1]?.title || `Temporal action ${index + 1}`
  })) : [];
  if (resolved) entries.push({
    order: entries.length + 1,
    label: 'TEAM DECISION',
    text: choice.result === 'PRESERVE' ? 'PRESERVE — canonical history anchored' : 'ALTER — new history branch recorded'
  });
  const complete = resolved && acknowledged >= total;
  return {
    status: !resolved ? 'LOCKED' : (complete ? 'COMPLETE' : 'OPEN'),
    badge: !resolved ? 'LOCKED' : (complete ? (choice.result === 'ALTER' ? 'REPLAY FORKED' : 'REPLAY COMPLETE') : replayData.badge),
    title: !resolved ? 'AWAITING TEMPORAL REPLAY' : (complete ? 'THE REPLAY IS COMPLETE' : replayData.title),
    shared: !resolved ? 'Resolve the timeline first. The replay becomes available after the team makes its final decision.' : (complete ? 'All participating realities revisited the recorded sequence. The temporal replay is synchronized.' : replayData.shared),
    private: !resolved ? 'Your replay lens is locked until the team resolves the timeline.' : replayData.views[reality],
    replayCount: replay.replayCount || 0,
    acknowledged,
    total,
    myReplay,
    canReplay: resolved && !myReplay,
    sequence: replay.sequence || 0,
    completedAt: replay.completedAt || null,
    entries
  };
}
function acknowledgeTemporalReplay(room, playerId) {
  const player = getPlayer(room, playerId);
  if (!player) throw new Error('Lobby session not found.');
  if (!room.started) throw new Error('The game has not started yet.');
  const event = room.temporalEvent || makeTemporalEvent();
  const choice = event.timelineChoice;
  const players = activeProtocolPlayers(room);
  if (!choice || choice.status !== 'RESOLVED' || !choice.result) throw new Error('Resolve the timeline before replaying it.');
  const replay = event.temporalReplay || makeTemporalReplay();
  if (replay.acknowledgements[playerId]) throw new Error('You have already entered the temporal replay.');
  replay.acknowledgements[playerId] = { playerNumber: player.number, reality: player.reality, at: Date.now() };
  replay.sequence = (replay.sequence || 0) + 1;
  if (Object.keys(replay.acknowledgements).length >= players.length) {
    replay.status = 'COMPLETE';
    replay.replayCount = (replay.replayCount || 0) + 1;
    replay.completedAt = Date.now();
  }
  event.temporalReplay = replay;
  event.sequence = (event.sequence || 0) + 1;
  room.temporalEvent = event;
  room.version++;
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

function activeProtocolPlayers(room) {
  return room.players.slice().sort((a,b) => a.number - b.number);
}

function protocolState(room) {
  const event = room.temporalEvent || makeTemporalEvent();
  const players = activeProtocolPlayers(room);
  const complete = event.phase >= players.length;
  const requiredPlayer = complete ? null : players[event.phase];
  const step = requiredPlayer ? PROTOCOL_STEPS[requiredPlayer.number - 1] : null;
  return {
    phase: complete ? 'COMPLETE' : (step ? step.reality : 'PAST'),
    phaseNumber: event.phase,
    totalSteps: players.length,
    sequence: event.sequence || 0,
    lastActor: event.lastActor || null,
    requiredPlayerNumber: requiredPlayer ? requiredPlayer.number : null,
    title: complete ? 'PARADOX PROTOCOL: COMPLETE' : step.title,
    shared: complete
      ? 'The paradox is sealed. All participating realities contributed to one changed timeline.'
      : step.shared,
    actionLabel: complete ? 'PROTOCOL COMPLETE' : step.actionLabel,
    actionAvailable: Boolean(requiredPlayer),
    history: Array.isArray(event.history) ? event.history : []
  };
}


function timelineChoiceState(room, player) {
  const choice = room.temporalEvent && room.temporalEvent.timelineChoice
    ? room.temporalEvent.timelineChoice
    : makeTimelineChoice();
  const players = activeProtocolPlayers(room);
  const complete = (room.temporalEvent?.phase || 0) >= players.length;
  const votes = choice.votes || {};
  const voteCount = Object.keys(votes).length;
  const total = players.length;
  const resolved = choice.status === 'RESOLVED' && choice.result;
  const reality = player.reality || REALITIES[player.number - 1] || REALITIES[0];
  const myVote = votes[player.id] || null;
  return {
    status: resolved ? 'RESOLVED' : (complete ? 'OPEN' : 'LOCKED'),
    voteCount,
    total,
    myVote,
    canVote: complete && !resolved && !myVote,
    waitingForVote: complete && !resolved && !myVote,
    choices: {
      PRESERVE: { label: TIMELINE_CHOICES.PRESERVE.label, summary: TIMELINE_CHOICES.PRESERVE.summary, private: TIMELINE_CHOICES.PRESERVE.views[reality] },
      ALTER: { label: TIMELINE_CHOICES.ALTER.label, summary: TIMELINE_CHOICES.ALTER.summary, private: TIMELINE_CHOICES.ALTER.views[reality] }
    },
    result: resolved ? {
      choice: choice.result,
      label: TIMELINE_CHOICES[choice.result].label,
      summary: TIMELINE_CHOICES[choice.result].summary,
      private: TIMELINE_CHOICES[choice.result].views[reality]
    } : null
  };
}

function gameStateFor(room, player) {
  const reality = player.reality || REALITIES[player.number - 1] || REALITIES[0];
  const privateView = REALITY_DATA[reality];
  const event = room.temporalEvent || makeTemporalEvent();
  const players = activeProtocolPlayers(room);
  const complete = event.phase >= players.length;
  const requiredPlayer = complete ? null : players[event.phase];
  const step = requiredPlayer ? PROTOCOL_STEPS[requiredPlayer.number - 1] : null;
  const state = protocolState(room);
  const waitingForMe = Boolean(requiredPlayer && requiredPlayer.id === player.id);
  const privateText = complete
    ? 'The paradox is sealed. Your reality retains evidence of the complete cooperative sequence.'
    : step.views[reality];

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
      ...state,
      private: privateText,
      waitingForMe,
      waitingMessage: requiredPlayer
        ? (waitingForMe ? 'YOUR REALITY MUST ACT NOW.' : `WAITING FOR PLAYER ${requiredPlayer.number} · ${PROTOCOL_STEPS[requiredPlayer.number - 1].reality}`)
        : 'ALL PARTICIPATING REALITIES HAVE ACTED.'
    },
    timelineChoice: timelineChoiceState(room, player),
    timelineOutcome: timelineOutcomeState(room, player),
    temporalMemory: temporalMemoryState(room, player),
    temporalReplay: temporalReplayState(room, player)
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
  const players = activeProtocolPlayers(room);
  if (event.phase >= players.length) throw new Error('The paradox protocol is already complete.');
  const requiredPlayer = players[event.phase];
  if (requiredPlayer.id !== playerId) {
    throw new Error(`Waiting for Player ${requiredPlayer.number} (${PROTOCOL_STEPS[requiredPlayer.number - 1].reality}).`);
  }
  event.phase += 1;
  event.sequence = (event.sequence || 0) + 1;
  event.lastActor = player.number;
  event.history = Array.isArray(event.history) ? event.history : [];
  event.history.push({step:event.phase, playerNumber:player.number, reality:player.reality});
  room.temporalEvent = event;
  room.version++;
}


function castTimelineVote(room, playerId, choice) {
  const player = getPlayer(room, playerId);
  if (!player) throw new Error('Lobby session not found.');
  if (!room.started) throw new Error('The game has not started yet.');
  const event = room.temporalEvent || makeTemporalEvent();
  const players = activeProtocolPlayers(room);
  if (event.phase < players.length) throw new Error('Complete the paradox protocol before choosing a timeline.');
  if (!['PRESERVE', 'ALTER'].includes(choice)) throw new Error('Invalid timeline choice.');
  const timelineChoice = event.timelineChoice || makeTimelineChoice();
  if (timelineChoice.status === 'RESOLVED') throw new Error('The timeline choice is already resolved.');
  if (timelineChoice.votes[playerId]) throw new Error('You have already voted.');
  timelineChoice.votes[playerId] = choice;
  const voteCount = Object.keys(timelineChoice.votes).length;
  if (voteCount >= players.length) {
    const preserve = Object.values(timelineChoice.votes).filter(v => v === 'PRESERVE').length;
    const alter = voteCount - preserve;
    timelineChoice.result = alter > preserve ? 'ALTER' : 'PRESERVE';
    timelineChoice.status = 'RESOLVED';
    timelineChoice.resolvedAt = Date.now();
  }
  event.timelineChoice = timelineChoice;
  event.temporalReplay = makeTemporalReplay();
  event.sequence = (event.sequence || 0) + 1;
  room.temporalEvent = event;
  room.version++;
}

module.exports = {
  REALITIES, REALITY_DATA, WORLD, ROOM_TTL_SECONDS, PROTOCOL_STEPS, TIMELINE_OUTCOMES,
  makeRoom, addPlayer, getPlayer, publicState, gameStateFor, protocolState,
  startGame, toggleReady, advanceTemporalEvent, castTimelineVote, acknowledgeTemporalReplay, timelineChoiceState, timelineOutcomeState, temporalMemoryState, temporalReplayState, TIMELINE_CHOICES, TIMELINE_OUTCOMES, TEMPORAL_MEMORY, TEMPORAL_REPLAY, temporalEventState: protocolState
};
