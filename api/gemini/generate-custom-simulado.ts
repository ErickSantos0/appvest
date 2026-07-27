import { ApiRequest, VercelResponse, buildPracticeQuestions, generateText, getBody, isAIAvailable, methodNotAllowed, parseJsonOrFallback } from "../_shared";

export default async function handler(req: ApiRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const { subjects, numQuestions, complexity } = getBody(req);
  const chosen = Array.isArray(subjects) && subjects.length ? subjects : ["Matematica", "Portugues", "Biologia"];
  const amount = Number(numQuestions || 3);
  const fallback = buildPracticeQuestions(chosen[0], `${chosen.join(", ")} - ${complexity || "Medio"}`);
  fallback.questions = Array.from({ length: amount }, (_, index) => ({
    ...fallback.questions[index % fallback.questions.length],
    subject: chosen[index % chosen.length],
    complexity: complexity || "Medio"
  }));

  try {
    if (!isAIAvailable()) {
      return res.json(fallback);
    }

    const prompt = `Gere um simulado personalizado em portugues com exatamente ${amount} questoes.
Materias: ${chosen.join(", ")}.
Nivel: ${complexity || "Medio"}.
Estilo: ENEM, FUVEST e vestibulares brasileiros.
Cada questao deve ter 5 alternativas e somente uma correta.
Retorne somente JSON valido:
{
  "questions": [
    {
      "subject": "Matematica",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
      "correctIndex": 0,
      "explanation": "...",
      "origin": "ENEM Adaptada",
      "complexity": "${complexity || "Medio"}"
    }
  ]
}`;

    const text = await generateText(prompt, true, 0.5);
    return res.json(parseJsonOrFallback(text, fallback));
  } catch {
    return res.json(fallback);
  }
}
