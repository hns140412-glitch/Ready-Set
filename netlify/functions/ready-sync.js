'use strict';

const { createSyncService } = require('./ready-sync-core.js');

function json(statusCode,body,origin){
  const headers={
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store'
  };
  if(origin) headers['Access-Control-Allow-Origin']=origin;
  if(origin) headers['Vary']='Origin';
  headers['Access-Control-Allow-Headers']='Content-Type, Idempotency-Key, Authorization';
  headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';
  return {statusCode,headers,body:JSON.stringify(body)};
}

function configuredOrigin(){
  const value=String(process.env.READY_SYNC_ALLOWED_ORIGIN||'').trim();
  return value || null;
}

function authorize(event){
  const token=String(process.env.READY_SYNC_AUTH_TOKEN||'').trim();
  if(!token) return {ok:false,status:503,reason:'AUTH_NOT_CONFIGURED'};
  const header=String(event.headers?.authorization||event.headers?.Authorization||'').trim();
  if(header!==('Bearer '+token)) return {ok:false,status:401,reason:'UNAUTHORIZED'};
  return {ok:true};
}

exports.handler=async function(event){
  const origin=configuredOrigin();
  if(event.httpMethod==='OPTIONS') return json(204,{},origin);

  const path=String(event.path||'');
  if(event.httpMethod==='GET' && path.endsWith('/health')){
    return json(200,{
      ok:true,
      service:'ready-set-sync',
      contract:'HTTP_JSON_V1',
      persistence:'REMOTE_STORE',
      write_auth:process.env.READY_SYNC_AUTH_TOKEN?'CONFIGURED':'NOT_CONFIGURED'
    },origin);
  }

  if(event.httpMethod==='POST' && path.endsWith('/events')){
    const auth=authorize(event);
    if(!auth.ok) return json(auth.status,{ok:false,reason:auth.reason},origin);

    let body={};
    try{ body=JSON.parse(event.body||'{}'); }
    catch{ return json(400,{ok:false,reason:'INVALID_JSON'},origin); }

    const headerKey=event.headers?.['idempotency-key'] || event.headers?.['Idempotency-Key'];
    if(headerKey && !body.idempotency_key) body.idempotency_key=headerKey;

    const { getStore } = await import('@netlify/blobs');
    const blobs=getStore({name:'ready-set-sync-v1',consistency:'strong'});
    const service=createSyncService({
      get:key=>blobs.get(key,{consistency:'strong'}),
      set:(key,value)=>blobs.set(key,value)
    });
    const result=await service.putEvent(body);
    return json(result.status,result.body,origin);
  }

  return json(404,{ok:false,reason:'NOT_FOUND'},origin);
};
