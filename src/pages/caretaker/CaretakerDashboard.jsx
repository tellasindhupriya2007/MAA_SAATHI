import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaHeartbeat, FaLungs, FaWalking, FaPhone, 
  FaBatteryThreeQuarters, FaBroadcastTower, 
  FaUserCircle, FaMapMarkerAlt, FaShieldAlt,
  FaFilePdf, FaHistory
} from 'react-icons/fa';
import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md';
import PatientLayout from '../../layouts/PatientLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { AppContext } from '../../context/AppContext';

const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'just now';
  const diffMs = Date.now() - timestamp;
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  return `${hours} hr${hours === 1 ? '' : 's'} ago`;
};

const CaretakerDashboard = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { caretakerPatient, caretakerLive } = React.useContext(AppContext);
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const name = profile?.name || 'Caregiver';
  const linkedPatient = caretakerPatient ? {
    name: caretakerPatient.name,
    age: caretakerPatient.age || '--',
    location: caretakerPatient.location || `${caretakerPatient.house || ''}${caretakerPatient.village ? `, ${caretakerPatient.village}` : ''}`,
    status: caretakerLive?.status || 'stable',
    hr: caretakerLive?.hr ?? 78,
    spo2: caretakerLive?.spo2 ?? 98,
    steps: caretakerLive?.steps ?? 1100,
    lastUpdate: getRelativeTime(caretakerLive?.updatedAt),
    phone: caretakerPatient.phone || ''
  } : {
    name: 'No linked patient',
    age: '--',
    location: 'Link a patient to start monitoring',
    status: 'stable',
    hr: 0,
    spo2: 0,
    steps: 0,
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <FaHeartbeat color="var(--danger)" style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>HEART RATE</div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{Math.round(linkedPatient.hr)} <span style={{ fontSize: '10px' }}>bpm</span></div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <FaLungs color="var(--info)" style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>SPO2</div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{Math.round(linkedPatient.spo2)}%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <FaWalking color="var(--success)" style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>STEPS</div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{Math.round(linkedPatient.steps).toLocaleString()}</div>
            </div>
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
                   <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Battery {Math.round(caretakerLive?.battery ?? 84)}%</div>
                </div>
             </div>
             <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{linkedPatient.lastUpdate}</div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default CaretakerDashboard;
