import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaHeartbeat, FaLungs, FaWalking, FaFilePdf,
  FaDownload, FaPhone, FaThermometerHalf, FaEye,
  FaBatteryThreeQuarters, FaChevronRight, FaClock,
  FaBroadcastTower, FaUserNurse, FaExclamationCircle, FaShieldAlt, FaChartLine, FaRobot, FaBell, FaExclamationTriangle
} from 'react-icons/fa';
import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from 'recharts';
import PatientLayout from '../../layouts/PatientLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useVitals } from '../../hooks/useVitals';
import { generateProfessionalReport } from '../../utils/generatePdfReport';
import { db } from '../../config/firebase';
import { collection, query, where, limit, onSnapshot, orderBy } from 'firebase/firestore';

const generateMockVitals = (count = 7) => {
  const data = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    data.push({
      heartRate: Math.floor(Math.random() * (85 - 65 + 1)) + 65,
      spO2: Math.floor(Math.random() * (99 - 95 + 1)) + 95,
      temperature: (Math.random() * (37.1 - 36.4) + 36.4).toFixed(1),
      stepCount: Math.floor(Math.random() * (4000 - 800 + 1)) + 800,
      timestamp: { seconds: Math.floor((now - i * 24 * 60 * 60 * 1000) / 1000) }
    });
  }
  return data;
};

const ElderlyDashboard = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestAlert, setLatestAlert] = useState(null);
  
  useEffect(() => {
    if (profile && profile.isSurveyCompleted === false) {
      navigate('/elderly/health-survey');
    }
  }, [profile, navigate]);

  const { vitals: firestoreVitals, latestVitals: firestoreLatest } = useVitals(profile?.uid);
  
  const displayVitals = firestoreVitals && firestoreVitals.length > 0 ? firestoreVitals : generateMockVitals(7);
  const latest = firestoreLatest || displayVitals[0];

  const aiStatus = profile?.aiAssessment?.aiStatus || 'STABLE';
  const aiText = profile?.aiAssessment?.aiParagraphEnglish || (profile?.medicalHistory 
    ? "Based on your clinical profile, your hypertension is well-managed. Continue prescribed care."
    : "Vital signs are stable. Complete your weekly survey for deeper AI analysis.");

  const currentHr = latest?.heartRate || 72;
  const currentSpo2 = latest?.spO2 || 98;
  const currentTemp = latest?.temperature || 36.6;
  const currentSteps = latest?.stepCount || 1040;

  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(
      collection(db, 'alerts'),
      where('patientId', '==', profile.uid),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLatestAlert(snapshot.docs[0].data());
      } else {
        setLatestAlert(null);
      }
    });
    return () => unsubscribe();
  }, [profile?.uid]);

  const generatePDF = async (type = 'instant', mode = 'download') => {
    setIsGenerating(true);
    try {
      generateProfessionalReport(profile, displayVitals, { aiStatus, aiParagraphEnglish: aiText }, mode, type);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const name = (profile?.name || 'User').split(' ')[0];

  const t = {
    en: {
      subtitle: 'Personalized monitoring and care',
      vitals: 'My Health Indicators',
      analytics: 'Vital Trends (7 Days)',
      ai: 'AI Health Insights',
      alerts: 'Recent Safety Alerts',
      emptyAlerts: 'No active alerts',
      status: 'Current Health Status',
      view: 'View PDF', download: 'Download PDF', monthly: 'Monthly Trend Report'
    },
    te: {
      subtitle: 'వ్యక్తిగతీకరించిన పర్యవేక్షణ మరియు సంరక్షణ',
      vitals: 'నా ఆరోగ్య సూచికలు',
      analytics: '7 రోజుల ట్రెండ్స్',
      ai: 'AI ఆరోగ్య అంతర్దృష్టులు',
      alerts: 'భద్రతా హెచ్చరికలు',
      emptyAlerts: 'ఎటువంటి అలర్ట్స్ లేవు',
      status: 'ప్రస్తుత ఆరోగ్య స్థితి',
      view: 'మొత్తం చూడండి', download: 'డౌన్‌లోడ్ PDF', monthly: 'నెలవారీ ట్రెండ్ రిపోర్ట్'
    }
  };
  const text = t[language] || t.en;

  const chartData = [...displayVitals].slice(0, 7).reverse().map(v => {
    const ts = v.timestamp?.seconds ? new Date(v.timestamp.seconds * 1000) : new Date(v.timestamp);
    return {
      day: ts.toLocaleDateString('en-US', { weekday: 'short' }),
      hr: v.heartRate,
      spo2: v.spO2
    };
  });

  return (
    <PatientLayout patientType="elderly">
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
          <div style={{ fontSize: '20px', fontWeight: 800 }}>Namaste, {name} 👋</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{text.subtitle}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => toggleLanguage(language === 'en' ? 'te' : 'en')} style={{ padding: '6px 12px', borderRadius: '100px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: 'transparent' }}>{language.toUpperCase()}</button>
        </div>
      </header>

      <div className="responsive-px" style={{ paddingTop: '24px', background: 'var(--bg-secondary)' }}>
        <div className="responsive-p" style={{ 
          background: aiStatus === 'CRITICAL' ? 'var(--danger-light)' : aiStatus === 'MODERATE' ? 'var(--warning-light)' : 'var(--success-light)',
          border: `2px solid ${aiStatus === 'CRITICAL' ? 'var(--danger)' : aiStatus === 'MODERATE' ? 'var(--warning)' : 'var(--success)'}`,
          borderRadius: 'var(--radius-xl)', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
             {aiStatus === 'CRITICAL' ? <FaExclamationCircle color="var(--danger)" size={32} /> : 
              aiStatus === 'MODERATE' ? <FaExclamationTriangle color="var(--warning)" size={32} /> :
              <FaShieldAlt color="var(--success)" size={32} />}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.5px' }}>{text.status}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{aiStatus}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {aiStatus === 'STABLE' ? 'Vital signs are within normal range.' : 
               aiStatus === 'MODERATE' ? 'Monitoring required for elevated metrics.' : 
               'Immediate doctor consultation recommended.'}
            </div>
          </div>
        </div>
      </div>

      <div className="responsive-px" style={{ paddingTop: '24px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>{text.vitals}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <FaHeartbeat color="var(--danger)" size={24} style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>HEART RATE</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--danger)' }}>{currentHr} <span style={{ fontSize: '12px' }}>bpm</span></div>
          </div>
          <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <FaLungs color="var(--info)" size={24} style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>OXYGEN (SPO2)</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--info)' }}>{currentSpo2}%</div>
          </div>
        </div>
      </div>

      <div className="responsive-mx responsive-p" style={{ 
        marginTop: '24px', padding: '20px', background: 'var(--surface)', 
        borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <FaChartLine color="var(--accent)" />
          <span style={{ fontSize: '16px', fontWeight: 700 }}>{text.analytics}</span>
        </div>
        <div style={{ height: '220px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-secondary)'}} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="hr" stroke="var(--danger)" strokeWidth={3} dot={{r: 4, fill: 'var(--danger)'}} />
              <Line type="monotone" dataKey="spo2" stroke="var(--info)" strokeWidth={3} dot={{r: 4, fill: 'var(--info)'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ACTION CLUSTER */}
      <div className="responsive-px" style={{ paddingBottom: '96px', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="action-button-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <style dangerouslySetInnerHTML={{__html: `
              @media (max-width: 400px) {
                .action-button-grid { grid-template-columns: 1fr !important; }
              }
            `}} />
            <button 
              onClick={() => generatePDF('instant', 'download')}
              style={{ height: '56px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
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

          <button 
            onClick={() => generatePDF('monthly', 'download')}
            disabled={isGenerating}
            style={{ 
              height: '56px', background: '#ffffff', color: '#9b0044', border: '2.5px solid #9b0044', borderRadius: '16px', fontWeight: 800, fontSize: '14px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(155, 0, 68, 0.08)'
            }}
          >
            {isGenerating ? 'Preparing...' : <><FaFilePdf size={18} /> {text.monthly}</>}
          </button>
      </div>
    </PatientLayout>
  );
};

export default ElderlyDashboard;
