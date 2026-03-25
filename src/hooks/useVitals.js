import { useMemo, useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS, validateFirestoreDocument } from '../config/firebaseSchema';

const DEFAULT_DEMO_PATIENT_ID = 'patient_demo';
const DEFAULT_LIMIT = 50;

const toNumber = (value, fallback = null) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toTimestampMs = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'number') return value;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeVitalsEntry = (entry = {}) => {
  const timestamp = entry.timestamp || entry.createdAt || entry.updatedAt || entry.recordedAt || entry.ts || null;
  return {
    ...entry,
    heartRate: toNumber(entry.heartRate ?? entry.hr ?? entry.heartRateAvg ?? entry.pulse, null),
    spO2: toNumber(entry.spO2 ?? entry.spo2 ?? entry.spo2Avg ?? entry.oxygen ?? entry.oxygenSaturation, null),
    roomTemperature: toNumber(entry.roomTemperature ?? entry.roomTemp ?? entry.ambientTemperature ?? entry.tempRoom, null),
    roomHumidity: toNumber(entry.roomHumidity ?? entry.humidity ?? entry.relativeHumidity, null),
    bodyTemperature: toNumber(entry.bodyTemperature ?? entry.bodyTemp ?? entry.temperature ?? entry.temperatureAvg ?? entry.bodyTemperatureC, null),
    steps: toNumber(entry.steps ?? entry.stepCount, null),
    battery: toNumber(entry.battery ?? entry.batteryLevel, null),
    timestamp,
    timestampMs: toTimestampMs(timestamp),
    patientId: entry.patientId || null
  };
};

const uniqueIds = (ids) => {
  const seen = new Set();
  const ordered = [];
  ids.forEach((id) => {
    const clean = String(id || '').trim();
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    ordered.push(clean);
  });
  return ordered;
};

const buildCandidateIds = (patientIdOrIds, includeDemoFallback) => {
  const base = Array.isArray(patientIdOrIds) ? patientIdOrIds : [patientIdOrIds];
  const normalized = uniqueIds(base);
  if (includeDemoFallback) {
    return uniqueIds([...normalized, DEFAULT_DEMO_PATIENT_ID]);
  }
  return normalized;
};

const sortByLatest = (rows = []) =>
  [...rows]
    .map(normalizeVitalsEntry)
    .sort((a, b) => b.timestampMs - a.timestampMs);

export function useVitals(
  patientIdOrIds,
  { includeDemoFallback = true, maxRecords = DEFAULT_LIMIT } = {}
) {
  const candidateIds = useMemo(
    () => buildCandidateIds(patientIdOrIds, includeDemoFallback),
    [patientIdOrIds, includeDemoFallback]
  );
  const candidateKey = candidateIds.join('|');

  const [vitals, setVitals] = useState([]);
  const [latestVitals, setLatestVitals] = useState(null);
  const [sourcePatientId, setSourcePatientId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (candidateIds.length === 0) {
      setVitals([]);
      setLatestVitals(null);
      setSourcePatientId(null);
      setLoading(false);
      return;
    }

    const bucketByPatient = {};
    const unsubscribers = [];
    let isMounted = true;
    let pendingSnapshots = candidateIds.length * 2;
    const readyListeners = new Set();

    const applyBestPatient = () => {
      if (!isMounted) return;

      const bestCandidate =
        candidateIds.find((id) => (bucketByPatient[id] || []).length > 0) || candidateIds[0] || null;
      const series = bestCandidate ? sortByLatest(bucketByPatient[bestCandidate] || []) : [];

      setSourcePatientId(bestCandidate);
      setVitals(series.slice(0, maxRecords));
      setLatestVitals(series[0] || null);
    };

    const onSnapshotReady = (listenerKey) => {
      if (readyListeners.has(listenerKey)) return;
      readyListeners.add(listenerKey);
      pendingSnapshots -= 1;
      if (pendingSnapshots <= 0) {
        setLoading(false);
      }
    };

    candidateIds.forEach((patientId) => {
      const localStore = { subcollection: [], rootCollection: [] };
      bucketByPatient[patientId] = [];

      const mergePatientRows = () => {
        bucketByPatient[patientId] = [...localStore.subcollection, ...localStore.rootCollection];
        applyBestPatient();
      };

      // Preferred source: patients/{patientId}/liveVitals
      const liveVitalsQuery = query(
        collection(db, COLLECTIONS.patients, patientId, 'liveVitals')
      );
      unsubscribers.push(
        onSnapshot(
          liveVitalsQuery,
          (snapshot) => {
            localStore.subcollection = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              patientId,
              ...docSnap.data()
            }));
            mergePatientRows();
            onSnapshotReady(`${patientId}:live`);
          },
          (error) => {
            console.warn(`[Vitals] liveVitals listener failed for ${patientId}:`, error.message);
            localStore.subcollection = [];
            mergePatientRows();
            onSnapshotReady(`${patientId}:live`);
          }
        )
      );

      // Compatibility source: top-level vitals filtered by patientId
      const legacyVitalsQuery = query(
        collection(db, COLLECTIONS.vitals),
        where('patientId', '==', patientId)
      );
      unsubscribers.push(
        onSnapshot(
          legacyVitalsQuery,
          (snapshot) => {
            localStore.rootCollection = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data()
            }));
            mergePatientRows();
            onSnapshotReady(`${patientId}:legacy`);
          },
          (error) => {
            console.warn(`[Vitals] top-level vitals listener failed for ${patientId}:`, error.message);
            localStore.rootCollection = [];
            mergePatientRows();
            onSnapshotReady(`${patientId}:legacy`);
          }
        )
      );
    });

    return () => {
      isMounted = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [candidateKey, maxRecords]);

  const addVitalsManually = async (data) => {
    const targetPatientId = sourcePatientId || candidateIds[0];
    if (!targetPatientId) return;

    const vitalsDoc = {
      patientId: targetPatientId,
      ...data,
      source: 'manual',
      timestamp: serverTimestamp()
    };

    // Keep schema validation for legacy top-level write path.
    validateFirestoreDocument('vitals', vitalsDoc);
    await addDoc(collection(db, COLLECTIONS.vitals), vitalsDoc);
  };

  return {
    vitals,
    latestVitals,
    sourcePatientId,
    loading,
    addVitalsManually
  };
}
