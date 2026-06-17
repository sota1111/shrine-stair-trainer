import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 8080;
export const ALLOWED_USER_EMAILS = process.env.ALLOWED_USER_EMAILS || '';

// Server-side Firebase Web API key used for Identity Toolkit REST sign-in.
// The browser never receives or uses this for login.
export const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || '';

// Secret used to HMAC-sign the server session cookie.
export const AUTH_SECRET = process.env.AUTH_SECRET || '';
