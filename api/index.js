const create = require('./create');
const join = require('./join');
const action = require('./action');
const health = require('./health');
const { jsonResponse } = require('../lib/vercel-api');

module.exports = async function handler(req, res) {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname.replace(/\/+$/, '') || '/';
  if (pathname === '/api/create') return create(req, res);
  if (pathname === '/api/join') return join(req, res);
  if (pathname === '/api/action') return action(req, res);
  if (pathname === '/api/health') return health(req, res);
  return jsonResponse(res, { error: 'API route not found.', path: pathname }, 404);
};
