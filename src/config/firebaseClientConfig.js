const firebaseClientConfig = Object.freeze({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? ''
});

const REQUIRED_CONFIG_KEYS = Object.freeze([
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
]);

export const getFirebaseClientConfig = () => {
  const missingKeys = REQUIRED_CONFIG_KEYS.filter((key) => !firebaseClientConfig[key]);

  if (missingKeys.length > 0) {
    throw new Error(
      `[firebase-config] Missing frontend Firebase keys: ${missingKeys.join(', ')}. ` +
        'Add VITE_FIREBASE_* variables in the frontend .env file.'
    );
  }

  return firebaseClientConfig;
};

export default firebaseClientConfig;
