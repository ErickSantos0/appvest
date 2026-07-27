import React, { useState } from "react";
import { UserProfile, FeedPost } from "../types";
import { 
  Heart, 
  MessageSquare, 
  Plus, 
  Send, 
  Sparkles, 
  Image as ImageIcon, 
  Search, 
  Tag, 
  Loader2, 
  HelpCircle,
  MoreVertical,
  CheckCircle,
  Lightbulb,
  BookOpen
} from "lucide-react";

interface CommunityFeedProps {
  user: UserProfile;
  feed: FeedPost[];
  onUpdateFeed: (updatedFeed: FeedPost[]) => void;
  onUpdateUser: (data: Partial<UserProfile> | any) => void;
}

export default function CommunityFeed({ user, feed, onUpdateFeed, onUpdateUser }: CommunityFeedProps) {
  const [activeSubTab, setActiveSubTab] = useState<"feed" | "explorar" | "minhas">("feed");
  const [searchQuery, setSearchQuery] = useState("");
  
  // New post states
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Motivação");
  const [showAddPost, setShowAddPost] = useState(false);
  const [isAddingPost, setIsAddingPost] = useState(false);

  // Exercise question posting states (optional extra help)
  const [hasExerciseBox, setHasExerciseBox] = useState(false);
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [optE, setOptE] = useState("");
  const [correctOption, setCorrectOption] = useState("A");

  // Comment controls states
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");

  // AI solve doubt state
  const [solvingPostId, setSolvingPostId] = useState<string | null>(null);
  const [solvedSolutions, setSolvedSolutions] = useState<Record<string, string>>({});

  const normalizeCategory = (category: string) =>
    category
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  // 1) Handle Like Post
  const handleLike = (postId: string) => {
    fetch(`/api/feed/${postId}/like`, { method: "POST" })
      .then(r => r.json())
      .then(updatedPost => {
        const newFeed = feed.map(p => p.id === postId ? { ...p, likes: updatedPost.likes, hasLiked: updatedPost.hasLiked } : p);
        onUpdateFeed(newFeed);
      })
      .catch(err => console.error("Error liking:", err));
  };

  // 2) Handle Add Comment
  const handleAddComment = (postId: string) => {
    if (!newCommentText.trim()) return;

    fetch(`/api/feed/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newCommentText })
    })
    .then(r => r.json())
    .then(updatedPost => {
      const newFeed = feed.map(p => p.id === postId ? { ...p, comments: updatedPost.comments } : p);
      onUpdateFeed(newFeed);
      setNewCommentText("");
    })
    .catch(err => console.error("Error commenting:", err));
  };

  // 3) Handle Create Post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsAddingPost(true);

    fetch("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newPostContent,
        category: newPostCategory,
        hasExerciseBox,
        optA,
        optB,
        optC,
        optD,
        optE,
        correctOption
      })
    })
    .then(r => r.json())
    .then(updatedFeedList => {
      onUpdateFeed(updatedFeedList);
      setIsAddingPost(false);
      setShowAddPost(false);
      setNewPostContent("");
      setHasExerciseBox(false);
      setOptA("");
      setOptB("");
      setOptC("");
      setOptD("");
      setOptE("");
    })
    .catch(err => {
      console.error(err);
      setIsAddingPost(false);
    });
  };

  // 4) Solve Pedro's Question or any doubt post with AI Tutor
  const handleSolveWithAI = (post: FeedPost) => {
    setSolvingPostId(post.id);
    const exerciseOptions = post.exerciseData?.options?.length
      ? `\nAlternativas:\n${post.exerciseData.options.join("\n")}\nGabarito cadastrado: ${post.exerciseData.correctAnswer}`
      : "";

    fetch("/api/gemini/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseContext: `${post.content}${exerciseOptions}`
      })
    })
    .then(r => r.json())
    .then(data => {
      setSolvedSolutions(prev => ({ ...prev, [post.id]: data.text }));
      setSolvingPostId(null);
      
      // Increment AI chats today too
      fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incrementChat: true })
      }).then(r => r.json()).then(u => onUpdateUser(u));
    })
    .catch(err => {
      console.error(err);
      setSolvingPostId(null);
    });
  };

  // Filter feed based on sub-tabs and search query
  const filteredFeed = feed.filter(post => {
    // 1. Search Query filter
    if (searchQuery) {
      const matchText = (post.content + " " + post.user.username + " " + post.category).toLowerCase();
      if (!matchText.includes(searchQuery.toLowerCase())) return false;
    }

    // 2. Tab filter
    if (activeSubTab === "minhas") {
      return post.user.username.startsWith(user.name.toLowerCase().substring(0, 4));
    }
    if (activeSubTab === "explorar") {
      return post.likes > 50; // top viral posts
    }
    return true; // general feed
  });  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Category Filter Headers (matching screenshot perfectly) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        
        {/* Navigation Tabs */}
        <div className="flex gap-4">
          {[
            { id: "feed", label: "Feed" },
            { id: "explorar", label: "Explorar" },
            { id: "minhas", label: "Minhas Postagens" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`pb-2.5 px-3 text-sm font-semibold transition tracking-wide border-b-2 ${
                activeSubTab === tab.id 
                  ? "text-indigo-600 border-indigo-600" 
                  : "text-slate-400 border-transparent hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar posts, dúvidas..."
              className="bg-slate-50 border border-slate-200 rounded-2xl w-full pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button 
            onClick={() => setShowAddPost(true)}
            className="p-3 bg-indigo-600 hover:bg-indigo-505 text-white rounded-2xl shadow-sm transition flex items-center justify-center shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Ask / Today Focussing box (Matches the screenshot layout) */}
      <div 
        onClick={() => setShowAddPost(true)}
        className="bg-white border border-slate-200 p-4.5 rounded-3xl flex items-center justify-between cursor-pointer hover:border-indigo-150 transition shadow-sm"
      >
        <div className="flex items-center gap-3.5">
          <img 
            className="w-10 h-10 rounded-full object-cover border border-slate-205"
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="My profile"
          />
          <span className="text-xs text-slate-450 font-medium">No que você está focando hoje?</span>
        </div>

        <div className="flex items-center gap-2">
          <ImageIcon className="w-4.5 h-4.5 text-indigo-500 opacity-60" />
        </div>
      </div>

      {/* Feed Cards List & Solutions */}
      <div className="space-y-5">
        {filteredFeed.length > 0 ? (
          filteredFeed.map((post) => (
            <div key={post.id} className="bg-white border border-slate-205 p-5 rounded-3xl space-y-4 shadow-sm">
              
              {/* Card top banner user */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    className="w-11 h-11 rounded-full object-cover border border-slate-205"
                    src={post.user.avatar} 
                    alt={post.user.username}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{post.user.username}</span>
                      <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                        {post.user.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-450 font-mono mt-0.5 block">{post.timeAgo} • estuda</span>
                  </div>
                </div>

                <button className="text-slate-400 hover:text-slate-650">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Card Main text body */}
              <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-wrap font-sans font-medium">
                {post.content}
              </p>

              {post.isExercise && post.exerciseData && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-black text-indigo-700">
                      Exercicio de {post.exerciseData.subject}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Gabarito informado: {post.exerciseData.correctAnswer}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {post.exerciseData.options.map((option, index) => (
                      <div
                        key={`${post.id}_${index}`}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-700 font-medium leading-relaxed"
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Mock Photo matching julia_studa mock screen */}
              {post.image && (
                <div className="w-full rounded-2xl overflow-hidden mt-3 max-h-80 border border-slate-150">
                  <img 
                    src={post.image} 
                    alt="Study moment"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* If math doubt post, offer a real "Resolve with AI" system helper! */}
              {normalizeCategory(post.category).includes("duvida") && !solvedSolutions[post.id] && (
                <div className="mt-3.5 bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                    <span className="text-[11px] text-slate-650 font-semibold font-sans">Dúvida de Álgebra/Questão. Resolver com Tutor Inteligente de IA?</span>
                  </div>

                  <button
                    onClick={() => handleSolveWithAI(post)}
                    disabled={solvingPostId === post.id}
                    className="bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-[11px] px-4.5 py-2.5 rounded-xl transition flex items-center gap-1 shrink-0 shadow-sm"
                  >
                    {solvingPostId === post.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Resolvendo...</span>
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Resolver com IA</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Display solved AI solution drawer if triggered */}
              {solvedSolutions[post.id] && (
                <div className="mt-4 bg-indigo-50/40 border border-indigo-150 p-5 rounded-2xl space-y-3 shadow-xs animate-slide-in">
                  <div className="flex items-center justify-between border-b border-indigo-100/60 pb-2">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs font-display">
                      <Sparkles className="w-4 h-4" />
                      <span>Resolução Didática do VestibularTutor</span>
                    </div>
                    <button 
                      onClick={() => setSolvedSolutions(prev => {
                        const copy = { ...prev };
                        delete copy[post.id];
                        return copy;
                      })}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-medium"
                    >
                      Ocultar
                    </button>
                  </div>
                  
                  <div className="prose prose-indigo text-xs text-slate-650 leading-relaxed whitespace-pre-wrap font-sans">
                    {solvedSolutions[post.id]}
                  </div>
                </div>
              )}

              {/* Tag bubble */}
              <div className="pt-1 select-none">
                <span className={`text-[9px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                  normalizeCategory(post.category).includes("motiv") ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                  normalizeCategory(post.category).includes("duvida") ? "bg-sky-50 text-sky-700 border border-sky-100" :
                  normalizeCategory(post.category).includes("redacao") ? "bg-rose-50 text-rose-700 border border-rose-105" :
                  "bg-slate-100 text-slate-600 border border-slate-200"
                }`}>
                  {post.category}
                </span>
                <span className="text-[10px] text-slate-400 ml-3 italic">Likes: {post.likes} • {post.comments.length} comentários</span>
              </div>

              {/* Heart Likes and Comment Buttons (matches screenshot) */}
              <div className="flex items-center gap-6 pt-3 border-t border-slate-100 mt-2">
                
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold ${
                    post.hasLiked ? "text-rose-600" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.hasLiked ? "fill-rose-600 text-rose-600" : ""}`} />
                  <span>{post.likes}</span>
                </button>

                <button 
                  onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-605 font-semibold"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{post.comments.length}</span>
                </button>

              </div>

              {/* Comments drawer area */}
              {activeCommentPostId === post.id && (
                <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl space-y-4 animate-slide-in mt-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 border-b border-slate-200/80 pb-2">Comentários:</div>
                  
                  {/* Commments thread */}
                  <div className="space-y-3">
                    {post.comments.map(comment => (
                      <div key={comment.id} className="text-xs">
                        <span className="font-bold text-slate-700 block mb-0.5">@{comment.user}:</span>
                        <p className="text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-150">{comment.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add comment form */}
                  <div className="flex gap-2.5 pt-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                      placeholder="Escreva um comentário de incentivo..."
                      onKeyDown={e => {
                        if (e.key === "Enter") handleAddComment(post.id);
                      }}
                      className="flex-1 bg-white border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="bg-indigo-600 hover:bg-indigo-505 text-white p-2.5 rounded-xl transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs font-semibold">Nenhum post correspondente ao filtro foi encontrado.</div>
        )}
      </div>

      {/* Add New Forum Post Drawer modal */}
      {showAddPost && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-display font-bold text-slate-800">Criar Postagem</h3>
              <button onClick={() => setShowAddPost(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs text-slate-450 font-bold block">Categoria da postagem</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Motivação", "Dúvida", "Redação", "Dica", "Geral"].map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setNewPostCategory(cat)}
                      className={`text-xs px-3.5 py-1.5 rounded-full border transition font-semibold ${
                        newPostCategory === cat 
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-850"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold">No que você está focando hoje?</label>
                <textarea
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  rows={4}
                  placeholder="Escreva aqui suas dúvidas de vestibular, dicas, redações ou conquistas de estudos do dia..."
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Add interactive option to post actual math tests */}
              {newPostCategory === "Dúvida" && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-bold">Adicionar campo de alternativas do exercício?</span>
                    <input 
                      type="checkbox"
                      checked={hasExerciseBox}
                      onChange={e => setHasExerciseBox(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                  </div>

                  {hasExerciseBox && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <input type="text" placeholder="Opção A" value={optA} onChange={e => setOptA(e.target.value)} className="bg-white p-2 rounded-xl border border-slate-200 text-slate-750" />
                      <input type="text" placeholder="Opção B" value={optB} onChange={e => setOptB(e.target.value)} className="bg-white p-2 rounded-xl border border-slate-200 text-slate-755" />
                      <input type="text" placeholder="Opção C" value={optC} onChange={e => setOptC(e.target.value)} className="bg-white p-2 rounded-xl border border-slate-200 text-slate-755" />
                      <input type="text" placeholder="Opção D" value={optD} onChange={e => setOptD(e.target.value)} className="bg-white p-2 rounded-xl border border-slate-200 text-slate-755" />
                      <input type="text" placeholder="Opção E" value={optE} onChange={e => setOptE(e.target.value)} className="bg-white p-2 rounded-xl border border-slate-200 text-slate-755" />
                      <select value={correctOption} onChange={e => setCorrectOption(e.target.value)} className="bg-white p-2 rounded-xl border border-slate-200 text-slate-700 font-semibold">
                        <option value="A">Correta: A</option>
                        <option value="B">Correta: B</option>
                        <option value="C">Correta: C</option>
                        <option value="D">Correta: D</option>
                        <option value="E">Correta: E</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPost(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAddingPost}
                  className="bg-indigo-600 hover:bg-indigo-505 disabled:bg-slate-100 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  {isAddingPost && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Enviar Postagem</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
