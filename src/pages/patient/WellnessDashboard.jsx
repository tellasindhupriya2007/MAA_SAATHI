import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaHeartbeat, FaLungs, FaFilePdf, FaDownload, FaEye,
  FaBatteryThreeQuarters, FaBroadcastTower, FaChartLine, FaCalendarCheck, FaThermometerHalf, FaTint
} from 'react-icons/fa';
import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from 'recharts';
import PatientLayout from '../../layouts/PatientLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useVitals } from '../../hooks/useVitals';
import { generateProfessionalReport } from '../../utils/generatePdfReport';

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeVitalsEntry = (entry = {}) => {
  const bodyTemperature = toNumber(
    entry.bodyTemperature ?? entry.bodyTemp ?? entry.temperature ?? entry.temperatureAvg,
    null
  );

  return {
    ...entry,
    heartRate: toNumber(entry.heartRate ?? entry.hr ?? entry.heartRateAvg, null),
    spO2: toNumber(entry.spO2 ?? entry.spo2 ?? entry.spo2Avg, null),
    bodyTemperature,
    roomTemperature: toNumber(entry.roomTemperature ?? entry.roomTemp ?? entry.ambientTemperature, null),
    roomHumidity: toNumber(entry.roomHumidity ?? entry.humidity ?? entry.relativeHumidity, null),
    battery: toNumber(entry.battery ?? entry.batteryLevel, null)
  };
};

const formatVital = (value, digits = 0) =>
  Number.isFinite(value) ? Number(value).toFixed(digits) : '--';

const WellnessDashboard = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  
  React.useEffect(() => {
    if (profile && profile.isSurveyCompleted === false) {
      navigate('/wellness/health-survey');
    }
  }, [profile, navigate]);

  const name = (profile?.name || 'User').split(' ')[0];
  const vitalsCandidates = React.useMemo(
    () => [profile?.patientId, profile?.uid, 'patient_demo'],
    [profile?.patientId, profile?.uid]
  );
  const { vitals: firestoreVitals, latestVitals: firestoreLatest } = useVitals(vitalsCandidates);

  const rawVitals = firestoreVitals && firestoreVitals.length > 0 ? firestoreVitals : [];
  const displayVitals = rawVitals.map(normalizeVitalsEntry);
  const latest = normalizeVitalsEntry(firestoreLatest || rawVitals[0] || {});
  const currentHr = latest.heartRate;
  const currentSpo2 = latest.spO2;
  const currentBodyTemp = latest.bodyTemperature;
  const currentRoomTemp = latest.roomTemperature;
  const currentRoomHumidity = latest.roomHumidity;
  const ringConnected = displayVitals.length > 0;
  const liveBattery = toNumber(latest.battery ?? latest.batteryLevel, null);

  const generatePDF = async (type = 'instant', mode = 'download') => {
    setIsGenerating(true);
    try {
      generateProfessionalReport(profile, firestoreVitals, null, mode, type);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const t = {
    en: {
      subtitle: 'Achieve your health goals',
      vitals: 'My Health Indicators', ring: 'Ring Connected', ringOff: 'Ring not connected',
      hr: 'HEART RATE', spo2: 'OXYGEN (SPO2)',
      roomTemp: 'ROOM TEMP', roomHumidity: 'ROOM HUMIDITY', bodyTemp: 'BODY TEMP',
      analytics: 'Vital Trends (7 Days)',
      view: 'View PDF', download: 'Download Summary', share: 'Share with Health Coach'
    },
    te: {
      subtitle: 'మీ ఆరోగ్య లక్ష్యాలను చేరుకోండి',
      vitals: 'నా ఆరోగ్య సూచికలు', ring: 'రింగ్ కనెక్ట్ చేయబడింది', ringOff: 'రింగ్ కనెక్ట్ కాలేదు',
      hr: 'హృదయ స్పందన', spo2: 'ఆక్సిజన్ (SPO2)',
      roomTemp: 'గది ఉష్ణోగ్రత', roomHumidity: 'గది ఆర్ద్రత', bodyTemp: 'శరీర ఉష్ణోగ్రత',
      analytics: '7 రోజుల వైటల్ ట్రెండ్స్',
      view: 'మొత్తం చూడండి', download: 'సారాంశం డౌన్‌లోడ్', share: 'హెల్త్ కోచ్‌తో షేర్ చేయండి'
    }
  };
  const text = t[language] || t.en;

  const chartData = [...displayVitals].slice(0, 7).reverse().map(v => {
    const ts = v.timestamp?.seconds
      ? new Date(v.timestamp.seconds * 1000)
      : v.timestampMs
        ? new Date(v.timestampMs)
        : null;
    if (!ts || Number.isNaN(ts.getTime())) return null;
    return {
      day: ts.toLocaleDateString('en-US', { weekday: 'short' }),
      hr: v.heartRate,
      spo2: v.spO2,
      roomTemp: v.roomTemperature,
      humidity: v.roomHumidity,
      bodyTemp: v.bodyTemperature
    };
  }).filter(Boolean);

  const vitalCards = [
    { icon: FaHeartbeat, label: text.hr, value: formatVital(currentHr, 0), unit: 'bpm', color: 'var(--danger)', bg: 'var(--danger-light)' },
    { icon: FaLungs, label: text.spo2, value: formatVital(currentSpo2, 0), unit: '%', color: 'var(--info)', bg: 'var(--info-light)' },
    { icon: FaThermometerHalf, label: text.roomTemp, value: formatVital(currentRoomTemp, 1), unit: '°C', color: '#F59E0B', bg: '#FEF3C7' },
    { icon: FaTint, label: text.roomHumidity, value: formatVital(currentRoomHumidity, 0), unit: '%', color: '#0D9488', bg: '#CCFBF1' },
    { icon: FaThermometerHalf, label: text.bodyTemp, value: formatVital(currentBodyTemp, 1), unit: '°C', color: '#7C3AED', bg: '#EDE9FE' }
  ];

  return (
    <PatientLayout patientType="wellness">
      <header className="responsive-px" style={{ 
        background: 'var(--surface)', 
        borderBottom: '1px solid var(--border)', 
        paddingTop: '16px', paddingBottom: '16px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingTop: 'calc(16px + env(safe-area-inset-top))'
      }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>Namaste, {name} 👋</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{text.subtitle}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => toggleLanguage(language === 'en' ? 'te' : 'en')} style={{ padding: '6px 12px', borderRadius: '100px', border: '1px solid var(--border)', fontWeight: 600, cursor: 'pointer', background: 'transparent' }}>{language.toUpperCase()}</button>
        </div>
      </header>

      <div className="responsive-mx responsive-p" style={{ marginTop: '16px', padding: '12px 20px', background: 'var(--surface)', border: `1.5px solid ${ringConnected ? 'var(--success-light)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-sm)' }}>
        <FaBroadcastTower color={ringConnected ? 'var(--success)' : 'var(--text-tertiary)'} className={ringConnected ? 'animate-pulse' : ''} />
        <span style={{ fontWeight: 600, color: ringConnected ? 'var(--success)' : 'var(--text-tertiary)', flex: 1 }}>
          {ringConnected ? text.ring : text.ringOff}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
           <span style={{ fontSize: '12px', fontWeight: 700, color: ringConnected ? 'var(--success)' : 'var(--text-tertiary)' }}>
             {liveBattery !== null ? `${Math.round(liveBattery)}%` : 'N/A'}
           </span>
           <FaBatteryThreeQuarters color={ringConnected ? 'var(--success)' : 'var(--text-tertiary)'} size={16} />
        </div>
      </div>

      <div className="responsive-px" style={{ paddingTop: '16px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>{text.vitals}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {vitalCards.map((card) => (
            <div key={card.label} style={{ background: 'var(--surface)', padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ width: '42px', height: '42px', margin: '0 auto 8px auto', borderRadius: '50%', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon color={card.color} size={20} />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>{card.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: card.color }}>
                {card.value}<span style={{ fontSize: '12px' }}> {card.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="responsive-mx responsive-p" style={{ marginTop: '24px', padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <FaChartLine color="var(--accent)" />
            <span style={{ fontSize: '16px', fontWeight: 700 }}>{text.analytics}</span>
         </div>
         <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                 <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-secondary)'}} />
                 <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                 <Line type="monotone" dataKey="hr" stroke="var(--danger)" strokeWidth={2.5} dot={{r: 3, fill: 'var(--danger)'}} />
                 <Line type="monotone" dataKey="spo2" stroke="var(--info)" strokeWidth={2.5} dot={{r: 3, fill: 'var(--info)'}} />
                 <Line type="monotone" dataKey="roomTemp" stroke="#F59E0B" strokeWidth={2.5} dot={{r: 3, fill: '#F59E0B'}} />
                 <Line type="monotone" dataKey="humidity" stroke="#0D9488" strokeWidth={2.5} dot={{r: 3, fill: '#0D9488'}} />
                 <Line type="monotone" dataKey="bodyTemp" stroke="#7C3AED" strokeWidth={2.5} dot={{r: 3, fill: '#7C3AED'}} />
              </LineChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="responsive-px" style={{ paddingBottom: '96px', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="action-button-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <style dangerouslySetInnerHTML={{__html: `
              @media (max-width: 400px) {
                .action-button-grid { grid-template-columns: 1fr !important; }
              }
            `}} />
            <button 
              onClick={() => generatePDF('instant', 'download')}
              style={{ height: '56px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(194, 24, 91, 0.2)' }}
            >
              <FaDownload /> {text.download}
            </button>
            <button 
              onClick={() => generatePDF('instant', 'view')}
              style={{ height: '56px', background: 'white', color: 'var(--accent)', border: '1.5px solid var(--accent)', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <FaEye /> {text.view}
            </button>
          </div>

          <button onClick={() => alert("Summary shared!")} style={{ height: '56px', background: '#ffffff', color: 'var(--success)', border: '2.5px solid var(--success)', borderRadius: '16px', fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 109, 49, 0.08)' }}>
            <FaCalendarCheck size={18} /> {text.share}
          </button>
      </div>
    </PatientLayout>
  );
};

export default WellnessDashboard;
