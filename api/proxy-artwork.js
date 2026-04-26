/**
 * 同源代理专辑封面，避免跨域/CORS 在部分移动浏览器上导致 canvas 读像素失败或图片 onerror。
 */
function isAllowedArtworkUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch (_) {
    return false;
  }
  if (u.protocol !== 'https:') return false;
  const h = u.hostname.toLowerCase();
  return h === 'mzstatic.com' || h.endsWith('.mzstatic.com');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('method not allowed');
  }
  const raw = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  if (!raw || raw.length > 2048 || !isAllowedArtworkUrl(raw)) {
    return res.status(400).send('bad url');
  }
  try {
    const r = await fetch(raw, {
      headers: { Accept: 'image/*,*/*' },
    });
    if (!r.ok) {
      return res.status(r.status).send('upstream ' + r.status);
    }
    let ct = r.headers.get('content-type') || '';
    ct = ct.split(';')[0].trim().toLowerCase();
    if (!ct || ct === 'application/octet-stream') {
      ct = /\.png(\?|$)/i.test(raw) ? 'image/png' : 'image/jpeg';
    } else if (!/^image\//i.test(ct)) {
      return res.status(502).send('not an image');
    }
    const ab = await r.arrayBuffer();
    res.setHeader('Content-Type', ct.split(';')[0].trim());
    res.setHeader('Cache-Control', 'public, s-maxage=86400, max-age=86400');
    res.status(200).send(Buffer.from(ab));
  } catch (e) {
    res.status(502).send(e && e.message ? e.message : 'fetch failed');
  }
};
