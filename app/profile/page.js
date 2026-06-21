"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Globe,
  Shield,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Home,
  Compass,
  MessageSquare,
  Heart,
  Edit2,
  Check,
  X,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("Amelia");
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem('username') || localStorage.getItem('user_name') || localStorage.getItem('name');
    if (storedName) {
      setUsername(storedName);
    }
  }, []);

  const startEditing = () => {
    setTempName(username);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveName = () => {
    if (tempName.trim()) {
      setUsername(tempName.trim());
      localStorage.setItem('username', tempName.trim());
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('user_name');
    localStorage.removeItem('name');
    setUsername("Amelia");
    router.push('/');
  };

  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F6F7F9] font-sans pb-[calc(env(safe-area-inset-bottom)+76px)] relative overflow-x-hidden">
      
      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 px-6 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 flex flex-col space-y-4 backdrop-blur-md border-b border-slate-100/30">
        {/* Row 1: Logo */}
        <div className="text-center w-full">
          <span className="text-3xl font-black text-[#BE1641] tracking-tight select-none">siulu</span>
        </div>

        {/* Row 2: Back Button & Page Title */}
        <div className="grid grid-cols-3 items-center w-full">
          <button
            onClick={() => router.push('/')}
            className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800 active:scale-90 transition-transform hover:bg-slate-100 justify-self-start"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ArrowLeft className="w-4.5 h-4.5 text-slate-800" />
          </button>
          <span className="text-lg font-black text-slate-800 text-center select-none whitespace-nowrap">
            Profil Saya
          </span>
          <div className="w-9 h-9 justify-self-end" />
        </div>
      </header>

      {/* ── CONTENT AREA ── */}
      <div className="px-6 mt-6 flex-grow space-y-6">
        
        {/* Amelia's User Card */}
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm mb-4 bg-slate-50">
            <Image src="/avatar_v2.png" alt="User Avatar" fill className="object-cover" />
          </div>
          
          {isEditing ? (
            <div className="flex items-center space-x-2 w-full max-w-[200px] justify-center mt-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                maxLength={20}
                className="w-full text-center text-base font-black text-slate-800 border-b-2 border-[#BE1641] outline-none bg-transparent py-0.5"
                autoFocus
              />
              <button
                onClick={saveName}
                className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={cancelEditing}
                className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 mt-1">
              <h3 className="text-xl font-black text-slate-900 leading-none">{username}</h3>
              <button
                onClick={startEditing}
                className="p-1 text-slate-400 hover:text-slate-600 active:scale-90 transition-transform"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Wisatawan Domestik</span>
        </div>

        {/* Settings options group */}
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="divide-y divide-slate-100">
            {/* 1. Bahasa */}
            <div
              className="flex items-center justify-between p-4.5 active:bg-slate-50/80 transition cursor-pointer"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Globe className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-black text-slate-800">Bahasa</span>
                  <span className="text-[11px] font-bold text-slate-500 mt-0.5">Bahasa Indonesia</span>
                </div>
              </div>
              <ChevronRight className="w-4.5 h-4.5 text-slate-400" />
            </div>

            {/* 2. Keamanan */}
            <div
              className="flex items-center justify-between p-4.5 active:bg-slate-50/80 transition cursor-pointer"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-black text-slate-800">Keamanan</span>
                  <span className="text-[11px] font-bold text-slate-500 mt-0.5">Enkripsi & PIN Aktif</span>
                </div>
              </div>
              <ChevronRight className="w-4.5 h-4.5 text-slate-400" />
            </div>

            {/* 3. Pusat Bantuan */}
            <div
              className="flex items-center justify-between p-4.5 active:bg-slate-50/80 transition cursor-pointer"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <HelpCircle className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-black text-slate-800">Pusat Bantuan</span>
                  <span className="text-[11px] font-bold text-slate-500 mt-0.5">Pertanyaan Umum & Chat</span>
                </div>
              </div>
              <ChevronRight className="w-4.5 h-4.5 text-slate-400" />
            </div>

            {/* 4. Kebijakan Privasi */}
            <div
              className="flex items-center justify-between p-4.5 active:bg-slate-50/80 transition cursor-pointer"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-black text-slate-800">Kebijakan Privasi</span>
                  <span className="text-[11px] font-bold text-slate-500 mt-0.5">Syarat & Ketentuan Layanan</span>
                </div>
              </div>
              <ChevronRight className="w-4.5 h-4.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Log Out Button */}
        <button
          onClick={handleLogout}
          className="w-full py-4.5 bg-white border border-rose-100 rounded-3xl flex items-center justify-center space-x-2 text-[#BE1641] font-bold text-sm shadow-[0_8px_30px_rgba(0,0,0,0.01)] active:scale-[0.98] transition hover:bg-rose-50/30"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Keluar Akun</span>
        </button>
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-slate-100/50 px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+6px)] flex justify-between items-center z-50 rounded-t-3xl select-none shadow-[0_-8px_30px_rgba(0,0,0,0.03)]"
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
          <Home className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold mt-1 leading-none">Beranda</span>
        </button>

        {/* 2. Jelajah */}
        <button
          onClick={() => router.push('/destinasi')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Compass className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold mt-1 leading-none">Jelajah</span>
        </button>

        {/* 3. Tanya AI */}
        <button
          onClick={() => router.push('/chat')}
          className="flex flex-col items-center justify-center w-16 py-1 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <MessageSquare className="w-5.5 h-5.5" stroke="url(#rainbow-gradient)" />
          <span className="text-[10px] font-bold mt-1 leading-none text-slate-400">Tanya AI</span>
        </button>

        {/* 4. Disimpan */}
        <button
          onClick={() => router.push('/saved')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Heart className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold mt-1 leading-none">Tersimpan</span>
        </button>

        {/* 5. Profil (Active) */}
        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center justify-center w-16 py-1 text-[#4C1D95] active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <User className="w-5.5 h-5.5" fill="currentColor" />
          <span className="text-[10px] font-black mt-1 leading-none">Akun</span>
        </button>
      </nav>
    </div>
  );
}
