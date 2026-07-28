const MODEL = "gemini-3.5-flash";

function createInitialState() {
  return {
    user: {
      name: "Aluno",
      target: "Defina seu vestibular",
      targetDaysLeft: 0,
      streakDays: 0,
      onboardingCompleted: false,
      stats: {
        hoursStudied: "0h 00min",
        exercisesSolved: 0,
        dailyGoalPercent: 0,
        aiChatsToday: 0
      },
      reminders: [],
      performance: {
        "Matemática": 0,
        "Português": 0,
        "Redação": 0,
        "Literatura": 0,
        "Física": 0,
        "Química": 0,
        "Biologia": 0,
        "História": 0,
        "Geografia": 0,
        "Filosofia": 0,
        "Sociologia": 0,
        "Inglês": 0,
        "Espanhol": 0,
        "Artes": 0,
        "Educação Física": 0
      }
    },
    feed: [
      {
        id: "feed_1",
        user: {
          username: "julia_studa",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
          badge: "ENEM"
        },
        timeAgo: "4h atras",
        content: "Mantendo a constancia nos estudos. Hoje rendeu biologia, redacao e revisao dos erros.",
        image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=800",
        category: "Motivacao",
        likes: 128,
        hasLiked: false,
        comments: [{ id: "c1", user: "mateus.foco", text: "Parabens! Constancia e tudo." }]
      },
      {
        id: "feed_2",
        user: {
          username: "pedro.matematica",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
          badge: "MATEMATICA"
        },
        timeAgo: "3h atras",
        content: "(ENEM) Considere f(x) = x^2 - 4x + 3. Qual e o valor de f(3) + f(1)?",
        category: "Duvida",
        isExercise: true,
        exerciseData: {
          subject: "Matematica",
          equation: "f(x) = x^2 - 4x + 3. Valor de f(3) + f(1)?",
          options: ["2", "4", "6", "8", "0"],
          correctAnswer: "0"
        },
        likes: 45,
        hasLiked: false,
        comments: [{ id: "c2", user: "clara_study", text: "Substitui os valores: f(3)=0 e f(1)=0." }]
      }
    ]
  };
}

export const state = globalThis.__APPVEST_STATE__ || createInitialState();
globalThis.__APPVEST_STATE__ = state;

export function methodNotAllowed(res) {
  return res.status(405).json({ error: "Metodo nao permitido" });
}

export function getBody(req) {
  return typeof req.body === "object" && req.body ? req.body : {};
}

export function isAIAvailable() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateText(prompt, json = false, temperature = 0.5, useGoogleSearch = false) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            ...(json ? { responseMimeType: "application/json" } : {})
          },
          ...(useGoogleSearch ? { tools: [{ google_search: {} }] } : {})
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "";
    }

    const errorText = await response.text().catch(() => "");
    lastError = new Error(`Gemini API failed with ${response.status}: ${errorText.slice(0, 500)}`);

    if (response.status !== 503 || attempt === 2) {
      throw lastError;
    }

    await wait(800 * (attempt + 1));
  }

  throw lastError || new Error("Gemini API failed");
}

export function parseJsonOrFallback(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } catch {
        return fallback;
      }
    }

    return fallback;
  }
}

const OPTION_PREFIXES = ["A)", "B)", "C)", "D)", "E)"];
const CORRECT_INDEX_SEQUENCE = [0, 3, 1, 4, 2];

function stripOptionPrefix(option) {
  return String(option).replace(/^[A-E]\)\s*/i, "");
}

function relabelOptions(options) {
  return options.map((option, index) => `${OPTION_PREFIXES[index]} ${stripOptionPrefix(option)}`);
}

export function distributeCorrectOption(question, index) {
  if (!Array.isArray(question.options) || question.options.length !== 5) {
    return question;
  }

  const targetIndex = CORRECT_INDEX_SEQUENCE[index % CORRECT_INDEX_SEQUENCE.length];
  const entries = question.options.map((text, optionIndex) => ({
    text,
    isCorrect: optionIndex === question.correctIndex
  }));
  const correctEntry = entries.find(entry => entry.isCorrect) || entries[question.correctIndex] || entries[0];
  const wrongEntries = entries.filter(entry => entry !== correctEntry);
  const nextEntries = [];
  let wrongIndex = 0;

  for (let optionIndex = 0; optionIndex < entries.length; optionIndex += 1) {
    nextEntries[optionIndex] = optionIndex === targetIndex
      ? correctEntry
      : wrongEntries[wrongIndex++];
  }

  return {
    ...question,
    options: relabelOptions(nextEntries.map(entry => entry.text)),
    correctIndex: targetIndex
  };
}

export function updateUser(body) {
  const user = state.user;

  if (body.name) user.name = String(body.name);
  if (body.target) user.target = String(body.target);
  if (Number.isFinite(Number(body.targetDaysLeft))) user.targetDaysLeft = Number(body.targetDaysLeft);
  if (Number.isFinite(Number(body.streakDays))) user.streakDays = Number(body.streakDays);
  if (typeof body.onboardingCompleted === "boolean") user.onboardingCompleted = body.onboardingCompleted;
  if (body.performance && typeof body.performance === "object") user.performance = body.performance;

  if (body.resetStats) {
    user.stats = {
      hoursStudied: "0h 00min",
      exercisesSolved: 0,
      dailyGoalPercent: 0,
      aiChatsToday: 0
    };
    user.streakDays = 0;
    user.reminders = [];
  }

  if (body.reminder) {
    user.reminders.unshift({
      id: `reminder_${Date.now()}`,
      title: body.reminder.title,
      datetime: body.reminder.datetime,
      dateLabel: body.reminder.dateLabel || "Em breve",
      type: body.reminder.type || "compromisso"
    });
  }

  if (body.performanceUpdate) {
    user.performance = {
      ...user.performance,
      ...body.performanceUpdate
    };
  }

  if (body.incrementExercises) {
    user.stats.exercisesSolved += body.incrementExercises === true ? 1 : Number(body.incrementExercises);
    user.stats.dailyGoalPercent = Math.min(100, user.stats.dailyGoalPercent + 5);
  }

  if (body.incrementChat) {
    user.stats.aiChatsToday += 1;
  }

  return user;
}

export function buildExplainFallback(subject = "Vestibular", concept = "tema", userMessage = "") {
  const focus = userMessage || `Explique ${concept}`;
  return [
    `**Resumo direto sobre ${concept}**`,
    `Em ${subject}, comece identificando a ideia central: ${focus}. Separe definicoes, formulas e palavras-chave antes de resolver.`,
    "",
    "**Como costuma cair**",
    "As bancas misturam interpretacao do enunciado com aplicacao do conteudo. Grife dados, comandos como \"explique\" ou \"calcule\" e confira excecoes.",
    "",
    "**Exemplo pratico**",
    "1. Leia o comando.",
    "2. Liste os dados importantes.",
    "3. Aplique o conceito.",
    "4. Elimine alternativas incompativeis.",
    "",
    "**Macete de bolso**",
    "Transforme cada topico em uma pergunta curta e resolva exercicios logo depois da revisao."
  ].join("\n");
}

export function buildSolveFallback(exerciseContext = "") {
  return [
    "**Analise inicial**",
    "Leia a questao procurando o comando principal e os dados que realmente serao usados.",
    "",
    "**Resolucao passo a passo**",
    `Questao recebida: ${exerciseContext}`,
    "1. Reescreva os dados em linguagem simples.",
    "2. Identifique a materia envolvida.",
    "3. Teste alternativas ou aplique a formula adequada.",
    "4. Confira unidades, sinais e excecoes.",
    "",
    "**Gabarito**",
    "Use o roteiro acima para chegar ao gabarito e compare com as alternativas.",
    "",
    "**Dica do Tutor**",
    "Quando travar, resolva um caso numerico simples para revelar a regra escondida."
  ].join("\n");
}

export function buildPracticeQuestions(subject = "Matematica", topic = "conteudo") {
  const baseQuestions = [
      {
        subject,
        question: `(ENEM adaptada) Ao estudar ${topic} em ${subject}, qual procedimento ajuda mais a acertar uma questao contextualizada?`,
        options: [
          "A) Responder por intuicao.",
          "B) Aplicar uma formula sem ler o contexto.",
          "C) Identificar o conceito, organizar os dados e conferir as alternativas.",
          "D) Marcar sempre a alternativa mais longa.",
          "E) Ignorar unidades e restricoes."
        ],
        correctIndex: 2,
        explanation: "A alternativa correta mostra o metodo mais seguro para vestibulares: conceito, dados e verificacao.",
        origin: "Questao autoral adaptada",
        exam: "Modelo de treino",
        year: "adaptado",
        sourceUrl: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos",
        isRealQuestion: false,
        adaptedFrom: "Estilo ENEM e vestibulares anteriores"
      },
      {
        subject,
        question: `Depois de revisar ${topic}, qual pratica melhora mais a retencao?`,
        options: [
          "A) Ler passivamente.",
          "B) Resolver questoes, corrigir erros e registrar duvidas.",
          "C) Estudar apenas assuntos faceis.",
          "D) Fazer resumos cada vez maiores.",
          "E) Revisar somente na vespera."
        ],
        correctIndex: 1,
        explanation: "Pratica ativa com correcao de erros consolida o conteudo e mostra lacunas reais.",
        origin: "Questao autoral adaptada",
        exam: "Modelo de treino",
        year: "adaptado",
        sourceUrl: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos",
        isRealQuestion: false,
        adaptedFrom: "Estilo ENEM e vestibulares anteriores"
      },
      {
        subject,
        question: `Em uma questao longa sobre ${topic}, qual deve ser a primeira acao?`,
        options: [
          "A) Ler apenas as alternativas.",
          "B) Pular automaticamente.",
          "C) Circular o verbo de comando e separar dados relevantes.",
          "D) Copiar o texto inteiro.",
          "E) Marcar a opcao com mais numeros."
        ],
        correctIndex: 2,
        explanation: "O verbo de comando revela o que a banca pede e evita perda de tempo com distratores.",
        origin: "Questao autoral adaptada",
        exam: "Modelo de treino",
        year: "adaptado",
        sourceUrl: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos",
        isRealQuestion: false,
        adaptedFrom: "Estilo ENEM e vestibulares anteriores"
      },
      {
        subject,
        question: `Durante uma prova sobre ${topic}, o aluno percebe que duas alternativas parecem parecidas. Qual criterio ajuda mais a decidir?`,
        options: [
          "A) Marcar a alternativa com mais palavras tecnicas.",
          "B) Escolher a opcao que repete uma palavra do enunciado.",
          "C) Ignorar o texto de apoio e usar memoria solta.",
          "D) Comparar cada alternativa com o comando da questao e eliminar exageros ou contradicoes.",
          "E) Responder pela primeira impressao."
        ],
        correctIndex: 3,
        explanation: "Comparar alternativas com o comando reduz pegadinhas, exageros e contradicoes comuns em vestibulares.",
        origin: "Questao autoral adaptada",
        exam: "Modelo de treino",
        year: "adaptado",
        sourceUrl: "https://www.fuvest.br/acervo-vestibular/",
        isRealQuestion: false,
        adaptedFrom: "Estilo FUVEST e vestibulares anteriores"
      },
      {
        subject,
        question: `Para consolidar ${topic} depois de um erro no simulado, qual acao transforma melhor o erro em aprendizado?`,
        options: [
          "A) Apagar a questao errada para nao rever.",
          "B) Refazer apenas a alternativa correta.",
          "C) Copiar o gabarito sem entender.",
          "D) Trocar imediatamente de materia.",
          "E) Registrar o motivo do erro, revisar o conceito e resolver uma questao parecida."
        ],
        correctIndex: 4,
        explanation: "O ciclo erro, revisao e nova pratica ajuda o aluno a corrigir a causa do erro, nao apenas memorizar o gabarito.",
        origin: "Questao autoral adaptada",
        exam: "Modelo de treino",
        year: "adaptado",
        sourceUrl: "https://www.comvest.unicamp.br/vestibulares-anteriores/",
        isRealQuestion: false,
        adaptedFrom: "Estilo UNICAMP e vestibulares anteriores"
      }
  ];

  return {
    questions: baseQuestions.map(distributeCorrectOption)
  };
}

export function buildStudyPlan(hoursPerDay = 4, focusSubjects = [], performance = {}) {
  const days = ["Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado", "Domingo"];
  const subjects = focusSubjects.length ? focusSubjects : Object.keys(performance);
  const usableSubjects = subjects.length ? subjects : ["Redacao"];
  const weakSubjects = Object.entries(performance)
    .filter(([subject]) => usableSubjects.includes(subject))
    .sort((a, b) => a[1] - b[1])
    .map(([subject]) => subject);
  const ordered = weakSubjects.length ? weakSubjects : usableSubjects;

  return {
    summary: "Plano inicial criado para aluno com progresso partindo de 0%. O foco e diagnostico, rotina diaria, revisao ativa e exercicios para atualizar o aproveitamento ao longo do uso.",
    weeklyPlan: days.map((day, index) => {
      const subject = ordered[index % ordered.length];
      return {
        day,
        activities: [
          {
            time: `${hoursPerDay}h`,
            subject,
            topic: index % 2 === 0 ? "Teoria + resumo ativo" : "Questoes + mapa de erros",
            type: index % 2 === 0 ? "Aula + Revisao" : "Pratica",
            detail: "Estude em blocos de 50 minutos, corrija os erros e registre 3 pontos para revisar no dia seguinte.",
            color: index % 2 === 0
              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }
        ]
      };
    }),
    tips: [
      "Comece pelas materias com 0% para criar um diagnostico real.",
      "Depois de cada bloco, anote o erro principal.",
      "Use simulados curtos toda semana para atualizar o percentual."
    ]
  };
}

export function buildEssayCorrectionFallback(theme = "Tema livre", essayText = "") {
  const hasIntervention = /governo|estado|ministerio|escola|sociedade|campanha|politica|acao/i.test(essayText);
  const totalScore = Math.min(1000, Math.max(520, 560 + Math.floor(essayText.length / 18)));

  return {
    totalScore: Math.round(totalScore / 40) * 40,
    comp1: { score: 160, feedback: "Texto compreensivel. Revise pontuacao, concordancia e escolhas vocabulares." },
    comp2: { score: 160, feedback: `O tema "${theme}" foi abordado. Fortaleca repertorio e deixe a tese explicita.` },
    comp3: { score: 160, feedback: "Os argumentos existem, mas podem ganhar exemplos e relacao logica mais clara." },
    comp4: { score: 140, feedback: "Use conectivos variados para melhorar a progressao textual." },
    comp5: { score: hasIntervention ? 160 : 120, feedback: hasIntervention ? "A proposta aparece. Detalhe agente, acao, meio, efeito e finalidade." : "Inclua proposta de intervencao completa." },
    generalFeedback: "Correcao local gerada como apoio inicial. Refine tese, repertorio, encadeamento e intervencao.",
    strengths: ["Estrutura adequada para avaliacao inicial", "Tema identificavel"],
    weaknesses: ["Aprofundar exemplos", "Melhorar conectivos e proposta"],
    corrections: [
      { original: "Frases muito longas", corrected: "Divida periodos extensos", why: "Melhora clareza e controle sintatico" }
    ]
  };
}
