"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchDestinationsData } from './utils/fetchHelper';
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
  CloudMoon,
  Ticket,
  Gift,
  Megaphone,
  HelpCircle,
  LayoutGrid,
  ChevronUp,
  ChevronRight,
  X
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
  const [showAllCategories, setShowAllCategories] = useState(false);

  const renderWeatherIcon = (type) => {
    switch (type) {
      case 'fog':
        return <CloudFog className="w-5.5 h-5.5 text-slate-400" />;
      case 'cloud-sun':
        return <CloudSun className="w-5.5 h-5.5 text-amber-500" />;
      case 'cloud':
        return <Cloud className="w-5.5 h-5.5 text-slate-400" />;
      case 'moon':
        return <CloudMoon className="w-5.5 h-5.5 text-indigo-400" />;
      default:
        return <CloudSun className="w-5.5 h-5.5 text-amber-500" />;
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
        const data = await fetchDestinationsData();
        // Filter out those that are marked as featured event and have an image_url
        const featured = (data || []).filter(d => d && d.kategori === 'event' && d.is_featured && d.informasi_biaya && d.informasi_biaya.image_url);
        setFeaturedEvents(featured.slice(0, 3)); // Take top 3
      } catch (err) {
        console.error("Failed to fetch featured data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  return (
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F8F9FA] font-sans pb-[calc(env(safe-area-inset-bottom)+68px)] relative overflow-x-hidden z-0">

      {/* HEADER BAR (Horizontal & Native-like) */}
      <header className="w-full flex px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-3 relative z-10 items-center justify-between">
        {/* Left Side: Greetings & Location Pin */}
        <div className="flex flex-col text-left">
          <h1 className="text-[19px] font-black text-slate-800 tracking-tight leading-tight select-none">
            {greeting.charAt(0).toUpperCase() + greeting.slice(1)}{user ? `, ${username}` : ','}
          </h1>
          <div className="flex items-center text-slate-500 mt-1 select-none">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 mr-1 flex-shrink-0" />
            <span className="text-[11px] font-bold tracking-wide">Makale, Tana Toraja</span>
          </div>
        </div>

        {/* Right Side: Notification & Profile Button */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <button
            onClick={() => {}}
            className="w-10 h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 active:scale-95 transition-all outline-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Bell className="w-5 h-5" />
          </button>
          
          <div
            onClick={() => router.push(user ? '/profile' : '/login')}
            className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200/80 bg-white flex items-center justify-center text-slate-700 cursor-pointer active:scale-95 transition-all"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {user ? (
              <Image src="/avatar_v2.png" alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <User className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </header>

      {/* PROMINENT SEARCH BAR (Native-like) */}
      <div className="px-5 mt-1">
        <div
          onClick={() => router.push('/destinasi')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && router.push('/destinasi')}
          className="w-full flex items-center bg-white border border-slate-100 rounded-full px-4.5 py-3 active:scale-[0.99] transition cursor-pointer select-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Search className="w-4.5 h-4.5 text-slate-400 mr-2.5 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-400">Cari destinasi pariwisata Tana Toraja...</span>
        </div>
      </div>

      {/* FEATURED CAROUSEL */}
      <section className="mt-4.5 w-full">
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
          <div className="flex justify-center items-center space-x-1.5 mt-2.5 select-none">
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

      <section className="px-5 mt-4.5">
        <div className="grid grid-cols-3 gap-[5px]">
          {/* Card 1: Wisata */}
          <div 
            onClick={() => router.push('/destinasi')}
            className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all duration-150 select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="relative w-[26px] h-[26px]">
              <Image src="/icon_wisata_custom.png" alt="Wisata" fill className="object-contain" unoptimized />
            </div>
            <span className="text-[13px] font-bold text-slate-700 tracking-wide">Wisata</span>
          </div>

          {/* Card 2: Event */}
          <div 
            onClick={() => router.push('/event')}
            className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all duration-150 select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Calendar className="w-6.5 h-6.5 text-rose-500" />
            <span className="text-[13px] font-bold text-slate-700 tracking-wide">Event</span>
          </div>

          {/* Card 3: Kuliner */}
          <div 
            onClick={() => router.push('/kuliner')}
            className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all duration-150 select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Utensils className="w-6.5 h-6.5 text-emerald-500" />
            <span className="text-[13px] font-bold text-slate-700 tracking-wide">Kuliner</span>
          </div>

          {/* Card 4: Hotel */}
          <div 
            onClick={() => router.push('/hotel')}
            className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all duration-150 select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Hotel className="w-6.5 h-6.5 text-amber-500" />
            <span className="text-[13px] font-bold text-slate-700 tracking-wide">Hotel</span>
          </div>

          {/* Card 5: Tiket */}
          <div 
            className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 opacity-65 saturate-75 cursor-default select-none"
          >
            <span className="absolute top-2 right-2 bg-slate-100 text-slate-600 text-[9.5px] font-black px-2 py-0.5 rounded-full leading-none select-none pointer-events-none tracking-wide">Soon</span>
            <Ticket className="w-6.5 h-6.5 text-slate-400" />
            <span className="text-[13px] font-bold text-slate-400 tracking-wide">Tiket</span>
          </div>

          {/* Card 6: Lainnya */}
          <div 
            onClick={() => setShowAllCategories(true)}
            className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all duration-150 select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <LayoutGrid className="w-6.5 h-6.5 text-slate-500" />
            <span className="text-[13px] font-bold text-slate-700 tracking-wide">Lainnya</span>
          </div>
        </div>
      </section>

      {/* YOUTUBE VIDEO HOOK */}
      <section className="px-5 mt-6 mb-8">
        <h3 className="text-base font-semibold text-slate-800">Pesona Tana Toraja</h3>
        <p className="text-xs font-normal text-slate-700 mt-0.5 mb-3 leading-relaxed">
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

        {/* 1. Beranda (Active) */}
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-900 active:scale-90 transition cursor-pointer"
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
          <div className="h-1 w-1 rounded-full bg-slate-900 mt-1" />
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
              <path d="M21 12.1818L16.9354 13.6599C16.3462 13.8741 15.8916 14.3521 15.7073 14.9513L14.1538 20C14.1072 20.1515 13.8928 20.1515 13.8461 20L12.2927 14.9513C12.1083 14.3521 11.6537 13.8741 11.0646 13.6599L6.99999 12.1818C6.83019 12.1201 6.83019 11.8799 6.99999 11.8182L11.0646 10.3401C11.6537 10.1259 12.1083 9.64786 12.2927 9.04872L13.8461 4C13.8928 3.8485 14.1072 3.8485 14.1538 4L15.7073 9.04872C15.8916 9.64786 16.3462 10.1259 16.9354 10.3401L21 11.8182C21.1698 11.8799 21.1698 12.1201 21 12.1818Z" stroke="url(#rainbow-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> 
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

      {/* Drawer Backdrop Overlay */}
      {showAllCategories && (
        <div 
          onClick={() => setShowAllCategories(false)}
          className="fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ease-in-out"
        />
      )}

      {/* Drawer Container (Slide-in from right) */}
      <div 
        className={`fixed inset-y-0 right-0 z-[70] w-[80%] max-w-sm bg-[#F8F9FA] border-l border-slate-200/80 p-5 flex flex-col justify-start transition-transform duration-300 ease-in-out ${
          showAllCategories ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 select-none">
          <span className="text-sm font-black text-slate-800 tracking-wide">Semua Kategori</span>
          <button 
            onClick={() => setShowAllCategories(false)}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content (Scrollable Grid) */}
        <div className="flex-1 overflow-y-auto pt-4 pb-12 select-none">
          <div className="grid grid-cols-2 gap-3">
            {/* Wisata */}
            <div 
              onClick={() => { setShowAllCategories(false); router.push('/destinasi'); }}
              className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all"
            >
              <div className="relative w-[26px] h-[26px]">
                <Image src="/icon_wisata_custom.png" alt="Wisata" fill className="object-contain" unoptimized />
              </div>
              <span className="text-[13px] font-bold text-slate-700 tracking-wide">Wisata</span>
            </div>

            {/* Event */}
            <div 
              onClick={() => { setShowAllCategories(false); router.push('/event'); }}
              className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all"
            >
              <Calendar className="w-6.5 h-6.5 text-rose-500" />
              <span className="text-[13px] font-bold text-slate-700 tracking-wide">Event</span>
            </div>

            {/* Kuliner */}
            <div 
              onClick={() => { setShowAllCategories(false); router.push('/kuliner'); }}
              className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all"
            >
              <Utensils className="w-6.5 h-6.5 text-emerald-500" />
              <span className="text-[13px] font-bold text-slate-700 tracking-wide">Kuliner</span>
            </div>

            {/* Hotel */}
            <div 
              onClick={() => { setShowAllCategories(false); router.push('/hotel'); }}
              className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all"
            >
              <Hotel className="w-6.5 h-6.5 text-amber-500" />
              <span className="text-[13px] font-bold text-slate-700 tracking-wide">Hotel</span>
            </div>

            {/* Tiket */}
            <div 
              className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 opacity-65 saturate-75 cursor-default select-none"
            >
              <span className="absolute top-2 right-2 bg-slate-100 text-slate-600 text-[9.5px] font-black px-2 py-0.5 rounded-full leading-none select-none pointer-events-none tracking-wide">Soon</span>
              <Ticket className="w-6.5 h-6.5 text-slate-400" />
              <span className="text-[13px] font-bold text-slate-400 tracking-wide">Tiket</span>
            </div>

            {/* Oleh-oleh */}
            <div 
              className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 opacity-65 saturate-75 cursor-default select-none"
            >
              <span className="absolute top-2 right-2 bg-slate-100 text-slate-600 text-[9.5px] font-black px-2 py-0.5 rounded-full leading-none select-none pointer-events-none tracking-wide">Soon</span>
              <Gift className="w-6.5 h-6.5 text-slate-400" />
              <span className="text-[13px] font-bold text-slate-400 tracking-wide">Oleh-oleh</span>
            </div>

            {/* Aduan */}
            <div 
              className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 opacity-65 saturate-75 cursor-default select-none"
            >
              <span className="absolute top-2 right-2 bg-slate-100 text-slate-600 text-[9.5px] font-black px-2 py-0.5 rounded-full leading-none select-none pointer-events-none tracking-wide">Soon</span>
              <Megaphone className="w-6.5 h-6.5 text-slate-400" />
              <span className="text-[13px] font-bold text-slate-400 tracking-wide">Aduan</span>
            </div>

            {/* Bantuan */}
            <div 
              className="relative w-full h-[92px] p-3 flex flex-col justify-between items-start rounded-2xl bg-white border border-slate-100 opacity-65 saturate-75 cursor-default select-none"
            >
              <span className="absolute top-2 right-2 bg-slate-100 text-slate-600 text-[9.5px] font-black px-2 py-0.5 rounded-full leading-none select-none pointer-events-none tracking-wide">Soon</span>
              <HelpCircle className="w-6.5 h-6.5 text-slate-400" />
              <span className="text-[13px] font-bold text-slate-400 tracking-wide">Bantuan</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
