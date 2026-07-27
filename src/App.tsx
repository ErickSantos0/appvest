import React, { useState, useEffect } from "react";
import { UserProfile, FeedPost } from "./types";
import Dashboard from "./components/Dashboard";
import SubjectSection from "./components/SubjectSection";
import CommunityFeed from "./components/CommunityFeed";
import ProfileSection from "./components/ProfileSection";
import AIAssistantOverlay from "./components/AIAssistantOverlay";
import StudyPlanner from "./components/StudyPlanner";
import AIPersonalizedSimulado from "./components/AIPersonalizedSimulado";
import { 
  LayoutDashboard, 
  BookMarked, 
  Users, 
  User, 
  Sparkles, 
  BookOpen,
  Loader2,
  Calendar,
  ClipboardList,
  CheckCircle
} from "lucide-react";

const SUBJECT_OPTIONS = ["Matemática", "Português", "Física", "Química", "Biologia", "História"];

function calculateDaysLeft(examDate: string) {
  if (!examDate) return 0;
  const today = new Date();
  const target = new Date(`${examDate}T12:00:00`);
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [studentName, setStudentName] = useState("");
  const [targetExam, setTargetExam] = useState("ENEM");
  const [examDate, setExamDate] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(SUBJECT_OPTIONS);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  
  // Floating AI Tutor chat panel state
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);
  const [quickAIPrompt, setQuickAIPrompt] = useState<string | null>(null);

  // Load initial session profiles & community forum feed on start
  useEffect(() => {
    Promise.all([
      fetch("/api/user-profile").then(r => r.json()),
      fetch("/api/feed").then(r => r.json())
    ])
    .then(([profileData, feedData]) => {
      setUserProfile(profileData);
      setFeed(feedData);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Initialization error:", err);
      // Fallback state if server key takes moments to restart
      setUserProfile({
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
          "Física": 0,
          "História": 0,
          "Biologia": 0,
          "Química": 0
        }
      });
      setLoading(false);
    });
  }, []);

  const handleUpdateUserProfile = (updated: UserProfile) => {
    setUserProfile(updated);
  };

  const handleUpdateFeed = (updatedFeed: FeedPost[]) => {
    setFeed(updatedFeed);
  };

  const handleOpenQuickAI = (prompt: string) => {
    setQuickAIPrompt(prompt);
    setIsAIChatOpen(true);
  };

  const toggleOnboardingSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(item => item !== subject)
        : [...prev, subject]
    );
  };

  const handleCompleteOnboarding = (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentName.trim() || selectedSubjects.length === 0) return;

    const performance = selectedSubjects.reduce<Record<string, number>>((acc, subject) => {
      acc[subject] = 0;
      return acc;
    }, {});

    setSavingOnboarding(true);

    fetch("/api/user-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: studentName.trim(),
        target: targetExam.trim() || "Vestibular",
        targetDaysLeft: calculateDaysLeft(examDate),
        onboardingCompleted: true,
        performance,
        resetStats: true
      })
    })
      .then(response => response.json())
      .then(updated => {
        setUserProfile(updated);
        setActiveTab("dashboard");
      })
      .finally(() => setSavingOnboarding(false));
  };

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Iniciando ambiente de estudos Vestibular IA...</p>
      </div>
    );
  }

  if (!userProfile.onboardingCompleted) {
    return (
      <div className="h-dvh bg-slate-50 text-slate-900 font-sans overflow-hidden flex flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-3 shrink-0 shadow-sm">
          <div className="max-w-3xl mx-auto flex items-center gap-2.5">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-sm tracking-tight text-slate-800 uppercase block leading-none">Vestibulares.ai</span>
              <span className="text-[10px] block text-indigo-600 font-medium mt-1 font-mono">Cadastro do estudante</span>
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-5">
          <form onSubmit={handleCompleteOnboarding} className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-7 space-y-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 leading-tight">
                Vamos montar seu plano de estudos do zero
              </h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                O desempenho começa em 0%. Conforme você estudar, resolver questões e gerar simulados, o app atualiza sua evolução.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600">Nome do aluno</span>
                <input
                  value={studentName}
                  onChange={event => setStudentName(event.target.value)}
                  placeholder="Ex: Erick"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  required
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600">Vestibular alvo</span>
                <input
                  value={targetExam}
                  onChange={event => setTargetExam(event.target.value)}
                  placeholder="Ex: ENEM, FUVEST, UNICAMP"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  required
                />
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-bold text-slate-600">Data prevista da prova</span>
                <input
                  type="date"
                  value={examDate}
                  onChange={event => setExamDate(event.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
                />
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Matérias que o aluno vai estudar</h2>
                <p className="text-xs text-slate-500 mt-1">Todas as matérias selecionadas começam com 0% de aproveitamento.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {SUBJECT_OPTIONS.map(subject => {
                  const active = selectedSubjects.includes(subject);
                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleOnboardingSubject(subject)}
                      className={`border rounded-xl px-3 py-3 text-left text-xs font-bold transition flex items-center justify-between gap-2 ${
                        active
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      <span>{subject}</span>
                      {active && <CheckCircle className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingOnboarding || selectedSubjects.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl py-3.5 text-sm font-bold transition flex items-center justify-center gap-2"
            >
              {savingOnboarding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Entrar no painel de estudos</span>
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      
      {/* Upper Navigation Bar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md z-50 px-4 md:px-8 py-2.5 md:py-3 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-sm text-white">
            <BookOpen className="w-5 h-5 font-bold" />
          </div>
          <div className="min-w-0">
            <span className="font-display font-bold text-sm tracking-tight text-slate-800 uppercase block leading-none">Vestibulares.ai</span>
            <span className="text-[10px] block text-indigo-600 font-medium mt-1 font-mono">ENEM & Roteiros Assistidos</span>
          </div>
        </div>

        {/* Quick AI Trigger button */}
        <button 
          onClick={() => setIsAIChatOpen(true)}
          className="bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-100 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm min-w-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span className="leading-tight">Tutor Virtual IA</span>
        </button>
        </div>
      </header>

      {/* Main Screen Layout Container */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-3 md:px-6 py-3 md:py-2 overflow-hidden">
        
        {/* Render Tab Contents smoothly */}
        <div className="h-full overflow-y-auto overflow-x-hidden pr-1">
          {activeTab === "dashboard" && (
            <Dashboard 
              user={userProfile} 
              onUpdateUser={handleUpdateUserProfile} 
              onNavigateToTab={setActiveTab}
              onOpenQuickAI={handleOpenQuickAI}
            />
          )}

          {activeTab === "planejador" && (
            <StudyPlanner 
              user={userProfile} 
              onUpdateUser={handleUpdateUserProfile}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === "simulados" && (
            <AIPersonalizedSimulado 
              user={userProfile} 
              onUpdateUser={handleUpdateUserProfile}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === "materias" && (
            <SubjectSection 
              user={userProfile} 
              onUpdateUser={handleUpdateUserProfile}
              onOpenQuickAI={handleOpenQuickAI}
            />
          )}

          {activeTab === "comunidade" && (
            <CommunityFeed 
              user={userProfile} 
              feed={feed} 
              onUpdateFeed={handleUpdateFeed}
              onUpdateUser={handleUpdateUserProfile}
            />
          )}

          {activeTab === "perfil" && (
            <ProfileSection 
              user={userProfile} 
              onUpdateUser={handleUpdateUserProfile}
            />
          )}
        </div>

      </main>

      {/* Bottom Sticky Tab Navigation Bar (Matches the design screenshot) */}
      <footer className="border-t border-slate-200 bg-white z-40 px-2 py-1 shadow-md shrink-0">
        <div className="max-w-xl mx-auto grid grid-cols-6 gap-1">
          {[
            { id: "dashboard", label: "Painel", icon: <LayoutDashboard className="w-4.5 h-4.5 mb-0.5" /> },
            { id: "planejador", label: "Planejador", icon: <Calendar className="w-4.5 h-4.5 mb-0.5" /> },
            { id: "simulados", label: "Simulados", icon: <ClipboardList className="w-4.5 h-4.5 mb-0.5" /> },
            { id: "materias", label: "Matérias", icon: <BookMarked className="w-4.5 h-4.5 mb-0.5" /> },
            { id: "comunidade", label: "Fórum", icon: <Users className="w-4.5 h-4.5 mb-0.5" /> },
            { id: "perfil", label: "Perfil", icon: <User className="w-4.5 h-4.5 mb-0.5" /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex min-w-0 flex-col items-center justify-center p-1.5 sm:p-2 text-[10px] sm:text-xs font-semibold rounded-xl transition ${
                activeTab === item.id 
                  ? "text-indigo-600 font-bold" 
                  : "text-slate-400 hover:text-slate-650"
              }`}
            >
              {item.icon}
              <span className="font-display tracking-tight text-[9px] min-[380px]:text-[10px] sm:text-[11px] mt-0.5 leading-tight text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </footer>

      {/* Floating Spark Assistant Toggle Hub */}
      <div className="fixed bottom-20 right-6 z-40 hidden md:block">
        <button
          onClick={() => setIsAIChatOpen(prev => !prev)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full w-14 h-14 shadow-xl shadow-indigo-600/10 active:scale-95 transition flex items-center justify-center"
          title="Tirar dúvida com IA Tutor"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>

      {/* Floating Portal AI Overlay Companion */}
      <AIAssistantOverlay
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        user={userProfile}
        initialPrompt={quickAIPrompt}
        onClearInitialPrompt={() => setQuickAIPrompt(null)}
        onUpdateUser={handleUpdateUserProfile}
      />

    </div>
  );
}
