import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaVolumeUp, FaBabyCarriage, FaFileMedical, FaHeartbeat, FaMicrophone, FaStop, FaSpinner } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';

const OTHER_IDX = 'other';

const QUESTIONS = [
  // SECTION 1
  {
    id: 'q1', section: 1,
    en: 'Which pregnancy is this?',
    te: 'ఇది ఎన్నవ గర్భం?',
    options_en: ['First pregnancy', 'Second pregnancy', 'Third pregnancy', 'Fourth or more'],
    options_te: ['మొదటి గర్భం', 'రెండవ గర్భం', 'మూడవ గర్భం', 'నాల్గవ లేదా అంతకంటే ఎక్కువ']
  },
  {
    id: 'q2', section: 1,
    en: 'What happened in previous pregnancies?',
    te: 'గత గర్భాలలో ఏమి జరిగింది?',
    options_en: ['No previous pregnancies', 'All babies were healthy', 'One or more had complications', 'One or more ended in miscarriage'],
    options_te: ['మునుపటి గర్భాలు లేవు', 'అన్ని బిడ్డలు ఆరోగ్యంగా ఉన్నారు', 'ఒకటి లేదా అంతకంటే ఎక్కువ సమస్యలు వచ్చాయి', 'ఒకటి లేదా అంతకంటే ఎక్కువ గర్భస్రావం అయ్యాయి']
  },
  {
    id: 'q3', section: 1,
    en: 'How were your previous deliveries?',
    te: 'మీ గత ప్రసవాలు ఎలా జరిగాయి?',
    options_en: ['No previous deliveries', 'Normal hospital delivery', 'C-section surgery', 'Home delivery'],
    options_te: ['మునుపటి ప్రసవాలు లేవు', 'సాధారణ ఆసుపత్రి ప్రసవం', 'సి-సెక్షన్ సర్జరీ', 'ఇంటి ప్రసవం']
  },
  {
    id: 'q4', section: 1,
    en: 'Are your previous children healthy?',
    te: 'మీ పూర్వ పిల్లలు ఆరోగ్యంగా ఉన్నారా?',
    options_en: ['No previous children', 'Yes all are healthy', 'One or more have health issues', 'One child passed away'],
    options_te: ['గతంలో పిల్లలు లేరు', 'అవును అందరూ ఆరోగ్యంగా ఉన్నారు', 'ఒకరు లేదా అంతకంటే ఎక్కువ ఆరోగ్య సమస్యలు ఉన్నాయి', 'ఒక బిడ్డ చనిపోయారు']
  },
  {
    id: 'q5', section: 1,
    en: 'Are you expecting twins or more?',
    te: 'మీకు కవలలు లేదా అంతకంటే ఎక్కువ పిల్లలు పుట్టనున్నారా?',
    options_en: ['No, single baby confirmed', 'Yes, twins confirmed', 'Yes, triplets or more', 'Not confirmed by scan yet'],
    options_te: ['లేదు, ఒక్క బిడ్డ ధృవీకరించబడింది', 'అవును, కవలలు ధృవీకరించబడ్డారు', 'అవును, ముగ్గురు లేదా అంతకంటే ఎక్కువ', 'స్కాన్ ద్వారా ఇంకా ధృవీకరించబడలేదు']
  },
  {
    id: 'q6', section: 1,
    en: 'Do you have any medical conditions?',
    te: 'మీకు ఏమైనా వైద్య సమస్యలు ఉన్నాయా?',
    options_en: ['None of the below', 'Diabetes (sugar)', 'High blood pressure', 'Thyroid problem', 'Heart condition'],
    options_te: ['ఈక్రిందివాటిలో ఏదీ కాదు', 'మధుమేహం (చక్కెర)', 'అధిక రక్తపోటు', 'థైరాయిడ్ సమస్య', 'గుండె జబ్బు']
  },
  {
    id: 'q7', section: 1,
    en: 'Are you allergic to any medicines?',
    te: 'మీకు ఏదైనా మందులకు అలర్జీ ఉందా?',
    options_en: ['No known allergies', 'Yes, allergic to penicillin', 'Yes, allergic to other medicines', 'Not sure'],
    options_te: ['తెలిసిన అలర్జీలు లేవు', 'అవును, పెన్సిలిన్‌కు అలర్జీ ఉంది', 'అవును, ఇతర మందులకు అలర్జీ ఉంది', 'తెలియదు']
  },

  // SECTION 2
  {
    id: 'q8', section: 2,
    en: 'Have you done your first ultrasound scan?',
    te: 'మీరు మొదటి అల్ట్రాసౌండ్ స్కాన్ చేయించుకున్నారా?',
    options_en: ['Yes, scan done within 12 weeks', 'Yes, scan done after 12 weeks', 'No scan done yet', 'Not sure'],
    options_te: ['అవును, స్కాన్ 12 వారాలలోపు జరిగింది', 'అవును, స్కాన్ 12 వారాల తర్వాత జరిగింది', 'ఇంకా స్కాన్ జరగలేదు', 'తెలియదు']
  },
  {
    id: 'q9', section: 2,
    en: 'What did the scan report say about baby?',
    te: 'స్కాన్ రిపోర్ట్ బిడ్డ గురించి ఏమి చెప్పింది?',
    options_en: ['Baby is healthy and growing normally', 'Some abnormality was detected', 'Twins or multiple babies seen', 'Scan not done yet'],
    options_te: ['బిడ్డ ఆరోగ్యంగా ఉండి సాధారణంగా ఎదుగుతోంది', 'కొన్ని అసాధారణతలు కనిపించాయి', 'కవలలు లేదా బహుళ పసిపిల్లలు కనిపించారు', 'ఇంకా స్కాన్ జరగలేదు']
  },
  {
    id: 'q10', section: 2,
    en: 'Was the fetal heartbeat seen on scan?',
    te: 'స్కాన్లో పిండం గుండె చప్పుడు కనిపించిందా?',
    options_en: ['Yes, heartbeat was normal and strong', 'Yes, but doctor said it was slow', 'No heartbeat was seen', 'Scan not done yet'],
    options_te: ['అవును, గుండె చప్పుడు సాధారణంగా బలంగా ఉంది', 'అవును, అయితే డాక్టర్ నెమ్మదిగా ఉందని చెప్పారు', 'గుండె చప్పుడు కనిపించలేదు', 'ఇంకా స్కాన్ జరగలేదు']
  },
  {
    id: 'q11', section: 2,
    en: 'Did doctor mention any fetal concern?',
    te: 'డాక్టర్ పిండం విషయంలో ఏమైనా ఆందోళన చెప్పారా?',
    options_en: ['No, everything was normal', 'Yes, doctor mentioned a concern', 'Yes, there is a confirmed fetal issue', 'Scan not done yet'],
    options_te: ['లేదు, అంతా సాధారణంగా ఉంది', 'అవును, డాక్టర్ కొంత ఆందోళన చెప్పారు', 'అవును, పిండం సమస్య ఉంది', 'ఇంకా స్కాన్ జరగలేదు']
  },
  {
    id: 'q12', section: 2,
    en: 'What is your blood group?',
    te: 'మీ రక్తపు గ్రూప్ ఏమిటి?',
    options_en: ['A positive or B positive', 'O positive or AB positive', 'Negative blood group', 'Not tested yet'],
    options_te: ['A పాజిటివ్ లేదా B పాజిటివ్', 'O పాజిటివ్ లేదా AB పాజిటివ్', 'నెగెటివ్ రక్త గ్రూపు', 'ఇంకా పరీక్ష చేయలేదు']
  },
  {
    id: 'q13', section: 2,
    en: 'What was hemoglobin level at last test?',
    te: 'చివరి పరీక్షలో హిమోగ్లోబిన్ స్థాయి ఎంత?',
    options_en: ['Above 11, doctor said normal', '8 to 11, mild anemia', 'Below 8, severe anemia', 'Not tested yet'],
    options_te: ['11 పైన, సాధారణంగా ఉందని చెప్పారు', '8 నుండి 11, తేలికపాటి రక్తహీనత', '8 కంటే తక్కువ, తీవ్ర రక్తహీనత', 'ఇంకా పరీక్ష చేయలేదు']
  },
  {
    id: 'q14', section: 2,
    en: 'Which tests have been done?',
    te: 'ఏ పరీక్షలు చేయించుకున్నారు?',
    options_en: ['HIV test done, result negative', 'Hepatitis B test done', 'Thyroid test done', 'None of these done yet'],
    options_te: ['HIV పరీక్ష జరిగింది', 'హెపటైటిస్ బి పరీక్ష జరిగింది', 'థైరాయిడ్ పరీక్ష జరిగింది', 'వీటిలో ఏవీ ఇంకా చేయలేదు']
  },

  // SECTION 3
  {
    id: 'q15', section: 3,
    en: 'Any bleeding during this pregnancy?',
    te: 'ఈ గర్భంలో రక్తస్రావం జరిగిందా?',
    options_en: ['No bleeding at all', 'Very slight spotting, doctor said normal', 'Bleeding that needed doctor visit', 'Heavy bleeding'],
    options_te: ['ఎలాంటి రక్తస్రావం లేదు', 'కొద్దిపాటి చుక్కలు, సాధారణంగా ఉందని చెప్పారు', 'వైద్యుడిని సందర్శించాల్సిన రక్తస్రావం', 'తీవ్ర రక్తస్రావం']
  },
  {
    id: 'q16', section: 3,
    en: 'Any complications in this pregnancy?',
    te: 'ఈ గర్భంలో ఏమైనా సమస్యలు ఉన్నాయా?',
    options_en: ['No complications', 'Gestational diabetes', 'High blood pressure in pregnancy', 'Placenta is low (placenta previa)'],
    options_te: ['ఎలాంటి సమస్యలు లేవు', 'గర్భధారణ మధుమేహం', 'గర్భధారణలో అధిక రక్తపోటు', 'ప్లాసెంటా తక్కువగా ఉంది']
  },
  {
    id: 'q17', section: 3,
    en: 'Are you taking prenatal vitamins?',
    te: 'మీరు గర్భ విటమిన్లు తీసుకుంటున్నారా?',
    options_en: ['Yes, taking regularly every day', 'Taking sometimes, not daily', 'Stopped due to side effects', 'Not taking any'],
    options_te: ['అవును, ప్రతిరోజు క్రమం తప్పకుండా తీసుకుంటాను', 'అప్పుడప్పుడు తీసుకుంటాను, ప్రతిరోజు కాదు', 'దుష్ప్రభావాల వల్ల ఆపేసాను', 'ఏమీ తీసుకోవడం లేదు']
  }
];

const UI_TEXT = {
  en: {
    pageTitle: 'Your Health History',
    subtitle: 'This helps your doctor understand your pregnancy better. All answers are confidential.',
    sec1: 'Your Pregnancy History',
    sec2: 'Your Scan and Test Reports',
    sec3: 'This Pregnancy',
    saveBtn: 'Save My Health History',
    skipNote: 'Skipped questions can be filled later in your profile.',
    otherOption: 'Other (please describe)',
    otherPlaceholder: 'Please describe in your own words',
    otherValidation: 'Please describe your answer',
    saved: 'Health history saved successfully!'
  },
  te: {
    pageTitle: 'మీ ఆరోగ్య చరిత్ర',
    subtitle: 'ఇది మీ గర్భాన్ని అర్థం చేసుకోవడానికి మీ డాక్టర్ కు సహాయపడుతుంది. అన్ని సమాధానాలు గోప్యంగా ఉంటాయి.',
    sec1: 'మీ గర్భ చరిత్ర',
    sec2: 'మీ స్కాన్ మరియు పరీక్ష రిపోర్ట్లు',
    sec3: 'ఈ గర్భం',
    saveBtn: 'నా ఆరోగ్య చరిత్ర సేవ్ చేయండి',
    skipNote: 'దాటిన ప్రశ్నలు తర్వాత మీ ప్రొఫైల్ లో నింపవచ్చు.',
    otherOption: 'ఇతరం (వివరించండి)',
    otherPlaceholder: 'మీ స్వంత మాటల్లో వివరించండి',
    otherValidation: 'దయచేసి మీ సమాధానం వివరించండి',
    saved: 'ఆరోగ్య చరిత్ర విజయవంతంగా సేవ్ చేయబడింది!'
  }
};

export default function MotherMedicalHistoryScreen() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { isGuest = false } = useLocation().state || {};
  
  const [answers, setAnswers] = useState(profile?.medicalHistory || {});
  const [otherText, setOtherText] = useState(profile?.medicalHistoryOther || {});
  const [otherErrors, setOtherErrors] = useState({});
  const [toast, setToast] = useState('');
  const [recording, setRecording] = useState(null);
  const recognitionRef = useRef(null);

  const ui = UI_TEXT[language] || UI_TEXT.en;

  const handleSelect = (qId, optionIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
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

  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // Validate all 'other' answers have text
    let hasError = false;
    const newErrors = {};
    QUESTIONS.forEach(q => {
      if (answers[q.id] === OTHER_IDX && !(otherText[q.id] && otherText[q.id].trim())) {
        newErrors[q.id] = true;
        hasError = true;
      }
    });
    setOtherErrors(newErrors);
    if (hasError) {
      setToast(language === 'te' ? 'దయచేసి అన్ని ఇతర సమాధానాలు పూర్తి చేయండి' : 'Please fill in all "Other" answers');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const readableHistory = {};
      QUESTIONS.forEach(q => {
        const idx = answers[q.id];
        if (idx === OTHER_IDX) {
          readableHistory[q.en] = otherText[q.id];
        } else if (idx !== undefined) {
          readableHistory[q.en] = q.options_en[idx];
        } else {
          readableHistory[q.en] = 'Not Answered';
        }
      });

      if (updateProfile && !isGuest) {
        await updateProfile({
          ...profile,
          medicalHistory: readableHistory,
          isSurveyCompleted: true
        });
      }
      
      if (isGuest) {
        // Construct the results state
        const guestQuestions = QUESTIONS.map(q => ({
          id: q.id,
          text: language === 'te' ? q.te : q.en,
          options: language === 'te' ? q.options_te : q.options_en
        }));
        
        navigate('/shared/ai-report', {
          state: {
            questions: guestQuestions,
            answers,
            isGuest: true,
            patient: { name: 'Guest User', age: 'N/A' }
          }
        });
      } else {
        setToast(ui.saved);
        const { fromProfile = false } = location.state || {};
        setTimeout(() => navigate(fromProfile ? '/mother/profile' : '/mother/dashboard'), 1500);
      }
    } catch (err) {
      setToast("Error saving medical history");
      setTimeout(() => setToast(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (q, displayIdx) => {
    const isOtherSelected = answers[q.id] === OTHER_IDX;
    const isRecordingThis = recording === q.id;
    const opts = language === 'te' ? q.options_te : q.options_en;
    const qText = language === 'te' ? q.te : q.en;

    return (
      <div key={q.id} style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        {/* Question header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, paddingRight: '16px' }}>
            {displayIdx}. {qText}
          </div>
          <button
            onClick={() => speakQuestion(qText)}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--accent-light)', color: 'var(--accent)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, cursor: 'pointer'
            }}
          >
            <FaVolumeUp size={16} />
          </button>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {opts.map((opt, oIdx) => {
            const isSelected = answers[q.id] === oIdx;
            return (
              <button
                key={oIdx}
                onClick={() => handleSelect(q.id, oIdx)}
                style={{
                  width: '100%', minHeight: '52px', padding: '12px 20px',
                  borderRadius: '100px',
                  fontFamily: '"DM Sans", sans-serif', fontSize: '15px', fontWeight: 600,
                  textAlign: 'left',
                  border: isSelected ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                  background: isSelected ? 'var(--accent)' : 'var(--surface)',
                  color: isSelected ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer', transition: 'all 0.1s'
                }}
              >
                {opt}
              </button>
            );
          })}

          {/* OTHER pill */}
          <button
            onClick={() => handleSelectOther(q.id)}
            style={{
              width: '100%', minHeight: '52px', padding: '12px 20px',
              borderRadius: '100px',
              fontFamily: '"DM Sans", sans-serif', fontSize: '15px', fontWeight: 600,
              textAlign: 'left',
              border: isOtherSelected ? '2px solid var(--accent)' : '1.5px solid var(--border)',
              background: isOtherSelected ? 'var(--accent)' : 'var(--surface)',
              color: isOtherSelected ? 'white' : 'var(--text-primary)',
              cursor: 'pointer', transition: 'all 0.1s'
            }}
          >
            {ui.otherOption}
          </button>

          {/* Other textarea + voice */}
          {isOtherSelected && (
            <div style={{ position: 'relative' }}>
              <textarea
                placeholder={ui.otherPlaceholder}
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
                  marginTop: '10px',
                  transition: 'border-color 0.15s'
                }}
              />
              <button
                onClick={() => isRecordingThis ? stopVoice() : startVoice(q.id)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '22px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isRecordingThis ? 'var(--danger-light)' : 'var(--accent-light)',
                  border: `1px solid ${isRecordingThis ? 'var(--danger)' : 'var(--accent)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {isRecordingThis
                  ? <FaStop size={16} color="var(--danger)" />
                  : <FaMicrophone size={16} color="var(--accent)" />}
              </button>
              {otherErrors[q.id] && (
                <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '6px', paddingLeft: '4px' }}>
                  {ui.otherValidation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const sectionHeaderStyle = {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--bg-secondary)',
    padding: '12px 20px',
    borderTop: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-tertiary)',
    marginTop: '24px'
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100dvh', paddingBottom: '96px', fontFamily: '"DM Sans", sans-serif' }}>
      
      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--text-primary)', color: 'white', padding: '12px 24px',
          borderRadius: '100px', fontSize: '14px', fontWeight: 600,
          zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', whiteSpace: 'nowrap'
        }}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 24px',
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={{
            width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <FaArrowLeft size={16} color="var(--text-primary)" />
          </button>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{ui.pageTitle}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => toggleLanguage('en')} style={{
            padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            border: '1.5px solid var(--border)',
            ...(language === 'en' ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : { background: 'transparent', color: 'var(--text-secondary)' })
          }}>EN</button>
          <button onClick={() => toggleLanguage('te')} style={{
            padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            border: '1.5px solid var(--border)',
            ...(language === 'te' ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : { background: 'transparent', color: 'var(--text-secondary)' })
          }}>TE</button>
        </div>
      </header>

      <div style={{ padding: '0 24px', marginTop: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'center' }}>
          {ui.subtitle}
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        
        {/* SECTION 1 */}
        <div style={sectionHeaderStyle}>
          <FaBabyCarriage size={16} color="var(--accent)" /> {ui.sec1}
        </div>
        <div style={{ padding: '16px 24px' }}>
          {QUESTIONS.filter(q => q.section === 1).map((q, idx) => renderQuestion(q, idx + 1))}
        </div>

        {/* SECTION 2 */}
        <div style={sectionHeaderStyle}>
          <FaFileMedical size={16} color="var(--info)" /> {ui.sec2}
        </div>
        <div style={{ padding: '16px 24px' }}>
          {QUESTIONS.filter(q => q.section === 2).map((q, idx) => renderQuestion(q, idx + 8))}
        </div>

        {/* SECTION 3 */}
        <div style={sectionHeaderStyle}>
          <FaHeartbeat size={16} color="var(--danger)" /> {ui.sec3}
        </div>
        <div style={{ padding: '16px 24px' }}>
          {QUESTIONS.filter(q => q.section === 3).map((q, idx) => renderQuestion(q, idx + 15))}
        </div>

        <div style={{ padding: '0 24px 24px 24px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: '16px' }}>
            {ui.skipNote}
          </div>
          <button onClick={handleSave} disabled={loading} style={{
            width: '100%', height: '52px', background: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: '100px', fontSize: '16px', fontWeight: 700,
            fontFamily: '"DM Sans", sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(194,24,91,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            {loading && <FaSpinner className="animate-spin" />}
            {ui.saveBtn}
          </button>
        </div>

      </div>
    </div>
  );
}
