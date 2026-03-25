import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaUserFriends, FaHeartbeat, FaChevronRight, FaMagic } from 'react-icons/fa';
import { MdPregnantWoman } from 'react-icons/md';

const PatientTypeSelect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const nextMode = location.state?.mode === 'signup' ? 'signup' : 'login';

  const cards = [
    {
      id: 'pregnant',
      title: 'Pregnant Mother',
      subtitle: 'Track your pregnancy, vitals and health reports',
      icon: <MdPregnantWoman size={30} color="var(--accent)" />,
      bg: 'var(--accent-light)',
      role: 'mother',
      type: 'pregnant'
    },
    {
      id: 'elderly',
      title: 'Elderly Patient',
      subtitle: 'Monitor chronic conditions, vitals and share reports with doctor',
      icon: <FaUserFriends size={30} color="var(--info)" />,
      bg: 'var(--info-light)',
      role: 'patient',
      type: 'elderly'
    },
    {
      id: 'wellness',
      title: 'Wellness User',
      subtitle: 'Track your general health, fitness and stay on top of your wellbeing',
      icon: <FaHeartbeat size={30} color="var(--success)" />,
      bg: 'var(--success-light)',
      role: 'patient',
      type: 'wellness'
    }
  ];

  const handleCardClick = (card) => {
    // Preserve signup/login mode while selecting patient subtype.
    navigate('/login', { state: { role: card.role, type: card.type, mode: nextMode } });
  };

  const handleGuestSurvey = (card) => {
    const paths = {
      pregnant: '/mother/medical-history',
      elderly: '/elderly/health-survey',
      wellness: '/wellness/health-survey'
    };
    navigate(paths[card.type], { state: { isGuest: true, patientType: card.type } });
  };

  return (
    <div className="patient-type-container" style={{
      background: 'var(--bg-secondary)',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      position: 'relative',
      fontFamily: '"DM Sans", sans-serif'
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        .selection-card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 18px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          text-align: left;
        }
        .selection-card:hover {
          border-color: var(--accent);
          background: var(--accent-subtle);
        }
        .icon-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
      `}} />

      {/* Back Arrow */}
      <button 
        onClick={() => navigate('/welcome')}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-primary)'
        }}
      >
        <FaArrowLeft size={16} />
      </button>

      <div style={{ maxWidth: '480px', width: '100%' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 800, 
          color: 'var(--text-primary)', 
          textAlign: 'center', 
          marginBottom: '8px',
          marginTop: 0
        }}>
          I am a...
        </h1>
        <p style={{ 
          fontSize: '14px', 
          color: 'var(--text-secondary)', 
          textAlign: 'center', 
          marginBottom: '32px' 
        }}>
          Select the option that best describes you
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
          {cards.map((card) => (
            <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div 
                className="selection-card"
                onClick={() => handleCardClick(card)}
              >
                <div className="icon-circle" style={{ background: card.bg }}>
                  {card.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
                    {card.subtitle}
                  </div>
                </div>
                <FaChevronRight size={16} color="var(--text-tertiary)" style={{ marginLeft: 'auto' }} />
              </div>
              
              <button 
                onClick={() => handleGuestSurvey(card)}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent)', 
                  fontSize: '13px', fontWeight: 600, padding: '4px 8px', 
                  alignSelf: 'flex-end', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '4px'
                }}
              >
                Take survey without login <FaMagic size={12} />
              </button>
            </div>
          ))}
        </div>

        <p style={{ 
          fontSize: '12px', 
          color: 'var(--text-tertiary)', 
          textAlign: 'center', 
          marginTop: '16px' 
        }}>
          Not sure? You can change this later in your profile settings.
        </p>
      </div>
    </div>
  );
};

export default PatientTypeSelect;
