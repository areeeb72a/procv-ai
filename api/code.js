// One-time code system using Vercel KV (free tier)
// Setup: vercel.com -> Storage -> Create KV Database -> Connect to project

import { kv } from '@vercel/kv';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code; // e.g. RIZW-A3KP
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, code, adminKey } = req.body || {};

  // ── GENERATE (Admin only) ──
  if (action === 'generate') {
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const newCode = generateCode();
    // Store code with 7-day expiry, used=false
    await kv.set(`code:${newCode}`, { used: false, createdAt: Date.now() }, { ex: 60 * 60 * 24 * 7 });
    return res.status(200).json({ code: newCode });
  }

  // ── VERIFY (Customer) ──
  if (action === 'verify') {
    if (!code) return res.status(400).json({ valid: false, error: 'No code provided' });
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const data = await kv.get(`code:${cleanCode}`);
    if (!data) return res.status(200).json({ valid: false, error: 'Invalid code' });
    if (data.used) return res.status(200).json({ valid: false, error: 'Code already used' });
    // Mark as used
    await kv.set(`code:${cleanCode}`, { ...data, used: true, usedAt: Date.now() }, { ex: 60 * 60 * 24 * 7 });
    return res.status(200).json({ valid: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
