import React, { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaFilePdf, FaCheckCircle, FaSearch, FaEye,
  FaClipboardList, FaMapMarkerAlt, FaBell, FaPhone, FaChevronRight
} from 'react-icons/fa';
import { MdOutlineDarkMode, MdOutlineLightMode, MdTune } from 'react-icons/md';
import DoctorLayout from '../../layouts/DoctorLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useAlerts } from '../../hooks/useAlerts';
import { generateProfessionalReport } from '../../utils/generatePdfReport';
import { AppContext } from '../../context/AppContext';

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

const alertStyles = {
  sos: { accent: themeColors.danger, bg: '#fff0f0' },
  fall: { accent: '#d97706', bg: '#fffbeb' },
  critical: { accent: themeColors.primary, bg: '#fff1f2' },
  abnormalVitals: { accent: themeColors.danger, bg: '#fff0f0' }
};

const withUnit = (value, unit = '') => {
  if (value === undefined || value === null || value === '') return 'N/A';
  if (typeof value === 'number') return `${value}${unit}`;
  const raw = String(value).trim();
  if (!raw) return 'N/A';
  if (/^-?\d+(\.\d+)?$/.test(raw)) return `${raw}${unit}`;
  return raw;
};

const toDoctorPatientType = (type = '') => {
  if (type === 'elderly') return 'elderly';
  if (type === 'wellness') return 'wellness';
  if (type === 'pregnant' || type === 'newMother' || type === 'mother') return 'pregnant';
  return 'wellness';
};

const toDoctorUrgency = (risk = '') => {
  const normalized = String(risk || '').toUpperCase();
  if (normalized === 'HIGH' || normalized === 'CRITICAL') return 'CRITICAL';
  if (normalized === 'MED' || normalized === 'MODERATE') return 'MODERATE';
  return 'STABLE';
};

const MOCK_ALERTS = [
  { 
    id: 'al1', name: 'Sunita Devi', type: 'Ring SOS', alertStyle: 'sos', time: '10m ago', 
    location: 'House 42, Ramgarh', trigger: 'Ring SOS button pressed', 
    patientType: 'mother', phone: '+91 9876543210',
    patient: { age: '24', weeks: '28', phone: '+91 9876543210' },
    vitals: {
      hr: '110 bpm',
      spo2: '96%',
      roomTemp: '26.4 °C',
      roomHumidity: '54%',
      bodyTemp: '36.8 °C'
    }
  },
  { 
    id: 'al2', name: 'Ram Singh', type: 'Fall Detected', alertStyle: 'fall', time: '1h ago', 
    location: 'House 18, Sila', trigger: 'Accelerometer sensor trigger', 
    patientType: 'elderly', phone: '+91 9988776655',
    patient: { age: '68', weeks: '0', phone: '+91 9988776655' },
    vitals: {
      hr: '82 bpm',
      spo2: '98%',
      roomTemp: '24.9 °C',
      roomHumidity: '51%',
      bodyTemp: '36.6 °C'
    }
  }
];

const PDF_REPORTS = [
  { id: 'r1', name: 'Anjali Devi', age: '24', asha: 'Lakshmi', date: 'Today, 10:30 AM', urgency: 'CRITICAL', patientType: 'pregnant', phc: 'Ramgarh PHC' },
  { id: 'r2', name: 'Gopal Krishan', age: '72', asha: 'N/A', date: '2 hours ago', urgency: 'STABLE', patientType: 'elderly', phc: 'Main Ramgarh' },
  { id: 'r3', name: 'Meena Kumari', age: '28', asha: 'Kamla', date: 'Yesterday', urgency: 'MODERATE', patientType: 'pregnant', phc: 'Sila PHC' },
];

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { patients } = useContext(AppContext);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);

  const { alerts: firestoreAlerts } = useAlerts('doctor');

  const combinedAlerts = useMemo(() => {
    const fireAlerts = (firestoreAlerts || []).map(a => ({
      ...a,
      name: a.patientName || 'Unknown Patient',
      type: a.type === 'abnormalVitals' ? 'Abnormal Vitals' : a.type || 'Alert',
      alertStyle: a.type === 'abnormalVitals' ? 'abnormalVitals' : 'critical',
      time: a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
      location: a.location || 'Unknown Village',
      trigger: a.message || 'Health report triggered alert',
      patientType: a.patientType || 'mother',
      phone: a.patientPhone || a.phone || '+91 9999999999',
      patient: {
        age: a.patientAge || a.age || '25',
        weeks: a.weeksPregnant || '28',
        phone: a.patientPhone || a.phone || '+91 9999999999'
      },
      vitals: {
        hr: withUnit(a.heartRate ?? a.hr ?? a?.vitals?.hr, ' bpm'),
        spo2: withUnit(a.oxygen ?? a.spo2 ?? a?.vitals?.spo2, '%'),
        roomTemp: withUnit(a.roomTemp ?? a.roomTemperature ?? a.temperature ?? a?.vitals?.roomTemp, ' °C'),
        roomHumidity: withUnit(a.roomHumidity ?? a.humidity ?? a?.vitals?.roomHumidity ?? a?.vitals?.humidity, '%'),
        bodyTemp: withUnit(a.bodyTemp ?? a.bodyTemperature ?? a?.vitals?.bodyTemp, ' °C')
      }
    }));
    return fireAlerts.length === 0 ? MOCK_ALERTS : [...fireAlerts, ...MOCK_ALERTS];
  }, [firestoreAlerts]);

  const contextReports = useMemo(() => {
    return (patients || []).map((patient) => ({
      id: `ctx-${patient.id}`,
      name: patient.name || 'Unknown',
      age: String(patient.age || '--'),
      asha: patient.ashaWorker || 'Local Sync',
      date: patient.date || 'Recently added',
      urgency: toDoctorUrgency(patient.risk),
      patientType: toDoctorPatientType(patient.type),
      phc: patient.village ? `${patient.village} PHC` : 'Local PHC'
    }));
  }, [patients]);

  const handleViewReport = (rep) => {
    navigate(`/report/${rep.id}`);
  };

  const filteredAlerts = combinedAlerts.filter(a => activeFilter === 'All' || a.patientType === activeFilter);
  const allReports = useMemo(() => {
    const reportById = new Map();
    [...contextReports, ...PDF_REPORTS].forEach((report) => {
      const key = String(report.name || report.id || '').toLowerCase();
      if (!reportById.has(key)) {
        reportById.set(key, report);
      }
    });
    return Array.from(reportById.values());
  }, [contextReports]);

  const filteredReports = allReports.filter(r => activeFilter === 'All' || (activeFilter === 'mother' && r.patientType === 'pregnant') || r.patientType === activeFilter);

  const t = {
    en: {
      hi: "Welcome back,", active: "Active Alerts", reports: "Intelligence Reports", 
      all: "All Patients", mothers: "Mothers", elderly: "Elderly", wellness: "Wellness",
      pending: "Pending", resolved: "Resolved", received: "Received",
      viewDetails: "View Details", call: "Call", noAlerts: "No active alerts in this category."
    },
    te: {
      hi: "తిరిగి స్వాగతం,", active: "సక్రియ హెచ్చరికలు", reports: "రిపోర్ట్లు",
      all: "అందరూ", mothers: "తల్లులు", elderly: "వృద్ధులు", wellness: "వెల్నెస్",
      pending: "పెండింగ్", resolved: "పరిష్కరించబడినవి", received: "అందుకున్నవి",
      viewDetails: "వివరాలు", call: "కాల్", noAlerts: "హెచ్చరికలు లేవు."
    }
  };
  const text = t[language] || t.en;

  const drName = profile?.name || 'Dr. Sharma';
  const phcName = profile?.phc || 'Main Ramgarh';

  return (
    <DoctorLayout>
      <div style={{ background: themeColors.bg, minHeight: '100dvh', fontFamily: '"Manrope", "Inter", sans-serif', color: themeColors.textMain, overflowX: 'hidden' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 1024px) {
            .doctor-header { padding: 16px 20px !important; }
            .doctor-main { padding: 24px 20px !important; }
            .doctor-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
            .doctor-filter-bar { flex-direction: column !important; gap: 24px !important; }
            .doctor-stats { justify-content: flex-start !important; width: 100% !important; }
          }
          @media (max-width: 640px) {
            .doctor-filters { overflow-x: auto !important; padding-bottom: 8px !important; width: 100% !important; }
            .filter-btn { white-space: nowrap !important; }
          }
        `}} />
        
        <header className="doctor-header" style={{ 
          background: themeColors.surface, borderBottom: `1px solid ${themeColors.surfaceHigh}`, 
          padding: '24px 40px', position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 'calc(24px + env(safe-area-inset-top))'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: themeColors.textTertiary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
              {phcName} PHC • Active
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Dr. {drName}</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', background: themeColors.surfaceLow, borderRadius: '100px', padding: '3px' }}>
              {['en', 'te'].map(l => (
                <button 
                  key={l} onClick={() => toggleLanguage(l)}
                  style={{ 
                    padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: 'none',
                    background: language === l ? themeColors.primary : 'transparent',
                    color: language === l ? 'white' : themeColors.textMuted, cursor: 'pointer'
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="doctor-main" style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          
          <div className="doctor-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', gap: '24px' }}>
            <div className="doctor-filters" style={{ display: 'flex', gap: '8px' }}>
              {[
                {id: 'All', l: text.all}, {id: 'mother', l: text.mothers}, 
                {id: 'elderly', l: text.elderly}, {id: 'wellness', l: text.wellness}
              ].map(f => (
                <button 
                  key={f.id} onClick={() => setActiveFilter(f.id)}
                  className="filter-btn"
                  style={{ 
                    padding: '10px 20px', borderRadius: '14px', fontSize: '13px', fontWeight: 700,
                    border: 'none', transition: 'all 0.2s', cursor: 'pointer',
                    background: activeFilter === f.id ? themeColors.primary : themeColors.surface,
                    color: activeFilter === f.id ? 'white' : themeColors.textMuted,
                    boxShadow: activeFilter === f.id ? `0 8px 16px ${themeColors.primary}15` : 'none'
                  }}
                >
                  {f.l}
                </button>
              ))}
            </div>

            <div className="doctor-stats" style={{ display: 'flex', gap: '24px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: themeColors.primary }}>{filteredAlerts.length}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: themeColors.textTertiary, textTransform: 'uppercase' }}>{text.pending}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: themeColors.success }}>{filteredReports.length}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: themeColors.textTertiary, textTransform: 'uppercase' }}>{text.received}</div>
              </div>
            </div>
          </div>

          <div className="doctor-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '60px' }}>
            
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: themeColors.danger }} />
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{text.active}</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {filteredAlerts.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: themeColors.textTertiary, background: themeColors.surface, borderRadius: '24px' }}>
                    {text.noAlerts}
                  </div>
                ) : filteredAlerts.map(alert => {
                   const aS = alertStyles[alert.alertStyle] || alertStyles.sos;
                   return (
                     <div 
                       key={alert.id}
                       style={{ 
                         background: themeColors.surface, borderRadius: '24px', padding: '32px',
                         boxShadow: '0 4px 6px rgba(0,0,0,0.01)', transition: 'all 0.3s'
                       }}
                     >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: aS.accent, letterSpacing: '1px' }}>
                              {alert.type} • {alert.time}
                            </span>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0' }}>{alert.name}</h3>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                             <button 
                               onClick={() => window.location.href = `tel:${alert.phone}`}
                               style={{ width: '44px', height: '44px', borderRadius: '50%', background: themeColors.bg, color: themeColors.textMain, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                             >
                               <FaPhone size={16} />
                             </button>
                             <button 
                               onClick={() => alert(`SOS Sent to ${alert.name}`)}
                               style={{ width: '44px', height: '44px', borderRadius: '50%', background: aS.bg, color: aS.accent, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                             >
                               <FaBell size={16} />
                             </button>
                          </div>
                        </div>

                        <p style={{ color: themeColors.textMuted, fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
                          <FaMapMarkerAlt size={12} style={{ marginRight: '6px' }} />
                          {alert.location} — {alert.trigger}
                        </p>

                        <button 
                          onClick={() => navigate(`/doctor/alert/${alert.id}`, { state: { alert } })}
                          style={{ 
                            width: '100%', height: '52px', border: 'none', borderRadius: '14px',
                            background: themeColors.surfaceLow, color: themeColors.textMain,
                            fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', gap: '8px'
                          }}
                        >
                          {text.viewDetails} <FaChevronRight size={12} />
                        </button>
                     </div>
                   );
                })}
              </div>
            </section>

            <aside>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{text.reports}</h2>
              </div>

              <div style={{ background: themeColors.surface, borderRadius: '24px', padding: '32px' }}>
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                  <FaSearch style={{ position: 'absolute', left: '16px', top: '16px', color: themeColors.textTertiary }} />
                  <input 
                    type="text" placeholder="Patient Intelligence Search..."
                    style={{ 
                      width: '100%', height: '48px', background: themeColors.bg, border: 'none',
                      borderRadius: '12px', paddingLeft: '48px', paddingRight: '16px',
                      fontSize: '14px', color: themeColors.textMain, outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {filteredReports.map(rep => (
                    <div key={rep.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid transparent', borderRadius: '16px', transition: 'all 0.2s' }} className="report-row">
                       <style dangerouslySetInnerHTML={{__html: `.report-row:hover { border-color: ${themeColors.surfaceHigh}; background: ${themeColors.surfaceLow}; }`}} />
                       <div>
                          <div style={{ fontSize: '15px', fontWeight: 700 }}>{rep.name}</div>
                          <div style={{ fontSize: '12px', color: themeColors.textTertiary }}>{rep.date} • {rep.phc}</div>
                          <div style={{ display: 'inline-block', marginTop: '4px', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', 
                            background: rep.urgency === 'CRITICAL' ? themeColors.danger + '20' : themeColors.success + '20',
                            color: rep.urgency === 'CRITICAL' ? themeColors.danger : themeColors.success }}>
                            {rep.urgency}
                          </div>
                       </div>
                       <button 
                         onClick={() => handleViewReport(rep)}
                         disabled={isGenerating}
                         style={{ width: '40px', height: '40px', borderRadius: '50%', background: themeColors.bg, color: themeColors.primary, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                         <FaEye size={16} />
                       </button>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

          </div>
        </main>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
