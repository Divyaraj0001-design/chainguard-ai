const admin = require('firebase-admin');
const logger = require('../utils/logger');

let db;

function initFirebase() {
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        })
      });
    }
    db = admin.firestore();
    logger.info('✅ Firebase Firestore initialized');
    return db;
  } catch (err) {
    logger.warn('⚠️  Firebase not configured — using in-memory store. Add Firebase credentials to .env');
    return null;
  }
}

function getDb() {
  return db;
}

// In-memory fallback store when Firebase is not configured
const memStore = {
  shipments: new Map(),
  disruptions: new Map(),
  analytics: new Map(),
  alerts: new Map()
};

async function saveToFirestore(collection, docId, data) {
  try {
    if (db) {
      await db.collection(collection).doc(docId).set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    } else {
      memStore[collection]?.set(docId, { ...data, updatedAt: new Date().toISOString() });
    }
    return true;
  } catch (err) {
    logger.error(`Firestore save error [${collection}/${docId}]:`, err);
    memStore[collection]?.set(docId, data);
    return false;
  }
}

async function getFromFirestore(collection, docId) {
  try {
    if (db) {
      const doc = await db.collection(collection).doc(docId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
    return memStore[collection]?.get(docId) || null;
  } catch (err) {
    logger.error(`Firestore get error [${collection}/${docId}]:`, err);
    return memStore[collection]?.get(docId) || null;
  }
}

async function queryFirestore(collection, filters = [], orderBy = null, limit = 100) {
  try {
    if (db) {
      let query = db.collection(collection);
      filters.forEach(f => { query = query.where(f.field, f.op, f.value); });
      if (orderBy) query = query.orderBy(orderBy.field, orderBy.direction || 'desc');
      if (limit) query = query.limit(limit);
      const snap = await query.get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    // In-memory fallback
    let data = Array.from(memStore[collection]?.values() || []);
    if (orderBy) data = data.sort((a, b) => orderBy.direction === 'asc'
      ? String(a[orderBy.field]).localeCompare(String(b[orderBy.field]))
      : String(b[orderBy.field]).localeCompare(String(a[orderBy.field])));
    return data.slice(0, limit);
  } catch (err) {
    logger.error(`Firestore query error [${collection}]:`, err);
    return Array.from(memStore[collection]?.values() || []).slice(0, limit);
  }
}

module.exports = { initFirebase, getDb, saveToFirestore, getFromFirestore, queryFirestore, memStore };
