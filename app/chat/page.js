"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Send, RotateCcw, Home, Compass, Bookmark, MessageSquare, User, Map, MapPin, Landmark, Utensils, ThumbsUp, ThumbsDown, Heart, Sparkles, Mic, Plus, Image as LucideImage, ChevronsLeft, RotateCw, MoreVertical } from 'lucide-react';

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
  }, []);

  const API_URL = '/api';

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
    "Info Rambu Solo' Sangalla",
    "Toraja Highland Festival 2026",
    "Makam Gua Londa",
    "Makam Tebing Lemo",
    "Agrowisata Pango-Pango",
    "Patung Yesus Buntu Burake"
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
                className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-rose-50 hover:bg-rose-100 text-[#BE1641] border border-[#BE1641]/20 rounded-2xl font-bold transition shadow-sm active:scale-95 duration-150 text-sm cursor-pointer select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <MapPin className="w-4 h-4 text-[#BE1641]" />
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
            className="text-[#BE1641] font-extrabold underline hover:text-[#9A1032] inline-flex items-center transition mx-1 cursor-pointer py-0.5 px-1.5 bg-rose-50/50 rounded hover:bg-rose-50 select-none"
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
            content: parsed.cleanText
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
    if (currentCount >= 15) {
      alert("Batas testing tercapai! Anda telah mencapai batas maksimal 15 pesan.");
      return;
    }
    
    const userMsg = textToSend;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Update count
    const newCount = currentCount + 1;
    localStorage.setItem('chat_message_count', newCount.toString());
    setMessageCount(newCount);

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

  const handleFeedback = (idx, type) => {
    setMessages(prev => {
      const newMsgs = [...prev];
      newMsgs[idx] = { ...newMsgs[idx] };
      
      if (newMsgs[idx].feedback === type) {
        newMsgs[idx].feedback = null;
        setActiveFeedbackIdx(null);
      } else {
        newMsgs[idx].feedback = type;
        if (!newMsgs[idx].feedbackSubmitted) {
          setActiveFeedbackIdx(idx);
          setFeedbackText("");
        }
      }
      return newMsgs;
    });
  };

  const submitFeedback = async (idx) => {
    const msg = messages[idx];
    if (!sessionId) {
      console.error("Sesi obrolan belum terbentuk!");
    } else {
      try {
        const res = await fetch(`${API_URL}/bots/chat-logs/feedback`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: sessionId,
            ai_response: msg.content,
            feedback_type: msg.feedback,
            feedback_note: feedbackText || null
          })
        });

        if (!res.ok) {
          console.error("Gagal mengirim feedback");
        }
      } catch (err) {
        console.error(err);
      }
    }

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
        "Info Rambu Solo' Sangalla",
        "Toraja Highland Festival 2026",
        "Makam Gua Londa",
        "Makam Tebing Lemo",
        "Agrowisata Pango-Pango",
        "Patung Yesus Buntu Burake"
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
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#10B981" />
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
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">AI Chatbot...</h2>
              </div>
            </div>
            <button 
              onClick={resetSession} 
              className="text-sm px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-[#BE1641]/20 rounded-lg text-[#BE1641] font-bold transition flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3 text-[#BE1641]" />
              <span>Reset</span>
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
                {msg.role !== 'user' && (
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
                      className="w-full text-base text-slate-900 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#BE1641] focus:ring-1 focus:ring-[#BE1641] transition resize-none"
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
        {messageCount >= 15 && (
          <div className="w-full bg-rose-50 border border-rose-100 rounded-2xl p-3 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs font-bold text-[#BE1641] flex items-center justify-center gap-1">
              <span>⚠️</span> Batas Testing Chatbot Tercapai
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Anda telah mengirim 15 pesan. Silakan hubungi admin untuk mereset kuota perangkat Anda.
            </p>
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
          <div className={`flex-1 rounded-full px-5 py-2.5 border flex items-center ${messageCount >= 15 ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-200'}`}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={messageCount >= 15}
              placeholder={messageCount >= 15 ? "Batas testing 15 pesan tercapai..." : "Tanya Mebali AI tentang Toraja..."}
              className="w-full bg-transparent text-base font-medium text-slate-800 focus:outline-none placeholder:text-slate-400 placeholder:font-normal disabled:text-slate-400"
            />
          </div>
  
          {/* Send Button */}
          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim() || messageCount >= 15}
            className="bg-black hover:bg-slate-900 disabled:opacity-50 text-white rounded-full p-2.5 transition active:scale-95 flex items-center justify-center cursor-pointer select-none flex-shrink-0"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Send className="w-4.5 h-4.5 fill-current text-white" />
          </button>
        </div>
      </div>

    </div>
  );
}
