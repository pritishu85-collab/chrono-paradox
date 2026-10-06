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
  return jsonResponse(res,{ok:true,service:'chrono-paradox',redisConfigured:isRedis(),redisHealthy,redisError});
};
