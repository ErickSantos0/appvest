import { ApiRequest, VercelResponse, buildStudyPlan, generateText, getBody, isAIAvailable, methodNotAllowed, parseJsonOrFallback, state } from "../_shared";

export default async function handler(req: ApiRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const { hoursPerDay, focusSubjects, performance } = getBody(req);
  const safeHours = Number(hoursPerDay || 4);
  const safeSubjects = Array.isArray(focusSubjects) ? focusSubjects : [];
  const safePerformance = performance && typeof performance === "object" ? performance : {};
  const fallback = buildStudyPlan(safeHours, safeSubjects, safePerformance);

  try {
    if (!isAIAvailable()) {
      return res.json(fallback);
    }

    const prompt = `Voce e uma IA de planejamento de estudos para vestibulares brasileiros.
Crie um cronograma semanal adaptativo de segunda a domingo.
O aluno estuda ${safeHours} horas por dia.
Vestibular alvo: ${state.user.target || "ENEM"}.
Materias prioritarias: ${safeSubjects.join(", ") || "materias escolhidas pelo aluno"}.
Desempenho atual em porcentagem: ${JSON.stringify(safePerformance)}.

Como o cadastro do aluno comeca em 0%, trate 0% como inicio diagnostico, nao como fracasso.
Retorne somente JSON valido:
{
  "summary": "...",
  "weeklyPlan": [
    {
      "day": "Segunda-feira",
      "activities": [
        {
          "time": "2h",
          "subject": "Matematica",
          "topic": "Funcoes",
          "type": "Aula + Revisao",
          "detail": "...",
          "color": "bg-indigo-50 border-indigo-200 text-indigo-700"
        }
      ]
    }
  ],
  "tips": ["...", "..."]
}`;

    const text = await generateText(prompt, true, 0.6);
    return res.json(parseJsonOrFallback(text, fallback));
  } catch {
    return res.json(fallback);
  }
}
