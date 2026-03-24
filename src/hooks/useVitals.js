import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS, validateFirestoreDocument } from '../config/firebaseSchema';

export function useVitals(patientId) {
  const [vitals, setVitals] = useState([]);
  const [latestVitals, setLatestVitals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;

    // Latest Vitls (Timeline view for Dashboards)
    const q = query(
      collection(db, COLLECTIONS.vitals),
      where('patientId', '==', patientId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVitals(docs);
      setLatestVitals(docs[0] || null);
      setLoading(false);
    }, (error) => {
      console.warn("Vitals Fetch Failed (Database may be missing / default mode issue):", error.message);
      setVitals([]);
      setLoading(false);
    });

    return unsubscribe;
  }, [patientId]);

  const addVitalsManually = async (data) => {
    if (!patientId) return;
    const vitalsRef = collection(db, COLLECTIONS.vitals);
    const vitalsDoc = {
      patientId,
      ...data,
      source: 'manual',
      timestamp: serverTimestamp()
    };
    validateFirestoreDocument('vitals', vitalsDoc);
    await addDoc(vitalsRef, vitalsDoc);
  };

  return { vitals, latestVitals, loading, addVitalsManually };
}
