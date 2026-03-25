import React, { createContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const AppContext = createContext();

const toInitials = (name = 'UN') =>
  String(name)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const buildLocation = (house = '', village = '') => {
  const h = String(house || '').trim();
  const v = String(village || '').trim();
  if (!h && !v) return '';
  if (!h) return v;
  return `${h}${v ? `, ${v}` : ''}`;
};

const normalizeRisk = (risk = 'LOW') => {
  const r = String(risk || '').toUpperCase();
  if (r === 'HIGH' || r === 'MED' || r === 'LOW') return r;
  return 'LOW';
};

const deriveRiskScore = (risk = 'LOW') => {
  if (risk === 'HIGH') return 78;
  if (risk === 'MED') return 55;
  return 26;
};

const deriveRiskFactors = (risk = 'LOW', type = 'pregnant') => {
  if (risk === 'HIGH') {
    if (type === 'pregnant') {
      return [
        'Needs close monitoring',
        'Potential antenatal complications'
      ];
    }
    if (type === 'newMother') {
      return [
        'Needs close monitoring',
        'Postnatal follow-up pending'
      ];
    }
    return [
      'Needs close monitoring',
      'Doctor review recommended'
    ];
  }
  if (risk === 'MED') return ['Monitor weekly', 'Lifestyle and nutrition review'];
  return ['Stable vitals', 'Routine follow-up'];
};

const PATIENTS_STORAGE_KEY = 'maasathi-shared-patients-v1';

const DEFAULT_PATIENTS = [
  { id: 'p1', name: 'Suhana Khatun',  type: 'pregnant',   house: 'House 42', village: 'Ramgarh', location: 'House 42, Ramgarh',  date: 'Visited today',        risk: 'HIGH', initials: 'SK', age: 24, phone: '9876543210', husband: 'Rahim Ali',     weeks: 32 },
  { id: 'p2', name: 'Priya Patel',    type: 'pregnant',   house: 'House 18', village: 'Ramgarh', location: 'House 18, Ramgarh',  date: 'Visited 5 days ago',   risk: 'MED',  initials: 'PP', age: 26, phone: '9876543211', husband: 'Raj Patel',     weeks: 24 },
  { id: 'p3', name: 'Anjali Devi',    type: 'newMother',  house: 'House 90', village: 'Ramgarh', location: 'House 90, Ramgarh',  date: 'Visited 1 week ago',   risk: 'LOW',  initials: 'AD', age: 22, phone: '9876543212', husband: 'Rahul Devi',    weeks: 0  },
  { id: 'p4', name: 'Ritu Sharma',    type: 'newMother',  house: 'House 11', village: 'Ramgarh', location: 'House 11, Ramgarh',  date: 'Visited 3 days ago',   risk: 'LOW',  initials: 'RS', age: 29, phone: '9876543213', husband: 'Vikram Sharma', weeks: 0  },
  { id: 'p5', name: 'Kavita Singh',   type: 'pregnant',   house: 'House 04', village: 'Ramgarh', location: 'House 04, Ramgarh',  date: 'Visited 2 weeks ago',  risk: 'HIGH', initials: 'KS', age: 27, phone: '9876543214', husband: 'Amit Singh',    weeks: 36 }
];

const formatPatientRecord = (incoming = {}, previous = {}) => {
  const merged = { ...previous, ...incoming };
  const allowedTypes = ['pregnant', 'newMother', 'elderly', 'wellness', 'patient'];
  const safeType = allowedTypes.includes(merged.type)
    ? merged.type
    : (allowedTypes.includes(previous.type) ? previous.type : 'pregnant');
  const name = String(merged.name || previous.name || 'Unknown Patient').trim();
  const house = String(merged.house || merged.houseNumber || previous.house || '').trim();
  const village = String(merged.village || previous.village || '').trim();
  const risk = normalizeRisk(merged.risk || previous.risk || 'LOW');

  const vitals = {
    hr: String(merged?.vitals?.hr || previous?.vitals?.hr || '--'),
    spo2: String(merged?.vitals?.spo2 || previous?.vitals?.spo2 || '--'),
    steps: String(merged?.vitals?.steps || previous?.vitals?.steps || '--')
  };

  return {
    ...merged,
    type: safeType,
    id: merged.id || previous.id || `p${Date.now()}`,
    name,
    age: Number.isFinite(Number(merged.age)) ? Number(merged.age) : Number(previous.age) || 0,
    phone: String(merged.phone || previous.phone || '').replace(/\D/g, '').slice(-10),
    house,
    village,
    location: merged.location || buildLocation(house, village),
    initials: merged.initials || toInitials(name),
    date: merged.date || previous.date || 'Visited today',
    risk,
    riskScore: Number.isFinite(Number(merged.riskScore))
      ? Number(merged.riskScore)
      : deriveRiskScore(risk),
    riskFactors: Array.isArray(merged.riskFactors)
      ? merged.riskFactors
      : deriveRiskFactors(risk, safeType),
    weeks: Number.isFinite(Number(merged.weeks))
      ? Number(merged.weeks)
      : Number(merged.weeksPregnant || previous.weeks || 0),
    nutrition: merged.nutrition || previous.nutrition || 'Average',
    emergency: merged.emergency || previous.emergency || '',
    babyDob: merged.babyDob || previous.babyDob || '',
    babyWeight: merged.babyWeight || previous.babyWeight || '',
    hasRing: merged.hasRing ?? previous.hasRing ?? true,
    visits: Array.isArray(merged.visits) ? merged.visits : (previous.visits || []),
    vitals
  };
};

const createSeedAlerts = (patientName = 'Patient', location = 'Unknown location') => [
  {
    id: 'seed-active',
    patient: patientName,
    type: 'Ring SOS',
    trigger: 'Ring SOS button pressed',
    location,
    time: '10 mins ago',
    status: 'Active',
    color: 'var(--danger)'
  },
  {
    id: 'seed-resolved',
    patient: patientName,
    type: 'Fall Detected',
    trigger: 'Fall detected by accelerometer',
    location,
    time: '2 days ago',
    status: 'Resolved',
    resolvedDate: 'Resolved recently',
    color: 'var(--warning)'
  }
];

export const AppProvider = ({ children }) => {
  const { user, profile } = useAuth();
  const syncedProfileKeyRef = useRef('');

  // ── Shared patients list ──────────────────────────────────────────────────
  const [patients, setPatients] = useState(() => {
    const seed = DEFAULT_PATIENTS.map((patient) => formatPatientRecord(patient));
    try {
      const raw = localStorage.getItem(PATIENTS_STORAGE_KEY);
      if (!raw) return seed;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return seed;
      return parsed.map((patient) => formatPatientRecord(patient));
    } catch (error) {
      console.warn('Failed to read shared patients cache:', error);
      return seed;
    }
  });

  const addPatient = (newPatient) => {
    const p = formatPatientRecord({
      ...newPatient,
      id: `p${Date.now()}`,
      date: 'Visited today'
    });
    setPatients((prev) => [p, ...prev]);
    setCaretakerPatientId(p.id);
  };

  const updatePatient = (updatedPatient) => {
    if (!updatedPatient?.id) return;
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? formatPatientRecord(updatedPatient, p) : p))
    );
  };

  useEffect(() => {
    try {
      localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patients));
    } catch (error) {
      console.warn('Failed to persist shared patients cache:', error);
    }
  }, [patients]);

  useEffect(() => {
    if (!user || !profile) return;
    if (profile.role !== 'patient' && profile.role !== 'mother') return;

    const profileKey = [
      user.uid,
      profile.role,
      profile.patientType || '',
      profile.name || user.displayName || '',
      profile.phone || user.phoneNumber || '',
      profile.village || ''
    ].join('|');

    if (syncedProfileKeyRef.current === profileKey) return;
    syncedProfileKeyRef.current = profileKey;

    const derivedType = profile.role === 'mother'
      ? 'pregnant'
      : (profile.patientType === 'elderly' ? 'elderly' : profile.patientType === 'wellness' ? 'wellness' : 'patient');

    const incoming = formatPatientRecord({
      id: `p-${user.uid.slice(0, 10)}`,
      authUid: user.uid,
      email: profile.email || user.email || '',
      name: profile.name || user.displayName || user.email?.split('@')[0] || 'Patient',
      age: Number(profile.age) || 0,
      phone: profile.phone || user.phoneNumber || '',
      house: profile.house || profile.houseNumber || '',
      village: profile.village || 'Self Registered',
      location: profile.location || buildLocation(profile.house || profile.houseNumber || '', profile.village || 'Self Registered'),
      type: derivedType,
      risk: profile.risk || 'LOW',
      date: 'Registered recently'
    });

    setPatients((prev) => {
      const existing = prev.find(
        (patient) =>
          patient.authUid === user.uid ||
          patient.id === incoming.id ||
          (incoming.email && patient.email === incoming.email)
      );

      if (!existing) {
        return [incoming, ...prev];
      }

      return prev.map((patient) =>
        (patient.id === existing.id ? formatPatientRecord(incoming, patient) : patient)
      );
    });
  }, [user, profile]);

  // ── Current logged-in ASHA user (mirrors Firebase auth profile) ───────────
  const [currentUser, setCurrentUser] = useState({
    name: 'Lakshmi Devi',
    ashaId: 'ASHA-2023-458',
    village: 'Ramgarh',
    yearsService: '3',
    dateJoined: '2023-01-15',
    phone: '+91 9876543210',
    photoURL: '',
    role: 'asha',
  });

  // Merge partial updates into currentUser (used after profile edits / photo uploads)
  const updateCurrentUser = (updates) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  // ── Caretaker linked patient state ────────────────────────────────────────
  const [caretakerPatientId, setCaretakerPatientId] = useState(null);
  const [caretakerAlerts, setCaretakerAlerts] = useState([]);

  const caretakerPatient = patients.find((p) => p.id === caretakerPatientId) || null;

  useEffect(() => {
    if (patients.length === 0) {
      setCaretakerPatientId(null);
      return;
    }
    if (!caretakerPatientId || !patients.some((p) => p.id === caretakerPatientId)) {
      setCaretakerPatientId(patients[0].id);
    }
  }, [patients, caretakerPatientId]);

  useEffect(() => {
    if (!caretakerPatient) {
      setCaretakerAlerts([]);
      return;
    }
    setCaretakerAlerts(createSeedAlerts(caretakerPatient.name, caretakerPatient.location));
  }, [caretakerPatient?.id]);

  return (
    <AppContext.Provider value={{
      patients,
      addPatient,
      updatePatient,
      currentUser,
      updateCurrentUser,
      caretakerPatient,
      caretakerPatientId,
      setCaretakerPatientId,
      caretakerAlerts
    }}>
      {children}
    </AppContext.Provider>
  );
};
