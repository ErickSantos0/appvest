import { PracticeQuestion } from "../types";

const TOPICS_BY_SUBJECT: Record<string, string[]> = {
  "Matematica": ["porcentagem", "funcao do 1 grau", "geometria plana"],
  "MatemÃ¡tica": ["porcentagem", "funcao do 1 grau", "geometria plana"],
  "Portugues": ["interpretacao de texto", "coesao textual", "figuras de linguagem"],
  "PortuguÃªs": ["interpretacao de texto", "coesao textual", "figuras de linguagem"],
  "Fisica": ["energia mecanica", "eletricidade", "cinematica"],
  "FÃ­sica": ["energia mecanica", "eletricidade", "cinematica"],
  "Quimica": ["estequiometria", "ligacoes quimicas", "solucoes"],
  "QuÃ­mica": ["estequiometria", "ligacoes quimicas", "solucoes"],
  "Biologia": ["ecologia", "genetica", "fisiologia humana"],
  "Historia": ["Brasil Colonia", "Era Vargas", "Guerra Fria"],
  "HistÃ³ria": ["Brasil Colonia", "Era Vargas", "Guerra Fria"]
};

const OPTION_PREFIXES = ["A)", "B)", "C)", "D)", "E)"];
const CORRECT_INDEX_SEQUENCE = [0, 3, 1, 4, 2];

function stripOptionPrefix(option: string) {
  return option.replace(/^[A-E]\)\s*/i, "");
}

function distributeCorrectOption(
  options: string[],
  correctIndex: number,
  questionIndex: number
) {
  const targetIndex = CORRECT_INDEX_SEQUENCE[questionIndex % CORRECT_INDEX_SEQUENCE.length];
  const entries = options.map((text, optionIndex) => ({
    text,
    isCorrect: optionIndex === correctIndex
  }));
  const correctEntry = entries.find(entry => entry.isCorrect) || entries[correctIndex] || entries[0];
  const wrongEntries = entries.filter(entry => entry !== correctEntry);
  const nextEntries = [];
  let wrongIndex = 0;

  for (let optionIndex = 0; optionIndex < entries.length; optionIndex += 1) {
    nextEntries[optionIndex] = optionIndex === targetIndex
      ? correctEntry
      : wrongEntries[wrongIndex++];
  }

  return {
    options: nextEntries.map((entry, optionIndex) => `${OPTION_PREFIXES[optionIndex]} ${stripOptionPrefix(entry.text)}`),
    correctIndex: targetIndex
  };
}

export function buildLocalSimulado(
  subjects: string[],
  numQuestions: number,
  complexity: string
): PracticeQuestion[] {
  const safeSubjects = subjects.length ? subjects : ["Matematica", "Portugues", "Biologia"];

  return Array.from({ length: numQuestions }, (_, index) => {
    const subject = safeSubjects[index % safeSubjects.length];
    const topics = TOPICS_BY_SUBJECT[subject] || ["conteudo essencial"];
    const topic = topics[index % topics.length];
    const distributed = distributeCorrectOption(
      [
        "A) Escolher a alternativa mais longa sem analisar o enunciado.",
        "B) Decorar uma frase pronta e aplicar em qualquer contexto.",
        "C) Identificar o comando da questao, separar os dados relevantes e aplicar o conceito estudado.",
        "D) Ignorar palavras como exceto, correto e incorreto.",
        "E) Resolver apenas mentalmente, sem conferir unidades ou relacoes."
      ],
      2,
      index
    );

    return {
      subject,
      complexity,
      exam: "Modelo de treino",
      year: "adaptado",
      sourceUrl: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos",
      isRealQuestion: false,
      adaptedFrom: "Estilo ENEM e vestibulares anteriores",
      origin: "Questao autoral adaptada",
      correctIndex: distributed.correctIndex,
      question: `(ENEM adaptada) Em uma rotina de preparacao para vestibular, o aluno revisou ${topic} em ${subject}. Qual estrategia e mais adequada para resolver uma questao de nivel ${complexity} sobre esse conteudo?`,
      options: distributed.options,
      explanation:
        "A alternativa correta e a mais segura porque combina leitura ativa, organizacao dos dados e aplicacao do conceito. Em vestibulares, boa parte dos erros nasce de interpretar mal o comando da questao."
    };
  });
}
