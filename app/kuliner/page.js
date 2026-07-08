"use client";

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchDestinationsData } from '../utils/fetchHelper';
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
  const defaultTab = searchParams.get('tab') === 'restoran' ? 'tempat_makan' : 'makanan_khas';
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [visibleCount, setVisibleCount] = useState(6);

  // Reset page pagination when tab or search changes
  useEffect(() => {
    setVisibleCount(6);
  }, [activeTab, searchQuery]);

  // Fetch culinary items from API
  useEffect(() => {
    const fetchCulinary = async () => {
      try {
        const data = await fetchDestinationsData();
        
        // Filter all culinary items
        const apiCulinaryItems = (data || []).filter(
          item => item && item.kategori === 'kuliner'
        );
        
        setItems(apiCulinaryItems || []);
      } catch (err) {
        console.error('Failed to fetch culinary items:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCulinary();
  }, []);

  // Filter logic based on tab and search query
  const filteredItems = items.filter(item => {
    // 1. Tab filter
    const isMakananKhas = item.informasi_biaya?.jenis === 'makanan_khas' || item.id?.startsWith('FOOD-');
    const isTempatMakan = item.informasi_biaya?.jenis === 'tempat_makan' || !item.id?.startsWith('FOOD-');
    
    if (activeTab === 'makanan_khas' && !isMakananKhas) return false;
    if (activeTab === 'tempat_makan' && !isTempatMakan) return false;

    // 2. Search filter
    return (
      item.nama_tempat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lokasi_wilayah && item.lokasi_wilayah.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.deskripsi_lengkap && item.deskripsi_lengkap.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F6F7F9] font-sans pb-[calc(env(safe-area-inset-bottom)+76px)] relative overflow-x-hidden">
      
      {/* ── COMPACT STICKY HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+8px)] pb-0 flex flex-col gap-3 border-b border-slate-200">
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
              placeholder={activeTab === 'makanan_khas' ? 'Cari makanan khas...' : 'Cari restoran, cafe, kedai...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm font-medium text-slate-800 bg-transparent border-none outline-none placeholder-slate-400"
            />
          </div>
        </div>

        {/* Row 3: Tabs */}
        <div className="px-5 flex items-center space-x-6 overflow-x-auto no-scrollbar scroll-smooth bg-white pb-0 flex-shrink-0">
          <button
            onClick={() => setActiveTab('makanan_khas')}
            className={`pb-2.5 text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 relative ${
              activeTab === 'makanan_khas' ? 'text-[#4C1D95]' : 'text-slate-500 active:text-[#4C1D95]'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <span>Makanan Khas</span>
            <span
              className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full transition-all duration-200 origin-center ${
                activeTab === 'makanan_khas' ? 'bg-[#4C1D95] scale-x-100' : 'bg-transparent scale-x-0'
              }`}
            />
          </button>
          <button
            onClick={() => setActiveTab('tempat_makan')}
            className={`pb-2.5 text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 relative ${
              activeTab === 'tempat_makan' ? 'text-[#4C1D95]' : 'text-slate-500 active:text-[#4C1D95]'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <span>Tempat Makan / Resto</span>
            <span
              className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full transition-all duration-200 origin-center ${
                activeTab === 'tempat_makan' ? 'bg-[#4C1D95] scale-x-100' : 'bg-transparent scale-x-0'
              }`}
            />
          </button>
        </div>
      </header>

      {/* ── RESULTS COUNT ── */}
      {!loading && (
        <div className="px-5 mt-3">
          <p className="text-[11px] font-semibold text-slate-400">
            {activeTab === 'makanan_khas' 
              ? `${filteredItems.length} kuliner khas ditemukan` 
              : `${filteredItems.length} tempat makan ditemukan`}
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
          <>
            {filteredItems.slice(0, visibleCount).map((item) => {
              const imageUrl = item.informasi_biaya?.image_url;

              return (
                <div
                  key={item.id}
                  onClick={() => router.push(`/destinasi/${item.id}`)}
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

                    {/* Baris 4: Lokasi Wilayah (jika ada) */}
                    {item.lokasi_wilayah && (
                      <div className="mt-2.5 flex items-center text-xs font-semibold text-slate-500 gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{item.lokasi_wilayah}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredItems.length > visibleCount && (
              <div className="flex justify-center pt-2 pb-6">
                <button
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  className="px-6 py-3 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 active:scale-95 transition-all duration-150 select-none outline-none w-full max-w-[200px]"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Muat Lebih Banyak
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 px-6">
            <span className="text-4xl block mb-3">🍲</span>
            <p className="text-sm text-slate-500 font-bold">
              {activeTab === 'makanan_khas' ? 'Tidak ada kuliner yang cocok.' : 'Tidak ada tempat makan yang cocok.'}
            </p>
            <p className="text-xs text-slate-400 font-medium mt-1">Coba kata kunci lain atau ubah filter pencarian.</p>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+6px)] flex justify-between items-center z-50 rounded-t-3xl select-none"
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
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" d="M17.7218 8.08382L14.7218 5.29811C13.4309 4.09937 12.7854 3.5 12 3.5C11.2146 3.5 10.5691 4.09937 9.2782 5.29811L6.2782 8.08382C5.64836 8.66867 5.33345 8.96109 5.16672 9.34342C5 9.72575 5 10.1555 5 11.015V16.9999C5 18.8856 5 19.8284 5.58579 20.4142C6.17157 20.9999 7.11438 20.9999 9 20.9999H9.75V16.9999C9.75 15.7573 10.7574 14.7499 12 14.7499C13.2426 14.7499 14.25 15.7573 14.25 16.9999V20.9999H15C16.8856 20.9999 17.8284 20.9999 18.4142 20.4142C19 19.8284 19 18.8856 19 16.9999L19 11.015C19 10.1555 19 9.72575 18.8333 9.34342C18.6666 8.96109 18.3516 8.66866 17.7218 8.08382Z" fill="currentColor"></path> 
              <path d="M19 9L19 17C19 18.8856 19 19.8284 18.4142 20.4142C17.8284 21 16.8856 21 15 21L14 21L10 21L9 21C7.11438 21 6.17157 21 5.58579 20.4142C5 19.8284 5 18.8856 5 17L5 9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"></path> 
              <path d="M3 11L7.5 7L10.6713 4.18109C11.429 3.50752 12.571 3.50752 13.3287 4.18109L16.5 7L21 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
              <path d="M10 21V17C10 15.8954 10.8954 15 12 15V15C13.1046 15 14 15.8954 14 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Beranda</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 2. Jelajah */}
        <button
          onClick={() => {}}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-default"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" fillRule="evenodd" clipRule="evenodd" d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21ZM14.149 15.1848C13.4576 17.1053 10.6665 16.8584 10.323 14.8464C10.2169 14.2248 9.72996 13.7379 9.10837 13.6318C7.09631 13.2882 6.84941 10.4971 8.76993 9.80572L12.6761 8.39948C14.4674 7.75462 16.2001 9.48732 15.5553 11.2786L14.149 15.1848Z" fill="currentColor"></path> 
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"></path> 
              <path d="M13.9137 15.1001L15.32 11.1939C15.8932 9.60167 14.353 8.06149 12.7608 8.6347L8.85455 10.0409C7.1758 10.6453 7.39162 13.085 9.15038 13.3853C9.87655 13.5093 10.4454 14.0781 10.5694 14.8043C10.8696 16.5631 13.3094 16.7789 13.9137 15.1001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Jelajah</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 3. Tanya AI */}
        <button
          onClick={() => router.push('/chat')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" d="M21 12.1818L16.9354 13.6599C16.3462 13.8741 15.8916 14.3521 15.7073 14.9513L14.1538 20C14.1072 20.1515 13.8928 20.1515 13.8461 20L12.2927 14.9513C12.1083 14.3521 11.6537 13.8741 11.0646 13.6599L6.99999 12.1818C6.83019 12.1201 6.83019 11.8799 6.99999 11.8182L11.0646 10.3401C11.6537 10.1259 12.1083 9.64786 12.2927 9.04872L13.8461 4C13.8928 3.8485 14.1072 3.8485 14.1538 4L15.7073 9.04872C15.8916 9.64786 16.3462 10.1259 16.9354 10.3401L21 11.8182C21.1698 11.8799 21.1698 12.1201 21 12.1818Z" fill="url(#rainbow-gradient)"></path> 
              <path d="M21 12.1818L16.9354 13.6599C16.3462 13.8741 15.8916 14.3521 15.7073 14.9513L14.1538 20C14.1072 20.1515 13.8928 20.1515 13.8461 20L12.2927 14.9513C12.1083 14.3521 11.6537 13.8741 11.0646 13.6599L6.99999 12.1818C6.83019 12.1201 6.83019 11.8799 6.99999 11.8182L11.0646 10.3401C11.6537 10.1259 12.2927 9.04872L13.8461 4C13.8928 3.8485 14.1072 3.8485 14.1538 4L15.7073 9.04872C15.8916 9.64786 16.3462 10.1259 16.9354 10.3401L21 11.8182C21.1698 11.8799 21.1698 12.1201 21 12.1818Z" stroke="url(#rainbow-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
              <path d="M3.75 5.25C4.22214 5.40738 4.59262 5.77786 4.75 6.25C4.83008 6.49025 5.16992 6.49025 5.25 6.25C5.40738 5.77786 5.77786 5.40738 6.25 5.25C6.49025 5.16992 6.49025 4.83008 6.25 4.75C5.77786 4.59262 5.40738 4.22214 5.25 3.75C5.16992 3.50975 4.83008 3.50975 4.75 3.75C4.59262 4.22214 4.22214 4.59262 3.75 4.75C3.50975 4.83008 3.50975 5.16992 3.75 5.25Z" stroke="url(#rainbow-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
              <path d="M7.25 19.25C6.77786 19.4074 6.40738 19.7779 6.25 20.25C6.16992 20.4903 5.83008 20.4903 5.75 20.25C5.59262 19.7779 5.22214 19.4074 4.75 19.25C4.50975 19.1699 4.50975 18.8301 4.75 18.75C5.22214 18.5926 5.59262 18.2221 5.75 17.75C5.83008 17.5097 6.16992 17.5097 6.25 17.75C6.40738 18.2221 6.77786 18.5926 7.25 18.75C7.49025 18.8301 7.49025 19.1699 7.25 19.25Z" stroke="url(#rainbow-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Tanya AI</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 4. Disimpan */}
        <button
          onClick={() => router.push('/saved')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" d="M4.8824 12.9557L10.5021 19.3071C11.2981 20.2067 12.7019 20.2067 13.4979 19.3071L19.1176 12.9557C20.7905 11.0649 21.6596 8.6871 20.4027 6.41967C18.9505 3.79992 16.2895 3.26448 13.9771 5.02375C13.182 5.62861 12.5294 6.31934 12.2107 6.67771C12.1 6.80224 11.9 6.80224 11.7893 6.67771C11.4706 6.31934 10.818 5.62861 10.0229 5.02375C7.71053 3.26448 5.04945 3.79992 3.59728 6.41967C2.3404 8.6871 3.20947 11.0649 4.8824 12.9557Z" fill="currentColor"></path> 
              <path d="M4.8824 12.9557L10.5021 19.3071C11.2981 20.2067 12.7019 20.2067 13.4979 19.3071L19.1176 12.9557C20.7905 11.0649 21.6596 8.6871 20.4027 6.41967C18.9505 3.79992 16.2895 3.26448 13.9771 5.02375C13.182 5.62861 12.5294 6.31934 12.2107 6.67771C12.1 6.80224 11.9 6.80224 11.7893 6.67771C11.4706 6.31934 10.818 5.62861 10.0229 5.02375C7.71053 3.26448 5.04945 3.79992 3.59728 6.41967C2.3404 8.6871 3.20947 11.0649 4.8824 12.9557Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Tersimpan</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 5. Profil */}
        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5.5 h-5.5"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier"> 
              <path opacity="0.1" fillRule="evenodd" clipRule="evenodd" d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 16.3106 20.4627 18.6515 18.5549 19.8557L18.2395 18.878C17.9043 17.6699 17.2931 16.8681 16.262 16.3834C15.2532 15.9092 13.8644 15.75 12 15.75C10.134 15.75 8.74481 15.922 7.73554 16.4097C6.70593 16.9073 6.09582 17.7207 5.7608 18.927L5.45019 19.8589C3.53829 18.6556 3 16.3144 3 12ZM8.75 10C8.75 8.20507 10.2051 6.75 12 6.75C13.7949 6.75 15.25 8.20507 15.25 10C15.25 11.7949 13.7949 13.25 12 13.25C10.2051 13.25 8.75 11.7949 8.75 10Z" fill="currentColor"></path> 
              <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="currentColor" strokeWidth="2"></path> 
              <path d="M15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10Z" stroke="currentColor" strokeWidth="2"></path> 
              <path d="M6 19C6.63819 16.6928 8.27998 16 12 16C15.72 16 17.3618 16.6425 18 18.9497" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path> 
            </g>
          </svg>
          <span className="text-[11px] font-semibold mt-1 leading-none">Akun</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
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
