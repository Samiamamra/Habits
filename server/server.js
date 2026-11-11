// TaskHabit server: accounts + sync API, and serves the web version from ../www.
// Storage: MongoDB when MONGODB_URI is set (recommended for real hosting — free
// forever on MongoDB Atlas's M0 tier, and survives restarts/redeploys). Falls
// back to local JSON files in server/data when MONGODB_URI is absent, which is
// fine for trying the server on your own machine but NOT for free hosts whose
// disk is wiped on redeploy/restart (e.g. Render's free tier).
//
// Run:  MONGODB_URI="..." node server/server.js     (PORT, SECRET optional)
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const WWW = path.join(__dirname, '..', 'www');
fs.mkdirSync(DIR, { recursive: true });

const F = n => path.join(DIR, n);
const rdFile = (n, d) => { try { return JSON.parse(fs.readFileSync(F(n), 'utf8')); } catch { return d; } };
const wrFile = (n, v) => { fs.writeFileSync(F(n) + '.tmp', JSON.stringify(v)); fs.renameSync(F(n) + '.tmp', F(n)); };

let SECRET = process.env.SECRET;
if (!SECRET) {
  try { SECRET = fs.readFileSync(F('secret'), 'utf8'); }
  catch { SECRET = crypto.randomBytes(32).toString('hex'); try { fs.writeFileSync(F('secret'), SECRET, { mode: 0o600 }); } catch {} }
}
// On a host with an ephemeral disk, set SECRET yourself as an environment
// variable so login tokens stay valid across restarts/redeploys.

const hmac = s => crypto.createHmac('sha256', SECRET).update(s).digest('hex');
const sign = id => { const b = id + '.' + (Date.now() + 90 * 864e5); return b + '.' + hmac(b); };
const verify = t => {
  const p = String(t || '').split('.');
  if (p.length !== 3) return null;
  const good = hmac(p[0] + '.' + p[1]);
  if (good.length !== p[2].length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(p[2])) || +p[1] < Date.now()) return null;
  return /^[a-f0-9]{32}$/.test(p[0]) ? p[0] : null;
};
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');

// ---------- storage backend ----------
// store.getUser(email) -> {id,salt,hash} | null
// store.putUserIfNew(email, rec) -> true if created, false if email already exists
// store.getData(id) -> {tasks,logs,notes,mood,u,x} | null
// store.putData(id, data) -> void
let store;
async function initStore() {
  if (process.env.MONGODB_URI) {
    require('./diag-mongo').describe(process.env.MONGODB_URI).forEach(l => console.log('DIAG:', l)); // never prints the password
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'taskhabit');
    const Users = db.collection('users'), Data = db.collection('data');
    await Users.createIndex({ email: 1 }, { unique: true });
    store = {
      async getUser(email) { return await Users.findOne({ email }); },
      async putUserIfNew(email, rec) {
        try { await Users.insertOne({ email, ...rec }); return true; }
        catch (e) { if (e.code === 11000) return false; throw e; }
      },
      async getData(id) {
        const d = await Data.findOne({ _id: id });
        return d ? { tasks: d.tasks, logs: d.logs, notes: d.notes, mood: d.mood, u: d.u, x: d.x } : null;
      },
      async putData(id, data) { await Data.updateOne({ _id: id }, { $set: data }, { upsert: true }); },
    };
    console.log('Storage: MongoDB (' + (process.env.MONGODB_DB || 'taskhabit') + ')');
  } else {
    const users = rdFile('users.json', {});
    store = {
      async getUser(email) { return users[email] || null; },
      async putUserIfNew(email, rec) {
        if (users[email]) return false;
        users[email] = rec; wrFile('users.json', users); return true;
      },
      async getData(id) { return rdFile('data-' + id + '.json', null); },
      async putData(id, data) { wrFile('data-' + id + '.json', data); },
    };
    console.log('Storage: local JSON files in ' + DIR + ' — fine for local testing.');
    console.log('For real hosting, set MONGODB_URI so accounts and data survive restarts.');
  }
}

const hits = new Map(); // naive per-IP limiter for login/register
// Behind Render's proxy, req.socket.remoteAddress is the proxy itself, which would
// put ALL users in one shared bucket — so use the client IP from X-Forwarded-For.
const clientIp = req => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
const limited = ip => {
  const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60000);
  a.push(now); hits.set(ip, a);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > 60000) hits.delete(k);
  return a.length > 10;
};

const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
const body = req => new Promise((ok, no) => {
  let b = '', n = 0;
  req.on('data', c => { n += c.length; if (n > 10e6) { no(new Error('big')); req.destroy(); } else b += c; });
  req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch { no(new Error('json')); } });
});
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.css': 'text/css' };

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, 'http://x');

  if (url.pathname === '/healthz') return send(res, 200, { ok: true });

  if (url.pathname.startsWith('/api/')) {
    if (!store) return send(res, 503, { error: 'storage unavailable' });
    try {
      const route = url.pathname.slice(5);
      if (req.method === 'POST' && (route === 'register' || route === 'login')) {
        if (limited(clientIp(req))) return send(res, 429, { error: 'rate' });
        const { email, password } = await body(req);
        const e = String(email || '').trim().toLowerCase();
        const pw = String(password || '');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return send(res, 400, { error: 'bad' });
        if (route === 'register') {
          if (pw.length < 8) return send(res, 400, { error: 'pw' });
          const salt = crypto.randomBytes(16).toString('hex');
          const id = crypto.randomBytes(16).toString('hex');
          const created = await store.putUserIfNew(e, { id, salt, hash: hashPw(pw, salt) });
          if (!created) return send(res, 409, { error: 'exists' });
          return send(res, 200, { token: sign(id), email: e });
        }
        const u = await store.getUser(e);
        const ok = u && crypto.timingSafeEqual(Buffer.from(hashPw(pw, u.salt)), Buffer.from(u.hash));
        return ok ? send(res, 200, { token: sign(u.id), email: e }) : send(res, 401, { error: 'creds' });
      }
      if (route === 'data') {
        const id = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
        if (!id) return send(res, 401, { error: 'auth' });
        if (req.method === 'GET') return send(res, 200, { data: await store.getData(id) });
        if (req.method === 'PUT') {
          const d = await body(req);
          if (!Array.isArray(d.tasks) || typeof d.logs !== 'object') return send(res, 400, { error: 'bad' });
          // keep only the known fields (never let the client write arbitrary keys like _id)
          await store.putData(id, { tasks: d.tasks, logs: d.logs, notes: d.notes || {}, mood: d.mood || {}, u: d.u || {}, x: d.x || {} });
          return send(res, 200, { ok: true });
        }
      }
      return send(res, 404, { error: 'not found' });
    } catch (e) { return send(res, e.message === 'json' || e.message === 'big' ? 400 : 500, { error: e.message }); }
  }

  // static files (web version)
  let p = path.normalize(path.join(WWW, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname)));
  if (!p.startsWith(WWW)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, () => {});

// Keep the server up (so the site isn't a 502) and retry; API calls answer 503 until storage is ready.
(function boot() {
  initStore().then(() => console.log('TaskHabit running on http://localhost:' + PORT))
    .catch(e => { console.error('Failed to initialize storage:', e.message, '— retrying in 30s'); setTimeout(boot, 30000); });
})();
