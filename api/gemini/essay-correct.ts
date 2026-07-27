import { ApiRequest, VercelResponse, buildEssayCorrectionFallback, generateText, getBody, isAIAvailable, methodNotAllowed, parseJsonOrFallback } from "../_shared";

export default async function handler(req: ApiRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const { theme, essayText } = getBody(req);

  if (!essayText || String(essayText).trim().length < 50) {
    return res.status(400).json({ error: "Insira uma redacao com pelo menos 50 caracteres." });
  }

  const fallback = buildEssayCorrectionFallback(theme, essayText);

  try {
    if (!isAIAvailable()) {
      return res.json(fallback);
    }

    const prompt = `Voce e um corretor de redacao do ENEM.
Avalie a redacao abaixo pelas 5 competencias, cada uma com nota entre 0 e 200.
Retorne somente JSON valido neste formato:
{
  "totalScore": 760,
  "comp1": { "score": 160, "feedback": "..." },
  "comp2": { "score": 160, "feedback": "..." },
  "comp3": { "score": 160, "feedback": "..." },
  "comp4": { "score": 160, "feedback": "..." },
  "comp5": { "score": 160, "feedback": "..." },
  "generalFeedback": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "corrections": [{ "original": "...", "corrected": "...", "why": "..." }]
}

Tema: ${theme || "Tema livre"}
Redacao:
${essayText}`;

    const text = await generateText(prompt, true, 0.4);
    return res.json(parseJsonOrFallback(text, fallback));
  } catch {
    return res.json(fallback);
  }
}
