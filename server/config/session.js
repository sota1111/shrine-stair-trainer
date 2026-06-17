import { createHmac, timingSafeEqual } from 'crypto';
import { AUTH_SECRET } from './env.js';

export const SESSION_COOKIE_NAME = 'session';

// Session lifetime in seconds (7 days).
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

function base64urlEncode(input) {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64urlDecode(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function hmacHex(payloadB64) {
  return createHmac('sha256', AUTH_SECRET).update(payloadB64).digest('hex');
}

// Sign a session payload into a cookie value: `<base64url(json)>.<hmac-hex>`.
// The signed payload embeds the Firebase uid so per-user Firestore scoping
// (db.collection('users').doc(req.uid)) keeps working without re-verifying an id token.
export function signSession({ uid, email }) {
  const payload = { uid, email, iat: Math.floor(Date.now() / 1000) };
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const signature = hmacHex(payloadB64);
  return `${payloadB64}.${signature}`;
}

// Verify a cookie value and return the parsed payload, or null if invalid/malformed.
// Never throws.
export function verifySession(cookieValue) {
  if (typeof cookieValue !== 'string' || !cookieValue) return null;
  const dot = cookieValue.lastIndexOf('.');
  if (dot <= 0 || dot === cookieValue.length - 1) return null;

  const payloadB64 = cookieValue.slice(0, dot);
  const signature = cookieValue.slice(dot + 1);
  if (!/^[0-9a-f]+$/i.test(signature)) return null;

  const expected = hmacHex(payloadB64);
  if (signature.length !== expected.length) return null;

  let match = false;
  try {
    match = timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return null;
  }
  if (!match) return null;

  try {
    const parsed = JSON.parse(base64urlDecode(payloadB64));
    if (!parsed || typeof parsed.uid !== 'string' || !parsed.uid) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Parse a Cookie header string into a { name: value } map.
export function parseCookies(header) {
  const out = {};
  if (typeof header !== 'string' || !header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    if (!name) continue;
    out[name] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

// Build a Set-Cookie header value for the session cookie.
// When `value` is empty the cookie is cleared (Max-Age=0).
export function buildSessionCookie(value, { clear = false } = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  const attrs = [
    `${SESSION_COOKIE_NAME}=${value}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${clear ? 0 : SESSION_MAX_AGE}`,
  ];
  if (isProduction) attrs.push('Secure');
  return attrs.join('; ');
}
