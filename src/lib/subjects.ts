export const SUBJECT_OPTIONS = [
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

const SUBJECT_BY_SLUG: Record<string, string> = {
  matematica: "Matemática",
  portugues: "Português",
  redacao: "Redação",
  literatura: "Literatura",
  fisica: "Física",
  quimica: "Química",
  biologia: "Biologia",
  historia: "História",
  geografia: "Geografia",
  filosofia: "Filosofia",
  sociologia: "Sociologia",
  ingles: "Inglês",
  espanhol: "Espanhol",
  artes: "Artes",
  educacaofisica: "Educação Física"
};

const slugSubject = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

export const getCanonicalSubjectName = (name: string) => {
  const slug = slugSubject(name || "");
  return SUBJECT_BY_SLUG[slug] || name;
};

export const normalizePerformanceSubjects = (
  performance: Record<string, number> = {},
  includeAllSubjects = true
) => {
  const normalized: Record<string, number> = {};

  Object.entries(performance).forEach(([subject, value]) => {
    const canonical = getCanonicalSubjectName(subject);
    const score = Number.isFinite(Number(value)) ? Number(value) : 0;
    normalized[canonical] = Math.max(
      normalized[canonical] ?? 0,
      Math.min(100, Math.max(0, Math.round(score)))
    );
  });

  if (includeAllSubjects) {
    SUBJECT_OPTIONS.forEach(subject => {
      normalized[subject] = normalized[subject] ?? 0;
    });
  }

  return normalized;
};
