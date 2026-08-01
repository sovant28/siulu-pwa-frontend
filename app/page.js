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
  LayoutGrid,
  ChevronUp,
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
  const [currentPosterSlide, setCurrentPosterSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({ temp: "22°C", text: "Cerah Berawan", type: "cloud-sun" });
  const carouselRef = useRef(null);
  const posterCarouselRef = useRef(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);
  const playerRef = useRef(null);

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

  const handlePosterScroll = (e) => {
    const container = e.target;
    const scrollPosition = container.scrollLeft;
    const containerWidth = container.clientWidth;
    if (containerWidth > 0) {
      const itemWidth = containerWidth * 0.85;
      const activeIndex = Math.round(scrollPosition / (itemWidth + 16));
      setCurrentPosterSlide(activeIndex);
    }
  };

  const handlePosterDotClick = (index) => {
    if (posterCarouselRef.current) {
      const containerWidth = posterCarouselRef.current.clientWidth;
      const itemWidth = containerWidth * 0.85;
      posterCarouselRef.current.scrollTo({
        left: index * (itemWidth + 16),
        behavior: 'smooth'
      });
      setCurrentPosterSlide(index);
    }
  };


  const travelSlides = [
    {
      image: "/poster_buntu_burake.png",
      alt: "Poster Buntu Burake",
      onClick: () => {
        const promptMessage = "Tips spot foto dan waktu berkunjung terbaik di Buntu Burake";
        if (user) {
          router.push(`/chat?q=${encodeURIComponent(promptMessage)}`);
        } else {
          localStorage.setItem('pending_ai_query', promptMessage);
          router.push('/register');
        }
      }
    },
    {
      image: "/poster_lemo.png",
      alt: "Poster Makam Pahat Lemo",
      onClick: () => {
        router.push('/saved');
      }
    },
    {
      image: "/poster_buntu_burake.png",
      alt: "Poster Buntu Burake",
      onClick: () => {
        const promptMessage = "Tips spot foto dan waktu berkunjung terbaik di Buntu Burake";
        if (user) {
          router.push(`/chat?q=${encodeURIComponent(promptMessage)}`);
        } else {
          localStorage.setItem('pending_ai_query', promptMessage);
          router.push('/register');
        }
      }
    }
  ];

  const handlePlayVideo = () => {
    setPlayVideo(true);
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const initPlayer = () => {
      try {
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: 'uMYcKFbvORU',
          playerVars: {
            autoplay: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1
          }
        });
      } catch (err) {
        console.error('Error initializing YouTube Player:', err);
      }
    };

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    }

    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

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
    <div className="flex flex-col w-full min-h-[100dvh] bg-[#F1F5F9] font-sans pt-[calc(env(safe-area-inset-top)+76px)] pb-[calc(env(safe-area-inset-bottom)+84px)] relative overflow-x-hidden z-0">

      {/* HEADER BAR (Horizontal & Native-like) */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto flex px-5 pt-[calc(env(safe-area-inset-top)+14px)] pb-3.5 z-40 items-center justify-between bg-[#F1F5F9]/80 backdrop-blur-md border-b border-slate-200/40">
        {/* Left Side: Greetings & Location Pin */}
        <div className="flex flex-col text-left">
          <h1 className="text-[19px] font-black text-slate-800 tracking-tight leading-tight select-none">
            {greeting.charAt(0).toUpperCase() + greeting.slice(1)}{user ? `, ${username}` : ','}
          </h1>
          <div className="flex items-center text-slate-700 mt-1 select-none">
            <MapPin className="w-3.5 h-3.5 text-slate-700 mr-1 flex-shrink-0" />
            <span className="text-[11px] font-bold tracking-wide">Makale, Tana Toraja</span>
          </div>
        </div>

        {/* Right Side: Notification & Profile Button */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <button
            onClick={() => { }}
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
          <Search className="w-4.5 h-4.5 text-slate-700 mr-2.5 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-700">Cari destinasi pariwisata Tana Toraja...</span>
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
            <>
              <div className="w-[88%] h-48 rounded-3xl bg-slate-200/80 animate-pulse flex-shrink-0" />
              <div className="w-[88%] h-48 rounded-3xl bg-slate-200/40 animate-pulse flex-shrink-0" />
            </>
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
            className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all duration-150 select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="relative w-[28px] h-[28px]">
              <Image src="/icon_wisata_black_custom.png" alt="Destinasi" fill className="object-contain" unoptimized />
            </div>
            <span className="text-[13px] font-bold text-slate-700 tracking-wide">Destinasi</span>
          </div>

          {/* Card 2: Event */}
          <div
            onClick={() => router.push('/event')}
            className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all duration-150 select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="relative w-[28px] h-[28px]">
              <Image src="/icon_event_black_custom.png" alt="Event" fill className="object-contain" unoptimized />
            </div>
            <span className="text-[13px] font-bold text-slate-700 tracking-wide">Event</span>
          </div>

          {/* Card 3: Kuliner */}
          <div
            onClick={() => router.push('/kuliner')}
            className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all duration-150 select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="relative w-[28px] h-[28px]">
              <Image src="/icon_kuliner_black_custom.png" alt="Kuliner" fill className="object-contain" unoptimized />
            </div>
            <span className="text-[13px] font-bold text-slate-700 tracking-wide">Kuliner</span>
          </div>

          {/* Card 4: Hotel */}
          <div
            onClick={() => router.push('/hotel')}
            className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all duration-150 select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="relative w-[28px] h-[28px]">
              <Image src="/icon_hotel_black_custom.png" alt="Hotel" fill className="object-contain" unoptimized />
            </div>
            <span className="text-[13px] font-bold text-slate-700 tracking-wide">Akomodasi</span>
          </div>

          {/* Card 5: Tiket */}
          <div
            className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 opacity-65 saturate-75 cursor-default select-none"
          >
            <span className="absolute top-2 right-2 bg-slate-100 text-slate-600 text-[9.5px] font-black px-2 py-0.5 rounded-full leading-none select-none pointer-events-none tracking-wide">Soon</span>
            <div className="relative w-[28px] h-[28px]">
              <Image src="/icon_tiket_custom.png" alt="Tiket" fill className="object-contain grayscale" unoptimized />
            </div>
            <span className="text-[13px] font-bold text-slate-400 tracking-wide">Tiket</span>
          </div>

          {/* Card 6: Lainnya */}
          <div
            onClick={() => setShowAllCategories(true)}
            className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all duration-150 select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <LayoutGrid className="w-6 h-6 text-slate-700" />
            <span className="text-[13px] font-bold text-slate-700 tracking-wide">Lainnya</span>
          </div>
        </div>
      </section>

      {/* WEATHER WIDGET SECTION */}
      <section className="px-5 mt-4">
        <div className="w-full h-[82px] bg-white border border-slate-200/60 rounded-2xl p-4 flex items-center justify-start gap-3.5 select-none">
          {/* Weather Status and Icon */}
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 flex-shrink-0">
            {renderWeatherIcon(weather.type)}
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-600 tracking-wider">Cuaca Makale</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[17px] font-black text-slate-800 leading-none">{weather.temp}</span>
              <span className="text-[12px] font-bold text-slate-600 leading-none">{weather.text}</span>
            </div>
          </div>
        </div>
      </section>

      {/* YOUTUBE VIDEO HOOK */}
      <section className="px-5 mt-6 ">
        <h3 className="text-base font-semibold text-slate-800">Pesona Tana Toraja</h3>
        <p className="text-xs font-normal text-slate-700 mt-0.5 mb-3 leading-relaxed">

        </p>
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-slate-100 bg-slate-100">
          <div className="absolute inset-0 w-full h-full" style={{ display: playVideo ? 'block' : 'none' }}>
            <div id="youtube-player" className="w-full h-full" />
          </div>
          {!playVideo && (
            <div
              onClick={handlePlayVideo}
              className="absolute inset-0 w-full h-full cursor-pointer group select-none z-10"
            >
              <Image
                src="/youtube_banner_custom.png"
                alt="Pesona Tana Toraja"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="w-[54px] h-[54px] rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-all duration-300 scale-95 group-hover:scale-100">
                  <svg className="w-5 h-5 text-slate-800 ml-1 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* INSPIRASI PERJALANAN CAROUSEL SECTION */}
      <section className="px-5 mt-6 mb-5">
        <h3 className="text-base font-semibold text-slate-800">Inspirasi Perjalanan</h3>
        <p className="text-xs font-normal text-slate-500 mt-0.5 mb-3 leading-relaxed">

        </p>

        {/* Carousel Container */}
        <div
          ref={posterCarouselRef}
          onScroll={handlePosterScroll}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {travelSlides.map((slide, idx) => (
            <div
              key={idx}
              onClick={slide.onClick}
              className="w-[85%] flex-shrink-0 snap-align-start aspect-[2/1] rounded-2xl overflow-hidden border border-slate-200/80 bg-white relative cursor-pointer active:scale-[0.98] transition-all select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>


      </section>

      {/* BOTTOM NAVIGATION */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+6px)] flex justify-between items-center z-50 rounded-t-3xl select-none"
      >
        {/* 1. Beranda (Active) */}
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-900 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="relative w-5.5 h-5.5">
            <Image src="/icon_home_active.png" alt="Beranda" fill className="object-contain" unoptimized />
          </div>
          <span className="text-[11px] font-semibold mt-1 leading-none">Beranda</span>
          <div className="h-1 w-1 rounded-full bg-slate-900 mt-1" />
        </button>

        {/* 2. Jelajah */}
        <button
          onClick={() => router.push('/destinasi')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="relative w-5.5 h-5.5">
            <Image src="/icon_jelajah_inactive.png" alt="Jelajah" fill className="object-contain" unoptimized />
          </div>
          <span className="text-[11px] font-semibold mt-1 leading-none">Jelajah</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 3. Tanya AI */}
        <button
          onClick={() => router.push('/chat')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="relative w-5.5 h-5.5">
            <Image src="/icon_chat_inactive.png" alt="Tanya AI" fill className="object-contain" unoptimized />
          </div>
          <span className="text-[11px] font-semibold mt-1 leading-none">Tanya AI</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 4. Disimpan */}
        <button
          onClick={() => router.push('/saved')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="relative w-5.5 h-5.5">
            <Image src="/icon_saved_inactive.png" alt="Tersimpan" fill className="object-contain" unoptimized />
          </div>
          <span className="text-[11px] font-semibold mt-1 leading-none">Tersimpan</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>

        {/* 5. Profil */}
        <button
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-400 hover:text-slate-500 active:scale-90 transition cursor-pointer"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="relative w-5.5 h-5.5">
            <Image src="/icon_profile_inactive.png" alt="Akun" fill className="object-contain" unoptimized />
          </div>
          <span className="text-[11px] font-semibold mt-1 leading-none">Akun</span>
          <div className="h-1 w-1 rounded-full bg-transparent mt-1" />
        </button>
      </nav>

      {/* Bottom Sheet Backdrop Overlay */}
      <div
        onClick={() => setShowAllCategories(false)}
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${
          showAllCategories ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Bottom Sheet Container (Slide up from bottom) */}
      <div
        className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#F1F5F9] rounded-t-[28px] z-[70] px-5 pb-8 pt-2 transition-transform duration-300 ease-out border-t border-slate-200/40 ${
          showAllCategories ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Grab Handle */}
        <div 
          onClick={() => setShowAllCategories(false)}
          className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3 cursor-pointer active:scale-90 transition-transform" 
        />

        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 select-none">
          <span className="text-sm font-black text-slate-800 tracking-wide">Semua Kategori</span>
          <button
            onClick={() => setShowAllCategories(false)}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            Tutup
          </button>
        </div>

        {/* Content (3-Column Grid) */}
        <div className="overflow-y-auto max-h-[60vh] pt-4 select-none">
          <div className="grid grid-cols-3 gap-[5px]">
            {/* Destinasi */}
            <div
              onClick={() => { setShowAllCategories(false); router.push('/destinasi'); }}
              className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all"
            >
              <div className="relative w-[28px] h-[28px]">
                <Image src="/icon_wisata_black_custom.png" alt="Destinasi" fill className="object-contain" unoptimized />
              </div>
              <span className="text-[13px] font-bold text-slate-700 tracking-wide">Destinasi</span>
            </div>

            {/* Event */}
            <div
              onClick={() => { setShowAllCategories(false); router.push('/event'); }}
              className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all"
            >
              <div className="relative w-[28px] h-[28px]">
                <Image src="/icon_event_black_custom.png" alt="Event" fill className="object-contain" unoptimized />
              </div>
              <span className="text-[13px] font-bold text-slate-700 tracking-wide">Event</span>
            </div>

            {/* Kuliner */}
            <div
              onClick={() => { setShowAllCategories(false); router.push('/kuliner'); }}
              className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all"
            >
              <div className="relative w-[28px] h-[28px]">
                <Image src="/icon_kuliner_black_custom.png" alt="Kuliner" fill className="object-contain" unoptimized />
              </div>
              <span className="text-[13px] font-bold text-slate-700 tracking-wide">Kuliner</span>
            </div>

            {/* Hotel */}
            <div
              onClick={() => { setShowAllCategories(false); router.push('/hotel'); }}
              className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 cursor-pointer active:scale-95 transition-all"
            >
              <div className="relative w-[28px] h-[28px]">
                <Image src="/icon_hotel_black_custom.png" alt="Hotel" fill className="object-contain" unoptimized />
              </div>
              <span className="text-[12px] font-bold text-slate-700 tracking-wide">Akomodasi</span>
            </div>

            {/* Tiket */}
            <div
              className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 opacity-65 saturate-75 cursor-default select-none"
            >
              <span className="absolute top-2 right-2 bg-slate-100 text-slate-600 text-[9.5px] font-black px-2 py-0.5 rounded-full leading-none select-none pointer-events-none tracking-wide">Soon</span>
              <div className="relative w-[28px] h-[28px]">
                <Image src="/icon_tiket_custom.png" alt="Tiket" fill className="object-contain grayscale" unoptimized />
              </div>
              <span className="text-[13px] font-bold text-slate-400 tracking-wide">Tiket</span>
            </div>

            {/* Oleh-oleh */}
            <div
              className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 opacity-65 saturate-75 cursor-default select-none"
            >
              <span className="absolute top-2 right-2 bg-slate-100 text-slate-600 text-[9.5px] font-black px-2 py-0.5 rounded-full leading-none select-none pointer-events-none tracking-wide">Soon</span>
              <div className="relative w-[28px] h-[28px]">
                <Image src="/icon_oleh_oleh_custom.png" alt="Oleh-oleh" fill className="object-contain grayscale" unoptimized />
              </div>
              <span className="text-[13px] font-bold text-slate-400 tracking-wide">Oleh-oleh</span>
            </div>

            {/* Aduan */}
            <div
              className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 opacity-65 saturate-75 cursor-default select-none"
            >
              <span className="absolute top-2 right-2 bg-slate-100 text-slate-600 text-[9.5px] font-black px-2 py-0.5 rounded-full leading-none select-none pointer-events-none tracking-wide">Soon</span>
              <div className="relative w-[28px] h-[28px]">
                <Image src="/icon_pengaduan_custom.png" alt="Aduan" fill className="object-contain grayscale" unoptimized />
              </div>
              <span className="text-[13px] font-bold text-slate-400 tracking-wide">Aduan</span>
            </div>

            {/* Bantuan */}
            <div
              className="relative w-full h-[82px] p-3 flex flex-col justify-start items-start gap-1.5 rounded-2xl bg-white border border-slate-100 opacity-65 saturate-75 cursor-default select-none"
            >
              <span className="absolute top-2 right-2 bg-slate-100 text-slate-600 text-[9.5px] font-black px-2 py-0.5 rounded-full leading-none select-none pointer-events-none tracking-wide">Soon</span>
              <div className="relative w-[28px] h-[28px]">
                <Image src="/icon_bantuan_custom.png" alt="Bantuan" fill className="object-contain grayscale" unoptimized />
              </div>
              <span className="text-[13px] font-bold text-slate-400 tracking-wide">Bantuan</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
