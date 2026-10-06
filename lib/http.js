function json(res, status, data){
  res.statusCode = status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.end(JSON.stringify(data));
}
function readBody(req){
  return new Promise((resolve,reject)=>{
    let body='';
    req.on('data', c => { body += c; if(body.length > 10000) reject(new Error('Request too large.')); });
    req.on('end', ()=>{ try{ resolve(body ? JSON.parse(body) : {}); } catch{ reject(new Error('Invalid request')); } });
    req.on('error',reject);
  });
}
module.exports = { json, readBody };
