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

const generateMockVitals = (count = 7) => {
  const data = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    data.push({
      heartRate: Math.floor(Math.random() * (90 - 62 + 1)) + 62,
      spO2: Math.floor(Math.random() * (99 - 95 + 1)) + 95,
      bodyTemperature: Number((Math.random() * (37.1 - 36.3) + 36.3).toFixed(1)),
      roomTemperature: Number((Math.random() * (31 - 23) + 23).toFixed(1)),
      roomHumidity: Math.floor(Math.random() * (70 - 40 + 1)) + 40,
      timestamp: { seconds: Math.floor((now - i * 24 * 60 * 60 * 1000) / 1000) }
    });
  }
  return data;
};

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeVitalsEntry = (entry = {}) => {
  const bodyTemperature = toNumber(
    entry.bodyTemperature ?? entry.temperature ?? entry.temperatureAvg,
    36.6
  );

  return {
    ...entry,
    heartRate: toNumber(entry.heartRate ?? entry.heartRateAvg, 72),
    spO2: toNumber(entry.spO2 ?? entry.spo2 ?? entry.spo2Avg, 98),
    bodyTemperature,
    roomTemperature: toNumber(entry.roomTemperature ?? entry.roomTemp ?? entry.ambientTemperature, 25.2),
    roomHumidity: toNumber(entry.roomHumidity ?? entry.humidity ?? entry.relativeHumidity, 52)
  };
};

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
  const { vitals: firestoreVitals, latestVitals: firestoreLatest } = useVitals(profile?.uid);

  const rawVitals = firestoreVitals && firestoreVitals.length > 0 ? firestoreVitals : generateMockVitals(7);
  const displayVitals = rawVitals.map(normalizeVitalsEntry);
  const latest = normalizeVitalsEntry(firestoreLatest || rawVitals[0] || {});
  const currentHr = latest.heartRate;
  const currentSpo2 = latest.spO2;
  const currentBodyTemp = latest.bodyTemperature;
  const currentRoomTemp = latest.roomTemperature;
  const currentRoomHumidity = latest.roomHumidity;

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
      vitals: 'My Health Indicators', ring: 'Ring Connected',
      hr: 'HEART RATE', spo2: 'OXYGEN (SPO2)',
      roomTemp: 'ROOM TEMP', roomHumidity: 'ROOM HUMIDITY', bodyTemp: 'BODY TEMP',
      analytics: 'Vital Trends (7 Days)',
      view: 'View PDF', download: 'Download Summary', share: 'Share with Health Coach'
    },
    te: {
      subtitle: 'మీ ఆరోగ్య లక్ష్యాలను చేరుకోండి',
      vitals: 'నా ఆరోగ్య సూచికలు', ring: 'రింగ్ కనెక్ట్ చేయబడింది',
      hr: 'హృదయ స్పందన', spo2: 'ఆక్సిజన్ (SPO2)',
      roomTemp: 'గది ఉష్ణోగ్రత', roomHumidity: 'గది ఆర్ద్రత', bodyTemp: 'శరీర ఉష్ణోగ్రత',
      analytics: '7 రోజుల వైటల్ ట్రెండ్స్',
      view: 'మొత్తం చూడండి', download: 'సారాంశం డౌన్‌లోడ్', share: 'హెల్త్ కోచ్‌తో షేర్ చేయండి'
    }
  };
  const text = t[language] || t.en;

  const chartData = [...displayVitals].slice(0, 7).reverse().map(v => {
    const ts = v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000) : new Date(v.timestamp);
    return {
      day: ts.toLocaleDateString('en-US', { weekday: 'short' }),
      hr: v.heartRate,
      spo2: v.spO2,
      roomTemp: v.roomTemperature,
      humidity: v.roomHumidity,
      bodyTemp: v.bodyTemperature
    };
  });

  const vitalCards = [
    { icon: FaHeartbeat, label: text.hr, value: currentHr.toFixed(0), unit: 'bpm', color: 'var(--danger)', bg: 'var(--danger-light)' },
    { icon: FaLungs, label: text.spo2, value: currentSpo2.toFixed(0), unit: '%', color: 'var(--info)', bg: 'var(--info-light)' },
    { icon: FaThermometerHalf, label: text.roomTemp, value: currentRoomTemp.toFixed(1), unit: '°C', color: '#F59E0B', bg: '#FEF3C7' },
    { icon: FaTint, label: text.roomHumidity, value: currentRoomHumidity.toFixed(0), unit: '%', color: '#0D9488', bg: '#CCFBF1' },
    { icon: FaThermometerHalf, label: text.bodyTemp, value: currentBodyTemp.toFixed(1), unit: '°C', color: '#7C3AED', bg: '#EDE9FE' }
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

      <div className="responsive-mx responsive-p" style={{ marginTop: '16px', padding: '12px 20px', background: 'var(--surface)', border: '1.5px solid var(--success-light)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-sm)' }}>
        <FaBroadcastTower color="var(--success)" className="animate-pulse" />
        <span style={{ fontWeight: 600, color: 'var(--success)', flex: 1 }}>{text.ring}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
           <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)' }}>84%</span>
           <FaBatteryThreeQuarters color="var(--success)" size={16} />
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
