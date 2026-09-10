import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import characterCandidates from './netlify/functions/character-candidates.mjs';

const __filename=fileURLToPath(import.meta.url);
const ROOT=path.dirname(__filename);
const PORT=Number(process.env.PORT||8080);

function loadEnvLocal(){
  const envPath=path.join(ROOT,'.env.local');
  if(!fs.existsSync(envPath)) return;
  for(const raw of fs.readFileSync(envPath,'utf8').split(/\r?\n/)){
    const line=raw.trim();
    if(!line||line.startsWith('#')) continue;
    const i=line.indexOf('=');
    if(i<1) continue;
    const k=line.slice(0,i).trim();
    let v=line.slice(i+1).trim();
    if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1);
    if(!(k in process.env)) process.env[k]=v;
  }
}
loadEnvLocal();

const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.wav':'audio/wav','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};

async function readBody(req){
  const chunks=[];
  for await(const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function sendNodeResponse(res,status,headers,body){
  res.statusCode=status;
  for(const [k,v] of headers) res.setHeader(k,v);
  res.end(body);
}

const server=http.createServer(async(req,res)=>{
  try{
    const u=new URL(req.url,`http://${req.headers.host||`localhost:${PORT}`}`);
    if(u.pathname==='/api/character-candidates'){
      const body=await readBody(req);
      const headers=new Headers();
      for(const [k,v] of Object.entries(req.headers)) if(v!=null) headers.set(k,Array.isArray(v)?v.join(','):String(v));
      const request=new Request(`http://localhost:${PORT}${u.pathname}${u.search}`,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:body});
      const response=await characterCandidates(request);
      const out=Buffer.from(await response.arrayBuffer());
      console.log(`[local-api] ${req.method} ${u.pathname} -> ${response.status}`);
      return sendNodeResponse(res,response.status,response.headers,out);
    }

    let rel=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html';
    let full=path.resolve(ROOT,rel);
    if(!full.startsWith(ROOT)) {res.statusCode=403;return res.end('403 Forbidden');}
    if(fs.existsSync(full)&&fs.statSync(full).isDirectory()) full=path.join(full,'index.html');
    if(!fs.existsSync(full)||!fs.statSync(full).isFile()){res.statusCode=404;return res.end('404 Not Found');}
    res.statusCode=200;
    res.setHeader('content-type',MIME[path.extname(full).toLowerCase()]||'application/octet-stream');
    fs.createReadStream(full).pipe(res);
  }catch(err){
    console.error('[local-server-error]',err);
    res.statusCode=500;
    res.setHeader('content-type','application/json; charset=utf-8');
    res.end(JSON.stringify({ok:false,error:'LOCAL_SERVER_ERROR',message:String(err?.message||err)}));
  }
});

server.listen(PORT,'127.0.0.1',()=>{
  console.log(`Ready & Set local dev: http://localhost:${PORT}`);
  console.log(`character API: http://localhost:${PORT}/api/character-candidates`);
  console.log(`paid generation: ${process.env.READY_CHARACTER_PAID_GENERATION==='true'?'ENABLED':'LOCKED'}`);
  console.log(`OpenAI key: ${process.env.OPENAI_API_KEY?'FOUND':'MISSING'}`);
});
