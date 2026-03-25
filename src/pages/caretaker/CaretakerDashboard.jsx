import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaHeartbeat, FaLungs, FaPhone, 
  FaBatteryThreeQuarters, FaBroadcastTower, 
  FaUserCircle, FaMapMarkerAlt, FaShieldAlt,
  FaFilePdf, FaHistory, FaThermometerHalf, FaTint
} from 'react-icons/fa';
import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md';
import PatientLayout from '../../layouts/PatientLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useVitals } from '../../hooks/useVitals';
import { AppContext } from '../../context/AppContext';

const getRelativeTime = (timestamp) => {
  const ts =
    typeof timestamp?.toMillis === 'function'
      ? timestamp.toMillis()
      : typeof timestamp?.seconds === 'number'
        ? timestamp.seconds * 1000
        : Number(timestamp);
  if (!Number.isFinite(ts)) return 'No live update';
  const diffMs = Date.now() - ts;
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  return `${hours} hr${hours === 1 ? '' : 's'} ago`;
};

const toNumber = (value, fallback = null) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const CaretakerDashboard = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { caretakerPatient } = React.useContext(AppContext);
  const [, setNow] = useState(Date.now());

  const vitalsCandidates = React.useMemo(
    () => [caretakerPatient?.id, caretakerPatient?.authUid, profile?.linkedPatientId, 'patient_demo'],
    [caretakerPatient?.id, caretakerPatient?.authUid, profile?.linkedPatientId]
  );
  const { latestVitals } = useVitals(vitalsCandidates);
  const live = latestVitals || {};
  const liveHr = toNumber(live.heartRate ?? live.hr ?? live.heartRateAvg, null);
  const liveSpo2 = toNumber(live.spO2 ?? live.spo2 ?? live.spo2Avg, null);
  const liveRoomTemp = toNumber(live.roomTemperature ?? live.roomTemp ?? live.ambientTemperature, null);
  const liveRoomHumidity = toNumber(live.roomHumidity ?? live.humidity ?? live.relativeHumidity, null);
  const liveBodyTemp = toNumber(live.bodyTemperature ?? live.bodyTemp ?? live.temperature ?? live.temperatureAvg, null);
  const liveBattery = toNumber(live.battery ?? live.batteryLevel, null);
  const liveTimestamp = live.timestamp || live.createdAt || live.updatedAt || live.timestampMs;
  const liveStatus =
    liveSpo2 !== null && liveSpo2 < 93
      ? 'critical'
      : liveHr !== null && liveHr > 105
        ? 'critical'
        : (liveSpo2 !== null && liveSpo2 < 95) || (liveHr !== null && liveHr > 95)
          ? 'attention'
          : 'stable';

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const name = profile?.name || 'Caregiver';
  const linkedPatient = caretakerPatient ? {
    name: caretakerPatient.name,
    age: caretakerPatient.age || '--',
    location: caretakerPatient.location || `${caretakerPatient.house || ''}${caretakerPatient.village ? `, ${caretakerPatient.village}` : ''}`,
    status: liveStatus,
    hr: liveHr,
    spo2: liveSpo2,
    roomTemp: liveRoomTemp,
    roomHumidity: liveRoomHumidity,
    bodyTemp: liveBodyTemp,
    lastUpdate: getRelativeTime(liveTimestamp),
    phone: caretakerPatient.phone || ''
  } : {
    name: 'No linked patient',
    age: '--',
    location: 'Link a patient to start monitoring',
    status: 'stable',
    hr: null,
    spo2: null,
    roomTemp: null,
    roomHumidity: null,
    bodyTemp: null,
    lastUpdate: 'N/A',
    phone: ''
  };

  const statusMeta = linkedPatient.status === 'critical'
    ? { bg: 'var(--danger-light)', color: 'var(--danger)', label: 'CRITICAL' }
    : linkedPatient.status === 'attention'
      ? { bg: 'var(--warning-light)', color: 'var(--warning)', label: 'ATTENTION' }
      : { bg: 'var(--success-light)', color: 'var(--success)', label: 'STABLE' };

  const dialNumber = linkedPatient.phone ? `tel:+91${linkedPatient.phone}` : null;

  const t = {
    en: {
      subtitle: 'Monitoring your loved ones',
      patientStatus: 'Patient Status',
      vitals: 'Current Vitals',
      call: 'Call Patient',
      history: 'Health History',
      ring: 'Ring Connected'
    },
    te: {
      subtitle: 'మీ ప్రియమైన వారిని పర్యవేక్షించడం',
      patientStatus: 'రోగి స్థితి',
      vitals: 'ప్రస్తుత ప్రాణాధారాలు',
      call: 'రోగికి కాల్ చేయండి',
      history: 'ఆరోగ్య చరిత్ర',
      ring: 'రింగ్ కనెక్ట్ చేయబడింది'
    }
  };
  const text = t[language] || t.en;

  return (
    <PatientLayout role="caretaker">
      <header style={{ 
        background: 'var(--surface)', 
        borderBottom: '1px solid var(--border)', 
        padding: '16px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingTop: 'calc(16px + env(safe-area-inset-top))'
      }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>Welcome, {name} 👋</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{text.subtitle}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={toggleTheme} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'light' ? <MdOutlineDarkMode /> : <MdOutlineLightMode />}
          </button>
        </div>
      </header>

      <div className="px-mobile-16" style={{ padding: '20px 24px' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--border)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '10px 16px', background: statusMeta.bg, color: statusMeta.color, fontSize: '11px', fontWeight: 700, borderRadius: '0 0 0 16px' }}>
            {statusMeta.label}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaUserCircle size={40} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{linkedPatient.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <FaMapMarkerAlt size={12} /> {linkedPatient.location}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              {
                id: 'hr',
                icon: FaHeartbeat,
                color: 'var(--danger)',
                label: 'HEART RATE',
                value: linkedPatient.hr !== null ? `${Math.round(linkedPatient.hr)} bpm` : '--'
              },
              {
                id: 'spo2',
                icon: FaLungs,
                color: 'var(--info)',
                label: 'SPO2',
                value: linkedPatient.spo2 !== null ? `${Math.round(linkedPatient.spo2)}%` : '--'
              },
              {
                id: 'room-temp',
                icon: FaThermometerHalf,
                color: '#F59E0B',
                label: 'ROOM TEMP',
                value: linkedPatient.roomTemp !== null ? `${linkedPatient.roomTemp.toFixed(1)}°C` : '--'
              },
              {
                id: 'humidity',
                icon: FaTint,
                color: '#0D9488',
                label: 'ROOM HUMIDITY',
                value: linkedPatient.roomHumidity !== null ? `${Math.round(linkedPatient.roomHumidity)}%` : '--'
              },
              {
                id: 'body-temp',
                icon: FaThermometerHalf,
                color: '#7C3AED',
                label: 'BODY TEMP',
                value: linkedPatient.bodyTemp !== null ? `${linkedPatient.bodyTemp.toFixed(1)}°C` : '--'
              }
            ].map((item) => (
              <div key={item.id} style={{ textAlign: 'center' }}>
                <item.icon color={item.color} style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{item.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => {
                if (dialNumber) window.location.href = dialNumber;
              }}
              style={{ flex: 1, height: '48px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: dialNumber ? 1 : 0.6, cursor: dialNumber ? 'pointer' : 'not-allowed' }}
            >
              <FaPhone /> {text.call}
            </button>
            <button 
              onClick={() => navigate('/mother/reports')}
              style={{ width: '48px', height: '48px', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <FaHistory color="var(--text-primary)" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-mobile-16" style={{ padding: '0 24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>Device Status</div>
        <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FaBroadcastTower color="var(--success)" />
                <div>
                   <div style={{ fontSize: '14px', fontWeight: 600 }}>{text.ring}</div>
                   <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                     {liveBattery !== null ? `Battery ${Math.round(liveBattery)}%` : 'Battery N/A'}
                   </div>
                </div>
             </div>
             <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{linkedPatient.lastUpdate}</div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default CaretakerDashboard;
