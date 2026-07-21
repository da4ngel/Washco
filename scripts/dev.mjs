// Zero-dependency parallel dev runner (replaces `concurrently`).
// Spawns the backend and frontend dev servers and prefixes their output.
import { spawn } from 'node:child_process';
import process from 'node:process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const targets = [
  { name: 'backend', color: '\x1b[34m' }, // blue
  { name: 'frontend', color: '\x1b[32m' }, // green
];
const reset = '\x1b[0m';

const children = [];

function prefixStream(stream, name, color) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      process.stdout.write(`${color}[${name}]${reset} ${line}\n`);
    }
  });
}

for (const { name, color } of targets) {
  // shell: true is required on Windows to spawn npm.cmd without EINVAL.
  const child = spawn(npm, ['run', `dev:${name}`], { cwd: process.cwd(), shell: true });
  prefixStream(child.stdout, name, color);
  prefixStream(child.stderr, name, color);
  child.on('exit', (code) => {
    process.stdout.write(`${color}[${name}]${reset} exited with code ${code}\n`);
  });
  children.push(child);
}

function shutdown() {
  for (const child of children) child.kill('SIGINT');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
