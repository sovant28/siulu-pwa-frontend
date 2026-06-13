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
        const res = await fetch('/api/knowledge/destinasi');
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
      
      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 px-6 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 flex flex-col space-y-4 backdrop-blur-md border-b border-slate-100/30">
        {/* Row 1: Logo (centered, matching homepage styling) */}
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
            Daftar Event
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
            placeholder="Cari event..."
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

      {/* ── EVENT LIST (SPLIT ROW VIEW) ── */}
      <div className="px-6 mt-2.5 space-y-1">
        {loading ? (
          // Loading Skeleton state
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center py-4 border-b border-slate-200 animate-pulse">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 flex-shrink-0" />
              <div className="ml-4 flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-100 rounded-md" />
                <div className="h-3 w-1/2 bg-slate-100 rounded-md" />
                <div className="h-3 w-2/3 bg-slate-100 rounded-md" />
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
                className="flex items-center py-4 border-b border-slate-200 cursor-pointer active:scale-[0.99] transition-transform"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Left: Square Image */}
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={event.nama_tempat}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                      <span className="text-xl">📅</span>
                    </div>
                  )}
                </div>

                {/* Right: Info details */}
                <div className="ml-4 flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="text-base font-bold text-slate-800 truncate leading-snug">
                    {event.nama_tempat}
                  </h3>
                  
                  {event.lokasi_wilayah && (
                    <div className="mt-1 flex items-center text-sm font-semibold text-slate-700 gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" />
                      <span>{event.lokasi_wilayah}</span>
                    </div>
                  )}
 
                  {dateInfo && dateInfo.startStr && (
                    <div className="mt-2 text-sm font-bold text-slate-700 flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" />
                      <span>
                        {dateInfo.startStr}
                        {dateInfo.endStr && dateInfo.endStr !== dateInfo.startStr && ` - ${dateInfo.endStr}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 px-6 bg-white rounded-2xl border border-slate-200 mt-4">
            <span className="text-3xl block mb-2">🔍</span>
            <p className="text-sm text-slate-600 font-bold">Tidak ada event yang cocok.</p>
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

        {/* 2. Jelajah (Active) */}
        <button
          onClick={() => router.push('/event')}
          className="flex flex-col items-center justify-center p-2 text-[#BE1641] active:scale-90 transition cursor-pointer relative"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Compass className="w-5.5 h-5.5" fill="currentColor" />
          <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[#BE1641]" />
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
