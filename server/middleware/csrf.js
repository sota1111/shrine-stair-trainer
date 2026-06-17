// CSRF protection for state-changing API requests.
// Cookies use SameSite=Lax, but as defence in depth we also require that
// mutating /api requests originate from the same origin (Origin header, with
// a Referer fallback). Behind Cloud Run we trust x-forwarded-* to rebuild
// the request's own origin.
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function requestOrigin(req) {
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https')
    .split(',')[0]
    .trim();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!host) return null;
  return `${proto}://${host}`;
}

export const csrfProtection = (req, res, next) => {
  if (!req.path.startsWith('/api/') || !MUTATING_METHODS.has(req.method)) {
    return next();
  }

  let sourceOrigin = req.headers.origin || null;
  if (!sourceOrigin && req.headers.referer) {
    try {
      sourceOrigin = new URL(req.headers.referer).origin;
    } catch {
      sourceOrigin = null;
    }
  }

  const target = requestOrigin(req);
  if (!sourceOrigin || !target || sourceOrigin !== target) {
    return res.status(403).json({ error: 'CSRF validation failed' });
  }

  return next();
};
