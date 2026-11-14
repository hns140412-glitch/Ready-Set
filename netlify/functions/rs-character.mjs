// Ready & Set: child's photo -> three 2.5D explorer characters (A/B/C), one per vibe direction.
// Paid image generation. LOCKED unless the site env RS_CHARACTER_GEN is exactly "on" (set by Taky in Netlify).
// Prompts ported from user-character-generator-adapter-2026-09-30 (identity + quality masters), self-contained.
const MODEL = String(process.env.RS_IMAGE_MODEL || 'gpt-image-2.5-sunburst').trim();
const QUALITY = String(process.env.RS_IMAGE_QUALITY || 'high').trim();
const MAX_SOURCE_BYTES = 2_500_000;

const IDENTITY = `Use the uploaded child photo as the sole identity authority. Preserve the SAME CHILD with very high fidelity: face shape and proportions, eyes, eyebrows, nose, mouth and smile, cheeks, jaw, ears when visible, hairline and hairstyle. Do not beautify, age up or down, change ethnicity, enlarge the eyes excessively or replace the face with a generic cute child. Stickers, face paint, lighting and camera artifacts are not identity features.`;
const STYLE = `Render as a premium 2.5D animated-film child explorer for the Ready & Set "Same Sky, Different Stories" world: soft dimensional shading, warm cinematic light, crisp silhouette, natural child proportions with a slightly larger head. Outfit: navy explorer jacket with a HOOD in the requested hood colour, cream shirt, brown satchel, small mountain badge. Full body visible with margin, standing on a soft pale-sky watercolor background with a hint of mountains. No text, logos, letters, extra people or animals. Identity wins over style.`;
const HOOD = { navy: 'deep navy blue', gold: 'warm mustard gold', forest: 'forest green', rose: 'dusty rose pink' };
const ITEM = { camera: 'a vintage navy-and-cream camera on a leather strap', compass: 'a brass and navy compass', notebook: 'a kraft-paper explorer notebook', binoculars: 'navy and brass binoculars', bottle: 'a cream water bottle with a navy cap' };
const DIR = {
  warm: 'Direction: bright and kind. Open friendly smile, waving hello, relaxed confident stance, sunny morning light.',
  curious: 'Direction: curious. Leaning forward, eyes wide with wonder, one hand raised as if discovering something, gentle afternoon light.',
  calm: 'Direction: calm and steady. Soft confident smile, standing tall and still, hands holding the item close, quiet golden light.',
  bold: 'Direction: energetic. Dynamic mid-stride pose, big grin, arm pointing forward to adventure, breezy wind in the hair.'
};

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
function parseDataUrl(v = '') {
  const m = String(v).match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if (!m) throw new Error('SOURCE_PHOTO_FORMAT');
  const bytes = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
  if (bytes.byteLength > MAX_SOURCE_BYTES) throw new Error('SOURCE_PHOTO_TOO_LARGE');
  return { type: m[1], bytes };
}
export function promptFor(dir, hood, item) {
  return [IDENTITY, STYLE, `Hood colour: ${HOOD[hood] || HOOD.navy}.`, ITEM[item] ? `Carrying ${ITEM[item]}.` : '', DIR[dir] || DIR.warm,
    'Generate exactly one character for this one direction. Re-check the face against the ORIGINAL photo before finishing.'].filter(Boolean).join('\n');
}
async function edit(source, prompt) {
  const form = new FormData();
  form.append('model', MODEL); form.append('prompt', prompt); form.append('n', '1');
  form.append('size', '1024x1536'); form.append('quality', QUALITY); form.append('output_format', 'webp');
  form.append('image', new Blob([source.bytes], { type: source.type }), source.type === 'image/png' ? 'reference.png' : 'reference.jpg');
  const r = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data?.error?.message || 'IMAGE_FAILED'), { status: r.status });
  const x = data?.data?.[0];
  if (!x?.b64_json) throw new Error('IMAGE_MISSING');
  return `data:image/webp;base64,${x.b64_json}`;
}

export default async req => {
  if (req.method !== 'POST') return json(405, { ok: false, code: 'METHOD_NOT_ALLOWED' });
  if (process.env.RS_CHARACTER_GEN !== 'on') return json(423, { ok: false, code: 'LOCKED', message: 'AI 캐릭터 만들기는 아직 꺼져 있어요.' });
  if (!process.env.OPENAI_API_KEY) return json(503, { ok: false, code: 'NOT_CONFIGURED' });
  let body; try { body = await req.json(); } catch { return json(400, { ok: false, code: 'INVALID_JSON' }); }
  if (body?.confirmCost !== true) return json(409, { ok: false, code: 'COST_CONFIRMATION_REQUIRED' });
  const dirs = (Array.isArray(body.dirs) ? body.dirs : []).filter(d => DIR[d]).slice(0, 3);
  if (dirs.length !== 3) return json(400, { ok: false, code: 'THREE_DIRECTIONS_REQUIRED' });
  let source; try { source = parseDataUrl(body.photo); } catch (e) { return json(400, { ok: false, code: e.message }); }
  try {
    const images = [];
    for (const d of dirs) images.push(await edit(source, promptFor(d, body.hood, body.item))); // sequential, fail fast
    return json(200, { ok: true, model: MODEL, quality: QUALITY, dirs, images });
  } catch (e) {
    return json(e?.status || 500, { ok: false, code: e?.status ? 'PROVIDER_ERROR' : 'FAILED', message: String(e?.message || e).slice(0, 200) });
  }
};
export const config = { path: '/api/rs-character' };
