import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 8080;
export const ALLOWED_USER_EMAILS = process.env.ALLOWED_USER_EMAILS || '';

// Server-side Firebase Web API key used for Identity Toolkit REST sign-in.
// The browser never receives or uses this for login.
// FIREBASE_WEB_API_KEY is preferred; falls back to FIREBASE_API_KEY (either works).
export const FIREBASE_API_KEY =
  process.env.FIREBASE_WEB_API_KEY || process.env.FIREBASE_API_KEY || '';

// Secret used to HMAC-sign the server session cookie.
export const AUTH_SECRET = process.env.AUTH_SECRET || '';

// Startup auth-config check: log each missing auth setting distinctly so that
// misconfiguration is visible in Cloud Run logs at boot time.
export function checkAuthConfig() {
  let missing = false;
  if (!FIREBASE_API_KEY) {
    console.warn('FIREBASE_WEB_API_KEY / FIREBASE_API_KEY not configured');
    missing = true;
  }
  if (!AUTH_SECRET) {
    console.warn('AUTH_SECRET not configured');
    missing = true;
  }
  if (!ALLOWED_USER_EMAILS) {
    console.warn('ALLOWED_USER_EMAILS not configured');
    missing = true;
  }
  if (!missing) {
    console.log('auth config OK');
  }
}
