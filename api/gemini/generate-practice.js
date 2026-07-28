import { buildPracticeQuestions, generateText, getBody, isAIAvailable, methodNotAllowed, parseJsonOrFallback } from "../_shared.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const { subject, topic } = getBody(req);
  const fallback = buildPracticeQuestions(subject, topic);

  try {
    if (!isAIAvailable()) {
      return res.status(200).json(fallback);
    }

    const prompt = `Gere 3 exercicios em portugues no estilo ENEM/FUVEST sobre ${topic || "conteudo"} em ${subject || "Vestibular"}.
Cada questao deve ter 5 alternativas e apenas uma correta.
Retorne somente JSON valido no formato {"questions":[{"subject":"${subject || "Vestibular"}","question":"...","options":["A) ...","B) ...","C) ...","D) ...","E) ..."],"correctIndex":0,"explanation":"...","origin":"ENEM Adaptada"}]}`;

    const text = await generateText(prompt, true, 0.5);
    return res.status(200).json(parseJsonOrFallback(text, fallback));
  } catch {
    return res.status(200).json(fallback);
  }
}
