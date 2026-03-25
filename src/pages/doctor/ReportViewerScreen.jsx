import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FaArrowLeft, FaFilePdf, FaDownload, FaCheckCircle, FaUser, FaMicrophone, FaPlay } from 'react-icons/fa';
import DoctorLayout from '../../layouts/DoctorLayout';
import { useLanguage } from '../../context/LanguageContext';
import { generateProfessionalReport } from '../../utils/generatePdfReport';

const ReportViewerScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { language } = useLanguage();

  const report = location.state?.report || {
    id: id || 'r2',
    name: 'Suhana Khatun',
    asha: 'Kamala',
    date: 'Yesterday, 2:15 PM',
    urgency: 'MODERATE',
    status: 'Viewed',
    medicalHistory: null
  };

  const dummyData = {
    age: report.patientAge || '22',
    village: report.phcLocation || 'Sila village',
    asha: report.ashaName || 'Kamala',
    responses: [], // Handled by medicalHistory loop
    aiAnalysis: {
      summary: report.aiParagraphEnglish || "Initial AI assessment for the patient based on shared health parameters. Vitals trends are being monitored for anomalies.",
      dangerFlags: report.aiFlags || (report.urgency === 'CRITICAL' ? ["Abnormal Vital Signs Detected", "High Risk Score"] : []),
      recommendations: [
        "Monitor blood pressure daily",
        "Maintain regular diet and hydration",
        "Consult PHC if symptoms persist"
      ]
    },
    voiceNoteText: "No voice note attached."
  };

  const t = {
    en: {
      title: "Health Report",
      review: "Mark as Reviewed",
      download: "Download PDF",
      summary: "Patient Summary",
      responses: "Survey Responses",
      ai: "AI Health Analysis",
      flags: "Danger Flags",
      rec: "Doctor Recommendations",
      voice: "ASHA Voice Note",
      recordedIn: "Recorded in Telugu"
    },
    te: {
      title: "ఆరోగ్య నివేదిక",
      review: "సమీక్షించినట్లు గుర్తించండి",
      download: "PDF డౌన్‌లోడ్ చేయండి",
      summary: "రోగి సారాంశం",
      responses: "సర్వే సమాధానాలు",
      ai: "AI ఆరోగ్య విశ్లేషణ",
      flags: "ప్రమాద సంకేతాలు",
      rec: "డాక్టర్ సిఫార్సులు",
      voice: "ASHA వాయిస్ నోట్",
      recordedIn: "తెలుగులో రికార్డ్ చేయబడింది"
    }
  };
  const text = t[language] || t.en;

  const handleDownload = () => {
    generateProfessionalReport({
      name: report.name,
      medicalHistory: report.medicalHistory,
      patientType: report.patientType || 'mother'
    }, 'instant', 'download');
  };

  const handleReview = () => {
    alert("Report marked as reviewed and archived.");
    navigate(-1);
  };

  const isCritical = report.urgency === 'CRITICAL';
  const isModerate = report.urgency === 'MODERATE';

  const sectionStyle = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px'
  };

  const labelStyle = {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '4px'
  };

  return (
    <DoctorLayout>
      {/* ── STICKY HEADER ── */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        </div>
        <span style={{
          padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.5px',
          background: isCritical ? 'var(--danger-light)' : isModerate ? 'var(--warning-light)' : 'var(--success-light)',
          color: isCritical ? 'var(--danger)' : isModerate ? 'var(--warning)' : 'var(--success)'
        }}>
          {report.urgency}
        </span>
      </header>

      <div style={{ padding: '20px 24px 40px 24px' }}>
        
        {/* ── PATIENT SUMMARY CARD ── */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <FaUser style={{ color: 'var(--info)' }} />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>{text.summary}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Patient Name</label>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>{report.name}</div>
            </div>
            <div>
              <label style={labelStyle}>ASHA Worker</label>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>{dummyData.asha}</div>
            </div>
            <div>
              <label style={labelStyle}>Age</label>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>{dummyData.age} Years</div>
            </div>
            <div>
              <label style={labelStyle}>Village</label>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>{dummyData.village}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Report Date</label>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{report.date}</div>
            </div>
          </div>
        </div>

        {/* ── SURVEY RESPONSES (Dynamic from Medical History) ── */}
        <div style={sectionStyle}>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>{text.responses}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {report.medicalHistory ? (
              Object.entries(report.medicalHistory).map(([q, a], i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{q}</span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{a}</span>
                </div>
              ))
            ) : dummyData.responses.length > 0 ? (
              dummyData.responses.map((res, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', flex: 1 }}>{res.q}</span>
                  <span style={{
                    fontSize: '14px', fontWeight: 600, flex: 1, textAlign: 'right',
                    color: res.danger ? 'var(--danger)' : 'var(--text-primary)'
                  }}>{res.a}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px' }}>
                No detailed survey responses shared in this report.
              </div>
            )}
          </div>
        </div>

        {/* ── AI ANALYSIS ── */}
        <div style={{ ...sectionStyle, borderLeft: '4px solid #7C3AED' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#7C3AED', marginBottom: '10px' }}>{text.ai}</div>
          <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-primary)', marginBottom: '16px' }}>
            {dummyData.aiAnalysis.summary}
          </p>
          
          <label style={{ ...labelStyle, color: 'var(--danger)' }}>{text.flags}</label>
          <ul style={{ padding: 0, margin: '8px 0 16px 0', listStyle: 'none' }}>
            {dummyData.aiAnalysis.dangerFlags.map((flag, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--danger)', marginBottom: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)' }} />
                {flag}
              </li>
            ))}
          </ul>

          <label style={{ ...labelStyle, color: 'var(--accent)' }}>{text.rec}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {dummyData.aiAnalysis.recommendations.map((rec, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 700 }}>{i + 1}.</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── VOICE NOTE (If exists) ── */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifySpaceBetween: 'space-between', alignItems: 'center', marginBottom: '12px', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>{text.voice}</div>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
              {text.recordedIn}
            </span>
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <button style={{
               width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', 
               display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer'
             }}>
               <FaPlay size={10} color="white" />
             </button>
             <div style={{ flex: 1, fontSize: '13px', italic: 'true', color: 'var(--text-secondary)' }}>
               "{dummyData.voiceNoteText}"
             </div>
          </div>
        </div>

        {/* ── BUTTONS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          <button
            onClick={handleDownload}
            style={{
              width: '100%', height: '52px', background: 'var(--accent)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)', fontSize: '16px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer',
              fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(194,24,91,0.2)'
            }}
          >
            <FaDownload /> {text.download}
          </button>
          <button
            onClick={handleReview}
            style={{
              width: '100%', height: '48px', background: 'transparent', color: 'var(--success)',
              border: '1.5px solid var(--success)', borderRadius: 'var(--radius-md)',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            <FaCheckCircle /> {text.review}
          </button>
        </div>

      </div>
    </DoctorLayout>
  );
};

export default ReportViewerScreen;
