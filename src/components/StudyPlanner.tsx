import React, { useState } from "react";
import { UserProfile, StudyReminder } from "../types";
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  BookOpen, 
  TrendingUp, 
  Award,
  Plus,
  BookMarked
} from "lucide-react";

interface StudyPlannerProps {
  user: UserProfile;
  onUpdateUser: (data: Partial<UserProfile> | any) => void;
  onNavigateToTab: (tab: string) => void;
}

interface PlanActivity {
  time: string;
  subject: string;
  topic: string;
  type: string;
  detail: string;
  color?: string;
}

interface WeeklyDayPlan {
  day: string;
  activities: PlanActivity[];
}

interface GeneratedPlan {
  summary: string;
  weeklyPlan: WeeklyDayPlan[];
  tips: string[];
}

export default function StudyPlanner({ user, onUpdateUser, onNavigateToTab }: StudyPlannerProps) {
  const [hoursPerDay, setHoursPerDay] = useState<number>(4);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(Object.keys(user.performance).slice(0, 2));
  const [isGenerating, setIsGenerating] = useState(false);
  const [planResult, setPlanResult] = useState<GeneratedPlan | null>(null);
  const [savedToCalendar, setSavedToCalendar] = useState(false);

  const availableSubjects = Object.keys(user.performance);

  const handleSubjectToggle = (subj: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subj) 
        ? prev.filter(s => s !== subj) 
        : [...prev, subj]
    );
  };

  const handleGeneratePlan = () => {
    if (selectedSubjects.length === 0) {
      alert("Selecione pelo menos uma matéria para focar!");
      return;
    }
    setIsGenerating(true);
    setPlanResult(null);
    setSavedToCalendar(false);

    fetch("/api/gemini/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hoursPerDay,
        focusSubjects: selectedSubjects,
        performance: user.performance
      })
    })
    .then(r => r.json())
    .then((data: GeneratedPlan) => {
      setPlanResult(data);
      setIsGenerating(false);

      // Increment AI Chat interactions to reward user dynamic progress
      fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incrementChat: true })
      }).then(r => r.json()).then(updated => onUpdateUser(updated));
    })
    .catch(err => {
      console.error("Error generating study plan:", err);
      setIsGenerating(false);
      alert("Erro de comunicação com a IA. Por favor, tente novamente.");
    });
  };

  const handleApplyToReminders = () => {
    if (!planResult) return;
    
    // Select one crucial activity per day to map to user reminders to avoid flooding, or add a few
    const promises = planResult.weeklyPlan.slice(0, 3).map((dayPlan, idx) => {
      const activity = dayPlan.activities[0];
      if (!activity) return Promise.resolve();

      const calculatedDaysFromNow = idx + 1;
      const dateLabel = `Em ${calculatedDaysFromNow} dias`;
      
      return fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminder: {
            title: `[IA] Estudar ${activity.subject}: ${activity.topic}`,
            datetime: `${dayPlan.day} • ${activity.time}`,
            dateLabel: dateLabel,
            type: "compromisso"
          }
        })
      });
    });

    Promise.all(promises)
      .then(() => fetch("/api/user-profile").then(r => r.json()))
      .then(updated => {
        onUpdateUser(updated);
        setSavedToCalendar(true);
      })
      .catch(err => console.error("Error committing reminders:", err));
  };

  // Find user's weakest subjects (under 55%) to auto-select or suggest focus
  const weakSubjects = Object.entries(user.performance)
    .filter(([_, val]) => val < 55)
    .map(([subj]) => subj);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          <span>Planejador de Estudos Adaptativo</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Informe sua rotina semanal e prioridades de vestibulares. Nossa Inteligência Artificial cruzará seu aproveitamento histórico atual para calibrar um cronograma otimizado em minutos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Option Configuration Form (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-3xl space-y-6 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Configuração de Rotina</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Defina as bases do seu calendário de estudos</p>
          </div>

          {/* Time select slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-650 flex items-center gap-1">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Horas Disponíveis Diárias</span>
              </span>
              <span className="font-black text-indigo-750 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{hoursPerDay}h por dia</span>
            </div>
            
            <input 
              type="range"
              min="1"
              max="10"
              value={hoursPerDay}
              onChange={e => setHoursPerDay(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>1 hora</span>
              <span>5 horas</span>
              <span>10 horas</span>
            </div>
          </div>

          {/* Weak subjects helper notice if available */}
          {weakSubjects.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Disciplinas críticas mapeadas
              </span>
              <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                Seu histórico mostra maior dificuldade em: <strong className="text-slate-850">{weakSubjects.join(", ")}</strong>. Recomendamos incluí-las no foco abaixo.
              </p>
            </div>
          )}

          {/* Focus Subjects Multiple Choice */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-650 block">Matérias para Focar</span>
            
            <div className="grid grid-cols-2 gap-2">
              {availableSubjects.map(sub => {
                const isSelected = selectedSubjects.includes(sub);
                const isWeak = weakSubjects.includes(sub);
                
                return (
                  <button
                    key={sub}
                    onClick={() => handleSubjectToggle(sub)}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition flex items-center justify-between ${
                      isSelected 
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{sub}</span>
                    {isWeak && !isSelected && (
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="Revisão sugerida" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            disabled={isGenerating}
            onClick={handleGeneratePlan}
            className="w-full bg-indigo-600 hover:bg-indigo-505 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Otimizando Cronograma de Estudos...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar Cronograma Adaptativo IA</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output Area: Interactive Weekly Calendar (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {isGenerating ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm min-h-[400px]">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              <div>
                <h4 className="text-base font-bold text-slate-800">Processando Histórico de Notas</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">Cruzando seus erros históricos nas lições para estruturar uma agenda balanceada de revisões espaçadas...</p>
              </div>
            </div>
          ) : planResult ? (
            <div className="space-y-6">
              
              {/* Diagnosis Summary Card */}
              <div className="bg-indigo-50/60 border border-indigo-100 p-5 rounded-3xl space-y-2.5 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                <h4 className="text-xs uppercase tracking-widest font-black text-indigo-700 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Diagnóstico Adaptativo do Tutor IA
                </h4>
                <p className="text-xs text-slate-750 leading-relaxed font-medium">
                  {planResult.summary}
                </p>
                
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-indigo-100/50 gap-3">
                  <span className="text-[10px] text-slate-500 font-semibold italic">Este roteiro prioriza revisões espaçadas de forma personalizada.</span>
                  
                  <button
                    onClick={handleApplyToReminders}
                    disabled={savedToCalendar}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition ${
                      savedToCalendar 
                        ? "bg-emerald-50 border border-emerald-100 text-emerald-700" 
                        : "bg-indigo-600 hover:bg-indigo-505 text-white shadow-xs"
                    }`}
                  >
                    {savedToCalendar ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Cronograma Integrado à Agenda!
                      </span>
                    ) : (
                      "Adicionar Aulas à Lista Recorrente"
                    )}
                  </button>
                </div>
              </div>

              {/* Weekly scheduler body */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Seu Cronograma Semanal Adaptativo:</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {planResult.weeklyPlan.map((dayPlan: WeeklyDayPlan) => (
                    <div 
                      key={dayPlan.day}
                      className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-display font-bold text-xs text-slate-750">{dayPlan.day}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wide">Foco Diário</span>
                      </div>

                      <div className="space-y-3">
                        {dayPlan.activities && dayPlan.activities.map((act, index) => (
                          <div 
                            key={index}
                            className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                              act.color || "bg-slate-50/80 border-slate-150 text-slate-700"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">{act.subject}</span>
                                <h5 className="text-[12px] font-black leading-tight mt-0.5">{act.topic}</h5>
                              </div>
                              <span className="text-[9px] uppercase tracking-wide font-extrabold bg-white/70 border px-1.5 py-0.5 rounded">{act.type}</span>
                            </div>
                            <p className="text-[10px] opacity-80 leading-normal mt-2 italic font-medium">{act.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study tips */}
              <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-3.5 shadow-sm">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recomendações Auxiliares de Desempenho</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {planResult.tips && planResult.tips.map((tip, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex gap-3 text-xs text-slate-650 leading-relaxed font-medium">
                      <span className="text-indigo-600 font-bold">💡</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-5 shadow-sm min-h-[400px]">
              <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-full text-indigo-600 animate-none">
                <Calendar className="w-10 h-10" />
              </div>
              <div className="max-w-sm">
                <h4 className="text-sm font-semibold text-slate-700">Seu Cronograma está Pronto para Ser Gerado</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Configure as matérias que deseja focar e seu tempo disponível na barra lateral à esquerda para gerar seu plano otimizado de aprovação com IA.</p>
              </div>
              <button 
                onClick={handleGeneratePlan}
                className="bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs px-5 py-3 rounded-2xl transition shadow-sm"
              >
                Gerar Cronograma Agora
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
