import { buildStudyPlan, generateText, getBody, isAIAvailable, methodNotAllowed, parseJsonOrFallback, state } from "../_shared.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const { hoursPerDay, focusSubjects, performance } = getBody(req);
  const safeHours = Number(hoursPerDay || 4);
  const safeSubjects = Array.isArray(focusSubjects) ? focusSubjects : [];
  const safePerformance = performance && typeof performance === "object" ? performance : {};
  const fallback = buildStudyPlan(safeHours, safeSubjects, safePerformance);

  try {
    if (!isAIAvailable()) {
      return res.status(200).json(fallback);
    }

    const prompt = `Voce e uma IA de planejamento de estudos para vestibulares brasileiros.
Crie um cronograma semanal adaptativo de segunda a domingo.
O aluno estuda ${safeHours} horas por dia.
Vestibular alvo: ${state.user.target || "ENEM"}.
Materias prioritarias: ${safeSubjects.join(", ") || "materias escolhidas pelo aluno"}.
Desempenho atual em porcentagem: ${JSON.stringify(safePerformance)}.
Como o cadastro do aluno comeca em 0%, trate 0% como inicio diagnostico, nao como fracasso.
Retorne somente JSON valido com summary, weeklyPlan e tips.`;

    const text = await generateText(prompt, true, 0.6);
    return res.status(200).json(parseJsonOrFallback(text, fallback));
  } catch {
    return res.status(200).json(fallback);
  }
}
