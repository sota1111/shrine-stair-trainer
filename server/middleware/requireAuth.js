import { SESSION_COOKIE_NAME, parseCookies, verifySession } from '../config/session.js';

// Authenticate a request from the HMAC-signed server session cookie.
// The signed payload carries the Firebase uid, so per-user Firestore scoping
// (req.uid) keeps working without re-verifying a Firebase ID token. The legacy
// `Authorization: Bearer <idToken>` path has been removed.
export const requireAuth = (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = verifySession(cookies[SESSION_COOKIE_NAME]);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.uid = session.uid;
  req.email = session.email;
  next();
};
