'use strict';

const { createSyncService } = require('./ready-sync-core.js');

function json(statusCode,body){
  return {
    statusCode,
    headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store',
      'Access-Control-Allow-Origin':'*',
      'Access-Control-Allow-Headers':'Content-Type, Idempotency-Key',
      'Access-Control-Allow-Methods':'GET, POST, OPTIONS'
    },
    body:JSON.stringify(body)
  };
}

exports.handler=async function(event){
  if(event.httpMethod==='OPTIONS') return json(204,{});
  const path=String(event.path||'');
  const { getStore } = await import('@netlify/blobs');
  const blobs=getStore({name:'ready-set-sync-v1',consistency:'strong'});
  const service=createSyncService({
    get:key=>blobs.get(key,{type:'text',consistency:'strong'}),
    set:(key,value)=>blobs.set(key,value)
  });

  if(event.httpMethod==='GET' && path.endsWith('/health')){
    return json(200,await service.health());
  }

  if(event.httpMethod==='POST' && path.endsWith('/events')){
    let body={};
    try{ body=JSON.parse(event.body||'{}'); }
    catch{ return json(400,{ok:false,reason:'INVALID_JSON'}); }

    const headerKey=event.headers?.['idempotency-key'] || event.headers?.['Idempotency-Key'];
    if(headerKey && !body.idempotency_key) body.idempotency_key=headerKey;
    const result=await service.putEvent(body);
    return json(result.status,result.body);
  }

  return json(404,{ok:false,reason:'NOT_FOUND'});
};
