import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaFileMedical, FaUserMd, FaExclamationTriangle, FaHeartbeat, FaLungs, FaThermometerHalf, FaTint } from 'react-icons/fa';
import { generateProfessionalReport } from '../../utils/generatePdfReport';
import { useVitals } from '../../hooks/useVitals';

const ReportViewer = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const { latestVitals } = useVitals('patient_demo');
  
  // Mock data fetching based on ID
  const [report, setReport] = useState(null);

  useEffect(() => {
    // Simulate fetching report data
    const mockReports = {
      'rep1': { month: 'March', date: '24', status: 'STABLE', content: 'Clinical analysis for March shows consistent cardiac health. Blood sugar levels are well-managed.' },
      'rep2': { month: 'February', date: '17', status: 'MODERATE', content: 'February metrics showed slight elevation in systolic blood pressure. Recommended salt intake reduction was effective.' }
    };
    setReport(mockReports[reportId] || mockReports['rep1']);
  }, [reportId]);

  const toNumber = (value, fallback = null) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const currentHr = toNumber(latestVitals?.heartRate ?? latestVitals?.hr ?? latestVitals?.heartRateAvg, null);
  const currentSpo2 = toNumber(latestVitals?.spO2 ?? latestVitals?.spo2 ?? latestVitals?.spo2Avg, null);
  const currentRoomTemp = toNumber(latestVitals?.roomTemperature ?? latestVitals?.roomTemp ?? latestVitals?.ambientTemperature, null);
  const currentRoomHumidity = toNumber(latestVitals?.roomHumidity ?? latestVitals?.humidity ?? latestVitals?.relativeHumidity, null);
  const currentBodyTemp = toNumber(latestVitals?.bodyTemperature ?? latestVitals?.bodyTemp ?? latestVitals?.temperature ?? latestVitals?.temperatureAvg, null);

  const handleDownload = () => {
    setIsGenerating(true);
    const profile = { name: 'Saraswathi Reddy', age: 68, patientType: 'elderly', phc: 'Ramgarh PHC' };
    const survey = { aiStatus: report?.status, aiParagraphEnglish: report?.content };
    generateProfessionalReport(profile, [], survey, 'download');
    setTimeout(() => setIsGenerating(false), 1000);
  };

  if (!report) return null;

  return (
    <div style={{ 
      background: 'var(--bg-secondary)', 
      minHeight: '100dvh', 
      padding: '16px', 
      paddingTop: 'calc(16px + env(safe-area-inset-top))',
      paddingBottom: 'calc(40px + env(safe-area-inset-bottom))',
      fontFamily: '"DM Sans", sans-serif', 
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', maxWidth: '800px', margin: '0 auto 32px auto' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)', flexShrink: 0 }}
        >
          <FaArrowLeft />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Health Report</h1>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '24px', background: 'var(--accent)', color: 'white' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.9, letterSpacing: '1px' }}>{report.month} Clinical Insight</div>
            <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>MaaSathi Intelligence Analysis</div>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>SR</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>Saraswathi Reddy</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Elderly • Published Mar {report.date}, 2026</div>
              </div>
            </div>

            <section style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FaUserMd color="var(--accent)" />
                <span style={{ fontSize: '16px', fontWeight: 800 }}>Clinical Summary</span>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                {report.content}
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FaHeartbeat color="var(--danger)" />
                <span style={{ fontSize: '16px', fontWeight: 800 }}>Vital Baseline</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { key: 'hr', label: 'HEART RATE', value: currentHr !== null ? `${Math.round(currentHr)} bpm` : '--', icon: FaHeartbeat, color: 'var(--danger)' },
                  { key: 'spo2', label: 'BLOOD OXYGEN', value: currentSpo2 !== null ? `${Math.round(currentSpo2)}%` : '--', icon: FaLungs, color: 'var(--info)' },
                  { key: 'room-temp', label: 'ROOM TEMP', value: currentRoomTemp !== null ? `${currentRoomTemp.toFixed(1)}°C` : '--', icon: FaThermometerHalf, color: '#F59E0B' },
                  { key: 'humidity', label: 'ROOM HUMIDITY', value: currentRoomHumidity !== null ? `${Math.round(currentRoomHumidity)}%` : '--', icon: FaTint, color: '#0D9488' },
                  { key: 'body-temp', label: 'BODY TEMP', value: currentBodyTemp !== null ? `${currentBodyTemp.toFixed(1)}°C` : '--', icon: FaThermometerHalf, color: '#7C3AED' }
                ].map((vital) => (
                  <div key={vital.key} style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <vital.icon color={vital.color} size={12} />
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)' }}>{vital.label}</div>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{vital.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              style={{ width: '100%', height: '56px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(194, 24, 91, 0.2)' }}
            >
              <FaDownload /> {isGenerating ? 'Generating PDF...' : 'Download Full Document'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportViewer;
