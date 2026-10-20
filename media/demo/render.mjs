// Renders a page's window.render(t) into PNG frames with headless Chrome over CDP.
// usage: node media/demo/render.mjs <url> <outDir> <width> <height> <scale> <fps> <seconds> [single-t]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, outDir, w, h, scale, fps, seconds, single] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const profile = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'chrome-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${profile}`, '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) {
  try { targets = await (await fetch('http://127.0.0.1:9333/json')).json(); if (targets.length) break; } catch {}
  await sleep(200);
}
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: +scale, mobile: false });
await send('Page.enable');
await send('Page.navigate', { url });
await sleep(2500);
const total = single !== undefined ? 1 : Math.round(+fps * +seconds);
for (let f = 0; f < total; f++) {
  const t = single !== undefined ? +single : f / +fps;
  await send('Runtime.evaluate', { expression: `render(${t})` });
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: +w, height: +h, scale: 1 } });
  writeFileSync(join(outDir, `f${String(f).padStart(4, '0')}.png`), Buffer.from(shot.result.data, 'base64'));
}
ws.close(); chrome.kill();
console.log(`rendered ${total} frames`);
