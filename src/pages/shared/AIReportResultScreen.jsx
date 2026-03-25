import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaExclamationTriangle, FaExclamationCircle, FaVolumeUp, FaCheck, FaFilePdf, FaArrowLeft, FaRobot, FaStop, FaUserMd, FaDownload, FaPaperPlane } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS, validateFirestoreDocument } from '../../config/firebaseSchema';
import { useAuth } from '../../hooks/useAuth';

export default function AIReportResultScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null); // 'STABLE' | 'MODERATE' | 'CRITICAL'
  const [aiText, setAiText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [toast, setToast] = useState('');

  const { questions = [], answers = {}, isGuest = false } = location.state || {};
  const patient = location.state?.patient || { name: 'Suhana Khatun', age: 24, village: 'Ramgarh', house: '42' };

  useEffect(() => {
    // Simulate Gemini API Call
    const analyzeData = async () => {
      setLoading(true);
      await new Promise(r => setTimeout(r, 2500));
      
      let score = 0;
      Object.values(answers).forEach(val => { score += val; });
      
      if (score < 5) {
        setResult('STABLE');
        setAiText(language === 'en' 
          ? "All vitals and reported symptoms are within normal ranges. Continue standard care and schedule the next routine visit."
          : "అన్ని ప్రాణాధారాలు మరియు నివేదించబడిన లక్షణాలు సాధారణ పరిధిలో ఉన్నాయి. ప్రామాణిక సంరక్షణను కొనసాగించండి మరియు తదుపరి సాధారణ సందర్శనను షెడ్యూల్ చేయండి.");
      } else if (score < 12) {
        setResult('MODERATE');
        setAiText(language === 'en'
          ? "Patient reports some elevated symptoms including mild weakness. A doctor review is recommended within 48 hours."
          : "రోగి తేలికపాటి బలహీనతతో సహా కొన్ని లక్షణాలను నివేదించారు. డాక్టర్ సమీక్ష 48 గంటల్లో సిఫార్సు చేయబడింది.");
      } else {
        setResult('CRITICAL');
        setAiText(language === 'en'
          ? "URGENT: Multiple danger signs detected including severe symptoms. Immediate medical referral to PHC is required."
          : "అత్యవసరం: తీవ్రమైన లక్షణాలతో సహా బహుళ ప్రమాద సంకేతాలు కనుగొనబడ్డాయి. తక్షణ వైద్య నివేదన అవసరం.");
        setReportSent(true); 
      }
      setLoading(false);
    };
    
    analyzeData();
  }, [answers, language]);

  const speakText = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
         window.speechSynthesis.cancel();
         setIsSpeaking(false);
         return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(aiText);
      utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Helper to draw footer on every page
    const drawFooter = (pageNum) => {
      doc.setDrawColor(232, 234, 237); // #E8EAED
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
      
      doc.setFontSize(9);
      doc.setTextColor(136, 136, 136); // #888888
      doc.setFont("helvetica", "normal");
      doc.text("MaaSathi — Maternal Health Monitoring System", 20, pageHeight - 12);
      doc.text(`Page ${pageNum} of 3`, pageWidth / 2, pageHeight - 12, { align: 'center' });
      doc.text("Report is for clinical review only", pageWidth - 20, pageHeight - 12, { align: 'right' });
    };

    // ==========================================
    // PAGE 1 — HEADER AND PATIENT INFO
    // ==========================================
    
    // Header Bar
    doc.setFillColor(194, 24, 91); // #C2185B
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("MaaSathi", 20, 25);
    doc.setFontSize(9);
    doc.text("MATERNAL HEALTH ASSESSMENT REPORT", pageWidth - 20, 22, { align: 'right' });

    // Urgency badge below header
    let badgeFill = [220, 252, 231]; // STABLE def
    let badgeStroke = [26, 127, 75];
    let badgeText = "STABLE";
    if (result === 'CRITICAL') {
      badgeFill = [255, 235, 238];
      badgeStroke = [198, 40, 40];
      badgeText = "CRITICAL ALERT";
    } else if (result === 'MODERATE') {
      badgeFill = [254, 243, 199];
      badgeStroke = [180, 83, 9];
      badgeText = "MODERATE URGENCY";
    }

    const badgeX = (pageWidth / 2) - 60;
    doc.setFillColor(...badgeFill);
    doc.setDrawColor(...badgeStroke);
    doc.setLineWidth(1);
    doc.roundedRect(badgeX, 52, 120, 24, 12, 12, 'FD');
    doc.setTextColor(...badgeStroke);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(badgeText, pageWidth / 2, 67, { align: 'center' });

    // Patient Info Section
    doc.setFillColor(248, 249, 251); // #F8F9FB
    doc.roundedRect(20, 85, pageWidth - 40, 60, 4, 4, 'F');
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    // Left Col
    doc.setTextColor(136, 136, 136); doc.text("Patient:", 30, 100);
    doc.setTextColor(15, 17, 23); doc.setFontSize(11); doc.text(patient.name, 65, 100);
    
    doc.setFontSize(9);
    doc.setTextColor(136, 136, 136); doc.text("Age:", 30, 115);
    doc.setTextColor(15, 17, 23); doc.setFontSize(11); doc.text(`${patient.age} years`, 65, 115);

    doc.setFontSize(9);
    doc.setTextColor(136, 136, 136); doc.text("Village:", 30, 130);
    doc.setTextColor(15, 17, 23); doc.setFontSize(11); doc.text(patient.village, 65, 130);

    // Right Col
    const rColX = (pageWidth / 2) + 10;
    doc.setFontSize(9);
    doc.setTextColor(136, 136, 136); doc.text("House:", rColX, 100);
    doc.setTextColor(15, 17, 23); doc.setFontSize(11); doc.text(patient.house, rColX + 35, 100);

    doc.setFontSize(9);
    doc.setTextColor(136, 136, 136); doc.text("Date:", rColX, 115);
    doc.setTextColor(15, 17, 23); doc.setFontSize(11); doc.text(new Date().toLocaleDateString(), rColX + 35, 115);

    doc.setFontSize(9);
    doc.setTextColor(136, 136, 136); doc.text("ASHA Worker:", rColX, 130);
    doc.setTextColor(15, 17, 23); doc.setFontSize(11); doc.text("Lakshmi", rColX + 35, 130);

    // Thin accent line separator
    doc.setDrawColor(194, 24, 91); // #C2185B
    doc.setLineWidth(1);
    doc.line(0, 155, pageWidth, 155);

    drawFooter(1);

    // ==========================================
    // PAGE 2 — SURVEY RESPONSES
    // ==========================================
    doc.addPage();
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 17, 23); // #0F1117
    doc.text("Survey Responses", 20, 20);

    doc.setDrawColor(232, 234, 237); // #E8EAED
    doc.setLineWidth(0.5);
    doc.line(20, 28, pageWidth - 20, 28);

    // Table header row
    doc.setFillColor(252, 228, 236); // #FCE4EC
    doc.rect(20, 32, pageWidth - 40, 18, 'F');
    doc.setFontSize(10);
    doc.setTextColor(194, 24, 91); // #C2185B
    doc.text("Question", 25, 44);
    doc.text("Answer", pageWidth / 2, 44);

    let yPos = 50;
    questions.forEach((q, i) => {
      const selectedOptIdx = answers[q.id];
      const selectedAnswer = selectedOptIdx !== undefined ? q.options[selectedOptIdx] : "Not Answered";
      const isDanger = selectedOptIdx >= 2;
      
      const qLines = doc.splitTextToSize(`Q${i+1}: ${q.text}`, (pageWidth / 2) - 30);
      const aLines = doc.splitTextToSize(selectedAnswer, (pageWidth / 2) - 30);
      const maxLines = Math.max(qLines.length, aLines.length);
      const rowHeight = Math.max(20, maxLines * 5 + 10);

      if (yPos + rowHeight > pageHeight - 30) {
        drawFooter(2);
        doc.addPage();
        yPos = 20;
      }

      // Row background
      if (isDanger) {
        doc.setFillColor(255, 235, 238); // #FFEBEE
      } else {
        doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 249, i % 2 === 0 ? 255 : 251);
      }
      doc.rect(20, yPos, pageWidth - 40, rowHeight, 'F');
      
      if (isDanger) {
        doc.setFillColor(198, 40, 40); // #C62828 stripe
        doc.rect(20, yPos, 3, rowHeight, 'F');
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(92, 99, 112); // #5C6370
      doc.text(qLines, 25, yPos + 6);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 17, 23); // #0F1117
      doc.text(aLines, pageWidth / 2, yPos + 6);

      yPos += rowHeight;
    });

    drawFooter(2);

    // ==========================================
    // PAGE 3 — AI ANALYSIS
    // ==========================================
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 17, 23);
    doc.text("AI Analysis and Recommendations", 20, 20);

    doc.setDrawColor(232, 234, 237);
    doc.setLineWidth(0.5);
    doc.line(20, 28, pageWidth - 20, 28);

    // AI Summary Box
    const aiLines = doc.splitTextToSize(aiText, pageWidth - 50);
    const summaryHeight = Math.max(30, aiLines.length * 6 + 24);
    
    doc.setFillColor(248, 249, 251); // #F8F9FB
    doc.setDrawColor(232, 234, 237); // #E8EAED
    doc.rect(20, 35, pageWidth - 40, summaryHeight, 'FD');
    
    doc.setFontSize(9);
    doc.setTextColor(136, 136, 136); // #888888
    doc.text("Summary", 25, 48);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 17, 23); // #0F1117
    doc.text(aiLines, 25, 58);

    let nextY = 35 + summaryHeight + 20;

    if (result !== 'STABLE') {
       doc.setFontSize(12);
       doc.setFont("helvetica", "bold");
       doc.setTextColor(198, 40, 40); // #C62828
       doc.text("Concerns Identified", 20, nextY);
       
       const flags = result === 'CRITICAL' ? ['Multiple severe danger signs reported', 'Patient requires immediate medical review'] : ['Elevated symptoms detected', 'Patient requires routine medical review'];
       nextY += 10;
       
       flags.forEach(flag => {
         doc.setFillColor(198, 40, 40);
         doc.circle(23, nextY - 1, 1.5, 'F');
         doc.setFontSize(9);
         doc.setFont("helvetica", "normal");
         doc.setTextColor(15, 17, 23);
         doc.text(flag, 28, nextY);
         nextY += 8;
       });

       nextY += 12;

       doc.setFontSize(12);
       doc.setFont("helvetica", "bold");
       doc.setTextColor(2, 136, 209); // var(--info) approx
       doc.text("Recommendations for Doctor", 20, nextY);

       const recs = result === 'CRITICAL' ? ['Schedule immediate physical examination', 'Cross-check latest ANC blood reports'] : ['Review patient condition within 48 hours', 'Cross-check latest ANC blood reports'];
       nextY += 10;

       recs.forEach((rec, idx) => {
         doc.setFillColor(225, 245, 254);
         doc.circle(24, nextY - 1, 3, 'F');
         doc.setFontSize(6);
         doc.setFont("helvetica", "bold");
         doc.setTextColor(2, 136, 209);
         doc.text(`${idx + 1}`, 24, nextY + 1, { align: 'center' }); 

         doc.setFontSize(9);
         doc.setFont("helvetica", "normal");
         doc.setTextColor(15, 17, 23);
         doc.text(rec, 30, nextY);
         nextY += 10;
       });
    }

    drawFooter(3);

    doc.save(`${patient.name.replace(/\\s+/g, '_')}_HealthReport.pdf`);
  };

  const { profile } = useAuth();

  const handleSendToDoctor = async () => {
    let rawTarget = patient?.doctorEmail || profile?.linkedDoctorEmail;
    
    if (!rawTarget) {
      const email = prompt("Enter doctor's email to send this report:");
      if (!email || !email.includes('@')) {
        alert("Please provide a valid doctor email.");
        return;
      }
      rawTarget = email;
    }
    const targetEmail = rawTarget.toLowerCase().trim();

    try {
      const reportData = {
        patientId: patient.id || 'unknown',
        patientName: patient.name,
        patientType: patient.type || 'pregnant',
        doctorEmail: targetEmail,
        type: 'AI Health Assessment',
        urgency: result,
        aiStatus: result,
        aiParagraphEnglish: aiText,
        ashaName: profile?.name || 'ASHA Worker',
        phcLocation: patient.village || profile?.phc || 'PHC Ramgarh',
        createdAt: serverTimestamp()
      };

      // Client-side schema validation
      if (typeof validateFirestoreDocument === 'function') {
        validateFirestoreDocument('reports', reportData);
      }

      await addDoc(collection(db, COLLECTIONS.reports), reportData);

      setReportSent(true);
      setToast(`Report submitted successfully to ${targetEmail}`);
    } catch (err) {
      console.error("[REPORTS] submission error:", err);
      const msg = err.message || "Failed to reach doctor.";
      alert(`Submission Failed: ${msg}\n\nThis usually happens if the database is busy or rules need updating. Please try again or check your email settings.`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-24">
        <div className="w-48 h-48 border-4 border-t-accent rounded-full animate-spin m-b-24" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}></div>
        <p className="body text-secondary">Analyzing health data...</p>
        <p className="caption text-tertiary m-t-8" style={{ textTransform: 'none' }}>This takes a few seconds</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100dvh', padding: '24px 20px 96px 20px', fontFamily: '"DM Sans", sans-serif' }}>
      
      {/* TOAST OVERLAY */}
      {toast && (
        <div style={{ position: 'fixed', top: '40px', left: '50%', transform: 'translateX(-50%)', background: 'var(--text-primary)', color: 'white', padding: '12px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}

      {/* STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes criticalBorder {
          0%, 100% { border-color: var(--danger); }
          50% { border-color: transparent; }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        .critical-border {
          animation: criticalBorder 1.5s infinite;
        }
        .scale-in {
          animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}} />

      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        
        {/* STATUS BANNER CARD */}
        {result === 'MODERATE' && (
          <div style={{ background: 'var(--warning-light)', border: '2px solid var(--warning)', borderRadius: 'var(--radius-xl)', padding: '28px 24px', textAlign: 'center', marginBottom: '20px' }}>
            <FaExclamationTriangle size={48} color="var(--warning)" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--warning)', marginBottom: '8px' }}>Attention Required</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Some concerns were identified in this assessment</div>
          </div>
        )}

        {result === 'CRITICAL' && (
          <div className="critical-border" style={{ background: 'var(--danger-light)', border: '2px solid var(--danger)', borderRadius: 'var(--radius-xl)', padding: '28px 24px', textAlign: 'center', marginBottom: '20px' }}>
            <FaExclamationCircle size={48} color="var(--danger)" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--danger)', marginBottom: '8px' }}>Immediate Attention Needed</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Severe danger signs detected in this assessment</div>
          </div>
        )}

        {result === 'STABLE' && (
          <div className="scale-in" style={{ background: 'var(--success-light)', border: '2px solid var(--success)', borderRadius: 'var(--radius-xl)', padding: '28px 24px', textAlign: 'center', marginBottom: '20px' }}>
            <FaCheckCircle size={48} color="var(--success)" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)', marginBottom: '8px' }}>All Looks Stable</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No danger signs identified in this assessment</div>
          </div>
        )}

        {/* AI SUMMARY CARD */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FaRobot size={16} color="var(--accent)" />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>AI Assessment Summary</span>
          </div>

          <div style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-primary)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '14px 16px', borderLeft: '3px solid var(--accent)' }}>
            {aiText}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <button onClick={speakText} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '100px', background: 'var(--accent-light)', border: '1px solid var(--accent)', color: 'var(--accent)', font: '13px "DM Sans", sans-serif', fontWeight: 600, cursor: 'pointer' }}>
               {isSpeaking ? <FaStop size={14} /> : <FaVolumeUp size={14} />}
               {language === 'en' ? 'Listen in English' : 'తెలుగులో వినండి'}
            </button>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
               {language === 'en' ? 'Switch to Telugu to hear in Telugu' : 'Switch to English to hear in English'}
            </div>
          </div>
        </div>

        {/* CONDITIONAL CARDS (Only if NOT Stable) */}
        {result !== 'STABLE' && (
          <>
            {/* DANGER FLAGS CARD */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                 <FaExclamationCircle size={16} color="var(--danger)" />
                 <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Concerns Identified</span>
               </div>
               
               {[{text: result === 'CRITICAL' ? 'Multiple severe danger signs reported' : 'Elevated symptoms detected'}, {text: 'Patient requires medical review'}].map((flag, i, arr) => (
                 <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', marginTop: '6px', flexShrink: 0 }} />
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{flag.text}</div>
                 </div>
               ))}
            </div>

            {/* DOCTOR RECOMMENDATIONS CARD */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                 <FaUserMd size={16} color="var(--info)" />
                 <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Recommendations for Doctor</span>
               </div>
               
               {[{text: result === 'CRITICAL' ? 'Schedule immediate physical examination' : 'Review patient condition within 48 hours'}, {text: 'Cross-check latest ANC blood reports'}].map((rec, i, arr) => (
                 <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--info-light)', color: 'var(--info)', font: '12px "DM Sans"', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{rec.text}</div>
                 </div>
               ))}
            </div>
          </>
        )}

        {/* PDF REPORT CARD */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-tertiary)', marginBottom: '14px' }}>HEALTH REPORT GENERATED</div>

          {/* Report file row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px' }}>
             <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: result === 'CRITICAL' ? 'var(--danger-light)' : result === 'MODERATE' ? 'var(--warning-light)' : 'var(--success-light)',
                color: result === 'CRITICAL' ? 'var(--danger)' : result === 'MODERATE' ? 'var(--warning)' : 'var(--success)'
             }}>
               <FaFilePdf size={22} />
             </div>
             
             <div style={{ flex: 1 }}>
               <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Assessment_{patient.name.replace(/\s+/g, '_')}</div>
               <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{new Date().toLocaleString()}</div>
             </div>

             <button onClick={generatePDF} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
               <FaDownload size={16} color="var(--text-tertiary)" />
             </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isGuest ? (
              <>
                <button onClick={() => navigate('/login')} style={{ height: '52px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', font: '15px "DM Sans", sans-serif', fontWeight: 600, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                   <FaUserMd size={16} /> Create Account to Save
                </button>
                <button onClick={generatePDF} style={{ height: '52px', background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', borderRadius: 'var(--radius-md)', font: '15px "DM Sans", sans-serif', fontWeight: 600, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                   <FaDownload size={16} /> Download Copy
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSendToDoctor} style={{ height: '52px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', font: '15px "DM Sans", sans-serif', fontWeight: 600, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                   <FaPaperPlane size={16} /> Send to Doctor
                </button>
                <button onClick={generatePDF} style={{ height: '52px', background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', borderRadius: 'var(--radius-md)', font: '15px "DM Sans", sans-serif', fontWeight: 600, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                   <FaDownload size={16} /> Download PDF
                </button>
              </>
            )}
          </div>

          <div onClick={() => navigate('/asha/dashboard')} style={{ textAlign: 'center', font: '14px "DM Sans", sans-serif', color: 'var(--text-tertiary)', marginTop: '8px', textDecoration: 'underline', cursor: 'pointer' }}>
             Back to Dashboard
          </div>
        </div>

      </div>
    </div>
  );
}
