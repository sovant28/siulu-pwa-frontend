"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  MapPin,
  Home,
  Compass,
  MessageSquare,
  Heart,
  User,
} from 'lucide-react';

export default function DestinasiListPage() {
  const router = useRouter();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('semua');

  const filterLabels = {
    semua: 'Semua Destinasi',
    alam: 'Wisata Alam',
    budaya_religi: 'Budaya & Religi',
  };

  const categoryBadges = {
    event: '📅 Event',
    alam: '🌲 Alam',
    budaya_religi: '⛩️ Budaya & Religi',
    kuliner: '🍲 Kuliner',
    akomodasi: '🏨 Akomodasi',
    transportasi: '🚗 Transportasi',
    darurat: '🚨 Darurat',
  };

  // Fetch destinations from API
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/knowledge/destinasi`);
        if (!res.ok) throw new Error('Gagal mengambil data');
        const data = await res.json();
        // Saring hanya destinasi pariwisata asli (wisata alam, budaya/religi)
        const allowedCategories = ['alam', 'budaya_religi'];
        const filtered = data.filter(item => allowedCategories.includes(item.kategori));
        setDestinations(filtered);
      } catch (err) {
        console.error('Failed to fetch destinations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  // Filter logic
  const filteredDestinations = destinations.filter(item => {
    // 1. Search filter
    const matchesSearch = 
      item.nama_tempat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lokasi_wilayah && item.lokasi_wilayah.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.deskripsi_lengkap && item.deskripsi_lengkap.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // 2. Category Filter
    if (activeFilter === 'semua') return true;
    return item.kategori === activeFilter;
  });

  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F6F7F9] font-sans pb-[calc(env(safe-area-inset-bottom)+76px)] relative overflow-x-hidden">
      
      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 px-6 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 flex flex-col space-y-4 backdrop-blur-md border-b border-slate-100/30">
        {/* Row 1: Logo (centered) */}
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
            Destinasi Wisata
          </span>
          <div className="w-9 h-9 justify-self-end" />
        </div>
      </header>

      {/* ── SEARCH ROW ── */}
      <div className="px-6 mt-5">
        <div className="relative w-full flex items-center bg-slate-100 rounded-full px-4.5 py-3">
          <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari destinasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-base font-semibold text-slate-800 bg-transparent border-none outline-none placeholder-slate-400"
          />
        </div>
      </div>

      {/* ── FILTER PILLS (HORIZONTAL SCROLL) ── */}
      <div className="px-6 mt-4 flex items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth">
        {Object.entries(filterLabels).map(([key, label]) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-[#BE1641] text-white border-[#BE1641]'
                  : 'bg-white text-slate-700 border-slate-200 active:bg-slate-50'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── RESULTS TITLE ── */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-black text-slate-800 tracking-wider">
          {searchQuery ? 'Hasil Pencarian' : filterLabels[activeFilter]}
        </h2>
      </div>

      {/* ── DESTINATIONS GRID (1-COLUMN, RASIO 16:10, BORDERLESS CARD) ── */}
      <div className="px-6 mt-4">
        {loading ? (
          // Loading Skeleton state
          <div className="grid grid-cols-1 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col animate-pulse space-y-3">
                <div className="w-full aspect-[16/10] bg-slate-100 rounded-3xl" />
                <div className="space-y-2 px-1">
                  <div className="h-5 w-2/3 bg-slate-100 rounded-md" />
                  <div className="h-3.5 w-full bg-slate-100 rounded-md mt-1" />
                  <div className="h-3.5 w-4/5 bg-slate-100 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDestinations.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {filteredDestinations.map((dest) => {
              const imageUrl = dest.informasi_biaya?.image_url;

              return (
                <div
                  key={dest.id}
                  onClick={() => router.push(`/event/${dest.id}`)}
                  className="flex flex-col active:scale-[0.98] transition-all cursor-pointer space-y-3"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {/* Foto dengan Aspect Ratio 16:10, rounded-3xl di semua sisi */}
                  <div className="relative w-full aspect-[16/10] bg-slate-50 rounded-3xl overflow-hidden border border-slate-100/50">
                    <Image
                      src={imageUrl || "/dummy_destination.png"}
                      alt={dest.nama_tempat}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Info Details (Flat list styling) */}
                  <div className="text-left px-1">
                    <h3 className="text-lg font-black text-slate-800 leading-snug">
                      {dest.nama_tempat}
                    </h3>
                    {dest.deskripsi_lengkap && (
                      <p className="text-sm text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">
                        {dest.deskripsi_lengkap}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-6 bg-white rounded-3xl border border-slate-200 mt-2">
            <span className="text-4xl block mb-2">🔍</span>
            <p className="text-sm text-slate-600 font-bold">Tidak ada tempat wisata yang cocok.</p>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 px-8 pt-3 pb-[calc(env(safe-area-inset-bottom)+8px)] flex justify-between items-center z-50 rounded-t-3xl select-none"
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
          className="flex flex-col items-center justify-center p-2 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer relative"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Home className="w-5.5 h-5.5" />
        </button>

        {/* 2. Jelajah (Destination uses Compass as well or keeps it inactive) */}
        <button
          onClick={() => router.push('/event')}
          className="flex flex-col items-center justify-center p-2 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer relative"
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

        {/* 4. Disimpan */}
        <button
          className="flex flex-col items-center justify-center p-2 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer relative"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Heart className="w-5.5 h-5.5" />
        </button>

        {/* 5. Profil */}
        <button
          className="flex flex-col items-center justify-center p-2 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer relative"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <User className="w-5.5 h-5.5" />
        </button>
      </nav>
    </div>
  );
}
