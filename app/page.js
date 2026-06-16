"use client";

import { useState, useEffect, useRef } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  MapPin,
  Calendar,
  Hotel,
  Utensils,
  Map,
  Home,
  Compass,
  Bookmark,
  User,
  MessageSquare,
  List,
  Heart
} from 'lucide-react';

function formatEventDate(jam_operasional) {
  if (!jam_operasional) return null;
  const match = jam_operasional.match(/Mulai:\s*([\d-]+)/);
  if (match && match[1]) {
    const date = new Date(match[1]);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    if (!isNaN(date.getTime())) {
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
  }
  return null;
}

export default function AppHome() {
  const router = useRouter();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);
  const [greeting, setGreeting] = useState("Selamat pagi");
  const carouselRef = useRef(null);

  const handleScroll = (e) => {
    const container = e.target;
    const scrollPosition = container.scrollLeft;
    const itemWidth = container.clientWidth;
    if (itemWidth > 0) {
      const activeIndex = Math.round(scrollPosition / (itemWidth + 16));
      setCurrentSlide(activeIndex);
    }
  };

  const handleDotClick = (index) => {
    if (carouselRef.current) {
      const itemWidth = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: index * (itemWidth + 16),
        behavior: 'smooth'
      });
      setCurrentSlide(index);
    }
  };

  useEffect(() => {
    if (loading || featuredEvents.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextIndex = (prev + 1) % featuredEvents.length;
        if (carouselRef.current) {
          const itemWidth = carouselRef.current.clientWidth;
          carouselRef.current.scrollTo({
            left: nextIndex * (itemWidth + 16),
            behavior: 'smooth'
          });
        }
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [loading, featuredEvents.length]);


  useEffect(() => {
    const storedName = localStorage.getItem('username') || localStorage.getItem('user_name') || localStorage.getItem('name');
    if (storedName) {
      setUsername(storedName);
    }

    const hrs = new Date().getHours();
    if (hrs < 11) {
      setGreeting("Selamat pagi");
    } else if (hrs < 15) {
      setGreeting("Selamat siang");
    } else if (hrs < 18) {
      setGreeting("Selamat sore");
    } else {
      setGreeting("Selamat malam");
    }
  }, []);

  useEffect(() => {
    // Fetch data for featured events
    const fetchDestinations = async () => {
      try {
        // Force Vercel rebuild to pick up NEXT_PUBLIC_API_URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : '/api';
        const res = await fetch(`${apiUrl}/knowledge/destinasi`);
        if (res.ok) {
          const data = await res.json();
          // Filter out those that are marked as featured event and have an image_url
          const featured = data.filter(d => d.kategori === 'event' && d.is_featured && d.informasi_biaya && d.informasi_biaya.image_url);
          setFeaturedEvents(featured.slice(0, 3)); // Take top 3

        }
      } catch (err) {
        console.error("Failed to fetch featured data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F6F7F9] font-sans pb-[calc(env(safe-area-inset-bottom)+68px)] relative overflow-x-hidden">

      {/* HEADER BAR (Horizontal & Native-like) */}
      <header className="w-full flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+14px)] pb-2 relative z-10 bg-[#F6F7F9]">
        {/* Left Side: Avatar & Greeting/Name */}
        <div 
          onClick={() => router.push('/profile')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && router.push('/profile')}
          className="flex items-center space-x-2.5 cursor-pointer active:scale-95 transition-transform select-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200/60 bg-white flex-shrink-0">
            <Image src="/avatar_v2.png" alt="Avatar" fill className="object-cover" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">{greeting}</span>
            <span className="text-sm font-black text-slate-700 mt-0.5 leading-none">
              {username || "Guest"}
            </span>
          </div>
        </div>

        {/* Right Side: Location Badge */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-white border border-slate-100/70 rounded-full px-2.5 py-1 text-[10px] font-black text-slate-600 shadow-sm shadow-slate-200/50">
            <MapPin className="w-3 h-3 text-[#BE1641]" />
            <span>Toraja</span>
          </div>
        </div>
      </header>

      {/* PROMINENT SEARCH BAR (Native-like) */}
      <div className="px-6 mt-1">
        <div 
          onClick={() => router.push('/destinasi')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && router.push('/destinasi')}
          className="w-full flex items-center bg-white border border-slate-100 rounded-2xl px-4.5 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.05)] active:scale-[0.99] transition cursor-pointer select-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Search className="w-4 h-4 text-slate-500 mr-2.5 flex-shrink-0" />
          <span className="text-sm font-semibold text-slate-500">Cari destinasi pariwisata Toraja...</span>
        </div>
      </div>

      {/* FEATURED CAROUSEL */}
      <section className="mt-4 px-6">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex space-x-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory w-full"

        >
          {loading ? (
            <div className="w-full h-48 rounded-3xl bg-slate-200 animate-pulse flex-shrink-0"></div>
          ) : featuredEvents.length > 0 ? (
            featuredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => router.push(`/event/${event.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/event/${event.id}`)}
                className="relative w-full h-48 rounded-3xl overflow-hidden flex-shrink-0 snap-start group cursor-pointer active:scale-[0.98] transition-transform shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-slate-100/50"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Image
                  src={event.informasi_biaya.image_url}
                  alt={event.nama_tempat}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                  unoptimized
                />
                {/* Bottom Dark Gradient Overlay with Text details */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-12 pb-5 px-5.5 flex flex-col justify-end text-left">
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">Featured Event</span>
                  <h4 className="text-base font-black text-white leading-snug line-clamp-1 drop-shadow-sm">{event.nama_tempat}</h4>
                  {formatEventDate(event.jam_operasional) && (
                    <p className="text-[11px] text-white/85 font-semibold mt-0.5">{formatEventDate(event.jam_operasional)}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="w-full h-48 rounded-3xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center p-6 text-center w-full">
              <p className="text-xs text-slate-500 font-medium">Belum ada event/destinasi bergambar yang diunggah dari CMS.</p>
            </div>
          )}
        </div>

        {/* Dot Indicators */}
        {!loading && featuredEvents.length > 1 && (
          <div className="flex justify-center items-center space-x-1.5 mt-3 select-none">
            {featuredEvents.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? 'bg-[#BE1641] w-4' : 'bg-slate-300 w-1.5'
                  }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
            ))}
          </div>
        )}
      </section>


      <section className="px-6 mt-6">
        <h3 className="text-xl font-black text-slate-800">Popular Categories</h3>
        <div className="grid grid-cols-4 gap-3 mt-4">
          {/* Card 1: Events */}
          <div
            onClick={() => router.push('/event')}
            role="button"
            tabIndex={0}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="w-full aspect-square flex flex-col items-center justify-center space-y-1 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_14px_rgba(0,0,0,0.05)] hover:border-slate-200/50 active:scale-95 transition-all duration-150 cursor-pointer select-none"
          >
            {/* User Custom SVG (Events) */}
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000" className="w-10 h-10">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M897.9 369.2H205c-33.8 0-61.4-27.6-61.4-61.4s27.6-61.4 61.4-61.4h692.9c33.8 0 61.4 27.6 61.4 61.4s-27.6 61.4-61.4 61.4z" fill="none"></path>
                <path d="M807 171H703.3c-16.6 0-30 13.4-30 30s13.4 30 30 30H807c31.6 0 57.4 24 57.4 53.4v42.3H125.2v-42.3c0-29.5 25.7-53.4 57.4-53.4H293c16.6 0 30-13.4 30-30s-13.4-30-30-30H182.5c-64.7 0-117.4 50.9-117.4 113.4v527.7c0 62.5 52.7 113.4 117.4 113.4H807c64.7 0 117.4-50.9 117.4-113.4V284.5c0-62.6-52.7-113.5-117.4-113.5z m0 694.6H182.5c-31.6 0-57.4-24-57.4-53.4V386.8h739.2v425.4c0.1 29.5-25.7 53.4-57.3 53.4z" fill="#45484C"></path>
                <path d="M447.6 217.1c-12.4-6.1-27-2.8-35.7 7.1-2.2-6.7-4-16.2-4-28.1 0-13 2.2-23 4.6-29.8 9.5 8.1 23.5 9.6 34.9 2.8 14.2-8.5 18.8-27 10.3-41.2-15.5-25.9-35.9-29.7-46.6-29.7-36.6 0-63.1 41.2-63.1 97.8s26.4 98 63 98c20.6 0 39-13.4 50.4-36.7 7.3-14.9 1.1-32.9-13.8-40.2zM635.9 218.5c-12.4-6.1-27-2.8-35.7 7.1-2.2-6.7-4-16.2-4-28.1 0-13 2.2-23 4.6-29.8 9.5 8.1 23.5 9.6 34.9 2.8 14.2-8.5 18.8-27 10.3-41.2-15.5-25.9-35.9-29.7-46.6-29.7-36.6 0-63.1 41.2-63.1 97.8s26.5 97.8 63.1 97.8c20.6 0 39-13.4 50.4-36.7 7.1-14.7 0.9-32.7-13.9-40z" fill="#45484C"></path>
                <path d="M700.2 514.5H200.5c-16.6 0-30 13.4-30 30s13.4 30 30 30h499.7c16.6 0 30-13.4 30-30s-13.5-30-30-30zM668.4 689.8h-74c-16.6 0-30 13.4-30 30s13.4 30 30 30h74c16.6 0 30-13.4 30-30s-13.4-30-30-30zM479.3 689.8H200.5c-16.6 0-30 13.4-30 30s13.4 30 30 30h278.8c16.6 0 30-13.4 30-30s-13.4-30-30-30z" fill="#45484C"></path>
              </g>
            </svg>
            <span className="text-xs font-bold text-slate-800 tracking-wide">Event</span>
          </div>

          {/* Card 2: Destinasi */}
          <div
            onClick={() => router.push('/destinasi')}
            role="button"
            tabIndex={0}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="w-full aspect-square flex flex-col items-center justify-center space-y-1 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_14px_rgba(0,0,0,0.05)] hover:border-slate-200/50 active:scale-95 transition-all duration-150 cursor-pointer select-none"
          >
            {/* User Custom SVG (Destinasi) */}
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000" className="w-10 h-10">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M569.2 616.7m-168.1 0a168.1 168.1 0 1 0 336.2 0 168.1 168.1 0 1 0-336.2 0Z" fill="none"></path>
                <path d="M522.7 765.1c-112.6 0-204.2-91.6-204.2-204.2s91.6-204.2 204.2-204.2c39.3 0 77.5 11.2 110.5 32.4 32 20.6 57.6 49.7 74 84 7.1 15 0.8 32.9-14.2 40-15 7.1-32.9 0.8-40-14.2-11.6-24.3-29.7-44.8-52.3-59.4-23.2-15-50.2-22.9-78-22.9-79.5 0-144.2 64.7-144.2 144.2S443.2 705 522.7 705c19.6 0 38.6-3.8 56.4-11.4 15.2-6.5 32.9 0.6 39.3 15.9 6.5 15.2-0.6 32.9-15.9 39.3-25.2 10.8-52.1 16.3-79.8 16.3z" fill="#45484C"></path>
                <path d="M686.7 659.6c-3.4 0-6.8-0.6-10.1-1.8-15.6-5.6-23.7-22.8-18.1-38.4 3.9-10.8 6.4-22.1 7.6-33.5 1.7-16.5 16.5-28.5 32.9-26.7 16.5 1.7 28.4 16.5 26.7 32.9-1.7 16.2-5.3 32.2-10.8 47.5-4.3 12.3-15.8 20-28.2 20z" fill="#45484C"></path>
                <path d="M801.3 386m-31.3 0a31.3 31.3 0 1 0 62.6 0 31.3 31.3 0 1 0-62.6 0Z" fill="#45484C"></path>
                <path d="M821.1 240.6h-60.8v-0.4c-1.7 0.3-3.5 0.4-5.2 0.4-23.1 0-41.9-24.6-41.9-55 0-3.5 0.3-7 0.7-10.3v-5.9c0-39.6-32.4-72-72-72H386.3c-39.6 0-72 32.4-72 72v8c0.3 2.7 0.5 5.4 0.5 8.2 0 30.4-22.8 55-45.9 55-0.7 0-1.5 0-2.2-0.1v0.1h-12.4v-55.8c0-16.6-13.4-30-30-30s-30 13.4-30 30V241C122 246.5 64.6 307.3 64.6 381v403.2c0 77.2 63.2 140.4 140.4 140.4h616.3c77.2 0 140.4-63.2 140.4-140.4V381c-0.2-77.2-63.4-140.6-140.6-140.4z m80.4 543.5c0 21.3-8.4 41.5-23.7 56.7-15.3 15.3-35.4 23.7-56.7 23.7H204.9c-21.3 0-41.5-8.4-56.7-23.7-15.3-15.3-23.7-35.4-23.7-56.7V381c0-21.3 8.4-41.5 23.7-56.7 15.3-15.3 35.4-23.7 56.7-23.7 0 0 37 0.3 63.9 0s61.8-20 61.8-20c7.2-5.5 13.8-12.1 19.5-19.7 15.8-20.8 24.6-47.5 24.6-75.2 0-3.7-0.2-7.4-0.5-11.1v-5.1c0-6.5 5.5-12 12-12h255.6c6.5 0 12 5.5 12 12v2.3c-0.5 4.6-0.7 9.3-0.7 13.9 0 27.7 8.7 54.5 24.6 75.2 6.6 8.6 14.2 16 22.6 22 0 0 26.7 17.8 60 17.8h60.8c21.3 0 41.5 8.4 56.7 23.7 15.3 15.3 23.7 35.4 23.7 56.7v403z" fill="#45484C"></path>
              </g>
            </svg>
            <span className="text-xs font-bold text-slate-800 tracking-wide">Destinasi</span>
          </div>

          {/* Card 3: Kuliner */}
          <div
            onClick={() => router.push('/destinasi?filter=kuliner')}
            role="button"
            tabIndex={0}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="w-full aspect-square flex flex-col items-center justify-center space-y-1 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_14px_rgba(0,0,0,0.05)] hover:border-slate-200/50 active:scale-95 transition-all duration-150 cursor-pointer select-none"
          >
            {/* User Custom SVG (Kuliner) */}
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000" className="w-10 h-10">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M774.8 327.8c-50.6-4.8-97.3 4.3-131 22.7 15.9 20.3 26.1 52.1 26.1 87.9 0 29.2-6.8 55.7-17.9 75.5 28.3 16.9 64.5 28.8 104.6 32.6 96.7 9.2 179.2-32.4 184.2-92.8s-69.3-116.7-166-125.9z" fill="none"></path>
                <path d="M67.2 494l1 31c2.2 67.7 26.2 133.6 69.6 190.4 41.6 54.5 99.2 99.2 167.9 129.3 15.2 6.7 32.9-0.2 39.5-15.4 6.7-15.2-0.2-32.9-15.4-39.5-59-26-108.9-64.3-144.4-110.8-29-38-47.5-80.7-54.4-125h762.6c-7 44.8-25.8 87.9-55.4 126.3-36.1 46.8-86.8 85.2-146.8 110.9-15.2 6.5-22.2 24.2-15.7 39.4 4.9 11.4 15.9 18.2 27.6 18.2 4 0 8-0.8 11.8-2.4 144.5-62.2 237-185.3 241.3-321.4l1-31H67.2z" fill="#45484C"></path>
                <path d="M591.9 800.1h-159c-35.2 0-64.1 28.8-64.1 64.1s28.8 64.1 64.1 64.1h159c35.2 0 64.1-28.8 64.1-64.1s-28.9-64.1-64.1-64.1z m0 68.1h-159c-2.1 0-4.1-2-4.1-4.1s2-4.1 4.1-4.1h159c2.1 0 4.1 2 4.1 4.1s-2 4.1-4.1 4.1z" fill="#45484C"></path>
                <path d="M498.1 373.5c-9.6-13.5-28.4-16.6-41.9-6.9-13.5 9.6-16.6 28.4-6.9 41.9 10.8 15.1 16.6 33 16.6 51.7 0 16.6 13.4 30 30 30s30-13.4 30-30c0-31.4-9.6-61.4-27.8-86.7zM432.4 321.8c-17.7-7.1-36.3-10.7-55.5-10.7-82.2 0-149 66.8-149 149 0 16.6 13.4 30 30 30s30-13.4 30-30c0-49.1 39.9-89 89-89 11.5 0 22.6 2.1 33.1 6.4 15.4 6.2 32.8-1.3 39-16.7 6.2-15.4-1.2-32.9-16.6-39z" fill="#45484C"></path>
                <path d="M549.4 274.7c-46.7-45.6-107.7-70.8-171.8-70.8-64.1 0-125.1 25.1-171.8 70.8-46.1 45.1-74 106-78.6 171.4-1.2 16.5 11.3 30.9 27.8 32 16.5 1.1 30.9-11.3 32-27.8 3.5-50.8 25.1-97.9 60.7-132.7 35.4-34.6 81.5-53.7 129.9-53.7 48.3 0 94.5 19.1 129.9 53.7 48.3 0 94.5 19.1 129.9 53.7 35.6 34.8 57.1 81.9 60.7 132.7 1.1 15.8 14.3 27.9 29.9 27.9 0.7 0 1.4 0 2.1-0.1 16.5-1.2 29-15.5 27.8-32-4.6-65.4-32.5-126.3-78.6-171.4zM895.1 385.9c-11.5-19.4-27.7-36.6-48.1-51.2l53.9-58.3c11.2-12.2 10.5-31.2-1.7-42.4s-31.2-10.5-42.4 1.7l-65 70.4c-5-1.8-10.1-3.5-15.3-5l82.4-159.2c7.6-14.7 1.9-32.8-12.9-40.4-14.7-7.6-32.8-1.9-40.4 12.9l-91.2 176.3c-5.5-0.3-11.1-0.5-16.7-0.5-21.9 0-43.5 2.4-64.3 7.2-16.1 3.7-26.2 19.8-22.5 36 3.7 16.1 19.8 26.2 36 22.5 16.3-3.8 33.4-5.7 50.7-5.7 43.6 0 84.2 11.8 114.3 33.3 27.1 19.3 42 44 42 69.5 0 16.6 13.4 30 30 30s30-13.4 30-30c0-23.5-6.3-46.1-18.8-67.1z" fill="#45484C"></path>
              </g>
            </svg>
            <span className="text-xs font-bold text-slate-800 tracking-wide">Kuliner</span>
          </div>

          {/* Card 4: Hotel */}
          <div
            onClick={() => router.push('/destinasi?filter=akomodasi')}
            role="button"
            tabIndex={0}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="w-full aspect-square flex flex-col items-center justify-center space-y-1 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_14px_rgba(0,0,0,0.05)] hover:border-slate-200/50 active:scale-95 transition-all duration-150 cursor-pointer select-none"
          >
            {/* User Custom SVG (Hotel) */}
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000" className="w-10 h-10">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M638.4 311.6H464.8c-30.9 0-56.2-25.3-56.2-56.2V248c0-30.9 25.3-56.2 56.2-56.2h173.6c30.9 0 56.2 25.3 56.2 56.2v7.4c0 30.9-25.3 56.2-56.2 56.2z" fill="none"></path>
                <path d="M864.4 237.6H161.6c-51.6 0-93.6 42-93.6 93.6v40.3c0 16.6 13.4 30 30 30s30-13.4 30-30v-40.3c0-18.5 15.1-33.6 33.6-33.6h702.9c18.5 0 33.6 15.1 33.6 33.6v43.3c0 16.6 13.4 30 30 30s30-13.4 30-30v-43.3c-0.1-51.7-42.1-93.6-93.7-93.6zM738.1 466.5c0 16.6 13.4 30 30 30H898v303.2c0 18.5-15.1 33.6-33.6 33.6H161.6c-18.5 0-33.6-15.1-33.6-33.6V496.5h128c16.6 0 30-13.4 30-30s-13.4-30-30-30H68v363.2c0 51.6 42 93.6 93.6 93.6h702.9c51.6 0 93.6-42 93.6-93.6V436.5h-190c-16.5 0-30 13.4-30 30z" fill="#45484C"></path>
                <path d="M604.1 188c4.6 0 8.7 4 8.7 8.7v6.1c0 4.6-4 8.7-8.7 8.7H420.2c-4.6 0-8.7-4-8.7-8.7v-6.1c0-4.6 4-8.7 8.7-8.7h183.9m0-60H420.2c-37.8 0-68.7 30.9-68.7 68.7v6.1c0 37.8 30.9 68.7 68.7 68.7H604c37.8 0 68.7-30.9 68.7-68.7v-6.1c0-37.8-30.9-68.7-68.6-68.7z" fill="#45484C"></path>
                <path d="M512.1 645.2c-33.5 0-74.3-21-95.6-33.6-13.8-8.1-26.9-17-36.9-25.1-12.9-10.4-24.7-22.2-24.7-38.5V441.2h311.9V548c0 16-11.5 27.8-24 38.2-12.7 10.6-31.7 8.9-42.2-3.9-10.6-12.7-8.9-31.7 3.9-42.2 0.9-0.7 1.7-1.4 2.4-2v-36.9H414.8v36.6c7 6 21.2 16.2 39.8 26.5 28 15.4 48.1 20.9 57.5 20.9 2.9 0 8-0.5 16.2-3 15.9-4.7 32.6 4.3 37.3 20.2 4.7 15.9-4.3 32.6-20.2 37.3-12.1 3.6-23.3 5.5-33.3 5.5z" fill="#45484C"></path>
              </g>
            </svg>
            <span className="text-xs font-bold text-slate-800 tracking-wide">Hotel</span>
          </div>

          {/* Card 5: Tiket */}
          <div
            onClick={() => router.push('/destinasi')}
            role="button"
            tabIndex={0}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="w-full aspect-square flex flex-col items-center justify-center space-y-1 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_14px_rgba(0,0,0,0.05)] hover:border-slate-200/50 active:scale-95 transition-all duration-150 cursor-pointer select-none"
          >
            {/* User Custom SVG (Tongkonan) */}
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000" className="w-10 h-10">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M861.9 383.8H218.1c-36.4 0-66.1-29.8-66.1-66.1V288c0-36.4 29.8-66.1 66.1-66.1h643.8c36.4 0 66.1 29.8 66.1 66.1v29.7c0 36.3-29.8 66.1-66.1 66.1z" fill="none"></path>
                <path d="M822.9 129.2H199.8c-77.2 0-140.4 63.2-140.4 140.4v487.2c0 77.2 63.2 140.4 140.4 140.4h623.1c77.2 0 140.4-63.2 140.4-140.4V269.6c0-77.2-63.2-140.4-140.4-140.4z m80.4 177H760.4L864.6 201c5.4 3.3 10.4 7.3 15 11.8 15.3 15.3 23.7 35.4 23.7 56.8v36.6z m-673.3 0l104-117h61.3l-109.1 117H230z m247.4-117h169.2L532 306.2H368.3l109.1-117z m248.8 0h65.6L676 306.2h-60l112.5-114.8-2.3-2.2zM143 212.9c15.3-15.3 35.4-23.7 56.8-23.7h53.9l-104 117h-30.4v-36.5c0.1-21.4 8.5-41.5 23.7-56.8z m736.6 600.7c-15.3 15.3-35.4 23.7-56.8 23.7h-623c-21.3 0-41.5-8.4-56.8-23.7-15.3-15.3-23.7-35.4-23.7-56.8V366.2h783.9v390.6c0.1 21.3-8.3 41.5-23.6 56.8z" fill="#45484C"></path>
                <path d="M400.5 770.6V430.9L534.1 508c14.3 8.3 19.3 26.6 11 41-8.3 14.3-26.6 19.3-41 11l-43.6-25.2v131.8l114.1-65.9-7.5-4.3c-14.3-8.3-19.3-26.6-11-41 8.3-14.3 26.6-19.3 41-11l97.5 56.3-294.1 169.9z" fill="#45484C"></path>
              </g>
            </svg>
            <span className="text-xs font-bold text-slate-800 tracking-wide">Tiket</span>
          </div>

          {/* Card 6: Oleh-oleh */}
          <div
            onClick={() => router.push('/destinasi?filter=kuliner')}
            role="button"
            tabIndex={0}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="w-full aspect-square flex flex-col items-center justify-center space-y-1 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_14px_rgba(0,0,0,0.05)] hover:border-slate-200/50 active:scale-95 transition-all duration-150 cursor-pointer select-none"
          >
            {/* User Custom SVG (Oleh-oleh) */}
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000" className="w-10 h-10">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M687.7 833.8h-76.8c-16.6 0-30-13.4-30-30s13.4-30 30-30h76.8c16.6 0 30 13.4 30 30s-13.4 30-30 30zM480.7 833.8H136.8c-16.6 0-30-13.4-30-30s13.4-30 30-30h343.9c-16.6 0-30 13.4-30 30s-13.4 30-30 30z" fill="#45484C"></path>
                <path d="M880.8 931H207.9c-25.3 0-45.9-20.7-45.9-45.9 0-25.3 20.7-45.9 45.9-45.9h672.9c25.3 0 45.9 20.7 45.9 45.9S906 931 880.8 931z" fill="none"></path>
                <path d="M703 122.7c20.9 0 40.6 8.2 55.5 23.2 14.9 14.9 23.2 34.7 23.2 55.5v2.8l0.3 2.8 57.7 611.8c-0.6 20-8.8 38.7-23.1 53.1-14.9 14.9-34.7 23.2-55.5 23.2H236c-20.9 0-40.6-8.2-55.5-23.2-14.4-14.4-22.6-33.2-23.1-53.2l54.7-612 0.2-2.7v-2.7c0-20.9 8.2-40.6 23.2-55.5 14.9-14.9 34.7-23.2 55.5-23.2h412m0-59.9H291c-76.3 0-138.7 62.4-138.7 138.7l-55 615c0 76.3 62.4 138.7 138.7 138.7h525c76.3 0 138.7-62.4 138.7-138.7l-58-615c0-76.3-62.4-138.7-138.7-138.7z" fill="#45484C"></path>
                <path d="M712.6 228.8c0-24.9-20.1-45-45-45s-45 20.1-45 45c0 13.5 6 25.6 15.4 33.9-0.3 1.6-0.4 3.3-0.4 5v95.9c0 23.5-9.2 45.7-26 62.5-16.8 16.8-39 26-62.5 26h-88.5c-23.5 0-45.7-9.2-62.5-26-16.8-16.8-26-39-26-62.5v-95.9c0-1.7-0.1-3.4-0.4-5 9.4-8.2 15.4-20.4 15.4-33.9 0-24.9-20.1-45-45-45s-45 20.1-45 45c0 13.5 6 25.6 15.4 33.9-0.3 1.6-0.4 3.3-0.4 5v95.9c0 81.9 66.6 148.6 148.6 148.6h88.5c81.9 0 148.6-66.6 148.6-148.6v-95.9c0-1.7-0.1-3.4-0.4-5 9.3-8.3 15.2-20.4 15.2-33.9z" fill="#45484C"></path>
              </g>
            </svg>
            <span className="text-xs font-bold text-slate-800 tracking-wide">Oleh-oleh</span>
          </div>

          {/* Card 7: Transport (labelled Pengaduan) */}
          <div
            onClick={() => router.push('/chat')}
            role="button"
            tabIndex={0}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="w-full aspect-square flex flex-col items-center justify-center space-y-1 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_14px_rgba(0,0,0,0.05)] hover:border-slate-200/50 active:scale-95 transition-all duration-150 cursor-pointer select-none"
          >
            {/* User Custom SVG (Pengaduan) */}
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000" className="w-10 h-10">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M885.8 383.8h-90.4c12.3 15.8 19.7 35.6 19.7 57.1v194c0 51.3-42 93.2-93.2 93.2H494.1c12.1 31 42.2 53.1 77.4 53.1h314.3c45.6 0 83-37.3 83-83V466.8c-0.1-45.7-37.4-83-83-83z" fill="none"></path>
                <path d="M780.7 582.4V286.3c0-74.2-60.7-134.9-134.9-134.9H198.2c-74.2 0-134.9 60.7-134.9 134.9v296.1c0 70.5 54.8 128.7 123.8 134.4 0 0-20 155.4 4.9 155.4s188.4-154.9 188.4-154.9h265.3c74.3 0 135-60.7 135-134.9z m-424.1 74.9l-17.4 16.4c-0.3 0.3-34.5 32.7-73.2 67.1-8.5 7.5-16.2 14.3-23.3 20.5 1.9-20.9 3.9-36.6 3.9-36.8l8-62.3L192 657c-38.5-3.2-68.7-36-68.7-74.6V286.3c0-19.9 7.8-38.6 22.1-52.8 14.2-14.2 33-22.1 52.8-22.1h447.6c19.9 0 38.6 7.8 52.8 22.1 14.2 14.2 22.1 33 22.1 52.8v296.1c0 19.9-7.8 38.6-22.1 52.8-14.2 14.2-33 22.1-52.8 22.1H356.6z" fill="#45484C"></path>
                <path d="M830.3 337.9c-16.2-3.3-32.1 7.1-35.4 23.3-3.3 16.2 7.1 32.1 23.3 35.4 39 8 67.3 42.7 67.3 82.5v177c0 41.6-31.1 77.5-72.3 83.4l-32.7 4.7 7.8 32.1c2 8.1 3.9 16.8 5.8 25.3-17.6-16.4-37.3-35.2-55.2-52.7l-8.7-8.6H562.5c-21.9 0-36.6-1.4-47.2-8.6-13.7-9.3-32.4-5.8-41.7 7.9-9.3 13.7-5.8 32.4 7.9 41.7 25.7 17.5 55.3 19 81 19h143.2c10 9.7 27.3 26.3 45 42.8 16.2 15.1 29.6 27.1 39.8 35.9 20 17 29.3 23.1 41.6 23.1 9.7 0 18.7-4.4 24.8-12.1 10.1-12.9 10.2-29.1 0.5-78.7-1.4-7.2-2.9-14.2-4.3-20.6 54.4-21.1 92.4-74.3 92.4-134.6v-177c0.1-68-48.4-127.4-115.2-141.2z" fill="#45484C"></path>
                <path d="M434.6 602.8c-35.9 0-71-17.1-98.8-48.1-24.6-27.5-39.3-61.6-39.3-91.4v-29.7l29.7-0.3c0.4 0 36.2-0.4 95.4-0.4 16.6 0 30 13.4 30 30s-13.4 30-30 30c-22.3 0-41.2 0.1-56.2 0.1 3.8 7.1 8.8 14.5 15.1 21.6 16 17.9 35.7 28.1 54.1 28.1s38.1-10.3 54.1-28.1c6.5-7.3 11.6-14.9 15.4-22.2-13.7-2.8-24.1-15-24-29.5 0.1-16.5 13.5-29.9 30-29.9h0.1c27.1 0.1 32.5 0.2 33.6 0.3l28.9 1.1v28.9c0 29.8-14.7 63.9-39.3 91.4-27.9 31-62.9 48.1-98.8 48.1z m107.1-109.5z" fill="#45484C"></path>
              </g>
            </svg>
            <span className="text-xs font-bold text-slate-800 tracking-wide">Pengaduan</span>
          </div>

          {/* Card 8: Darurat */}
          <div
            onClick={() => router.push('/destinasi?filter=darurat')}
            role="button"
            tabIndex={0}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="w-full aspect-square flex flex-col items-center justify-center space-y-1 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_14px_rgba(0,0,0,0.05)] hover:border-slate-200/50 active:scale-95 transition-all duration-150 cursor-pointer select-none"
          >
            {/* User Custom SVG (Darurat) */}
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000" className="w-10 h-10">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M699.4 214.1H424.5c-29 0-52.8-23.8-52.8-52.8V151c0-29 23.8-52.8 52.8-52.8h274.9c29 0 52.8 23.8 52.8 52.8v10.3c0 29-23.8 52.8-52.8 52.8z" fill="none"></path>
                <path d="M770.1 128c-16.6 0-30 13.4-30 30s13.4 30 30 30c25.8 0 50.2 10.2 68.7 28.6 18.4 18.4 28.6 42.8 28.6 68.7v446.3h-71.1c-51 0-92.8 41.7-92.8 92.8v75.8h-451c-25.8 0-50.2-10.2-68.7-28.6-18.4-18.4-28.6-42.8-28.6-68.7V285.2c0-25.8 10.2-50.2 28.6-68.7 18.4-18.4 42.8-28.6 68.7-28.6 16.6 0 30-13.4 30-30s-13.4-30-30-30c-86.7 0-157.2 70.5-157.2 157.2v517.6c0 86.7 70.5 157.2 157.2 157.2h517.6c86.7 0 157.2-70.5 157.2-157.2V285.2c0.1-86.7-70.5-157.2-157.2-157.2z m88 743.5c-18.4 18.4-42.8 28.6-68.7 28.6h-32.5l129.7-120.5v23.3c0.1 25.8-10.1 50.2-28.5 68.6z" fill="#45484C"></path>
                <path d="M382.7 191.8H640c34.9 0 63.4-28.5 63.4-63.4S674.9 65 640 65H382.7c-34.9 0-63.4 28.5-63.4 63.4s28.6 63.4 63.4 63.4z m0-66.8H640c1.7 0 3.4 1.6 3.4 3.4 0 1.7-1.6 3.4-3.4 3.4H382.7c-1.7 0-3.4-1.6-3.4-3.4 0-1.7 1.7-3.4 3.4-3.4z" fill="#45484C"></path>
                <path d="M724.1 499.2h-33c-16.6 0-30 13.4-30 30s13.4 30 30 30h33c16.6 0 30-13.4 30-30s-13.4-30-30-30zM595.4 499.2h-53.3v-51c0-16.6-13.4-30-30-30s-30 13.4-30 30v51H319.3c-16.6 0-30 13.4-30 30s13.4 30 30 30h162.8v181.2c0 16.6 13.4 30 30 30s30-13.4 30-30V559.2h53.3c16.6 0 30-13.4 30-30s-13.4-30-30-30zM512.1 384.3c16.6 0 30-13.4 30-30v-26.4c0-16.6-13.4-30-30-30s-30 13.4-30 30v26.4c0 16.6 13.4 30 30 30z" fill="#45484C"></path>
              </g>
            </svg>
            <span className="text-xs font-bold text-slate-800 tracking-wide">Darurat</span>
          </div>
        </div>
      </section>

      {/* YOUTUBE VIDEO HOOK */}
      <section className="px-6 mt-6">
        <h3 className="text-xl font-black text-slate-800 mb-4">Pesona Tana Toraja</h3>
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-slate-100 bg-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
          <iframe
            title="Pesona Tana Toraja Video"
            src="https://www.youtube.com/embed/uMYcKFbvORU"
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </section>

      {/* AI BANNER PROMO */}
      <section className="px-6 mt-6">
        <div
          onClick={() => router.push('/chat')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && router.push('/chat')}
          className="w-full rounded-3xl overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95 transition-all select-none shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-slate-100/50"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Image
            src="/mebali_ai_banner.png"
            alt="Mebali AI Banner"
            width={800}
            height={450}
            className="w-full h-auto object-cover block"
            priority
          />
        </div>
      </section>

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

        {/* 1. Beranda (Active) */}
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center p-2 text-[#BE1641] active:scale-90 transition cursor-pointer relative"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Home className="w-5.5 h-5.5" fill="currentColor" />
          <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[#BE1641]" />
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

        {/* 4. Disimpan */}
        <button
          onClick={() => router.push('/saved')}
          className="flex flex-col items-center justify-center p-2 text-slate-500 hover:text-slate-600 active:scale-90 transition cursor-pointer relative"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Heart className="w-5.5 h-5.5" />
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
