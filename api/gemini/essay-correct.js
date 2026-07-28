import { buildEssayCorrectionFallback, generateText, getBody, isAIAvailable, methodNotAllowed, parseJsonOrFallback } from "../_shared.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const { theme, essayText } = getBody(req);

  if (!essayText || String(essayText).trim().length < 50) {
    return res.status(400).json({ error: "Insira uma redacao com pelo menos 50 caracteres." });
  }

  const fallback = buildEssayCorrectionFallback(theme, essayText);

  try {
    if (!isAIAvailable()) {
      return res.status(200).json(fallback);
    }

    const prompt = `Voce e um corretor de redacao do ENEM.
Avalie a redacao abaixo pelas 5 competencias, cada uma com nota entre 0 e 200.
Retorne somente JSON valido com totalScore, comp1, comp2, comp3, comp4, comp5, generalFeedback, strengths, weaknesses e corrections.

Tema: ${theme || "Tema livre"}
Redacao:
${essayText}`;

    const text = await generateText(prompt, true, 0.4);
    return res.status(200).json(parseJsonOrFallback(text, fallback));
  } catch {
    return res.status(200).json(fallback);
  }
}
