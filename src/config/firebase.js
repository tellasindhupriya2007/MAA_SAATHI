import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirebaseClientConfig } from './firebaseClientConfig';

const app = initializeApp(getFirebaseClientConfig());

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

// Initialize analytics only if supported
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);
export default app;
