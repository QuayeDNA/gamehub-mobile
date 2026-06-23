/**
 * GameHub — CORS Proxy Worker  [ALTERNATIVE — not the primary proxy]
 * ════════════════════════════════════════════════════════════════════════
 * The PRIMARY proxy for Vercel deployments is the pair of Vercel Edge
 * Functions in api/gm/[...path].js and api/hg/[...path].js. Those run
 * at the same origin as the app and require no extra configuration.
 *
 * Use THIS Cloudflare Worker only if you deploy to a platform that does
 * NOT support server-side functions (Netlify static, GitHub Pages, S3,
 * etc.). In that case:
 *   1. Deploy:  npx wrangler deploy  (or: npm run deploy:worker)
 *   2. Set VITE_CORS_PROXY_URL in your build env to the worker URL
 *   3. Re-enable the _PROXY branching in src/services/gameApi.js
 *
 * Runs on Cloudflare Workers (free tier: 100,000 req/day).
 *
 * Problem it solves:
 *   GameMonetize and HTMLGames do not send Access-Control-Allow-Origin
 *   headers, so browsers block direct fetch() calls from a web app.
 *   This worker sits in between, fetches from the upstream on the server
 *   side, and forwards the response with proper CORS headers attached.
 *
 * Routes:
 *   GET /gm/*    →  https://gamemonetize.com/*   (+ query string)
 *   GET /hg/*    →  https://www.htmlgames.com/*  (+ query string)
 *   GET /health  →  200 JSON health check
 *
 * Caching:
 *   Responses are stored in Cloudflare's edge cache.
 *   - Client cache-control: 5 minutes  (reduces repeat requests per user)
 *   - Edge cache (s-maxage):  10 minutes (shared across all users globally)
 *   This dramatically reduces upstream request counts on the free tier.
 *
 * Deploy:
 *   npx wrangler deploy
 *
 * After deploying, copy the worker URL into .env.production:
 *   VITE_CORS_PROXY_URL=https://gamehub-cors-proxy.YOUR-SUBDOMAIN.workers.dev
 */

// ── Upstream route table ────────────────────────────────────────────────
const UPSTREAM = {
  "/gm": "https://gamemonetize.com",
  "/hg": "https://www.htmlgames.com",
};

// ── CORS headers added to every response ────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Max-Age": "86400",
};

// ── Headers sent to the upstream — looks like a normal browser ──────────
const UPSTREAM_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
};

// ── Helpers ─────────────────────────────────────────────────────────────

/** Return a JSON error response with CORS headers */
function errorResponse(status, message) {
  return new Response(JSON.stringify({ error: message, status }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

/** Strip the /gm or /hg prefix and rebuild the upstream URL */
function resolveUpstream(pathname, search) {
  for (const [prefix, base] of Object.entries(UPSTREAM)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      const stripped = pathname.slice(prefix.length) || "/";
      return `${base}${stripped}${search}`;
    }
  }
  return null;
}

// ── Main handler ─────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ── Health check ────────────────────────────────────────────────────
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          ok: true,
          ts: Date.now(),
          routes: Object.keys(UPSTREAM),
        }),
        { headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    // ── CORS preflight ──────────────────────────────────────────────────
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── Only GET is supported ───────────────────────────────────────────
    if (request.method !== "GET") {
      return errorResponse(405, "Method Not Allowed — only GET is supported");
    }

    // ── Resolve upstream URL ────────────────────────────────────────────
    const targetUrl = resolveUpstream(url.pathname, url.search);
    if (!targetUrl) {
      return errorResponse(
        404,
        `Unknown proxy route "${url.pathname}". Valid prefixes: ${Object.keys(UPSTREAM).join(", ")}`,
      );
    }

    // ── Check Cloudflare edge cache first ───────────────────────────────
    //    Uses a normalized Request object as the cache key so query strings
    //    are included (e.g. different categories return different results).
    const cacheKey = new Request(targetUrl, { method: "GET" });
    const cache = caches.default;

    try {
      const cached = await cache.match(cacheKey);
      if (cached) {
        // Reattach CORS headers — cached responses may have stale ones
        const headers = new Headers(cached.headers);
        for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
        headers.set("X-Cache", "HIT");
        return new Response(cached.body, { status: cached.status, headers });
      }
    } catch {
      // Cache API unavailable in some test environments — continue to fetch
    }

    // ── Fetch from upstream ─────────────────────────────────────────────
    let upstreamRes;
    try {
      upstreamRes = await fetch(targetUrl, {
        headers: UPSTREAM_HEADERS,
        // Cloudflare Workers support AbortSignal.timeout natively
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      return errorResponse(502, `Upstream fetch failed: ${err.message}`);
    }

    if (!upstreamRes.ok) {
      return errorResponse(
        upstreamRes.status,
        `Upstream returned HTTP ${upstreamRes.status} for ${targetUrl}`,
      );
    }

    // ── Build the proxied response ───────────────────────────────────────
    const body = await upstreamRes.arrayBuffer();

    // Preserve the upstream Content-Type (almost always application/json)
    const contentType =
      upstreamRes.headers.get("Content-Type") ||
      "application/json; charset=utf-8";

    const response = new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // 5 min browser cache, 10 min shared Cloudflare edge cache
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "X-Cache": "MISS",
        "X-Proxied-From": new URL(targetUrl).hostname,
        ...CORS_HEADERS,
      },
    });

    // Store in edge cache asynchronously — don't block the response
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },
};
