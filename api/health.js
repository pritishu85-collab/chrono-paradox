const { store, isRedis } = require('../lib/store');
const { jsonResponse } = require('../lib/vercel-api');
module.exports = async function handler(req,res){
  if(req.method!=='GET') return jsonResponse(res,{error:'Method not allowed.'},405);
  if(!isRedis()) return jsonResponse(res,{ok:true,service:'chrono-paradox',redisConfigured:false,redisHealthy:false});
  try {
    await store.command(['PING']);
    return jsonResponse(res,{ok:true,service:'chrono-paradox',redisConfigured:true,redisHealthy:true});
  } catch(err) {
    return jsonResponse(res,{ok:true,service:'chrono-paradox',redisConfigured:true,redisHealthy:false,redisError:err.message},200);
  }
};
