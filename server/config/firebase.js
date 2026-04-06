import fs from 'fs';
import admin from 'firebase-admin';

export function initFirebase() {
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!serviceAccountPath) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is not set in .env');
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('✅ Firebase Admin initialised');
  } catch (err) {
    console.error('❌ Firebase Admin failed to initialise:', err.message);
    console.error('   Make sure FIREBASE_SERVICE_ACCOUNT_PATH points to your serviceAccount.json');
    console.error('   That file must NOT be committed to git — keep it in .gitignore');
    process.exit(1);
  }
}

export { admin };
