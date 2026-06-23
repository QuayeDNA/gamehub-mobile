/**
 * Vercel Edge Function — GameMonetize CORS Proxy
 * ════════════════════════════════════════════════════════════════════════
 * Route:  /api/gm/*  →  https://gamemonetize.com/*
 *
 * Why this exists:
 *   GameMonetize does not send Access-Control-Allow-Origin headers, so
 *   browsers block direct fetch() calls from a web app. This function
 *   runs at the edge (same origin as the app), fetches from GameMonetize
 *   server-side, and returns the response — no CORS issue possible.
 *
 * Dev behaviour:
 *   Vite's server.proxy in vite.config.js handles /api/gm in development,
 *   so this function is only invoked in production (Vercel).
 *
 * Both environments use the identical path /api/gm, so gameApi.js needs
 * no environment-variable branching at all.
 */

export const config = { runtime: 'edge' };

const UPSTREAM = 'https://gamemonetize.com';

/** Headers forwarded to GameMonetize — mimic a real browser request */
const UPSTREAM_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

export default async function handler(request) {
  // ── CORS preflight ────────────────────────────────────────────────────
  // Not required for same-origin production calls, but handles any
  // cross-origin tool access (curl, Postman, local dev on a different port).
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age':       '86400',
      },
    });
  }

  // ── Only GET is proxied ───────────────────────────────────────────────
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Build upstream URL ────────────────────────────────────────────────
  // Input:  /api/gm/rssfeed.php?format=json&page=1&amount=30
  // Output: https://gamemonetize.com/rssfeed.php?format=json&page=1&amount=30
  const url          = new URL(request.url);
  const upstreamPath = url.pathname.replace(/^\/api\/gm/, '') || '/';
  const targetUrl    = `${UPSTREAM}${upstreamPath}${url.search}`;

  // ── Proxy the request ─────────────────────────────────────────────────
  let upstream;
  try {
    upstream = await fetch(targetUrl, {
      headers: UPSTREAM_HEADERS,
      signal:  AbortSignal.timeout(15_000),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Upstream fetch failed', detail: err.message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: `Upstream returned HTTP ${upstream.status}` }),
      { status: upstream.status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Stream response back with cache headers ───────────────────────────
  const body        = await upstream.arrayBuffer();
  const contentType = upstream.headers.get('Content-Type') ?? 'application/json; charset=utf-8';

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type':                contentType,
      // 5 min browser cache · 10 min Vercel CDN edge cache
      'Cache-Control':               'public, max-age=300, s-maxage=600',
      'X-Proxied-From':              UPSTREAM,
      'Access-Control-Allow-Origin': '*',
    },
  });
}
