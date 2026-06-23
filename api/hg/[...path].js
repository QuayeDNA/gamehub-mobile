/**
 * Vercel Edge Function — HTMLGames CORS Proxy
 * ════════════════════════════════════════════════════════════════════════
 * Route:  /api/hg/*  →  https://www.htmlgames.com/*
 *
 * Why this exists:
 *   HTMLGames does not send Access-Control-Allow-Origin headers, so
 *   browsers block direct fetch() calls from a web app. This function
 *   runs at the edge (same origin as the app), fetches from HTMLGames
 *   server-side, and returns the response — no CORS issue possible.
 *
 * Key call:
 *   /api/hg/rss/games.php?type=json  →  https://www.htmlgames.com/rss/games.php?type=json
 *
 * Note on response size:
 *   HTMLGames returns its entire game catalogue in a single JSON response
 *   (~3–5 MB). The s-maxage=1800 cache header (30 min) ensures Vercel's
 *   CDN serves repeat requests from cache rather than fetching fresh,
 *   keeping cold invocations rare.
 *
 * Dev behaviour:
 *   Vite's server.proxy in vite.config.js handles /api/hg in development,
 *   so this function is only invoked in production (Vercel).
 */

export const config = { runtime: 'edge' };

const UPSTREAM = 'https://www.htmlgames.com';

/** Headers forwarded to HTMLGames — mimic a real browser request */
const UPSTREAM_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

export default async function handler(request) {
  // ── CORS preflight ────────────────────────────────────────────────────
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
  // Input:  /api/hg/rss/games.php?type=json
  // Output: https://www.htmlgames.com/rss/games.php?type=json
  const url          = new URL(request.url);
  const upstreamPath = url.pathname.replace(/^\/api\/hg/, '') || '/';
  const targetUrl    = `${UPSTREAM}${upstreamPath}${url.search}`;

  // ── Proxy the request ─────────────────────────────────────────────────
  let upstream;
  try {
    upstream = await fetch(targetUrl, {
      headers: UPSTREAM_HEADERS,
      // HTMLGames returns a large JSON (~3–5 MB) — allow more time
      signal: AbortSignal.timeout(20_000),
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
      // HTMLGames catalogue doesn't change frequently — cache aggressively.
      // 5 min browser cache · 30 min Vercel CDN edge cache
      'Cache-Control':               'public, max-age=300, s-maxage=1800',
      'X-Proxied-From':              UPSTREAM,
      'Access-Control-Allow-Origin': '*',
    },
  });
}
