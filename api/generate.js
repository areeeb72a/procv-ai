export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured on server' });

  // ── ABUSE PREVENTION ──
  // Only allow this specific app's model and cap token usage.
  // This endpoint is public-facing, so we never trust the caller's values directly.
  const ALLOWED_MODEL = 'claude-sonnet-4-6';
  const MAX_ALLOWED_TOKENS = 3000;

  const body = req.body || {};
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request: messages required' });
  }
  if (body.messages.length > 1) {
    return res.status(400).json({ error: 'Invalid request: only single-turn requests allowed' });
  }

  const safeBody = {
    model: ALLOWED_MODEL,
    max_tokens: Math.min(Number(body.max_tokens) || 1500, MAX_ALLOWED_TOKENS),
    messages: body.messages
  };
  if (body.system && typeof body.system === 'string') {
    safeBody.system = body.system.slice(0, 3000); // cap system prompt length too
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(safeBody)
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
