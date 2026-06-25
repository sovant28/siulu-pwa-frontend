"use client";

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
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

// Fallback local places dataset for destinations
const localPlacesFallback = [
  {
    id: "TOR-ARAS-CAF",
    nama_tempat: "Café Aras Rantepao",
    kategori: "kuliner",
    lokasi_wilayah: "Rantepao",
    koordinat_gps: [-2.973412, 119.897213],
    deskripsi_lengkap: "Café Aras adalah salah satu kafe legendaris dan paling populer bagi wisatawan asing maupun domestik di pusat kota Rantepao. Kafe ini menyediakan aneka hidangan kuliner khas Toraja yang dijamin 100% Halal (seperti Pa'piong Ayam halal, Kapurung) serta kopi specialty Toraja Arabika dengan berbagai metode seduh manual.\n\nTempatnya sangat nyaman dengan dekorasi interior penuh ukiran kayu khas Toraja yang artistik dan bernuansa hangat.",
    jam_operasional: "10:00 - 22:00 WITA",
    informasi_biaya: {
      jenis: "tempat_makan",
      harga_tiket: "Rp 25.000 - Rp 100.000",
      image_url: "/dummy_destination.png",
      menu_items: [
        { nama: "Pa'piong Ayam Bambu (Halal)", harga: "Rp 70.000" },
        { nama: "Kapurung Toraja", harga: "Rp 30.000" },
        { nama: "Kopi Arabika Specialty", harga: "Rp 25.000" }
      ]
    },
    fitur_fasilitas: ["Makan di tempat", "Halal", "Kopi Specialty Toraja", "Free Wifi", "Dekorasi Ukiran Toraja"],
    aturan_tips: "Cobalah menu Pa'piong Ayam bambu halal mereka yang sangat otentik. Kafe ini sangat ramai menjelang makan malam, jadi disarankan datang lebih awal agar mendapat tempat duduk.",
    kontak_info: "0813-4212-3456"
  },
  {
    id: "TOR-LEMO-CAF",
    nama_tempat: "Lemo Café",
    kategori: "kuliner",
    lokasi_wilayah: "Makale Utara (Lemo)",
    koordinat_gps: [-3.0135, 119.8789],
    deskripsi_lengkap: "Lemo Café terletak strategis di dekat situs makam batu Lemo. Menyajikan hidangan khas Toraja seperti Pa'piong dan kopi Toraja asli sambil menyuguhkan pemandangan sawah hijau yang membentang indah di belakang kafe. Tempat singgah yang sempurna setelah menjelajahi situs budaya Lemo.",
    jam_operasional: "09:00 - 21:00 WITA",
    informasi_biaya: {
      jenis: "tempat_makan",
      harga_tiket: "Rp 20.000 - Rp 75.000",
      image_url: "/dummy_destination.png",
      menu_items: [
        { nama: "Pa'piong Ayam Tradisional", harga: "Rp 75.000" },
        { nama: "Deppa Tori' Wijen Hangat", harga: "Rp 20.000" },
        { nama: "Kopi Robusta Toraja", harga: "Rp 20.000" }
      ]
    },
    fitur_fasilitas: ["Makan di tempat", "Pemandangan Sawah", "Dekat Situs Lemo", "Kopi Toraja"],
    aturan_tips: "Duduklah di area balkon belakang untuk menikmati pemandangan sawah terbaik. Pa'piong di sini dimasak dengan bumbu rempah tradisional yang sangat gurih.",
    kontak_info: "0812-3456-7890"
  }
];

function DestinasiListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('semua');

  const filterLabels = {
    semua: 'Semua Destinasi',
    alam: 'Wisata Alam',
    budaya_religi: 'Budaya & Religi',
    tempat_makan: 'Tempat Makan',
  };

  // Sync active filter from URL query param
  useEffect(() => {
    if (filterParam && filterLabels[filterParam]) {
      setActiveFilter(filterParam);
    }
  }, [filterParam]);

  // Fetch destinations from API
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/knowledge/destinasi`);
        let data = [];
        if (res.ok) {
          data = await res.json();
        }
        
        // Filter allowed categories (alam, budaya_religi, and eating places from kuliner)
        const filtered = data.filter(item => 
          item.kategori === 'alam' || 
          item.kategori === 'budaya_religi' ||
          (item.kategori === 'kuliner' && (item.informasi_biaya?.jenis === 'tempat_makan' || !item.id.startsWith('FOOD-')))
        );

        setDestinations(filtered);
      } catch (err) {
        console.error('Failed to fetch destinations:', err);
        setDestinations(localPlacesFallback);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, [filterParam]);

  // Filter logic
  const filteredDestinations = destinations.filter(item => {
    // 1. Search filter
    const matchesSearch = 
      item.nama_tempat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lokasi_wilayah && item.lokasi_wilayah.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.deskripsi_lengkap && item.deskripsi_lengkap.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // 2. Category Filter
    if (activeFilter === 'semua') {
      return item.kategori === 'alam' || item.kategori === 'budaya_religi';
    }
    if (activeFilter === 'tempat_makan') {
      return item.kategori === 'kuliner' && (item.informasi_biaya?.jenis === 'tempat_makan' || !item.id.startsWith('FOOD-'));
    }
    return item.kategori === activeFilter;
  });

  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F6F7F9] font-sans pb-[calc(env(safe-area-inset-bottom)+76px)] relative overflow-x-hidden">
      
      {/* ── COMPACT STICKY HEADER (App-style) ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)] flex flex-col gap-3 border-b border-slate-200">
        {/* Row 1: Back + Title */}
        <div className="flex items-center gap-3 px-5">
          <button
            onClick={() => router.push('/')}
            className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-90 transition-transform flex-shrink-0"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-[17px] font-black text-slate-800 select-none">Jelajah Destinasi</h1>
        </div>

        {/* Row 2: Search bar (inside header for compact feel) */}
        <div className="px-5">
          <div className="relative w-full flex items-center bg-[#F6F7F9] rounded-xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari destinasi..."
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
          <p className="text-[11px] font-semibold text-slate-400">{filteredDestinations.length} destinasi ditemukan</p>
        </div>
      )}

      {/* ── DESTINATIONS LIST (BORDERLESS CARD VIEW) ── */}
      <div className="px-5 mt-4 space-y-9 pb-4">
        {loading ? (
          // Loading Skeleton
          [1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col animate-pulse space-y-3">
              <div className="w-full aspect-[16/10] bg-slate-200 rounded-3xl" />
              <div className="space-y-2 px-1">
                <div className="h-4.5 w-3/4 bg-slate-200 rounded-md" />
                <div className="h-3.5 w-1/2 bg-slate-200 rounded-md mt-1" />
              </div>
            </div>
          ))
        ) : filteredDestinations.length > 0 ? (
          filteredDestinations.map((dest) => {
            const imageUrl = dest.informasi_biaya?.image_url;

            return (
              <div
                key={dest.id}
                onClick={() => router.push(`/event/${dest.id}`)}
                className="flex flex-col active:scale-[0.98] transition-all cursor-pointer space-y-3"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Baris 1: Foto dengan Aspect Ratio 16:10, rounded-3xl di semua sisi */}
                <div className="relative w-full aspect-[16/10] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/80">
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
                  {/* Baris 2: Nama Destinasi */}
                  <h3 className="text-[16px] font-black text-slate-900 leading-snug">
                    {dest.nama_tempat}
                  </h3>

                  {/* Baris 3: Deskripsi Singkat */}
                  {dest.deskripsi_lengkap && (
                    <p className="text-xs font-semibold text-slate-800 mt-1.5 line-clamp-2 leading-relaxed">
                      {dest.deskripsi_lengkap}
                    </p>
                  )}

                  {/* Baris 4: Lokasi */}
                  {dest.lokasi_wilayah && (
                    <div className="mt-2 flex items-center text-xs font-semibold text-slate-500 gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{dest.lokasi_wilayah}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 px-6">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="text-sm text-slate-500 font-bold">Tidak ada tempat wisata yang cocok.</p>
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
          onClick={() => {}}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Compass className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold mt-1 leading-none text-slate-400">Jelajah</span>
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

export default function DestinasiListPage() {
  return (
    <Suspense fallback={<div className="flex w-full min-h-[100dvh] items-center justify-center bg-[#F6F7F9]"><div className="animate-pulse text-sm text-slate-500 font-black">Loading...</div></div>}>
      <DestinasiListContent />
    </Suspense>
  );
}
