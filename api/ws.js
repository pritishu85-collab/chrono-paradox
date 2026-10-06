const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { attachRealtimeConnection } = require('../lib/ws-handler');

const server = createServer();
const wss = new WebSocketServer({ server });
wss.on('connection', (ws, req) => attachRealtimeConnection(ws, req));

module.exports = server;
