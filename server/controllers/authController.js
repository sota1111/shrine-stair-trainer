import { ALLOWED_USER_EMAILS, FIREBASE_API_KEY } from '../config/env.js';
import { signSession, buildSessionCookie } from '../config/session.js';

const IDENTITY_TOOLKIT_SIGN_IN_URL =
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';

const allowedEmails = ALLOWED_USER_EMAILS
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter((e) => e);

// POST /api/auth/login
// Verifies email/password server-side via Firebase Identity Toolkit REST and,
// on success, issues an HMAC-signed HttpOnly session cookie. The password is
// never logged and the browser never talks to Firebase directly.
export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'メールアドレスとパスワードを入力してください' });
  }

  if (!FIREBASE_API_KEY) {
    console.error('FIREBASE_WEB_API_KEY / FIREBASE_API_KEY is not configured.');
    return res.status(500).json({ error: '認証に失敗しました' });
  }

  let verifiedEmail;
  let uid;
  try {
    const response = await fetch(`${IDENTITY_TOOLKIT_SIGN_IN_URL}?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const code = data?.error?.message ?? '';
      if (code.startsWith('TOO_MANY_ATTEMPTS_TRY_LATER')) {
        return res
          .status(429)
          .json({ error: 'ログイン試行が多すぎます。しばらく待ってから再試行してください' });
      }
      if (
        code === 'EMAIL_NOT_FOUND' ||
        code === 'INVALID_PASSWORD' ||
        code.startsWith('INVALID_LOGIN_CREDENTIALS')
      ) {
        return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
      }
      // Do not log the raw Identity Toolkit response (may include sensitive detail).
      console.error('Login verification failed with Identity Toolkit error.');
      return res.status(401).json({ error: '認証に失敗しました' });
    }

    verifiedEmail = (data?.email ?? '').toLowerCase();
    uid = data?.localId;
  } catch (error) {
    console.error('Error contacting Identity Toolkit:', error?.message || 'unknown error');
    return res.status(401).json({ error: '認証に失敗しました' });
  }

  if (!uid) {
    return res.status(401).json({ error: '認証に失敗しました' });
  }

  if (allowedEmails.length === 0) {
    console.warn('ALLOWED_USER_EMAILS is not set. Access denied.');
    return res.status(403).json({ error: 'アクセスが許可されていません' });
  }
  if (!verifiedEmail || !allowedEmails.includes(verifiedEmail)) {
    return res.status(403).json({ error: 'このメールアドレスは許可されていません' });
  }

  const cookieValue = signSession({ uid, email: verifiedEmail });
  res.setHeader('Set-Cookie', buildSessionCookie(cookieValue));
  return res.json({ success: true, email: verifiedEmail });
};

// POST /api/auth/logout — clears the session cookie.
export const logout = async (req, res) => {
  res.setHeader('Set-Cookie', buildSessionCookie('', { clear: true }));
  return res.json({ success: true });
};

// GET /api/auth/me — runs behind requireAuth; reports the current session.
export const me = async (req, res) => {
  return res.json({ authenticated: true, uid: req.uid, email: req.email });
};
