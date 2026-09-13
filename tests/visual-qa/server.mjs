// NON-PRODUCTION: separate, loopback-only static fixture server. No API imports.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const fixtures = ['onboarding-mode', 'onboarding-profile', 'onboarding-photo'];
export function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    res.setHeader('Cache-Control', 'no-store');
    // Block paid APIs, external connections, workers and form submission even on clicks.
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self'; connect-src 'none'; worker-src 'none'; form-action 'none'; object-src 'none'");
    if (req.method !== 'GET') { res.writeHead(405); return res.end(); }
    if (url.pathname === '/__visual/') {
      const fixture = url.searchParams.get('state');
      if (!fixtures.includes(fixture)) { res.writeHead(400); return res.end(`Choose state: ${fixtures.join(', ')}`); }
      const bootstrap = fs.readFileSync(new URL('./setup.js', import.meta.url), 'utf8');
      const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(html.replace('<head>', `<head><base href="/"><script>${bootstrap}</script>`));
    }
    // Explicit public asset allowlist; never serve secrets, source directories or sw.js.
    const rel = url.pathname.slice(1);
    const allowed = /^(?:app|ready-[a-z0-9-]+)\.js$/.test(rel)
      || /^(?:styles|ready-base-home-v1)\.css$/.test(rel)
      || /^manifest\.(?:json|webmanifest)$/.test(rel)
      || /^assets\/[a-zA-Z0-9_./ -]+\.(?:png|jpg|jpeg|webp|svg|wav|mp3|woff2?)$/.test(rel);
    const full = path.resolve(ROOT, rel);
    if (!allowed || !full.startsWith(ROOT) || !fs.existsSync(full) || !fs.statSync(full).isFile()
        || !fs.realpathSync(full).startsWith(fs.realpathSync(ROOT) + path.sep)) {
      res.writeHead(404); return res.end();
    }
    const types = {'.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.webmanifest':'application/manifest+json'};
    res.setHeader('Content-Type', types[path.extname(full)] || 'application/octet-stream');
    fs.createReadStream(full).pipe(res);
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createServer().listen(4177, '127.0.0.1', () => console.log('Visual QA only: http://127.0.0.1:4177/__visual/?state=onboarding-mode'));
}
