import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBaby, FaCheck, FaUser, FaMapMarkerAlt, FaHeartbeat, FaBabyCarriage, FaUserPlus } from 'react-icons/fa';
import { MdPregnantWoman } from 'react-icons/md';
import { AppContext } from '../../context/AppContext';

const AddPatientScreen = () => {
  const navigate = useNavigate();
  const { addPatient } = React.useContext(AppContext);

  const [type, setType] = useState(null); // 'pregnant' | 'newMother' | null
  const [formData, setFormData] = useState({
    name: '', age: '', phone: '', house: '', village: '', distance: '', emergency: '', nutrition: '',
    weeksPregnant: '', edd: '', prevPregnancies: '',
    babyDob: '', babyWeight: '', deliveryType: ''
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSave = () => {
    if (!type) {
      showToast('Please select patient type first');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const newErrors = {};
    if (!formData.name) newErrors.name = 'This field is required';
    if (!formData.age) newErrors.age = 'This field is required';
    if (!formData.phone) newErrors.phone = 'This field is required';
    if (!formData.house) newErrors.house = 'This field is required';
    if (!formData.village) newErrors.village = 'This field is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const pId = 'p' + Date.now();
    const newPatient = {
      ...formData,
      type,
      id: pId
    };
    
    addPatient(newPatient);

    showToast('Patient registered! Opening survey...');
    setTimeout(() => {
      const surveyPath = type === 'newMother' ? '/asha/surveys/new-mother' : '/asha/surveys/pregnant';
      navigate(surveyPath, { state: { patient: newPatient, patientId: pId } });
    }, 1000);
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100dvh', paddingBottom: '96px', fontFamily: '"DM Sans", sans-serif' }}>
      
      {/* TOAST OVERLAY */}
      {toast && (
        <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: 'var(--text-primary)', color: 'white', padding: '12px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}

      {/* FORM STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
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
        .req-star {
          color: var(--danger);
          margin-left: 2px;
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
        .form-input.error {
          border-color: var(--danger);
        }
        .error-msg {
          font-size: 12px;
          color: var(--danger);
          margin-top: 4px;
        }
      `}} />

      {/* STICKY HEADER */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 24px',
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}>
          <FaArrowLeft size={16} color="var(--text-primary)" />
        </button>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Add New Patient</div>
      </header>

      {/* STEP 1 — PATIENT TYPE SELECTION */}
      <div style={{ background: 'var(--surface)', margin: '16px 24px', borderRadius: 'var(--radius-xl)', padding: '24px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
          Who are you registering?
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div onClick={() => setType('pregnant')} style={{
            borderRadius: 'var(--radius-lg)', padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
            border: type === 'pregnant' ? '2px solid var(--accent)' : '2px solid var(--border)',
            background: type === 'pregnant' ? 'var(--accent-subtle)' : 'var(--bg-secondary)'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent-light)', margin: '0 auto 12px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdPregnantWoman size={28} color="var(--accent)" />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Pregnant Mother</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Antenatal care</div>
          </div>
          
          <div onClick={() => setType('newMother')} style={{
            borderRadius: 'var(--radius-lg)', padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
            border: type === 'newMother' ? '2px solid var(--accent)' : '2px solid var(--border)',
            background: type === 'newMother' ? 'var(--accent-subtle)' : 'var(--bg-secondary)'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--info-light)', margin: '0 auto 12px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaBaby size={28} color="var(--info)" />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>New Mother</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Postnatal care</div>
          </div>
        </div>

        {type && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: type === 'pregnant' ? 'var(--accent)' : 'var(--info)',
              color: 'white',
              fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '100px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <FaCheck size={10} />
              {type === 'pregnant' ? 'Pregnant Mother Selected' : 'New Mother Selected'}
            </div>
          </div>
        )}
      </div>

      {type && (
        <div style={{ paddingBottom: '32px' }}>
          
          {/* CARD 1 — BASIC INFO */}
          <div className="form-card">
            <div className="form-card-header">
              <FaUser size={16} color="var(--accent)" />
              <span className="form-card-title">Basic Information</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group">
                <label className="form-label">Full Name<span className="req-star">*</span></label>
                <input type="text" className={`form-input ${errors.name ? 'error' : ''}`} value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                {errors.name && <div className="error-msg">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Age in Years<span className="req-star">*</span></label>
                <input type="number" className={`form-input ${errors.age ? 'error' : ''}`} value={formData.age} onChange={e => handleChange('age', e.target.value)} />
                {errors.age && <div className="error-msg">{errors.age}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number<span className="req-star">*</span></label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    height: '48px', padding: '0 12px', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-md)', fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', width: 'fit-content'
                  }}>+91</div>
                  <input type="tel" maxLength="10" className={`form-input ${errors.phone ? 'error' : ''}`} style={{ flex: 1 }} value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
                </div>
                {errors.phone && <div className="error-msg">{errors.phone}</div>}
              </div>

            </div>
          </div>

          {/* CARD 2 — LOCATION DETAILS */}
          <div className="form-card">
            <div className="form-card-header">
              <FaMapMarkerAlt size={16} color="var(--info)" />
              <span className="form-card-title">Location Details</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group">
                <label className="form-label">House Number<span className="req-star">*</span></label>
                <input type="text" className={`form-input ${errors.house ? 'error' : ''}`} value={formData.house} onChange={e => handleChange('house', e.target.value)} />
                {errors.house && <div className="error-msg">{errors.house}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Village Name<span className="req-star">*</span></label>
                <input type="text" className={`form-input ${errors.village ? 'error' : ''}`} value={formData.village} onChange={e => handleChange('village', e.target.value)} />
                {errors.village && <div className="error-msg">{errors.village}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Distance from PHC in km</label>
                <div style={{ position: 'relative' }}>
                   <input type="number" className="form-input" style={{ width: '100%' }} value={formData.distance} onChange={e => handleChange('distance', e.target.value)} />
                   <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-tertiary)' }}>km</div>
                </div>
              </div>

            </div>
          </div>

          {/* CARD 3 — HEALTH INFORMATION */}
          <div className="form-card">
            <div className="form-card-header">
              <FaHeartbeat size={16} color="var(--danger)" />
              <span className="form-card-title">Health Information</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group">
                <label className="form-label">Emergency Contact Number</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    height: '48px', padding: '0 12px', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-md)', fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', width: 'fit-content'
                  }}>+91</div>
                  <input type="tel" maxLength="10" className="form-input" style={{ flex: 1 }} value={formData.emergency} onChange={e => handleChange('emergency', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '6px' }}>Nutrition Status</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                   {['Good', 'Average', 'Poor'].map(nut => {
                      let pillStyle = {
                        flex: 1, padding: '10px 0', borderRadius: '100px', border: '1.5px solid var(--border)',
                        fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                        background: 'transparent', color: 'var(--text-secondary)'
                      };
                      if (formData.nutrition === nut) {
                         if (nut === 'Good') { pillStyle.background = 'var(--success-light)'; pillStyle.borderColor = 'var(--success)'; pillStyle.color = 'var(--success)'; }
                         if (nut === 'Average') { pillStyle.background = 'var(--warning-light)'; pillStyle.borderColor = 'var(--warning)'; pillStyle.color = 'var(--warning)'; }
                         if (nut === 'Poor') { pillStyle.background = 'var(--danger-light)'; pillStyle.borderColor = 'var(--danger)'; pillStyle.color = 'var(--danger)'; }
                      }
                      return <button key={nut} style={pillStyle} onClick={() => handleChange('nutrition', nut)}>{nut}</button>
                   })}
                </div>
              </div>

            </div>
          </div>

          {/* CARD 4 — PREGNANT SPECIFIC */}
          {type === 'pregnant' && (
            <div className="form-card">
              <div className="form-card-header">
                <FaBabyCarriage size={16} color="var(--accent)" />
                <span className="form-card-title">Pregnancy Details</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div className="form-group">
                  <label className="form-label">Weeks Pregnant</label>
                  <div style={{ position: 'relative' }}>
                     <input type="number" className="form-input" style={{ width: '100%' }} value={formData.weeksPregnant} onChange={e => handleChange('weeksPregnant', e.target.value)} />
                     <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-tertiary)' }}>weeks</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Expected Delivery Date</label>
                  <input type="date" className="form-input" value={formData.edd} onChange={e => handleChange('edd', e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Number of Previous Pregnancies</label>
                  <input type="number" className="form-input" placeholder="0 if this is first" value={formData.prevPregnancies} onChange={e => handleChange('prevPregnancies', e.target.value)} />
                </div>

              </div>
            </div>
          )}

          {/* CARD 4 — NEW MOTHER SPECIFIC */}
          {type === 'newMother' && (
            <div className="form-card">
              <div className="form-card-header">
                <FaBaby size={16} color="var(--info)" />
                <span className="form-card-title">Baby Details</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div className="form-group">
                  <label className="form-label">Baby Date of Birth</label>
                  <input type="date" className="form-input" value={formData.babyDob} onChange={e => handleChange('babyDob', e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Baby Birth Weight</label>
                  <div style={{ position: 'relative' }}>
                     <input type="number" step="0.1" className="form-input" style={{ width: '100%' }} value={formData.babyWeight} onChange={e => handleChange('babyWeight', e.target.value)} />
                     <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-tertiary)' }}>kg</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '6px' }}>Delivery Type</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                     {['Hospital', 'Home', 'Other'].map(dt => {
                        let pillStyle = {
                          flex: 1, padding: '10px 0', borderRadius: '100px', border: '1.5px solid var(--border)',
                          fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                          background: 'transparent', color: 'var(--text-secondary)'
                        };
                        if (formData.deliveryType === dt) {
                           if (dt === 'Hospital') { pillStyle.background = 'var(--info-light)'; pillStyle.borderColor = 'var(--info)'; pillStyle.color = 'var(--info)'; }
                           if (dt === 'Home') { pillStyle.background = 'var(--success-light)'; pillStyle.borderColor = 'var(--success)'; pillStyle.color = 'var(--success)'; }
                           if (dt === 'Other') { pillStyle.background = 'var(--warning-light)'; pillStyle.borderColor = 'var(--warning)'; pillStyle.color = 'var(--warning)'; }
                        }
                        return <button key={dt} style={pillStyle} onClick={() => handleChange('deliveryType', dt)}>{dt}</button>
                     })}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* SAVE BUTTON */}
      <button onClick={handleSave} style={{
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)', maxWidth: '720px', height: '52px', background: 'var(--accent)',
        color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontFamily: '"DM Sans", sans-serif',
        fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        cursor: type ? 'pointer' : 'not-allowed',
        boxShadow: type ? '0 4px 20px rgba(194,24,91,0.3)' : 'none',
        opacity: type ? 1 : 0.5, transition: 'all 0.2s', zIndex: 100
      }}>
        <FaUserPlus size={18} />
        Save and Continue
      </button>

    </div>
  );
};

export default AddPatientScreen;
