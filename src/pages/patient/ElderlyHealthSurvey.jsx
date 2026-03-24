import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaArrowLeft, FaCalendarAlt, FaHeartbeat, FaPills, 
  FaWalking, FaUserFriends, FaBrain, FaLungs, 
  FaExclamationCircle, FaMagic, FaCheck, FaMicrophone, FaStop,
  FaBed, FaStethoscope, FaRunning
} from 'react-icons/fa';
import { MdOutlineBrightness4, MdOutlineBedtime } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const translations = {
  en: {
    title: "Elderly Health Profile",
    subtitle: "Complete this survey for personalized AI health monitoring",
    progress: (answered, total) => `${answered} of ${total} answered`,
    generateBtn: "Complete & Generate Insights",
    questions: [
      {
        id: "age",
        text: "How old are you?",
        icon: FaCalendarAlt,
        color: 'var(--accent)',
        options: ["60-65 years", "66-70 years", "71-80 years", "Above 80 years"]
      },
      {
        id: "conditions",
        text: "Do you have any existing conditions?",
        icon: FaHeartbeat,
        color: 'var(--danger)',
        options: ["None", "High Blood Pressure (BP)", "Diabetes", "Heart Disease", "Multiple (Diabetes & BP)"]
      },
      {
        id: "mobility",
        text: "How would you describe your mobility?",
        icon: FaWalking,
        color: 'var(--accent)',
        options: ["Fully independent", "Walk with a cane/walker", "Need assistant to walk", "Mostly bedridden"]
      },
      {
        id: "falls",
        text: "Any history of falls in the last 6 months?",
        icon: FaExclamationCircle,
        color: 'var(--danger)',
        options: ["No falls", "1 fall (no injury)", "1 or more falls (with injury)", "Frequent falls"]
      },
      {
        id: "medications",
        text: "How many medications do you take daily?",
        icon: FaPills,
        color: 'var(--success)',
        options: ["None", "1-2 pills", "3-5 pills", "More than 5 pills"]
      },
      {
        id: "breathing",
        text: "Do you experience any breathing problems?",
        icon: FaLungs,
        color: 'var(--info)',
        options: ["No breathing issues", "Shortness of breath on walking", "Asthma/COPD", "Severe breathing distress"]
      },
      {
        id: "neurological",
        text: "Any neurological or memory issues?",
        icon: FaBrain,
        color: 'var(--accent)',
        options: ["No issues", "Mild forgetfulness", "Early Dementia/Alzheimer's", "Parkinson's Disease"]
      },
      {
        id: "sleep",
        text: "How is your sleep quality?",
        icon: FaBed,
        color: 'var(--info)',
        options: ["Good (7-8 hours)", "Interrupted sleep", "Insomnia / Difficulty falling asleep", "Sleep apnea / Snoring issues"]
      },
      {
        id: "caretaker",
        text: "Is there a caretaker available at home?",
        icon: FaUserFriends,
        color: 'var(--success)',
        options: ["I live alone", "Spouse/Partner available", "Family/Children available", "Full-time professional nurse"]
      },
      {
        id: "symptoms",
        text: "Have you noticed any recent symptoms?",
        icon: FaStethoscope,
        color: 'var(--warning)',
        options: ["No recent symptoms", "Frequent dizziness", "Chest pain / Palpitations", "Joint pain / Immobility"]
      }
    ]
  },
  te: {
    title: "వృద్ధుల ఆరోగ్య ప్రొఫైల్",
    subtitle: "వ్యక్తిగతీకరించిన AI మేనేజ్‌మెంట్ కోసం ఈ సర్వేను పూర్తి చేయండి",
    progress: (answered, total) => `${total} లో ${answered} పూర్తి చేసారు`,
    generateBtn: "పూర్తి చేసి రిపోర్టును పొందండి",
    questions: [
      {
        id: "age",
        text: "మీ వయస్సు ఎంత?",
        options: ["60-65 ఏళ్లు", "66-70 ఏళ్లు", "71-80 ఏళ్లు", "80 ఏళ్లకు పైగా"]
      },
      { id: "conditions", text: "మీకు వయస్సు సంబంధిత జబ్బులు ఉన్నాయా?", options: ["ఏమీ లేవు", "అధిక రక్తపోటు (BP)", "మధుమేహం (Diabetes)", "గుండె జబ్బులు", "రెండు (మధుమేహం & BP)"] },
      { id: "mobility", text: "మీరు ఎలా నడవగలరు?", options: ["స్వతంత్రంగా నడవగలను", "కర్ర/వాకర్ సహాయంతో", "ఒకరి సహాయం ఉండాలి", "ఎక్కువగా మంచానికే పరిమితం"] },
      { id: "falls", text: "గత 6 నెలల్లో ఏమైనా పడిపోయారా?", options: ["పడిపోలేదు", "ఒకసారి (గాయం కాలేదు)", "ఒకటి కంటే ఎక్కువసార్లు", "తరచుగా పడుతుంటాను"] },
      { id: "medications", text: "రోజూ ఎన్ని మందులు వాడుతున్నారు?", options: ["ఏమీ లేవు", "1-2 మందులు", "3-5 మందులు", "5 కంటే ఎక్కువ"] },
      { id: "breathing", text: "శ్వాస తీసుకోవడంలో ఇబ్బంది ఉందా?", options: ["శ్వాస ఇబ్బంది లేదు", "నడిచినప్పుడు ఆయాసం", "ఆస్తమా / ఊపిరితిత్తుల వ్యాధి", "తీవ్రమైన శ్వాస ఇబ్బంది"] },
      { id: "neurological", text: "జ్ఞాపకశక్తి లేదా నరాల సమస్యలు ఉన్నాయా?", options: ["ఏమీ లేవు", "స్వల్ప మతిమరుపు", "చిత్తవైకల్యం / అల్జీమర్స్", "పార్కిన్సన్ వ్యాధి"] },
      { id: "sleep", text: "మీ నిద్ర ఎలా ఉంది?", options: ["మంచి నిద్ర (7-8 గంటలు)", "మధ్యలో మెళకువ వస్తోంది", "నిద్రలేమి", "గురక / శ్వాస ఇబ్బంది"] },
      { id: "caretaker", text: "మీ సంరక్షణ కోసం ఎవరైనా ఉన్నారా?", options: ["నేను ఒంటరిగా ఉంటాను", "భార్య / భర్త ఉన్నారు", "కుటుంబ సభ్యులు ఉన్నారు", "పూర్తి సమయం నర్స్ ఉన్నారు"] },
      { id: "symptoms", text: "ఇటీవల ఏవైనా లక్షణాలు కనిపిస్తున్నాయా?", options: ["ఏమీ లేవు", "తరచుగా తల తిరగడం", "ఛాతీ నొప్పి / గుండె దడ", "కీళ్ల నొప్పులు / నడవలేకపోవడం"] }
    ]
  }
};

const ElderlyHealthSurvey = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const { profile } = useAuth();
  const { isGuest = false } = useLocation().state || {};
  
  const [answers, setAnswers] = useState({});
  const [otherText, setOtherText] = useState({});
  const [recording, setRecording] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const t = translations[language] || translations.en;
  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === t.questions.length;
  const progressPercent = (answeredCount / t.questions.length) * 100;

  // Check if profile exists and redirect (Only if NOT guest)
  useEffect(() => {
    if (!isGuest && profile?.medicalHistory) {
      navigate('/dashboard/elderly');
    }
  }, [profile, navigate, isGuest]);

  const handleSelect = (qId, optIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleOtherText = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: 'other' }));
    setOtherText(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async () => {
    if (!isComplete || isSubmitting) return;
    setIsSubmitting(true);
    
    // Construct simplified profile
    const profileAnswers = [];
    t.questions.forEach((q) => {
      const ansIdx = answers[q.id];
      const answerText = ansIdx === 'other' ? otherText[q.id] : q.options[ansIdx];
      profileAnswers.push({ question: q.text, answer: answerText, id: q.id });
    });

    try {
      if (profile?.uid) {
        // AI Analysis Simulation (Based on high-risk keywords)
        let aiStatus = 'STABLE';
        let aiParagraphEnglish = 'Overall health profile appears stable for your age group. Continue regular physical activity and follow your prescribed medication schedule.';
        
        const criticalSigns = ['Heart Disease', 'Severe breathing distress', 'Frequent falls', 'Chest pain / Palpitations'];
        const moderateSigns = ['High Blood Pressure', 'Diabetes', 'Shortness of breath on walking', '1 or more falls'];

        const rawAnswers = profileAnswers.map(a => a.answer);
        if (rawAnswers.some(ans => criticalSigns.includes(ans))) {
          aiStatus = 'CRITICAL';
          aiParagraphEnglish = 'URGENT: Your health profile indicates several high-risk indicators such as chest pain or frequent falls. We recommend an immediate consultation with your doctor. An alert has been sent to your primary healthcare provider.';
        } else if (rawAnswers.some(ans => moderateSigns.includes(ans))) {
          aiStatus = 'MODERATE';
          aiParagraphEnglish = 'MODERATE RISK: Your profile suggests chronic conditions like Blood Pressure or breathing difficulties. Please schedule a review with your doctor within the next 48 hours for a baseline checkup.';
        }

        // Save to Firebase
        await updateDoc(doc(db, 'users', profile.uid), {
          medicalHistory: {
            answers: profileAnswers,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          aiAssessment: {
            aiStatus,
            aiParagraphEnglish,
            updatedAt: new Date().toISOString()
          },
          patientType: 'elderly',
          isSurveyCompleted: true
        });

        // Add to reports collection for record keeping
        await addDoc(collection(db, 'reports'), {
          patientId: profile.uid,
          patientName: profile.name,
          patientType: 'elderly',
          aiStatus,
          aiParagraphEnglish,
          type: 'Initial Assessment',
          createdAt: serverTimestamp()
        });

        // Trigger Alert if CRITICAL
        if (aiStatus === 'CRITICAL') {
           await addDoc(collection(db, 'alerts'), {
             type: 'aiCritical',
             patientId: profile.uid,
             patientName: profile.name,
             doctorId: profile.linkedDoctorId || 'SHA-101',
             status: 'active',
             message: 'Critical AI assessment based on health profile',
             createdAt: serverTimestamp()
           });
        }
      }
      
      if (isGuest) {
        // Construct basic result for the result screen
        let aiStatus = 'STABLE';
        const criticalSigns = ['Heart Disease', 'Severe breathing distress', 'Frequent falls', 'Chest pain / Palpitations'];
        const moderateSigns = ['High Blood Pressure', 'Diabetes', 'Shortness of breath on walking', '1 or more falls'];
        const rawAnswers = profileAnswers.map(a => a.answer);
        if (rawAnswers.some(ans => criticalSigns.includes(ans))) aiStatus = 'CRITICAL';
        else if (rawAnswers.some(ans => moderateSigns.includes(ans))) aiStatus = 'MODERATE';

        navigate('/shared/ai-report', { 
          state: { 
            answers, 
            questions: t.questions,
            isGuest: true,
            aiStatus,
            patient: { name: 'Guest User', age: answers.age || 'Unknown' }
          } 
        });
      } else {
        const { fromProfile = false } = useLocation().state || {};
        setTimeout(() => { navigate(fromProfile ? '/mother/profile' : '/dashboard/elderly'); }, 1500);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100dvh', fontFamily: 'var(--font-main)' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .opt-btn { width: 100%; min-height: 56px; background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius-md); padding: 14px 20px; text-align: left; font-family: inherit; font-size: 15px; font-weight: 500; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 14px; transition: all 0.15s; }
        .opt-btn:hover { background: var(--accent-subtle); border-color: var(--accent); }
        .opt-btn[data-selected="true"] { background: var(--accent-light); border-color: var(--accent); border-width: 2px; }
        .opt-indicator { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; }
        .opt-btn[data-selected="true"] .opt-indicator { background: var(--accent); border-color: var(--accent); }
        .generate-btn { 
          position: fixed; 
          bottom: calc(24px + env(safe-area-inset-bottom)); 
          left: 50%; 
          transform: translateX(-50%); 
          width: calc(100% - 40px); 
          max-width: 720px; 
          height: 52px; 
          border: none; 
          border-radius: var(--radius-md); 
          font-family: inherit; 
          font-size: 16px; 
          font-weight: 600; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 8px; 
          transition: all 0.2s; 
          background: var(--border); 
          color: var(--text-tertiary); 
          cursor: not-allowed; 
          z-index: 100; 
        }
        .generate-btn.active { background: var(--accent); color: white; box-shadow: 0 4px 20px rgba(194,24,91,0.35); cursor: pointer; }
      `}} />

      <header style={{ 
        background: 'var(--surface)', 
        borderBottom: '1px solid var(--border)', 
        padding: '16px 24px', 
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaArrowLeft size={16} />
          </button>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{t.title}</div>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '100px', padding: '4px' }}>
          <button onClick={() => toggleLanguage('en')} style={{ padding: '6px 12px', borderRadius: '100px', border: 'none', background: language === 'en' ? 'var(--accent)' : 'transparent', color: language === 'en' ? 'white' : 'var(--text-secondary)', fontWeight: 600 }}>EN</button>
          <button onClick={() => toggleLanguage('te')} style={{ padding: '6px 12px', borderRadius: '100px', border: 'none', background: language === 'te' ? 'var(--accent)' : 'transparent', color: language === 'te' ? 'white' : 'var(--text-secondary)', fontWeight: 600 }}>TE</button>
        </div>
      </header>

      <div className="px-mobile-16" style={{ padding: '16px 24px', background: 'var(--accent-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>{t.subtitle}</span>
        <div style={{ padding: '4px 12px', background: 'var(--surface)', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>{t.progress(answeredCount, t.questions.length)}</div>
      </div>

      <div style={{ height: '4px', background: 'var(--border)' }}>
        <div style={{ height: '100%', background: 'var(--accent)', width: `${progressPercent}%`, transition: 'width 0.3s' }} />
      </div>

      <div style={{ padding: '20px 0 120px 0', maxWidth: '720px', margin: '0 auto' }}>
        {t.questions.map((q, idx) => (
          <div key={q.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '20px', margin: '0 16px 16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <q.icon size={18} color={q.color || 'var(--accent)'} />
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>QUESTION {idx + 1}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{q.text}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {q.options.map((opt, oIdx) => (
                <button key={oIdx} className="opt-btn" onClick={() => handleSelect(q.id, oIdx)} data-selected={answers[q.id] === oIdx} style={{ padding: '12px 16px' }}>
                  <div className="opt-indicator">{answers[q.id] === oIdx && <FaCheck size={10} color="white" />}</div>
                  <span style={{ fontSize: '14px' }}>{opt}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className={`generate-btn ${isComplete ? 'active' : ''}`} onClick={handleSubmit}>
        {isSubmitting ? 'Storing Data...' : <><FaMagic /> {t.generateBtn}</>}
      </button>
    </div>
  );
};

export default ElderlyHealthSurvey;
