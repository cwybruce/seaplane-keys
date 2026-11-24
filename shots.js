// Seaplane Keys — screenshot driver: serves game/, drives headless Chrome over
// CDP, and captures the four ?shot= scenes as 1280x720 JPEGs. Node 24 built-in
// WebSocket, no dependencies. Usage: node shots.js
import { spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const PORT = 8091;
const CHROME = '/usr/bin/google-chrome';
const SHOTS = [
  { name: '1-menu', shot: 'menu', keys: [] },
  { name: '2-fly', shot: 'fly', keys: ['ArrowUp'] },
  { name: '3-deliver', shot: 'deliver', keys: [] },
  { name: '4-over', shot: 'over', keys: [] },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function getJson(path, method) {
  const res = await fetch('http://127.0.0.1:9222' + path, { method: method || 'GET' });
  return res.json();
}

class Cdp {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    };
  }
  ready() {
    return new Promise((resolve) => {
      if (this.ws.readyState === 1) resolve();
      else this.ws.onopen = () => resolve();
    });
  }
  send(method, params) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params: params || {} }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('CDP timeout: ' + method));
        }
      }, 20000);
    });
  }
}

async function main() {
  mkdirSync(join(here, 'screenshots'), { recursive: true });
  const server = spawn('node', ['serve.ts', '--port', String(PORT)], {
    cwd: here, stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (d) => process.stdout.write('[serve] ' + d));
  server.stderr.on('data', (d) => process.stdout.write('[serve:err] ' + d));
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=9222', '--window-size=1280,720',
    '--user-data-dir=/tmp/chrome-seaplane-keys', 'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  chrome.stderr.on('data', () => {});
  try {
    // Wait for the DevTools endpoint and the game server.
    for (let i = 0; i < 30; i++) {
      try {
        await getJson('/json/version');
        const r = await fetch('http://127.0.0.1:' + PORT + '/index.html');
        if (r.ok) break;
      } catch (e) { /* not up yet */ }
      await sleep(500);
    }
    const targets = await getJson('/json/list');
    const page = targets.find((t) => t.type === 'page');
    if (!page) throw new Error('no page target');
    const cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    await cdp.send('Log.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280, height: 720, deviceScaleFactor: 1, mobile: false,
    });

    const external = [];
    const consoleErrors = [];
    for (const s of SHOTS) {
      cdp.events.length = 0;
      const url = 'http://127.0.0.1:' + PORT + '/index.html?shot=' + s.shot;
      await cdp.send('Page.navigate', { url });
      await sleep(1200);
      for (const key of s.keys) {
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: 38 });
      }
      await sleep(2200);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
      const buf = Buffer.from(shot.data, 'base64');
      const outPath = join(here, 'screenshots', s.name + '.jpg');
      writeFileSync(outPath, buf);
      console.log(s.name + '.jpg  ' + buf.length + ' bytes');
      for (const key of s.keys) {
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: 38 });
      }
      for (const ev of cdp.events) {
        if (ev.method === 'Runtime.exceptionThrown') {
          consoleErrors.push(s.name + ': ' + JSON.stringify(ev.params.exceptionDetails).slice(0, 300));
        }
        if (ev.method === 'Runtime.consoleAPICalled' && ev.params.type === 'error') {
          consoleErrors.push(s.name + ': console.error ' + JSON.stringify(ev.params.args).slice(0, 300));
        }
        if (ev.method === 'Network.requestWillBeSent') {
          const u = ev.params.request.url;
          if (!u.startsWith('http://127.0.0.1:' + PORT) && !u.startsWith('data:')) external.push(s.name + ': ' + u);
        }
        if (ev.method === 'Log.entryAdded' && ev.params.entry.level === 'error') {
          consoleErrors.push(s.name + ': log ' + ev.params.entry.text.slice(0, 200));
        }
      }
    }
    console.log('console errors: ' + consoleErrors.length);
    for (const e of consoleErrors) console.log('  ERR ' + e);
    console.log('external requests: ' + external.length);
    for (const e of external) console.log('  EXT ' + e);
    if (consoleErrors.length || external.length) process.exitCode = 1;
  } finally {
    try { execSync('pkill -f "remote-debugging-port=9222"'); } catch (e) {}
    server.kill();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
