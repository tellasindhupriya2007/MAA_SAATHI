import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { COLLECTIONS, validateFirestoreDocument } from '../config/firebaseSchema';

export function useSurveys(patientId = null, ashaWorkerId = null) {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, COLLECTIONS.surveys));

    // Filter by patient for history view
    if (patientId) {
      q = query(
        collection(db, COLLECTIONS.surveys),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
    }

    // Filter by ASHA for worker dashboard
    if (ashaWorkerId) {
      q = query(
        collection(db, COLLECTIONS.surveys),
        where('ashaWorkerId', '==', ashaWorkerId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSurveys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.warn("Survey Fetch Failed (Backend not initialized):", error.message);
      setSurveys([]);
      setLoading(false);
    });

    return unsubscribe;
  }, [patientId, ashaWorkerId]);

  const submitSurvey = async (data) => {
    const surveyRef = doc(collection(db, COLLECTIONS.surveys));
    const surveyDoc = {
      id: surveyRef.id,
      ...data,
      sentToDoctor: data.aiStatus === 'moderate' || data.aiStatus === 'critical',
      createdAt: serverTimestamp()
    };
    validateFirestoreDocument('surveys', surveyDoc);
    await setDoc(surveyRef, surveyDoc);

    // Update risk score on the patient metadata automatically
    if (data.patientId && data.riskScore) {
       const patientRef = doc(db, COLLECTIONS.patients, data.patientId);
       const patientSnap = await getDoc(patientRef);
       if (patientSnap.exists()) {
           const patientPatch = {
               riskScore: data.riskScore,
               riskLevel: data.riskScore > 75 ? 'CRITICAL' : data.riskScore > 40 ? 'MODERATE' : 'LOW',
               lastVisitDate: serverTimestamp()
           };
           validateFirestoreDocument('patients', patientPatch, { partial: true });
           await setDoc(patientRef, patientPatch, { merge: true });
       }
    }

    return surveyRef.id;
  };

  return { surveys, loading, submitSurvey };
}
