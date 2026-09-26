import { createServer } from 'node:http';
import worker from './worker/index.js';
import { createUsageStore } from './quota_store.mjs';

const basePath = `/${(process.env.TRACEDOCS_BASE_PATH || 'TraceDocs').replace(/^\/+|\/+$/g, '')}`;
function clientIp(req) {
  const cloudflareIp = req.headers['cf-connecting-ip'];
  if (typeof cloudflareIp === 'string' && cloudflareIp.trim()) return cloudflareIp.trim();
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const candidate = forwarded.split(',').at(-1).trim();
    if (candidate) return candidate;
  }
  return req.socket.remoteAddress || '';
}
const env = {
  TYPESAFE_API_KEY: process.env.TYPESAFE_API_KEY || '',
  ...createUsageStore(process.env.TRACEDOCS_DATA_FILE || './data/ip-usage.json'),
};

const server = createServer(async (req, res) => {
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 1800000) { res.writeHead(413).end('Request too large'); return; }
      chunks.push(chunk);
    }
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) headers.set(name, value.join(', '));
      else if (value !== undefined) headers.set(name, value);
    }
    headers.delete('cf-connecting-ip');
    headers.delete('x-tracedocs-client-ip');
    headers.set('x-tracedocs-client-ip', clientIp(req));
    const host = req.headers.host || 'localhost';
    const incoming = new URL(`http://${host}${req.url || '/'}`);
    if (incoming.pathname === '/') { res.writeHead(302, { location: `${basePath}/` }).end(); return; }
    if (incoming.pathname === basePath) { res.writeHead(308, { location: `${basePath}/` }).end(); return; }
    if (!incoming.pathname.startsWith(`${basePath}/`)) { res.writeHead(404).end('Not found'); return; }
    incoming.pathname = incoming.pathname.slice(basePath.length) || '/';
    const request = new Request(incoming, {
      method: req.method,
      headers,
      ...(chunks.length && req.method !== 'GET' && req.method !== 'HEAD' ? { body: Buffer.concat(chunks) } : {}),
    });
    const response = await worker.fetch(request, env);
    const responseHeaders = Object.fromEntries(response.headers.entries());
    res.writeHead(response.status, responseHeaders);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('TraceDocs request failed:', error?.message || 'unknown error');
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});
const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0', () => console.log(`TraceDocs × Jev listening on ${port}`));
