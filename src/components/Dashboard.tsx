import React, { useState } from "react";
import { UserProfile, StudyReminder } from "../types";
import { 
  Flame, 
  Target, 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  Calendar, 
  Plus, 
  PenTool, 
  TrendingUp, 
  FileText, 
  Award,
  ChevronRight,
  ClipboardList
} from "lucide-react";

interface DashboardProps {
  user: UserProfile;
  onUpdateUser: (data: Partial<UserProfile> | any) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenQuickAI: (prompt: string) => void;
}

export default function Dashboard({ user, onUpdateUser, onNavigateToTab, onOpenQuickAI }: DashboardProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDatetime, setNewDatetime] = useState("");
  const [newDateLabel, setNewDateLabel] = useState("");
  const [newType, setNewType] = useState("prova");

  const [editGoal, setEditGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(user.target);

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDatetime) return;

    fetch("/api/user-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reminder: {
          title: newTitle,
          datetime: newDatetime,
          dateLabel: newDateLabel || "Em breve",
          type: newType
        }
      })
    })
    .then(r => r.json())
    .then(updated => {
      onUpdateUser(updated);
      setShowAddModal(false);
      setNewTitle("");
      setNewDatetime("");
      setNewDateLabel("");
    })
    .catch(err => console.error("Error adding reminder:", err));
  };

  const handleSaveGoal = () => {
    fetch("/api/user-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: tempGoal })
    })
    .then(r => r.json())
    .then(updated => {
      onUpdateUser(updated);
      setEditGoal(false);
    });
  };

  const nextReminder = user.reminders?.[0];
  const weakestSubject = Object.entries(user.performance).sort((a, b) => a[1] - b[1])[0];

  return (
    <div className="space-y-2.5 md:space-y-4 animate-fade-in pb-2">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-800 tracking-tight leading-tight">
            Bom dia, <span className="text-indigo-600 font-semibold">{user.name}</span>! 👋
          </h1>
          <p className="hidden sm:block text-slate-500 text-xs md:text-sm mt-1 font-sans font-medium">
            Foco hoje, conquista amanhã. Que tal decolar seus estudos?
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-3">
          {/* Streak Badge */}
          <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider -mb-0.5">Ofensiva</div>
              <div className="text-xs font-bold text-slate-700">{user.streakDays} dias seguidos</div>
            </div>
          </div>

          {/* Goal Box */}
          <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm relative group">
            <Target className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider -mb-0.5">Objetivo</div>
              {editGoal ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    value={tempGoal}
                    onChange={e => setTempGoal(e.target.value)}
                    className="bg-slate-55 border border-slate-200 text-xs text-slate-850 rounded px-1.5 w-24 py-0.5 outline-none focus:border-indigo-500"
                    onKeyDown={e => {
                      if (e.key === "Enter") handleSaveGoal();
                    }}
                    autoFocus
                  />
                  <button onClick={handleSaveGoal} className="text-[10px] text-indigo-650 hover:underline">salvar</button>
                </div>
              ) : (
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer" onClick={() => setEditGoal(true)}>
                  <span>{user.target}</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors">✏️</span>
                  <span className="text-[11px] font-normal text-indigo-600">(Faltam {user.targetDaysLeft} dias)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Summary Cards Grid */}
      <div>
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
          <span>Resumo do dia</span>
          <span className="h-px bg-slate-200 flex-1"></span>
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
          
          {/* Card 1: Study hours */}
          <div className="bg-white border border-slate-200 p-2.5 md:p-4 rounded-xl flex items-start gap-2.5 hover:border-slate-350 transition shadow-sm">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg border border-indigo-100/50">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium leading-tight">Horas estudadas</div>
              <div className="text-base md:text-lg font-bold font-display text-slate-800 mt-0.5">{user.stats.hoursStudied}</div>
              <div className="text-[10px] text-indigo-600 font-bold mt-1 uppercase tracking-wide">Líquidas hoje</div>
            </div>
          </div>

          {/* Card 2: Solved Exercises */}
          <div className="bg-white border border-slate-200 p-2.5 md:p-4 rounded-xl flex items-start gap-2.5 hover:border-slate-350 transition shadow-sm">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg border border-blue-100/50">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-slate-500 font-medium leading-tight">Exercícios resolvidos</div>
              <div className="text-base md:text-lg font-bold font-display text-slate-800 mt-0.5">{user.stats.exercisesSolved}</div>
              <button 
                onClick={() => onNavigateToTab("materias")} 
                className="hidden sm:block text-[10px] text-blue-600 font-bold mt-0.5 text-left hover:underline"
              >
                Praticar matérias →
              </button>
            </div>
          </div>

          {/* Card 3: Daily goal bar */}
          <div className="bg-white border border-slate-200 p-2.5 md:p-4 rounded-xl flex items-start gap-2.5 hover:border-slate-350 transition shadow-sm">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg border border-emerald-100/50">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-slate-500 font-medium leading-tight">Meta diária</div>
              <div className="text-base md:text-lg font-bold font-display text-slate-800 mt-0.5">{user.stats.dailyGoalPercent}%</div>
              
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden border border-slate-200/50">
                <div 
                  className="bg-emerald-550 h-full rounded-full transition-all duration-500" 
                  step-id="progress-bar-inner"
                  style={{ width: `${user.stats.dailyGoalPercent}%`, backgroundColor: '#10b981' }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: AI Chats */}
          <div className="bg-white border border-slate-200 p-2.5 md:p-4 rounded-xl flex items-start gap-2.5 hover:border-slate-350 transition shadow-sm">
            <div className="bg-amber-50 text-amber-600 p-2 rounded-lg border border-amber-100/50">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium leading-tight">Tutor Virtual IA</div>
              <div className="text-base md:text-lg font-bold font-display text-slate-800 mt-0.5">{user.stats.aiChatsToday} interações</div>
              <button 
                onClick={() => onOpenQuickAI("Como organizar meus estudos de redação hoje?")}
                className="hidden sm:block text-[10px] text-amber-600 font-bold mt-0.5 text-left hover:underline"
              >
                Conversar com Tutor IA →
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:hidden">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white border border-slate-200 p-3 rounded-xl text-left shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider font-black text-slate-400">Proximo</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xs font-bold text-slate-800 mt-2 leading-tight">
            {nextReminder?.title || "Adicionar compromisso"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 leading-tight">
            {nextReminder?.dateLabel || "Toque para agendar"}
          </div>
        </button>

        <button
          onClick={() => onNavigateToTab("materias")}
          className="bg-white border border-slate-200 p-3 rounded-xl text-left shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider font-black text-slate-400">Foco</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xs font-bold text-slate-800 mt-2 leading-tight">
            {weakestSubject?.[0] || "Materia"}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 leading-tight">
            {weakestSubject ? `${weakestSubject[1]}% de aproveitamento` : "Ver materias"}
          </div>
        </button>
      </div>

      {/* Main Grid: Reminders and Subject Performance */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
        
        {/* Left Column: Reminders / Calendar (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Próximos compromissos</h3>
              <p className="text-xs text-slate-400">Cronograma de provas e simulados</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-100 w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0"
              title="Adicionar compromisso"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[210px] lg:max-h-[230px] overflow-y-auto pr-1">
            {user.reminders && user.reminders.length > 0 ? (
              user.reminders.map((rem: StudyReminder) => (
                <div 
                  key={rem.id} 
                  className="bg-slate-50/60 border border-slate-150 p-3 rounded-xl flex items-center justify-between hover:border-slate-200 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${
                      rem.type === "simulado" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                      rem.type === "prova" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      rem.type === "vestibular" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                      "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">{rem.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{rem.datetime}</p>
                    </div>
                  </div>
                  
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide border ${
                    rem.type === "simulado" ? "bg-indigo-50 border-indigo-100 text-indigo-700" :
                    rem.type === "prova" ? "bg-blue-50 border-blue-100 text-blue-700" :
                    "bg-amber-50 border-amber-100 text-amber-700"
                  }`}>
                    {rem.dateLabel}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">Nenhum compromisso agendado.</div>
            )}
          </div>
        </div>

        {/* Right Column: Performance Indicators (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Seu desempenho por matéria</h3>
            <p className="text-xs text-slate-400">Média geral estimado de acertos</p>
          </div>

          <div className="space-y-2.5 pt-1 max-h-[210px] lg:max-h-[230px] overflow-y-auto pr-1">
            {Object.entries(user.performance).map(([subj, val]) => {
              // Custom colors based on subject name
              const colorClass = 
                subj === "Matemática" ? "bg-indigo-600" :
                subj === "Português" ? "bg-emerald-500" :
                subj === "Física" ? "bg-blue-500" :
                subj === "História" ? "bg-amber-500" :
                subj === "Biologia" ? "bg-teal-500" : "bg-red-500";

              return (
                <div key={subj} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-650">{subj}</span>
                    <span className="font-black text-slate-700">{val}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/40">
                    <div 
                      className={`${colorClass} h-full rounded-full transition-all duration-700`} 
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button 
              onClick={() => onNavigateToTab("materias")}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1 transition border border-slate-200"
            >
              <span>Acessar painel de matérias completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Motivation Box */}
      <div className="hidden relative bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 md:p-5 flex-col md:flex-row items-center justify-between gap-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="space-y-2 z-10 text-center md:text-left">
          <span className="bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-black">Dica da Semana</span>
          <h3 className="text-lg font-bold text-slate-850 mt-2">Dificuldade em organizar seus parágrafos de redação?</h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
            A redação nota 1000 exige um projeto de texto estratégico. Submeta seu ensaio para o nosso Corretor de Redação Especialista do ENEM e descubra instantaneamente suas fragilidades com notas detalhadas em cada competência!
          </p>
        </div>

        <button 
          onClick={() => onNavigateToTab("materias")}
          className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-md shadow-indigo-600/15 text-xs px-6 py-3 rounded-2xl font-bold transition z-10 shrink-0 w-full md:w-auto"
        >
          Corrigir redação com IA
        </button>
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800">Novo Compromisso</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-650">✕</button>
            </div>
            
            <form onSubmit={handleAddReminder} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Nome do Compromisso</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex: Simulado UNICAMP, Prova Extra, Vestibular etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Data e Hora</label>
                <input 
                  type="text" 
                  value={newDatetime}
                  onChange={e => setNewDatetime(e.target.value)}
                  placeholder="Ex: 28 de Junho • 14:00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Contagem Regressiva / Etiqueta</label>
                <input 
                  type="text" 
                  value={newDateLabel}
                  onChange={e => setNewDateLabel(e.target.value)}
                  placeholder="Ex: Em 6 dias, Daqui 3 semanas etc. (opcional)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold block">Tipo</label>
                <select 
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="prova">Prova de Matéria</option>
                  <option value="simulado">Simulado Integrado</option>
                  <option value="vestibular">Dia de Vestibular Oficial</option>
                  <option value="compromisso">Estudos Geral</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-150 hover:bg-slate-200 text-slate-500 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Adicionar Compromisso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
