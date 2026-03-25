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
import { useReports } from '../../hooks/useReports';
import { generateInstantReport, generateMonthlyReport } from '../../utils/generatePdfReport';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS, validateFirestoreDocument } from '../../config/firebaseSchema';

const REPORTS = [
  { id: 'r1', type: 'Antenatal Checkup', date: '12 Mar 2026', urgency: 'STABLE'   },
  { id: 'r2', type: 'Antenatal Checkup', date: '01 Feb 2026', urgency: 'MODERATE' },
];

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

const getRelativeTime = (value) => {
  const ts =
    typeof value?.toMillis === 'function'
      ? value.toMillis()
      : typeof value?.seconds === 'number'
        ? value.seconds * 1000
        : Number(value);

  if (!Number.isFinite(ts)) return 'No live vitals yet';
  const diffMs = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Updated just now';
  if (mins < 60) return `Updated ${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  return `Updated ${hrs} hr${hrs === 1 ? '' : 's'} ago`;
};

const formatVital = (value, digits = 0) =>
  Number.isFinite(value) ? Number(value).toFixed(digits) : '--';

const urgencyColors = {
  STABLE:   { bg: 'var(--success-light)', color: 'var(--success)', icon: 'var(--success)' },
  MODERATE: { bg: 'var(--warning-light)', color: 'var(--warning)', icon: 'var(--warning)' },
  CRITICAL: { bg: 'var(--danger-light)',  color: 'var(--danger)',  icon: 'var(--danger)'  },
};

const MotherDashboard = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const { profile, updateProfile } = useAuth();
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
  const vitalsCandidates = React.useMemo(
    () => [profile?.patientId, profile?.uid, 'patient_demo'],
    [profile?.patientId, profile?.uid]
  );
  const { vitals, latestVitals } = useVitals(vitalsCandidates);
  const { surveys } = useSurveys(profile?.uid);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const { reports: firestoreReports } = useReports('patient', profile?.uid);
  const latestSurvey = surveys && surveys.length > 0 ? surveys[0] : null;

  const displayReports = React.useMemo(() => {
    const fireReports = (firestoreReports || []).map(r => ({
      ...r,
      type: r.type || 'Health Assessment',
      date: r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : 'Just now',
      urgency: r.urgency || r.aiStatus || 'STABLE'
    }));
    return fireReports.length === 0 ? REPORTS : fireReports;
  }, [firestoreReports, latestSurvey]);

  const rawVitals = vitals && vitals.length > 0 ? vitals : [];
  const displayVitals = rawVitals.map(normalizeVitalsEntry);
  const latest = normalizeVitalsEntry(latestVitals || rawVitals[0] || {});
  const ringConnected = displayVitals.length > 0;
  const batteryPct = Number.isFinite(latest.battery) ? Math.round(latest.battery) : null;

  const currentHr = latest.heartRate;
  const currentSpo2 = latest.spO2;
  const currentBodyTemp = latest.bodyTemperature;
  const currentRoomTemp = latest.roomTemperature;
  const currentRoomHumidity = latest.roomHumidity;

  const generatePDF = async (type, mode = 'download') => {
    console.log(`[REPORTS] Generating ${type} report in ${mode} mode...`);
    showToast(language === 'te' ? 'నివేదికను సిద్ధం చేస్తోంది...' : 'Preparing your report...');
    setIsGenerating(true);
    
    // Safety timeout to reset state if something goes wrong
    const timer = setTimeout(() => {
      setIsGenerating(false);
    }, 5000);

    try {
      const vitalsToUse = vitals || [];
      
      if (type === 'instant') {
        generateInstantReport(profile, vitalsToUse, latestSurvey, mode);
      } else {
        generateMonthlyReport(profile, vitalsToUse, latestSurvey, mode);
      }
      setReportGenerated(true);
      console.log(`[REPORTS] ${type} report generation successful.`);
    } catch (err) {
      console.error("[REPORTS] PDF generation error:", err);
      alert("Something went wrong while generating the PDF. Please try again.");
    } finally {
      clearTimeout(timer);
      setIsGenerating(false);
    }
  };

  const handleSendToDoctor = async (e) => {
    e.preventDefault();
    if (isSending) return;

    let targetEmail = profile?.linkedDoctorEmail;
    
    if (!targetEmail) {
      const email = prompt("Link a Doctor: Enter your doctor's email:");
      if (!email || !email.includes('@')) {
        alert("Please provide a valid doctor email.");
        return;
      }
      targetEmail = email.toLowerCase().trim();
    }

    setIsSending(true);
    try {
      const reportData = {
        patientId: profile?.uid || 'unknown',
        patientName: profile?.name || 'Unknown Patient',
        patientType: 'pregnant',
        doctorEmail: targetEmail,
        type: 'Monthly Health Report',
        urgency: latestSurvey?.aiStatus || 'STABLE',
        aiStatus: latestSurvey?.aiStatus || 'STABLE',
        aiParagraphEnglish: latestSurvey?.aiParagraphEnglish || 'Patient health profile shared.',
        createdAt: serverTimestamp()
      };

      // Validate before sending
      validateFirestoreDocument('reports', reportData);

      // Save report to firestore for the doctor
      await addDoc(collection(db, COLLECTIONS.reports), reportData);

      // Link doctor if not already linked
      if (!profile?.linkedDoctorEmail) {
        await updateProfile({ linkedDoctorEmail: targetEmail });
      }

      showToast(`Report sent successfully to ${targetEmail}`);
      setReportGenerated(false); // Reset to hide the button after success
    } catch (err) {
      console.error("[REPORTS] Detailed error:", err);
      // If it's a schema validation error, show it clearly
      const msg = err.message || "Failed to send report.";
      alert(`Error: ${msg}\n\nPlease check if your doctor's email is correct and try again.`);
    } finally {
      setIsSending(false);
    }
  };

  const name     = (profile?.name || 'Sunita').split(' ')[0];
  const initials = (profile?.name || 'Sunita').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const photoURL = !avatarErr ? (profile?.photoURL || '') : '';

  const t = {
    en: {
      subtitle: 'Your health, monitored daily',
      vitals: 'My Vitals Today',
      hr: 'HEART RATE', spo2: 'BLOOD OXYGEN',
      roomTemp: 'ROOM TEMP', roomHumidity: 'ROOM HUMIDITY', bodyTemp: 'BODY TEMP',
      analytics: 'Vital Trends (7 Days)',
      stable: '● STABLE', low: '● LOW', goal: 'of 5,000 goal',
      tempTitle: 'Temperature', tempSub: 'Last 3 readings',
      historyTitle: 'Vitals History', last7: 'Last 7 days',
      bpmLabel: 'BPM Over 7 Days', bpmToday: `${currentHr} bpm today`,
      reports: 'Health Reports',
      worker: 'My Health Worker', visited: 'Last visited 2 days ago',
      ring: 'Ring Connected', ringOff: 'Ring not connected',
      connected: 'CONNECTED', view: 'View PDF', download: 'Download PDF',
      monthly: 'Download Monthly Report'
    },
    te: {
      subtitle: 'మీ ఆరోగ్యం, ప్రతిరోజూ పర్యవేక్షించబడుతుంది',
      vitals: 'ఈ రోజు నా ప్రాణాధారాలు',
      hr: 'హృదయ స్పందన', spo2: 'రక్తంలో ఆక్సిజన్',
      roomTemp: 'గది ఉష్ణోగ్రత', roomHumidity: 'గది ఆర్ద్రత', bodyTemp: 'శరీర ఉష్ణోగ్రత',
      analytics: '7 రోజుల వైటల్ ట్రెండ్స్',
      stable: '● స్థిరంగా', low: '● తక్కువ', goal: '5,000 లక్ష్యంలో',
      tempTitle: 'ఉష్ణోగ్రత', tempSub: 'చివరి 3 రీడింగులు',
      historyTitle: 'ప్రాణాధారాల చరిత్ర', last7: 'గత 7 రోజులు',
      bpmLabel: '7 రోజులు BPM', bpmToday: `${currentHr} bpm ఈరోజు`,
      reports: 'ఆరోగ్య నివేదికలు',
      worker: 'నా ఆరోగ్య కార్యకర్త', visited: '2 రోజుల క్రితం సందర్శించారు',
      ring: 'రింగ్ కనెక్ట్ చేయబడింది', ringOff: 'రింగ్ కనెక్ట్ కాలేదు',
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
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, background: ringConnected ? 'var(--success-light)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaBroadcastTower size={20} color={ringConnected ? 'var(--success)' : 'var(--text-tertiary)'} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: ringConnected ? 'var(--success)' : 'var(--text-tertiary)' }}> {ringConnected ? text.ring : text.ringOff} </div>
            {ringConnected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <FaBatteryThreeQuarters size={14} color="var(--success)" />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {batteryPct !== null ? `Battery ${batteryPct}%` : 'Battery N/A'}
                </span>
              </div>
            )}
          </div>
        </div>
        {ringConnected && (
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
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {getRelativeTime(latest.timestamp ?? latest.timestampMs)}
          </span>
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
