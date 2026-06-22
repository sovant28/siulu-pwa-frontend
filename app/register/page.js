"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../supabase';
import { ArrowLeft, User, Mail, Lock, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim()
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
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
      
      {/* HEADER */}
      <header className="bg-white/95 px-6 pt-[calc(env(safe-area-inset-top)+10px)] pb-4 flex items-center border-b border-slate-100/30">
        <button
          onClick={() => router.push('/login')}
          className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800 active:scale-90 transition-transform"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <ArrowLeft className="w-4.5 h-4.5 text-slate-800" />
        </button>
        <span className="text-base font-black text-slate-800 ml-4 select-none">
          Daftar Akun
        </span>
      </header>

      {/* CONTENT */}
      <div className="px-6 mt-10 max-w-md mx-auto w-full flex-grow flex flex-col justify-center">
        
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl font-black text-[#BE1641] tracking-tight select-none">siulu</span>
          <p className="text-xs font-bold text-slate-500 mt-2">Buat akun untuk membuka obrolan AI pariwisata tanpa batas</p>
        </div>

        {/* Form Card (Flat, No Shadows) */}
        <div className="bg-white border border-slate-200/85 rounded-3xl p-6 space-y-6">
          
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold leading-relaxed">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-6 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-3xl text-center space-y-3">
              <h4 className="text-base font-black">Pendaftaran Berhasil!</h4>
              <p className="text-xs font-bold leading-relaxed">
                Akun Anda berhasil dibuat. Mengarahkan Anda ke halaman masuk...
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 pl-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap Anda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-[#BE1641] transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 pl-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-[#BE1641] transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 pl-1">Kata Sandi</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-[#BE1641] transition"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#BE1641] hover:bg-[#a31337] text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 transition active:scale-[0.98] mt-6"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {loading ? (
                  <span className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Daftar Sekarang</span>
                  </>
                )}
              </button>

            </form>
          )}

          {/* Redirection */}
          {!success && (
            <div className="text-center pt-2">
              <span className="text-[11px] font-semibold text-slate-500">Sudah punya akun? </span>
              <Link 
                href="/login" 
                className="text-[11px] font-bold text-[#BE1641] hover:underline"
              >
                Masuk
              </Link>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
