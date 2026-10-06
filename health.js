const { isRedis } = require('../lib/store');
const { jsonResponse } = require('../lib/vercel-api');
module.exports = function handler(req,res){
  if(req.method!=='GET') return jsonResponse(res,{error:'Method not allowed.'},405);
  return jsonResponse(res,{ok:true,service:'chrono-paradox',redisConfigured:isRedis()});
};
