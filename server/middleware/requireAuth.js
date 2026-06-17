import { auth } from '../config/firebase.js';
import { ALLOWED_USER_EMAILS } from '../config/env.js';

const allowedEmails = ALLOWED_USER_EMAILS
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(e => e);

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const email = decodedToken.email?.toLowerCase();
    
    if (allowedEmails.length === 0) {
      console.warn('ALLOWED_USER_EMAILS is not set. All access denied.');
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    if (!email || !allowedEmails.includes(email)) {
      console.log(`Access denied for email: ${email}`);
      return res.status(403).json({ error: 'Forbidden: Email not allowed' });
    }

    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
