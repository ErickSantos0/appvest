import { buildPracticeQuestions, generateText, getBody, isAIAvailable, methodNotAllowed, parseJsonOrFallback } from "../_shared.js";

export default async function handler(req, res) {
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
      return res.status(200).json(fallback);
    }

    const prompt = `Gere um simulado personalizado em portugues com exatamente ${amount} questoes.
Materias: ${chosen.join(", ")}.
Nivel: ${complexity || "Medio"}.

Regra principal:
- Priorize questoes de provas reais que ja aconteceram, como ENEM, FUVEST, UNICAMP, UNESP/VUNESP e outros vestibulares brasileiros.
- Para cada questao real, informe banca/exame, ano e fonte oficial ou pagina de acervo.
- Use preferencialmente estes acervos oficiais:
  - ENEM/INEP: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos
  - FUVEST: https://www.fuvest.br/acervo-vestibular/
  - UNESP/VUNESP: https://www.vunesp.com.br/
  - UNICAMP/COMVEST: https://www.comvest.unicamp.br/vestibulares-anteriores/
- Nao invente ano, banca ou origem. Se nao tiver certeza de que a questao e real, crie uma questao autoral parecida com o estilo da banca e marque isRealQuestion como false.
- Quando for questao real, marque isRealQuestion como true.
- Cada questao deve ter 5 alternativas e somente uma correta.
- A explicacao deve ensinar o raciocinio e citar por que a alternativa correta vence as demais.

Retorne somente JSON valido no formato:
{"questions":[{"subject":"Matematica","exam":"ENEM","year":2023,"sourceUrl":"https://...","isRealQuestion":true,"adaptedFrom":"","question":"...","options":["A) ...","B) ...","C) ...","D) ...","E) ..."],"correctIndex":0,"explanation":"...","origin":"ENEM 2023","complexity":"${complexity || "Medio"}"}]}`;

    const text = await generateText(prompt, true, 0.5);
    return res.status(200).json(parseJsonOrFallback(text, fallback));
  } catch {
    return res.status(200).json(fallback);
  }
}
