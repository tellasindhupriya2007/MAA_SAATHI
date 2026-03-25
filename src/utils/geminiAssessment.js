const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_REST_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const VALID_STATUSES = new Set(['STABLE', 'MODERATE', 'CRITICAL']);

const safeString = (value, fallback = '') => {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const extractJsonFromText = (rawText = '') => {
  const text = safeString(rawText);
  if (!text) return null;

  // Strip markdown fences if present.
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] || text;

  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;

  const jsonSlice = candidate.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonSlice);
  } catch {
    return null;
  }
};

const normalizeStatus = (status) => {
  const normalized = safeString(status, 'STABLE').toUpperCase();
  return VALID_STATUSES.has(normalized) ? normalized : 'STABLE';
};

export const isConcernAnswer = (answer = '') => {
  const text = safeString(answer).toLowerCase();
  if (!text) return false;
  return [
    'severe',
    'critical',
    'danger',
    'bleeding',
    'not taking',
    'not yet',
    'not feeding',
    'frequent falls',
    'chest pain',
    'convulsion',
    'high fever',
    'distress',
    'hypothermia',
    'below 8',
    'multiple symptoms',
    'not breastfeeding',
    'does not know'
  ].some((token) => text.includes(token));
};

const getHeuristicAssessment = (qaPairs = [], language = 'en') => {
  let criticalHits = 0;
  let moderateHits = 0;

  qaPairs.forEach(({ answer }) => {
    const text = safeString(answer).toLowerCase();
    if (!text) return;

    if (
      text.includes('severe') ||
      text.includes('critical') ||
      text.includes('danger') ||
      text.includes('urgent') ||
      text.includes('not breastfeeding') ||
      text.includes('below 8') ||
      text.includes('frequent falls')
    ) {
      criticalHits += 1;
      return;
    }

    if (
      text.includes('mild') ||
      text.includes('moderate') ||
      text.includes('sometimes') ||
      text.includes('late') ||
      text.includes('not yet') ||
      text.includes('pending') ||
      text.includes('shortness')
    ) {
      moderateHits += 1;
    }
  });

  const status = criticalHits > 0 ? 'CRITICAL' : moderateHits > 1 ? 'MODERATE' : 'STABLE';
  const summaryByStatus = {
    en: {
      STABLE:
        'Assessment indicates stable findings with no immediate red flags. Continue routine follow-up and reinforce adherence to care guidance.',
      MODERATE:
        'Assessment indicates moderate risk indicators. A doctor review within 24-48 hours is recommended with close follow-up.',
      CRITICAL:
        'Urgent assessment: multiple high-risk indicators detected. Immediate referral and doctor intervention are strongly recommended.'
    },
    te: {
      STABLE:
        'విశ్లేషణలో అత్యవసర ప్రమాద సూచనలు కనిపించలేదు. సాధారణ ఫాలోఅప్ మరియు సూచించిన సంరక్షణను కొనసాగించండి.',
      MODERATE:
        'విశ్లేషణలో మోస్తరు ప్రమాద సూచనలు కనిపించాయి. 24-48 గంటల్లో డాక్టర్ సమీక్ష అవసరం.',
      CRITICAL:
        'అత్యవసర పరిస్థితి: అధిక ప్రమాద సూచనలు గుర్తించబడ్డాయి. వెంటనే డాక్టర్ జోక్యం మరియు రిఫరల్ అవసరం.'
    }
  };

  return {
    status,
    summary: summaryByStatus[language === 'te' ? 'te' : 'en'][status],
    concerns:
      status === 'STABLE'
        ? ['No major danger signs were detected from submitted responses.']
        : qaPairs
            .filter((item) => isConcernAnswer(item.answer))
            .slice(0, 4)
            .map((item) => `${item.question}: ${item.answer}`),
    recommendations:
      status === 'CRITICAL'
        ? [
            'Escalate to doctor/PHC immediately.',
            'Verify vital signs and emergency symptoms in person.',
            'Ensure transport/referral readiness and continuous monitoring.'
          ]
        : status === 'MODERATE'
          ? [
              'Arrange doctor review within 24-48 hours.',
              'Repeat key vitals and symptom checks.',
              'Counsel patient/caregiver on warning signs and when to seek urgent care.'
            ]
          : [
              'Continue routine care and follow-up schedule.',
              'Encourage medication and nutrition adherence.',
              'Reassess promptly if new symptoms appear.'
            ],
    model: 'heuristic-fallback'
  };
};

export const normalizeSurveyResponses = ({ qaPairs = [], questions = [], answers = {} } = {}) => {
  if (Array.isArray(qaPairs) && qaPairs.length > 0) {
    return qaPairs
      .map((item, index) => ({
        id: safeString(item.id, `q${index + 1}`),
        question: safeString(item.question, `Question ${index + 1}`),
        answer: safeString(item.answer, 'Not answered')
      }))
      .filter((item) => item.question);
  }

  if (Array.isArray(questions) && questions.length > 0) {
    return questions.map((question, index) => {
      const id = safeString(question.id, `q${index}`);
      const questionText = safeString(question.text || question.question, `Question ${index + 1}`);
      const rawAnswer =
        answers[id] ??
        answers[`q${index}`] ??
        answers[index] ??
        answers[questionText] ??
        answers[String(index + 1)];

      let answerText = 'Not answered';
      if (rawAnswer !== undefined && rawAnswer !== null) {
        if (typeof rawAnswer === 'number' && Array.isArray(question.options)) {
          answerText = safeString(question.options[rawAnswer], String(rawAnswer));
        } else if (Array.isArray(question.options) && /^-?\d+$/.test(String(rawAnswer))) {
          const idx = Number(rawAnswer);
          answerText = safeString(question.options[idx], String(rawAnswer));
        } else {
          answerText = safeString(rawAnswer, 'Not answered');
        }
      }

      return { id, question: questionText, answer: answerText };
    });
  }

  return Object.entries(answers).map(([key, value], index) => ({
    id: key,
    question: `Question ${index + 1}`,
    answer: safeString(value, 'Not answered')
  }));
};

const buildGeminiPrompt = ({ patient = {}, qaPairs = [], language = 'en' }) => {
  const lines = qaPairs
    .map((item, idx) => `${idx + 1}. ${item.question}\nAnswer: ${item.answer}`)
    .join('\n\n');

  const outputLanguage = language === 'te' ? 'Telugu' : 'English';

  return `
You are a maternal and community health triage assistant for rural PHC workflows.
Assess the survey responses and produce a concise clinical triage summary.

Patient:
- Name: ${safeString(patient.name, 'Unknown')}
- Age: ${safeString(patient.age, 'Unknown')}
- Village: ${safeString(patient.village, 'Unknown')}
- House: ${safeString(patient.house, 'Unknown')}

Survey Responses:
${lines || 'No responses provided'}

Return ONLY valid JSON in this exact structure:
{
  "status": "STABLE | MODERATE | CRITICAL",
  "summary": "short paragraph in ${outputLanguage}",
  "concerns": ["max 4 bullet strings"],
  "recommendations": ["max 4 bullet strings"]
}

Rules:
- Use STABLE only if no meaningful warning signs.
- Use MODERATE for non-urgent but notable risks requiring doctor review soon.
- Use CRITICAL for emergency warning signs requiring immediate intervention.
- Keep summary practical and clinically actionable.
`.trim();
};

const parseGeminiResponse = (responseJson) => {
  const text =
    responseJson?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || '')
      .join('\n')
      .trim() || '';
  return extractJsonFromText(text);
};

const callDirectGemini = async ({ apiKey, prompt }) => {
  const response = await fetch(`${GEMINI_REST_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 700,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini direct call failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  const parsed = parseGeminiResponse(payload);
  if (!parsed) throw new Error('Unable to parse Gemini JSON response.');
  return parsed;
};

const normalizeAssessmentShape = (raw, qaPairs, language) => {
  const status = normalizeStatus(raw?.status);
  const summary = safeString(raw?.summary, '');
  const concerns = Array.isArray(raw?.concerns) ? raw.concerns.map((item) => safeString(item)).filter(Boolean) : [];
  const recommendations = Array.isArray(raw?.recommendations)
    ? raw.recommendations.map((item) => safeString(item)).filter(Boolean)
    : [];

  if (!summary) {
    return getHeuristicAssessment(qaPairs, language);
  }

  return {
    status,
    summary,
    concerns: concerns.slice(0, 4),
    recommendations: recommendations.slice(0, 4),
    model: raw?.model || GEMINI_MODEL
  };
};

export const generateGeminiAssessment = async ({
  patient = {},
  qaPairs = [],
  language = 'en'
}) => {
  const prompt = buildGeminiPrompt({ patient, qaPairs, language });

  try {
    const response = await fetch('/api/gemini-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient, qaPairs, language })
    });

    if (response.ok) {
      const json = await response.json();
      return normalizeAssessmentShape(json, qaPairs, language);
    }
  } catch {
    // Intentionally swallow and try direct/fallback path below.
  }

  const browserKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (browserKey) {
    try {
      const direct = await callDirectGemini({ apiKey: browserKey, prompt });
      return normalizeAssessmentShape(direct, qaPairs, language);
    } catch {
      // Continue to deterministic fallback.
    }
  }

  return getHeuristicAssessment(qaPairs, language);
};
