import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaArrowLeft, FaCalendarAlt, FaHeartbeat, FaRunning, FaBed, 
  FaAppleAlt, FaBrain, FaWeight, FaSyringe, FaMagic, 
  FaCheck, FaMicrophone, FaStop 
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';

const translations = {
  en: {
    title: "Your Wellness Profile",
    subtitle: "Tell us about yourself so we can personalize your experience",
    progress: (answered, total) => answered + " of " + total + " answered",
    generateBtn: "Complete Profile",
    questions: [
      {
        text: "What is your age group?",
        icon: FaCalendarAlt,
        color: 'var(--accent)',
        options: ["18 to 25 years", "26 to 35 years", "36 to 45 years", "Above 45 years"]
      },
      {
        text: "Do you have any existing health conditions?",
        icon: FaHeartbeat,
        color: 'var(--danger)',
        options: ["No known conditions", "Diabetes or pre-diabetes", "High blood pressure", "Thyroid issues"]
      },
      {
        text: "How active are you currently?",
        icon: FaRunning,
        color: 'var(--info)',
        options: ["Very active, exercise daily", "Moderately active, 3 to 4 times a week", "Lightly active, occasional walks", "Mostly sedentary"]
      },
      {
        text: "How is your sleep quality?",
        icon: FaBed,
        color: 'var(--accent)',
        options: ["Sleep well, 7 to 8 hours", "Sleep less than 6 hours", "Difficulty falling or staying asleep", "Very poor sleep, feeling exhausted"]
      },
      {
        text: "How would you rate your diet?",
        icon: FaAppleAlt,
        color: 'var(--success)',
        options: ["Healthy and balanced", "Fairly good but could improve", "Irregular, lots of processed food", "Very poor, skipping meals often"]
      },
      {
        text: "How is your stress level on most days?",
        icon: FaBrain,
        color: 'var(--warning)',
        options: ["Low stress, generally calm", "Moderate stress, manageable", "High stress, affecting daily life", "Very high, feeling overwhelmed"]
      },
      {
        text: "What is your primary health goal?",
        icon: FaWeight,
        color: 'var(--accent)',
        options: ["Lose weight", "Build fitness and strength", "Manage a health condition", "General wellness and prevention"]
      },
      {
        text: "Are you up to date on your routine health checkups?",
        icon: FaSyringe,
        color: 'var(--info)',
        options: ["Yes, all checkups done recently", "Some pending checkups", "Not done checkups in over a year", "Never had routine checkups"]
      }
    ]
  },
  te: {
    title: "మీ వెల్నెస్ ప్రోఫైల్",
    subtitle: "వ్యక్తిగత అనుభవం కోసం మీ గురించి మాకు తెలియజేయండి",
    progress: (answered, total) => total + " లో " + answered + " సమాధానం ఇచ్చారు",
    generateBtn: "ప్రొఫైల్ పూర్తి చేయండి",
    questions: [
      {
        text: "మీ వయస్సు గ్రూప్ ఏది?",
        icon: FaCalendarAlt,
        color: 'var(--accent)',
        options: ["18 నుండి 25 సంవత్సరాలు", "26 నుండి 35 సంవత్సరాలు", "36 నుండి 45 సంవత్సరాలు", "45 సంవత్సరాల పైన"]
      },
      {
        text: "మీకు ప్రస్తుతం ఏవైనా ఆరోగ్య సమస్యలు ఉన్నాయా?",
        icon: FaHeartbeat,
        color: 'var(--danger)',
        options: ["ఏ సమస్యలు లేవు", "డయాబెటిస్ లేదా ప్రీ-డయాబెటిస్", "అధిక రక్తపోటు", "థైరాయిడ్ సమస్యలు"]
      },
      {
        text: "మీరు ప్రస్తుతం ఎంత చురుకుగా ఉన్నారు?",
        icon: FaRunning,
        color: 'var(--info)',
        options: ["చాలా చురుకుగా, రోజూ వ్యాయామం", "మధ్యస్థంగా చురుకుగా, వారానికి 3-4 సార్లు", "తేలికపాటి చురుకుగా, అప్పుడప్పుడు నడక", "ఎక్కువగా కూర్చుని ఉండే పనులు"]
      },
      {
        text: "మీ నిద్ర నాణ్యత ఎలా ఉంది?",
        icon: FaBed,
        color: 'var(--accent)',
        options: ["బాగా నిద్రపోతాను, 7-8 గంటలు", "6 గంటల కంటే తక్కువ నిద్ర", "నిద్రపోవడంలో లేదా నిద్ర పట్టడంలో ఇబ్బంది", "చాలా తక్కువ నిద్ర, అలసిపోయినట్లు అనిపిస్తుంది"]
      },
      {
        text: "మీ ఆహారం ఎలా ఉంటుందని మీరు భావిస్తారు?",
        icon: FaAppleAlt,
        color: 'var(--success)',
        options: ["ఆరోగ్యకరమైన మరియు సమతుల్యమైనది", "దాదాపు బాగుంది కానీ మెరుగుపడాలి", "క్రమం తప్పకుండా, ప్రాసెస్ చేసిన ఆహారం", "చాలా తక్కువ, తరచుగా భోజనం మానేయడం"]
      },
      {
        text: "మీ రోజువారీ ఒత్తిడి స్థాయి ఎలా ఉంటుంది?",
        icon: FaBrain,
        color: 'var(--warning)',
        options: ["తక్కువ ఒత్తిడి, సాధారణంగా ప్రశాంతం", "మధ్యస్థ ఒత్తిడి, తట్టుకోగలిగినంత", "అధిక ఒత్తిడి, రోజువారీ జీవితంపై ప్రభావం", "చాలా ఎక్కువ, తట్టుకోలేనంత ఒత్తిడి"]
      },
      {
        text: "మీ ప్రధాన ఆరోగ్య లక్ష్యం ఏమిటి?",
        icon: FaWeight,
        color: 'var(--accent)',
        options: ["బరువు తగ్గడం", "ఫిట్నెస్ మరియు బలాన్ని పెంచడం", "ఆరోగ్య సమస్యను నిర్వహించడం", "సాధారణ ఆరోగ్యం మరియు నివారణ"]
      },
      {
        text: "మీరు సాధారణ ఆరోగ్య పరీక్షలు చేయించుకున్నారా?",
        icon: FaSyringe,
        color: 'var(--info)',
        options: ["అవును, ఇటీవల అన్ని పరీక్షలు పూర్తయ్యాయి", "కొన్ని పరీక్షలు పెండింగ్‌లో ఉన్నాయి", "సంవత్సరానికి పైగా పరీక్షలు చేయించుకోలేదు", "ఎప్పుడూ సాధారణ పరీక్షలు చేయించుకోలేదు"]
      }
    ]
  }
};

const WellnessHealthSurvey = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const { profile, updateProfile } = useAuth();
  const { isGuest = false } = useLocation().state || {};
  
  const [answers, setAnswers] = useState({});
  const [otherText, setOtherText] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const t = translations[language] || translations.en;
  const answeredCount = Object.keys(answers).filter(k => (answers[k] !== undefined)).length;
  
  const isComplete = answeredCount === t.questions.length;
  const progressPercent = (answeredCount / t.questions.length) * 100;

  const handleSubmit = async () => {
    if (!isComplete || isSubmitting) return;
    setIsSubmitting(true);
    
    const surveyData = {};
    t.questions.forEach((q, idx) => {
      const key = `q${idx}`;
      surveyData[q.text] = answers[key] === 'other' ? otherText[key] : q.options[answers[key]];
    });

    try {
      if (profile?.uid) {
        await updateProfile({
          wellnessProfile: surveyData,
          patientType: 'wellness',
          isSurveyCompleted: true
        });
      }
      
      if (isGuest) {
        const qaPairs = t.questions.map((q, idx) => {
          const key = `q${idx}`;
          const answerText =
            answers[key] === 'other'
              ? ((otherText[key] || '').trim() || 'Not answered')
              : q.options[answers[key]] || 'Not answered';
          return {
            id: q.id || key,
            question: q.text,
            answer: answerText
          };
        });

        navigate('/shared/ai-report', { 
          state: { 
            answers: surveyData, 
            questions: t.questions,
            qaPairs,
            isGuest: true,
            aiStatus: 'STABLE',
            patient: { name: 'Guest User' }
          } 
        });
      } else {
        const { fromProfile = false } = useLocation().state || {};
        setTimeout(() => navigate(fromProfile ? '/mother/profile' : '/dashboard/wellness'), 1500);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100dvh', fontFamily: '"DM Sans", sans-serif' }}>
       <style dangerouslySetInnerHTML={{__html: `
        .opt-btn { width: 100%; min-height: 56px; background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius-md); padding: 14px 20px; text-align: left; font-family: inherit; font-size: 15px; font-weight: 500; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 14px; transition: all 0.15s; }
        .opt-btn:hover { background: var(--accent-subtle); border-color: var(--accent); }
        .opt-btn[data-selected="true"] { background: var(--accent-light); border-color: var(--accent); border-width: 2px; }
        .opt-indicator { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .opt-btn[data-selected="true"] .opt-indicator { background: var(--accent); border-color: var(--accent); }
        .other-textarea { width: 100%; min-height: 80px; background: var(--surface); border: 1.5px solid var(--accent); border-radius: var(--radius-md); padding: 12px 16px; font-family: inherit; font-size: 15px; color: var(--text-primary); resize: vertical; box-sizing: border-box; outline: none; margin-top: 10px; }
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
          <button onClick={() => navigate(-1)} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <FaArrowLeft size={16} color="var(--text-primary)" />
          </button>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{t.title}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => toggleLanguage('en')} style={{ padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, border: '1.5px solid var(--border)', background: language === 'en' ? 'var(--accent)' : 'transparent', color: language === 'en' ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}>EN</button>
          <button onClick={() => toggleLanguage('te')} style={{ padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, border: '1.5px solid var(--border)', background: language === 'te' ? 'var(--accent)' : 'transparent', color: language === 'te' ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}>TE</button>
        </div>
      </header>

      <div className="px-mobile-16" style={{ padding: '16px 24px', background: 'var(--accent-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>{t.subtitle}</span>
        <div style={{ padding: '4px 12px', background: 'var(--surface)', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>{t.progress(answeredCount, t.questions.length)}</div>
      </div>

      <div style={{ height: '4px', background: 'var(--border)' }}>
        <div style={{ height: '100%', background: 'var(--accent)', width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
      </div>

      <div style={{ padding: '20px 0 120px 0', maxWidth: '720px', margin: '0 auto' }}>
        {t.questions.map((q, idx) => {
          const qKey = `q${idx}`;
          return (
            <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px', margin: '0 16px 16px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <q.icon size={22} color={q.color} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2px' }}>Question {idx + 1}</div>
                  <div style={{ fontSize: '17px', fontWeight: 600, lineHeight: 1.4 }}>{q.text}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {q.options.map((opt, oIdx) => (
                  <button key={oIdx} className="opt-btn" onClick={() => setAnswers(prev => ({...prev, [qKey]: oIdx}))} data-selected={answers[qKey] === oIdx}>
                    <div className="opt-indicator">{answers[qKey] === oIdx && <FaCheck size={12} color="white" />}</div>
                    <span style={{ fontSize: '15px' }}>{opt}</span>
                  </button>
                ))}
                <button className="opt-btn" onClick={() => setAnswers(prev => ({...prev, [qKey]: 'other'}))} data-selected={answers[qKey] === 'other'}>
                  <div className="opt-indicator">{answers[qKey] === 'other' && <FaCheck size={12} color="white" />}</div>
                  <span style={{ fontSize: '15px' }}>Other (Type below)</span>
                </button>
                {answers[qKey] === 'other' && (
                  <textarea className="other-textarea" placeholder="Describe here..." value={otherText[qKey] || ''} onChange={(e) => setOtherText(prev => ({...prev, [qKey]: e.target.value}))} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button className={`generate-btn ${isComplete ? 'active' : ''}`} onClick={handleSubmit}>
        {isSubmitting ? 'Saving Profile...' : <><FaMagic /> {t.generateBtn}</>}
      </button>
    </div>
  );
};

export default WellnessHealthSurvey;
