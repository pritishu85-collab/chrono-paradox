const { store } = require('./store');
const { getPlayer, publicState, gameStateFor } = require('./game');

function log(event, details = {}) {
  console.log(JSON.stringify({ tag: 'chrono-ws', event, ...details }));
}

function attachRealtimeConnection(ws, req) {
  const url = new URL(req.url, 'http://localhost');
  const code = String(url.searchParams.get('room') || '').trim().toUpperCase();
  const playerId = String(url.searchParams.get('player') || '');

  log('connection_attempt', { code, playerId: playerId ? playerId.slice(0, 8) : '' });

  if (!code || !playerId) {
    log('connection_rejected', { reason: 'missing_parameters' });
    try { ws.close(1008, 'Missing room or player.'); } catch {}
    return;
  }

  let poll = null;
  let heartbeat = null;
  let closed = false;

  const cleanup = () => {
    if (poll) clearInterval(poll);
    if (heartbeat) clearInterval(heartbeat);
    poll = null;
    heartbeat = null;
  };

  const send = payload => {
    if (!closed && ws.readyState === ws.OPEN) {
      try { ws.send(JSON.stringify(payload)); } catch (error) { log('send_error', { message: error.message }); }
    }
  };

  ws.on('pong', () => { ws.__chronoAlive = true; });
  ws.on('close', (closeCode, reason) => {
    closed = true;
    cleanup();
    log('connection_closed', {
      code,
      playerId: playerId.slice(0, 8),
      closeCode,
      reason: String(reason || '')
    });
  });
  ws.on('error', error => log('socket_error', { code, playerId: playerId.slice(0, 8), message: error.message }));

  (async () => {
    try {
      const room = await store.getRoom(code);
      const player = room && getPlayer(room, playerId);
      if (!room || !player) {
        log('connection_rejected', { code, playerId: playerId.slice(0, 8), reason: 'session_not_found' });
        try { ws.close(1008, 'Lobby session not found.'); } catch {}
        return;
      }

      let lastVersion = -1;
      let busy = false;
      ws.__chronoAlive = true;

      const push = async () => {
        if (closed || busy) return;
        busy = true;
        try {
          const latest = await store.getRoom(code);
          const p = latest && getPlayer(latest, playerId);
          if (!latest || !p) {
            log('room_missing', { code, playerId: playerId.slice(0, 8) });
            try { ws.close(1008, 'Room session ended.'); } catch {}
            return;
          }

          if (latest.version !== lastVersion) {
            lastVersion = latest.version;
            send({ type: 'room_state', ...publicState(latest) });
            if (latest.started) {
              send({ type: 'game_started' });
              send({ type: 'game_state', ...gameStateFor(latest, p) });
            }
          }
        } catch (error) {
          log('state_error', { code, playerId: playerId.slice(0, 8), message: error.message });
          send({ type: 'server_error', error: 'Realtime state temporarily unavailable. Reconnecting…' });
        } finally {
          busy = false;
        }
      };

      send({ type: 'realtime_ready' });
      await push();

      poll = setInterval(push, 1000);
      heartbeat = setInterval(() => {
        if (closed) return;
        if (ws.__chronoAlive === false) {
          log('heartbeat_missed', { code, playerId: playerId.slice(0, 8) });
          try { ws.terminate(); } catch {}
          return;
        }
        ws.__chronoAlive = false;
        try { ws.ping(); } catch (error) { log('ping_error', { message: error.message }); }
      }, 25000);

      log('connection_ready', { code, playerId: playerId.slice(0, 8) });
    } catch (error) {
      log('initialization_error', { code, playerId: playerId.slice(0, 8), message: error.message, stack: error.stack });
      try { ws.close(1011, 'Realtime initialization failed.'); } catch {}
    }
  })();
}

module.exports = { attachRealtimeConnection };
