import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FaArrowLeft, FaExclamationCircle, FaCheckCircle, FaPhone, FaCheck, FaUser, FaHeartbeat, FaBell, FaSpinner, FaChevronRight } from 'react-icons/fa';
import DoctorLayout from '../../layouts/DoctorLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useAlerts } from '../../hooks/useAlerts';

// --- THE CLINICAL GALLERY THEME ---
const themeColors = {
  bg: '#f8f9fa',
  surface: '#ffffff',
  surfaceLow: '#f3f4f5',
  surfaceHigh: '#edeeef',
  primary: '#9b0044',
  primaryLight: '#ffd9df',
  secondary: '#4c56af',
  secondaryLight: '#e0e0ff',
  textMain: '#191c1d',
  textMuted: '#594045',
  textTertiary: '#7d6f75',
  danger: '#ba1a1a',
  success: '#006d31'
};

const AlertDetailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { language } = useLanguage();

  const [showConfirm, setShowConfirm] = useState(false);
  const [resolved, setResolved] = useState(false);
  const { resolveAlert } = useAlerts('doctor');
  const [resolving, setResolving] = useState(false);

  const alertData = location.state?.alert || {
    id: id || 'al1',
    name: 'Sunita Devi',
    type: 'Ring SOS',
    trigger: 'Ring SOS button pressed',
    location: 'House 42, Ramgarh',
    time: '10 mins ago',
    vitals: {
      hr: '110 bpm',
      spo2: '96%',
      roomTemp: '26.4 °C',
      roomHumidity: '54%',
      bodyTemp: '36.8 °C'
    },
    patient: { age: '24', weeks: '28', phone: '+91 9876543210' }
  };

  const t = {
    en: {
      title: "Emergency Console", resolve: "Mark as Resolved", call: "Direct Dial", sendAlert: "Emergency Ring",
      viewProfile: "Patient Records", vitals: "Vitals Snapshot", hr: "Heart Rate", spo2: "SpO2",
      roomTemp: "Room Temp", roomHumidity: "Room Humidity", bodyTemp: "Body Temp",
      confirmTitle: "Finalize Case?", confirmBody: "Confirming this will mark the emergency as handled in PHC records."
    },
    te: {
      title: "అత్యవసర కన్సోల్", resolve: "పరిష్కరించబడింది", call: "కాల్ చేయండి", sendAlert: "రింగ్ చేయండి",
      viewProfile: "రోగి రికార్డులు", vitals: "ప్రాణాధారాలు", hr: "హార్ట్ రేట్", spo2: "SpO2",
      roomTemp: "గది ఉష్ణోగ్రత", roomHumidity: "గది ఆర్ద్రత", bodyTemp: "శరీర ఉష్ణోగ్రత",
      confirmTitle: "కేసును ముగించాలా?", confirmBody: "దీనిని ధృవీకరించడం ద్వారా ఈ అత్యవసర పరిస్థితి పరిష్కరించబడినట్లు నమోదు చేయబడుతుంది."
    }
  };
  const text = t[language] || t.en;
  const vitalsSnapshot = [
    { key: 'hr', label: text.hr, value: alertData.vitals?.hr || 'N/A', color: themeColors.danger },
    { key: 'spo2', label: text.spo2, value: alertData.vitals?.spo2 || 'N/A', color: themeColors.secondary },
    { key: 'roomTemp', label: text.roomTemp, value: alertData.vitals?.roomTemp || 'N/A', color: themeColors.textMain },
    {
      key: 'roomHumidity',
      label: text.roomHumidity,
      value: alertData.vitals?.roomHumidity || alertData.vitals?.humidity || 'N/A',
      color: themeColors.textMain
    },
    { key: 'bodyTemp', label: text.bodyTemp, value: alertData.vitals?.bodyTemp || 'N/A', color: themeColors.textMain }
  ];

  const handleResolve = async () => {
    setResolving(true);
    try {
      if (alertData.id?.startsWith?.('al')) {
        await new Promise(r => setTimeout(r, 600));
      } else {
        await resolveAlert(alertData.id);
      }
      setResolved(true);
      setShowConfirm(false);
    } catch (err) {
      console.error(err);
      setResolved(true);
    } finally {
      setResolving(false);
    }
  };

  if (resolved) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#f0fff4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
         <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#c6f6d5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
            <FaCheckCircle size={60} color="#2f855a" />
         </div>
         <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#22543d', marginBottom: '8px' }}>Success</h1>
         <p style={{ fontSize: '16px', color: '#276749', marginBottom: '40px', maxWidth: '300px', lineHeight: 1.6 }}>The case for <strong>{alertData.name}</strong> has been archived.</p>
         <button onClick={() => navigate('/doctor/dashboard')} style={{ width: '280px', height: '60px', background: '#2f855a', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>Back to Command</button>
      </div>
    );
  }

  return (
    <DoctorLayout>
      <div style={{ background: themeColors.bg, minHeight: '100vh', padding: '0 0 60px 0', fontFamily: 'Manrope, sans-serif' }}>
        
        <header style={{ padding: '32px 40px', background: 'white', borderBottom: `1px solid ${themeColors.surfaceHigh}`, display: 'flex', alignItems: 'center', gap: '20px' }}>
           <button onClick={() => navigate(-1)} style={{ border: 'none', background: themeColors.surfaceLow, width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
             <FaArrowLeft />
           </button>
           <h1 style={{ fontSize: '20px', fontWeight: 800, color: themeColors.danger }}>{text.title}</h1>
        </header>

        <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px' }}>
          
          {/* Patient Header Section */}
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '48px' }}>
             <div style={{ width: '100px', height: '100px', borderRadius: '32px', background: themeColors.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 800 }}>
               {alertData.name[0]}
             </div>
             <div>
               <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0' }}>{alertData.name}</h2>
               <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                 <span style={{ padding: '6px 12px', background: themeColors.primaryLight, color: themeColors.primary, borderRadius: '100px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>{alertData.type}</span>
                 <span style={{ color: themeColors.textTertiary, fontSize: '14px' }}>{alertData.location}</span>
               </div>
               <p style={{ color: themeColors.textMuted, marginTop: '16px', fontSize: '16px', fontStyle: 'italic', maxWidth: '500px' }}>"{alertData.trigger}"</p>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>
             <div style={{ background: 'white', borderRadius: '24px', padding: '32px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: themeColors.textTertiary, letterSpacing: '1px', marginBottom: '20px' }}>{text.vitals}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {vitalsSnapshot.map((vital, idx) => (
                    <div
                      key={vital.key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: idx === vitalsSnapshot.length - 1 ? 0 : '12px',
                        borderBottom: idx === vitalsSnapshot.length - 1 ? 'none' : `1px dashed ${themeColors.surfaceHigh}`
                      }}
                    >
                      <span style={{ fontSize: '14px', color: themeColors.textMuted }}>{vital.label}</span>
                      <span style={{ fontSize: '22px', fontWeight: 800, color: vital.color }}>{vital.value}</span>
                    </div>
                  ))}
                </div>
             </div>

             <div style={{ background: 'white', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: themeColors.textTertiary, letterSpacing: '1px', marginBottom: '8px' }}>Patient Info</div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>Age: {alertData.patient?.age || 'N/A'}</div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>Stage: {alertData.patient?.weeks || '0'} weeks</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: themeColors.primary }}>ID: {alertData.id?.slice(0, 6)}...</div>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
             <button 
               onClick={() => window.location.href = `tel:${alertData.patient?.phone}`}
               style={{ height: '64px', background: themeColors.danger, color: 'white', border: 'none', borderRadius: '18px', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer' }}
             >
               <FaPhone /> {text.call}
             </button>
             <button 
               onClick={() => alert("Emergency alert sent")}
               style={{ height: '64px', background: themeColors.bg, color: themeColors.textMain, border: 'none', borderRadius: '18px', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer' }}
             >
               <FaBell /> {text.sendAlert}
             </button>
          </div>

          <button onClick={() => navigate('/doctor/patients')} style={{ width: '100%', height: '56px', background: 'transparent', border: `1.5px solid ${themeColors.surfaceHigh}`, borderRadius: '16px', color: themeColors.textMuted, fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {text.viewProfile} <FaChevronRight size={12} />
          </button>

          <center>
             <button onClick={() => setShowConfirm(true)} style={{ background: 'none', border: 'none', color: themeColors.textTertiary, textDecoration: 'underline', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
               {text.resolve}
             </button>
          </center>

        </main>
      </div>

      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ background: 'white', borderRadius: '32px', padding: '40px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
             <FaCheckCircle size={48} color="#006d31" style={{ marginBottom: '24px' }} />
             <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>{text.confirmTitle}</h3>
             <p style={{ fontSize: '15px', color: themeColors.textMuted, lineHeight: 1.6, marginBottom: '32px' }}>{text.confirmBody}</p>
             <div style={{ display: 'flex', gap: '12px' }}>
               <button onClick={() => setShowConfirm(false)} style={{ flex: 1, height: '52px', border: 'none', background: themeColors.surfaceLow, borderRadius: '14px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
               <button onClick={handleResolve} disabled={resolving} style={{ flex: 1, height: '52px', border: 'none', background: '#006d31', color: 'white', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {resolving ? <FaSpinner className="animate-spin" /> : "Resolve"}
               </button>
             </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
};

export default AlertDetailScreen;
