import { db } from '../config/firebase.js';

// API: Get all records for the authenticated user
export const getRecords = async (req, res) => {
  const recordsRef = db.collection('users').doc(req.uid).collection('records');
  const snapshot = await recordsRef.orderBy('createdAt', 'desc').get();
  const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(records);
};

// API: Upsert a record
export const upsertRecord = async (req, res) => {
  const { id } = req.params;
  const record = req.body;
  const docRef = db.collection('users').doc(req.uid).collection('records').doc(id);
  await docRef.set(record, { merge: true });
  res.json({ success: true });
};

// API: Batch upsert records
export const batchUpsertRecords = async (req, res) => {
  const records = req.body;
  if (!Array.isArray(records)) {
    const error = new Error('Invalid body: expected array');
    error.statusCode = 400;
    throw error;
  }
  
  const batch = db.batch();
  const userRecordsRef = db.collection('users').doc(req.uid).collection('records');
  records.forEach(record => {
    const docRef = userRecordsRef.doc(record.id);
    batch.set(docRef, record, { merge: true });
  });
  await batch.commit();
  res.json({ success: true });
};

// API: Delete a record
export const deleteRecord = async (req, res) => {
  const { id } = req.params;
  const docRef = db.collection('users').doc(req.uid).collection('records').doc(id);
  await docRef.delete();
  res.json({ success: true });
};
