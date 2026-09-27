import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
if (dirname(dist) !== root || dist === root) throw new Error('Unsafe build destination');

const generated = spawnSync(process.execPath, [join(root, 'tools/python3.mjs'), join(root, 'tools/build_worker.py')], {
  stdio: 'inherit',
  windowsHide: true,
});
if (generated.error) throw generated.error;
if (generated.status !== 0) process.exit(generated.status ?? 1);

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'server'), { recursive: true });
copyFileSync(join(root, 'worker/index.js'), join(dist, 'server/index.js'));
const hosting = join(root, '.openai/hosting.json');
if (existsSync(hosting)) {
  mkdirSync(join(dist, '.openai'), { recursive: true });
  copyFileSync(hosting, join(dist, '.openai/hosting.json'));
}
console.log(`Built ${dist}`);
