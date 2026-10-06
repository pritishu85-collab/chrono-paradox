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
  constructor(credentials){
    this.credentials = credentials.filter(c => c.url && c.token).map(c => ({url:String(c.url).replace(/\/$/,''), token:String(c.token)}));
    if (!this.credentials.length) throw new Error('Redis credentials are missing.');
    this.active = 0;
  }
  async command(parts){
    let lastError = null;
    for(let i=0;i<this.credentials.length;i++){
      const idx = (this.active + i) % this.credentials.length;
      const {url, token} = this.credentials[idx];
      try {
        // Upstash REST supports a JSON-array command directly at the REST URL.
        const r = await fetch(url, {
          method:'POST',
          headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
          body:JSON.stringify(parts)
        });
        const text = await r.text();
        let j;
        try { j = JSON.parse(text); } catch { throw new Error(`Redis returned non-JSON HTTP ${r.status}`); }
        if(!r.ok || j.error) throw new Error(j.error || `Redis request failed (${r.status})`);
        this.active = idx;
        return j.result;
      } catch(err){ lastError = err; }
    }
    throw new Error(`Redis request failed: ${lastError ? lastError.message : 'unknown error'}`);
  }
  async getRoom(code){
    const raw = await this.command(['GET', `chrono:room:${code}`]);
    return raw ? JSON.parse(raw) : null;
  }
  async setRoom(room){
    await this.command(['SET', `chrono:room:${room.code}`, JSON.stringify(room), 'EX', ROOM_TTL_SECONDS]);
    return true;
  }
  async deleteRoom(code){ await this.command(['DEL', `chrono:room:${code}`]); }
  async lock(key){ return (await this.command(['SET', `chrono:lock:${key}`, '1', 'NX', 'PX', 2000])) === 'OK'; }
  async unlock(key){ await this.command(['DEL', `chrono:lock:${key}`]); }
}

function env(name){ return process.env[name]; }

// Support the standard Upstash names, the Vercel KV names, and the exact
// prefixed names produced by the current Vercel/Upstash integration.
const credentialPairs = [
  ['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'],
  ['KV_REST_API_URL','KV_REST_API_TOKEN'],
  ['UPSTASH_REDIS_REST_KV_REST_API_URL','UPSTASH_REDIS_REST_KV_REST_API_TOKEN'],
  ['UPSTASH_REDIS_REST_KV_URL','UPSTASH_REDIS_REST_KV_REST_API_TOKEN'],
  ['UPSTASH_REDIS_REST_API_URL','UPSTASH_REDIS_REST_API_TOKEN']
].map(([url,token])=>({url:env(url),token:env(token),name:url}));

// As a final compatibility fallback, discover matching URL/TOKEN variables
// created by an integration without ever exposing their values.
const discoveredUrls = Object.keys(process.env).filter(k => /UPSTASH.*URL$/i.test(k) || /^KV.*URL$/i.test(k));
const discoveredTokens = Object.keys(process.env).filter(k => /UPSTASH.*TOKEN$/i.test(k) || /^KV.*TOKEN$/i.test(k));
for(const u of discoveredUrls){
  const base = u.replace(/URL$/i,'');
  const exact = discoveredTokens.find(t => t.replace(/TOKEN$/i,'') === base);
  if(exact) credentialPairs.push({url:env(u),token:env(exact),name:u});
}

const unique = [];
const seen = new Set();
for(const c of credentialPairs){
  const key = `${c.url || ''}|${c.token || ''}`;
  if(c.url && c.token && !seen.has(key)){ seen.add(key); unique.push(c); }
}

const hasRedis = unique.length > 0;
const store = hasRedis ? new RedisStore(unique) : new MemoryStore();
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

module.exports = { store, isRedis, withRoomLock };
