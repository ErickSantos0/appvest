import React, { useState } from "react";
import { UserProfile, PracticeQuestion } from "../types";
import { buildLocalSimulado } from "../lib/simuladoFallbacks";
import { 
  ClipboardList, 
  Sparkles, 
  Loader2, 
  Check, 
  X, 
  Award, 
  TrendingUp, 
  HelpCircle,
  Clock,
  Settings,
  ChevronRight,
  BookOpen
} from "lucide-react";

interface AIPersonalizedSimuladoProps {
  user: UserProfile;
  onUpdateUser: (data: Partial<UserProfile> | any) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function AIPersonalizedSimulado({ user, onUpdateUser, onNavigateToTab }: AIPersonalizedSimuladoProps) {
  // Config state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(3);
  const [complexity, setComplexity] = useState<string>("Médio");
  
  // Quiz running state
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [scoreCount, setScoreCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  
  // Track correct/incorrect per subject for final feedback
  const [subjectPerformance, setSubjectPerformance] = useState<Record<string, { total: number, correct: number }>>({});

  const availableSubjects = Object.keys(user.performance);

  // Find user's weakest subjects (under 55% average score)
  const weakSubjects = Object.entries(user.performance)
    .filter(([_, value]) => value < 55)
    .map(([subj]) => subj);

  // Auto-fill weakest subjects when user chooses to target weak disciplines in one click!
  const handleAutoSelectWeakSubjects = () => {
    if (weakSubjects.length === 0) {
      // Toggle all if none are particularly weak
      setSelectedSubjects(availableSubjects.slice(0, 3));
    } else {
      setSelectedSubjects(weakSubjects);
    }
  };

  const toggleSubject = (sub: string) => {
    setSelectedSubjects(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const handleGenerateCustomSimulado = () => {
    const subjectsToFetch = selectedSubjects.length > 0 ? selectedSubjects : availableSubjects;
    const fallbackQuestions = buildLocalSimulado(subjectsToFetch, numQuestions, complexity);
    
    setIsGenerating(true);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setScoreCount(0);
    setQuizFinished(false);
    setSubjectPerformance({});

    fetch("/api/gemini/generate-custom-simulado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjects: subjectsToFetch,
        numQuestions: numQuestions,
        complexity: complexity
      })
    })
    .then(r => {
      if (!r.ok) throw new Error("Simulado API unavailable");
      return r.json();
    })
    .then(data => {
      setQuestions(data?.questions?.length ? data.questions : fallbackQuestions);
      setIsGenerating(false);
    })
    .catch(err => {
      console.error(err);
      setQuestions(fallbackQuestions);
      setIsGenerating(false);
    });
  };
  const handleRegisterAnswer = () => {
    if (selectedOption === null) return;
    setSubmitted(true);
    
    const activeQuest = questions[currentIndex];
    const isCorrect = selectedOption === activeQuest.correctIndex;
    const activeSubj = activeQuest.subject || "Geral";

    if (isCorrect) {
      setScoreCount(prev => prev + 1);
    }

    // Accumulate subjects scores breakdown
    setSubjectPerformance(prev => {
      const existing = prev[activeSubj] || { total: 0, correct: 0 };
      return {
        ...prev,
        [activeSubj]: {
          total: existing.total + 1,
          correct: existing.correct + (isCorrect ? 1 : 0)
        }
      };
    });

    // Increment overall exercises stats
    fetch("/api/user-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incrementExercises: true })
    })
    .then(r => r.json())
    .then(u => onUpdateUser(u))
    .catch(e => console.error(e));
  };

  const handleNextStep = () => {
    setSelectedOption(null);
    setSubmitted(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
      
      // Persist results & adjust user performance mapping dynamically
      const performanceUpdate: Record<string, number> = {};
      
      Object.entries(subjectPerformance as Record<string, { total: number; correct: number }>).forEach(([subjName, tracker]) => {
        const ratio = tracker.correct / tracker.total;
        // Raise performance if ratio is high, drop or adjust if very low
        const currentScore = user.performance[subjName] ?? 0;
        let delta = 0;
        
        if (ratio >= 0.8) delta = Math.round(5 * ratio);
        else if (ratio <= 0.3) delta = -Math.round(4 * (1 - ratio));
        
        if (delta !== 0) {
          performanceUpdate[subjName] = Math.max(0, Math.min(100, currentScore + delta));
        }
      });

      // Issue dynamic server-side update
      if (Object.keys(performanceUpdate).length > 0) {
        fetch("/api/user-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ performanceUpdate })
        })
        .then(r => r.json())
        .then(u => onUpdateUser(u))
        .catch(e => console.error("Error committing score adjustment:", e));
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-indigo-600" />
          <span>Módulo de Simulados Personalizados IA</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Gere questionários de alta performance específicos para reforçar suas fragilidades. A IA equilibra dificuldade e volume de questões por matéria proporcionalmente ao seu estágio intelectual.
        </p>
      </div>

      {!isGenerating && questions.length === 0 && !quizFinished ? (
        /* Configuration UI */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Performance Status Check Panel (5 cols) */}
          <div className="lg:col-span-12 xl:col-span-5 bg-white border border-slate-200 p-6 rounded-3xl space-y-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-indigo-650" />
                  <span>Seu Indicador de Desafios</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Materias elegíveis mapeadas em tempo real pelas suas respostas:</p>
              </div>

              <div className="space-y-3.5">
                {Object.entries(user.performance).map(([subj, val]) => {
                  const isCritical = val < 55;
                  return (
                    <div key={subj} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-xl transition hover:bg-slate-100">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-700 block">{subj}</span>
                        {isCritical ? (
                          <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-1">⚠️ Defasagem Crítica: {val}%</span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-medium">✓ Bom ritmo: {val}%</span>
                        )}
                      </div>

                      <button
                        onClick={() => toggleSubject(subj)}
                        className={`text-[11px] px-3 py-1.5 rounded-lg border font-bold transition flex items-center gap-1 ${
                          selectedSubjects.includes(subj)
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                            : "bg-white border-slate-205 text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        {selectedSubjects.includes(subj) ? "Marcado" : "Incluir"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {weakSubjects.length > 0 && (
              <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-black text-indigo-850">Focar nas Defasagens Rápidas?</span>
                  <p className="text-[10px] text-slate-550 leading-relaxed">Nossa IA marcará automaticamente suas {weakSubjects.length} matérias mais vulneráveis instantaneamente.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoSelectWeakSubjects}
                  className="bg-indigo-650 hover:bg-indigo-600 font-bold text-[11px] text-white px-4 py-2.5 rounded-xl shrink-0 transition"
                >
                  Selecionar {weakSubjects.length} vulnerabilidades
                </button>
              </div>
            )}
          </div>

          {/* Form parameters selection (7 cols) */}
          <div className="lg:col-span-12 xl:col-span-7 bg-white border border-slate-200 p-6 rounded-3xl space-y-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-6">
              
              <div>
                <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2">
                  <Settings className="w-4.5 h-4.5 text-indigo-600" />
                  <span>Parâmetros de Ajuste da IA</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Defina o volume e a complacência estrutural do seu exame simulado</p>
              </div>

              {/* Amount selector */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 block">Quantidade de Questões:</span>
                <div className="grid grid-cols-3 gap-3">
                  {[3, 5, 10].map(val => (
                    <button
                      key={val}
                      onClick={() => setNumQuestions(val)}
                      className={`py-3 rounded-xl border text-xs font-extrabold transition shadow-xs ${
                        numQuestions === val
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {val} Exercícios
                    </button>
                  ))}
                </div>
              </div>

              {/* Complexity Selection */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 block">Nível de Complexidade:</span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "Fácil", label: "Fácil (Revisão Básica)" },
                    { id: "Médio", label: "Médio (Fórmula ENEM)" },
                    { id: "Difícil", label: "Difícil (FUVEST/ITA)" }
                  ].map(lvl => (
                    <button
                      key={lvl.id}
                      onClick={() => setComplexity(lvl.id)}
                      className={`p-3.5 rounded-xl border text-xs font-semibold text-center leading-tight transition shadow-xs flex flex-col items-center justify-center gap-1 ${
                        complexity === lvl.id
                          ? "bg-indigo-600 border-indigo-600 text-white font-bold"
                          : "bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>{lvl.id}</span>
                      <span className="text-[9px] opacity-75 font-normal">{lvl.label.split("(")[1]?.replace(")", "")}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selection Summary information badge */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-start gap-3">
                <div className="p-1 bg-white border rounded text-indigo-500 text-sm font-semibold">💡</div>
                <div className="text-xs text-slate-600 leading-normal font-medium">
                  Seu simulado examinará: <strong className="text-slate-800">{selectedSubjects.length > 0 ? selectedSubjects.join(", ") : "Todas as matérias"}</strong> com dificuldade <strong className="text-slate-800">{complexity}</strong>.
                </div>
              </div>

            </div>

            <button
              onClick={handleGenerateCustomSimulado}
              className="w-full bg-indigo-600 hover:bg-indigo-505 font-bold text-xs py-4 rounded-2xl text-white shadow-md shadow-indigo-600/10 transition mt-6 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gerar Simulado Personalizado com IA</span>
            </button>
          </div>

        </div>
      ) : isGenerating ? (
        /* Question loading status */
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm flex flex-col items-center justify-center space-y-4 min-h-[400px]">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <div>
            <h4 className="text-base font-bold text-slate-800">Construindo Simulado Personalizado</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">Formulando {numQuestions} questões exclusivas para as disciplinas selecionadas calibradas no nível {complexity}...</p>
          </div>
        </div>
      ) : quizFinished ? (
        /* Score board finish status screen */
        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-md space-y-8 animate-fade-in">
          
          <div className="inline-block p-4 bg-indigo-50 border border-indigo-150 rounded-full text-indigo-600">
            <Award className="w-12 h-12" />
          </div>
          
          <div>
            <h3 className="text-2xl font-display font-extrabold text-slate-800">Simulado Personalizado Concluído!</h3>
            <p className="text-xs text-slate-450 mt-1">Excelente persistência! Aqui estão as métricas de aproveitamento:</p>
          </div>

          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 max-w-sm mx-auto">
            <div className="text-4xl font-display font-black text-indigo-650">
              {scoreCount} / {questions.length}
            </div>
            <div className="text-[11px] text-slate-500 font-bold mt-2 font-sans uppercase tracking-wide">
              {Math.round((scoreCount / questions.length) * 100)}% de Acertos Totais
            </div>
          </div>

          {/* Breakdown per subject studied */}
          <div className="space-y-3.5 text-left max-w-md mx-auto border-t border-b border-slate-100 py-5">
            <h5 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Detalhamento Pedagógico por Disciplina:</h5>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(subjectPerformance as Record<string, { total: number; correct: number }>).map(([subj, data]) => {
                const pc = Math.round((data.correct / data.total) * 100);
                return (
                  <div key={subj} className="flex justify-between items-center text-xs p-3 bg-slate-50/50 rounded-xl border">
                    <span className="font-bold text-slate-750">{subj}</span>
                    <span className="font-mono text-slate-555">{data.correct} corretas de {data.total} ({pc}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-450 leading-relaxed font-sans max-w-md mx-auto">
            Seus indicadores de desempenho e aproveitamento de vestibular foram recalculados e salvos no seu Painel Principal para balizamento de estudos futuro!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={() => {
                setQuestions([]);
                setQuizFinished(false);
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs py-3.5 rounded-2xl transition shadow-xs"
            >
              Configurar outro simulado
            </button>
            <button
              onClick={() => onNavigateToTab("dashboard")}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-semibold text-xs py-3.5 rounded-2xl transition"
            >
              Ir para o Painel Inicial
            </button>
          </div>

        </div>
      ) : (
        /* Active quiz screen running */
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3.5 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl font-bold">Questão {currentIndex + 1} de {questions.length}</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-150 px-2.5 py-1 rounded-lg font-mono font-bold">{questions[currentIndex].subject || "Questão Integrada"}</span>
            </div>
            
            <span className="text-xs text-slate-500 font-medium">Questões acertadas: {scoreCount}</span>
          </div>

          {/* Active Question Context */}
          <div className="bg-slate-55/80 border border-slate-200 p-5 rounded-2xl text-sm leading-relaxed text-slate-800 font-medium whitespace-pre-wrap font-sans">
            {questions[currentIndex].question}
          </div>

          {/* Options Buttons */}
          <div className="space-y-2.5">
            {questions[currentIndex].options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === questions[currentIndex].correctIndex;
              
              let choiceStyle = "bg-white border-slate-205 text-slate-605 hover:bg-slate-50";
              if (isSelected && !submitted) choiceStyle = "bg-indigo-50/60 border-indigo-400 text-indigo-700 font-bold shadow-xs";
              if (submitted) {
                if (isCorrect) choiceStyle = "bg-emerald-50 border-emerald-450 text-emerald-800 font-bold shadow-sm";
                else if (isSelected) choiceStyle = "bg-red-50 border-red-300 text-red-700 font-bold shadow-sm";
              }

              return (
                <button
                  key={idx}
                  disabled={submitted}
                  onClick={() => setSelectedOption(idx)}
                  className={`w-full p-4 border rounded-xl text-xs text-left leading-relaxed transition ${choiceStyle} flex justify-between items-center`}
                >
                  <span>{option}</span>
                  {submitted && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                  {submitted && isSelected && !isCorrect && <X className="w-4 h-4 text-red-500 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {/* Feedbacks and proceed guides */}
          <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              {!submitted ? (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium font-sans">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Escolha uma alternativa para habilitar a correção oficial do Tutor Vestibular IA.</span>
                </div>
              ) : (
                <div className="bg-indigo-50/40 text-slate-705 border border-indigo-100/70 p-4 rounded-xl text-xs leading-relaxed">
                  <strong className="text-indigo-800 block mb-1">Dica Pedagógica da IA:</strong>
                  {questions[currentIndex].explanation}
                </div>
              )}
            </div>

            <div className="shrink-0 flex gap-2 w-full md:w-auto">
              {!submitted ? (
                <button
                  disabled={selectedOption === null}
                  onClick={handleRegisterAnswer}
                  className="bg-indigo-600 hover:bg-indigo-505 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition w-full shadow-sm"
                >
                  Registrar Resposta
                </button>
              ) : (
                <button
                  onClick={handleNextStep}
                  className="bg-indigo-650 hover:bg-indigo-600 text-white px-6 py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 w-full shadow-sm"
                >
                  <span>{currentIndex === questions.length - 1 ? "Concluir & Ajustar Score" : "Próxima Questão"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

