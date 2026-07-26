const admin = require('firebase-admin');

let firebaseApp;

try {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  console.log('✅ Firebase initialized');
} catch (error) {
  console.warn('⚠️  Firebase init skipped:', error.message);
}

module.exports = { admin, firebaseApp };
