import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// In-memory Database for persistence during the development session
const state = {
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
        badge: "ENEM 2025"
      },
      timeAgo: "4h atrás",
      content: "Mantendo a constância! 📚🔥 Foco total no ENEM 2025. Hoje o dia rendeu 4 horas líquidas de biologia humana e redação nota mil!",
      image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=800",
      category: "Motivação",
      likes: 128,
      hasLiked: false,
      comments: [
        { id: "c1", user: "mateus.foco", text: "Parabéns, Julia! Inspirador!" },
        { id: "c2", user: "vestibulando_25", text: "Bora pra cima! Constância pra vencer o cansaço." }
      ]
    },
    {
      id: "feed_2",
      user: {
        username: "pedro.matematica",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        badge: "MATEMÁTICA"
      },
      timeAgo: "3h atrás",
      content: "Alguém consegue me explicar essa questão? Não entendi onde errei no raciocínio. \n\n(ENEM) Considere a função f(x) = x² - 4x + 3. Qual é o valor de f(3) + f(1)?",
      category: "Dúvida",
      isExercise: true,
      exerciseData: {
        subject: "Matemática",
        equation: "f(x) = x^2 - 4x + 3. Valor de f(3) + f(1)?",
        options: ["2", "4", "6", "8", "0"],
        correctAnswer: "0" // f(3) = 9-12+3 = 0, f(1) = 1-4+3 = 0. f(3)+f(1) = 0.
      },
      likes: 45,
      hasLiked: false,
      comments: [
        { id: "c3", user: "clara_study", text: "Substitui o x pelos valores primeiro, f(3) dá 0 e f(1) dá 0" },
        { id: "c4", user: "prof_marcelo", text: "Excelente questão de álgebra básica! f(3) + f(1) = 0 + 0 = 0" }
      ]
    },
    {
      id: "feed_3",
      user: {
        username: "ana.redacao",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        badge: "REDAÇÃO"
      },
      timeAgo: "5h atrás",
      content: "Corrigi minha redação com a IA e evoluí muito! Alguém quer trocar redações para feedback?",
      category: "Redação",
      likes: 67,
      hasLiked: false,
      comments: [
        { id: "c5", user: "mari_estudos", text: "Eu topo! Qual o tema que você fez?" },
        { id: "c6", user: "vitor_vest", text: "Esse corretor de IA daqui é sensacional de verdade, me tirou da trava dos 700 pontos." }
      ]
    }
  ]
};

// Lazy initialization pattern for GoogleGenAI
let ai: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features might fail.");
    }
    ai = new GoogleGenAI({
      apiKey: key || "MOCK_KEY_IF_MISSING",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

const isAIAvailable = () => Boolean(process.env.GEMINI_API_KEY);

function buildExplainFallback(subject = "Vestibular", concept = "tema", userMessage = "") {
  const focus = userMessage || `Explique ${concept}`;
  return [
    `**Resumo direto sobre ${concept}**`,
    `Em ${subject}, comece identificando o conceito central da pergunta: ${focus}. Separe definicoes, formulas ou ideias-chave antes de tentar resolver.`,
    "",
    "**Como costuma cair**",
    "As bancas geralmente misturam interpretacao do enunciado com uma aplicacao simples. Grife dados numericos, conectivos como \"portanto\" e \"exceto\", e confira se a pergunta pede causa, consequencia ou calculo.",
    "",
    "**Exemplo pratico**",
    "1. Leia o comando da questao.",
    "2. Liste os dados importantes.",
    "3. Aplique a regra/conceito.",
    "4. Elimine alternativas incompatíveis.",
    "",
    "**Macete de bolso**",
    "Nao tente decorar tudo isolado: transforme cada topico em uma pergunta curta e resolva 3 exercicios logo depois da revisao."
  ].join("\n");
}

function buildSolveFallback(exerciseContext = "") {
  return [
    "**Analise inicial**",
    "Leia a questao procurando o comando principal e os dados que realmente serao usados.",
    "",
    "**Resolucao passo a passo**",
    `Questao recebida: ${exerciseContext}`,
    "1. Reescreva os dados em linguagem simples.",
    "2. Identifique a materia envolvida.",
    "3. Teste as alternativas ou aplique a formula indicada.",
    "4. Confira unidades, sinais e excecoes.",
    "",
    "**Gabarito**",
    "Sem a IA externa ativa, use este roteiro para chegar ao gabarito e compare com as alternativas.",
    "",
    "**Dica do Tutor**",
    "Quando travar, tente resolver primeiro um caso numerico simples. Isso costuma revelar a regra escondida no enunciado."
  ].join("\n");
}

function buildPracticeQuestions(subject = "Matematica", topic = "conteudo") {
  return {
    questions: [
      {
        subject,
        question: `(ENEM adaptada) Um estudante revisou ${topic} em ${subject} e precisa escolher a alternativa que melhor representa uma aplicacao correta do conteudo. Qual opcao apresenta o procedimento mais seguro?`,
        options: [
          "A) Ignorar os dados do enunciado e responder pela intuicao.",
          "B) Aplicar uma formula sem verificar se ela se encaixa no contexto.",
          "C) Identificar o conceito, organizar os dados e testar a alternativa compativel.",
          "D) Escolher sempre a alternativa com o maior numero.",
          "E) Desconsiderar unidades, sinais e restricoes do problema."
        ],
        correctIndex: 2,
        explanation: "A alternativa C descreve o metodo adequado: compreender o conceito, organizar os dados e conferir a compatibilidade com o enunciado.",
        origin: "ENEM Adaptada"
      },
      {
        subject,
        question: `Ao estudar ${topic}, qual atitude aumenta mais a retencao do conteudo para vestibulares?`,
        options: [
          "A) Fazer leitura passiva sem exercicios.",
          "B) Resolver questoes, corrigir erros e registrar os pontos de duvida.",
          "C) Estudar apenas assuntos que ja domina.",
          "D) Trocar revisoes por resumos cada vez maiores.",
          "E) Revisar somente na vespera da prova."
        ],
        correctIndex: 1,
        explanation: "Resolver, corrigir e registrar erros cria revisao ativa, que e mais eficiente para memorizar e aplicar o conteudo.",
        origin: "Vestibular IA"
      },
      {
        subject,
        question: `Em uma prova, uma questao sobre ${topic} traz um texto longo e varias informacoes. Qual e a primeira acao recomendada?`,
        options: [
          "A) Ler apenas as alternativas.",
          "B) Pular a questao automaticamente.",
          "C) Circular o verbo de comando e separar dados relevantes dos distratores.",
          "D) Copiar o texto inteiro no rascunho.",
          "E) Marcar a alternativa mais extensa."
        ],
        correctIndex: 2,
        explanation: "O verbo de comando revela o que a banca quer. Separar dados relevantes evita perder tempo com distratores.",
        origin: "Vestibular IA"
      }
    ]
  };
}

function buildStudyPlan(hoursPerDay = 4, focusSubjects: string[] = [], performance: Record<string, number> = {}) {
  const days = ["Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado", "Domingo"];
  const subjects = focusSubjects.length ? focusSubjects : Object.keys(performance).slice(0, 3);
  const weakSubjects = Object.entries(performance)
    .filter(([, value]) => value < 60)
    .sort((a, b) => a[1] - b[1])
    .map(([subject]) => subject);

  return {
    summary: weakSubjects.length
      ? `Seu plano prioriza ${weakSubjects.slice(0, 3).join(", ")} porque aparecem com aproveitamento abaixo de 60%. As demais materias entram como manutencao para preservar ritmo.`
      : "Seu desempenho esta equilibrado. O plano alterna conteudo novo, revisao ativa e questoes para manter constancia sem sobrecarregar.",
    weeklyPlan: days.map((day, index) => {
      const subject = weakSubjects[index % Math.max(weakSubjects.length, 1)] || subjects[index % Math.max(subjects.length, 1)] || "Redacao";
      return {
        day,
        activities: [
          {
            time: `${hoursPerDay}h`,
            subject,
            topic: index % 2 === 0 ? "Revisao ativa e lista de erros" : "Exercicios contextualizados",
            type: index % 2 === 0 ? "Revisao" : "Pratica",
            detail: `Estude em blocos de 50 minutos, corrija os erros e registre 3 pontos para revisar no dia seguinte.`,
            color: "bg-indigo-50 border-indigo-200 text-indigo-700"
          }
        ]
      };
    }),
    tips: [
      "Comece pelas materias com menor aproveitamento enquanto sua energia esta alta.",
      "Depois de cada bloco, escreva uma pergunta que voce ainda nao saberia responder sem consultar material.",
      "Reserve o domingo para revisar erros e ajustar o plano da proxima semana."
    ]
  };
}

function buildEssayCorrectionFallback(theme = "Tema livre", essayText = "") {
  const hasIntervention = /governo|estado|ministerio|escola|sociedade|campanha|politica|acao/i.test(essayText);
  const base = Math.min(900, Math.max(520, 560 + Math.floor(essayText.length / 18)));
  const c5 = hasIntervention ? 160 : 120;
  const totalScore = Math.min(1000, Math.round((base + c5) / 40) * 40);
  return {
    totalScore,
    comp1: { score: 160, feedback: "Texto compreensivel, com necessidade de revisar pontuacao, concordancia e escolhas vocabulares." },
    comp2: { score: 160, feedback: `O tema "${theme}" foi abordado. Fortaleca repertorio sociocultural e deixe a tese bem explicita na introducao.` },
    comp3: { score: 160, feedback: "Ha defesa de ponto de vista, mas os argumentos podem ganhar mais exemplos e relacao logica entre causa e consequencia." },
    comp4: { score: 140, feedback: "Use conectivos variados entre paragrafos para melhorar progressao textual e evitar repeticoes." },
    comp5: { score: c5, feedback: hasIntervention ? "A proposta de intervencao aparece no texto. Detalhe agente, acao, meio, efeito e finalidade." : "Inclua uma proposta de intervencao completa com agente, acao, meio, efeito e detalhamento." },
    generalFeedback: "Correcao local gerada sem IA externa. Use o resultado como triagem inicial e refine tese, repertorio, encadeamento e proposta de intervencao.",
    strengths: ["Estrutura suficiente para avaliacao inicial", "Tema identificavel no desenvolvimento"],
    weaknesses: ["Aprofundar repertorio e exemplos", "Revisar conectivos e proposta de intervencao"],
    corrections: [
      { original: "Trechos muito longos sem pausa", corrected: "Divida frases extensas e use pontuacao estrategica", why: "Melhora clareza e controle sintatico" }
    ]
  };
}

// AI API Endpoints

// 1. Health & Key Status
app.get("/api/health", (req, res) => {
  const isKeyAvailable = !!process.env.GEMINI_API_KEY;
  res.json({ status: "ok", aiEnabled: isKeyAvailable });
});

// 2. Personal AI Explainer Chat
app.post("/api/gemini/explain", async (req, res) => {
  try {
    const { subject, concept, userMessage } = req.body;
    if (!isAIAvailable()) {
      return res.json({ text: buildExplainFallback(subject, concept, userMessage) });
    }
    const client = getGemini();

    const promptMessage = `Você é o VestibularTutor, uma inteligência artificial especialista na preparação para o ENEM e outros vestibulares brasileiros de excelência (FUVEST, UNICAMP, UNESP, etc.).
Sua tarefa é explicar de maneira clara, pedagógica, motivadora e focada no vestibular o seguinte tema de ${subject}:
Tópico: ${concept}
Pergunta do aluno: ${userMessage || `Poderia me explicar o conceito de ${concept}?`}

Forneça sua resposta em formato estruturado em Português com:
1. **Explicação Conceitual**: Simplificada de forma direta e objetiva, com analogias se útil.
2. **Como cai no Vestibular**: Onde as bancas costumam armar pegadinhas ou formular essa teoria.
3. **Exemplo Prático**: Um exercício modelo resolvido passo a passo.
4. **Resumo/Macete de Bolso**: Regras fáceis ou mnemônicos para não esquecer na hora da prova.
5. **Recursos de Estudo Recomendados**: Sugira 2 a 3 sugestões de recursos de estudo com links reais ou de canais confiáveis para aprofundar o entendimento (como videoaulas do YouTube em canais renomados: Matemática Rio, Física Total, Descomplica, Professor Noslen, Jubilut, de acordo com o tema, ou links funcionais para buscas/artigos sobre o tema no YouTube/Brasil Escola/Khan Academy). Formate esses links em Markdown de forma bonita e visível.

Escreva de forma descontraída mas sem perder o rigor técnico. Use formatação Markdown elegante.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    const { subject, concept, userMessage } = req.body;
    res.json({ text: buildExplainFallback(subject, concept, userMessage) });
  }
});

// 3. Solve Exercise step-by-step
app.post("/api/gemini/solve", async (req, res) => {
  try {
    const { exerciseContext } = req.body;
    if (!isAIAvailable()) {
      return res.json({ text: buildSolveFallback(exerciseContext) });
    }
    const client = getGemini();

    const promptMessage = `Como um Tutor de Vestibular de alta qualidade, resolva de forma didática e didaticamente impecável a seguinte questão típica de vestibular:

Questão:
${exerciseContext}

Sua resposta em PORTUGUÊS deve ser estruturada em Markdown:
- **Análise Inicial**: Qual o conceito por trás da questão e os dados fornecidos.
- **Resolução Passo a Passo**: Detalhe cada conta, dedução ou interpretação.
- **Gabarito**: Destaque de forma inequívoca qual é a alternativa correta ou a conclusão final.
- **Dica do Tutor**: Dica astuta de como resolver essa questão mais rapidamente ou evitar erros bobos de atenção.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        temperature: 0.3,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error during solve:", error);
    res.json({ text: buildSolveFallback(req.body.exerciseContext) });
  }
});

// 4. Detailed ENEM Essay Corrector (Corretor de Redações)
app.post("/api/gemini/essay-correct", async (req, res) => {
  try {
    const { theme, essayText } = req.body;
    if (!essayText || essayText.trim().length < 50) {
      return res.status(400).json({ error: "Insira uma redação com justificativa mínima de caracteres." });
    }
    if (!isAIAvailable()) {
      return res.json(buildEssayCorrectionFallback(theme, essayText));
    }

    const client = getGemini();

    const promptMessage = `Você é um avaliador oficial da Redação do ENEM (Exame Nacional do Ensino Médio).
Sua missão é analisar de forma extremamente criteriosa, justa e corretiva a redação escrita pelo aluno.

Tema Proposto: ${theme || "Tema livre de relevância social brasileira"}
Redação do estudante:
---
${essayText}
---

Instruções fundamentais:
Avaliador, avalie estritamente com base nas 5 Competências do ENEM (cada uma variando em notas de 0, 40, 80, 120, 160, 200 pontos, totalizando 1000):
- **Competência 1**: Domínio da norma culta da escrita formal da Língua Portuguesa.
- **Competência 2**: Compreensão do tema, aplicação de repertório sociocultural produtivo e adequação ao modelo dissertativo-argumentativo.
- **Competência 3**: Seleção, relação, organização e interpretação de informações, fatos e argumentos em defesa de um ponto de vista.
- **Competência 4**: Demonstração de conhecimento dos mecanismos linguísticos de coesão (conectivos interparágrafos e intraparágrafos).
- **Competência 5**: Elaboração de proposta de intervenção para o problema abordado, detalhando Agente, Ação, Meio/Modo, Efeito e Detalhamento.

Por favor, responda estritamente no seguinte formato estruturado JSON para que possamos renderizar com precisão no sistema do aluno:

{
  "totalScore": 760,
  "comp1": { "score": 160, "feedback": "Domínio técnico bom, mas cometeu alguns desvios gramaticais pontuais e erros de regência." },
  "comp2": { "score": 160, "feedback": "Aplicou repertório de forma pertinente, contudo a tese poderia estar um pouco mais clara na introdução." },
  "comp3": { "score": 120, "feedback": "Argumentação consistente em partes, mas o projeto de texto falhou no encadeamento lógico do segundo parágrafo no desenvolvimento." },
  "comp4": { "score": 160, "feedback": "Bons conectivos, porém houve algumas repetições desnecessárias que prejudicam a fluidez do texto." },
  "comp5": { "score": 160, "feedback": "Apresentou proposta de intervenção com agente, ação, modo e efeito claro. Faltou detalhar um dos elementos a fundo." },
  "generalFeedback": "Um excelente texto com potencial claro de ascensão para os 900+ pontos. Foque principalmente em lapidar o seu projeto de texto e o repertório legitimado.",
  "strengths": [
    "Uso apropriado da estrutura dissertativo-argumentativa",
    "Apresentação de proposta de intervenção completa e exequível"
  ],
  "weaknesses": [
    "Repetição de conectivos correlatos ao longo do desenvolvimento",
    "Falta de aprofundamento crítico em pontos específicos"
  ],
  "corrections": [
    { "original": "Trecho incorreto do texto", "corrected": "Sugestão corrigida pela norma culta", "why": "Explicação gramatical curta" }
  ]
}

Deixe claro quais são os pontos exatos a corrigir. Exponha conselhos práticos de redação do ENEM. Garanta que o JSON retornado seja válido e bem formatado.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      }
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    res.json(parsedResponse);
  } catch (error: any) {
    console.error("Error during essay evaluation:", error);
    res.json(buildEssayCorrectionFallback(req.body.theme, req.body.essayText || ""));
  }
});

// 5. Generate Practice Quiz Questions
app.post("/api/gemini/generate-practice", async (req, res) => {
  try {
    const { subject, topic } = req.body;
    if (!isAIAvailable()) {
      return res.json(buildPracticeQuestions(subject, topic));
    }
    const client = getGemini();

    const promptMessage = `Gere uma lista de 3 exercícios inéditos ou similares a questões reais de vestibulares como ENEM e FUVEST sobre a matéria de ${subject}, especificamente o tema: ${topic}.
Cada questão deve conter 5 alternativas alternativas de forma típica (a, b, c, d, e).

Por favor, gere e responda de forma estrita de acordo com este esquema JSON:
{
  "questions": [
    {
      "question": "Enunciado longo e completo da questão similar ao ENEM sobre o tema em português...",
      "options": [
        "A) Opção 1",
        "B) Opção 2",
        "C) Opção 3",
        "D) Opção 4",
        "E) Opção 5"
      ],
      "correctIndex": 3,
      "explanation": "Explicação didática detalhada de porque a opção D é a correta...",
      "origin": "ENEM Adaptada"
    }
  ]
}

Tenha certeza de que apenas 1 opção é perfeitamente certa, o gabarito deve bater com o "correctIndex" (0 = A, 1 = B, 2 = C, 3 = D, 4 = E). O tom do enunciado deve ser o mesmo do ENEM, contextualizado com problemas do cotidiano ou textos de apoio curtos.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      }
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    res.json(parsedResponse);
  } catch (error: any) {
    console.error("Error generating practice:", error);
    res.json(buildPracticeQuestions(req.body.subject, req.body.topic));
  }
});

// 5.5. AI Adaptive Study Planner
app.post("/api/gemini/generate-plan", async (req, res) => {
  try {
    const { hoursPerDay, focusSubjects, performance } = req.body;
    if (!isAIAvailable()) {
      return res.json(buildStudyPlan(hoursPerDay, focusSubjects, performance));
    }
    const client = getGemini();

    const targetVestibular = state.user.target || "ENEM";
    const subjectsStr = Array.isArray(focusSubjects) ? focusSubjects.join(", ") : "Matérias gerais";

    const promptMessage = `Você é o VestibularTutor, uma inteligência artificial especialista em consultoria pedagógica e planejamento adaptativo de estudos para ingressar em vestibulares de alta concorrência (ENEM, FUVEST, UNICAMP, etc.).
O estudante está se preparando para o vestibular alvo: ${targetVestibular}.
Seu tempo disponível de estudos diários é de exatamente ${hoursPerDay} horas.
As disciplinas que ele deseja focar prioritariamente são: ${subjectsStr}.
Histórico de desempenho de aproveitamento dele por áreas (em porcentagem): 
${JSON.stringify(performance)}

Sua missão é gerar um CRONOGRAMA DE ESTUDOS SEMANAL OTIMIZADO ADAPTATIVO de Segunda a Domingo.
A IA deve:
1. Identificar as fraquezas do aluno e redefinir o foco nelas (por exemplo, matérias com rendimento abaixo de 60% devem receber sessões marcadas explicitamente como "[REVISÃO ATIVA]" e "[RESOLUÇÃO DE EXERCÍCIOS CONCENTRADA]").
2. Balancear as disciplinas fortes (acima de 60%) com novos conteúdos ("[APROFUNDAMENTO]" ou "[MATÉRIA NOVA]").
3. Alocar sessões diárias compatíveis com as ${hoursPerDay} horas recomendadas.
4. Distribuir revisões espaçadas de forma estratégica para maximizar a memorização retrospectiva.

Por favor, responda estritamente no formato estruturado JSON abaixo:
{
  "summary": "Um parágrafo de análise diagnóstica sobre o perfil do aluno, destacando as matérias críticas que precisam de atenção urgente e quais estão indo muito bem.",
  "weeklyPlan": [
    {
      "day": "Segunda-feira",
      "activities": [
        { "time": "2 horas", "subject": "Matemática", "topic": "Funções de 1º e 2º Grau", "type": "Revisão e Prática", "detail": "Foco nas fórmulas cruciais e resolução de 10 exercícios baseados na fraqueza identificada de 45% de rendimento.", "color": "bg-indigo-50 border-indigo-200 text-indigo-700" }
      ]
    }
  ],
  "tips": [
    "Dica de concentração e foco baseada no seu perfil",
    "Conselho sobre como fazer revisões espaçadas eficientes"
  ]
}

Garanta que toda a resposta seja um JSON inteiramente válido e bem formatado em português.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
      }
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    res.json(parsedResponse);
  } catch (error: any) {
    console.error("Error generating adaptive plan:", error);
    res.json(buildStudyPlan(req.body.hoursPerDay, req.body.focusSubjects, req.body.performance));
  }
});

// 5.6. Custom Mock Simulated Generator
app.post("/api/gemini/generate-custom-simulado", async (req, res) => {
  try {
    const { subjects, numQuestions, complexity } = req.body;
    if (!isAIAvailable()) {
      const chosen = Array.isArray(subjects) && subjects.length ? subjects : ["Matemática", "Português", "Biologia"];
      const fallback = buildPracticeQuestions(chosen[0], `${chosen.join(", ")} - ${complexity || "Médio"}`);
      fallback.questions = Array.from({ length: Number(numQuestions || 3) }, (_, index) => {
        const question = fallback.questions[index % fallback.questions.length];
        return { ...question, subject: chosen[index % chosen.length], complexity: complexity || "Médio" };
      });
      return res.json(fallback);
    }
    const client = getGemini();

    const subjectsStr = Array.isArray(subjects) ? subjects.join(", ") : "Matérias Gerais";

    const promptMessage = `Você é o Coordenador de Exames do Vestibulares.ai, encarregado de criar simulados personalizados, calibrados e focados para potencializar a nota de vestibular dos alunos.
Gere um Simulado Personalizado contendo exatamente ${numQuestions || 3} questões no estilo de vestibulares brasileiros (ENEM, FUVEST, UNICAMP) com as seguintes configurações:
- Disciplinas integradas: ${subjectsStr}
- Nível de complexidade: ${complexity || "Médio"}

Escreva enunciados ricos, problemas realistas do cotidiano, gráficos ou textos de apoio simulados (no estilo do ENEM). A dificuldade deve ser perfeitamente calibrada ao nível solicitado (${complexity}).
Cada uma das ${numQuestions || 3} questões deve conter 5 alternativas (A, B, C, D, E) com apenas 1 alternativa correta.

Por favor, responda estritamente no formato estruturado JSON abaixo:
{
  "questions": [
    {
      "subject": "Matemática",
      "question": "Enunciado detalhado e contextualizado da questão...",
      "options": [
        "A) Opção 1",
        "B) Opção 2",
        "C) Opção 3",
        "D) Opção 4",
        "E) Opção 5"
      ],
      "correctIndex": 2,
      "explanation": "Explicação pedagógica passo a passo de como solucionar e por que a alternativa correta é a indicada pelo correctIndex.",
      "origin": "ENEM Adaptada",
      "complexity": "${complexity || "Médio"}"
    }
  ]
}

Nota: O valor "correctIndex" deve ser o índice correspondente à resposta certa (0 para A, 1 para B, 2 para C, 3 para D, 4 para E). Garanta que a resposta seja um JSON inteiramente válido e estruturado em português.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      }
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    res.json(parsedResponse);
  } catch (error: any) {
    console.error("Error generating custom mock:", error);
    const chosen = Array.isArray(req.body.subjects) && req.body.subjects.length ? req.body.subjects : ["Matemática", "Português", "Biologia"];
    const fallback = buildPracticeQuestions(chosen[0], `${chosen.join(", ")} - ${req.body.complexity || "Médio"}`);
    fallback.questions = Array.from({ length: Number(req.body.numQuestions || 3) }, (_, index) => {
      const question = fallback.questions[index % fallback.questions.length];
      return { ...question, subject: chosen[index % chosen.length], complexity: req.body.complexity || "Médio" };
    });
    res.json(fallback);
  }
});


// State Data APIs (For frontend to load/modify persistent session state)

// Profile APIs
app.get("/api/user-profile", (req, res) => {
  res.json(state.user);
});

app.post("/api/user-profile", (req, res) => {
  const { name, target, targetDaysLeft, streakDays, onboardingCompleted, performance, reminder, performanceUpdate, incrementExercises, incrementChat, resetStats } = req.body;
  
  if (name) state.user.name = name;
  if (target) state.user.target = target;
  if (Number.isFinite(Number(targetDaysLeft))) state.user.targetDaysLeft = Number(targetDaysLeft);
  if (Number.isFinite(Number(streakDays))) state.user.streakDays = Number(streakDays);
  if (typeof onboardingCompleted === "boolean") state.user.onboardingCompleted = onboardingCompleted;
  if (performance && typeof performance === "object") {
    state.user.performance = performance;
  }
  if (resetStats) {
    state.user.stats = {
      hoursStudied: "0h 00min",
      exercisesSolved: 0,
      dailyGoalPercent: 0,
      aiChatsToday: 0
    };
    state.user.streakDays = 0;
    state.user.reminders = [];
  }
  
  if (reminder) {
    // Add new custom study reminder
    const newId = (state.user.reminders.length + 1).toString();
    state.user.reminders.unshift({
      id: newId,
      title: reminder.title,
      datetime: reminder.datetime,
      dateLabel: reminder.dateLabel || "Em breve",
      type: reminder.type || "compromisso"
    });
  }

  if (performanceUpdate) {
    state.user.performance = {
      ...state.user.performance,
      ...performanceUpdate
    };
  }

  if (incrementExercises) {
    state.user.stats.exercisesSolved += (incrementExercises === true ? 1 : Number(incrementExercises));
    // progress the daily goal percentage linearly
    state.user.stats.dailyGoalPercent = Math.min(100, state.user.stats.dailyGoalPercent + 5);
  }

  if (incrementChat) {
    state.user.stats.aiChatsToday += 1;
  }

  res.json(state.user);
});


// Feed / Forum APIs
app.get("/api/feed", (req, res) => {
  res.json(state.feed);
});

app.post("/api/feed", (req, res) => {
  const { content, category, hasExerciseBox, optA, optB, optC, optD, optE, correctOption } = req.body;
  
  const newPostId = "feed_" + (state.feed.length + 1);
  
  const newPost: any = {
    id: newPostId,
    user: {
      username: `${state.user.name.toLowerCase().replace(/\s/g, "")}_studa`,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", // user avatar
      badge: state.user.target
    },
    timeAgo: "Agora mesmo",
    content: content,
    category: category || "Geral",
    likes: 0,
    hasLiked: false,
    comments: []
  };

  if (hasExerciseBox && optA && optB) {
    newPost.isExercise = true;
    newPost.exerciseData = {
      subject: category || "Matemática",
      equation: content,
      options: [optA, optB, optC || "C", optD || "D", optE || "E"].filter(Boolean),
      correctAnswer: correctOption || "A"
    };
  }

  state.feed.unshift(newPost);
  res.json(state.feed);
});

app.post("/api/feed/:id/like", (req, res) => {
  const { id } = req.params;
  const post = state.feed.find(p => p.id === id);
  if (post) {
    post.hasLiked = !post.hasLiked;
    post.likes += post.hasLiked ? 1 : -1;
    return res.json(post);
  }
  res.status(404).json({ error: "Post não encontrado" });
});

app.post("/api/feed/:id/comment", (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const post = state.feed.find(p => p.id === id);
  if (post && text) {
    const newComment = {
      id: "comment_" + Date.now(),
      user: `${state.user.name.toLowerCase().replace(/\s/g, "")}.foco`,
      text: text
    };
    post.comments.push(newComment);
    return res.json(post);
  }
  res.status(404).json({ error: "Post ou conteúdo não encontrado" });
});


// Dev environment Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production statics serve
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
