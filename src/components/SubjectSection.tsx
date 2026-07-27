import React, { useState } from "react";
import { UserProfile, PracticeQuestion, EssayCorrection } from "../types";
import { 
  Calculator, 
  BookOpen, 
  Atom, 
  Building, 
  Dna, 
  FlaskConical, 
  Sparkles, 
  Loader2, 
  Check, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle, 
  BookMarked, 
  PenTool, 
  ListTodo, 
  AlertTriangle,
  Award,
  RefreshCw,
  Clock,
  ThumbsUp,
  FileText
} from "lucide-react";

interface SubjectSectionProps {
  user: UserProfile;
  onUpdateUser: (data: Partial<UserProfile> | any) => void;
  onOpenQuickAI: (prompt: string) => void;
}

// Fixed standard subject definitions matching high school and vestibular guidelines
const SUBJECTS = [
  {
    id: "mat",
    name: "Matemática",
    icon: "calculator",
    color: "bg-white text-slate-800 border-slate-200",
    hoverBg: "hover:border-indigo-300 hover:shadow-md",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
    barColor: "bg-indigo-600",
    topics: [
      { title: "Funções de 1º e 2º Grau", concepts: ["Gráficos e Raízes", "Fórmula de Bhaskara", "Vértice de Parábola", "Estudo de Sinais"] },
      { title: "Geometria Espacial", concepts: ["Prismas e Cilindros", "Pirâmides e Cones", "Esferas", "Cálculo de Volumes"] },
      { title: "Estatística e Médias", concepts: ["Média Aritmética e Ponderada", "Moda e Mediana", "Variância e Desvio Padrão"] },
      { title: "Análise Combinatória", concepts: ["Princípio Multiplicativo", "Arranjos e Permutações", "Combinações Combinadas"] }
    ]
  },
  {
    id: "port",
    name: "Português",
    icon: "book",
    color: "bg-white text-slate-800 border-slate-200",
    hoverBg: "hover:border-emerald-300 hover:shadow-md",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
    barColor: "bg-emerald-600",
    topics: [
      { title: "Sintaxe da Oração e Período", concepts: ["Sujeito e Predicado", "Vozes Verbais", "Orações Coordenadas e Subordinadas"] },
      { title: "Nova Reforma Ortográfica", concepts: ["Regras de Acentuação", "Uso do Hífen", "Crase Prática"] },
      { title: "Escola Literária: Modernismo", concepts: ["Semana de Arte Moderna (1922)", "1ª, 2ª e 3ª Geração", "Monumento de Osswald de Andrade"] },
      { title: "Ambiguidade e Coesão", concepts: ["Anáforas e Catáforas", "Interpretação Textual", "Polissemia"] }
    ]
  },
  {
    id: "fis",
    name: "Física",
    icon: "physics",
    color: "bg-white text-slate-800 border-slate-200",
    hoverBg: "hover:border-blue-300 hover:shadow-md",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-100",
    barColor: "bg-blue-600",
    topics: [
      { title: "Mecânica (Leis de Newton)", concepts: ["Inércia", "Força, Massa e Aceleração", "Ação e Reação", "Força de Atrito e Plano Inclinado"] },
      { title: "Eletrodinâmica Básica", concepts: ["Corrente Elétrica", "Diferença de Potencial", "Resistores em Série/Paralelo", "Lei de Ohm"] },
      { title: "Termologia e Calor", concepts: ["Escalas Termométricas", "Calor Sensível e Latente", "Propagação de Calor"] },
      { title: "Ondulatória e Acústica", concepts: ["Equação Fundamental de Onda", "Efeito Doppler", "Fenômenos Ondulatórios"] }
    ]
  },
  {
    id: "hist",
    name: "História",
    icon: "history",
    color: "bg-white text-slate-800 border-slate-200",
    hoverBg: "hover:border-amber-300 hover:shadow-md",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-100",
    barColor: "bg-amber-600",
    topics: [
      { title: "Brasil Colônia (1500-1822)", concepts: ["Ciclo do Açúcar e Ouro", "Capitanias Hereditárias", "Inconfidência Mineira"] },
      { title: "Era Vargas (1930-1945)", concepts: ["Revolução de 30", "Estado Novo varguista", "Industrialização e CLT"] },
      { title: "Ditadura Militar no Brasil", concepts: ["AI-5 e Repressão", "Milagre Econômico", "Diretas Já e Transição"] },
      { title: "Segunda Guerra e Guerra Fria", concepts: ["Ascensão do Fascismo", "Muro de Berlim", "Mundo Bipolar"] }
    ]
  },
  {
    id: "bio",
    name: "Biologia",
    icon: "biology",
    color: "bg-white text-slate-800 border-slate-200",
    hoverBg: "hover:border-teal-300 hover:shadow-md",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-100",
    barColor: "bg-teal-600",
    topics: [
      { title: "Ecologia Geral", concepts: ["Relações Ecológicas", "Cadeia e Teia Alimentar", "Ciclos do Carbono e Nitrogênio"] },
      { title: "Genética Básica", concepts: ["Primeira Lei de Mendel", "Codominância e Heredogramas", "Transgênicos e DNA"] },
      { title: "Fisiologia dos Sistemas", concepts: ["Sistema Digestivo", "Circulação Sanguínea", "Sistema Imunológico vax"] },
      { title: "Citologia (Células)", concepts: ["Membrana Plasmática", "Fotossíntese vs Respiração Celular", "Divisão por Mitose e Meiose"] }
    ]
  },
  {
    id: "quim",
    name: "Química",
    icon: "chemistry",
    color: "bg-white text-slate-800 border-slate-200",
    hoverBg: "hover:border-red-300 hover:shadow-md",
    badgeColor: "bg-red-50 text-red-700 border-red-100",
    barColor: "bg-red-600",
    topics: [
      { title: "Estrutura do Átomo", concepts: ["Modelos Atômicos (Rutherford-Bohr)", "Íons e Isótopos", "Distribuição Eletrônica"] },
      { title: "Estequiometria Prática", concepts: ["Relação em Massa e Mol", "Reagente em Excesso e Limitante", "Pureza e Rendimento"] },
      { title: "Química Orgânica", concepts: ["Hidrocarbonetos", "Álcool, Éter e Ácidos Carboxílicos", "Isomeria Plana e Espacial"] },
      { title: "Equilíbrio Químico", concepts: ["Constante de Equilíbrio Kc e Kp", "Princípio de Le Chatelier", "pH e pOH"] }
    ]
  }
];

const ESSAY_THEMES = [
  "Caminhos para combater a intolerância religiosa no Brasil",
  "A democratização do acesso ao cinema na sociedade brasileira",
  "O impacto de Inteligências Artificiais e algoritmos na formação educacional",
  "Desafios para o combate ao desperdício do lixo eletrônico no Brasil moderno",
  "Os limites entre a liberdade de expressão e o discurso de ódio nas redes digitais brasileiras"
];

const SUBJECT_NAME_ALIASES: Record<string, string> = {
  "MatemÃ¡tica": "Matemática",
  "Matem?tica": "Matemática",
  "PortuguÃªs": "Português",
  "Portugu?s": "Português",
  "FÃ­sica": "Física",
  "F?sica": "Física",
  "HistÃ³ria": "História",
  "Hist?ria": "História",
  "QuÃ­mica": "Química",
  "Qu?mica": "Química"
};

const getSubjectName = (name: string) => SUBJECT_NAME_ALIASES[name] || name;

export default function SubjectSection({ user, onUpdateUser, onOpenQuickAI }: SubjectSectionProps) {
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  
  // AI Concept Explainer state
  const [explaining, setExplaining] = useState(false);
  const [explainResult, setExplainResult] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState("");

  // AI Practice generator state
  const [activeSubTab, setActiveSubTab] = useState<"teach" | "exams" | "essay">("teach");
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<PracticeQuestion[]>([]);
  const [curQuizIndex, setCurQuizIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // AI Essay state
  const [selectedTheme, setSelectedTheme] = useState(ESSAY_THEMES[0]);
  const [essayText, setEssayText] = useState("");
  const [correctingEssay, setCorrectingEssay] = useState(false);
  const [essayResult, setEssayResult] = useState<EssayCorrection | null>(null);
  const getPerformanceKey = (subjectName: string) => {
    const normalizedSubjectName = getSubjectName(subjectName);
    return Object.keys(user.performance).find(key => getSubjectName(key) === normalizedSubjectName) || normalizedSubjectName;
  };
  const subjectsForStudent = SUBJECTS.filter(subject => Object.prototype.hasOwnProperty.call(user.performance, getPerformanceKey(subject.name)));
  const visibleSubjects = subjectsForStudent.length > 0 ? subjectsForStudent : SUBJECTS;
  const selectedSubjectName = selectedSubject ? getSubjectName(selectedSubject.name) : "";
  const selectedPerformanceKey = selectedSubject ? getPerformanceKey(selectedSubject.name) : "";

  const renderIcon = (name: string, className = "w-5 h-5") => {
    switch (name) {
      case "calculator": return <Calculator className={className} />;
      case "book": return <BookOpen className={className} />;
      case "physics": return <Atom className={className} />;
      case "history": return <Building className={className} />;
      case "biology": return <Dna className={className} />;
      case "chemistry": return <FlaskConical className={className} />;
      default: return <BookOpen className={className} />;
    }
  };

  // 1) Trigger AI Explain Concept
  const handleExplainConcept = (conceptStr: string) => {
    setSelectedConcept(conceptStr);
    setExplaining(true);
    setExplainResult(null);

    fetch("/api/gemini/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: selectedSubjectName,
        concept: conceptStr,
        userMessage: customQuery
      })
    })
    .then(r => r.json())
    .then(data => {
      setExplainResult(data.text || "Sem resposta retornada.");
      setExplaining(false);
      // Increment AI Chat interactions on backend
      fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incrementChat: true })
      }).then(r => r.json()).then(updated => onUpdateUser(updated));
    })
    .catch(err => {
      console.error(err);
      setExplainResult("Erro ao consultar o Tutor IA. Verifique sua chave API ou conexão.");
      setExplaining(false);
    });
  };

  // 2) Trigger AI Mock Exam generation
  const handleGenerateQuiz = (topicString: string) => {
    setGeneratingQuiz(true);
    setQuizQuestions([]);
    setCurQuizIndex(0);
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
    setCorrectAnswersCount(0);
    setQuizFinished(false);

    fetch("/api/gemini/generate-practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: selectedSubjectName,
        topic: topicString
      })
    })
    .then(r => r.json())
    .then(data => {
      if (data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
      } else {
        // Fallback mock questions in case of failure or empty response
        setQuizQuestions([
          {
            question: `(ENEM) Em relação a matéria de ${selectedSubjectName}, considere que um estudante preparou um mapa mental detalhado sobre o tema de ${topicString}. Qual das alternativas representa uma verdade absoluta sobre o assunto?`,
            options: [
              "A) A teoria contraria todas as regras práticas vivenciadas.",
              "B) Trata-se de uma convenção estabelecida no século passado.",
              "C) Ela define as bases para solucionar equações ou interpretar textos de forma correta.",
              "D) Não possui relevância recorrente nas provas vigentes.",
              "E) Aplica-se unicamente em testes laboratoriais específicos do meio acadêmico."
            ],
            correctIndex: 2,
            explanation: "Alternativa C apresenta o raciocínio correto do ponto de vista conceitual e prático.",
            origin: "ENEM Original"
          }
        ]);
      }
      setGeneratingQuiz(false);
    })
    .catch(err => {
      console.error(err);
      setGeneratingQuiz(false);
    });
  };

  const handleQuizAnswerSubmit = () => {
    if (selectedQuizOption === null) return;
    setQuizSubmitted(true);
    
    const correct = quizQuestions[curQuizIndex].correctIndex;
    if (selectedQuizOption === correct) {
      setCorrectAnswersCount(prev => prev + 1);
    }

    // Persist Solved Exercise Count on backend
    fetch("/api/user-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incrementExercises: true })
    })
    .then(r => r.json())
    .then(u => onUpdateUser(u))
    .catch(e => console.error("Error updating exercises stats:", e));
  };

  const handleNextQuizQuestion = () => {
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
    if (curQuizIndex < quizQuestions.length - 1) {
      setCurQuizIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
      // Increment subject score slightly based on correct answers
      const calcMultiplier = Math.round((correctAnswersCount / quizQuestions.length) * 10);
      const currentScore = user.performance[selectedPerformanceKey] ?? 0;
      const performanceUpdate = {
        [selectedPerformanceKey]: Math.min(100, currentScore + calcMultiplier)
      };
      fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performanceUpdate })
      })
      .then(r => r.json())
      .then(u => onUpdateUser(u));
    }
  };

  // 3) Trigger AI Essay Corrector
  const handleCorrectEssay = () => {
    if (essayText.length < 80) {
      alert("Escreva uma redação com justificativa mínima de caracteres (pelo menos 80) para receber uma correção qualificada.");
      return;
    }
    setCorrectingEssay(true);
    setEssayResult(null);

    fetch("/api/gemini/essay-correct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme: selectedTheme,
        essayText: essayText
      })
    })
    .then(r => r.json())
    .then(data => {
      setEssayResult(data);
      setCorrectingEssay(false);
      
      // Increment AI Chat interactions to show on stats board
      fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incrementChat: true })
      }).then(r => r.json()).then(updated => onUpdateUser(updated));
    })
    .catch(err => {
      console.error(err);
      setCorrectingEssay(false);
      alert("Falha na correção. Certifique-se de que sua redação atende a critérios mínimos estruturais.");
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* If no subject is selected, render subjects list */}
      {!selectedSubject ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <BookMarked className="w-6 h-6 text-indigo-600" />
              <span>Painel de Matérias</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Selecione uma disciplina para iniciar seus roteiros de vestibulares, gerar simulados interativos ou revisar fórmulas com nossa IA.
            </p>
          </div>

          {/* Grid of subjects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleSubjects.map((subj) => {
              const subjectName = getSubjectName(subj.name);
              const score = user.performance[getPerformanceKey(subj.name)] ?? 0;
              return (
                <div 
                  key={subj.id}
                  onClick={() => {
                    setSelectedSubject(subj);
                    setSelectedConcept(null);
                    setExplainResult(null);
                    setActiveSubTab("teach");
                  }}
                  className={`${subj.color} border border-slate-200 px-6 py-7 rounded-3xl cursor-pointer ${subj.hoverBg} transition duration-300 flex flex-col justify-between align-stretch h-56 group relative overflow-hidden shadow-sm hover:shadow-md`}
                >
                  <div className="absolute -right-3 -top-3 w-28 h-28 bg-indigo-500/5 rounded-full blur-xl pointer-events-none transition-transform duration-300 group-hover:scale-125"></div>
                  
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl w-fit ${subj.badgeColor || "bg-indigo-50 text-indigo-600"}`}>
                      {renderIcon(subj.icon, "w-6 h-6")}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200/55">Acessar</span>
                  </div>

                  <div className="space-y-2 mt-auto">
                    <h3 className="text-lg font-display font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{subjectName}</h3>
                    
                    {/* Progress score tracking */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                        <span>Aproveitamento médio</span>
                        <span className="font-bold text-slate-700">{score}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/40">
                        <div className={`h-full rounded-full ${subj.barColor}`} style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Banner Redação Direct Link */}
          <div className="bg-emerald-50/60 border border-emerald-100/80 p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-5 justify-between">
            <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
              <div className="p-3.5 bg-emerald-100 text-emerald-800 rounded-2xl border border-emerald-200/50">
                <PenTool className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Corretor de Redações ENEM Grátis</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Submeta seu rascunho textual para avaliação oficial imediata nos 5 pilares do ENEM.</p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                const redSubject = SUBJECTS.find(s => s.id === "port");
                setSelectedSubject(redSubject || SUBJECTS[1]);
                setSelectedConcept(null);
                setExplainResult(null);
                setActiveSubTab("essay");
              }}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-2xl transition shrink-0 shadow-sm"
            >
              Iniciar Correção IA
            </button>
          </div>
        </div>
      ) : (
        /* If a subject is active, render detailed dashboard */
        <div className="space-y-6">
          
          {/* Breadcrumbs / Subject header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <button 
              onClick={() => setSelectedSubject(null)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 w-fit font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar para painel de matérias</span>
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Aproveitamento em {selectedSubjectName}:</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                {user.performance[selectedPerformanceKey] ?? 0}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-white border border-slate-200 text-indigo-600 rounded-2xl shadow-sm">
              {renderIcon(selectedSubject.icon, "w-7 h-7")}
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-800">{selectedSubjectName}</h2>
              <p className="text-xs text-slate-550">Gerencie lições fundamentais, simulados e testes personalizados</p>
            </div>
          </div>

          {/* Sub Navigation Bar inside subject */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveSubTab("teach")}
              className={`pb-3 px-5 text-sm font-semibold border-b-2 transition ${
                activeSubTab === "teach" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-700"
              }`}
            >
              Aulas & Tutor IA
            </button>
            <button
              onClick={() => {
                setActiveSubTab("exams");
                setQuizQuestions([]);
                setQuizFinished(false);
              }}
              className={`pb-3 px-5 text-sm font-semibold border-b-2 transition ${
                activeSubTab === "exams" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-700"
              }`}
            >
              Simulado Inteligente IA
            </button>
            <button
              onClick={() => setActiveSubTab("essay")}
              className={`pb-3 px-5 text-sm font-semibold border-b-2 transition ${
                activeSubTab === "essay" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-700"
              }`}
            >
              Corretor de Redação
            </button>
          </div>

          {/* Render content based on active sub tab */}
          
          {/* TAB 1: TEACH & REVISE ON SUBJECT TOPICS */}
          {activeSubTab === "teach" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Side: Topic list selector */}
              <div className="lg:col-span-4 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Escolha um Tema de ENEM:</h3>
                
                {selectedSubject.topics.map((topObj: any) => (
                  <div 
                    key={topObj.title}
                    className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 hover:border-indigo-150 transition shadow-sm"
                  >
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-indigo-500" />
                      <span>{topObj.title}</span>
                    </h4>
                    
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {topObj.concepts.map((conc: string) => (
                        <button
                           key={conc}
                           onClick={() => handleExplainConcept(conc)}
                           className={`text-[11px] px-2.5 py-1.5 rounded-xl border transition text-left ${
                             selectedConcept === conc 
                               ? "bg-indigo-50 text-indigo-700 border-indigo-300 font-bold" 
                               : "bg-slate-50 text-slate-605 border-slate-200 hover:text-slate-800 hover:bg-slate-100"
                           }`}
                        >
                          {conc}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Side: Tutor explanatory box */}
              <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-3xl min-h-[400px] shadow-sm">
                {explaining ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-xs text-slate-500">Excelente escolha! O Tutor IA está preparando sua aula estruturada sobre <span className="text-indigo-600 font-bold">{selectedConcept}</span>...</p>
                  </div>
                ) : explainResult ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold">Conteúdo Explicativo</span>
                      <h4 className="text-sm font-bold text-slate-800">{selectedConcept}</h4>
                    </div>

                    <div className="prose prose-slate max-w-none text-slate-650 text-sm leading-relaxed space-y-4 font-sans whitespace-pre-wrap">
                      {explainResult}
                    </div>

                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                      <p className="text-xs text-slate-500 font-medium">Quer testar seus conhecimentos práticos sobre este assunto agora?</p>
                      <button 
                        onClick={() => {
                          setActiveSubTab("exams");
                          handleGenerateQuiz(selectedConcept || "");
                        }}
                        className="bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gerar Simulado com IA</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                    <Sparkles className="w-10 h-10 text-indigo-400/40" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-750">Tutor Virtual Interativo</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">Selecione uma lição ou conceito na esquerda para receber explicações profundas, fórmulas esquematizadas e exercícios do ENEM resolvidos com o Tutor IA.</p>
                    </div>
                    
                    {/* Ask custom duda form */}
                    <div className="w-full max-w-md pt-4">
                      <div className="text-xs text-slate-500 text-left mb-1.5 font-bold">Ficou com alguma dúvida pontual em {selectedSubjectName}?</div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customQuery}
                          onChange={e => setCustomQuery(e.target.value)}
                          placeholder="Ex: Qual a fórmula de bhaskara e como usá-la?"
                          className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                        <button
                          onClick={() => handleExplainConcept(customQuery || "Dúvida Geral")}
                          className="bg-indigo-600 hover:bg-indigo-510 px-4 rounded-xl text-xs font-semibold text-white transition flex items-center gap-1.5"
                        >
                          Perguntar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}


          {/* TAB 2: INTERACTIVE AI MOCK PRACTICE EXAMS */}
          {activeSubTab === "exams" && (
            <div className="bg-white border border-slate-200 p-6 rounded-3xl min-h-[400px] flex flex-col justify-between shadow-sm">
              
              {!generatingQuiz && quizQuestions.length === 0 && !quizFinished ? (
                /* Choose topic to generate screen */
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
                  <Calculator className="w-12 h-12 text-indigo-500/50" />
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-850">Gerador de Simulados Vestibular IA</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">Escolha qual tópico de {selectedSubjectName} você quer testar agora de maneira interativa. Nossa IA formulará 3 questões exclusivas e corrigirá cada uma em tempo real!</p>
                  </div>
                  
                  {/* Subject topic choices */}
                  <div className="flex flex-wrap gap-2 justify-center max-w-xl">
                    {selectedSubject.topics.map((t: any) => (
                      <button
                        key={t.title}
                        onClick={() => handleGenerateQuiz(t.title)}
                        className="bg-slate-50 hover:bg-indigo-50/60 text-xs px-4 py-3 rounded-xl border border-slate-200 text-slate-650 hover:text-indigo-700 hover:border-indigo-250 font-semibold transition shadow-xs"
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : generatingQuiz ? (
                /* Loading screen */
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
                  <div>
                    <h4 className="text-base font-bold text-slate-800">Formulando Questões Inéditas...</h4>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">Nossa Inteligência Artificial está escrevendo questões contextualizadas nos padrões ENEM/FUVEST especificamente para você!</p>
                  </div>
                </div>
              ) : quizFinished ? (
                /* Score result screen */
                <div className="py-10 text-center max-w-md mx-auto space-y-6">
                  <div className="inline-block p-4 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-full">
                    <Award className="w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-extrabold text-slate-800">Simulado Concluído!</h3>
                    <p className="text-xs text-slate-500 mt-1">Seu aproveitamento neste ciclo de exercícios:</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6">
                    <div className="text-3xl font-display font-black text-indigo-600">
                      {correctAnswersCount} / {quizQuestions.length}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2 font-medium">
                      {correctAnswersCount === quizQuestions.length ? "Desempenho Perfeito! Seu limite de aprovação aumentou." : "Bom trabalho! Continue revisando os conceitos explicados para crescer."}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleGenerateQuiz(selectedSubject.topics[0].title)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs py-3.5 rounded-2xl transition shadow-md shadow-indigo-600/10"
                    >
                      Refazer outro simulado
                    </button>
                    <button
                      onClick={() => {
                        setQuizQuestions([]);
                        setQuizFinished(false);
                      }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs py-3.5 rounded-2xl transition"
                    >
                      Escolher outro tema
                    </button>
                  </div>
                </div>
              ) : (
                /* Active quiz UI */
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">Questão {curQuizIndex + 1} de {quizQuestions.length}</span>
                      <span className="text-[10px] text-slate-400 italic font-mono">ENEM {quizQuestions[curQuizIndex].origin || ""}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">Resoluções: {correctAnswersCount} corretas</span>
                  </div>

                  {/* Question Prompt */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-sm text-slate-800 font-medium leading-relaxed font-sans whitespace-pre-wrap">
                    {quizQuestions[curQuizIndex].question}
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5">
                    {quizQuestions[curQuizIndex].options.map((option, index) => {
                      const isSelected = selectedQuizOption === index;
                      const isAnswerCorrect = index === quizQuestions[curQuizIndex].correctIndex;

                      let btnBorderColor = "border-slate-200 bg-white text-slate-600 hover:bg-slate-50/50";
                      if (isSelected && !quizSubmitted) btnBorderColor = "border-indigo-500 bg-indigo-50/60 text-indigo-700 font-semibold shadow-xs";
                      if (quizSubmitted) {
                        if (isAnswerCorrect) {
                          btnBorderColor = "border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold shadow-sm";
                        } else if (isSelected) {
                          btnBorderColor = "border-red-400 bg-red-50 text-red-700 font-semibold shadow-sm";
                        }
                      }

                      return (
                        <button
                          key={index}
                          disabled={quizSubmitted}
                          onClick={() => setSelectedQuizOption(index)}
                          className={`w-full border p-4 rounded-xl text-xs select-none font-medium flex items-center justify-between transition text-left leading-relaxed ${btnBorderColor}`}
                        >
                          <span>{option}</span>
                          {quizSubmitted && isAnswerCorrect && (
                            <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0 ml-2" />
                          )}
                          {quizSubmitted && isSelected && !isAnswerCorrect && (
                            <X className="w-4.5 h-4.5 text-red-500 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation feedback & controls */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      {!quizSubmitted ? (
                        <p className="text-[11px] text-slate-400 font-medium font-sans">Selecione uma alternativa de A a E para registrar sua resposta.</p>
                      ) : (
                        <div className="text-xs bg-indigo-50 text-slate-700 border border-indigo-150 p-4 rounded-xl leading-relaxed">
                          <strong className="text-indigo-800 block mb-1">Explicação da IA:</strong>
                          {quizQuestions[curQuizIndex].explanation}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex gap-2">
                      {!quizSubmitted ? (
                        <button
                          disabled={selectedQuizOption === null}
                          onClick={handleQuizAnswerSubmit}
                          className="bg-indigo-600 hover:bg-indigo-505 disabled:bg-slate-100 disabled:text-slate-400 hover:shadow-xs text-white font-bold text-xs px-6 py-3.5 rounded-xl transition w-full sm:w-auto"
                        >
                          Confirmar Resposta
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuizQuestion}
                          className="bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition w-full sm:w-auto flex items-center gap-1.5 shadow-sm"
                        >
                          <span>{curQuizIndex === quizQuestions.length - 1 ? "Ver Notas" : "Próxima Questão"}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}


          {/* TAB 3: ESSAY CORRECTOR (REDACAO) */}
          {activeSubTab === "essay" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <PenTool className="w-6 h-6 text-indigo-600" />
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-800">Corretor de Redações IA</h3>
                    <p className="text-xs text-slate-500">Nossa IA simula minuciosamente a régua de notas de corretores do ENEM e FUVEST.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                  
                  {/* Left input area */}
                  <div className="md:col-span-12 space-y-4">
                    <div className="space-y-15">
                      <label className="text-xs text-slate-500 font-bold block">Tema da Redação (Selecione ou escreva o seu)</label>
                      <select 
                        value={selectedTheme}
                        onChange={e => setSelectedTheme(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 leading-relaxed text-xs text-slate-750 focus:outline-none focus:border-indigo-500"
                      >
                        {ESSAY_THEMES.map(theme => (
                          <option key={theme} value={theme}>{theme}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-slate-500 font-bold">Insira o Texto Completo da sua Redação (Escreva de forma contínua ou separe por parágrafos)</label>
                        <span className="text-[10px] text-indigo-600 font-mono font-semibold">mínimo 80 caracteres</span>
                      </div>
                      <textarea
                        value={essayText}
                        onChange={e => setEssayText(e.target.value)}
                        rows={12}
                        placeholder="Insira os parágrafos de Introdução, Argumento 1, Argumento 2 e Conclusão com a proposta de intervenção social..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-850 placeholder-slate-400 font-sans focus:outline-none focus:border-indigo-500 focus:bg-white leading-relaxed"
                      />
                    </div>

                    <button 
                      disabled={correctingEssay}
                      onClick={handleCorrectEssay}
                      className="w-full bg-indigo-600 hover:bg-indigo-505 text-white disabled:bg-slate-100 disabled:text-slate-400 py-3.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      {correctingEssay ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Avaliando Competências textuais e coesão (Pode levar até 20 segundos)...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Enviar Rascunho para Correção Oficial com IA</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>

              {/* Essay Result Scoreboard Card */}
              {essayResult && (
                <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl space-y-6 shadow-sm animate-fade-in">
                  
                  {/* Top score row */}
                  <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 pb-5 gap-4">
                    <div>
                      <h4 className="text-base font-display font-bold text-slate-850">Boletim de Avaliação da Redação</h4>
                      <p className="text-xs text-slate-500 mt-1">Estimativa de Nota Final baseada estritamente na grade do ENEM</p>
                    </div>

                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-6 py-3.5 rounded-2xl text-center shadow-xs">
                      <div className="text-3xl font-display font-black text-emerald-700">{essayResult.totalScore}</div>
                      <div className="text-[9px] uppercase tracking-wider font-bold mt-0.5 text-emerald-600">Nota Final de 1000</div>
                    </div>
                  </div>

                  {/* Competency cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { title: "Competência 1", label: "Gramática e Norma Culta", obj: essayResult.comp1 },
                      { title: "Competência 2", label: "Repertório e Tema", obj: essayResult.comp2 },
                      { title: "Competência 3", label: "Projeto de Texto e Fatos", obj: essayResult.comp3 },
                      { title: "Competência 4", label: "Mecanismo de Coesão", obj: essayResult.comp4 },
                      { title: "Competência 5", label: "Intervenção Social", obj: essayResult.comp5 }
                    ].map((comp, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col justify-between h-44 shadow-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">{comp.title}</span>
                          <h5 className="text-[11px] font-bold text-slate-750 mt-0.5 leading-tight">{comp.label}</h5>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal line-clamp-3 font-sans font-medium">{comp.obj?.feedback}</p>
                        </div>
                        <div className="text-xs font-bold text-emerald-700 bg-emerald-100/60 border border-emerald-200/50 rounded-lg px-2 py-0.5 w-fit mt-2 font-mono">
                          {comp.obj?.score} / 200
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Feedback strengths & weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-emerald-50/60 border border-emerald-100/70 p-5 rounded-2xl space-y-3 shadow-xs">
                      <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Pontos Fortes Detetados</h5>
                      <ul className="space-y-1.5">
                        {essayResult.strengths?.map((str, idx) => (
                          <li key={idx} className="text-xs text-slate-650 flex items-start gap-1.5 leading-normal font-medium">
                            <span className="text-emerald-600 shrink-0 mt-0.5 font-bold">✓</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-100/70 p-5 rounded-2xl space-y-3 shadow-xs">
                      <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Oportunidades de Melhoria</h5>
                      <ul className="space-y-1.5">
                        {essayResult.weaknesses?.map((weak, idx) => (
                          <li key={idx} className="text-xs text-slate-650 flex items-start gap-1.5 leading-normal font-medium">
                            <span className="text-amber-605 shrink-0 mt-0.5 font-bold">⚠</span>
                            <span>{weak}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Table of corrections syntax */}
                  {essayResult.corrections && essayResult.corrections.length > 0 && (
                    <div className="space-y-3 bg-slate-50 border border-slate-150 p-5 rounded-2xl">
                      <h5 className="text-xs font-bold text-indigo-605 uppercase tracking-wider">Dicionário de Correções Ortográficas:</h5>
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {essayResult.corrections.map((corr, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-150 flex flex-col md:flex-row gap-3 text-xs leading-relaxed justify-between shadow-xs">
                            <div className="md:w-5/12 text-red-500 line-through font-medium">
                              Original: "{corr.original}"
                            </div>
                            <div className="md:w-5/12 text-emerald-650 font-bold">
                              Sugestão: "{corr.corrected}"
                            </div>
                            <div className="md:w-2/12 text-slate-400 text-[10px] italic">
                              Motivo: {corr.why}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* General feedback summary footer */}
                  <div className="bg-indigo-50/70 border border-indigo-100 px-5 py-4 rounded-2xl text-xs text-slate-700 leading-relaxed font-sans">
                    <strong className="text-indigo-800 block mb-1">Feedback do Corretor de Redações:</strong>
                    {essayResult.generalFeedback}
                  </div>

                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
