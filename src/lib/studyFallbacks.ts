export interface PlanActivity {
  time: string;
  subject: string;
  topic: string;
  type: string;
  detail: string;
  color?: string;
}

export interface WeeklyDayPlan {
  day: string;
  activities: PlanActivity[];
}

export interface GeneratedPlan {
  summary: string;
  weeklyPlan: WeeklyDayPlan[];
  tips: string[];
}

const DAYS = [
  "Segunda-feira",
  "Terca-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sabado",
  "Domingo"
];

const TOPICS_BY_SUBJECT: Record<string, string[]> = {
  "Matemática": ["Funcoes e graficos", "Porcentagem e razao", "Geometria e medidas"],
  "Português": ["Interpretacao de texto", "Coesao e coerencia", "Literatura brasileira"],
  "Física": ["Cinematica", "Eletrodinamica", "Energia e trabalho"],
  "Química": ["Estequiometria", "Ligacoes quimicas", "Quimica organica"],
  "Biologia": ["Ecologia", "Genetica", "Fisiologia humana"],
  "História": ["Brasil Colonia", "Era Vargas", "Guerra Fria"],
  "Geografia": ["Cartografia", "Climatologia", "Geopolitica"],
  "Redação": ["Tese e repertorio", "Desenvolvimento", "Proposta de intervencao"]
};

export function buildLocalStudyPlan(
  hoursPerDay: number,
  focusSubjects: string[],
  performance: Record<string, number>
): GeneratedPlan {
  const availableSubjects = focusSubjects.length > 0 ? focusSubjects : Object.keys(performance);
  const subjects = availableSubjects.length > 0 ? availableSubjects : ["Redação"];
  const weakSubjects = Object.entries(performance)
    .filter(([subject]) => subjects.includes(subject))
    .sort((a, b) => a[1] - b[1])
    .map(([subject]) => subject);

  const orderedSubjects = weakSubjects.length > 0 ? weakSubjects : subjects;

  return {
    summary:
      "Plano gerado automaticamente para manter o aluno estudando mesmo sem resposta da IA externa. Como o desempenho inicial começa em 0%, o foco é diagnóstico, constância e revisão ativa.",
    weeklyPlan: DAYS.map((day, index) => {
      const subject = orderedSubjects[index % orderedSubjects.length];
      const topics = TOPICS_BY_SUBJECT[subject] || ["Revisao guiada", "Exercicios basicos", "Mapa de erros"];
      const topic = topics[index % topics.length];
      const isPracticeDay = index % 2 === 1;

      return {
        day,
        activities: [
          {
            time: `${hoursPerDay}h`,
            subject,
            topic,
            type: isPracticeDay ? "Pratica" : "Aula + Revisao",
            detail: isPracticeDay
              ? "Resolva questoes, corrija os erros e registre os temas que precisam de reforco."
              : "Estude a teoria, faca um resumo curto e termine com 5 perguntas de revisao ativa.",
            color: isPracticeDay
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-indigo-50 border-indigo-200 text-indigo-700"
          }
        ]
      };
    }),
    tips: [
      "Comece pelas materias com 0% para criar um diagnostico real.",
      "Depois de cada bloco, anote o erro principal e transforme em revisao para o dia seguinte.",
      "Use simulados curtos toda semana para atualizar o percentual de aproveitamento."
    ]
  };
}
