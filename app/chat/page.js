"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Send, RotateCcw, MapPin, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
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
  const inputRef = useRef(null);

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
    let cleanedText = text.replace(/\[([^\]]+)\]\s+\((https?:\/\/[^\s)]+)\)/g, '[$1]($2)');
    const parts = cleanedText.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*)/g);
    
    return parts.map((part, index) => {
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
                className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-violet-50 hover:bg-violet-100 text-[#4C1D95] border border-violet-200 rounded-2xl font-bold transition active:scale-95 duration-150 text-sm cursor-pointer select-none"
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
            className="text-[#4C1D95] font-extrabold underline hover:text-[#3b1670] inline-flex items-center transition mx-0.5 cursor-pointer select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <MapPin className="w-3.5 h-3.5 mr-0.5 inline-block" />
            {anchor}
          </a>
        );
      }
      
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
      if (boldMatch) {
        return <strong key={index} className="font-extrabold">{boldMatch[1]}</strong>;
      }
      
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
    
    const currentCount = parseInt(localStorage.getItem('chat_message_count') || '0', 10);
    const isLimitReached = !user && currentCount >= 10;
    if (isLimitReached) {
      setShowLimitModal(true);
      return;
    }
    
    const userMsg = textToSend;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

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
        headers: { 'Content-Type': 'application/json' },
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
    setMessages(prev => {
      const newMsgs = [...prev];
      newMsgs[idx] = { ...newMsgs[idx], feedback: newFeedback };
      return newMsgs;
    });
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

  // ── LOADING SCREEN ──
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-[100dvh] bg-[#F6F7F9] font-sans">
        <div className="relative w-20 h-20 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200 border-t-[#4C1D95] animate-spin"></div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center z-10">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-sm text-slate-400 font-semibold tracking-wide animate-pulse">
          Menghubungkan ke Mebali AI...
        </p>
      </div>
    );
  }

  // ── MAIN CHAT INTERFACE ──
  return (
    <div className="flex flex-col w-full h-[100dvh] min-h-[100dvh] bg-[#F6F7F9] font-sans relative overflow-hidden">
      
      {/* ── HEADER BAR ── */}
      <header className="bg-white/95 backdrop-blur-md px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-2.5 flex items-center justify-between sticky top-0 z-20 border-b border-slate-100">
        <div className="flex items-center space-x-3 flex-1">
          <button 
            onClick={() => router.push('/')} 
            className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform hover:bg-slate-100"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center relative">
              <Sparkles className="w-4.5 h-4.5 text-white" />
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-800 leading-tight">Mebali AI</span>
              <span className="text-[10px] font-semibold text-slate-400 leading-tight">Asisten Wisata Toraja</span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={resetSession} 
            className="text-xs px-3 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-full text-[#4C1D95] font-bold transition flex items-center space-x-1.5 active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Mulai Baru</span>
          </button>
        )}
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-44 no-scrollbar relative">
        
        {/* EMPTY STATE */}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* AI Avatar */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center mb-5">
              <Sparkles className="w-7 h-7 text-white" />
            </div>

            {/* Greeting */}
            <h1 className="text-2xl font-black text-slate-800 text-center tracking-tight mb-1">
              {greeting}, {username || 'Traveler'}
            </h1>
            <p className="text-sm text-slate-400 font-semibold text-center mb-8">
              Tanyakan apa saja tentang wisata Toraja
            </p>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto px-2">
              {suggestions.map((sug, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSend(sug)}
                  className="bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 px-4 py-2.5 rounded-full transition-all duration-150 active:scale-95 cursor-pointer border border-slate-200/80 leading-snug"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── CHAT MESSAGES ── */
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  
                  {/* Bot label */}
                  {msg.role !== 'user' && (
                    <div className="flex items-center space-x-1.5 mb-1 ml-1">
                      <div className="w-4.5 h-4.5 rounded-md bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">Mebali AI</span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#4C1D95] text-white rounded-br-md' 
                      : 'bg-white text-slate-700 border border-slate-200/80 rounded-bl-md'
                  }`}>
                    {renderMessageContent(msg.content)}
                  </div>
                  
                  {/* Feedback Buttons (Logged-in users only) */}
                  {msg.role !== 'user' && user && (
                    <div className="flex items-center space-x-1 mt-1 ml-1">
                      <button 
                        onClick={() => handleFeedback(idx, 'up')} 
                        className={`p-1.5 rounded-lg transition ${
                          msg.feedback === 'up' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'
                        }`} 
                        title="Membantu"
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${msg.feedback === 'up' ? 'fill-current' : ''}`} />
                      </button>
                      <button 
                        onClick={() => handleFeedback(idx, 'down')} 
                        className={`p-1.5 rounded-lg transition ${
                          msg.feedback === 'down' 
                            ? 'bg-rose-50 text-rose-500' 
                            : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'
                        }`} 
                        title="Kurang Tepat"
                      >
                        <ThumbsDown className={`w-3.5 h-3.5 ${msg.feedback === 'down' ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  )}
                  
                  {/* Feedback Form */}
                  {activeFeedbackIdx === idx && (
                    <div className="mt-2 ml-1 p-3 bg-white border border-slate-200/80 rounded-xl animate-in fade-in slide-in-from-top-1 w-full min-w-[250px]">
                      <p className="text-xs font-bold text-slate-500 mb-1.5">
                        {msg.feedback === 'up' ? 'Apa yang Anda sukai dari jawaban ini?' : 'Apa yang bisa kami perbaiki?'}
                      </p>
                      <textarea 
                        rows={2}
                        className="w-full text-sm text-slate-800 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4C1D95] transition resize-none placeholder:text-slate-400"
                        placeholder="Tulis masukan Anda di sini (opsional)..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                      ></textarea>
                      <div className="flex justify-end mt-2 space-x-2">
                        <button 
                          onClick={() => setActiveFeedbackIdx(null)}
                          className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition"
                        >
                          Batal
                        </button>
                        <button 
                          onClick={() => submitFeedback(idx)}
                          className="px-3 py-1 text-xs font-bold bg-[#4C1D95] hover:bg-[#3b1670] text-white rounded-lg transition"
                        >
                          Kirim
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="flex flex-col items-start max-w-[85%]">
                  <div className="flex items-center space-x-1.5 mb-1 ml-1">
                    <div className="w-4.5 h-4.5 rounded-md bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">Mebali AI</span>
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-md px-5 py-4">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* ── BOTTOM INPUT AREA ── */}
      <div 
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gradient-to-t from-[#F6F7F9] via-[#F6F7F9] to-transparent pt-5 pb-[calc(env(safe-area-inset-bottom)+12px)] px-4 flex flex-col space-y-2.5 z-40"
      >
        {/* Guest Limit Badge */}
        {!user && (
          <div className="w-full bg-violet-50 border border-violet-200 rounded-2xl px-4 py-2.5 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs font-bold text-[#4C1D95] flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Kuota Chat Gratis: {messageCount}/10
            </p>
            {messageCount >= 10 ? (
              <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                Batas tercapai. Silakan daftar untuk lanjut mengobrol tanpa batas.
              </p>
            ) : (
              <p className="text-[10px] text-slate-500 mt-0.5">
                {10 - messageCount} pesan gratis tersisa
              </p>
            )}
          </div>
        )}

        {/* Input Bar */}
        <div className={`flex items-end space-x-2.5 w-full rounded-[26px] border px-4 py-2 ${
          (!user && messageCount >= 10) 
            ? 'bg-slate-100 border-slate-200' 
            : 'bg-white border-slate-200/80'
        }`}>
          <textarea 
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={!user && messageCount >= 10}
            placeholder={(!user && messageCount >= 10) ? "Daftar untuk lanjut mengobrol..." : "Tanya tentang Toraja..."}
            rows={1}
            className="flex-1 bg-transparent text-sm font-medium text-slate-800 focus:outline-none placeholder:text-slate-400 disabled:text-slate-400 resize-none py-1.5 max-h-[120px] leading-relaxed no-scrollbar"
          />
          
          {/* Send Button */}
          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim() || (!user && messageCount >= 10)}
            className="bg-[#4C1D95] hover:bg-[#3b1670] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full p-2 transition active:scale-90 flex items-center justify-center cursor-pointer select-none flex-shrink-0"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── PAYWALL LIMIT MODAL ── */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-800 leading-snug">Kuota Obrolan Habis</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Anda telah menggunakan 10 kuota obrolan gratis. Daftar atau masuk akun untuk melanjutkan konsultasi wisata tanpa batas.
              </p>
            </div>
            <div className="flex flex-col w-full gap-2.5">
              <button
                onClick={() => router.push('/register')}
                className="w-full py-3.5 bg-[#4C1D95] hover:bg-[#3b1670] text-white font-bold rounded-2xl text-sm transition active:scale-[0.98] cursor-pointer"
              >
                Daftar Akun Gratis
              </button>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold rounded-2xl text-sm transition active:scale-[0.98] cursor-pointer"
              >
                Masuk Ke Akun
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 pt-1 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
