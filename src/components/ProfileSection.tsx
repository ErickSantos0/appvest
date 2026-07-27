import React, { useState } from "react";
import { UserProfile } from "../types";
import { 
  User, 
  Target, 
  Flame, 
  Award, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  ShieldAlert,
  Save,
  PenTool,
  Trophy
} from "lucide-react";

interface ProfileSectionProps {
  user: UserProfile;
  onUpdateUser: (data: Partial<UserProfile> | any) => void;
}

export default function ProfileSection({ user, onUpdateUser }: ProfileSectionProps) {
  const [userName, setUserName] = useState(user.name);
  const [userTarget, setUserTarget] = useState(user.target);
  const [userDays, setUserDays] = useState(user.targetDaysLeft);
  const [streakDays, setStreakDays] = useState(user.streakDays);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    // Save profile state on the backend
    fetch("/api/user-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: userName,
        target: userTarget,
        targetDaysLeft: userDays,
        streakDays,
      })
    })
    .then(r => r.json())
    .then(updated => {
      onUpdateUser(updated);
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    })
    .catch(err => {
      console.error(err);
      setSaving(false);
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Profile Header card banner */}
      <div className="bg-gradient-to-r from-indigo-50/60 via-white to-white border border-slate-200 p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-5 shadow-sm">
        <img 
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
          alt="Avatar"
          className="w-20 h-20 rounded-full object-cover border-2 border-indigo-300 shadow-sm"
        />
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-xl font-display font-bold text-slate-800">{user.name}</h2>
          <p className="text-xs text-slate-500">Estudante focado em <span className="text-indigo-600 font-bold">{user.target}</span></p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1.5">
            <span className="bg-orange-50 text-orange-600 text-[10px] px-2.5 py-1 rounded-full border border-orange-100 font-bold uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
              {user.streakDays} dias de ofensiva
            </span>
            <span className="bg-amber-50 text-amber-705 text-[10px] px-2.5 py-1 rounded-full border border-amber-200 font-bold uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-600" />
              Nível Diamante
            </span>
          </div>
        </div>
      </div>

      {/* Profile Configuration Form */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-800">Configuração de Perfil</h3>
          <p className="text-xs text-slate-500">Mude seu apelido e prepare seu cronograma de vestibular</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-bold block">Nome / Apelido</label>
              <input 
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-[#1c1e36] focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-bold block">Vestibular Alvo (Metas)</label>
              <input 
                type="text"
                value={userTarget}
                onChange={e => setUserTarget(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                placeholder="Ex: ENEM 2025, FUVEST 2026..."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-bold block">Dias ate a prova</label>
              <input
                type="number"
                min="0"
                value={userDays}
                onChange={e => setUserDays(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-bold block">Dias de ofensiva</label>
              <input
                type="number"
                min="0"
                value={streakDays}
                onChange={e => setStreakDays(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                DADOS SALVOS!
              </span>
            )}
            
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-505 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs px-5 py-3 rounded-2xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Gravando...' : 'Salvar Alterações'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Rewards or achievements lists */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-805">Suas Conquistas Acadêmicas</h3>
          <p className="text-xs text-slate-500">Badges conquistadas completando roteiros de vestibular</p>
        </div>

        <div className="space-y-3 pt-2">
          {[
            { title: "Guerreiro da Disciplina", desc: "Completou 12 dias de ofensiva de estudos contínuos.", unlocked: true },
            { title: "Redator Supremo", desc: "Conseguiu nota superior de 900+ no Corretor de Redação ENEM.", unlocked: user.stats.aiChatsToday > 3 },
            { title: "Matemático Nato", desc: "Resolveu com precisão 10 exercícios de exatas de forma correta.", unlocked: user.stats.exercisesSolved >= 10 },
            { title: "Explorador da Comunidade", desc: "Publicou uma dúvida didática de vestibular no feed público.", unlocked: true }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-2xl flex items-center justify-between border ${
                item.unlocked 
                  ? "bg-slate-50/80 border-indigo-100/40 text-slate-700" 
                  : "bg-slate-50/30 border-slate-200/50 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl ${item.unlocked ? 'bg-indigo-100/60 text-indigo-700' : 'bg-slate-105 text-slate-400'}`}>
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${item.unlocked ? 'text-slate-800' : 'text-slate-400'}`}>{item.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>

              <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${item.unlocked ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-405'}`}>
                {item.unlocked ? "conquistado" : "bloqueado"}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
