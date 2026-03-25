import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaHome, FaUsers, FaMapMarkedAlt, FaUser, 
  FaBell, FaHeartbeat, FaClock, FaChartLine, 
  FaFileMedical, FaDownload, FaPaperPlane, FaEye, 
  FaPhone, FaMapMarkerAlt, FaCheckCircle, FaTint,
  FaFilePdf, FaChevronRight, FaTimes, FaVial
} from 'react-icons/fa';
import { MdOutlineDarkMode, MdOutlineLightMode, MdNotificationsActive } from 'react-icons/md';
import PatientLayout from '../../layouts/PatientLayout';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { generateProfessionalReport } from '../../utils/generatePdfReport';
import { AppContext } from '../../context/AppContext';

const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'just now';
  const mins = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  return `${hours} hr${hours === 1 ? '' : 's'} ago`;
};

const FamilyDashboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const { profile } = useAuth();
  const { patients, caretakerPatient, caretakerLive, caretakerAlerts } = React.useContext(AppContext);

  const [activeTab, setActiveTab] = useState('home');
  const [isGenerating, setIsGenerating] = useState(false);

  const reportsRef = useRef(null);
  const vitalsRef = useRef(null);
  const alertsRef = useRef(null);

  const alerts = caretakerAlerts || [];

  const userName = profile?.name?.split(' ')[0] || 'Lakshmi';
  const initial = (profile?.name || 'Lakshmi').charAt(0);
  const dynamicDate = new Date().toLocaleDateString(language === 'te' ? 'te-IN' : 'en-IN', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();

  const NAV_ITEMS = [
    { id: 'home', label: 'Home', icon: FaHome },
    { id: 'patients', label: 'Patients', icon: FaUsers },
    { id: 'alerts', label: 'Alerts', icon: FaBell },
    { id: 'reports', label: 'Reports', icon: FaFileMedical },
    { id: 'profile', label: 'Profile', icon: FaUser },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (id === 'vitals') navigate('/caretaker/vitals');
    if (id === 'reports') navigate('/caretaker/reports');
    if (id === 'alerts' || id === 'alert-history') navigate('/caretaker/alerts');
    if (id === 'profile') navigate('/caretaker/profile');
    if (id === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'patients') document.getElementById('patient-track')?.scrollIntoView({ behavior: 'smooth' });
  };

  const stats = [
    { label: 'HEART RATE', value: `${Math.round(caretakerLive?.hr ?? 78)} bpm`, color: 'var(--danger)', icon: FaHeartbeat, iconBg: 'var(--danger-light)' },
    { label: 'SPO2', value: `${Math.round(caretakerLive?.spo2 ?? 98)}%`, color: 'var(--info)', icon: FaTint, iconBg: 'var(--info-light)' },
    { label: 'LAST SEEN', value: getRelativeTime(caretakerLive?.updatedAt), color: 'var(--warning)', icon: FaClock, iconBg: 'var(--warning-light)' },
  ];

  const handleDownloadPdf = (rep) => {
    setIsGenerating(true);
    const reportProfile = {
      name: caretakerPatient?.name || 'Linked Patient',
      age: caretakerPatient?.age || 0,
      patientType: caretakerPatient?.type || 'elderly',
      phc: 'Ramgarh PHC'
    };
    const reportSurvey = { aiStatus: 'STABLE', aiParagraphEnglish: `Intelligence analysis for ${rep?.month || 'March'} shows consistent cardiac health.` };
    generateProfessionalReport(reportProfile, [], reportSurvey, 'download');
    setIsGenerating(false);
  };

  return (
    <PatientLayout role="caretaker">
      <div className="layout-root">
      <style dangerouslySetInnerHTML={{__html: `
        .layout-root {
          display: flex; height: 100vh; width: 100vw;
          background: var(--bg-primary);
          font-family: var(--font-main) !important;
        }
        .static-sidebar {
          width: 240px; height: 100%; border-right: 1px solid var(--border);
          background: var(--surface); display: flex; flex-direction: column;
          flex-shrink: 0; z-index: 1000;
        }
        .main-scroll-area {
          flex: 1; height: 100%; overflow-y: auto;
          padding: 24px;
        }
        .content-width { width: 100%; max-width: 1000px; margin: 0 auto; }

        .sidebar-item {
          display: flex; align-items: center; gap: 16px;
          padding: 16px 24px; color: var(--text-tertiary);
          text-decoration: none; cursor: pointer;
          transition: all 0.2s; font-weight: 700; font-size: 14px;
        }
        .sidebar-item:hover { color: var(--accent); background: var(--bg-secondary); }
        .sidebar-item.active { 
          color: var(--accent); 
          background: var(--accent-light);
          border-right: 4px solid var(--accent);
        }

        .compact-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px; transition: all 0.2s;
        }
        .compact-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card); }

        .emergency-banner {
          background: var(--danger); border-radius: 16px;
          padding: 20px 24px; color: white; margin-bottom: 32px;
          display: flex; justify-content: space-between; align-items: center;
        }

        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }

        .action-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
        .action-chip {
           background: var(--surface); border: 1px solid var(--border);
           padding: 12px; border-radius: 12px;
           display: flex; align-items: center; gap: 10px; cursor: pointer;
        }

        .patient-monitor {
          background: var(--surface); border: 1px solid var(--border);
          padding: 16px 24px; border-radius: 20px;
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 32px;
        }

        .report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        @media (max-width: 1024px) {
           .static-sidebar { display: none; }
           .sidebar-label { display: none; }
           .stat-grid, .action-row, .report-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
           .main-scroll-area { padding: 16px !important; }
           .emergency-banner { flex-direction: column; gap: 16px; align-items: flex-start !important; }
           .emergency-banner button { width: 100%; }
           .stat-grid { grid-template-columns: 1fr !important; }
           .action-row { grid-template-columns: 1fr 1fr !important; }
           .patient-monitor { flex-direction: column; align-items: flex-start !important; gap: 16px; }
           .patient-monitor > div:last-child { width: 100%; justify-content: space-between; }
           .report-grid { grid-template-columns: 1fr !important; }
           header { flex-direction: column; align-items: flex-start !important; gap: 16px; }
        }
      `}} />

      {/* --- SIDEBAR --- */}
      <aside className="static-sidebar">
        <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <FaHeartbeat size={32} color="var(--accent)" />
          <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>MaaSathi</span>
        </div>
        
        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <div 
              key={item.id} 
              className="sidebar-item"
              onClick={() => handleNavClick(item.id)}
            >
              <item.icon size={20} />
              <span className="sidebar-label">{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ padding: '24px 0', borderTop: '1px solid var(--border)' }}>
        </div>
      </aside>

      {/* --- DASHBOARD --- */}
      <main className="main-scroll-area">
        <div className="content-width" id="dashboard-top" style={{ paddingBottom: '96px', paddingTop: 'env(safe-area-inset-top)' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
             <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '1px' }}>{dynamicDate}</div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0' }}>Namaste, {userName}</h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Monitoring {Math.max(1, patients.length)} loved one{patients.length === 1 ? '' : 's'} • Active Connection
                </p>
             </div>
             <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div onClick={() => navigate('/caretaker/profile')} style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', cursor: 'pointer' }}>
                   {initial}
                </div>
             </div>
          </header>

          <div ref={alertsRef}>
            {alerts.length > 0 && (
              <div className="emergency-banner">
                 <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <MdNotificationsActive size={28} />
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 800 }}>{alerts[0].patient}</div>
                      <div style={{ fontSize: '13px', opacity: 0.9 }}>{alerts[0].type} • {alerts[0].location || caretakerPatient?.location || 'N/A'}</div>
                    </div>
                 </div>
                 <button onClick={() => handleNavClick('alerts')} style={{ background: 'white', color: 'var(--danger)', border: 'none', padding: '10px 24px', borderRadius: '100px', fontWeight: 800, cursor: 'pointer' }}>
                    VIEW STATUS
                 </button>
              </div>
            )}
          </div>

          <div className="stat-grid" ref={vitalsRef}>
             {stats.map((stat, i) => (
               <div key={i} className="compact-card responsive-p" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', marginBottom: '4px' }}>{stat.label}</div>
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{stat.value}</div>
                  </div>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <stat.icon color={stat.color} size={20} />
                  </div>
               </div>
             ))}
          </div>

          <div style={{ marginBottom: '32px' }}>
             <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Quick Actions</h3>
             <div className="action-row">
                {[
                  { label: 'View Vitals', icon: FaChartLine, bg: 'var(--accent-light)', id: 'vitals' },
                  { label: 'View Reports', icon: FaFileMedical, bg: 'var(--info-light)', id: 'reports' },
                  { label: 'Alert History', icon: FaBell, bg: 'var(--warning-light)', id: 'alert-history' },
                  { label: 'Profile Settings', icon: FaUser, bg: 'var(--success-light)', id: 'profile' }
                ].map((act, i) => (
                   <div key={i} className="action-chip" onClick={() => handleNavClick(act.id)}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: act.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <act.icon color="var(--accent)" size={16} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>{act.label}</span>
                   </div>
                ))}
             </div>
          </div>

          <div className="patient-monitor" id="patient-track">
             <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px' }}>
                  {caretakerPatient?.initials || 'PT'}
                </div>
                <div>
                   <div style={{ fontSize: '18px', fontWeight: 800 }}>{caretakerPatient?.name || 'No linked patient'}</div>
                   <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                     {caretakerPatient ? `${caretakerPatient.age || '--'} Yrs • ${caretakerPatient.type === 'newMother' ? 'New Mother' : 'Pregnant'} • ${caretakerPatient.location || 'N/A'}` : 'Link a patient to begin'}
                   </div>
                </div>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: caretakerLive?.status === 'critical' ? 'var(--danger)' : caretakerLive?.status === 'attention' ? 'var(--warning)' : 'var(--success)' }} />
                <span style={{ fontSize: '14px', fontWeight: 800, color: caretakerLive?.status === 'critical' ? 'var(--danger)' : caretakerLive?.status === 'attention' ? 'var(--warning)' : 'var(--success)' }}>
                  {caretakerLive?.status === 'critical' ? 'HEALTH CRITICAL' : caretakerLive?.status === 'attention' ? 'NEEDS ATTENTION' : 'HEALTH STABLE'}
                </span>
             </div>
             <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    const phone = caretakerPatient?.phone;
                    if (phone) window.location.href = `tel:+91${phone}`;
                  }}
                  style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-secondary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: caretakerPatient?.phone ? 'pointer' : 'not-allowed', opacity: caretakerPatient?.phone ? 1 : 0.6 }}
                >
                  <FaPhone size={18}/>
                </button>
                <button onClick={() => navigate('/caretaker/vitals')} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaChartLine color="white" size={18}/></button>
             </div>
          </div>

          <div ref={reportsRef}>
             <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Intelligence Reports</h3>
             <div className="report-grid">
                {/* Intelligence Reports */}
                {[
                  { id: 'rep1', month: 'March', date: '24' },
                  { id: 'rep2', month: 'February', date: '17' }
                ].map(rep => (
                  <div key={rep.id} className="compact-card responsive-p" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                     <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FaFilePdf size={20} color="var(--accent)" />
                     </div>
                     <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rep.month} Summary</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Mar {rep.date}</div>
                     </div>
                     <button onClick={() => navigate(`/report/${rep.id}`)} style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-secondary)', border: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaEye size={16}/></button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </main>

      {/* --- MODALS --- */}
      </div>
    </PatientLayout>
  );
};

export default FamilyDashboard;
