import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validar configuración
if (!firebaseConfig.apiKey) {
  throw new Error('NEXT_PUBLIC_FIREBASE_API_KEY no está configurada');
}
if (!firebaseConfig.authDomain) {
  throw new Error('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN no está configurada');
}
if (!firebaseConfig.projectId) {
  throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID no está configurada');
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { app, auth };
