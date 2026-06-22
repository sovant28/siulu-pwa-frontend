"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Send, RotateCcw, Home, Compass, Bookmark, MessageSquare, User, Map, MapPin, Landmark, Utensils, ThumbsUp, ThumbsDown, Heart, Sparkles, Mic, Plus, Image as LucideImage, ChevronsLeft, RotateCw, MoreVertical } from 'lucide-react';
import { supabase } from '../supabase';

export default function ChatAI() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [activeBot, setActiveBot] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [username, setUsername] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [user, setUser] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  
  // Feedback states
  const [activeFeedbackIdx, setActiveFeedbackIdx] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Selamat Pagi');
    else if (hour < 15) setGreeting('Selamat Siang');
    else if (hour < 18) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');

    const storedName = localStorage.getItem('username') || localStorage.getItem('user_name') || localStorage.getItem('name');
    if (storedName) {
      setUsername(storedName);
    }

    // Check reset parameter
    const params = new URLSearchParams(window.location.search);
    const resetCode = params.get('reset');
    if (resetCode === "SIULURESET") {
      localStorage.setItem('chat_message_count', '0');
      setMessageCount(0);
      alert("Kuota chat testing Anda berhasil di-reset!");
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      const count = parseInt(localStorage.getItem('chat_message_count') || '0', 10);
      setMessageCount(count);
    }

    // Check auth session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setUser(session.user);
        // Set username from metadata if available
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0];
        setUsername(name);
        localStorage.setItem('username', name);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setUser(session.user);
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0];
        setUsername(name);
        localStorage.setItem('username', name);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : '/api';

  useEffect(() => {
    // Fetch available bot first
    const initBotAndSession = async () => {
      try {
        const botRes = await fetch(`${API_URL}/bots/active`);
        if (botRes.ok) {
          const activeBot = await botRes.json();
          if (activeBot) {
            setActiveBot(activeBot);
          }
        }
      } catch (e) {
        console.error("Failed to fetch bots", e);
      }
      
      const savedSession = localStorage.getItem('chat_session_id');
      if (savedSession) {
        setSessionId(savedSession);
        await fetchHistory(savedSession);
      }
      setIsInitializing(false);
    };
    initBotAndSession();
  }, []);

  const [suggestions, setSuggestions] = useState([
    "Tips berkunjung ke Makam Gua Londa",
    "Tiket masuk Patung Yesus Buntu Burake",
    "Negeri di atas awan Pango-Pango",
    "Filosofi pohon Tarra' Makam Bayi Kambira",
    "Penginapan Lemo Coffee & Homestay",
    "Jadwal Upacara Rambu Solo'"
  ]);

  const parseSuggestions = (text) => {
    let cleanText = text;
    let chips = null;
    const regex = /\[SUGGESTIONS:\s*(.*?)\]/i;
    const match = cleanText.match(regex);
    if (match) {
      cleanText = cleanText.replace(regex, '').trim();
      chips = match[1].split(',').map(s => s.trim()).filter(s => s);
    }
    return { cleanText, chips };
  };

  const renderMessageContent = (text) => {
    if (!text) return null;
    
    // Clean any spaces between Markdown link brackets and parentheses:
    // e.g. [Google Maps] (https://...) -> [Google Maps](https://...)
    let cleanedText = text.replace(/\[([^\]]+)\]\s+\((https?:\/\/[^\s)]+)\)/g, '[$1]($2)');
    
    // Split the text by markdown links [text](url) and bold text **bold**
    const parts = cleanedText.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*)/g);
    
    return parts.map((part, index) => {
      // Check if it's a markdown link
      const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (linkMatch) {
        const anchor = linkMatch[1];
        const url = linkMatch[2];
        const isMaps = url.includes('maps.google') || url.includes('google.com/maps') || url.includes('map');
        
        if (isMaps) {
          return (
            <span key={index} className="block my-2.5">
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-violet-50 hover:bg-violet-100 text-[#4C1D95] border border-[#4C1D95]/20 rounded-2xl font-bold transition shadow-sm active:scale-95 duration-150 text-sm cursor-pointer select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <MapPin className="w-4 h-4 text-[#4C1D95]" />
                <span>{anchor}</span>
              </a>
            </span>
          );
        }
        
        return (
          <a 
            key={index} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[#4C1D95] font-extrabold underline hover:text-[#3b1670] inline-flex items-center transition mx-1 cursor-pointer py-0.5 px-1.5 bg-violet-50/50 rounded hover:bg-violet-50 select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <MapPin className="w-3.5 h-3.5 mr-0.5 inline-block" />
            {anchor}
          </a>
        );
      }
      
      // Check if it's bold text
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
      if (boldMatch) {
        return <strong key={index} className="font-extrabold text-slate-900">{boldMatch[1]}</strong>;
      }
      
      // Otherwise, return normal text
      return part.split('\n').map((line, lineIdx, array) => (
        <span key={`${index}-${lineIdx}`}>
          {line}
          {lineIdx < array.length - 1 && <br />}
        </span>
      ));
    });
  };

  const fetchHistory = async (sid) => {
    try {
      const res = await fetch(`${API_URL}/chat/history/${sid}`);
      if (res.ok) {
        const history = await res.json();
        let lastChips = null;
        const formatted = history.map(msg => {
          const parsed = parseSuggestions(msg.content);
          if (msg.role !== 'user' && parsed.chips) lastChips = parsed.chips;
          return {
            role: msg.role === 'user' ? 'user' : 'bot',
            content: parsed.cleanText,
            feedback: msg.feedback_type || null,
            feedbackSubmitted: !!msg.feedback_type
          };
        }).filter(msg => !(msg.role === 'bot' && msg.content.includes('Kurresumanga')));
        
        setMessages(formatted);
        if (lastChips) setSuggestions(lastChips);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (overrideText = null) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : input.trim();
    if (!textToSend) return;
    
    // Check limit
    const currentCount = parseInt(localStorage.getItem('chat_message_count') || '0', 10);
    const isLimitReached = !user && currentCount >= 10;
    if (isLimitReached) {
      setShowLimitModal(true);
      return;
    }
    
    const userMsg = textToSend;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Update count if guest
    if (!user) {
      const newCount = currentCount + 1;
      localStorage.setItem('chat_message_count', newCount.toString());
      setMessageCount(newCount);
    }

    try {
      let botToUse = activeBot;
      if (!botToUse) {
        try {
          const botRes = await fetch(`${API_URL}/bots/active`);
          if (botRes.ok) {
            const botData = await botRes.json();
            if (botData) {
              setActiveBot(botData);
              botToUse = botData;
            }
          }
        } catch (fetchErr) {
          console.error("Gagal memulihkan koneksi bot aktif:", fetchErr);
        }
      }

      if (!botToUse) throw new Error("Bot belum siap");
      
      // format history for backend
      const formattedHistory = messages.filter(m => m.role !== 'bot' || !m.content.includes("Maaf")).map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        content: m.content
      }));

      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = 'session_' + Math.random().toString(36).substring(2, 15);
        setSessionId(currentSessionId);
        localStorage.setItem('chat_session_id', currentSessionId);
      }

      const payload = { 
        message: userMsg,
        history: formattedHistory,
        session_id: currentSessionId
      };

      const res = await fetch(`${API_URL}/bots/${botToUse.id}/chat-rag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        const parsed = parseSuggestions(data.response);
        setMessages(prev => [...prev, { role: 'bot', content: parsed.cleanText }]);
        if (parsed.chips) setSuggestions(parsed.chips);
        if (data.session_id && data.session_id !== sessionId) {
          setSessionId(data.session_id);
          localStorage.setItem('chat_session_id', data.session_id);
        }
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: "Maaf, server sedang sibuk. Coba beberapa saat lagi ya." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'bot', content: "Gagal terhubung ke server Siulu." }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitializing && activeBot) {
      const params = new URLSearchParams(window.location.search);
      const query = params.get('q');
      if (query) {
        window.history.replaceState(null, '', window.location.pathname);
        handleSend(query);
      } else {
        const pendingQuery = localStorage.getItem('pending_ai_query');
        if (pendingQuery) {
          localStorage.removeItem('pending_ai_query');
          handleSend(pendingQuery);
        }
      }
    }
  }, [isInitializing, activeBot]);

  const saveFeedbackToDB = async (aiResponse, feedbackType, note) => {
    if (!user) {
      console.warn("Feedback diblokir: Harus masuk akun terlebih dahulu!");
      return;
    }
    if (!sessionId) {
      console.warn("Sesi obrolan belum terbentuk untuk feedback!");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/bots/chat-logs/feedback`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          ai_response: aiResponse,
          feedback_type: feedbackType,
          feedback_note: note
        })
      });
      if (!res.ok) {
        console.error("Gagal menyimpan feedback di database");
      }
    } catch (err) {
      console.error("Gagal memanggil API feedback:", err);
    }
  };

  const handleFeedback = (idx, type) => {
    const msg = messages[idx];
    const newFeedback = msg.feedback === type ? null : type;
    
    // Update local state
    setMessages(prev => {
      const newMsgs = [...prev];
      newMsgs[idx] = { ...newMsgs[idx], feedback: newFeedback };
      return newMsgs;
    });
    
    // Kirim feedback ke database secara instan
    saveFeedbackToDB(msg.content, newFeedback, msg.feedbackText || null);
    
    if (newFeedback && !msg.feedbackSubmitted) {
      setActiveFeedbackIdx(idx);
      setFeedbackText("");
    } else {
      setActiveFeedbackIdx(null);
    }
  };

  const submitFeedback = async (idx) => {
    const msg = messages[idx];
    
    // Kirim feedback beserta catatan teks ke database
    await saveFeedbackToDB(msg.content, msg.feedback, feedbackText || null);

    setMessages(prev => {
      const newMsgs = [...prev];
      newMsgs[idx] = { ...newMsgs[idx], feedbackText, feedbackSubmitted: true };
      return newMsgs;
    });
    setActiveFeedbackIdx(null);
  };

  const resetSession = () => {
    if (confirm("Mulai percakapan baru? Riwayat chat ini akan di-reset.")) {
      localStorage.removeItem('chat_session_id');
      setSessionId(null);
      setMessages([]);
      setSuggestions([
        "Tips berkunjung ke Makam Gua Londa",
        "Tiket masuk Patung Yesus Buntu Burake",
        "Negeri di atas awan Pango-Pango",
        "Filosofi pohon Tarra' Makam Bayi Kambira",
        "Penginapan Lemo Coffee & Homestay",
        "Jadwal Upacara Rambu Solo'"
      ]);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-[100dvh] bg-white font-sans">
        {/* Logo Box with Spinner */}
        <div className="relative w-20 h-20 flex items-center justify-center mb-5">
          {/* Spinning Outer Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-slate-100 border-t-[#2C2C2E] animate-spin"></div>
          
          {/* Logo square inside */}
          <div className="w-12 h-12 rounded-xl bg-[#2C2C2E] flex items-center justify-center shadow-md z-10">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white text-white">
              <polygon points="12,5 21,19 3,19" className="origin-center rotate-180" />
            </svg>
          </div>
        </div>
        
        {/* Loading Text */}
        <p className="text-sm text-slate-500 font-semibold tracking-wide animate-pulse">
          Menghubungkan ke Mebali AI...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-[100dvh] min-h-[100dvh] bg-white font-sans relative overflow-hidden">
      
      {/* Rainbow Gradient Definition for AI Icon */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* HEADER */}
      <header className="bg-white px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
        {messages.length === 0 ? (
          /* Empty State Header */
          <>
            <div className="flex items-center space-x-3">
              <div 
                onClick={() => router.push('/')}
                className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-200 cursor-pointer active:scale-95 transition flex-shrink-0"
              >
                <Image src="/avatar_v2.png" alt="User Avatar" fill className="object-cover" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Hello {username || 'Traveler'}!
              </h2>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800 active:scale-90 transition-transform hover:bg-slate-100"
              title="Kembali ke Beranda"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <ArrowLeft className="w-4.5 h-4.5 text-slate-800" />
            </button>
          </>
        ) : (
          /* Active Chat Header */
          <>
            <div className="flex items-center space-x-2.5 flex-1">
              <button 
                onClick={() => router.push('/')} 
                className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800 active:scale-90 transition-transform hover:bg-slate-100"
                title="Kembali ke Beranda"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <ArrowLeft className="w-4.5 h-4.5 text-slate-800" />
              </button>
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#2C2C2E] flex items-center justify-center shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white text-white">
                    <polygon points="12,5 21,19 3,19" className="origin-center rotate-180" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Mebali AI</h2>
              </div>
            </div>
            <button 
              onClick={resetSession} 
              className="text-sm px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 border border-[#4C1D95]/20 rounded-lg text-[#4C1D95] font-bold transition flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3 text-[#4C1D95]" />
              <span>Mulai Baru</span>
            </button>
          </>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-white pb-36 relative">
        
        {/* DASHBOARD (Show when chat is empty) */}
        {messages.length === 0 ? (
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="text-center mt-20 mb-10">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">How can I help you?</h1>
            </div>

            <div className="flex flex-wrap justify-center gap-2.5 max-w-sm mx-auto px-2">
              {suggestions.map((sug, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSend(sug)}
                  className="bg-[#F2F2F7] hover:bg-[#E5E5EA] text-base font-semibold text-slate-800 px-5 py-3 rounded-full transition-all duration-150 active:scale-95 cursor-pointer border border-slate-200/10 leading-snug"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* CHAT MESSAGES */
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-3 duration-300`}>
                <div className={`max-w-[80%] rounded-[22px] px-5 py-3.5 text-base leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#F2F2F7] text-slate-900 font-normal' 
                    : 'bg-[#2C2C2E] text-white font-normal'
                }`}>
                  {renderMessageContent(msg.content)}
                </div>
                
                {/* Feedback Buttons for AI */}
                {msg.role !== 'user' && user && (
                  <div className="flex items-center space-x-2 mt-1 ml-1">
                    <button 
                      onClick={() => handleFeedback(idx, 'up')} 
                      className={`p-1.5 rounded-full transition ${
                        msg.feedback === 'up' 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
                      }`} 
                      title="Membantu"
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${msg.feedback === 'up' ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                      onClick={() => handleFeedback(idx, 'down')} 
                      className={`p-1.5 rounded-full transition ${
                        msg.feedback === 'down' 
                          ? 'bg-rose-100 text-rose-600' 
                          : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                      }`} 
                      title="Kurang Tepat"
                    >
                      <ThumbsDown className={`w-3.5 h-3.5 ${msg.feedback === 'down' ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                )}
                
                {/* Feedback Form (Visible when button clicked) */}
                {activeFeedbackIdx === idx && (
                  <div className="mt-2 ml-1 p-3 bg-white border border-slate-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1 w-full min-w-[250px]">
                    <p className="text-sm font-bold text-slate-700 mb-1.5">
                      {msg.feedback === 'up' ? 'Apa yang Anda sukai dari jawaban ini?' : 'Apa yang bisa kami perbaiki?'}
                    </p>
                    <textarea 
                      rows={2}
                      className="w-full text-base text-slate-900 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4C1D95] focus:ring-1 focus:ring-[#4C1D95] transition resize-none"
                      placeholder="Tulis masukan Anda di sini (opsional)..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                    ></textarea>
                    <div className="flex justify-end mt-2 space-x-2">
                      <button 
                        onClick={() => setActiveFeedbackIdx(null)}
                        className="px-3 py-1 text-sm font-bold text-slate-400 hover:text-slate-600 transition"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={() => submitFeedback(idx)}
                        className="px-3 py-1 text-sm font-bold bg-slate-800 hover:bg-black text-white rounded-md transition"
                      >
                        Kirim
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-sm text-slate-500 pl-2 mt-2">
                <span>Searching...</span>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      {/* BOTTOM INPUT AREA */}
      <div 
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100/80 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)] px-4 flex flex-col space-y-3 z-40"
      >
        {!user && (
          <div className="w-full bg-violet-50 border border-violet-100 rounded-2xl p-3 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs font-bold text-[#4C1D95] flex items-center justify-center gap-1">
              <span>⚠️</span> Kuota Chat Gratis: {messageCount}/10
            </p>
            {messageCount >= 10 ? (
              <p className="text-[10px] text-slate-600 mt-1 font-semibold">
                Batas obrolan gratis tercapai. Silakan masuk atau daftar akun untuk melanjutkan obrolan tanpa batas!
              </p>
            ) : (
              <p className="text-[10px] text-slate-600 mt-0.5">
                Anda dapat mengirim {10 - messageCount} pesan gratis lagi sebelum harus mendaftar gratis.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center space-x-3.5 w-full">
          {/* Plus Button */}
          <button 
            onClick={() => alert("Fitur berbagi file segera hadir!")}
            className="text-slate-500 hover:text-slate-700 transition cursor-pointer active:scale-95 flex-shrink-0"
          >
            <Plus className="w-6 h-6" />
          </button>
  
          {/* Image/Gallery Button */}
          <button 
            onClick={() => alert("Fitur unggah gambar segera hadir!")}
            className="text-slate-500 hover:text-slate-700 transition cursor-pointer active:scale-95 flex-shrink-0"
          >
            <LucideImage className="w-6 h-6" />
          </button>
  
          {/* Input Capsule */}
          <div className={`flex-1 rounded-full px-5 py-2.5 border flex items-center ${(!user && messageCount >= 10) ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-200'}`}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={!user && messageCount >= 10}
              placeholder={(!user && messageCount >= 10) ? "Daftar untuk lanjut mengobrol..." : "Tanya Mebali AI tentang Toraja..."}
              className="w-full bg-transparent text-base font-medium text-slate-800 focus:outline-none placeholder:text-slate-400 placeholder:font-normal disabled:text-slate-400"
            />
          </div>
  
          {/* Send Button */}
          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim() || (!user && messageCount >= 10)}
            className="bg-black hover:bg-slate-900 disabled:opacity-50 text-white rounded-full p-2.5 transition active:scale-95 flex items-center justify-center cursor-pointer select-none flex-shrink-0"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Send className="w-4.5 h-4.5 fill-current text-white" />
          </button>
        </div>
      </div>

      {/* Paywall Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center text-[#4C1D95]">
              <Sparkles className="w-6 h-6 fill-current" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 leading-snug">Obrolan AI Terbatas!</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Halo! Anda telah menggunakan 10 kuota obrolan gratis Anda. Silakan masuk atau buat akun baru secara gratis untuk melanjutkan konsultasi wisata tanpa batas.
              </p>
            </div>
            <div className="flex flex-col w-full gap-2.5">
              <button
                onClick={() => router.push('/register')}
                className="w-full py-3.5 bg-[#4C1D95] hover:bg-[#3b1670] text-white font-bold rounded-2xl text-xs transition active:scale-[0.98] cursor-pointer"
              >
                Daftar Akun Baru
              </button>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold rounded-2xl text-xs transition active:scale-[0.98] cursor-pointer"
              >
                Masuk Ke Akun
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 pt-1 transition cursor-pointer"
              >
                Tutup & Lihat Riwayat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
