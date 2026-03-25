import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaTint, FaHeartbeat, FaAppleAlt, FaUserShield, FaBaby, FaThermometerHalf, FaBabyCarriage, FaSyringe, FaWeight, FaMagic, FaCheck, FaMicrophone, FaStop } from 'react-icons/fa';
import { MdWarning } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';

const OTHER_IDX = 'other';

const MOTHER_QUESTIONS = [
  {
    id: 'q1', icon: FaTint, iconColor: 'var(--danger)',
    en: "Is the mother having excessive bleeding, high fever above 100F, foul-smelling discharge, or severe pain?",
    te: "తల్లికి అధిక రక్తస్రావం, 100F పైన జ్వరం, దుర్వాసన స్రావం లేదా తీవ్రమైన నొప్పి ఉందా?",
    options_en: ["No none of these", "Mild symptoms, monitoring", "One or two present", "Multiple severe symptoms now"],
    options_te: ["వీటిలో ఏదీ లేదు", "తేలికపాటి లక్షణాలు, పర్యవేక్షించడం", "ఒకటి లేదా రెండు ఉన్నాయి", "ఇప్పుడు బహుళ తీవ్ర లక్షణాలు"]
  },
  {
    id: 'q2', icon: FaHeartbeat, iconColor: 'var(--accent)',
    en: "Are breasts painful, engorged, or are there cracked nipples?",
    te: "రొమ్ములు నొప్పిగా, ఒత్తిగిలినట్లు ఉన్నాయా లేదా పగిలిన నిప్పిల్స్ ఉన్నాయా?",
    options_en: ["No breast problems", "Mild engorgement only", "Painful with cracked nipples", "Severe pain, not able to feed"],
    options_te: ["రొమ్ము సమస్యలు లేవు", "తేలికపాటి ఒత్తిడి మాత్రమే", "పగిలిన నిప్పిల్స్‌తో నొప్పి", "తీవ్రమైన నొప్పి, తినిపించలేకపోతోంది"]
  },
  {
    id: 'q3', icon: FaAppleAlt, iconColor: 'var(--success)',
    en: "Is the mother resting enough and eating nutritious food?",
    te: "తల్లి తగినంతగా విశ్రాంతి తీసుకుంటోందా మరియు పోషకమైన ఆహారం తింటోందా?",
    options_en: ["Yes eating and resting well", "Eating but not resting", "Resting but not eating enough", "Neither eating nor resting well"],
    options_te: ["అవును బాగా తింటోంది మరియు విశ్రాంతి తీసుకుంటోంది", "తింటోంది కానీ విశ్రాంతి తీసుకోవడం లేదు", "విశ్రాంతి తీసుకుంటోంది కానీ తగినంత తినడం లేదు", "తినడం లేదా విశ్రాంతి రెండూ లేదు"]
  },
  {
    id: 'q4', icon: FaUserShield, iconColor: 'var(--info)',
    en: "Has the mother started using a family planning method?",
    te: "తల్లి కుటుంబ నియంత్రణ పద్ధతి ప్రారంభించిందా?",
    options_en: ["Yes already started", "Discussed, will start soon", "Not yet discussed", "Refused family planning"],
    options_te: ["అవును ఇప్పటికే ప్రారంభించింది", "చర్చించారు, త్వరలో ప్రారంభిస్తారు", "ఇంకా చర్చించలేదు", "కుటుంబ నియంత్రణ నిరాకరించారు"]
  }
];

const NEWBORN_QUESTIONS = [
  {
    id: 'q5', icon: FaBaby, iconColor: 'var(--accent)',
    en: "Is the baby feeding well? Did breastfeeding start within one hour? Is it exclusive with no other feeds?",
    te: "బిడ్డ బాగా తింటోందా? ఒక గంటలో తల్లి పాలు ప్రారంభించిందా? ఇతర ఆహారం లేకుండా ప్రత్యేకంగా ఉందా?",
    options_en: ["Yes exclusive breastfeeding from birth", "Breastfeeding but giving water too", "Delayed start now exclusive", "Not breastfeeding at all"],
    options_te: ["అవును పుట్టినప్పటి నుండి ప్రత్యేక తల్లి పాలు", "తల్లి పాలు ఇస్తోంది కానీ నీళ్ళు కూడా ఇస్తోంది", "ఆలస్యంగా ప్రారంభించి ఇప్పుడు ప్రత్యేకంగా ఇస్తోంది", "అసలు తల్లి పాలు ఇవ్వడం లేదు"]
  },
  {
    id: 'q6', icon: FaThermometerHalf, iconColor: 'var(--warning)',
    en: "Is the baby kept warm? Chest warm to touch? No cold stress?",
    te: "బిడ్డ వెచ్చగా ఉంచబడుతోందా? ఛాతీ స్పర్శకు వెచ్చగా ఉందా? చలి ఒత్తిడి లేదా?",
    options_en: ["Yes warm and comfortable", "Slightly cool, taking steps", "Cold stress signs present", "Hypothermia suspected"],
    options_te: ["అవును వెచ్చగా మరియు సౌకర్యంగా ఉంది", "కొంచెం చల్లగా ఉంది, చర్యలు తీసుకుంటోంది", "చలి ఒత్తిడి సంకేతాలు ఉన్నాయి", "హైపోథర్మియా అనుమానం"]
  },
  {
    id: 'q7', icon: FaBabyCarriage, iconColor: 'var(--info)',
    en: "Has baby passed urine 6 times per day and stools 3 times per day with yellow color?",
    te: "బిడ్డ రోజుకు 6 సార్లు మూత్రవిసర్జన మరియు పసుపు రంగులో రోజుకు 3 సార్లు మలవిసర్జన చేసిందా?",
    options_en: ["Yes normal frequency and color", "Less than expected frequency", "Abnormal color or consistency", "No stools or urine in 24 hours"],
    options_te: ["అవును సాధారణ పౌనఃపున్యం మరియు రంగు", "అంచనా కంటే తక్కువ పౌనఃపున్యం", "అసాధారణ రంగు లేదా స్థిరత్వం", "24 గంటల్లో మలవిసర్జన లేదా మూత్రవిసర్జన లేదు"]
  },
  {
    id: 'q8', icon: MdWarning, iconColor: 'var(--danger)',
    en: "Does baby show danger signs: not feeding, convulsions, fast breathing over 60 per minute, severe chest indrawing, fever, hypothermia, pus from umbilicus, jaundice, or red umbilicus?",
    te: "బిడ్డ ప్రమాద సంకేతాలు చూపిస్తోందా: తినకపోవడం, మూర్ఛలు, నిమిషానికి 60 కంటే ఎక్కువ వేగంగా శ్వాస, తీవ్ర ఛాతీ ఇండ్రాయింగ్, జ్వరం, హైపోథర్మియా, బొడ్డు నుండి చీము, పసుపు రోగం లేదా ఎర్ర బొడ్డు?",
    options_en: ["No danger signs at all", "One mild sign present", "Two or more signs present", "Severe signs needs immediate referral"],
    options_te: ["ప్రమాద సంకేతాలు అసలు లేవు", "ఒక తేలికపాటి సంకేతం ఉంది", "రెండు లేదా అంతకంటే ఎక్కువ సంకేతాలు ఉన్నాయి", "తీవ్ర సంకేతాలు వెంటనే రెఫరల్ అవసరం"]
  },
  {
    id: 'q9', icon: FaSyringe, iconColor: 'var(--success)',
    en: "Has baby received birth dose vaccines and is immunization up to date?",
    te: "బిడ్డ జనన మోతాదు టీకాలు పొందిందా మరియు రోగనిరోధక శక్తి తాజాగా ఉందా?",
    options_en: ["Yes all vaccines on schedule", "Some vaccines pending", "Birth dose not given", "No vaccines given at all"],
    options_te: ["అవును అన్ని టీకాలు షెడ్యూల్ ప్రకారం", "కొన్ని టీకాలు పెండింగ్‌లో ఉన్నాయి", "జనన మోతాదు ఇవ్వలేదు", "అసలు టీకాలు ఇవ్వలేదు"]
  },
  {
    id: 'q10', icon: FaWeight, iconColor: 'var(--danger)',
    en: "Any weight loss more than 10 percent or is this a low birth weight baby?",
    te: "10 శాతం కంటే ఎక్కువ బరువు తగ్గిందా లేదా ఇది తక్కువ జనన బరువు ఉన్న బిడ్డా?",
    options_en: ["Normal weight no loss", "Less than 10 percent loss", "More than 10 percent loss", "Low birth weight under monitoring"],
    options_te: ["సాధారణ బరువు నష్టం లేదు", "10 శాతం కంటే తక్కువ నష్టం", "10 శాతం కంటే ఎక్కువ నష్టం", "తక్కువ జనన బరువు పర్యవేక్షణలో ఉంది"]
  }
];

const TOTAL_QUESTIONS = MOTHER_QUESTIONS.length + NEWBORN_QUESTIONS.length;

const NewMotherSurveyScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  const patient = location.state?.patient || { name: 'Anjali Devi' };

  const [answers, setAnswers] = useState({});
  const [otherText, setOtherText] = useState({});
  const [otherErrors, setOtherErrors] = useState({});
  const [recording, setRecording] = useState(null);
  const recognitionRef = useRef(null);

  const answeredCount = Object.keys(answers).filter(k => {
    if (answers[k] === OTHER_IDX) return otherText[k] && otherText[k].trim().length > 0;
    return answers[k] !== undefined;
  }).length;

  const isComplete = answeredCount === TOTAL_QUESTIONS;
  const progressPercent = (answeredCount / TOTAL_QUESTIONS) * 100;

  const handleSelect = (qId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIndex }));
    setOtherErrors(prev => ({ ...prev, [qId]: false }));
  };

  const handleSelectOther = (qId) => {
    setAnswers(prev => ({ ...prev, [qId]: OTHER_IDX }));
    setOtherErrors(prev => ({ ...prev, [qId]: false }));
  };

  const handleOtherText = (qId, val) => {
    setOtherText(prev => ({ ...prev, [qId]: val }));
    if (val.trim().length > 0) setOtherErrors(prev => ({ ...prev, [qId]: false }));
  };

  const startVoice = (qId) => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = language === 'te' ? 'te-IN' : 'en-IN';
    recog.interimResults = false;
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setOtherText(prev => ({ ...prev, [qId]: (prev[qId] || '') + ' ' + transcript }));
      setOtherErrors(prev => ({ ...prev, [qId]: false }));
    };
    recog.onend = () => setRecording(null);
    recog.onerror = () => setRecording(null);
    recognitionRef.current = recog;
    recog.start();
    setRecording(qId);
  };

  const stopVoice = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setRecording(null);
  };

  const t = {
    en: {
      title: "Postnatal Checkup",
      answered: `${answeredCount} of ${TOTAL_QUESTIONS} answered`,
      generateBtn: "Generate AI Report",
      generateSub: "AI will analyze your answers and create a health report",
      motherSection: "Mother's Health",
      newbornSection: "Newborn's Health",
      otherOption: "Other (please describe)",
      otherPlaceholder: "Please describe in your own words",
      otherValidation: "Please describe your answer",
    },
    te: {
      title: "ప్రసవానంతర చెక్అప్",
      answered: `${TOTAL_QUESTIONS} లో ${answeredCount} సమాధానం ఇవ్వబడ్డాయి`,
      generateBtn: "AI రిపోర్టును సృష్టించండి",
      generateSub: "AI మీ సమాధానాలను విశ్లేషించి ఆరోగ్య నివేదికను రూపొందిస్తుంది",
      motherSection: "తల్లి ఆరోగ్యం",
      newbornSection: "నవజాత శిశువు ఆరోగ్యం",
      otherOption: "ఇతరం (వివరించండి)",
      otherPlaceholder: "మీ స్వంత మాటల్లో వివరించండి",
      otherValidation: "దయచేసి మీ సమాధానం వివరించండి",
    }
  };

  const text = t[language] || t.en;

  const handleGenerate = () => {
    const allQ = [...MOTHER_QUESTIONS, ...NEWBORN_QUESTIONS];
    let hasError = false;
    const newErrors = {};
    allQ.forEach(q => {
      if (answers[q.id] === OTHER_IDX && !(otherText[q.id] && otherText[q.id].trim())) {
        newErrors[q.id] = true;
        hasError = true;
      }
    });
    setOtherErrors(newErrors);
    if (hasError) return;

    const qaPairs = allQ.map((q, index) => {
      const selected = answers[q.id];
      const options = language === 'te' ? q.options_te : q.options_en;
      const questionText = language === 'te' ? q.te : q.en;
      let answerText = 'Not answered';

      if (selected === OTHER_IDX) {
        answerText = (otherText[q.id] || '').trim() || 'Not answered';
      } else if (selected !== undefined && options[selected] !== undefined) {
        answerText = options[selected];
      }

      return {
        id: q.id || `q${index + 1}`,
        question: questionText,
        answer: answerText
      };
    });

    navigate('/shared/ai-report', { state: { answers, qaPairs, patient } });
  };

  const renderQuestionCard = (q, indexOffset) => {
    const isAnswered = answers[q.id] !== undefined;
    const isOtherSelected = answers[q.id] === OTHER_IDX;
    const isRecording = recording === q.id;
    const Icon = q.icon;
    const number = indexOffset + 1;
    const options = language === 'te' ? q.options_te : q.options_en;
    const questionText = language === 'te' ? q.te : q.en;

    return (
      <div key={q.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px', position: 'relative' }}>
        {!isAnswered && (
          <div style={{ position: 'absolute', width: '10px', height: '10px', top: '16px', right: '16px', borderRadius: '50%', background: 'var(--danger)' }} />
        )}
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', color: q.iconColor, flexShrink: 0 }}>
            <Icon size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: 'var(--accent)', textTransform: 'uppercase' }}>Q{number} OF {TOTAL_QUESTIONS}</span>
            <p style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.4, margin: '4px 0 0 0' }}>
              {questionText}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {options.map((option, optIdx) => {
            const isSelected = answers[q.id] === optIdx;
            return (
              <button
                key={optIdx}
                onClick={() => handleSelect(q.id, optIdx)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--surface)',
                  color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  lineHeight: 1.3,
                  textAlign: 'left'
                }}
              >
                {option}
              </button>
            );
          })}

          {/* OTHER option */}
          <button
            onClick={() => handleSelectOther(q.id)}
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${isOtherSelected ? 'var(--accent)' : 'var(--border)'}`,
              backgroundColor: isOtherSelected ? 'var(--accent-light)' : 'var(--surface)',
              color: isOtherSelected ? 'var(--accent)' : 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: isOtherSelected ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
              lineHeight: 1.3,
              textAlign: 'left'
            }}
          >
            {text.otherOption}
          </button>

          {/* Other textarea */}
          {isOtherSelected && (
            <div style={{ position: 'relative' }}>
              <textarea
                placeholder={text.otherPlaceholder}
                value={otherText[q.id] || ''}
                onChange={(e) => handleOtherText(q.id, e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  background: 'var(--bg-secondary)',
                  border: `1.5px solid ${otherErrors[q.id] ? 'var(--danger)' : 'var(--accent)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 52px 12px 16px',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                  marginTop: '10px'
                }}
              />
              <button
                onClick={() => isRecording ? stopVoice() : startVoice(q.id)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '22px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isRecording ? 'var(--danger-light)' : 'var(--accent-light)',
                  border: `1px solid ${isRecording ? 'var(--danger)' : 'var(--accent)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {isRecording ? <FaStop size={16} color="var(--danger)" /> : <FaMicrophone size={16} color="var(--accent)" />}
              </button>
              {otherErrors[q.id] && (
                <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '6px', paddingLeft: '4px' }}>
                  {text.otherValidation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-secondary)', fontFamily: '"DM Sans", sans-serif' }}>
      {/* Top Header */}
      <div style={{ background: 'var(--surface)', padding: '16px 24px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
              <FaArrowLeft size={20} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{text.title}</h2>
          </div>
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '100px' }}>
            <button
              onClick={() => toggleLanguage('en')}
              style={{
                background: language === 'en' ? 'var(--accent)' : 'transparent',
                color: language === 'en' ? 'white' : 'var(--accent)',
                border: 'none', borderRadius: '100px', padding: '4px 12px', height: '32px',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px'
              }}
            >EN</button>
            <button
              onClick={() => toggleLanguage('te')}
              style={{
                background: language === 'te' ? 'var(--accent)' : 'transparent',
                color: language === 'te' ? 'white' : 'var(--accent)',
                border: 'none', borderRadius: '100px', padding: '4px 12px', height: '32px',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px'
              }}
            >TE</button>
          </div>
        </div>

        {/* Patient Chip & Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-tertiary)', borderRadius: '100px', padding: '4px 12px', width: 'fit-content' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{patient.name}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{text.answered}</span>
            <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '100px' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--accent)', borderRadius: '100px', transition: 'width 0.4s ease-in-out' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Questions */}
      <div style={{ padding: '24px', maxWidth: '560px', margin: '0 auto', paddingBottom: '96px' }}>
        
        {/* Mother Section */}
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', marginTop: '8px', paddingLeft: '12px', borderLeft: '4px solid var(--accent)' }}>
          {text.motherSection}
        </h3>
        {MOTHER_QUESTIONS.map((q, idx) => renderQuestionCard(q, idx))}

        {/* Newborn Section */}
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', marginTop: '24px', paddingLeft: '12px', borderLeft: '4px solid var(--accent)' }}>
          {text.newbornSection}
        </h3>
        {NEWBORN_QUESTIONS.map((q, idx) => renderQuestionCard(q, idx + MOTHER_QUESTIONS.length))}

        {/* Footer Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '100px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{text.answered}</span>
          </div>
          
          <button 
            disabled={!isComplete}
            onClick={handleGenerate}
            style={{ 
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '8px',
              backgroundColor: isComplete ? '#AD1457' : 'var(--bg-tertiary)', 
              color: isComplete ? 'white' : 'var(--text-tertiary)',
              border: isComplete ? 'none' : '1px solid var(--border)',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              cursor: isComplete ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            <FaMagic size={18} />
            {text.generateBtn}
          </button>
          
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', paddingLeft: '16px', paddingRight: '16px', marginTop: '4px' }}>
            {text.generateSub}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewMotherSurveyScreen;
