"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Calendar,
  MapPin,
  Home,
  Compass,
  MessageSquare,
  Heart,
  User,
} from 'lucide-react';

/* ─── Helpers ─── */

function parseEventDates(jam_operasional) {
  if (!jam_operasional) return null;

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const startMatch = jam_operasional.match(/Mulai:\s*([\d-]+)/);
  const endMatch = jam_operasional.match(/Selesai:\s*([\d-]+)/);
  const timeMatch = jam_operasional.match(/Waktu:\s*(.+)/);

  let startStr = null;
  let endStr = null;

  if (startMatch && startMatch[1]) {
    const d = new Date(startMatch[1]);
    if (!isNaN(d.getTime())) {
      startStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  }

  if (endMatch && endMatch[1]) {
    const d = new Date(endMatch[1]);
    if (!isNaN(d.getTime())) {
      endStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  }

  const timeStr = timeMatch ? timeMatch[1].trim() : null;

  return { startStr, endStr, timeStr, raw: jam_operasional };
}

export default function EventListPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('semua');

  const filterLabels = {
    semua: 'Semua Event',
    mendatang: 'Event Mendatang',
    budaya: 'Upacara Adat',
    religi: 'Event Religi'
  };


  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/knowledge/destinasi`);
        if (!res.ok) throw new Error('Gagal mengambil data');
        const data = await res.json();
        const filtered = data.filter(item => item.kategori === 'event');
        setEvents(filtered);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Filter logic
  const filteredEvents = events.filter(event => {
    // 1. Search filter
    const matchesSearch = 
      event.nama_tempat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.lokasi_wilayah && event.lokasi_wilayah.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.deskripsi_lengkap && event.deskripsi_lengkap.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // 2. Pill/Category filter
    if (activeFilter === 'semua') return true;
    
    if (activeFilter === 'mendatang') {
      const dates = parseEventDates(event.jam_operasional);
      if (!dates || !dates.raw) return false;
      const startMatch = dates.raw.match(/Mulai:\s*([\d-]+)/);
      if (startMatch && startMatch[1]) {
        const startDate = new Date(startMatch[1]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return startDate >= today;
      }
      return false;
    }
    
    if (activeFilter === 'budaya') {
      if (event.informasi_biaya?.sub_kategori === 'budaya') return true;
      const keywords = ['budaya', 'rambu', 'solo', 'adat', 'ritual', 'tongkonan', 'tradisional', 'upacara'];
      const text = `${event.nama_tempat} ${event.deskripsi_lengkap}`.toLowerCase();
      return keywords.some(kw => text.includes(kw));
    }

    if (activeFilter === 'religi') {
      if (event.informasi_biaya?.sub_kategori === 'religi') return true;
      const keywords = ['religi', 'gereja', 'natal', 'paskah', 'ibadah', 'ziarah', 'masjid', 'kristen', 'katolik'];
      const text = `${event.nama_tempat} ${event.deskripsi_lengkap}`.toLowerCase();
      return keywords.some(kw => text.includes(kw));
    }

    return true;
  });



  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F6F7F9] font-sans pb-[calc(env(safe-area-inset-bottom)+76px)] relative overflow-x-hidden">
      
      {/* ── COMPACT STICKY HEADER (App-style) ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)] flex flex-col gap-3 border-b border-slate-100/80">
        {/* Row 1: Back + Title */}
        <div className="flex items-center gap-3 px-5">
          <button
            onClick={() => router.push('/')}
            className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-90 transition-transform flex-shrink-0"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-[17px] font-black text-slate-800 select-none">Daftar Event</h1>
        </div>

        {/* Row 2: Search bar (inside header for compact feel) */}
        <div className="px-5">
          <div className="relative w-full flex items-center bg-[#F6F7F9] rounded-xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm font-medium text-slate-800 bg-transparent border-none outline-none placeholder-slate-400"
            />
          </div>
        </div>

        {/* ── FILTER TABS ── */}
        <div className="px-5 flex items-center space-x-6 overflow-x-auto no-scrollbar scroll-smooth bg-white pb-0 flex-shrink-0">
          {Object.entries(filterLabels).map(([key, label]) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`pb-2.5 text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 relative ${
                  isActive
                    ? 'text-[#4C1D95]'
                    : 'text-slate-500 active:text-[#4C1D95]'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span className="transition-colors duration-150">{label}</span>
                <span
                  className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full transition-all duration-200 origin-center ${
                    isActive ? 'bg-[#4C1D95] scale-x-100' : 'bg-transparent scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </header>

      {/* ── RESULTS COUNT ── */}
      {!loading && (
        <div className="px-5 mt-3">
          <p className="text-[11px] font-semibold text-slate-400">{filteredEvents.length} event ditemukan</p>
        </div>
      )}

      {/* ── EVENT LIST (BORDERLESS CARD VIEW) ── */}
      <div className="px-5 mt-4 space-y-9 pb-4">
        {loading ? (
          // Loading Skeleton — borderless destinasi style
          [1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col animate-pulse space-y-3">
              <div className="w-full aspect-[16/10] bg-slate-200 rounded-3xl" />
              <div className="space-y-2 px-1">
                <div className="h-4.5 w-3/4 bg-slate-200 rounded-md" />
                <div className="h-3.5 w-1/2 bg-slate-200 rounded-md mt-1" />
                <div className="h-3.5 w-2/3 bg-slate-200 rounded-md" />
              </div>
            </div>
          ))
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const dateInfo = parseEventDates(event.jam_operasional);
            const imageUrl = event.informasi_biaya?.image_url;

            return (
              <div
                key={event.id}
                onClick={() => router.push(`/event/${event.id}`)}
                className="flex flex-col active:scale-[0.98] transition-all cursor-pointer space-y-3"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Foto dengan Aspect Ratio 16:10, rounded-3xl di semua sisi */}
                <div className="relative w-full aspect-[16/10] bg-slate-100 rounded-3xl overflow-hidden border border-slate-100/50 shadow-sm">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={event.nama_tempat}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE]">
                      <span className="text-4xl">📅</span>
                    </div>
                  )}
                </div>

                {/* Bottom: Info Details */}
                <div className="text-left px-1">
                  <h3 className="text-[16px] font-black text-slate-900 leading-snug">
                    {event.nama_tempat}
                  </h3>

                  {dateInfo && dateInfo.startStr && (
                    <div className="mt-1.5 flex items-center text-xs font-bold text-[#4C1D95] gap-1.5">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        {dateInfo.startStr}
                        {dateInfo.endStr && dateInfo.endStr !== dateInfo.startStr && ` — ${dateInfo.endStr}`}
                      </span>
                    </div>
                  )}

                  {event.lokasi_wilayah && (
                    <div className="mt-1 flex items-center text-xs font-semibold text-slate-500 gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{event.lokasi_wilayah}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 px-6">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="text-sm text-slate-500 font-bold">Tidak ada event yang cocok.</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Coba kata kunci lain atau ubah filter.</p>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-slate-100/50 px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+6px)] flex justify-between items-center z-50 rounded-t-3xl select-none"
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

        {/* 5. Profil */}
        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <User className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold mt-1 leading-none">Akun</span>
        </button>
      </nav>
    </div>
  );
}
