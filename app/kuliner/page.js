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

// Fallback local culinary dataset
const localCulinaryFallback = [
  {
    id: "FOOD-PAPIONG-AYAM",
    nama_tempat: "Pa'piong Ayam Khas Toraja",
    kategori: "kuliner",
    lokasi_wilayah: "Rantepao & Sangalla",
    koordinat_gps: [-2.9734, 119.8972],
    deskripsi_lengkap: `Pa'piong Ayam adalah kuliner khas tradisional Toraja yang dimasak secara unik di dalam tabung bambu tipis. Potongan daging ayam kampung segar dicampur dengan parutan kelapa muda, batang pisang muda (kallang) yang diiris tipis, cabai lokal (katokkon) yang pedas segar, garam, serta rempah-rempah Toraja.

Setelah semua bumbu merata, adonan dimasukkan ke dalam bambu yang dilapisi daun pisang, lalu dibakar di atas bara api terbuka selama sekitar 1 hingga 1.5 jam hingga matang sempurna dan mengeluarkan aroma harum bambu yang khas.

Bahan & Cara Membuat:
1. 1 ekor ayam kampung segar (potong kecil-kecil)
2. 1 batang pisang muda bagian dalam (kallang), iris halus
3. 1 butir kelapa parut setengah muda
4. 5-10 buah cabai katokkon (cabai khas Toraja)
5. Garam, sereh, dan daun kemangi secukupnya
6. Tabung bambu sedang (sekitar 50-60 cm)`,
    jam_operasional: "Tersedia di rumah makan tradisional",
    informasi_biaya: {
      jenis: "makanan_khas",
      harga_tiket: "Rp 40.000 - Rp 80.000 / porsi",
      image_url: "/ai_food.png"
    },
    fitur_fasilitas: ["TOR-ARAS-CAF", "TOR-LEMO-CAF"],
    aturan_tips: "Pa'piong tradisional memakan waktu masak yang cukup lama karena harus dibakar perlahan. Jika ingin memesan langsung di restoran, disarankan menelepon kedai terlebih dahulu agar hidangan siap saat Anda tiba.",
    kontak_info: ""
  },
  {
    id: "FOOD-DEPPA-TORI",
    nama_tempat: "Deppa Tori' Kue Manis Toraja",
    kategori: "kuliner",
    lokasi_wilayah: "Makale & Rantepao",
    koordinat_gps: [-3.1028, 119.8556],
    deskripsi_lengkap: `Deppa Tori' adalah kue tradisional camilan khas Tana Toraja yang terbuat dari tepung beras pilihan, gula merah aren lokal yang manis legit, dan taburan biji wijen di bagian luarnya. Kue ini memiliki bentuk lonjong memanjang khas dan bertekstur renyah di luar namun empuk dan gurih di bagian dalamnya.

Sangat cocok disajikan sebagai teman bersantai minum kopi Toraja hangat di pagi atau sore hari.

Bahan-bahan Utama:
1. Tepung beras ketan lokal
2. Gula merah aren Toraja asli
3. Air bersih & minyak kelapa untuk menggoreng
4. Biji wijen sangrai untuk taburan luar`,
    jam_operasional: "Tersedia di pasar tradisional & toko oleh-oleh",
    informasi_biaya: {
      jenis: "makanan_khas",
      harga_tiket: "Rp 15.000 - Rp 35.000 / bungkus",
      image_url: "/icon_kopi.png"
    },
    fitur_fasilitas: ["TOR-ARAS-CAF"],
    aturan_tips: "Deppa Tori' sangat lezat disajikan dalam kondisi hangat bersama secangkir kopi Toraja Arabika tanpa gula.",
    kontak_info: ""
  }
];

function KulinerListContent() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch culinary items from API
  useEffect(() => {
    const fetchCulinary = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/knowledge/destinasi`);
        let data = [];
        if (res.ok) {
          data = await res.json();
        }
        
        // Filter traditional foods (makanan_khas)
        const apiCulinaryItems = data.filter(
          item => item.kategori === 'kuliner' && item.informasi_biaya?.jenis === 'makanan_khas'
        );
        
        // Merge with local fallback
        const combined = [...apiCulinaryItems];
        localCulinaryFallback.forEach(fallback => {
          if (!combined.some(item => item.id === fallback.id)) {
            combined.push(fallback);
          }
        });

        setItems(combined);
      } catch (err) {
        console.error('Failed to fetch culinary items:', err);
        // On failure, load fallbacks anyway
        setItems(localCulinaryFallback);
      } finally {
        setLoading(false);
      }
    };
    fetchCulinary();
  }, []);

  // Filter logic based on search query
  const filteredItems = items.filter(item => {
    return (
      item.nama_tempat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lokasi_wilayah && item.lokasi_wilayah.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.deskripsi_lengkap && item.deskripsi_lengkap.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F6F7F9] font-sans pb-[calc(env(safe-area-inset-bottom)+76px)] relative overflow-x-hidden">
      
      {/* ── COMPACT STICKY HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)] pb-3 flex flex-col gap-3 border-b border-slate-200">
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
              placeholder="Cari makanan khas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm font-medium text-slate-800 bg-transparent border-none outline-none placeholder-slate-400"
            />
          </div>
        </div>
      </header>

      {/* ── RESULTS COUNT ── */}
      {!loading && (
        <div className="px-5 mt-3">
          <p className="text-[11px] font-semibold text-slate-400">
            {filteredItems.length} kuliner khas ditemukan
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
            const imageUrl = item.informasi_biaya?.image_url || 
              (item.id === 'FOOD-PAPIONG-AYAM' ? '/ai_food.png' : 
               item.id === 'FOOD-DEPPA-TORI' ? '/icon_kopi.png' : null);
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
