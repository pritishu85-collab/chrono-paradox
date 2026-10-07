const { ROOM_TTL_SECONDS } = require('./game');

class MemoryStore {
  constructor(){ this.rooms = new Map(); this.locks = new Map(); }
  async getRoom(code){ return this.rooms.get(code) || null; }
  async setRoom(room){ this.rooms.set(room.code, room); return true; }
  async deleteRoom(code){ this.rooms.delete(code); }
  async lock(key){ if (this.locks.has(key)) return false; this.locks.set(key, Date.now()+2000); return true; }
  async unlock(key){ this.locks.delete(key); }
}

class RedisStore {
  constructor(url, token){ this.url=url.replace(/\/$/,''); this.token=token; }
  async command(parts){
    const r = await fetch(this.url, {method:'POST', headers:{'Authorization':`Bearer ${this.token}`,'Content-Type':'application/json'}, body:JSON.stringify(parts)});
    const j = await r.json();
    if(!r.ok || j.error) throw new Error(j.error || `Redis request failed (${r.status})`);
    return j.result;
  }
  async getRoom(code){
    const raw = await this.command(['GET', `chrono:room:${code}`]);
    return raw ? JSON.parse(raw) : null;
  }
  async setRoom(room){ await this.command(['SET', `chrono:room:${room.code}`, JSON.stringify(room), 'EX', ROOM_TTL_SECONDS]); return true; }
  async deleteRoom(code){ await this.command(['DEL', `chrono:room:${code}`]); }
  async lock(key){ return (await this.command(['SET', `chrono:lock:${key}`, '1', 'NX', 'PX', 2000])) === 'OK'; }
  async unlock(key){ await this.command(['DEL', `chrono:lock:${key}`]); }
}

// Resolve Upstash/Vercel credentials safely. Some Vercel integrations expose
// a Redis connection URL (redis:// or rediss://) under a variable whose name
// contains REST_API_URL. Our HTTP client needs only the HTTPS host; the
// credentials must come from a REST token variable.
function firstEnv(names){
  for(const name of names){
    const value=process.env[name];
    if(value && String(value).trim()) return String(value).trim();
  }
  return '';
}

const rawRedisUrl = firstEnv([
  'UPSTASH_REDIS_REST_URL',
  'KV_REST_API_URL',
  'UPSTASH_REDIS_REST_KV_REST_API_URL',
  'UPSTASH_REDIS_REST_KV_URL',
  'UPSTASH_REDIS_REST_API_URL',
  'UPSTASH_REDIS_REST_REDIS_URL',
  'KV_URL'
]);

const REDIS_TOKEN = firstEnv([
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_KV_TOKEN',
  'UPSTASH_REDIS_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_REDIS_TOKEN',
  'KV_TOKEN'
]);

function normalizeRedisRestUrl(raw){
  if(!raw) return '';
  try{
    const u=new URL(raw);
    if(u.protocol==='https:') return u.origin;
    if(u.protocol==='http:') return u.origin;
    if(u.protocol==='redis:' || u.protocol==='rediss:'){
      // Convert a TCP Redis endpoint to its HTTPS REST endpoint while
      // deliberately stripping username, password and TCP port.
      return `https://${u.hostname}`;
    }
  }catch{}
  return '';
}

const REDIS_URL = normalizeRedisRestUrl(rawRedisUrl);
const hasRedis = Boolean(REDIS_URL && REDIS_TOKEN);
const store = hasRedis ? new RedisStore(REDIS_URL, REDIS_TOKEN) : new MemoryStore();

function isRedis(){ return store instanceof RedisStore; }

async function withRoomLock(code, fn){
  const key = code.toUpperCase();
  for(let attempt=0; attempt<12; attempt++){
    if(await store.lock(key)){
      try { return await fn(); }
      finally { await store.unlock(key); }
    }
    await new Promise(r=>setTimeout(r, 40 + attempt*20));
  }
  throw new Error('The room is busy. Please try again.');
}

module.exports = { store, isRedis, withRoomLock, RedisStore };
