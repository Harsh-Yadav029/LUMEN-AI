import admin from 'firebase-admin';

export function initFirebase() {
  try {
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('Firebase ENV variables not set');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });

    console.log('✅ Firebase Admin initialised');
  } catch (err) {
    console.error('❌ Firebase Admin failed to initialise:', err.message);
    process.exit(1);
  }
}

export { admin };