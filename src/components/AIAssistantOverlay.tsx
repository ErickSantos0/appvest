import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2, MessageSquare, BookOpen, PenTool, Lightbulb } from "lucide-react";
import { UserProfile } from "../types";

interface AIAssistantOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  initialPrompt: string | null;
  onClearInitialPrompt: () => void;
  onUpdateUser: (data: Partial<UserProfile> | any) => void;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

const CONVERSATION_SUGGESTIONS = [
  { id: "s1", icon: <PenTool className="w-3.5 h-3.5" />, label: "Como citar filósofos na redação?", prompt: "Poderia gerar 3 repertórios de filósofos ou sociólogos que combinam com qualquer tema de redação do ENEM, e como usá-los?" },
  { id: "s2", icon: <Lightbulb className="w-3.5 h-3.5" />, label: "Macete de eletrodinâmica (Física)", prompt: "Explique de forma simples e direta as leis de Ohm em circuitos elétricos, com algum mnemônico para gravar." },
  { id: "s3", icon: <BookOpen className="w-3.5 h-3.5" />, label: "Roteiro de estudos do Modernismo", prompt: "Faça um roteiro de 4 tópicos essenciais sobre o Modernismo brasileiro para a prova de literatura." }
];

export default function AIAssistantOverlay({ 
  isOpen, 
  onClose, 
  user, 
  initialPrompt, 
  onClearInitialPrompt,
  onUpdateUser
}: AIAssistantOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "ai", text: `Olá, ${user.name}! Sou o VestibularTutor da sua IA. Posso tirar dúvidas acadêmicas, dar dicas de redação nota 1000, ou resolver problemas passo a passo. Como posso te auxiliar hoje?` }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chats on changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Handle external prompts (like clicking "Dúvida com IA" in dashboard)
  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
      onClearInitialPrompt();
    }
  }, [initialPrompt, isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const finalMsg = textToSend || inputText;
    if (!finalMsg.trim()) return;

    if (!textToSend) setInputText("");
    
    // Add User Message
    setMessages(prev => [...prev, { sender: "user", text: finalMsg }]);
    setLoading(true);

    // Post to Express backend
    fetch("/api/gemini/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Vestibular Geral",
        concept: "Dúvida Geral de Roteiro",
        userMessage: finalMsg
      })
    })
    .then(r => r.json())
    .then(data => {
      setMessages(prev => [...prev, { sender: "ai", text: data.text || "Sem resposta. Tente formular o conteúdo novamente." }]);
      setLoading(false);
      
      // Increment AI Chats counter dynamically on backend
      fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incrementChat: true })
      }).then(r => r.json()).then(u => onUpdateUser(u));
    })
    .catch(err => {
      console.error(err);
      setMessages(prev => [...prev, { sender: "ai", text: "Erro ao conectar com nosso Tutor Virtual de IA. Verifique as chaves e tente novamente." }]);
      setLoading(false);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 h-[100%] sm:h-[500px] bg-white border border-slate-200 rounded-none sm:rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-in">
      
      {/* Drawer Header */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">VestibularTutor IA</h3>
            <span className="text-[9px] text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded font-bold">ONLINE</span>
          </div>
        </div>

        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scrolling Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((m, idx) => (
          <div 
            key={idx} 
            className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed font-sans font-medium shadow-xs ${
              m.sender === "user" 
                ? "bg-indigo-600 text-white" 
                : "bg-white text-slate-700 border border-slate-200 whitespace-pre-wrap"
            }`}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-500 border border-slate-150 p-4 rounded-2xl flex items-center gap-2 text-xs shadow-xs font-medium">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Pensando na melhor didática...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion prompt bubbles (when no active typing) */}
      {messages.length === 1 && !loading && (
        <div className="px-4 pb-2 space-y-2 bg-slate-50/50">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">Perguntas Frequentes:</div>
          <div className="space-y-1.5">
            {CONVERSATION_SUGGESTIONS.map(sug => (
              <button
                key={sug.id}
                onClick={() => handleSendMessage(sug.prompt)}
                className="w-full bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 border border-slate-200 p-2.5 rounded-xl text-[10px] text-left flex items-center gap-2 transition shadow-xs"
              >
                <div className="p-1 bg-indigo-50 text-indigo-600 rounded animate-none">
                  {sug.icon}
                </div>
                <span className="truncate font-bold">{sug.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Chat Input Footer */}
      <div className="p-3.5 border-t border-slate-150 bg-slate-50 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Tire suas dúvidas do vestibular aqui..."
          onKeyDown={e => {
            if (e.key === "Enter") handleSendMessage();
          }}
          className="flex-1 bg-white border border-slate-200 text-xs px-4 py-3 rounded-2xl focus:outline-none focus:border-indigo-500 text-slate-800 placeholder-slate-450 focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={() => handleSendMessage()}
          className="bg-indigo-600 hover:bg-indigo-505 text-white px-4 rounded-2xl shadow-sm transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
