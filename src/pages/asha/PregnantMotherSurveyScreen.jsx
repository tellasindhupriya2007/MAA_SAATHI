import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaHospital, FaSyringe, FaPills, FaTint, FaHeartbeat, FaClipboardList, FaHome, FaVial, FaMagic, FaCheck, FaMicrophone, FaStop } from 'react-icons/fa';
import { MdWarning } from 'react-icons/md';
import { useLanguage } from '../../context/LanguageContext';

const translations = {
  en: {
    title: "Antenatal Checkup",
    progress: (answered, total) => answered + " of " + total + " answered",
    generateBtn: "Generate AI Report",
    otherOption: "Other (please describe)",
    otherPlaceholder: "Please describe in your own words",
    otherValidation: "Please describe your answer",
    questions: [
      {
        text: "When was the last menstrual period?",
        options: ["Less than 12 weeks ago", "12 to 28 weeks ago", "More than 28 weeks ago", "Not sure or does not remember"]
      },
      {
        text: "Has she attended the first ANC checkup within 12 weeks of pregnancy?",
        options: ["Yes attended within 12 weeks", "Attended but after 12 weeks", "Not yet attended", "Does not know what ANC is"]
      },
      {
        text: "Has she received TT vaccine doses?",
        options: ["Yes both doses complete", "Only one dose taken", "Not taken yet", "Does not know"]
      },
      {
        text: "Is she taking IFA tablets every day?",
        options: ["Yes taking daily without fail", "Taking but sometimes missing doses", "Stopped due to nausea or side effects", "Not taking at all"]
      },
      {
        text: "Does she have anemia symptoms like pale tongue, weakness, or swelling?",
        options: ["No symptoms at all", "Mild weakness only", "Pale tongue and weakness present", "Severe weakness and swelling"]
      },
      {
        text: "Have blood pressure, urine test, and weight been checked recently?",
        options: ["Yes all three checked", "Only some of them checked", "Not checked in last month", "Never checked this pregnancy"]
      },
      {
        text: "Are any danger signs present: vaginal bleeding, no fetal movement, severe headache, blurred vision, face or hand swelling, fever, or fits?",
        options: ["No danger signs at all", "One or two mild symptoms", "Multiple symptoms present", "Severe symptoms right now"]
      },
      {
        text: "How many antenatal visits completed so far?",
        options: ["4 or more visits completed", "2 to 3 visits completed", "Only 1 visit completed", "No visits completed yet"]
      },
      {
        text: "Has a birth plan been made including delivery location, transport, money saved, blood donor identified?",
        options: ["Yes everything is planned", "Partially planned", "Discussed but not arranged", "No plan made yet"]
      },
      {
        text: "What was the last hemoglobin level reading?",
        options: ["11 or above, normal", "8 to 10, mild anemia", "Below 8, severe anemia", "Never tested"]
      }
    ]
  },
  te: {
    title: "ప్రసవపూర్వ తనిఖీ",
    progress: (answered, total) => total + " లో " + answered + " సమాధానం ఇచ్చారు",
    generateBtn: "AI రిపోర్టును సృష్టించండి",
    otherOption: "ఇతరం (వివరించండి)",
    otherPlaceholder: "మీ స్వంత మాటల్లో వివరించండి",
    otherValidation: "దయచేసి మీ సమాధానం వివరించండి",
    questions: [
      {
        text: "చివరి ఋతుస్రావం ఎప్పుడు జరిగింది?",
        options: ["12 వారాల కంటే తక్కువ ముందు", "12 నుండి 28 వారాల ముందు", "28 వారాల కంటే ఎక్కువ ముందు", "గుర్తు లేదు లేదా తెలియదు"]
      },
      {
        text: "గర్భం 12 వారాలలోపు మొదటి ANC తనిఖీకి వెళ్ళారా?",
        options: ["అవును 12 వారాలలోపు వెళ్ళారు", "వెళ్ళారు కానీ 12 వారాల తర్వాత", "ఇంకా వెళ్ళలేదు", "ANC అంటే తెలియదు"]
      },
      {
        text: "TT టీకా డోసులు తీసుకున్నారా?",
        options: ["అవును రెండు డోసులు పూర్తయ్యాయి", "ఒక్క డోసు మాత్రమే తీసుకున్నారు", "ఇంకా తీసుకోలేదు", "తెలియదు"]
      },
      {
        text: "ప్రతిరోజూ IFA మాత్రలు తీసుకుంటున్నారా?",
        options: ["అవును ప్రతిరోజూ తప్పకుండా తీసుకుంటున్నారు", "తీసుకుంటున్నారు కానీ కొన్నిసార్లు మిస్ అవుతున్నారు", "వాంతి లేదా దుష్ప్రభావాల వల్ల ఆపారు", "అసలు తీసుకోవడం లేదు"]
      },
      {
        text: "పీలా నాలుక, బలహీనత లేదా వాపు వంటి రక్తహీనత లక్షణాలు ఉన్నాయా?",
        options: ["లక్షణాలు లేవు", "తేలికపాటి బలహీనత మాత్రమే", "పీలా నాలుక మరియు బలహీనత ఉంది", "తీవ్రమైన బలహీనత మరియు వాపు"]
      },
      {
        text: "ఇటీవల రక్తపోటు, మూత్ర పరీక్ష మరియు బరువు తనిఖీ చేయించుకున్నారా?",
        options: ["అవును మూడూ తనిఖీ చేయించుకున్నారు", "కొన్ని మాత్రమే తనిఖీ చేయించుకున్నారు", "గత నెలలో తనిఖీ చేయించుకోలేదు", "ఈ గర్భంలో ఎప్పుడూ తనిఖీ చేయించుకోలేదు"]
      },
      {
        text: "యోని రక్తస్రావం, శిశువు కదలిక లేకపోవడం, తీవ్రమైన తలనొప్పి, అస్పష్టమైన దృష్టి, వాపు, జ్వరం లేదా మూర్ఛలు వంటి ప్రమాద సంకేతాలు ఉన్నాయా?",
        options: ["ప్రమాద సంకేతాలు లేవు", "ఒకటి లేదా రెండు తేలికపాటి లక్షణాలు", "అనేక లక్షణాలు ఉన్నాయి", "ఇప్పుడు తీవ్రమైన లక్షణాలు ఉన్నాయి"]
      },
      {
        text: "ఇప్పటివరకు ఎన్ని ప్రసవపూర్వ సందర్శనలు పూర్తి చేశారు?",
        options: ["4 లేదా అంతకంటే ఎక్కువ సందర్శనలు పూర్తయ్యాయి", "2 నుండి 3 సందర్శనలు పూర్తయ్యాయి", "1 సందర్శన మాత్రమే పూర్తయింది", "ఇంకా ఏ సందర్శన పూర్తికాలేదు"]
      },
      {
        text: "ప్రసవ స్థలం, రవాణా, డబ్బు మరియు రక్తదాత వంటి ప్రసవ ప్రణాళిక సిద్ధం చేశారా?",
        options: ["అవును అన్నీ ప్లాన్ చేశారు", "పాక్షికంగా ప్లాన్ చేశారు", "చర్చించారు కానీ ఏర్పాట్లు చేయలేదు", "ఇంకా ప్లాన్ చేయలేదు"]
      },
      {
        text: "చివరి హిమోగ్లోబిన్ స్థాయి ఎంత?",
        options: ["11 లేదా అంతకంటే ఎక్కువ, సాధారణం", "8 నుండి 10, తేలికపాటి రక్తహీనత", "8 కంటే తక్కువ, తీవ్రమైన రక్తహీనత", "ఎప్పుడూ పరీక్ష చేయలేదు"]
      }
    ]
  }
};

const QUESTION_ICONS = [
  { icon: FaCalendarAlt, color: 'var(--accent)' },
  { icon: FaHospital, color: 'var(--info)' },
  { icon: FaSyringe, color: 'var(--success)' },
  { icon: FaPills, color: 'var(--warning)' },
  { icon: FaTint, color: 'var(--danger)' },
  { icon: FaHeartbeat, color: 'var(--accent)' },
  { icon: MdWarning, color: 'var(--danger)' },
  { icon: FaClipboardList, color: 'var(--success)' },
  { icon: FaHome, color: 'var(--info)' },
  { icon: FaVial, color: 'var(--warning)' }
];

const OTHER_IDX = 'other';

const PregnantMotherSurveyScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  
  const patient = location.state?.patient || { name: 'Suhana Khatun', house: '42', village: 'Ramgarh' };
  
  // answers: { q0: 2, q1: 'other', ... }
  const [answers, setAnswers] = useState({});
  // otherText: { q0: "...", ... }
  const [otherText, setOtherText] = useState({});
  // otherErrors: { q0: true, ... }
  const [otherErrors, setOtherErrors] = useState({});
  // recording state: which qIdx is recording
  const [recording, setRecording] = useState(null);
  const recognitionRef = useRef(null);
  
  const t = translations[language] || translations.en;

  // Count answered: a question is answered if it has a non-other selection, OR if it has 'other' + non-empty text
  const answeredCount = Object.keys(answers).filter(k => {
    if (answers[k] === OTHER_IDX) return otherText[k] && otherText[k].trim().length > 0;
    return answers[k] !== undefined;
  }).length;

  const isComplete = answeredCount === t.questions.length;
  const progressPercent = (answeredCount / t.questions.length) * 100;

  const handleSelect = (qIdx, optIdx) => {
    setAnswers(prev => ({ ...prev, [`q${qIdx}`]: optIdx }));
    // clear error when switching away from other
    setOtherErrors(prev => ({ ...prev, [`q${qIdx}`]: false }));
  };

  const handleSelectOther = (qIdx) => {
    setAnswers(prev => ({ ...prev, [`q${qIdx}`]: OTHER_IDX }));
    setOtherErrors(prev => ({ ...prev, [`q${qIdx}`]: false }));
  };

  const handleOtherText = (qIdx, val) => {
    setOtherText(prev => ({ ...prev, [`q${qIdx}`]: val }));
    if (val.trim().length > 0) {
      setOtherErrors(prev => ({ ...prev, [`q${qIdx}`]: false }));
    }
  };

  const startVoice = (qIdx) => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = language === 'te' ? 'te-IN' : 'en-IN';
    recog.interimResults = false;
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setOtherText(prev => ({ ...prev, [`q${qIdx}`]: (prev[`q${qIdx}`] || '') + ' ' + transcript }));
      setOtherErrors(prev => ({ ...prev, [`q${qIdx}`]: false }));
    };
    recog.onend = () => setRecording(null);
    recog.onerror = () => setRecording(null);
    recognitionRef.current = recog;
    recog.start();
    setRecording(qIdx);
  };

  const stopVoice = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setRecording(null);
  };

  const handleGenerate = () => {
    // Validate all 'other' answers have text
    let hasError = false;
    const newErrors = {};
    t.questions.forEach((_, idx) => {
      if (answers[`q${idx}`] === OTHER_IDX && !(otherText[`q${idx}`] && otherText[`q${idx}`].trim())) {
        newErrors[`q${idx}`] = true;
        hasError = true;
      }
    });
    setOtherErrors(newErrors);
    if (hasError) return;
    // Build final answers object for AI
    const finalAnswers = {};
    const finalQaPairs = [];
    t.questions.forEach((q, idx) => {
      const key = `q${idx}`;
      let resolvedAnswer = 'Not answered';
      if (answers[key] === OTHER_IDX) {
        resolvedAnswer = otherText[key];
        finalAnswers[key] = resolvedAnswer;
      } else if (answers[key] !== undefined) {
        resolvedAnswer = q.options[answers[key]];
        finalAnswers[key] = resolvedAnswer;
      }
      finalQaPairs.push({
        id: key,
        question: q.text,
        answer: resolvedAnswer
      });
    });
    navigate('/shared/ai-report', { state: { answers: finalAnswers, qaPairs: finalQaPairs, patient } });
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100dvh', fontFamily: '"DM Sans", sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .opt-btn {
          width: 100%;
          min-height: 56px;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          padding: 14px 20px;
          text-align: left;
          font-family: "DM Sans", sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.15s;
        }
        .opt-indicator {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid var(--border);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .opt-btn:hover {
          background: var(--accent-subtle);
          border-color: var(--accent);
        }
        .opt-btn:hover .opt-indicator {
          border-color: var(--accent);
        }
        .opt-btn[data-selected="true"] {
          background: var(--accent-light);
          border-color: var(--accent);
          border-width: 2px;
        }
        .opt-btn[data-selected="true"] .opt-indicator {
          background: var(--accent);
          border-color: var(--accent);
        }
        .other-textarea {
          width: 100%;
          min-height: 80px;
          background: var(--bg-secondary);
          border: 1.5px solid var(--accent);
          border-radius: var(--radius-md);
          padding: 12px 52px 12px 16px;
          font-family: "DM Sans", sans-serif;
          font-size: 15px;
          color: var(--text-primary);
          resize: vertical;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s;
          margin-top: 10px;
        }
        .other-textarea:focus { border-color: var(--accent); }
        .generate-btn {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 40px);
          max-width: 720px;
          height: 52px;
          border: none;
          border-radius: var(--radius-md);
          font-family: "DM Sans", sans-serif;
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
        .generate-btn.active {
          background: var(--accent);
          color: white;
          box-shadow: 0 4px 20px rgba(194,24,91,0.35);
          cursor: pointer;
        }
      `}} />

      {/* PAGE HEADER */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <FaArrowLeft size={16} color="var(--text-primary)" />
          </button>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{t.title}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => toggleLanguage('en')} style={{
            padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
            border: '1.5px solid var(--border)', cursor: 'pointer',
            ...(language === 'en' ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : { background: 'transparent', color: 'var(--text-secondary)' })
          }}>EN</button>
          <button onClick={() => toggleLanguage('te')} style={{
            padding: '6px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
            border: '1.5px solid var(--border)', cursor: 'pointer',
            ...(language === 'te' ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : { background: 'transparent', color: 'var(--text-secondary)' })
          }}>TE</button>
        </div>
      </header>

      {/* PATIENT INFO STRIP */}
      <div style={{
        background: 'var(--accent-subtle)',
        borderBottom: '1px solid var(--accent-light)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>{patient.name}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>House {patient.house}, {patient.village}</span>
        </div>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '100px',
          padding: '4px 12px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-secondary)'
        }}>
          {t.progress(answeredCount, t.questions.length)}
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ height: '4px', background: 'var(--border)' }}>
        <div style={{ height: '100%', background: 'var(--accent)', width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
      </div>

      {/* QUESTIONS */}
      <div style={{ paddingBottom: '120px', paddingTop: '20px', maxWidth: '720px', margin: '0 auto' }}>
        {t.questions.map((q, idx) => {
          const IconObj = QUESTION_ICONS[idx % QUESTION_ICONS.length];
          const Icon = IconObj.icon;
          const qKey = `q${idx}`;
          const isOtherSelected = answers[qKey] === OTHER_IDX;
          const isRecording = recording === idx;

          return (
            <div key={qKey} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              margin: '0 20px 20px 20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon size={24} color={IconObj.color} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent)', marginBottom: '4px' }}>
                    {language === 'en' ? `QUESTION ${idx + 1}` : `ప్రశ్న ${idx + 1}`}
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {q.text}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {q.options.map((opt, optIdx) => {
                  const isSelected = answers[qKey] === optIdx;
                  return (
                    <button 
                      key={optIdx}
                      className="opt-btn"
                      onClick={() => handleSelect(idx, optIdx)}
                      data-selected={isSelected}
                    >
                      <div className="opt-indicator">
                        {isSelected && <FaCheck size={12} color="white" />}
                      </div>
                      <span>{opt}</span>
                    </button>
                  );
                })}

                {/* OTHER option */}
                <button
                  className="opt-btn"
                  onClick={() => handleSelectOther(idx)}
                  data-selected={isOtherSelected}
                >
                  <div className="opt-indicator">
                    {isOtherSelected && <FaCheck size={12} color="white" />}
                  </div>
                  <span>{t.otherOption}</span>
                </button>

                {/* Other text input */}
                {isOtherSelected && (
                  <div style={{ position: 'relative' }}>
                    <textarea
                      className="other-textarea"
                      placeholder={t.otherPlaceholder}
                      value={otherText[qKey] || ''}
                      onChange={(e) => handleOtherText(idx, e.target.value)}
                    />
                    <button
                      onClick={() => isRecording ? stopVoice() : startVoice(idx)}
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
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {isRecording
                        ? <FaStop size={16} color="var(--danger)" />
                        : <FaMicrophone size={16} color="var(--accent)" />}
                    </button>
                    {otherErrors[qKey] && (
                      <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '6px', paddingLeft: '4px' }}>
                        {t.otherValidation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* GENERATE AI REPORT BUTTON */}
      <button 
        className={`generate-btn ${isComplete ? 'active' : ''}`}
        onClick={handleGenerate}
      >
        <FaMagic size={18} />
        {t.generateBtn}
      </button>

    </div>
  );
};

export default PregnantMotherSurveyScreen;
