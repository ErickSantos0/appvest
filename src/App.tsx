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
  MessageSquare,
  BookOpen,
  HelpCircle,
  Loader2,
  Calendar,
  ClipboardList
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
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
        name: "Erick",
        target: "ENEM 2027",
        targetDaysLeft: 184,
        streakDays: 12,
        stats: {
          hoursStudied: "2h 45min",
          exercisesSolved: 28,
          dailyGoalPercent: 60,
          aiChatsToday: 7
        },
        reminders: [],
        performance: {
          "Matemática": 45,
          "Português": 72,
          "Física": 63,
          "História": 58
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

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Iniciando ambiente de estudos Vestibular IA...</p>
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
