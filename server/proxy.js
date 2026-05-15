import express from 'express';

const app = express();
const PORT = 3001;
const KEY = process.env.TWELVEDATA_KEY;
const UPSTREAM = 'https://api.twelvedata.com';

if (!KEY) {
  console.error('[proxy] TWELVEDATA_KEY env var is missing.');
  console.error('       Use scripts/start-proxy.sh (loads from macOS keychain),');
  console.error('       or run: TWELVEDATA_KEY=xxx node server/proxy.js');
  process.exit(1);
}

// Forward /api/td/<path>?... → https://api.twelvedata.com/<path>?...&apikey=KEY
// Key never reaches the browser; client only sees /api/td/* requests.
app.use('/api/td', async (req, res) => {
  try {
    const upstream = new URL(UPSTREAM + req.path);
    for (const [k, v] of Object.entries(req.query)) upstream.searchParams.set(k, v);
    upstream.searchParams.set('apikey', KEY);

    const r = await fetch(upstream.toString(), {
      headers: { Accept: 'application/json' },
    });
    const text = await r.text();
    res
      .status(r.status)
      .type(r.headers.get('content-type') ?? 'application/json')
      .send(text);
  } catch (err) {
    res.status(502).json({ error: err.message ?? String(err) });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true, keyLoaded: !!KEY }));

app.listen(PORT, () => {
  console.log(`[proxy] Twelve Data proxy on http://localhost:${PORT} (key loaded)`);
});
