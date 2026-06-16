"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Heart,
  Home,
  Compass,
  MessageSquare,
  User,
} from 'lucide-react';

export default function SavedPage() {
  const router = useRouter();
  const [savedItems, setSavedItems] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoryBadges = {
    event: '📅 Event',
    alam: '🌲 Alam',
    budaya_religi: '⛩️ Budaya & Religi',
    kuliner: '🍲 Kuliner',
    akomodasi: '🏨 Akomodasi',
    transportasi: '🚗 Transportasi',
    darurat: '🚨 Darurat',
  };

  useEffect(() => {
    const fetchSavedItems = async () => {
      try {
        const stored = localStorage.getItem('saved_events');
        const ids = stored ? JSON.parse(stored) : [];
        setSavedIds(ids);

        if (ids.length === 0) {
          setSavedItems([]);
          setLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/knowledge/destinasi`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const data = await res.json();
        
        // Filter destinations whose ID is in savedIds
        const filtered = data.filter(item => ids.includes(item.id));
        setSavedItems(filtered);
      } catch (err) {
        console.error('Failed to load saved items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedItems();
  }, []);

  const handleRemoveSaved = (e, destId) => {
    e.stopPropagation(); // Prevent navigating to detail page
    const updatedIds = savedIds.filter(id => id !== destId);
    setSavedIds(updatedIds);
    localStorage.setItem('saved_events', JSON.stringify(updatedIds));
    setSavedItems(prev => prev.filter(item => item.id !== destId));
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
            Item Disimpan
          </span>
          <div className="w-9 h-9 justify-self-end" />
        </div>
      </header>

      {/* ── CONTENT AREA ── */}
      <div className="px-6 mt-6 flex-grow">
        {loading ? (
          // Loading Skeleton
          <div className="grid grid-cols-1 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col animate-pulse space-y-3">
                <div className="w-full aspect-[16/10] bg-slate-150 rounded-3xl" />
                <div className="space-y-2 px-1">
                  <div className="h-5 w-2/3 bg-slate-150 rounded-md" />
                  <div className="h-3.5 w-full bg-slate-150 rounded-md mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : savedItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {savedItems.map((dest) => {
              const imageUrl = dest.informasi_biaya?.image_url;

              return (
                <div
                  key={dest.id}
                  onClick={() => router.push(`/event/${dest.id}`)}
                  className="flex flex-col active:scale-[0.98] transition-all cursor-pointer space-y-3 relative group"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {/* Image with 16:10 aspect ratio and rounded borders */}
                  <div className="relative w-full aspect-[16/10] bg-slate-50 rounded-3xl overflow-hidden border border-slate-100/50 shadow-sm">
                    <Image
                      src={imageUrl || "/dummy_destination.png"}
                      alt={dest.nama_tempat}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    
                    {/* Floating Heart toggle button to remove */}
                    <button
                      onClick={(e) => handleRemoveSaved(e, dest.id)}
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#BE1641] active:scale-90 transition-transform shadow-md hover:bg-white"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <Heart className="w-4.5 h-4.5 fill-current" />
                    </button>
                  </div>

                  {/* Info details */}
                  <div className="text-left px-1">
                    {dest.kategori && categoryBadges[dest.kategori] && (
                      <span className="text-[10px] font-black text-slate-500 bg-slate-200/50 rounded-full px-2.5 py-0.5 inline-block mb-1.5 uppercase tracking-wider">
                        {categoryBadges[dest.kategori]}
                      </span>
                    )}
                    <h3 className="text-lg font-black text-slate-900 leading-snug">
                      {dest.nama_tempat}
                    </h3>
                    {dest.deskripsi_lengkap && (
                      <p className="text-sm text-slate-700 mt-1.5 line-clamp-2 leading-relaxed">
                        {dest.deskripsi_lengkap}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Beautiful Empty State Card
          <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] text-center mt-2">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-[#BE1641] mb-5">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-800">Belum ada item disimpan</h3>
            <p className="text-sm text-slate-600 mt-2 max-w-xs leading-relaxed font-semibold">
              Jelajahi keindahan pariwisata Toraja dan ketuk ikon hati untuk menyimpan destinasi favorit Anda.
            </p>
            <button
              onClick={() => router.push('/destinasi')}
              className="mt-6 px-6 py-3 bg-[#BE1641] text-white font-bold rounded-full text-sm shadow-sm active:scale-95 transition-transform hover:bg-[#a31337]"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Cari Destinasi
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-slate-100/50 px-8 pt-3 pb-[calc(env(safe-area-inset-bottom)+8px)] flex justify-between items-center z-50 rounded-t-3xl select-none shadow-[0_-8px_30px_rgba(0,0,0,0.03)]"
      >
        {/* Rainbow Gradient Definition for AI Icon */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <defs>
            <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>

        {/* 1. Beranda */}
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center p-2 text-slate-500 hover:text-slate-600 active:scale-90 transition cursor-pointer relative"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Home className="w-5.5 h-5.5" />
        </button>

        {/* 2. Jelajah */}
        <button
          onClick={() => router.push('/event')}
          className="flex flex-col items-center justify-center p-2 text-slate-500 hover:text-slate-600 active:scale-90 transition cursor-pointer relative"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Compass className="w-5.5 h-5.5" />
        </button>

        {/* 3. Tanya AI */}
        <button
          onClick={() => router.push('/chat')}
          className="flex flex-col items-center justify-center p-2 active:scale-90 transition cursor-pointer relative"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <MessageSquare className="w-5.5 h-5.5" stroke="url(#rainbow-gradient)" />
        </button>

        {/* 4. Disimpan (Active) */}
        <button
          onClick={() => router.push('/saved')}
          className="flex flex-col items-center justify-center p-2 text-[#BE1641] active:scale-90 transition cursor-pointer relative"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Heart className="w-5.5 h-5.5" fill="currentColor" />
          <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[#BE1641]" />
        </button>

        {/* 5. Profil */}
        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center justify-center p-2 text-slate-500 hover:text-slate-600 active:scale-90 transition cursor-pointer relative"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <User className="w-5.5 h-5.5" />
        </button>
      </nav>
    </div>
  );
}
