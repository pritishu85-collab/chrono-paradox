const { store, isRedis } = require('../lib/store');
const { jsonResponse } = require('../lib/vercel-api');

module.exports = async function handler(req,res){
  if(req.method!=='GET') return jsonResponse(res,{error:'Method not allowed.'},405);
  let redisHealthy=false;
  let redisError=null;
  if(isRedis()) {
    try {
      const probe='chrono:health:probe';
      await store.command(['SET', probe, String(Date.now()), 'EX', 30]);
      redisHealthy=true;
    } catch (error) {
      redisError=error.message;
    }
  }
  const redisSource =
    process.env.UPSTASH_REDIS_REST_URL ? 'UPSTASH_REDIS_REST_*' :
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL ? 'UPSTASH_REDIS_REST_KV_REST_API_*' :
    process.env.UPSTASH_REDIS_REST_KV_URL ? 'UPSTASH_REDIS_REST_KV_*' :
    process.env.UPSTASH_REDIS_REST_REDIS_URL ? 'UPSTASH_REDIS_REST_REDIS_*' :
    process.env.KV_REST_API_URL ? 'KV_REST_API_*' : 'none';
  return jsonResponse(res,{ok:true,service:'chrono-paradox',redisConfigured:isRedis(),redisHealthy,redisSource,redisError});
};
