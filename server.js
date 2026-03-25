const http = require('http');

// ── CONFIG ──────────────────────────────
const MAX_SLOTS = 3;
const PORT = process.env.PORT || 3000;

// In-memory store (resets on server restart)
// For persistence across restarts, swap with a file or DB
let claimedCount = 0;
const claimedIPs = new Set();

// ── HELPERS ─────────────────────────────
function getIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
  // Normalize IPv6 loopback
  return ip === '::1' ? '127.0.0.1' : ip;
}

function json(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

// ── SERVER ──────────────────────────────
const server = http.createServer((req, res) => {
  const ip = getIP(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // GET /status — check current state for this IP
  if (req.method === 'GET' && req.url === '/status') {
    return json(res, 200, {
      claimed: claimedCount,
      max: MAX_SLOTS,
      full: claimedCount >= MAX_SLOTS,
      alreadyClaimed: claimedIPs.has(ip),
    });
  }

  // POST /claim — attempt to claim a slot
  if (req.method === 'POST' && req.url === '/claim') {
    // Already claimed from this IP
    if (claimedIPs.has(ip)) {
      return json(res, 200, { ok: false, reason: 'already_claimed', claimed: claimedCount });
    }

    // All slots taken
    if (claimedCount >= MAX_SLOTS) {
      return json(res, 200, { ok: false, reason: 'full', claimed: claimedCount });
    }

    // Grant the slot
    claimedCount++;
    claimedIPs.add(ip);
    console.log(`[CLAIM] IP: ${ip} | Slot: ${claimedCount}/${MAX_SLOTS}`);

    return json(res, 200, { ok: true, claimed: claimedCount, slot: claimedCount });
  }

  // 404
  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
  console.log(`[CONFIG] Max slots: ${MAX_SLOTS}`);
});
