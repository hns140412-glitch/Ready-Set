// Dependency-free Chrome DevTools Protocol helper (uses installed Chrome + Node global WebSocket).
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
export async function launch({port = 9333, width = 390, height = 844} = {}) {
  if (!CHROME) throw new Error('NO_INSTALLED_CHROME');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ready-vs001-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', `--window-size=${width},${height}`, 'about:blank'], {stdio:'ignore'});
  let targets;
  for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.some(t => t.type === 'page')) break; } catch {} await new Promise(r => setTimeout(r, 200)); }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0; const pending = new Map(); const errors = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text); else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' ')); };
  const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, m => m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)); ws.send(JSON.stringify({id, method, params})); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Network.setBypassServiceWorker', {bypass:true});
  await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor:2, mobile:true});
  await send('Emulation.setTouchEmulationEnabled', {enabled:true});
  const evaluate = async (expr) => { const r = await send('Runtime.evaluate', {expression:expr, awaitPromise:true, returnByValue:true}); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  const goto = async url => { await send('Page.navigate', {url}); await new Promise(r => setTimeout(r, 300)); for (let i = 0; i < 50; i++) { if (await evaluate('document.readyState').catch(() => '') === 'complete') break; await new Promise(r => setTimeout(r, 100)); } };
  const shot = async file => { const r = await send('Page.captureScreenshot', {format:'png'}); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); };
  const close = () => { try { ws.close(); } catch {} proc.kill(); };
  return {send, evaluate, goto, shot, close, errors};
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
