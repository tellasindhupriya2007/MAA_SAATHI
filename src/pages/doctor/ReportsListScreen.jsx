import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFilePdf, FaDownload, FaSearch, FaChevronRight } from 'react-icons/fa';
import DoctorLayout from '../../layouts/DoctorLayout';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { useReports } from '../../hooks/useReports';

const MOCK_REPORTS = [
  { id: 'r1', name: 'Anjali Devi',    asha: 'Lakshmi', date: 'Today, 10:30 AM',     urgency: 'CRITICAL', status: 'New'    },
  { id: 'r2', name: 'Suhana Khatun', asha: 'Kamala',  date: 'Yesterday, 2:15 PM',  urgency: 'MODERATE', status: 'Viewed' },
  { id: 'r3', name: 'Pooja Sharma',   asha: 'Lakshmi', date: '2 days ago',          urgency: 'STABLE',   status: 'Viewed' },
  { id: 'r4', name: 'Meena Kumari',  asha: 'Kamala',  date: '3 days ago',          urgency: 'MODERATE', status: 'New'    },
  { id: 'r5', name: 'Sunita Devi',   asha: 'Lakshmi', date: '1 week ago',          urgency: 'STABLE',   status: 'Viewed' },
];

const FILTERS = ["All", "Critical", "Moderate", "Stable", "This Month"];

const ReportsListScreen = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const { reports: firestoreReports, loading } = useReports('doctor', profile?.email || profile?.uid);

  const combinedReports = React.useMemo(() => {
    const fireReports = (firestoreReports || []).map(r => ({
      ...r,
      name: r.patientName,
      asha: r.ashaName || 'N/A',
      date: r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleString() : 'Just now',
      urgency: r.urgency || r.aiStatus || 'STABLE',
      status: 'New'
    }));
    return fireReports.length === 0 ? MOCK_REPORTS : [...fireReports, ...MOCK_REPORTS];
  }, [firestoreReports]);

  const t = {
    en: {
      title: "Health Reports",
      search: "Search reports by patient...",
      asha: "ASHA",
      noReports: "No reports found matching your criteria."
    },
    te: {
      title: "ఆరోగ్య నివేదికలు",
      search: "రోగి ద్వారా నివేదికలను శోధించండి...",
      asha: "ASHA",
      noReports: "మీ ప్రాధాన్యతలకు అనుగుణంగా నివేదికలు కనుగొనబడలేదు."
    }
  };
  const text = t[language] || t.en;

  const filtered = combinedReports.filter(r => {
    const reportName = String(r.name || '').toLowerCase();
    const reportUrgency = String(r.urgency || 'STABLE').toUpperCase();
    
    const matchesFilter =
      activeFilter === "All" ? true :
      activeFilter.toUpperCase() === reportUrgency;

    const matchesSearch = reportName.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <DoctorLayout>
      <style dangerouslySetInnerHTML={{__html: `
        .rl-search:focus { border-color: var(--accent) !important; outline: none; }
        .rl-card:hover { border-color: var(--accent) !important; box-shadow: var(--shadow-card) !important; }
        .filter-scroll::-webkit-scrollbar { display: none; }
      `}} />

      {/* ── STICKY HEADER ── */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0
          }}
        >
          <FaArrowLeft size={16} color="var(--text-primary)" />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {text.title}
        </span>
      </header>

      {/* ── SEARCH + FILTERS ── */}
      <div style={{ padding: '12px 24px 0 24px' }}>
        <div style={{ position: 'relative' }}>
          <FaSearch style={{
            position: 'absolute', left: '14px', top: '50%',
            transform: 'translateY(-50%)', fontSize: '15px',
            color: 'var(--text-tertiary)', pointerEvents: 'none'
          }} />
          <input
            type="text"
            className="rl-search"
            placeholder={text.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: '48px', background: 'var(--surface)',
              border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
              paddingLeft: '44px', paddingRight: '16px', fontSize: '15px',
              fontFamily: '"DM Sans", sans-serif', color: 'var(--text-primary)',
              boxSizing: 'border-box', transition: 'border-color 0.15s'
            }}
          />
        </div>

        <div className="filter-scroll" style={{
          display: 'flex', gap: '8px', overflowX: 'auto',
          marginTop: '12px', paddingBottom: '12px'
        }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '7px 16px', borderRadius: '100px', whiteSpace: 'nowrap',
                fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                border: '1.5px solid var(--border)', transition: 'all 0.15s', flexShrink: 0,
                ...(activeFilter === f
                  ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }
                  : { background: 'transparent', color: 'var(--text-secondary)' })
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIST ── */}
      <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(rep => {
          const isCritical = rep.urgency === 'CRITICAL';
          const isModerate = rep.urgency === 'MODERATE';
          return (
            <div
              key={rep.id}
              onClick={() => navigate(`/doctor/report/${rep.id}`, { state: { report: rep } })}
              className="rl-card"
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer'
              }}
            >
              {/* Icon */}
              <div style={{
                width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                background: isCritical ? 'var(--danger-light)' : isModerate ? 'var(--warning-light)' : 'var(--success-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <FaFilePdf size={24} color={isCritical ? 'var(--danger)' : isModerate ? 'var(--warning)' : 'var(--success)'} />
              </div>

              {/* Center */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {rep.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                  {text.asha}: {rep.asha}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{rep.date}</div>
              </div>

              {/* Right */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                <span style={{
                  padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  background: isCritical ? 'var(--danger-light)' : isModerate ? 'var(--warning-light)' : 'var(--success-light)',
                  color: isCritical ? 'var(--danger)' : isModerate ? 'var(--warning)' : 'var(--success)'
                }}>
                  {rep.urgency}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: '100px', fontSize: '10px', fontWeight: 700,
                    background: rep.status === 'New' ? 'var(--accent-light)' : 'var(--success-light)',
                    color: rep.status === 'New' ? 'var(--accent)' : 'var(--success)'
                  }}>
                    {rep.status}
                  </span>
                  <FaChevronRight size={14} color="var(--text-tertiary)" />
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
            {text.noReports}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

export default ReportsListScreen;
