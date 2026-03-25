import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUserNurse, FaStethoscope, FaFemale, FaCheck, FaUserFriends, FaUserAlt } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';

const RoleSetupScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setupRole } = useAuth();
  const preSelectedRole = location.state?.preSelectedRole || null;
  const preSelectedType = location.state?.preSelectedType || '';
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(preSelectedRole);
  const autoSetupTriggered = useRef(false);

  const completeSetup = async (roleToSetup, typeToSetup = '') => {
    if (!roleToSetup) return;
    setLoading(true);
    try {
      if (roleToSetup === 'asha') await setupRole('asha', '', true);
      else if (roleToSetup === 'doctor') await setupRole('doctor', '', true);
      else if (roleToSetup === 'caretaker') await setupRole('caretaker', '', true);
      else await setupRole(roleToSetup, typeToSetup, false);

      if (roleToSetup === 'asha') navigate('/asha/dashboard', { replace: true });
      else if (roleToSetup === 'doctor') navigate('/doctor/dashboard', { replace: true });
      else if (roleToSetup === 'mother') navigate('/mother/medical-history', { replace: true });
      else if (roleToSetup === 'caretaker') navigate('/family-dashboard', { replace: true });
      else if (roleToSetup === 'patient') {
        if (typeToSetup === 'elderly') navigate('/elderly/health-survey', { replace: true });
        else if (typeToSetup === 'wellness') navigate('/wellness/health-survey', { replace: true });
        else navigate('/welcome', { replace: true });
      }
      else navigate('/welcome', { replace: true });
    } catch (e) {
      console.error(e);
      setLoading(false);
      alert("Role setup failed. Please try again.");
    }
  };

  const handleCompleteSetup = async () => {
    await completeSetup(selectedRole, preSelectedType);
  };

  useEffect(() => {
    if (!preSelectedRole || autoSetupTriggered.current) return;
    autoSetupTriggered.current = true;
    void completeSetup(preSelectedRole, preSelectedType);
  }, [preSelectedRole, preSelectedType]);

  if (preSelectedRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-primary px-24 py-40">
        <div className="w-full max-w-md text-center">
          <h1 className="display text-center m-b-8">Welcome to MaaSathi</h1>
          <p className="body-large text-secondary text-center m-b-40">
            Setting up your profile and taking you to dashboard...
          </p>
          <button
            className="btn btn-primary w-full"
            disabled
            style={{ opacity: 0.8, height: '52px' }}
          >
            {loading ? 'Setting up profile...' : 'Preparing your account...'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary px-24 py-40">
      <div className="w-full max-w-md">
        <h1 className="display text-center m-b-8">Welcome to MaaSathi</h1>
        <p className="body-large text-secondary text-center m-b-40">
          Confirm your role to complete setup.
        </p>

        <div className="flex flex-col gap-12">
          {[
            { id: 'asha', icon: FaUserNurse, label: 'ASHA Worker', sub: 'Community health volunteer', color: 'var(--accent)', bg: 'var(--accent-light)' },
            { id: 'doctor', icon: FaStethoscope, label: 'Doctor / Nurse', sub: 'PHC Medical Officer', color: 'var(--info)', bg: '#E3F2FD' },
            { id: 'mother', icon: FaFemale, label: 'Mother', sub: 'Pregnant or New Mother', color: 'var(--success)', bg: '#DCFCE7' },
            { id: 'patient', icon: FaUserAlt, label: 'Patient', sub: 'Elderly or Wellness User', color: 'var(--accent)', bg: 'var(--accent-subtle)' },
            { id: 'caretaker', icon: FaUserFriends, label: 'Caretaker', sub: 'Family member or Caregiver', color: '#F59E0B', bg: '#FEF3C7' },
          ].map(role => (
            <button 
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`card flex items-center justify-between p-16 w-full transition-all text-left border-2 ${selectedRole === role.id ? 'border-accent shadow-elevated' : 'border-[var(--border)] bg-surface'}`}
              style={{ borderRadius: '16px' }}
            >
              <div className="flex items-center gap-12">
                <div className="p-12 rounded-pill" style={{ backgroundColor: role.bg, color: role.color }}>
                  <role.icon size={20} />
                </div>
                <div>
                  <h3 className="h3 text-primary" style={{ margin: 0, fontSize: '16px' }}>{role.label}</h3>
                  <p className="body-small text-secondary" style={{ textTransform: 'none', marginTop: '2px', fontSize: '12px' }}>{role.sub}</p>
                </div>
              </div>
              {selectedRole === role.id && <FaCheck size={18} className="text-accent" />}
            </button>
          ))}
        </div>

        <button 
          className="btn btn-primary w-full m-t-32"
          onClick={handleCompleteSetup}
          disabled={!selectedRole || loading}
          style={{ opacity: selectedRole && !loading ? 1 : 0.6, height: '52px' }}
        >
          {loading ? 'Setting up profile...' : 'Continue to Dashboard'}
        </button>
      </div>
    </div>
  );
};

export default RoleSetupScreen;
