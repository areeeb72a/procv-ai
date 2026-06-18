// One-time code system using Upstash Redis
// Uses KV_REST_API_URL and KV_REST_API_TOKEN (auto-set by Vercel Upstash integration)

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code; // e.g. RIZW-A3KP
}

async function redis(command, ...args) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Redis not configured');

  const res = await fetch(`${url}/${command}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { action, code, adminKey } = req.body || {};

    // ── GENERATE (Admin only) ──
    if (action === 'generate') {
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const newCode = generateCode();
      // Store with 7-day expiry
      await redis('SET', `code:${newCode}`, 'unused', 'EX', '604800');
      return res.status(200).json({ code: newCode });
    }

    // ── VERIFY (Customer) ──
    if (action === 'verify') {
      if (!code) return res.status(400).json({ valid: false, error: 'No code provided' });
      const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const val = await redis('GET', `code:${cleanCode}`);

      if (!val) return res.status(200).json({ valid: false, error: 'Invalid code' });
      if (val === 'used') return res.status(200).json({ valid: false, error: 'Code already used' });

      // Mark as used
      await redis('SET', `code:${cleanCode}`, 'used', 'EX', '604800');
      return res.status(200).json({ valid: true });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
