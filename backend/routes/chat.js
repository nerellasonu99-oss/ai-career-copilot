const express = require('express');

const router = express.Router();

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
].filter(Boolean);

const SYSTEM_PROMPT = `You are an expert AI Career Coach and mentor for students using AI Career Copilot.
Your job is to guide students toward job-ready skills in a simple, encouraging, and highly practical way.

Behavior rules:
- Speak like a supportive mentor, not a generic chatbot.
- Focus on the student's target role, skill gap, learning priority, and next 1-3 actions.
- Prefer simple explanations, short steps, and action-based advice.
- Use bullet points for actionable learning plans.
- If role context is available, tailor the answer to that role.
- If the user is confused, explain concepts in easy student language.
- If the user asks for planning, provide a focused weekly roadmap.
- Do not invent fake courses, URLs, or certificates.
- Keep every answer useful, concise, and student-friendly.
- Best length: 120-220 words unless the user asks for deeper detail.`;

const isKeyConfigured = () => {
  const key = String(process.env.GEMINI_API_KEY || '').trim();
  return Boolean(key) && !/your_free_gemini_api_key_here|placeholder/i.test(key);
};

const buildContents = (history, message) => {
  const turns = [];

  (Array.isArray(history) ? history : []).slice(-8).forEach((item) => {
    const role = item.role === 'user' ? 'user' : 'model';
    const text = String(item.content || '').trim();
    if (!text) return;
    if (turns.length && turns[turns.length - 1].role === role) {
      turns[turns.length - 1].parts[0].text += `\n${text}`;
      return;
    }
    turns.push({ role, parts: [{ text }] });
  });

  if (turns[0]?.role === 'model') turns.shift();

  turns.push({ role: 'user', parts: [{ text: message }] });
  return turns;
};

const extractReply = (data) => {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text || '').join('').trim();
};

const localCoachReply = (message, context) => {
  const role = context?.roleLabel || 'your target role';
  const gaps = Array.isArray(context?.topGaps) ? context.topGaps.slice(0, 3) : [];
  const score = Number.isFinite(context?.matchScore) ? context.matchScore : null;
  const lower = message.toLowerCase();

  if (/hello|hi\b|hey/.test(lower)) {
    return `Hi — I’m your student-focused career coach for ${role || 'your target role'}. Ask me what to learn first, what to practice this week, or how to improve your roadmap.`;
  }

  if (gaps.length && /first|start|gap|learn|next|priority|what should i learn/.test(lower)) {
    return [
      `For ${role || 'your target role'}${score !== null ? ` (current match: ${score}%)` : ''}, the best order is:`,
      ...gaps.slice(0, 3).map((gap, i) => `${i + 1}. ${gap}`),
      'Study one gap at a time, build a small project, and re-rate your confidence before moving to the next skill.'
    ].join('\n');
  }

  if (/plan|roadmap|week|practice|schedule/.test(lower)) {
    return [
      `Here is a strong student roadmap for ${role || 'your target role'}:`,
      '1. Pick the top 2 missing skills and learn the fundamentals this week.',
      '2. Build one mini project that proves those skills in a real scenario.',
      '3. Review your score, update your roadmap, and repeat the cycle.',
      score !== null ? `Current progress target: ${score}% match.` : 'Keep improving with small wins every week.'
    ].join(' ');
  }

  return [
    `I can coach you on ${role || 'your target role'} while Gemini reconnects.`,
    score !== null ? `Current match score: ${score}%.` : '',
    gaps.length ? `Priority skills: ${gaps.slice(0, 3).join('; ')}.` : 'Pick a role, rate your skills, and tap Analyze to get a practical gap breakdown.',
    'Ask: “What should I study first?” or “How can I improve my roadmap this week?”'
  ].filter(Boolean).join(' ');
};

const callGemini = async (apiKey, contents) => {
  let lastError = 'Gemini request failed';

  for (const model of GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
            topP: 0.9
          }
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      const reply = extractReply(data);
      if (reply) return { reply, model };
      lastError = 'Empty Gemini response';
      continue;
    }

    lastError = data?.error?.message || `Gemini ${response.status}`;
    if (![400, 404].includes(response.status)) {
      throw new Error(lastError);
    }
  }

  throw new Error(lastError);
};

router.get('/status', (req, res) => {
  res.json({
    configured: isKeyConfigured(),
    provider: 'Google Gemini',
    models: GEMINI_MODELS
  });
});

router.post('/', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  const context = req.body?.context && typeof req.body.context === 'object' ? req.body.context : {};

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  const contextBlock = [
    context.roleLabel ? `Target role: ${context.roleLabel}` : '',
    Number.isFinite(context.matchScore) ? `Match score: ${context.matchScore}%` : '',
    Array.isArray(context.topGaps) && context.topGaps.length
      ? `Top gaps: ${context.topGaps.slice(0, 5).join('; ')}`
      : '',
    Array.isArray(context.roadmap) && context.roadmap.length
      ? `Roadmap items: ${context.roadmap.slice(0, 5).join('; ')}`
      : ''
  ].filter(Boolean).join('\n');

  const userPrompt = contextBlock
    ? `${contextBlock}\n\nUser question: ${message}`
    : message;

  if (!isKeyConfigured()) {
    return res.json({
      reply: localCoachReply(message, context),
      source: 'local',
      warning: 'GEMINI_API_KEY is missing. Add a real key in backend/.env and restart the server.'
    });
  }

  try {
    const { reply, model } = await callGemini(
      process.env.GEMINI_API_KEY.trim(),
      buildContents(history, userPrompt)
    );

    res.json({ reply, source: 'gemini', model });
  } catch (error) {
    console.error('Gemini chat failed:', error.message);
    res.json({
      reply: localCoachReply(message, context),
      source: 'local',
      warning: error.message
    });
  }
});

module.exports = router;
