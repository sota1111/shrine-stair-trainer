import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin with ADC
initializeApp({
  credential: applicationDefault(),
});

const auth = getAuth();
const db = getFirestore();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Middleware: Require Authentication and Email Verification
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const email = decodedToken.email?.toLowerCase();
    
    const allowedEmailsStr = process.env.ALLOWED_USER_EMAILS || '';
    if (!allowedEmailsStr) {
      console.warn('ALLOWED_USER_EMAILS is not set. All access denied.');
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    const allowedEmails = allowedEmailsStr.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
    
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

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// API: Get all records for the authenticated user
app.get('/api/records', requireAuth, async (req, res) => {
  try {
    const recordsRef = db.collection('users').doc(req.uid).collection('records');
    const snapshot = await recordsRef.orderBy('createdAt', 'desc').get();
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API: Upsert a record
app.put('/api/records/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const record = req.body;
  try {
    const docRef = db.collection('users').doc(req.uid).collection('records').doc(id);
    await docRef.set(record, { merge: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Error upserting record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API: Batch upsert records
app.post('/api/records/batch', requireAuth, async (req, res) => {
  const records = req.body;
  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'Invalid body: expected array' });
  }
  try {
    const batch = db.batch();
    const userRecordsRef = db.collection('users').doc(req.uid).collection('records');
    records.forEach(record => {
      const docRef = userRecordsRef.doc(record.id);
      batch.set(docRef, record, { merge: true });
    });
    await batch.commit();
    res.json({ success: true });
  } catch (error) {
    console.error('Error batch upserting records:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API: Delete a record
app.delete('/api/records/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const docRef = db.collection('users').doc(req.uid).collection('records').doc(id);
    await docRef.delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Static files and SPA fallback
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path === '/healthz') {
    return res.status(404).json({ error: 'Not Found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
