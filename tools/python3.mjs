import { spawnSync } from 'node:child_process';

const candidates = [
  ...(process.env.TRACEDOCS_PYTHON ? [[process.env.TRACEDOCS_PYTHON, []]] : []),
  ...(process.platform === 'win32' ? [['py', ['-3']]] : []),
  ['python3', []],
  ['python', []],
];

for (const [command, prefix] of candidates) {
  const version = spawnSync(command, [...prefix, '--version'], { encoding: 'utf8', windowsHide: true });
  if (version.status !== 0 || !/^Python 3\./.test((version.stdout || version.stderr || '').trim())) continue;

  const result = spawnSync(command, [...prefix, ...process.argv.slice(2)], { stdio: 'inherit', windowsHide: true });
  process.exitCode = result.status ?? 1;
  if (result.error) console.error(`Python failed: ${result.error.message}`);
  break;
}

if (process.exitCode === undefined) {
  console.error('Python 3 was not found. Install it or set TRACEDOCS_PYTHON to its executable path.');
  process.exitCode = 1;
}
