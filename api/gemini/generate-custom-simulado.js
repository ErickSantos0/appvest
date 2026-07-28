import { generateText, getBody, isAIAvailable, methodNotAllowed, parseJsonOrFallback } from "../_shared.js";

const DEFAULT_SUBJECTS = [
  "Matemática",
  "Português",
  "Redação",
  "Literatura",
  "Física",
  "Química",
  "Biologia",
  "História",
  "Geografia",
  "Filosofia",
  "Sociologia",
  "Inglês",
  "Espanhol",
  "Artes",
  "Educação Física"
];

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const { subjects, numQuestions, complexity, debug } = getBody(req);
  const chosen = Array.isArray(subjects) && subjects.length ? subjects : DEFAULT_SUBJECTS;
  const allowedAmounts = [10, 25, 40];
  const requestedAmount = Number(numQuestions || 10);
  const amount = allowedAmounts.includes(requestedAmount) ? requestedAmount : 10;
  const emptyRealQuestionsResponse = {
    questions: [],
    error: "Nao foi possivel localizar questoes reais verificadas em provas anteriores para montar este simulado agora. Tente novamente em alguns instantes ou escolha menos materias."
  };

  const prompt = `Gere um simulado personalizado em portugues com exatamente ${amount} questoes.
Materias: ${chosen.join(", ")}.
Nivel: ${complexity || "Medio"}.

Regra obrigatoria:
- Use SOMENTE questoes de provas reais que ja aconteceram, como ENEM, FUVEST, UNICAMP, UNESP/VUNESP e outros vestibulares brasileiros.
- Nao crie questoes autorais, nao adapte enunciados e nao invente alternativas.
- Para cada questao, informe banca/exame, data de aplicacao quando existir, ano e fonte oficial ou pagina de acervo.
- Use preferencialmente estes acervos oficiais:
  - ENEM/INEP: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos
  - FUVEST: https://www.fuvest.br/acervo-vestibular/
  - UNESP/VUNESP: https://www.vunesp.com.br/
  - UNICAMP/COMVEST: https://www.comvest.unicamp.br/vestibulares-anteriores/
- Nao invente ano, banca, data, fonte, enunciado ou gabarito.
- Se nao encontrar questoes reais verificadas suficientes, retorne "questions": [] e preencha "error" explicando que nao foi possivel localizar questoes reais verificadas.
- Todas as questoes retornadas devem ter isRealQuestion como true.
- Cada questao deve ter 5 alternativas e somente uma correta.
- Busque variedade de gabarito entre A, B, C, D e E escolhendo questoes reais diferentes, mas nao altere a ordem original das alternativas da prova.
- A explicacao deve ensinar o raciocinio e citar por que a alternativa correta vence as demais.

Retorne somente JSON valido no formato:
{"questions":[{"subject":"Matemática","exam":"ENEM","year":2023,"appliedDate":"05/11/2023","sourceUrl":"https://...","isRealQuestion":true,"question":"...","options":["A) ...","B) ...","C) ...","D) ...","E) ..."],"correctIndex":0,"explanation":"...","origin":"ENEM 2023 - 05/11/2023","complexity":"${complexity || "Medio"}"}],"error":""}`;

  const normalizeResponse = (payload) => {
    const sourceQuestions = Array.isArray(payload?.questions) ? payload.questions : [];
    const realQuestions = sourceQuestions.filter(question =>
      question?.isRealQuestion === true &&
      question?.exam &&
      question?.year &&
      question?.sourceUrl &&
      Array.isArray(question?.options) &&
      question.options.length === 5 &&
      Number.isInteger(Number(question.correctIndex)) &&
      Number(question.correctIndex) >= 0 &&
      Number(question.correctIndex) <= 4
    );

    return {
      ...(payload && typeof payload === "object" ? payload : {}),
      questions: realQuestions.slice(0, amount),
      error: realQuestions.length
        ? payload?.error || ""
        : emptyRealQuestionsResponse.error
    };
  };

  try {
    if (!isAIAvailable()) {
      return res.status(200).json(emptyRealQuestionsResponse);
    }

    const text = await generateText(prompt, true, 0.5, true);
    return res.status(200).json(normalizeResponse(parseJsonOrFallback(text, emptyRealQuestionsResponse)));
  } catch (searchError) {
    try {
      const text = await generateText(prompt, true, 0.5, false);
      const data = normalizeResponse(parseJsonOrFallback(text, emptyRealQuestionsResponse));
      if (debug) data.debug = { groundedSearchError: searchError.message, fallbackUsed: false };
      return res.status(200).json(data);
    } catch (plainError) {
      if (debug) {
        emptyRealQuestionsResponse.debug = {
          groundedSearchError: searchError.message,
          plainGeminiError: plainError.message,
          fallbackUsed: false
        };
      }
      return res.status(200).json(emptyRealQuestionsResponse);
    }
  }
}
