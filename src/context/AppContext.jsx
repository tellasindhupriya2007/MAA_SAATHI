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

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

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
  const baseSteps = Number(merged.steps || previous.steps || 1200);

  const vitals = {
    hr: String(merged?.vitals?.hr || previous?.vitals?.hr || '82 bpm'),
    spo2: String(merged?.vitals?.spo2 || previous?.vitals?.spo2 || '98%'),
    steps: String(merged?.vitals?.steps || previous?.vitals?.steps || baseSteps.toLocaleString())
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

  // ── Caretaker linked patient + real-time mock vitals/alerts ──────────────
  const [caretakerPatientId, setCaretakerPatientId] = useState(null);
  const [caretakerLive, setCaretakerLive] = useState({
    hr: 78,
    spo2: 98,
    steps: 1240,
    roomTemp: 26.0,
    bodyTemp: 36.7,
    humidity: 54,
    battery: 84,
    status: 'stable',
    updatedAt: Date.now()
  });
  const [caretakerTrend, setCaretakerTrend] = useState([]);
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
      setCaretakerTrend([]);
      setCaretakerAlerts([]);
      return;
    }

    const now = Date.now();
    const seedHr = clamp(76 + Math.floor(Math.random() * 8), 62, 105);
    const seedSpo2 = clamp(97 + Math.floor(Math.random() * 3), 88, 100);
    const seedSteps = clamp(Number(caretakerPatient?.vitals?.steps?.replace(/,/g, '') || 1200), 300, 25000);

    const initialLive = {
      hr: seedHr,
      spo2: seedSpo2,
      steps: seedSteps,
      roomTemp: Number((25 + Math.random() * 4).toFixed(1)),
      bodyTemp: Number((36.5 + Math.random() * 0.6).toFixed(1)),
      humidity: clamp(48 + Math.floor(Math.random() * 12), 30, 90),
      battery: clamp(74 + Math.floor(Math.random() * 16), 20, 100),
      status: 'stable',
      updatedAt: now
    };

    setCaretakerLive(initialLive);
    setCaretakerTrend(
      Array.from({ length: 7 }).map((_, idx) => {
        const ts = now - (6 - idx) * 60 * 60 * 1000;
        return {
          timestamp: ts,
          label: new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          hr: clamp(seedHr + Math.floor(Math.random() * 6) - 3, 62, 110),
          spo2: clamp(seedSpo2 + Math.floor(Math.random() * 3) - 1, 88, 100)
        };
      })
    );
    setCaretakerAlerts(createSeedAlerts(caretakerPatient.name, caretakerPatient.location));
  }, [caretakerPatient?.id]);

  useEffect(() => {
    if (!caretakerPatient) return;

    const interval = setInterval(() => {
      setCaretakerLive((prev) => {
        const next = {
          hr: clamp(prev.hr + Math.floor(Math.random() * 7) - 3, 60, 115),
          spo2: clamp(prev.spo2 + Math.floor(Math.random() * 3) - 1, 88, 100),
          steps: clamp(prev.steps + Math.floor(Math.random() * 110), 300, 30000),
          roomTemp: Number(clamp(prev.roomTemp + (Math.random() - 0.5) * 0.8, 18, 38).toFixed(1)),
          bodyTemp: Number(clamp(prev.bodyTemp + (Math.random() - 0.5) * 0.2, 35.8, 39.0).toFixed(1)),
          humidity: Math.round(clamp(prev.humidity + (Math.random() - 0.5) * 4, 30, 90)),
          battery: clamp(prev.battery - (Math.random() > 0.7 ? 1 : 0), 5, 100),
          status: prev.status,
          updatedAt: Date.now()
        };

        if (next.spo2 < 93 || next.hr > 105) next.status = 'critical';
        else if (next.spo2 < 95 || next.hr > 95) next.status = 'attention';
        else next.status = 'stable';

        setCaretakerTrend((old) => [
          ...old.slice(-6),
          {
            timestamp: next.updatedAt,
            label: new Date(next.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            hr: next.hr,
            spo2: next.spo2
          }
        ]);

        setCaretakerAlerts((old) => {
          const resolved = old.filter((a) => a.status !== 'Active');

          if (next.status === 'critical') {
            const type = next.spo2 < 93 ? 'Low SpO2' : 'High Heart Rate';
            const trigger = next.spo2 < 93
              ? `SpO2 dropped to ${next.spo2}%`
              : `Heart rate spiked to ${next.hr} bpm`;

            return [
              {
                id: 'live-critical',
                patient: caretakerPatient.name,
                type,
                trigger,
                location: caretakerPatient.location,
                time: 'Just now',
                status: 'Active',
                color: 'var(--danger)'
              },
              ...resolved
            ].slice(0, 6);
          }

          return resolved.slice(0, 6);
        });

        return next;
      });
    }, 6000);

    return () => clearInterval(interval);
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
      caretakerLive,
      caretakerTrend,
      caretakerAlerts
    }}>
      {children}
    </AppContext.Provider>
  );
};
