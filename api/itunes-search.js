/**
 * 同源代理 iTunes Search，避免手机端直连 itunes.apple.com 被拦截或报 Load failed。
 */
function badRequest(res, msg) {
  res.status(400).json({ error: msg || 'bad request' });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const term = typeof req.query.term === 'string' ? req.query.term.trim() : '';
  if (!term || term.length > 120) {
    return badRequest(res, 'invalid term');
  }
  const upstream =
    'https://itunes.apple.com/search?term=' +
    encodeURIComponent(term) +
    '&media=music&entity=song&limit=50';
  try {
    const r = await fetch(upstream, {
      headers: { Accept: 'application/json' },
    });
    const text = await r.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, max-age=120');
    res.status(r.status).send(text);
  } catch (e) {
    res.status(502).json({
      error: e && e.message ? e.message : 'upstream fetch failed',
    });
  }
};
