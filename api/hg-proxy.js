export const config = { runtime: 'edge' };

const UPSTREAM = 'https://www.htmlgames.com';

const UPSTREAM_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

export default async function handler(request) {
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

  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const url       = new URL(request.url);
  const search    = url.search;
  const targetUrl = `${UPSTREAM}/rss/games.php${search}`;

  let upstream;
  try {
    upstream = await fetch(targetUrl, {
      headers: UPSTREAM_HEADERS,
      signal:  AbortSignal.timeout(20_000),
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

  const body        = await upstream.arrayBuffer();
  const contentType = upstream.headers.get('Content-Type') ?? 'application/json; charset=utf-8';

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type':                contentType,
      'Cache-Control':               'public, max-age=300, s-maxage=1800',
      'X-Proxied-From':              UPSTREAM,
      'Access-Control-Allow-Origin': '*',
    },
  });
}
