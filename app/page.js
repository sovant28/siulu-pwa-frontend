"use client";

import { useState, useEffect, useRef } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
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
  Heart,
  CloudFog,
  CloudSun,
  Cloud,
  CloudMoon
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
  const [username, setUsername] = useState("");
  const [greeting, setGreeting] = useState("Selamat pagi");
  const [user, setUser] = useState(null);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({ temp: "22°C", text: "Cerah Berawan", type: "cloud-sun" });
  const carouselRef = useRef(null);

  const renderWeatherIcon = (type) => {
    switch (type) {
      case 'fog':
        return <CloudFog className="w-3.5 h-3.5 text-slate-400" />;
      case 'cloud-sun':
        return <CloudSun className="w-3.5 h-3.5 text-amber-500" />;
      case 'cloud':
        return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
      case 'moon':
        return <CloudMoon className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <CloudSun className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const handleScroll = (e) => {
    const container = e.target;
    const scrollPosition = container.scrollLeft;
    const containerWidth = container.clientWidth;
    if (containerWidth > 0) {
      const itemWidth = containerWidth * 0.88;
      const activeIndex = Math.round(scrollPosition / (itemWidth + 16));
      setCurrentSlide(activeIndex);
    }
  };

  const handleDotClick = (index) => {
    if (carouselRef.current) {
      const containerWidth = carouselRef.current.clientWidth;
      const itemWidth = containerWidth * 0.88;
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
          const containerWidth = carouselRef.current.clientWidth;
          const itemWidth = containerWidth * 0.88;
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
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setUser(session.user);
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0];
        setUsername(name);
      } else {
        setUser(null);
        const storedName = localStorage.getItem('username') || localStorage.getItem('user_name') || localStorage.getItem('name');
        if (storedName) {
          setUsername(storedName);
        } else {
          setUsername("");
        }
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setUser(session.user);
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0];
        setUsername(name);
      } else {
        setUser(null);
        setUsername("");
      }
    });

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

    // Weather simulation based on Tana Toraja climate patterns
    if (hrs >= 5 && hrs < 10) {
      setWeather({ temp: "20°C", text: "Berkabut", type: "fog" });
    } else if (hrs >= 10 && hrs < 15) {
      setWeather({ temp: "26°C", text: "Cerah Berawan", type: "cloud-sun" });
    } else if (hrs >= 15 && hrs < 18) {
      setWeather({ temp: "23°C", text: "Berawan", type: "cloud" });
    } else {
      setWeather({ temp: "19°C", text: "Cerah/Dingin", type: "moon" });
    }

    return () => {
      subscription?.unsubscribe();
    };
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
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F6F7F9] font-sans pb-[calc(env(safe-area-inset-bottom)+68px)] relative overflow-x-hidden z-0">

      {/* Header Background Illustration with Smooth Fade */}
      <div 
        className="absolute top-0 left-0 right-0 -z-10 pointer-events-none overflow-hidden select-none"
        style={{ height: 'calc(env(safe-area-inset-top) + 224px)' }}
      >
        <div 
          className="relative w-full h-[224px]" 
          style={{ marginTop: 'env(safe-area-inset-top)' }}
        >
          <Image
            src="/header.png"
            alt="Header Background Decoration"
            fill
            className="object-cover object-center opacity-20"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F6F7F9]" />
        </div>
      </div>

      {/* HEADER BAR (Horizontal & Native-like) */}
      <header className="w-full flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-2 relative z-10 space-y-3.5">
        {/* Row 1: Logo & Weather Widget */}
        <div className="flex items-center justify-between w-full">
          <span className="text-xl font-black text-[#BE1641] tracking-tight select-none">siulu</span>
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200/80 rounded-full px-3 py-1.5 text-[10px] font-black text-slate-600 select-none">
            {renderWeatherIcon(weather.type)}
            <span>{weather.temp} • {weather.text}</span>
          </div>
        </div>

        {/* Row 2: Avatar & Greeting/Name (Clickable to profile/login) */}
        <div
          onClick={() => router.push(user ? '/profile' : '/login')}
          className="flex items-center space-x-3 cursor-pointer active:scale-[0.98] transition-all"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {user ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200/80 bg-white flex-shrink-0">
              <Image src="/avatar_v2.png" alt="Avatar" fill className="object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
          )}
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-700 tracking-wider leading-none">{greeting}</span>
            {user ? (
              <span className="text-sm font-black text-slate-800 mt-1.5 leading-none">
                {username}
              </span>
            ) : (
              <div className="flex items-center space-x-1.5 mt-1.5 leading-none">
                <span className="text-sm font-black text-slate-800 leading-none">Guest</span>
                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                <span className="text-[10px] font-bold text-[#4C1D95] hover:underline leading-none">Masuk / Daftar</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PROMINENT SEARCH BAR (Native-like) */}
      <div className="px-5 mt-3">
        <div
          onClick={() => router.push('/destinasi')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && router.push('/destinasi')}
          className="w-full flex items-center bg-white border border-slate-100 rounded-2xl px-4.5 py-3 active:scale-[0.99] transition cursor-pointer select-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Search className="w-4 h-4 text-slate-700 mr-2.5 flex-shrink-0" />
          <span className="text-sm font-semibold text-slate-700">Cari destinasi pariwisata Tana Toraja...</span>
        </div>
      </div>

      {/* FEATURED CAROUSEL */}
      <section className="mt-6 w-full">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex space-x-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory w-full px-5 scroll-pl-5 scroll-pr-5"
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
                className={`relative ${featuredEvents.length === 1 ? 'w-full' : 'w-[88%]'} h-48 rounded-3xl overflow-hidden flex-shrink-0 snap-start group cursor-pointer active:scale-[0.98] transition-transform border border-slate-200/50`}
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
                  <span className="text-[9px] font-black text-rose-400 tracking-widest leading-none mb-1">Featured Event</span>
                  <h4 className="text-base font-black text-white leading-snug line-clamp-1">{event.nama_tempat}</h4>
                  {formatEventDate(event.jam_operasional) && (
                    <p className="text-[11px] text-white/85 font-semibold mt-0.5">{formatEventDate(event.jam_operasional)}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="w-full h-48 rounded-3xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center p-6 text-center select-none">
              <p className="text-xs text-slate-700 font-medium">Belum ada event/destinasi bergambar yang diunggah dari CMS.</p>
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
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? 'bg-[#7C3AED] w-4' : 'bg-slate-300 w-1.5'
                  }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
            ))}
          </div>
        )}
      </section>


      <section className="px-5 mt-8">
        <h3 className="text-base font-semibold text-slate-800">Kategori Populer</h3>
        <div className="grid grid-cols-4 gap-y-4 gap-x-3 mt-4">
          {/* Card 1: Events */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              onClick={() => router.push('/event')}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#DCD2FF] border border-[#DCD2FF] active:scale-90 transition-all duration-150 cursor-pointer select-none outline-none overflow-hidden"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Image src="/icon_event.png?v=4" alt="Event" width={48} height={48} className="w-full h-full object-contain" />
            </button>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide">Event</span>
          </div>

          {/* Card 2: Destinasi */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              onClick={() => router.push('/destinasi')}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#DCD2FF] border border-[#DCD2FF] active:scale-90 transition-all duration-150 cursor-pointer select-none outline-none overflow-hidden"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Image src="/icon_destinasi.png?v=4" alt="Destinasi" width={48} height={48} className="w-full h-full object-contain" />
            </button>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide">Destinasi</span>
          </div>

          {/* Card 3: Kuliner */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              onClick={() => router.push('/kuliner')}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#DCD2FF] border border-[#DCD2FF] active:scale-90 transition-all duration-150 cursor-pointer select-none outline-none overflow-hidden"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Image src="/icon_kuliner.png?v=3" alt="Kuliner" width={48} height={48} className="w-full h-full object-contain" />
            </button>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide">Kuliner</span>
          </div>

          {/* Card 4: Hotel */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              onClick={() => router.push('/destinasi?filter=akomodasi')}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#DCD2FF] border border-[#DCD2FF] active:scale-90 transition-all duration-150 cursor-pointer select-none outline-none overflow-hidden"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Image src="/icon_hotel.png?v=4" alt="Hotel" width={48} height={48} className="w-full h-full object-contain" />
            </button>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide">Hotel</span>
          </div>

          {/* Card 5: Tiket */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="relative w-12 h-12 opacity-60 saturate-75">
              <span className="absolute -top-1 -right-1 bg-[#4C1D95] text-white text-[6.5px] font-black px-1.5 py-0.5 rounded-full border border-white z-10 leading-none tracking-wider select-none pointer-events-none scale-90">Soon</span>
              <button
                onClick={() => { }}
                className="w-full h-full flex items-center justify-center rounded-xl bg-[#DCD2FF] border border-[#DCD2FF] cursor-default select-none outline-none overflow-hidden"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Image src="/icon_tiket.png?v=4" alt="Tiket" width={48} height={48} className="w-full h-full object-contain" />
              </button>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide select-none">Tiket</span>
          </div>

          {/* Card 6: Oleh-oleh */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="relative w-12 h-12 opacity-60 saturate-75">
              <span className="absolute -top-1 -right-1 bg-[#4C1D95] text-white text-[6.5px] font-black px-1.5 py-0.5 rounded-full border border-white z-10 leading-none tracking-wider select-none pointer-events-none scale-90">Soon</span>
              <button
                onClick={() => { }}
                className="w-full h-full flex items-center justify-center rounded-xl bg-[#DCD2FF] border border-[#DCD2FF] cursor-default select-none outline-none overflow-hidden"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Image src="/icon_oleh_oleh.png?v=4" alt="Oleh-oleh" width={48} height={48} className="w-full h-full object-contain" />
              </button>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide select-none">Oleh-oleh</span>
          </div>

          {/* Card 7: Pengaduan */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="relative w-12 h-12 opacity-60 saturate-75">
              <span className="absolute -top-1 -right-1 bg-[#4C1D95] text-white text-[6.5px] font-black px-1.5 py-0.5 rounded-full border border-white z-10 leading-none tracking-wider select-none pointer-events-none scale-90">Soon</span>
              <button
                onClick={() => { }}
                className="w-full h-full flex items-center justify-center rounded-xl bg-[#DCD2FF] border border-[#DCD2FF] cursor-default select-none outline-none overflow-hidden"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Image src="/icon_pengaduan.png?v=4" alt="Pengaduan" width={48} height={48} className="w-full h-full object-contain" />
              </button>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide select-none">Pengaduan</span>
          </div>

          {/* Card 8: Bantuan */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="relative w-12 h-12 opacity-60 saturate-75">
              <span className="absolute -top-1 -right-1 bg-[#4C1D95] text-white text-[6.5px] font-black px-1.5 py-0.5 rounded-full border border-white z-10 leading-none tracking-wider select-none pointer-events-none scale-90">Soon</span>
              <button
                onClick={() => { }}
                className="w-full h-full flex items-center justify-center rounded-xl bg-[#DCD2FF] border border-[#DCD2FF] cursor-default select-none outline-none overflow-hidden"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Image src="/icon_darurat.png?v=4" alt="Bantuan" width={48} height={48} className="w-full h-full object-contain" />
              </button>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 tracking-wide select-none">Bantuan</span>
          </div>
        </div>
      </section>

      {/* YOUTUBE VIDEO HOOK */}
      <section className="px-5 mt-8 mb-12">
        <h3 className="text-base font-semibold text-slate-800">Pesona Tana Toraja</h3>
        <p className="text-xs font-normal text-slate-700 mt-1 mb-4 leading-relaxed">
          Ikuti perjalanan spiritual Maria menelusuri Tana Toraja.
        </p>
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-slate-100 bg-slate-100">
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

      {/* BOTTOM NAVIGATION */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/85 backdrop-blur-lg border-t border-slate-200/50 px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+6px)] flex justify-between items-center z-50 rounded-t-3xl select-none"
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

        {/* 1. Beranda (Active) */}
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center w-16 py-1 text-[#4C1D95] active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Home className="w-5.5 h-5.5" fill="currentColor" strokeWidth={2} />
          <span className="text-[11px] font-semibold mt-1 leading-none">Beranda</span>
          <div className="h-1 w-1 rounded-full bg-[#4C1D95] mt-1" />
        </button>

        {/* 2. Jelajah */}
        <button
          onClick={() => router.push('/destinasi')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-700 hover:text-slate-800 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Compass className="w-5.5 h-5.5" strokeWidth={2} />
          <span className="text-[11px] font-semibold mt-1 leading-none">Jelajah</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 3. Tanya AI */}
        <button
          onClick={() => router.push('/chat')}
          className="flex flex-col items-center justify-center w-16 py-1 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <MessageSquare className="w-5.5 h-5.5" stroke="url(#rainbow-gradient)" strokeWidth={2} />
          <span className="text-[11px] font-semibold mt-1 leading-none text-slate-700">Tanya AI</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 4. Disimpan */}
        <button
          onClick={() => router.push('/saved')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-700 hover:text-slate-800 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Heart className="w-5.5 h-5.5" strokeWidth={2} />
          <span className="text-[11px] font-semibold mt-1 leading-none">Tersimpan</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 5. Profil */}
        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-700 hover:text-slate-800 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <User className="w-5.5 h-5.5" strokeWidth={2} />
          <span className="text-[11px] font-semibold mt-1 leading-none">Akun</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>
      </nav>

    </div>
  );
}
