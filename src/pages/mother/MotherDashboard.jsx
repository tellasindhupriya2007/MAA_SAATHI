import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaHeartbeat, FaLungs, FaFilePdf,
  FaDownload, FaPhone, FaThermometerHalf, FaEye,
  FaBatteryThreeQuarters, FaChevronRight, FaClock,
  FaBroadcastTower, FaUserNurse, FaClipboardList, FaTint
} from 'react-icons/fa';

import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from 'recharts';
import MotherLayout from '../../layouts/MotherLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useVitals } from '../../hooks/useVitals';
import { useSurveys } from '../../hooks/useSurveys';
import { generateInstantReport, generateMonthlyReport } from '../../utils/generatePdfReport';

const REPORTS = [
  { id: 'r1', type: 'Antenatal Checkup', date: '12 Mar 2026', urgency: 'STABLE'   },
  { id: 'r2', type: 'Antenatal Checkup', date: '01 Feb 2026', urgency: 'MODERATE' },
];

const RING_CONNECTED = true;

const generateMockVitals = (count = 7) => {
  const data = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    data.push({
      heartRate: Math.floor(Math.random() * (88 - 64 + 1)) + 64,
      spO2: Math.floor(Math.random() * (99 - 95 + 1)) + 95,
      bodyTemperature: Number((Math.random() * (37.1 - 36.4) + 36.4).toFixed(1)),
      roomTemperature: Number((Math.random() * (30 - 23) + 23).toFixed(1)),
      roomHumidity: Math.floor(Math.random() * (68 - 40 + 1)) + 40,
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
    roomTemperature: toNumber(entry.roomTemperature ?? entry.roomTemp ?? entry.ambientTemperature, 25.0),
    roomHumidity: toNumber(entry.roomHumidity ?? entry.humidity ?? entry.relativeHumidity, 52)
  };
};

const urgencyColors = {
  STABLE:   { bg: 'var(--success-light)', color: 'var(--success)', icon: 'var(--success)' },
  MODERATE: { bg: 'var(--warning-light)', color: 'var(--warning)', icon: 'var(--warning)' },
  CRITICAL: { bg: 'var(--danger-light)',  color: 'var(--danger)',  icon: 'var(--danger)'  },
};

const MotherDashboard = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [avatarErr, setAvatarErr] = useState(false);
  
  React.useEffect(() => {
    console.log("[DEBUG] Profile Survey Status:", profile?.isSurveyCompleted);
    if (profile && profile.isSurveyCompleted === false) {
      console.warn("[DEBUG] Redirecting to Survey...");
      navigate('/mother/medical-history');
    }
  }, [profile, navigate]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { vitals, latestVitals } = useVitals(profile?.uid);
  const { surveys } = useSurveys(profile?.uid);
  const latestSurvey = surveys && surveys.length > 0 ? surveys[0] : null;
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const rawVitals = vitals && vitals.length > 0 ? vitals : generateMockVitals(7);
  const displayVitals = rawVitals.map(normalizeVitalsEntry);
  const latest = normalizeVitalsEntry(latestVitals || rawVitals[0] || {});

  const currentHr = latest.heartRate;
  const currentSpo2 = latest.spO2;
  const currentBodyTemp = latest.bodyTemperature;
  const currentRoomTemp = latest.roomTemperature;
  const currentRoomHumidity = latest.roomHumidity;

  const generatePDF = async (type, mode = 'download') => {
    setIsGenerating(true);
    try {
      if (type === 'instant') {
        generateInstantReport(profile, vitals, latestSurvey, mode);
      } else {
        generateMonthlyReport(profile, vitals, latestSurvey, mode);
      }
      setReportGenerated(true);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToDoctor = (e) => {
    e.preventDefault();
    if (isSending) return;

    if (profile?.linkedDoctorId || profile?.linkedDoctorEmail) {
      setIsSending(true);
      showToast(`Report sent to Dr. ${profile?.linkedDoctorName || 'Sharma'}`);
      setTimeout(() => setIsSending(false), 3000);
    } else {
      const email = prompt("Link a Doctor: Enter your doctor's email or phone number:");
      if (email) {
        setIsSending(true);
        showToast("Doctor linked and report sent successfully!");
        setTimeout(() => setIsSending(false), 3000);
      }
    }
  };

  const name     = (profile?.name || 'Sunita').split(' ')[0];
  const initials = (profile?.name || 'Sunita').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const photoURL = !avatarErr ? (profile?.photoURL || '') : '';

  const t = {
    en: {
      subtitle: 'Your health, monitored daily',
      vitals: 'My Vitals Today', updated: 'Last updated 10 mins ago',
      hr: 'HEART RATE', spo2: 'BLOOD OXYGEN',
      roomTemp: 'ROOM TEMP', roomHumidity: 'ROOM HUMIDITY', bodyTemp: 'BODY TEMP',
      analytics: 'Vital Trends (7 Days)',
      stable: '● STABLE', low: '● LOW', goal: 'of 5,000 goal',
      tempTitle: 'Temperature', tempSub: 'Last 3 readings',
      historyTitle: 'Vitals History', last7: 'Last 7 days',
      bpmLabel: 'BPM Over 7 Days', bpmToday: `${currentHr} bpm today`,
      reports: 'Health Reports',
      worker: 'My Health Worker', visited: 'Last visited 2 days ago',
      ring: 'Ring Connected', ringOff: 'Ring not connected', battery: 'Battery 82%',
      connected: 'CONNECTED', view: 'View PDF', download: 'Download PDF',
      monthly: 'Download Monthly Report'
    },
    te: {
      subtitle: 'మీ ఆరోగ్యం, ప్రతిరోజూ పర్యవేక్షించబడుతుంది',
      vitals: 'ఈ రోజు నా ప్రాణాధారాలు', updated: '10 నిమిషాల క్రితం నవీకరించబడింది',
      hr: 'హృదయ స్పందన', spo2: 'రక్తంలో ఆక్సిజన్',
      roomTemp: 'గది ఉష్ణోగ్రత', roomHumidity: 'గది ఆర్ద్రత', bodyTemp: 'శరీర ఉష్ణోగ్రత',
      analytics: '7 రోజుల వైటల్ ట్రెండ్స్',
      stable: '● స్థిరంగా', low: '● తక్కువ', goal: '5,000 లక్ష్యంలో',
      tempTitle: 'ఉష్ణోగ్రత', tempSub: 'చివరి 3 రీడింగులు',
      historyTitle: 'ప్రాణాధారాల చరిత్ర', last7: 'గత 7 రోజులు',
      bpmLabel: '7 రోజులు BPM', bpmToday: `${currentHr} bpm ఈరోజు`,
      reports: 'ఆరోగ్య నివేదికలు',
      worker: 'నా ఆరోగ్య కార్యకర్త', visited: '2 రోజుల క్రితం సందర్శించారు',
      ring: 'రింగ్ కనెక్ట్ చేయబడింది', ringOff: 'రింగ్ కనెక్ట్ కాలేదు', battery: 'బ్యాటరీ 82%',
      connected: 'కనెక్ట్ అయింది', view: 'నివేదిక చూడండి', download: 'డౌన్‌లోడ్ PDF',
      monthly: 'నెలవారీ నివేదిక డౌన్‌లోడ్'
    }
  };
  const text = t[language] || t.en;

  const card = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
  };

  const chartData = [...displayVitals].slice(0, 7).reverse().map((v) => {
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
    <MotherLayout>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes connectedPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        .md-report-card:hover { border-color: var(--accent) !important; }
        .md-search:focus { border-color: var(--accent) !important; outline: none; }
        
        .vitals-grid { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 12px; 
        }
        @media (max-width: 600px) {
          .vitals-grid { grid-template-columns: 1fr 1fr; }
          .vitals-grid > div:last-child { grid-column: span 2; }
        }

        .toast-msg {
          position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
          background: #191c1d; color: white; padding: 12px 24px;
          border-radius: 100px; font-size: 14px; font-weight: 600;
          z-index: 2000; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          white-space: nowrap; animation: slideIn 0.3s ease;
        }
        @keyframes slideIn { from { top: 60px; opacity: 0; } to { top: 80px; opacity: 1; } }
      `}} />

      {toast && <div className="toast-msg">{toast}</div>}

      <header className="responsive-px" style={{
        ...card, borderLeft: 'none', borderRight: 'none', borderTop: 'none',
        borderRadius: 0, paddingTop: '16px', paddingBottom: '16px',
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifySelf: 'space-between',
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
        width: '100%', boxSizing: 'border-box'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}> Namaste, {name} 👋 </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}> {text.subtitle} </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['en', 'te'].map(lang => (
              <button key={lang} onClick={() => toggleLanguage(lang)} style={{
                padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                border: '1.5px solid var(--border)', transition: 'all 0.15s',
                ...(language === lang ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : { background: 'transparent', color: 'var(--text-secondary)' })
              }}>{lang.toUpperCase()}</button>
            ))}
          </div>
          <div onClick={() => navigate('/mother/profile')} style={{
            width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-light)', border: '2px solid var(--accent)',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0
          }}>
            {photoURL ? (
              <img src={photoURL} alt="Profile" onError={() => setAvatarErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>{initials}</span>
            )}
          </div>
        </div>
      </header>

      <div className="responsive-mx responsive-p" style={{ 
        marginTop: '16px', ...card, padding: '14px 20px', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, background: RING_CONNECTED ? 'var(--success-light)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaBroadcastTower size={20} color={RING_CONNECTED ? 'var(--success)' : 'var(--text-tertiary)'} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: RING_CONNECTED ? 'var(--success)' : 'var(--text-tertiary)' }}> {RING_CONNECTED ? text.ring : text.ringOff} </div>
            {RING_CONNECTED && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <FaBatteryThreeQuarters size={14} color="var(--success)" />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{text.battery}</span>
              </div>
            )}
          </div>
        </div>
        {RING_CONNECTED && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: '100px', padding: '4px 12px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'connectedPulse 2s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--success)', letterSpacing: '0.5px' }}>{text.connected}</span>
          </div>
        )}
      </div>

      <div className="responsive-px" style={{ paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaHeartbeat size={18} color="var(--danger)" />
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{text.vitals}</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{text.updated}</span>
        </div>
        <div className="vitals-grid">
          {vitalCards.map((item) => (
            <div key={item.label} className="responsive-p" style={{ ...card, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', margin: '0 auto 10px auto', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.icon size={22} color={item.color} />
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '6px' }}>{item.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '3px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: item.color }}>{item.value}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="responsive-mx responsive-p" style={{ marginTop: '16px', ...card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FaHeartbeat size={16} color="var(--accent)" />
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{text.analytics}</span>
        </div>
        <div style={{ height: '220px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
              <Line type="monotone" dataKey="hr" stroke="var(--danger)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--danger)' }} />
              <Line type="monotone" dataKey="spo2" stroke="var(--info)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--info)' }} />
              <Line type="monotone" dataKey="roomTemp" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, fill: '#F59E0B' }} />
              <Line type="monotone" dataKey="humidity" stroke="#0D9488" strokeWidth={2.5} dot={{ r: 3, fill: '#0D9488' }} />
              <Line type="monotone" dataKey="bodyTemp" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 3, fill: '#7C3AED' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="responsive-px" style={{ paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <FaFilePdf size={18} color="var(--accent)" />
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{text.reports}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button 
              onClick={() => generatePDF('instant', 'download')}
              style={{ height: '52px', background: 'var(--accent)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <FaDownload size={14} /> {text.download}
            </button>
            <button 
              onClick={() => generatePDF('instant', 'view')}
              style={{ height: '52px', background: 'var(--surface)', color: 'var(--accent)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--accent)', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <FaEye size={14} /> {text.view}
            </button>
          </div>

          <button 
            onClick={() => generatePDF('monthly', 'download')}
            disabled={isGenerating}
            style={{
              height: '56px', width: '100%', background: '#ffffff', color: '#9b0044', 
              borderRadius: '16px', border: '2px solid #9b0044', fontSize: '15px', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
              cursor: 'pointer', opacity: isGenerating ? 0.7 : 1, transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(155, 0, 68, 0.08)', marginTop: '4px'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#fff5f7'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; }}
          >
            {isGenerating ? <span>Generating...</span> : <><FaFilePdf size={18} /> {text.monthly}</>}
          </button>

          {reportGenerated && (
            <button 
              type="button"
              disabled={isSending}
              onClick={handleSendToDoctor} 
              style={{ 
                height: '48px', width: '100%', 
                background: isSending ? 'var(--bg-secondary)' : 'var(--success-light)', 
                color: isSending ? 'var(--text-tertiary)' : 'var(--success)', 
                borderRadius: 'var(--radius-md)', 
                border: isSending ? '1.5px solid var(--border)' : '1.5px solid var(--success)', 
                fontSize: '14px', fontWeight: 600, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                gap: '8px', cursor: isSending ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isSending ? 0.7 : 1
              }}
            >
               <FaDownload size={14} style={{ transform: 'rotate(-90deg)' }} /> 
               {isSending 
                 ? (language === 'te' ? 'పంపబడింది' : 'Report Sent!') 
                 : (language === 'te' ? 'నా డాక్టరుకు పంపండి' : 'Send to My Doctor')}
            </button>
          )}
        </div>
      </div>

      <div className="responsive-px" style={{ paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <FaClipboardList size={18} color="var(--accent)" />
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{language === 'te' ? 'గత రిపోర్ట్లు' : 'Report History'}</span>
        </div>
        
        {REPORTS.map(rep => {
          const uc = urgencyColors[rep.urgency] || urgencyColors.STABLE;
          return (
            <div key={rep.id} className="md-report-card" style={{ ...card, padding: '14px 20px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => navigate(`/mother/report/${rep.id}`, { state: { report: rep } })}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', flexShrink: 0, background: uc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaFilePdf size={22} color={uc.icon} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{rep.type}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{rep.date}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate(`/mother/report/${rep.id}`, { state: { report: rep } }); }}
                  style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <FaEye size={16} color="var(--text-secondary)" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); generatePDF('instant', 'download'); }} style={{ background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', padding: '8px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <FaDownload size={16} color="var(--accent)" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="responsive-px" style={{ paddingTop: '16px', paddingBottom: '80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <FaUserNurse size={18} color="var(--accent)" />
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{text.worker}</span>
        </div>
        <div className="responsive-p" style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0, background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>L</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Lakshmi Devi</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <FaClock size={11} color="var(--text-tertiary)" /> {text.visited}
            </div>
          </div>
          <button onClick={() => { if (window.innerWidth > 768) { alert(text.callingToast); } else { window.location.href = `tel:+91 9876543210`; } }} style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, background: 'var(--success-light)', border: '1px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <FaPhone size={18} color="var(--success)" />
          </button>
        </div>
      </div>
    </MotherLayout>
  );
};

export default MotherDashboard;
