import fs    from 'fs';
import admin from 'firebase-admin';

export function initFirebase() {
  try {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      console.log('✅ Firebase: loaded credentials from env var');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // ── Local dev: read from file ──
      serviceAccount = JSON.parse(
        fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
      );
      console.log('✅ Firebase: loaded credentials from file');
    } else {
      throw new Error(
        'Set FIREBASE_SERVICE_ACCOUNT_JSON (production) or FIREBASE_SERVICE_ACCOUNT_PATH (local dev)'
      );
    }

    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('✅ Firebase Admin initialised');
  } catch (err) {
    console.error('❌ Firebase Admin failed:', err.message);
    process.exit(1);
  }
}

export { admin };
