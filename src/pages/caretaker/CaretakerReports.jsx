import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaFileAlt, FaPaperPlane, FaFilePdf, FaEye } from 'react-icons/fa';
import { generateProfessionalReport } from '../../utils/generatePdfReport';
import { AppContext } from '../../context/AppContext';

const CaretakerReports = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const { caretakerPatient } = React.useContext(AppContext);

  const handleDownload = (type) => {
    setIsGenerating(true);
    const profile = {
      name: caretakerPatient?.name || 'Linked Patient',
      age: caretakerPatient?.age || 0,
      patientType: caretakerPatient?.type || 'elderly',
      phc: 'Ramgarh PHC'
    };
    const survey = { aiStatus: 'STABLE', aiParagraphEnglish: `Mock intelligence analysis for ${caretakerPatient?.name || 'patient'} shows stable trends.` };
    generateProfessionalReport(profile, [], survey, 'download');
    setIsGenerating(false);
  };

  const handleSendToDoctor = () => {
     alert("Report sent to linked doctor");
  };

  const reports = [
    { title: `${caretakerPatient?.name || 'Patient'} - March Summary`, date: 'Published Mar 24' },
    { title: `${caretakerPatient?.name || 'Patient'} - February Summary`, date: 'Published Mar 17' },
    { title: `${caretakerPatient?.name || 'Patient'} - January Summary`, date: 'Published Feb 14' }
  ];

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '32px 24px 96px 24px', fontFamily: '"DM Sans", sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
        >
          <FaArrowLeft />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Health Reports</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
        <button 
          onClick={() => handleDownload('current')}
          disabled={isGenerating}
          style={{ height: '52px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <FaDownload size={16} /> {isGenerating ? 'Generating...' : 'Download Current Report'}
        </button>
        
        <button 
          onClick={() => handleDownload('monthly')}
          style={{ height: '52px', background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <FaFileAlt size={16} /> Download Monthly Report
        </button>

        <button 
          onClick={handleSendToDoctor}
          style={{ height: '48px', background: 'var(--success-light)', color: 'var(--success)', border: '1.5px solid var(--success)', borderRadius: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <FaPaperPlane size={14} /> Send to Doctor
        </button>
      </div>

      <section>
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Previous Reports</h3>
        {reports.map((rep, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaFilePdf size={24} color="var(--accent)" />
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{rep.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rep.date}</div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', color: 'var(--text-tertiary)' }}>
              <FaDownload size={16} style={{ cursor: 'pointer' }} onClick={() => handleDownload('old')} />
              <FaEye size={16} style={{ cursor: 'pointer' }} />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default CaretakerReports;
