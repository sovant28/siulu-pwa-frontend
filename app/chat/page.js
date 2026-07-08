"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Send, RotateCcw, MapPin, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';
import { fetchDestinationsData } from '../utils/fetchHelper';

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
  const [spots, setSpots] = useState([]);

  // Fetch all destinations/spots for dynamic context-aware suggestions
  useEffect(() => {
    const loadSpots = async () => {
      try {
        const data = await fetchDestinationsData();
        setSpots(data || []);
      } catch (err) {
        console.error("Gagal memuat spots untuk chat suggestions:", err);
      }
    };
    loadSpots();
  }, []);

  const generateQuestion = (spot) => {
    const name = spot.nama_tempat;
    const cat = spot.kategori;
    const isFood = spot.id?.startsWith('FOOD-') || spot.informasi_biaya?.jenis === 'makanan_khas';

    if (cat === 'kuliner') {
      if (isFood) {
        const options = [
          `Tentang makanan ${name}`,
          `Cara membuat ${name}`,
          `Bahan utama ${name}`
        ];
        return options[Math.floor(Math.random() * options.length)];
      } else {
        const options = [
          `Menu andalan di ${name}`,
          `Jam buka ${name}`,
          `Lokasi ${name}`
        ];
        return options[Math.floor(Math.random() * options.length)];
      }
    } else if (cat === 'akomodasi') {
      const options = [
        `Fasilitas di ${name}`,
        `Berapa tarif kamar ${name}`,
        `Lokasi penginapan ${name}`
      ];
      return options[Math.floor(Math.random() * options.length)];
    } else if (cat === 'event') {
      const options = [
        `Jadwal acara ${name}`,
        `Lokasi pelaksanaan ${name}`,
        `Informasi tiket ${name}`
      ];
      return options[Math.floor(Math.random() * options.length)];
    } else {
      const options = [
        `Sejarah singkat ${name}`,
        `Tiket masuk ${name}`,
        `Aturan berkunjung ke ${name}`
      ];
      return options[Math.floor(Math.random() * options.length)];
    }
  };

  const updateSuggestions = (query, reply, spotsList) => {
    const listToUse = spotsList || spots;
    if (!listToUse || listToUse.length === 0) return;
    
    const text = ((query || "") + " " + (reply || "")).toLowerCase();
    let detectedCategory = 'destinasi'; // default
    
    // Categorize based on keywords
    if (/kuliner|makanan|makan|minum|kopi|kafe|cafe|restoran|lapar|papiong|tori|deppa/i.test(text)) {
      detectedCategory = 'kuliner';
    } else if (/hotel|penginapan|homestay|wisma|menginap|kamar|tidur/i.test(text)) {
      detectedCategory = 'akomodasi';
    } else if (/event|acara|rambu solo|ritual|festival|jadwal|tanggal|upacara/i.test(text)) {
      detectedCategory = 'event';
    }
    
    // Filter spots by category
    let filtered = [];
    if (detectedCategory === 'kuliner') {
      filtered = listToUse.filter(s => s.kategori === 'kuliner');
    } else if (detectedCategory === 'akomodasi') {
      filtered = listToUse.filter(s => s.kategori === 'akomodasi');
    } else if (detectedCategory === 'event') {
      filtered = listToUse.filter(s => s.kategori === 'event');
    } else {
      filtered = listToUse.filter(s => s.kategori === 'alam' || s.kategori === 'budaya_religi');
    }
    
    // Fallback to general spots if none found
    if (filtered.length === 0) {
      filtered = listToUse.filter(s => s.kategori === 'alam' || s.kategori === 'budaya_religi');
    }
    
    // Shuffle and pick 3 spots
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const selectedSpots = shuffled.slice(0, 3);
    const newSuggestions = selectedSpots.map(spot => generateQuestion(spot));
    
    if (newSuggestions.length > 0) {
      setSuggestions(newSuggestions);
    }
  };
  
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
        const { data: botData, error: botErr } = await supabase
          .from('bots')
          .select('*')
          .eq('is_active', true)
          .maybeSingle();

        if (!botErr && botData) {
          setActiveBot(botData);
        }
      } catch (e) {
        console.error("Failed to fetch bots via Supabase:", e);
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
    "Tips berkunjung ke Makam Batu Lemo",
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
      const { data, error } = await supabase
        .from('chat_logs_temporary')
        .select('user_query, ai_response, feedback_type, feedback_note')
        .eq('session_id', sid)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const history = [];
        data.forEach(row => {
          if (row.user_query) {
            history.push({
              role: 'user',
              content: row.user_query
            });
          }
          if (row.ai_response) {
            history.push({
              role: 'model',
              content: row.ai_response,
              feedback_type: row.feedback_type,
              feedback_note: row.feedback_note
            });
          }
        });

        let lastChips = null;
        let lastUserQuery = "";
        let lastBotResponse = "";
        const formatted = history.map(msg => {
          const parsed = parseSuggestions(msg.content);
          if (msg.role !== 'user' && parsed.chips) lastChips = parsed.chips;
          if (msg.role === 'user') lastUserQuery = msg.content;
          else lastBotResponse = parsed.cleanText;
          return {
            role: msg.role === 'user' ? 'user' : 'bot',
            content: parsed.cleanText,
            feedback: msg.feedback_type || null,
            feedbackSubmitted: !!msg.feedback_type
          };
        }).filter(msg => !(msg.role === 'bot' && msg.content && msg.content.includes('Kurresumanga')));
        
        setMessages(formatted);
        if (lastChips && lastChips.length > 0) {
          setSuggestions(lastChips);
        } else if (lastUserQuery || lastBotResponse) {
          updateSuggestions(lastUserQuery, lastBotResponse);
        }
      }
    } catch (err) {
      console.error("Failed to load chat history via Supabase:", err);
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
          const { data: botData, error: botErr } = await supabase
            .from('bots')
            .select('*')
            .eq('is_active', true)
            .maybeSingle();

          if (!botErr && botData) {
            setActiveBot(botData);
            botToUse = botData;
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
        if (parsed.chips && parsed.chips.length > 0) {
          setSuggestions(parsed.chips);
        } else {
          updateSuggestions(userMsg, parsed.cleanText);
        }
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
      const query = params.get('q') || params.get('prompt');
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
        "Tips berkunjung ke Makam Batu Lemo",
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
              <span className="text-[10px] font-semibold text-slate-400 leading-tight">Asisten Wisata Tana Toraja</span>
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
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+180px)] no-scrollbar relative">
        
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
              Tanyakan apa saja tentang wisata Tana Toraja
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
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+68px)] left-0 right-0 max-w-md mx-auto bg-gradient-to-t from-[#F6F7F9] via-[#F6F7F9] to-transparent pt-5 pb-3 px-4 flex flex-col space-y-2.5 z-40"
      >
        {/* Suggestion questions when there are messages */}
        {messages.length > 0 && suggestions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none flex-nowrap scroll-smooth flex-shrink-0 snap-x">
            {suggestions.map((sug, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(sug)}
                disabled={loading || (!user && messageCount >= 10)}
                className="bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 px-3.5 py-2.5 rounded-full transition-all duration-150 active:scale-95 cursor-pointer border border-slate-200/80 leading-snug whitespace-nowrap snap-start flex-shrink-0 select-none outline-none disabled:opacity-50 disabled:active:scale-100"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {sug}
              </button>
            ))}
          </div>
        )}

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
            placeholder={(!user && messageCount >= 10) ? "Daftar untuk lanjut mengobrol..." : "Tanya tentang Tana Toraja..."}
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

      {/* BOTTOM NAVIGATION */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+6px)] flex justify-between items-center z-50 rounded-t-3xl select-none"
      >
        {/* Rainbow Gradient Definition for AI Icon */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <defs>
            <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>

        {/* 1. Beranda */}
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" d="M17.7218 8.08382L14.7218 5.29811C13.4309 4.09937 12.7854 3.5 12 3.5C11.2146 3.5 10.5691 4.09937 9.2782 5.29811L6.2782 8.08382C5.64836 8.66867 5.33345 8.96109 5.16672 9.34342C5 9.72575 5 10.1555 5 11.015V16.9999C5 18.8856 5 19.8284 5.58579 20.4142C6.17157 20.9999 7.11438 20.9999 9 20.9999H9.75V16.9999C9.75 15.7573 10.7574 14.7499 12 14.7499C13.2426 14.7499 14.25 15.7573 14.25 16.9999V20.9999H15C16.8856 20.9999 17.8284 20.9999 18.4142 20.4142C19 19.8284 19 18.8856 19 16.9999L19 11.015C19 10.1555 19 9.72575 18.8333 9.34342C18.6666 8.96109 18.3516 8.66866 17.7218 8.08382Z" fill="currentColor"></path> 
              <path d="M19 9L19 17C19 18.8856 19 19.8284 18.4142 20.4142C17.8284 21 16.8856 21 15 21L14 21L10 21L9 21C7.11438 21 6.17157 21 5.58579 20.4142C5 19.8284 5 18.8856 5 17L5 9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"></path> 
              <path d="M3 11L7.5 7L10.6713 4.18109C11.429 3.50752 12.571 3.50752 13.3287 4.18109L16.5 7L21 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
              <path d="M10 21V17C10 15.8954 10.8954 15 12 15V15C13.1046 15 14 15.8954 14 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Beranda</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 2. Jelajah */}
        <button
          onClick={() => router.push('/destinasi')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" fillRule="evenodd" clipRule="evenodd" d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21ZM14.149 15.1848C13.4576 17.1053 10.6665 16.8584 10.323 14.8464C10.2169 14.2248 9.72996 13.7379 9.10837 13.6318C7.09631 13.2882 6.84941 10.4971 8.76993 9.80572L12.6761 8.39948C14.4674 7.75462 16.2001 9.48732 15.5553 11.2786L14.149 15.1848Z" fill="currentColor"></path> 
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"></path> 
              <path d="M13.9137 15.1001L15.32 11.1939C15.8932 9.60167 14.353 8.06149 12.7608 8.6347L8.85455 10.0409C7.1758 10.6453 7.39162 13.085 9.15038 13.3853C9.87655 13.5093 10.4454 14.0781 10.5694 14.8043C10.8696 16.5631 13.3094 16.7789 13.9137 15.1001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Jelajah</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 3. Tanya AI (Active) */}
        <button
          onClick={() => router.push('/chat')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-900 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" d="M21 12.1818L16.9354 13.6599C16.3462 13.8741 15.8916 14.3521 15.7073 14.9513L14.1538 20C14.1072 20.1515 13.8928 20.1515 13.8461 20L12.2927 14.9513C12.1083 14.3521 11.6537 13.8741 11.0646 13.6599L6.99999 12.1818C6.83019 12.1201 6.83019 11.8799 6.99999 11.8182L11.0646 10.3401C11.6537 10.1259 12.1083 9.64786 12.2927 9.04872L13.8461 4C13.8928 3.8485 14.1072 3.8485 14.1538 4L15.7073 9.04872C15.8916 9.64786 16.3462 10.1259 16.9354 10.3401L21 11.8182C21.1698 11.8799 21.1698 12.1201 21 12.1818Z" fill="url(#rainbow-gradient)"></path> 
              <path d="M21 12.1818L16.9354 13.6599C16.3462 13.8741 15.8916 14.3521 15.7073 14.9513L14.1538 20C14.1072 20.1515 13.8928 20.1515 13.8461 20L12.2927 14.9513C12.1083 14.3521 11.6537 13.8741 11.0646 13.6599L6.99999 12.1818C6.83019 12.1201 6.83019 11.8799 6.99999 11.8182L11.0646 10.3401C11.6537 10.1259 12.1083 9.64786 12.2927 9.04872L13.8461 4C13.8928 3.8485 14.1072 3.8485 14.1538 4L15.7073 9.04872C15.8916 9.64786 16.3462 10.1259 16.9354 10.3401L21 11.8182C21.1698 11.8799 21.1698 12.1201 21 12.1818Z" stroke="url(#rainbow-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
              <path d="M3.75 5.25C4.22214 5.40738 4.59262 5.77786 4.75 6.25C4.83008 6.49025 5.16992 6.49025 5.25 6.25C5.40738 5.77786 5.77786 5.40738 6.25 5.25C6.49025 5.16992 6.49025 4.83008 6.25 4.75C5.77786 4.59262 5.40738 4.22214 5.25 3.75C5.16992 3.50975 4.83008 3.50975 4.75 3.75C4.59262 4.22214 4.22214 4.59262 3.75 4.75C3.50975 4.83008 3.50975 5.16992 3.75 5.25Z" stroke="url(#rainbow-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
              <path d="M7.25 19.25C6.77786 19.4074 6.40738 19.7779 6.25 20.25C6.16992 20.4903 5.83008 20.4903 5.75 20.25C5.59262 19.7779 5.22214 19.4074 4.75 19.25C4.50975 19.1699 4.50975 18.8301 4.75 18.75C5.22214 18.5926 5.59262 18.2221 5.75 17.75C5.83008 17.5097 6.16992 17.5097 6.25 17.75C6.40738 18.2221 6.77786 18.5926 7.25 18.75C7.49025 18.8301 7.49025 19.1699 7.25 19.25Z" stroke="url(#rainbow-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Tanya AI</span>
          <div className="h-1 w-1 rounded-full bg-slate-900 mt-1" />
        </button>

        {/* 4. Disimpan */}
        <button
          onClick={() => router.push('/saved')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" d="M4.8824 12.9557L10.5021 19.3071C11.2981 20.2067 12.7019 20.2067 13.4979 19.3071L19.1176 12.9557C20.7905 11.0649 21.6596 8.6871 20.4027 6.41967C18.9505 3.79992 16.2895 3.26448 13.9771 5.02375C13.182 5.62861 12.5294 6.31934 12.2107 6.67771C12.1 6.80224 11.9 6.80224 11.7893 6.67771C11.4706 6.31934 10.818 5.62861 10.0229 5.02375C7.71053 3.26448 5.04945 3.79992 3.59728 6.41967C2.3404 8.6871 3.20947 11.0649 4.8824 12.9557Z" fill="currentColor"></path> 
              <path d="M4.8824 12.9557L10.5021 19.3071C11.2981 20.2067 12.7019 20.2067 13.4979 19.3071L19.1176 12.9557C20.7905 11.0649 21.6596 8.6871 20.4027 6.41967C18.9505 3.79992 16.2895 3.26448 13.9771 5.02375C13.182 5.62861 12.5294 6.31934 12.2107 6.67771C12.1 6.80224 11.9 6.80224 11.7893 6.67771C11.4706 6.31934 10.818 5.62861 10.0229 5.02375C7.71053 3.26448 5.04945 3.79992 3.59728 6.41967C2.3404 8.6871 3.20947 11.0649 4.8824 12.9557Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Tersimpan</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 5. Profil */}
        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" fillRule="evenodd" clipRule="evenodd" d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 16.3106 20.4627 18.6515 18.5549 19.8557L18.2395 18.878C17.9043 17.6699 17.2931 16.8681 16.262 16.3834C15.2532 15.9092 13.8644 15.75 12 15.75C10.134 15.75 8.74481 15.922 7.73554 16.4097C6.70593 16.9073 6.09582 17.7207 5.7608 18.927L5.45019 19.8589C3.53829 18.6556 3 16.3144 3 12ZM8.75 10C8.75 8.20507 10.2051 6.75 12 6.75C13.7949 6.75 15.25 8.20507 15.25 10C15.25 11.7949 13.7949 13.25 12 13.25C10.2051 13.25 8.75 11.7949 8.75 10Z" fill="currentColor"></path> 
              <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="currentColor" strokeWidth="2"></path> 
              <path d="M15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10Z" stroke="currentColor" strokeWidth="2"></path> 
              <path d="M6 19C6.63819 16.6928 8.27998 16 12 16C15.72 16 17.3618 16.6425 18 18.9497" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Akun</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>
      </nav>

    </div>
  );
}
