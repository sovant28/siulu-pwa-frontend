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
  UtensilsCrossed,
} from 'lucide-react';

function KulinerListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('makanan_khas'); // 'makanan_khas' atau 'tempat_makan'

  const tabLabels = {
    makanan_khas: 'Makanan Khas',
    tempat_makan: 'Tempat Makan',
  };

  // Sync active tab from URL query param if present
  useEffect(() => {
    if (tabParam && tabLabels[tabParam]) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Fetch culinary items from API
  useEffect(() => {
    const fetchCulinary = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/knowledge/destinasi`);
        if (!res.ok) throw new Error('Gagal mengambil data');
        const data = await res.json();
        
        // Filter by category 'kuliner'
        const culinaryItems = data.filter(item => item.kategori === 'kuliner');
        setItems(culinaryItems);
      } catch (err) {
        console.error('Failed to fetch culinary items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCulinary();
  }, []);

  // Filter logic based on search query and active tab selection
  const filteredItems = items.filter(item => {
    // 1. Search Query Filter
    const matchesSearch = 
      item.nama_tempat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lokasi_wilayah && item.lokasi_wilayah.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.deskripsi_lengkap && item.deskripsi_lengkap.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // 2. Tab Filter
    const isFoodCatalog = item.informasi_biaya?.jenis === 'makanan_khas';
    if (activeTab === 'makanan_khas') {
      return isFoodCatalog;
    } else {
      return !isFoodCatalog;
    }
  });

  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F6F7F9] font-sans pb-[calc(env(safe-area-inset-bottom)+76px)] relative overflow-x-hidden">
      
      {/* ── COMPACT STICKY HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)] flex flex-col gap-3 border-b border-slate-200">
        {/* Row 1: Back Button & Page Title */}
        <div className="flex items-center gap-3 px-5">
          <button
            onClick={() => router.push('/')}
            className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-90 transition-transform flex-shrink-0"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-[17px] font-black text-slate-800 select-none">Wisata Kuliner</h1>
        </div>

        {/* Row 2: Search input */}
        <div className="px-5">
          <div className="relative w-full flex items-center bg-[#F6F7F9] rounded-xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder={activeTab === 'makanan_khas' ? "Cari makanan khas..." : "Cari kedai / restoran..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm font-medium text-slate-800 bg-transparent border-none outline-none placeholder-slate-400"
            />
          </div>
        </div>

        {/* Filter Tabs ("Makanan Khas" vs "Tempat Makan") */}
        <div className="px-5 flex items-center space-x-6 overflow-x-auto no-scrollbar scroll-smooth bg-white pb-0 flex-shrink-0">
          {Object.entries(tabLabels).map(([key, label]) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`pb-2.5 text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 relative ${
                  isActive ? 'text-[#4C1D95]' : 'text-slate-500 active:text-[#4C1D95]'
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
          <p className="text-[11px] font-semibold text-slate-400">
            {filteredItems.length} {activeTab === 'makanan_khas' ? 'kuliner khas' : 'tempat makan'} ditemukan
          </p>
        </div>
      )}

      {/* ── LIST ITEMS ── */}
      <div className="px-5 mt-4 space-y-9 pb-4">
        {loading ? (
          // Skeleton Loader
          [1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col animate-pulse space-y-3">
              <div className="w-full aspect-[16/10] bg-slate-200 rounded-3xl" />
              <div className="space-y-2 px-1">
                <div className="h-4.5 w-3/4 bg-slate-200 rounded-md" />
                <div className="h-3.5 w-1/2 bg-slate-200 rounded-md mt-1" />
              </div>
            </div>
          ))
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const imageUrl = item.informasi_biaya?.image_url;
            const priceRange = item.informasi_biaya?.harga_tiket;

            return (
              <div
                key={item.id}
                onClick={() => router.push(`/event/${item.id}`)}
                className="flex flex-col active:scale-[0.98] transition-all cursor-pointer space-y-3"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Baris 1: Cover Photo (Aspect 16:10, Rounded 3xl, border outline) */}
                <div className="relative w-full aspect-[16/10] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/80">
                  <Image
                    src={imageUrl || "/dummy_destination.png"}
                    alt={item.nama_tempat}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Info details */}
                <div className="text-left px-1">
                  {/* Baris 2: Nama Item */}
                  <h3 className="text-[16px] font-black text-slate-900 leading-snug">
                    {item.nama_tempat}
                  </h3>

                  {/* Baris 3: Deskripsi singkat */}
                  {item.deskripsi_lengkap && (
                    <p className="text-xs font-semibold text-slate-800 mt-1.5 line-clamp-2 leading-relaxed">
                      {item.deskripsi_lengkap}
                    </p>
                  )}

                  {/* Baris 4: Details (Lokasi / Harga) */}
                  <div className="mt-2.5 flex items-center text-xs font-semibold text-slate-500 gap-3">
                    {/* Location */}
                    {item.lokasi_wilayah && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{item.lokasi_wilayah}</span>
                      </div>
                    )}
                    
                    {/* Price hint (for food catalog) */}
                    {priceRange && (
                      <div className="flex items-center gap-1">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{priceRange}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 px-6">
            <span className="text-4xl block mb-3">🍲</span>
            <p className="text-sm text-slate-500 font-bold">Tidak ada kuliner yang cocok.</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Coba kata kunci lain atau ubah filter pencarian.</p>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-slate-100/50 px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+6px)] flex justify-between items-center z-50 rounded-t-3xl select-none"
      >
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

        {/* 2. Jelajah (Inactive & Void) */}
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
          <span className="text-[10px] font-bold mt-1 leading-none text-slate-500">Tanya AI</span>
        </button>

        {/* 4. Simpan */}
        <button
          onClick={() => router.push('/saved')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Heart className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold mt-1 leading-none">Simpan</span>
        </button>

        {/* 5. Profil */}
        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <User className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold mt-1 leading-none">Profil</span>
        </button>
      </nav>
    </div>
  );
}

export default function KulinerListPage() {
  return (
    <Suspense fallback={
      <div className="flex w-full min-h-[100dvh] bg-[#F6F7F9] items-center justify-center">
        <div className="text-sm font-bold text-slate-500 animate-pulse">Memuat...</div>
      </div>
    }>
      <KulinerListContent />
    </Suspense>
  );
}
