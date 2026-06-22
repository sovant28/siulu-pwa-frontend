"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../supabase';
import { ArrowLeft, Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' 
          ? 'Email atau kata sandi yang Anda masukkan salah.' 
          : authError.message);
        setLoading(false);
        return;
      }

      if (data && data.user) {
        const displayName = data.user.user_metadata?.name || data.user.email.split('@')[0];
        localStorage.setItem('username', displayName);
        router.push('/chat');
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F6F7F9] font-sans pb-10 relative overflow-x-hidden">
      
      {/* ── STICKY HEADER (Siulu Standard) ── */}
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
            Masuk Akun
          </span>
          <div className="w-9 h-9 justify-self-end" />
        </div>
      </header>

      {/* ── CONTENT AREA ── */}
      <div className="px-6 mt-8 max-w-md mx-auto w-full flex-grow flex flex-col justify-start">
        
        {/* Form Container (Flat, No Shadows) */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6">
          
          {/* Welcome Message */}
          <div className="text-left">
            <h3 className="text-xl font-black text-slate-800">Selamat Datang Kembali</h3>
            <p className="text-sm font-semibold text-slate-500 mt-1">Masuk untuk konsultasi AI pariwisata Toraja tanpa batas.</p>
          </div>

          {error && (
            <div className="p-4.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 pl-1">Email</label>
              <div className="relative">
                <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-4.5 top-4" />
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-base text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-[#BE1641] transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 pl-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 text-slate-400 absolute left-4.5 top-4" />
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-base text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-[#BE1641] transition"
                />
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#BE1641] hover:bg-[#a31337] text-white font-bold rounded-2xl text-base flex items-center justify-center space-x-2 transition active:scale-[0.98] mt-6 cursor-pointer"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {loading ? (
                <span className="w-5 h-5 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <>
                  <LogIn className="w-4.5 h-4.5 text-white" />
                  <span>Masuk Ke Akun</span>
                </>
              )}
            </button>

          </form>

          {/* Direct to Register Page */}
          <div className="text-center pt-2 border-t border-slate-50">
            <span className="text-sm font-semibold text-slate-500">Belum punya akun? </span>
            <Link 
              href="/register" 
              className="text-sm font-bold text-[#BE1641] hover:underline"
            >
              Daftar Gratis
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
