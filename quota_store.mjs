import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export function createUsageStore(filePath) {
  const dataPath = resolve(filePath);
  let serial = Promise.resolve();
  async function readStore() {
    try { return JSON.parse(await readFile(dataPath, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
  }
  function keyFor(ip, date) { return `${date}:${createHash('sha256').update(ip).digest('hex')}`; }
  function rowFor(store, ip, date) { const row = store[keyFor(ip, date)]; return row?.date === date && Number.isInteger(row.usage_count) ? row.usage_count : 0; }
  function mutate(change) {
    const operation = serial.then(async () => {
      await mkdir(dirname(dataPath), { recursive: true });
      const store = await readStore(), result = change(store);
      const tempPath = `${dataPath}.${process.pid}.tmp`;
      await writeFile(tempPath, JSON.stringify(store), { mode: 0o600 });
      await rename(tempPath, dataPath);
      return result;
    });
    serial = operation.catch(() => {});
    return operation;
  }
  return {
    getIpUsage: async (ip, date) => rowFor(await readStore(), ip, date),
    reserveIpUsage: (ip, limit, date) => mutate(store => {
      for (const key of Object.keys(store)) if (!key.startsWith(`${date}:`)) delete store[key];
      const key = keyFor(ip, date), used = rowFor(store, ip, date);
      if (used >= limit) return { allowed: false, ip, used, limit, remaining: 0 };
      store[key] = { ip_hash: key.slice(date.length + 1), date, usage_count: used + 1 };
      return { allowed: true, ip, used: used + 1, limit, remaining: limit - used - 1 };
    }),
    releaseIpUsage: (ip, date) => mutate(store => {
      const key = keyFor(ip, date), used = rowFor(store, ip, date);
      if (used <= 1) delete store[key]; else store[key].usage_count = used - 1;
    }),
  };
}
