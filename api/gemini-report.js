const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_REST_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const VALID_STATUSES = new Set(['STABLE', 'MODERATE', 'CRITICAL']);

const safeString = (value, fallback = '') => {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const normalizeStatus = (status) => {
  const normalized = safeString(status, 'STABLE').toUpperCase();
  return VALID_STATUSES.has(normalized) ? normalized : 'STABLE';
};

const extractJsonFromText = (rawText = '') => {
  const text = safeString(rawText);
  if (!text) return null;

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

const isConcernAnswer = (answer = '') => {
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
    'multiple symptoms'
  ].some((token) => text.includes(token));
};

const getHeuristicAssessment = (qaPairs = [], language = 'en') => {
  const concernMatches = qaPairs.filter((item) => isConcernAnswer(item.answer));
  const status = concernMatches.length > 1 ? 'CRITICAL' : concernMatches.length === 1 ? 'MODERATE' : 'STABLE';

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
        : concernMatches.slice(0, 4).map((item) => `${item.question}: ${item.answer}`),
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
            ]
  };
};

const normalizeQaPairs = (qaPairs = []) => {
  if (!Array.isArray(qaPairs)) return [];
  return qaPairs
    .map((item, index) => ({
      id: safeString(item?.id, `q${index + 1}`),
      question: safeString(item?.question, `Question ${index + 1}`),
      answer: safeString(item?.answer, 'Not answered')
    }))
    .filter((item) => item.question);
};

const buildPrompt = ({ patient = {}, qaPairs = [], language = 'en' }) => {
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

const normalizeAssessmentShape = (raw, qaPairs, language) => {
  const fallback = getHeuristicAssessment(qaPairs, language);
  const summary = safeString(raw?.summary, '');
  if (!summary) return fallback;

  const concerns = Array.isArray(raw?.concerns) ? raw.concerns.map((item) => safeString(item)).filter(Boolean) : [];
  const recommendations = Array.isArray(raw?.recommendations)
    ? raw.recommendations.map((item) => safeString(item)).filter(Boolean)
    : [];

  return {
    status: normalizeStatus(raw?.status),
    summary,
    concerns: concerns.slice(0, 4),
    recommendations: recommendations.slice(0, 4),
    model: GEMINI_MODEL
  };
};

const parseGeminiResponse = (payload) => {
  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || '')
      .join('\n')
      .trim() || '';
  return extractJsonFromText(text);
};

const readJsonBody = (req) => {
  if (!req?.body) return {};
  if (typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Gemini API key is not configured on the server.'
    });
  }

  const body = readJsonBody(req);
  const patient = body?.patient || {};
  const language = safeString(body?.language, 'en').toLowerCase().startsWith('te') ? 'te' : 'en';
  const qaPairs = normalizeQaPairs(body?.qaPairs);
  const prompt = buildPrompt({ patient, qaPairs, language });

  try {
    const response = await fetch(GEMINI_REST_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
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
      const errText = await response.text();
      console.error('[gemini-report] Gemini call failed:', response.status, errText);
      return res.status(502).json({
        error: 'Gemini request failed',
        statusCode: response.status
      });
    }

    const payload = await response.json();
    const parsed = parseGeminiResponse(payload);
    const normalized = normalizeAssessmentShape(parsed || {}, qaPairs, language);
    return res.status(200).json(normalized);
  } catch (error) {
    console.error('[gemini-report] Unexpected error:', error);
    return res.status(500).json({
      error: 'Failed to generate Gemini report'
    });
  }
}
