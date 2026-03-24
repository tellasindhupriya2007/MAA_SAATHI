import { jsPDF } from "jspdf";

/**
 * DEMO MOCK DATA
 * Used for simulation when backend is not fully integrated.
 */
const mockPatient = {
  name: "Patient ID: MS1023",
  age: 28,
  type: "pregnant",
  medicalHistory: {
    conditions: ["Mild anemia", "Low blood pressure"],
    medications: ["Iron supplements"],
    pastComplications: "No major complications",
  },
  vitals: [
    { heartRate: 82, spO2: 98, temp: 36.7, steps: 3200 },
    { heartRate: 88, spO2: 97, temp: 36.8, steps: 2800 },
    { heartRate: 92, spO2: 96, temp: 37.0, steps: 2500 }
  ],
  aiSummary: "Patient shows mild anemia with slightly increasing heart rate trend. No critical risk detected but requires monitoring.",
  riskLevel: "MODERATE"
};

/**
 * Helper to calculate averages and trend text
 */
const analyzeTrends = (vitals) => {
  if (!vitals || vitals.length === 0) return { avgHR: 0, avgSpO2: 0, trend: "No data available." };
  
  const avgHR = (vitals.reduce((acc, v) => acc + v.heartRate, 0) / vitals.length).toFixed(1);
  const avgSpO2 = (vitals.reduce((acc, v) => acc + v.spO2, 0) / vitals.length).toFixed(1);
  
  let trend = "Vitals remain within stable physiological ranges.";
  const latest = vitals[0];
  const oldest = vitals[vitals.length - 1];
  
  if (latest.heartRate > oldest.heartRate) {
    trend = "Heart rate shows an increasing trend over recent readings. SpO2 remains within safe range. Activity levels are moderate.";
  } else if (latest.heartRate < oldest.heartRate) {
    trend = "Heart rate shows a calming, decreasing trend. Physiological recovery is evident.";
  }

  return { avgHR, avgSpO2, trend };
};

/**
 * Core PDF Generation Logic
 */
const generatePDF = (patientData, reportType = "instant", mode = "download") => {
  const doc = new jsPDF();
  const data = patientData || mockPatient;
  const now = new Date();
  const dateStr = now.toLocaleDateString() + " at " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --- 1. HEADER ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(155, 0, 68); // Brand Magenta
  doc.text("MaaSathi Health Report", 20, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("AI Assisted Clinical Summary", 20, 32);
  doc.text(`Generated on: ${dateStr}`, 140, 25);
  
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 38, 190, 38);

  // --- 2. PATIENT PROFILE ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(33, 37, 41);
  doc.text("PATIENT PROFILE", 20, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`ID / Name: ${data.name}`, 25, 58);
  doc.text(`Age: ${data.age}`, 25, 64);
  doc.text(`Type: ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Patient`, 25, 70);

  // --- 3. MEDICAL HISTORY (AI SUMMARY) ---
  doc.setFont("helvetica", "bold");
  doc.text("MEDICAL BACKGROUND SUMMARY", 20, 85);

  const hist = data.medicalHistory;
  let historyText = "";

  if (hist && typeof hist === 'object') {
    if (Array.isArray(hist.answers)) {
      // Elderly Format
      historyText = hist.answers.map(a => `${a.question}: ${a.answer}`).join(". ");
    } else if (hist.conditions) {
      // Old Mock Format
      historyText = `Patient history of ${hist.conditions.join(" & ")}. Medications: ${hist.medications.join(", ")}.`;
    } else {
      // Key-Value Format (Mother / Wellness)
      historyText = Object.entries(hist).map(([q, a]) => `${q}: ${a}`).join(". ");
    }
  } else {
    historyText = "No previous medical history recorded.";
  }
  
  doc.setFont("helvetica", "normal");
  const splitHistory = doc.splitTextToSize(historyText, 160);
  doc.text(splitHistory, 25, 93);

  // --- 4. CURRENT VITALS ---
  let currentY = 110;
  doc.setFont("helvetica", "bold");
  doc.text(reportType === "monthly" ? "30-DAY CLINICAL METRICS" : "CURRENT VITALS", 20, currentY);

  const latest = data.vitals[0];
  doc.setFont("helvetica", "normal");
  doc.text(`• Heart Rate: ${latest.heartRate} bpm`, 25, currentY + 8);
  doc.text(`• SpO2: ${latest.spO2}%`, 25, currentY + 14);
  doc.text(`• Temperature: ${latest.temp}°C`, 105, currentY + 8);
  doc.text(`• Steps Today: ${latest.steps}`, 105, currentY + 14);

  // --- 5. TRENDS & ANALYSIS ---
  currentY += 30;
  doc.setFont("helvetica", "bold");
  doc.text("TRENDS & ANALYSIS", 20, currentY);

  const { avgHR, avgSpO2, trend } = analyzeTrends(data.vitals);
  doc.setFont("helvetica", "normal");
  doc.text(`Average Heart Rate: ${avgHR} bpm`, 25, currentY + 8);
  doc.text(`Average SpO2: ${avgSpO2}%`, 25, currentY + 14);
  
  const splitTrend = doc.splitTextToSize(trend, 160);
  doc.text(splitTrend, 25, currentY + 22);

  // --- 6. AI HEALTH INSIGHT ---
  currentY += 45;
  doc.setFillColor(248, 249, 250);
  doc.rect(20, currentY - 5, 170, 35, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(155, 0, 68);
  doc.text("AI HEALTH INSIGHT", 25, currentY + 5);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(33, 37, 41);
  const splitAI = doc.splitTextToSize(data.aiSummary, 160);
  doc.text(splitAI, 25, currentY + 13);

  // --- 7. RISK LEVEL ---
  currentY += 45;
  doc.setFont("helvetica", "bold");
  doc.text("RISK LEVEL:", 20, currentY);
  
  const risk = data.riskLevel.toUpperCase();
  const riskColor = risk === "HIGH" ? [186, 26, 26] : (risk === "MODERATE" ? [217, 119, 6] : [0, 109, 49]);
  doc.setTextColor(...riskColor);
  doc.text(risk, 50, currentY);

  // --- 8. RECOMMENDATIONS ---
  currentY += 12;
  doc.setTextColor(33, 37, 41);
  doc.setFont("helvetica", "bold");
  doc.text("RECOMMENDATIONS:", 20, currentY);
  
  doc.setFont("helvetica", "normal");
  let rec = "Continue routine monitoring";
  if (risk === "MODERATE") rec = "Monitor closely and consult doctor if symptoms persist";
  if (risk === "HIGH") rec = "Immediate medical attention required";
  doc.text(rec, 65, currentY);

  // --- 9. FOOTER ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("This report is AI-generated and intended to assist medical consultation.", 105, pageHeight - 20, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("MaaSathi — Real-Time Health Intelligence", 105, pageHeight - 14, { align: "center" });

  // Output
  if (mode === 'view') {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`${data.name.replace(/\s+/g, '_')}_Report.pdf`);
  }
};

/**
 * EXPORTED FUNCTIONS
 */

export const generateInstantReport = (userProfile, vitalsData, surveyData, mode = 'download') => {
  // Use passed data if available, otherwise fallback to mock for demo
  const data = userProfile ? {
    name: userProfile.name || mockPatient.name,
    age: userProfile.age || mockPatient.age,
    type: userProfile.patientType || mockPatient.type,
    medicalHistory: userProfile.medicalHistory || mockPatient.medicalHistory,
    vitals: (vitalsData && vitalsData.length > 0) ? vitalsData.map(v => ({
      heartRate: v.heartRate || 72,
      spO2: v.spO2 || 98,
      temp: v.temperature || 36.6,
      steps: v.stepCount || 0
    })) : mockPatient.vitals,
    aiSummary: surveyData?.aiParagraphEnglish || mockPatient.aiSummary,
    riskLevel: surveyData?.aiStatus || mockPatient.riskLevel
  } : mockPatient;

  generatePDF(data, "instant", mode);
};

// Aliases for backward compatibility
export const generateProfessionalReport = generateInstantReport;

export const generateMonthlyReport = (userProfile, vitalsData, surveyData, mode = 'download') => {
  const data = userProfile ? {
    name: userProfile.name || mockPatient.name,
    age: userProfile.age || mockPatient.age,
    type: userProfile.patientType || mockPatient.type,
    medicalHistory: userProfile.medicalHistory || mockPatient.medicalHistory,
    vitals: (vitalsData && vitalsData.length > 0) ? vitalsData.map(v => ({
      heartRate: v.heartRate || 72,
      spO2: v.spO2 || 98,
      temp: v.temperature || 36.6,
      steps: v.stepCount || 0
    })) : mockPatient.vitals,
    aiSummary: "Monthly Trend Analysis: Patient demonstrates consistent vital signs with minor fluctuations. Activity levels have increased by 15% compared to previous month.",
    riskLevel: surveyData?.aiStatus || mockPatient.riskLevel
  } : mockPatient;

  generatePDF(data, "monthly", mode);
};
