"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

  const handleGoogleLogin = async () => {
    try {
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (oAuthError) setError(oAuthError.message);
    } catch (err) {
      console.error(err);
      setError('Gagal menghubungkan ke Google.');
    }
  };

  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F6F7F9] font-sans pb-10 relative overflow-x-hidden">
      
      {/* ── STICKY HEADER (Siulu Standard with Light Purple Logo) ── */}
      <header className="sticky top-0 z-40 bg-white/95 px-6 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 flex flex-col space-y-4 backdrop-blur-md border-b border-slate-100/30">
        {/* Row 1: Logo (Light Purple text-[#8B5CF6]) */}
        <div className="text-center w-full">
          <span className="text-3xl font-black text-[#8B5CF6] tracking-tight select-none">siulu</span>
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
      <div className="px-6 mt-6 max-w-md mx-auto w-full flex-grow flex flex-col justify-start">
        
        {/* Form Container (Flat, No Shadows) */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6">
          
          {/* Welcome Message */}
          <div className="text-left">
            <h3 className="text-xl font-black text-slate-800">Selamat Datang Kembali</h3>
            <p className="text-sm font-semibold text-slate-500 mt-1">Masuk untuk menjelajahi Toraja bersama AI.</p>
          </div>

          {error && (
            <div className="p-4.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold leading-relaxed">
              {error}
            </div>
          )}

          {/* Social Logins (Google) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-2xl text-base flex items-center justify-center space-x-2.5 transition active:scale-[0.98] cursor-pointer"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.78 0 3.3.61 4.56 1.81l3.4-3.4C17.9 1.54 15.17 1 12 1 7.24 1 3.2 3.73 1.25 7.72l4.03 3.12C6.26 7.74 8.87 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.52 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.47c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.43-4.91 3.43-8.58z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.28c-.23-.69-.36-1.42-.36-2.28s.13-1.59.36-2.28L1.25 6.6C.45 8.2.01 9.98.01 12s.44 3.8 1.24 5.4l4.03-3.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.34 1.1-3.96 1.1-3.13 0-5.74-2.7-6.72-5.8L1.25 15.63C3.2 19.62 7.24 23 12 23z"
                />
              </svg>
              <span>Masuk dengan Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <span className="relative px-3 bg-white text-xs font-bold text-slate-400">atau pakai email</span>
          </div>

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
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-base text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-[#4C1D95] transition"
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
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-base text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-[#4C1D95] transition"
                />
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#4C1D95] hover:bg-[#3b1670] text-white font-bold rounded-2xl text-base flex items-center justify-center space-x-2 transition active:scale-[0.98] mt-6 cursor-pointer"
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

          {/* Eye-catching Signup CTA Button */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <p className="text-xs font-semibold text-slate-400 text-center">Belum memiliki akun?</p>
            <button
              onClick={() => router.push('/register')}
              className="w-full py-3.5 bg-white border border-[#4C1D95]/40 hover:border-[#4C1D95] text-[#4C1D95] font-bold rounded-2xl text-base transition active:scale-[0.98] cursor-pointer text-center flex items-center justify-center"
            >
              Daftar Akun Baru
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
