import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUserNurse, FaStethoscope, FaFemale, FaUserFriends, FaArrowLeft, FaHeartbeat, FaUserAlt } from 'react-icons/fa';
import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { getRouteFromProfile } from '../../utils/authRedirect';

const ROLE_IMAGES = {
  asha: '/login_asha_v11.png',
  doctor: '/login_doctor_v8.png',
  mother: '/login_mother_v8.png',
  patient: '/login_patient_v11.png',
  caretaker: '/login_caretaker_v9.png',
};

const ROLES = [
  { id: 'asha', icon: FaUserNurse, label: 'ASHA', color: '#C2185B' },
  { id: 'doctor', icon: FaStethoscope, label: 'Doctor', color: '#4C56AF' },
  { id: 'mother', icon: FaFemale, label: 'Mother', color: '#005A27' },
  { id: 'patient', icon: FaUserAlt, label: 'Patient', color: '#9B0044' },
  { id: 'caretaker', icon: FaUserFriends, label: 'Caretaker', color: '#B45309' },
];

const QUOTES = {
  asha: "Bridging the gap to rural health.",
  doctor: "Healing hands, caring hearts.",
  mother: "Nurturing life with precision.",
  patient: "Personalized care at your doorstep.",
  caretaker: "Supporting your loved ones always.",
};

const LoginScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const { loginWithGoogle, loading } = useAuth();

  const initialRole = location.state?.role || 'mother';
  const initialType = location.state?.type || '';
  const initialMode = location.state?.mode === 'signup' ? 'signup' : 'login';
  const preSelectedRoleFromFlow = location.state?.role || '';
  const [role, setRole] = useState(initialRole);
  const [mode, setMode] = useState(initialMode); 
  const isLoginMode = mode === 'login';
  const shouldShowRoleCards = mode === 'signup' && !preSelectedRoleFromFlow;

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();

      if (result?.firestoreUnavailable) {
        alert(result.firestoreMessage || (language === 'en'
          ? 'Google sign-in succeeded but profile storage is unavailable.'
          : 'Google లాగిన్ విజయవంతమైంది కానీ ప్రొఫైల్ స్టోరేజ్ అందుబాటులో లేదు.'));
        return;
      }

      if (!result?.isNewUser && result?.profile) {
        if (!isLoginMode) {
          alert(language === 'en'
            ? 'Account already exists. Please login.'
            : 'ఖాతా ఇప్పటికే ఉంది. దయచేసి లాగిన్ అవ్వండి.');
          setRole(result.profile.role || role);
          setMode('login');
          navigate('/login', {
            replace: true,
            state: {
              role: result.profile.role || role,
              type: result.profile.patientType || '',
              mode: 'login'
            }
          });
          return;
        }

        navigate(getRouteFromProfile(result.profile), { replace: true });
        return;
      }

      if (result?.isNewUser || !result?.profile) {
        if (isLoginMode) {
          const hasKnownRole = Boolean(preSelectedRoleFromFlow);
          if (hasKnownRole) {
            navigate('/role-setup', {
              replace: true,
              state: {
                preSelectedRole: role,
                preSelectedType: role === 'patient' ? initialType : ''
              }
            });
            return;
          }

          navigate('/role-setup', { replace: true });
          return;
        }

        if (preSelectedRoleFromFlow && preSelectedRoleFromFlow !== role) {
          setRole(preSelectedRoleFromFlow);
        }

        if (role === 'patient' && !initialType) {
          navigate('/patient-type-select', { replace: true, state: { mode: 'signup' } });
          return;
        }

        navigate('/role-setup', {
          replace: true,
          state: {
            preSelectedRole: role,
            preSelectedType: role === 'patient' ? initialType : ''
          }
        });
        return;
      }
    } catch (err) {
      console.error(err);
      alert(language === 'en' ? 'Auth failed' : 'లాగిన్ విఫలమైంది');
    }
  };

  const text = {
    en: {
      loginTitle: 'Welcome Back',
      loginSub: 'Continue with Google to access your account',
      signupSub: 'Select your role to create account',
      switchSignup: 'New to MaaSathi? Create Account',
      switchLogin: 'Already have an account? Login',
      continueGoogle: 'Continue with Google',
    },
    te: {
      loginTitle: 'మళ్ళీ స్వాగతం',
      loginSub: 'మీ ఖాతాలోకి వెళ్లేందుకు Googleతో కొనసాగండి',
      signupSub: 'ఖాతా సృష్టించడానికి మీ పాత్రను ఎంచుకోండి',
      switchSignup: 'కొత్త వినియోగదారుడా? ఖాతా తెరవండి',
      switchLogin: 'ఇప్పటికే ఖాతా ఉందా? లాగిన్ అవ్వండి',
      continueGoogle: 'Googleతో లాగిన్ అవ్వండి',
    }
  }[language];

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: '#FFFFFF', fontFamily: '"DM Sans", sans-serif', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 960px) {
          .main-wrapper { flex-direction: column !important; overflow-y: auto !important; height: auto !important; overflow-x: hidden !important; }
          .hero-side { 
            position: relative !important; 
            width: 100% !important; 
            height: 280px !important; 
            padding: 16px !important; 
            padding-top: calc(16px + env(safe-area-inset-top)) !important;
          }
          .form-side { 
            width: 100% !important; 
            padding: 16px !important; 
            height: auto !important; 
            overflow: visible !important; 
            padding-bottom: calc(40px + env(safe-area-inset-bottom)) !important;
          }
          .top-left-btn, .top-right-group { 
            position: static !important; 
            margin-bottom: 24px !important; 
          }
          .top-controls-wrapper {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
            margin-bottom: 24px !important;
          }
          .role-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .role-card { padding: 12px 8px !important; }
        }
        
        .role-card {
          padding: 16px; border-radius: 16px; background: #FFFFFF; border: 1.5px solid #E8EAED;
          cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .role-card:hover { border-color: #C2185B; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(194, 24, 91, 0.08); }
        .role-card[data-active="true"] { border-color: #C2185B; background: #FDF6F9; border-width: 2px; }

        .btn-google {
          width: 100%; height: 54px; background: #FFF; border: 1.5px solid #E8EAED; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; gap: 12px; font-weight: 700; cursor: pointer;
          transition: all 0.2s ease; margin-top: 16px; padding: 0 16px; overflow: hidden; white-space: nowrap;
        }
        .btn-google:hover { background: #F8F9FA; border-color: #C2185B; }
        .btn-google span { overflow: hidden; text-overflow: ellipsis; }
      `}} />

      <div className="main-wrapper" style={{ display: 'flex', width: '100%', height: '100dvh', overflow: 'hidden' }}>
        {/* HERO SIDE: Slideshow based on role */}
        <div className="hero-side" style={{
          position: 'relative', width: '40%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          backgroundColor: '#FFFFFF', zIndex: 1, padding: '80px'
        }}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={role}
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <img 
                src={ROLE_IMAGES[role]} 
                alt={`${role} Illustration`} 
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
              />
              
              <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: 'max-content' }}>
                <div style={{ 
                  fontSize: '14px', fontWeight: 600, fontStyle: 'italic', color: '#594045', 
                  background: 'rgba(255, 255, 255, 0.95)', padding: '6px 16px', borderRadius: '100px',
                  border: '1px solid #E1E3E4', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                }}>
                  "{QUOTES[role]}"
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* FORM SIDE */}
        <div className="form-side" style={{
          width: '60%', height: '100dvh', position: 'relative',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 100px',
          backgroundColor: '#FFFFFF', overflow: 'hidden'
        }}>
          {/* Integrated Top Controls for Mobile Responsiveness */}
          <div className="top-controls-wrapper" style={{ position: 'relative', width: '100%', display: 'contents' }}>
            <div className="top-right-group" style={{ position: 'absolute', top: 32, right: 32, display: 'flex', gap: '8px', zIndex: 100 }}>
              <button onClick={() => toggleLanguage(language === 'en' ? 'te' : 'en')} style={{ padding: '6px 14px', borderRadius: '100px', border: '1px solid #e1e3e4', background: '#FFFFFF', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{language.toUpperCase()}</button>
              <button onClick={toggleTheme} style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid #e1e3e4', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {theme === 'light' ? <MdOutlineDarkMode size={18} /> : <MdOutlineLightMode size={18} />}
              </button>
            </div>

            <button className="top-left-btn" onClick={() => navigate('/welcome')} style={{ position: 'absolute', top: 32, left: 32, border: 'none', background: '#F8F9FA', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <FaArrowLeft size={16} />
            </button>
          </div>

          <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
             <div style={{ display: 'flex', background: '#F8F9FA', borderRadius: '12px', padding: '4px', marginBottom: '32px' }}>
              <button 
                onClick={() => setMode('login')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: mode === 'login' ? '#FFF' : 'transparent', fontWeight: 700, cursor: 'pointer', color: mode === 'login' ? '#C2185B' : '#8D6F75' }}
              >Login</button>
              <button 
                onClick={() => setMode('signup')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: mode === 'signup' ? '#FFF' : 'transparent', fontWeight: 700, cursor: 'pointer', color: mode === 'signup' ? '#C2185B' : '#8D6F75' }}
              >Sign Up</button>
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#191c1d', marginBottom: '8px' }}>{text.loginTitle}</h1>
            <p style={{ fontSize: '15px', color: '#594045', marginBottom: '32px' }}>
              {isLoginMode ? text.loginSub : (shouldShowRoleCards ? text.signupSub : text.loginSub)}
            </p>

            {shouldShowRoleCards && (
              <div className="role-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
                {ROLES.map((r) => (
                  <div key={r.id} className="role-card" data-active={role === r.id} onClick={() => setRole(r.id)}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${r.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <r.icon size={20} color={r.color} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{r.label}</div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleGoogleLogin} disabled={loading} className="btn-google">
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M47.5 24.5C47.5 22.8 47.3 21.2 47.1 19.6H24.5V28.9H37.4C36.8 31.9 35.1 34.4 32.5 36.1V41.9H40.2C44.7 37.8 47.5 31.7 47.5 24.5Z"/><path fill="#34A853" d="M24.5 48C30.9 48 36.4 45.9 40.2 41.9L32.5 36.1C30.4 37.5 27.7 38.3 24.5 38.3C18.3 38.3 13 34.1 11.1 28.5H3.2V34.6C7.1 42.4 15.2 48 24.5 48Z"/><path fill="#FBBC05" d="M11.1 28.5C10.6 27 10.3 25.4 10.3 23.8C10.3 22.2 10.6 20.6 11.1 19.1V13H3.2C1.6 16.2 0.7 19.9 0.7 23.8C0.7 27.7 1.6 31.4 3.2 34.6L11.1 28.5Z"/><path fill="#EA4335" d="M24.5 9.4C28 9.4 31.1 10.6 33.6 12.9L40.4 6C36.3 2.3 30.9 0 24.5 0C15.2 0 7.1 5.6 3.2 13.4L11.1 19.5C13 13.9 18.3 9.4 24.5 9.4Z"/></svg>
              <span>{loading ? 'Authenticating...' : text.continueGoogle}</span>
            </button>

            <p onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#C2185B', marginTop: '24px', cursor: 'pointer' }}>
              {mode === 'login' ? text.switchSignup : text.switchLogin}
            </p>

            <p style={{ textAlign: 'center', fontSize: '11px', color: '#8d6f75', marginTop: '24px' }}>By continuing, you agree to our Terms and Privacy Policy.</p>

            <button 
              onClick={() => {
                let target = `/${role}/dashboard`;
                if (role === 'patient') target = '/dashboard/elderly';
                if (role === 'caretaker') target = '/family-dashboard';
                navigate(target);
              }} 
              style={{ width: '100%', marginTop: '12px', height: '40px', background: 'transparent', border: 'none', fontSize: '12px', color: '#8d6f75', cursor: 'pointer' }}
            >
              Skip Login (Dev Mode)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
