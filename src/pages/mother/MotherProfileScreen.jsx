import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaEdit, FaCamera, FaSignOutAlt, FaUser, 
  FaBabyCarriage, FaBroadcastTower, FaHeartbeat,
  FaCheck, FaTimes, FaSpinner, FaClock, FaUserCircle
} from 'react-icons/fa';
import MotherLayout from '../../layouts/MotherLayout';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';

const MotherProfileScreen = () => {
  const navigate = useNavigate();
  const { user, profile, logout, updateProfile } = useAuth();
  const { language } = useLanguage();
  const patientType = profile?.patientType || 'mother';

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);
  const [toast, setToast] = useState('');

  const [formData, setFormData] = useState({
    name: profile?.name || 'Sunita Devi',
    phone: profile?.email || '+91 9876543210',
    age: profile?.age || '24',
    address: profile?.address || 'House 42, Ramgarh Village',
    status: profile?.status || 'Pregnant',
    weeks: profile?.weeks || '28',
    edd: profile?.edd || '15 May 2026',
    gravida: profile?.gravida || '1',
    plan: profile?.plan || 'Hospital Delivery',
    bloodGroup: profile?.bloodGroup || 'O+',
    emerName: profile?.emerName || 'Ramesh Kumar (Husband)',
    emerPhone: profile?.emerPhone || '+91 9123456789'
  });
  
  const [savedData, setSavedData] = useState({ ...formData });

  const t = {
    en: {
      title: "Mother Profile",
      edit: "Edit",
      personal: "Personal Details",
      pregnancy: "Pregnancy Details",
      ring: "Smart Ring Information",
      updateHistory: "Update Health History",
      healthHistory: "Health Background",
      logout: "Secure Logout",
      save: "Save Changes",
      cancel: "Cancel",
      saving: "Saving...",
      age: "Age",
      blood: "Blood Group",
      phone: "Phone (Read-Only)",
      village: "Village",
      address: "Address",
      emerName: "Emergency Contact Name",
      emerPhone: "Emergency Contact Phone",
      weeks: "Weeks Pregnant",
      edd: "Expected Delivery",
      prev: "Previous Pregnancies",
      plan: "Delivery Plan",
      serial: "Serial Number",
      battery: "Battery Level",
      status: "Connection Status",
      connected: "Connected",
      toastOk: "Profile updated successfully!",
      toastErr: "Error updating profile",
      pregnant: "Pregnant",
      newMother: "New Mother"
    },
    te: {
      title: "తల్లి ప్రొఫైల్",
      edit: "సవరించు",
      personal: "వ్యక్తిగత వివరాలు",
      pregnancy: "గర్భం వివరాలు",
      ring: "స్మార్ట్ రింగ్ సమాచారం",
      updateHistory: "ఆరోగ్య చరిత్రను నవీకరించండి",
      healthHistory: "ఆరోగ్య చరిత్ర",
      logout: "సురక్షిత లాగ్‌అవుట్",
      save: "మార్పులను సేవ్ చేయి",
      cancel: "రద్దు చేయి",
      saving: "సేవ్ అవుతోంది...",
      age: "వయస్సు",
      blood: "రక్త వర్గం",
      phone: "ఫోన్ (రీడ్-ఓన్లీ)",
      village: "గ్రామం",
      address: "చిరునామా",
      emerName: "అత్యవసర సంప్రదింపు పేరు",
      emerPhone: "అత్యవసర సంప్రదింపు ఫోన్",
      weeks: "గర్భధారణ వారాలు",
      edd: "అంచనా వేసిన డెలివరీ",
      prev: "మునుపటి గర్భాలు",
      plan: "డెలివరీ ప్లాన్",
      serial: "సీరియల్ నంబర్",
      battery: "బ్యాటరీ స్థాయి",
      status: "కనెక్షన్ స్థితి",
      connected: "కనెక్ట్ అయింది",
      toastOk: "ప్రొఫైల్ విజయవంతంగా అప్‌డేట్ చేయబడింది!",
      toastErr: "ప్రొఫైల్ అప్‌డేట్ చేయడంలో లోపం",
      pregnant: "గర్భిణీ",
      newMother: "కొత్త తల్లి"
    }
  };

  const text = t[language] || t.en;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEdit = () => {
    setSavedData({ ...formData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({ ...savedData });
    setIsEditing(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (updateProfile) {
        await updateProfile(formData);
      }
      setSavedData({ ...formData });
      showToast(text.toastOk);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      showToast(text.toastErr);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate('/welcome', { replace: true });
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  const handlePhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file && updateProfile) {
        setLoading(true);
        try {
          // Logic for firebase storage would go here
          // For now, we simulate success with a local URL
          const demoUrl = URL.createObjectURL(file);
          await updateProfile({ ...formData, photoURL: demoUrl });
          showToast("Photo updated successfully!");
        } catch (err) {
          showToast("Failed to upload photo");
        } finally {
          setLoading(false);
        }
      }
    };
    input.click();
  };

  const photoURL = !avatarErr && (profile?.photoURL || '') || '';
  const initials = formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  /* ── SHARED STYLES ── */
  const cardStyle = {
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
    marginBottom: '16px'
  };

  const headerStyle = {
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--border-subtle)'
  };

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--text-tertiary)',
    marginBottom: '4px',
    display: 'block'
  };

  const valueStyle = {
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--text-primary)'
  };

  const inputStyle = {
    width: '100%',
    height: '40px',
    background: 'var(--bg-secondary)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '0 12px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none'
  };

  return (
    <MotherLayout>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes connectedPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .prof-input:focus { border-color: var(--accent) !important; }
      `}} />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--text-primary)', color: 'white', padding: '12px 24px',
          borderRadius: '100px', fontSize: '14px', fontWeight: 600, zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap'
        }}>
          {toast}
        </div>
      )}

      {/* ── STICKY HEADER ── */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 'calc(16px + env(safe-area-inset-top))'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {text.title}
        </h2>

        {!isEditing && (
          <button 
            onClick={handleEdit}
            style={{
              background: 'var(--accent-light)', color: 'var(--accent)',
              border: 'none', borderRadius: 'var(--radius-md)',
              padding: '8px 14px', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
            }}
          >
            <FaEdit size={14} /> {text.edit}
          </button>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <div className="px-mobile-16" style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '28px 24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '20px'
      }}>
        {/* Avatar Circle */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'var(--accent-light)', border: '3px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative', flexShrink: 0
        }}>
          {photoURL ? (
            <img src={photoURL} alt="Mother" onError={() => setAvatarErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>
              {initials}
            </span>
          )}
          
          <button 
            onClick={handlePhotoUpload}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'var(--accent)', border: '2px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <FaCamera size={11} color="white" />
          </button>
        </div>

        {/* Name and State */}
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {formData.name}
          </div>
          <div style={{
            display: 'inline-block',
            background: patientType === 'mother' ? 'var(--accent-light)' : (patientType === 'elderly' ? '#FEE2E2' : '#DCFCE7'),
            color: patientType === 'mother' ? 'var(--accent)' : (patientType === 'elderly' ? '#991B1B' : '#166534'),
            padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600
          }}>
            {patientType.toUpperCase()}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
             Active Patient Account
          </div>
        </div>
      </div>

      {/* ── HEALTH SUMMARY CARD (NEW) ── */}
      <div className="px-mobile-16" style={cardStyle}>
        <div style={headerStyle}>
          <FaUserCircle size={16} color="var(--accent)" />
          <span style={{ fontSize: '15px', fontWeight: 600 }}>{text.healthHistory}</span>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {profile?.medicalHistory ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {Object.entries(profile.medicalHistory).slice(0, 5).map(([q, a], i) => (
                 <div key={i} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{q}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{typeof a === 'string' ? a : 'Recorded'}</div>
                 </div>
               ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
               <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>No health history recorded yet</div>
            </div>
          )}
        </div>
      </div>

      {/* ── PERSONAL DETAILS CARD ── */}
      <div className="px-mobile-16" style={cardStyle}>
        <div style={headerStyle}>
          <FaUser size={16} color="var(--accent)" />
          <span style={{ fontSize: '15px', fontWeight: 600 }}>{text.personal}</span>
        </div>
        <div style={{ padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {/* Row 1 */}
          <div style={{ padding: '13px 0', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', paddingRight: '12px' }}>
            <label style={labelStyle}>{text.age}</label>
            {isEditing ? <input type="number" style={inputStyle} value={formData.age} onChange={e => handleChange('age', e.target.value)} className="prof-input" /> : <span style={valueStyle}>{formData.age}</span>}
          </div>
          <div style={{ padding: '13px 0', borderBottom: '1px solid var(--border-subtle)', paddingLeft: '12px' }}>
            <label style={labelStyle}>{text.blood}</label>
            {isEditing ? <input style={inputStyle} value={formData.bloodGroup} onChange={e => handleChange('bloodGroup', e.target.value)} className="prof-input" /> : <span style={valueStyle}>{formData.bloodGroup}</span>}
          </div>
          {/* Row 2 */}
          <div style={{ gridColumn: '1 / -1', padding: '13px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <label style={labelStyle}>{text.phone}</label>
            <span style={{ ...valueStyle, color: 'var(--text-secondary)' }}>{formData.phone}</span>
          </div>
          {/* Row 3 - Village (part of Row 2 logic really) */}
          <div style={{ gridColumn: '1 / -1', padding: '13px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <label style={labelStyle}>{text.village}</label>
            {isEditing ? <input style={inputStyle} value={formData.address.split(',').pop().trim()} onChange={e => handleChange('address', e.target.value)} className="prof-input" /> : <span style={valueStyle}>{formData.address.split(',').pop().trim()}</span>}
          </div>
          {/* Row 4 - Full Address */}
          <div style={{ gridColumn: '1 / -1', padding: '13px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <label style={labelStyle}>{text.address}</label>
            {isEditing ? <input style={inputStyle} value={formData.address} onChange={e => handleChange('address', e.target.value)} className="prof-input" /> : <span style={valueStyle}>{formData.address}</span>}
          </div>
          {/* Row 5 - Emergency Contact */}
          <div style={{ gridColumn: '1 / -1', padding: '13px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <label style={labelStyle}>{text.emerName}</label>
            {isEditing ? <input style={inputStyle} value={formData.emerName} onChange={e => handleChange('emerName', e.target.value)} className="prof-input" /> : <span style={valueStyle}>{formData.emerName}</span>}
          </div>
          <div style={{ gridColumn: '1 / -1', padding: '13px 0' }}>
            <label style={labelStyle}>{text.emerPhone}</label>
            {isEditing ? <input style={inputStyle} value={formData.emerPhone} onChange={e => handleChange('emerPhone', e.target.value)} className="prof-input" /> : <span style={valueStyle}>{formData.emerPhone}</span>}
          </div>
        </div>
      </div>

      {/* ── PREGNANCY DETAILS CARD (Mother Only) ── */}
      {patientType === 'mother' && (
        <div className="px-mobile-16" style={cardStyle}>
          <div style={headerStyle}>
            <FaBabyCarriage size={16} color="var(--accent)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>{text.pregnancy}</span>
          </div>
          <div style={{ padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ padding: '13px 0', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', paddingRight: '12px' }}>
              <label style={labelStyle}>{text.weeks}</label>
              {isEditing ? <input style={inputStyle} value={formData.weeks} onChange={e => handleChange('weeks', e.target.value)} className="prof-input" /> : <span style={valueStyle}>{formData.weeks} Weeks</span>}
            </div>
            <div style={{ padding: '13px 0', borderBottom: '1px solid var(--border-subtle)', paddingLeft: '12px' }}>
              <label style={labelStyle}>{text.edd}</label>
              {isEditing ? <input style={inputStyle} value={formData.edd} onChange={e => handleChange('edd', e.target.value)} className="prof-input" /> : <span style={valueStyle}>{formData.edd}</span>}
            </div>
            <div style={{ padding: '13px 0', borderRight: '1px solid var(--border-subtle)', paddingRight: '12px' }}>
              <label style={labelStyle}>{text.prev}</label>
              {isEditing ? <input style={inputStyle} value={formData.gravida} onChange={e => handleChange('gravida', e.target.value)} className="prof-input" /> : <span style={valueStyle}>{formData.gravida}</span>}
            </div>
            <div style={{ padding: '13px 0', paddingLeft: '12px' }}>
              <label style={labelStyle}>{text.plan}</label>
              {isEditing ? <input style={inputStyle} value={formData.plan} onChange={e => handleChange('plan', e.target.value)} className="prof-input" /> : <span style={valueStyle}>{formData.plan}</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── RING INFORMATION CARD ── */}
      <div className="px-mobile-16" style={{ ...cardStyle, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FaBroadcastTower size={16} color="var(--success)" />
          <span style={{ fontSize: '15px', fontWeight: 600 }}>{text.ring}</span>
        </div>
        
        {/* Row 1: Serial */}
        <div style={{ display: 'flex', justifySpaceBetween: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{text.serial}</span>
          <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'monospace' }}>MS-RNG-2025B</span>
        </div>

        {/* Row 2: Battery */}
        <div style={{ display: 'flex', justifySpaceBetween: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{text.battery}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '60px', height: '8px', background: 'var(--border)', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{ width: '82%', height: '100%', background: 'var(--success)', borderRadius: '100px' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--success)' }}>82%</span>
          </div>
        </div>

        {/* Row 3: Connection */}
        <div style={{ display: 'flex', justifySpaceBetween: 'space-between', alignItems: 'center', padding: '12px 0', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{text.status}</span>
          <div style={{
            background: 'var(--success-light)', color: 'var(--success)',
            border: '1px solid var(--success)', borderRadius: '100px',
            padding: '4px 12px', fontSize: '12px', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)',
              animation: 'connectedPulse 2s infinite'
            }} />
            {text.connected}
          </div>
        </div>
      </div>

      {/* ── BUTTONS ── */}
      <div className="px-mobile-16" style={{ padding: '0 24px 24px 24px' }}>
        <button 
          onClick={() => {
            const surveyPath = patientType === 'mother' ? '/mother/medical-history' : (patientType === 'elderly' ? '/elderly/health-survey' : '/wellness/health-survey');
            navigate(surveyPath, { state: { fromProfile: true } });
          }}
          style={{
            width: '100%', height: '52px', background: 'var(--accent-subtle)',
            color: 'var(--accent)', border: '1.5px solid var(--accent)',
            borderRadius: 'var(--radius-md)', fontSize: '15px', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginBottom: '16px', cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          <FaHeartbeat size={16} /> {text.updateHistory}
        </button>

        <button 
          onClick={handleLogout}
          style={{
            width: '100%', height: '48px', background: 'transparent',
            color: 'var(--danger)', border: '1.5px solid var(--danger)',
            borderRadius: 'var(--radius-md)', fontSize: '15px', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          <FaSignOutAlt size={16} /> {text.logout}
        </button>
      </div>

      {/* ── SAVE/CANCEL OVERLAY (Sticky Bottom) ── */}
      {isEditing && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
          padding: '16px 24px', 
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          zIndex: 100,
          display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <button 
            onClick={handleSave}
            disabled={loading}
            style={{
              width: '100%', height: '52px', background: 'var(--accent)',
              color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
            {loading ? text.saving : text.save}
          </button>
          <button 
            onClick={handleCancel}
            disabled={loading}
            style={{
              width: '100%', height: '48px', background: 'transparent',
              color: 'var(--text-secondary)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-md)', fontSize: '15px', fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {text.cancel}
          </button>
        </div>
      )}
    </MotherLayout>
  );
};

export default MotherProfileScreen;
