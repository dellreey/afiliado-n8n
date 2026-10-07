import { Hono } from 'hono';

const app = new Hono();
const UPSTREAM = 'http://postgrest.railway.internal:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

function isAuthorized(c: any): boolean {
  const authorization = c.req.header('Authorization') || '';
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const apikey = c.req.header('apikey') || '';
  return Boolean(AUTH_TOKEN) && (bearer === AUTH_TOKEN || apikey === AUTH_TOKEN);
}

app.get('/health', (c) => c.json({ status: 'ok', upstream: UPSTREAM }));

app.all('/rest/v1/*', async (c) => {
  if (!isAuthorized(c)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const url = new URL(c.req.url);
  const restPath = url.pathname.replace(/^\/rest\/v1/, '');
  const targetUrl = `${UPSTREAM}${restPath}${url.search}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(c.req.header())) {
    if (!value) continue;
    const lower = key.toLowerCase();
    if (['host', 'connection', 'content-length', 'transfer-encoding'].includes(lower)) continue;
    headers.set(key, value);
  }

  const method = c.req.method;
  const body = ['GET', 'HEAD'].includes(method)
    ? undefined
    : new Uint8Array(await c.req.arrayBuffer());

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return c.json({ error: 'Erro ao acessar a base de dados' }, 502);
  }
});

export default app;
