import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaArrowLeft, FaEdit, FaMapMarkerAlt, FaUser, FaShieldAlt, 
  FaExclamationCircle, FaHistory, FaChevronDown, FaChevronUp, 
  FaDownload, FaHeartbeat, FaChevronRight, FaWalking, 
  FaClipboardList, FaExchangeAlt, FaBaby, FaBabyCarriage
} from 'react-icons/fa';
import { FaLungs } from 'react-icons/fa6';
import { AppContext } from '../../context/AppContext';

const MOCK_PATIENT = {
  id: 'p1',
  name: 'Suhana Khatun',
  initials: 'SK',
  type: 'Pregnant',
  weeks: '24 weeks pregnant',
  details: {
    Age: '24 Years',
    Phone: '+91 98765 43210',
    'House Number': '42',
    Village: 'Ramgarh',
    'Distance from PHC': '4.2 km',
    'Nutrition Status': 'Moderate',
    'Emergency Contact': '+91 91234 56789',
    babyDOB: '',
    babyWeight: ''
  },
  riskScore: 78,
  riskLevel: 'HIGH',
  riskFactors: ['Missed 2 visits', 'Low Hemoglobin', 'Anemia Symptoms', 'Far distances'],
  visits: [
    {
      id: 'v1',
      date: '12 Mar 2026, 10:30 AM',
      type: 'Routine',
      result: 'MODERATE',
      asha: 'Lakshmi',
      aiSummary: 'Patient reported mild weakness and pale tongue. Recommended dietary improvements and scheduled follow up.',
      hasPdf: true
    },
    {
      id: 'v2',
      date: '15 Feb 2026, 11:15 AM',
      type: 'ANC Checkup',
      result: 'STABLE',
      asha: 'Lakshmi',
      aiSummary: 'All vitals normal. TT dose 1 administered.',
      hasPdf: false
    }
  ],
  hasRing: true,
  vitals: {
    hr: '--',
    spo2: '--',
    steps: '--'
  }
};

const toDisplayType = (type) => (type === 'newMother' ? 'New Mother' : 'Pregnant');
const toStoreType = (type) => (type === 'New Mother' ? 'newMother' : 'pregnant');
const toInitials = (name = 'UN') =>
  String(name)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const toDisplayPatient = (source) => {
  if (!source) return MOCK_PATIENT;

  const type = toDisplayType(source.type);
  const age = source.age ? `${source.age} Years` : '24 Years';
  const weeks =
    type === 'New Mother'
      ? 'Postnatal care'
      : `${Number(source.weeks || source.weeksPregnant || 24)} weeks pregnant`;

  return {
    id: source.id,
    name: source.name || 'Unknown Patient',
    initials: source.initials || toInitials(source.name),
    type,
    weeks,
    date: source.date || 'Visited today',
    details: {
      Age: age,
      Phone: source.phone ? `+91 ${source.phone}` : '+91 98765 43210',
      'House Number': source.house || '',
      Village: source.village || '',
      'Distance from PHC': source.distance ? `${source.distance} km` : '4.2 km',
      'Nutrition Status': source.nutrition || 'Moderate',
      'Emergency Contact': source.emergency || '+91 91234 56789',
      babyDOB: source.babyDob || '',
      babyWeight: source.babyWeight || ''
    },
    riskScore: Number(source.riskScore || (source.risk === 'HIGH' ? 78 : source.risk === 'MED' ? 55 : 28)),
    riskLevel: source.risk || 'LOW',
    riskFactors: Array.isArray(source.riskFactors) && source.riskFactors.length > 0
      ? source.riskFactors
      : (source.risk === 'HIGH' ? ['Needs close monitoring'] : ['Stable vitals']),
    visits: Array.isArray(source.visits) && source.visits.length > 0 ? source.visits : MOCK_PATIENT.visits,
    hasRing: source.hasRing ?? true,
    vitals: {
      hr: source?.vitals?.hr || '--',
      spo2: source?.vitals?.spo2 || '--',
      steps: source?.vitals?.steps || '--'
    }
  };
};

const toStorePatient = (viewPatient, previous = {}) => {
  const age = Number.parseInt(String(viewPatient.details.Age || '').replace(/\D/g, ''), 10) || previous.age || 0;
  const phone = String(viewPatient.details.Phone || previous.phone || '').replace(/\D/g, '').slice(-10);
  const house = String(viewPatient.details['House Number'] || previous.house || '');
  const village = String(viewPatient.details.Village || previous.village || '');
  const location = `${house}${village ? `, ${village}` : ''}`.trim();
  const weekNumber =
    viewPatient.type === 'Pregnant'
      ? Number.parseInt(String(viewPatient.weeks || '').replace(/\D/g, ''), 10) || previous.weeks || 0
      : 0;

  return {
    ...previous,
    id: viewPatient.id,
    name: viewPatient.name,
    initials: toInitials(viewPatient.name),
    type: toStoreType(viewPatient.type),
    age,
    phone,
    house,
    village,
    location,
    date: viewPatient.date || previous.date || 'Visited today',
    risk: viewPatient.riskLevel || previous.risk || 'LOW',
    riskScore: Number(viewPatient.riskScore || previous.riskScore || 0),
    riskFactors: viewPatient.riskFactors || previous.riskFactors || [],
    weeks: weekNumber,
    nutrition: viewPatient.details['Nutrition Status'] || previous.nutrition || 'Moderate',
    emergency: viewPatient.details['Emergency Contact'] || previous.emergency || '',
    babyDob: viewPatient.details.babyDOB || previous.babyDob || '',
    babyWeight: viewPatient.details.babyWeight || previous.babyWeight || '',
    visits: viewPatient.visits || previous.visits || [],
    hasRing: viewPatient.hasRing ?? previous.hasRing ?? true,
    vitals: viewPatient.vitals || previous.vitals || { hr: '--', spo2: '--', steps: '--' }
  };
};

const PatientProfileScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, updatePatient } = React.useContext(AppContext);
  const sourcePatient = patients.find((p) => p.id === id);

  const [expandedVisitId, setExpandedVisitId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [patientData, setPatientData] = useState(() => toDisplayPatient(sourcePatient));
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState('');

  React.useEffect(() => {
    setPatientData(toDisplayPatient(sourcePatient));
  }, [sourcePatient]);

  const toggleVisit = (vid) => {
    setExpandedVisitId(prev => prev === vid ? null : vid);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleUpdate = (field, value) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateDetail = (field, value) => {
    setPatientData(prev => ({
      ...prev,
      details: { ...prev.details, [field]: value }
    }));
  };

  const handleSave = () => {
    if (sourcePatient) {
      const updated = toStorePatient(patientData, sourcePatient);
      updatePatient(updated);
      setPatientData(toDisplayPatient(updated));
    }
    showToast('Profile updated');
    setIsEditing(false);
  };

  const confirmNewMotherStatus = () => {
    setPatientData(prev => ({
      ...prev,
      type: 'New Mother',
      weeks: 'Postnatal care',
      details: {
        ...prev.details,
        babyDOB: prev.details.babyDOB || '',
        babyWeight: prev.details.babyWeight || ''
      }
    }));
    setShowConfirm(false);
    showToast('Status updated to New Mother');
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', background: 'var(--bg-secondary)', minHeight: '100dvh', fontFamily: '"DM Sans", sans-serif', paddingBottom: isEditing ? '160px' : '96px' }}>
      
      {/* TOAST OVERLAY */}
      {toast && (
        <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: 'var(--text-primary)', color: 'white', padding: '12px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}

      {/* STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .start-btn {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 48px);
          max-width: 672px;
          height: 52px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-family: "DM Sans", sans-serif;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(194,24,91,0.35);
          transition: all 0.2s;
          z-index: 100;
        }
        .start-btn:hover {
          filter: brightness(0.9);
          box-shadow: 0 6px 24px rgba(194,24,91,0.45);
        }

        /* Form Edit Styles */
        .form-card {
          background: var(--surface);
          margin: 0 24px 16px 24px;
          border-radius: var(--radius-xl);
          padding: 24px;
          border: 1px solid var(--border);
        }
        .form-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .form-card-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          display: block;
        }
        .form-input {
          width: 100%;
          height: 48px;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0 16px;
          font-family: "DM Sans", sans-serif;
          font-size: 15px;
          color: var(--text-primary);
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .form-input:focus {
          border-color: var(--accent);
          background: var(--surface);
          box-shadow: 0 0 0 3px var(--accent-light);
          outline: none;
        }
        
        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }
        .modal-content {
          background: var(--surface);
          padding: 24px;
          border-radius: var(--radius-xl);
          width: calc(100% - 48px);
          max-width: 400px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
      `}} />

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Confirm Status Change</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
              Marking {patientData.name} as a New Mother will update her patient type and change her checkup questions to postnatal care. This cannot be undone automatically.
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', font: '14px "DM Sans"', fontWeight: 600, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmNewMotherStatus} style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', font: '14px "DM Sans"', fontWeight: 600, background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => {
            if(isEditing) setIsEditing(false);
            else navigate(-1);
          }} style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <FaArrowLeft size={16} color="var(--text-primary)" />
          </button>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{isEditing ? 'Edit Profile' : 'Patient Profile'}</div>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--accent-light)', color: 'var(--accent)',
            border: 'none', borderRadius: 'var(--radius-md)',
            padding: '8px 14px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit'
          }}>
            <FaEdit size={14} /> Edit
          </button>
        )}
      </header>

      {/* CONDITIONAL RENDERING FOR EDIT VS VIEW MODE */}
      {isEditing ? (
        
        <div style={{ paddingTop: '16px' }}>
          {/* UPDATE PATIENT STATUS CARD */}
          <div style={{
            background: 'var(--warning-light)',
            border: '1.5px solid var(--warning)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            margin: '0 24px 16px 24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <FaExchangeAlt size={16} color="var(--warning)" style={{ marginRight: '8px' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--warning)' }}>Update Patient Status</span>
            </div>
            
            {patientData.type === 'Pregnant' ? (
              <button 
                onClick={() => setShowConfirm(true)}
                style={{
                  background: 'var(--info)',
                  color: 'white',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <FaBaby size={16} style={{ marginRight: '8px' }} /> Mark as New Mother
              </button>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                New Mother status is permanent
              </div>
            )}
          </div>

          {/* EDIT FORM CARDS */}
          {/* Card 1: Basic Information */}
          <div className="form-card">
            <div className="form-card-header">
              <FaUser size={16} color="var(--accent)" />
              <span className="form-card-title">Basic Information</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={patientData.name} onChange={e => handleUpdate('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input type="text" className="form-input" value={patientData.details.Age} onChange={e => handleUpdateDetail('Age', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" value={patientData.details.Phone} onChange={e => handleUpdateDetail('Phone', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Card 2: Location Details */}
          <div className="form-card">
            <div className="form-card-header">
              <FaMapMarkerAlt size={16} color="var(--info)" />
              <span className="form-card-title">Location Details</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">House Number</label>
                <input type="text" className="form-input" value={patientData.details['House Number']} onChange={e => handleUpdateDetail('House Number', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Village</label>
                <input type="text" className="form-input" value={patientData.details.Village} onChange={e => handleUpdateDetail('Village', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Distance from PHC</label>
                <input type="text" className="form-input" value={patientData.details['Distance from PHC']} onChange={e => handleUpdateDetail('Distance from PHC', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Card 3: Health Information */}
          <div className="form-card">
            <div className="form-card-header">
              <FaHeartbeat size={16} color="var(--danger)" />
              <span className="form-card-title">Health Information</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Emergency Contact Number</label>
                <input type="text" className="form-input" value={patientData.details['Emergency Contact']} onChange={e => handleUpdateDetail('Emergency Contact', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Nutrition Status</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                   {['Good', 'Moderate', 'Poor'].map(nut => {
                      let pillStyle = {
                        flex: 1, padding: '10px 0', borderRadius: '100px', border: '1.5px solid var(--border)',
                        fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                        background: 'transparent', color: 'var(--text-secondary)'
                      };
                      if (patientData.details['Nutrition Status'] === nut) {
                         if (nut === 'Good') { pillStyle.background = 'var(--success-light)'; pillStyle.borderColor = 'var(--success)'; pillStyle.color = 'var(--success)'; }
                         if (nut === 'Moderate') { pillStyle.background = 'var(--warning-light)'; pillStyle.borderColor = 'var(--warning)'; pillStyle.color = 'var(--warning)'; }
                         if (nut === 'Poor') { pillStyle.background = 'var(--danger-light)'; pillStyle.borderColor = 'var(--danger)'; pillStyle.color = 'var(--danger)'; }
                      }
                      return <button key={nut} style={pillStyle} onClick={() => handleUpdateDetail('Nutrition Status', nut)}>{nut}</button>
                   })}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Type Specific Info */}
          {patientData.type === 'Pregnant' && (
            <div className="form-card">
              <div className="form-card-header">
                <FaBabyCarriage size={16} color="var(--accent)" />
                <span className="form-card-title">Pregnancy Details</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Weeks Pregnant</label>
                  <input type="text" className="form-input" value={patientData.weeks} onChange={e => handleUpdate('weeks', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {patientData.type === 'New Mother' && (
            <div className="form-card">
              <div className="form-card-header">
                <FaBaby size={16} color="var(--info)" />
                <span className="form-card-title">Baby Details</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Baby Date of Birth</label>
                  <input type="date" className="form-input" value={patientData.details.babyDOB || ''} onChange={e => handleUpdateDetail('babyDOB', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Baby Birth Weight (kg)</label>
                  <input type="number" step="0.1" className="form-input" value={patientData.details.babyWeight || ''} onChange={e => handleUpdateDetail('babyWeight', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Edit Mode Bottom Actions */}
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '720px',
            background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '16px 24px',
            display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 100
          }}>
            <button onClick={() => { setPatientData(toDisplayPatient(sourcePatient)); setIsEditing(false); }} style={{
              background: 'transparent', color: 'var(--text-secondary)', border: 'none',
              fontFamily: '"DM Sans", sans-serif', fontSize: '15px', fontWeight: 600, cursor: 'pointer', height: '40px'
            }}>
              Cancel
            </button>
            <button onClick={handleSave} style={{
              background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
              fontFamily: '"DM Sans", sans-serif', fontSize: '16px', fontWeight: 600, display: 'flex',
              alignItems: 'center', justifyContent: 'center', height: '52px', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(194,24,91,0.3)', transition: 'all 0.2s'
            }}>
              Save Changes
            </button>
          </div>

        </div>

      ) : (

        /* VIEW MODE CONTENT */
        <>
          {/* HERO SECTION */}
          <div style={{ background: 'var(--surface)', padding: '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '3px solid var(--accent)' }}>
              {patientData.initials}
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{patientData.name}</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, ...(patientData.type === 'Pregnant' ? { background: 'var(--accent-light)', color: 'var(--accent)' } : { background: 'var(--info-light)', color: 'var(--info)' }) }}>
                  {patientData.type}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{patientData.weeks}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <FaMapMarkerAlt size={13} color="var(--text-tertiary)" />
                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                  {patientData.details['House Number'] ? `House ${patientData.details['House Number']}, ${patientData.details.Village}` : 'House 42, Ramgarh'}
                </span>
              </div>
            </div>
          </div>

          {/* DETAILS CARD */}
          <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '16px', padding: '0 24px' }}>
            <div style={{ padding: '16px 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <FaUser size={16} color="var(--accent)" />
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Patient Details</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {[
                { label: 'Age', value: patientData.details['Age'] },
                { label: 'Phone', value: patientData.details['Phone'] },
                { label: 'House Number', value: patientData.details['House Number'] },
                { label: 'Village', value: patientData.details['Village'] },
                { label: 'Distance from PHC', value: patientData.details['Distance from PHC'] },
                { label: 'Nutrition Status', value: patientData.details['Nutrition Status'] }
              ].map((item, idx) => (
                <div key={idx} style={{ padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.value || '-'}</div>
                </div>
              ))}
              <div style={{ gridColumn: 'span 2', padding: '14px 0', borderBottom: 'none' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Emergency Contact</div>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{patientData.details['Emergency Contact']}</div>
              </div>
              {patientData.type === 'New Mother' && (
                <>
                  <div style={{ padding: '14px 0', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Baby DOB</div>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{patientData.details.babyDOB || '-'}</div>
                  </div>
                  <div style={{ padding: '14px 0', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Baby Weight</div>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{patientData.details.babyWeight ? `${patientData.details.babyWeight} kg` : '-'}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* VULNERABILITY SCORE CARD */}
          <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '20px 24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FaShieldAlt size={16} color="var(--danger)" style={{ marginRight: '8px' }} />
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Vulnerability Score</span>
              </div>
              <div>
                <span style={{ fontSize: '32px', fontWeight: 800, color: patientData.riskScore > 70 ? 'var(--danger)' : patientData.riskScore >= 40 ? 'var(--warning)' : 'var(--success)' }}>{patientData.riskScore}</span>
                <span style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}> / 100</span>
              </div>
            </div>
            
            <div style={{ height: '10px', background: 'var(--border)', borderRadius: '100px', overflow: 'hidden', marginBottom: '14px' }}>
               <div style={{
                 height: '100%', width: `${patientData.riskScore}%`, borderRadius: '100px', transition: 'width 0.6s ease',
                 background: patientData.riskScore > 70 ? 'var(--danger)' : patientData.riskScore >= 40 ? 'var(--warning)' : 'var(--success)'
               }} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {patientData.riskFactors.map(f => (
                <div key={f} style={{
                  background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)',
                  opacity: 0.8, padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <FaExclamationCircle size={11} /> {f}
                </div>
              ))}
            </div>
          </div>

          {/* VISIT HISTORY CARD */}
          <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '20px 24px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <FaHistory size={16} color="var(--accent)" />
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Visit History</span>
            </div>
            
            <div>
              {patientData.visits.map((v, idx) => {
                const isExpanded = expandedVisitId === v.id;
                return (
                  <div key={v.id} style={{ padding: '14px 0', borderBottom: idx === patientData.visits.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                    <div onClick={() => toggleVisit(v.id)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)' }}>{v.date}</div>
                        {isExpanded ? <FaChevronUp size={14} color="var(--text-tertiary)" /> : <FaChevronDown size={14} color="var(--text-tertiary)" />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                         <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{v.type}</span>
                         <span style={{
                           padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                           background: v.result === 'CRITICAL' ? 'var(--danger-light)' : v.result === 'MODERATE' ? 'var(--warning-light)' : 'var(--success-light)',
                           color: v.result === 'CRITICAL' ? 'var(--danger)' : v.result === 'MODERATE' ? 'var(--warning)' : 'var(--success)'
                         }}>
                           {v.result}
                         </span>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px', marginTop: '8px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>ASHA Worker: {v.asha}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, marginTop: '4px' }}>{v.aiSummary}</div>
                        {v.hasPdf && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', cursor: 'pointer' }}>
                             <FaDownload size={13} color="var(--accent)" />
                             <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>Download Report</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RING VITALS CARD */}
          <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FaHeartbeat size={16} color="var(--danger)" style={{ marginRight: '8px' }} />
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Ring Vitals</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <FaChevronRight size={13} color="var(--accent)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>View Full History</span>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '14px 16px', border: '1px solid var(--border-subtle)' }}>
                 <FaHeartbeat size={18} color="var(--danger)" style={{ marginBottom: '8px' }} />
                 <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Heart Rate</div>
                 <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--danger)' }}>{patientData.vitals.hr.split(' ')[0]}</div>
                 <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>bpm</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '14px 16px', border: '1px solid var(--border-subtle)' }}>
                 <FaLungs size={18} color="var(--info)" style={{ marginBottom: '8px' }} />
                 <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>SpO2</div>
                 <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--info)' }}>{patientData.vitals.spo2.replace('%','')}</div>
                 <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>%</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '14px 16px', border: '1px solid var(--border-subtle)' }}>
                 <FaWalking size={18} color="var(--success)" style={{ marginBottom: '8px' }} />
                 <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Steps</div>
                 <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)' }}>{patientData.vitals.steps}</div>
                 <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>steps today</div>
              </div>
            </div>
          </div>

          <button className="start-btn" onClick={() => navigate('/checkup/select-type', { state: { patientId: patientData.id } })}>
            <FaClipboardList size={18} /> Start Checkup
          </button>
        </>
      )}

    </div>
  );
};

export default PatientProfileScreen;
