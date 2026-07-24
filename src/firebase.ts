import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

const config = firebaseConfig as any;

let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
  }, config.firestoreDatabaseId);
} catch (e) {
  console.warn("Failed to initialize Firestore with persistent local cache. Falling back to default getFirestore.", e);
  dbInstance = getFirestore(app, config.firestoreDatabaseId);
}

export const db = dbInstance;
export const auth = getAuth(app);

