import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../config/firebaseSchema';

/**
 * Hook to fetch reports from Firestore
 * @param {string} type - 'patient' or 'doctor'
 * @param {string} id - The UID or email to match
 */
export const useReports = (type, id) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setReports([]);
      setLoading(false);
      return;
    }

    const reportsRef = collection(db, COLLECTIONS.reports);
    let q;

    const normalizedId = typeof id === 'string' && id.includes('@') ? id.toLowerCase().trim() : id;

    if (type === 'doctor' && typeof normalizedId === 'string' && normalizedId.includes('@')) {
      q = query(
        reportsRef,
        where('doctorEmail', '==', normalizedId),
        orderBy('createdAt', 'desc')
      );
    } else if (type === 'doctor') {
      q = query(
        reportsRef,
        where('doctorId', '==', normalizedId),
        orderBy('createdAt', 'desc')
      );
    } else { // type === 'patient'
      q = query(
        reportsRef,
        where('patientId', '==', normalizedId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(data);
      setLoading(false);
    }, (error) => {
      console.error("[useReports] Error fetching reports:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [type, id]);

  return { reports, loading };
};
