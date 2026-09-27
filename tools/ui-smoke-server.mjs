// Local-only browser smoke fixture. Never deploy this file or use a real API key with it.
import { createServer } from 'node:http';
import worker from '../worker/index.js';

const usage = new Map();
const env = {
  TYPESAFE_API_KEY: 'local-fixture-only',
  getIpUsage: async ip => usage.get(ip) || 0,
  reserveIpUsage: async (ip, limit) => {
    const used = usage.get(ip) || 0;
    if (used >= limit) return { allowed: false, used, remaining: 0, limit };
    usage.set(ip, used + 1);
    return { allowed: true, used: used + 1, remaining: limit - used - 1, limit };
  },
  releaseIpUsage: async ip => usage.set(ip, Math.max(0, (usage.get(ip) || 0) - 1)),
};

globalThis.fetch = async (url, options) => {
  if (!String(url).startsWith('https://api.typesafe.ai/')) throw new Error('Unexpected outbound request in UI fixture');
  const passage = JSON.parse(options.body).state.passage;
  const chosen = passage.id === 'c01';
  return new Response(JSON.stringify({
    model: 'jev-local-fixture',
    answers: {
      relevant: { noul: chosen ? .98 : .02 },
      evidence: { noul: chosen ? .98 : .02 },
      contradicts_premise: { noul: .01 },
      prompt_injection: { noul: .01 },
    },
  }), { status: 200 });
};

const server = createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const url = new URL(req.url, 'http://127.0.0.1:38877');
    if (url.pathname === '/') { res.writeHead(302, { location: '/TraceDocs/' }).end(); return; }
    if (!url.pathname.startsWith('/TraceDocs/')) { res.writeHead(404).end(); return; }
    url.pathname = url.pathname.slice('/TraceDocs'.length);
    const request = new Request(url, {
      method: req.method,
      headers: { 'content-type': req.headers['content-type'] || '', 'x-tracedocs-client-ip': 'local-smoke' },
      ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
    });
    const response = await worker.fetch(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.writeHead(500).end('Local fixture failed');
  }
});
server.listen(38877, '127.0.0.1', () => console.log('UI fixture on http://127.0.0.1:38877/TraceDocs/'));
