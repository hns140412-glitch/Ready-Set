const fs=require('fs');
const assert=require('assert');
const pkg=require('../package.json');
const session=fs.readFileSync('ready-family-session-v01.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const entry=fs.readFileSync('src/auth/netlify-identity-browser-entry.mjs','utf8');

assert(pkg.scripts?.['build:auth'],'AUTH_BUILD_SCRIPT_MISSING');
assert(pkg.devDependencies?.esbuild,'ESBUILD_DEPENDENCY_MISSING');
assert(entry.includes("oauthLogin('google')"),'GOOGLE_OAUTH_HELPER_MISSING');
assert(entry.includes('handleAuthCallback()'),'AUTH_CALLBACK_HANDLER_MISSING');
assert(entry.includes('getSettings()'),'IDENTITY_SETTINGS_GATE_MISSING');
assert(entry.includes('settings.providers?.google'),'GOOGLE_PROVIDER_GATE_MISSING');
assert(index.includes('assets/runtime/netlify-identity-runtime.js'),'IDENTITY_BROWSER_BUNDLE_NOT_LOADED');
assert(session.includes('ReadyNetlifyIdentity'),'FAMILY_SESSION_NOT_USING_BROWSER_IDENTITY');
assert(session.includes('readyset-identity-callback'),'CALLBACK_NOT_REHYDRATING_FAMILY_SESSION');
console.log('GOOGLE_OAUTH_BROWSER_INTEGRATION_CONTRACT_PASS');
